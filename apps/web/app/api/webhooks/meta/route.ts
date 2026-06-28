import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseInstagramMessages, verifyMetaSignature } from '@/lib/meta/webhook';
import { enqueueProcessMessage } from '@/lib/queue/enqueue';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get('hub.mode');
  const token = req.nextUrl.searchParams.get('hub.verify_token');
  const challenge = req.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-hub-signature-256');

  if (!verifyMetaSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const events = parseInstagramMessages(body);
  if (events.length === 0) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const supabase = createAdminClient();

  for (const event of events) {
    const { data: connection, error: connError } = await supabase
      .from('meta_connections')
      .select('client_id, clients!inner(status)')
      .eq('page_id', event.pageId)
      .maybeSingle();

    if (connError || !connection) continue;

    const clientId = connection.client_id as string;
    const clientsJoin = connection.clients;
    const clientStatus = Array.isArray(clientsJoin)
      ? clientsJoin[0]?.status
      : (clientsJoin as { status?: string } | null)?.status;
    if (clientStatus !== 'active') continue;

    const { data: existingMessage } = await supabase
      .from('messages')
      .select('id')
      .eq('platform', 'instagram')
      .eq('external_id', event.messageId)
      .maybeSingle();

    if (existingMessage) continue;

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .upsert(
        {
          client_id: clientId,
          platform: 'instagram',
          external_user_id: event.senderId,
          status: 'qualifying',
        },
        { onConflict: 'client_id,platform,external_user_id' }
      )
      .select('id')
      .single();

    if (leadError || !lead) continue;

    let conversationId: string | null = null;

    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('client_id', clientId)
      .eq('lead_id', lead.id)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      const { data: createdConversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          client_id: clientId,
          lead_id: lead.id,
          platform: 'instagram',
          state: 'active',
          last_message_at: new Date(event.timestamp).toISOString(),
          message_count: 0,
        })
        .select('id')
        .single();

      if (convError || !createdConversation) continue;
      conversationId = createdConversation.id;
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        client_id: clientId,
        conversation_id: conversationId,
        lead_id: lead.id,
        platform: 'instagram',
        direction: 'inbound',
        role: 'prospect',
        content: event.text,
        external_id: event.messageId,
      })
      .select('id')
      .single();

    if (messageError || !message || !conversationId) continue;

    const { data: convRow } = await supabase
      .from('conversations')
      .select('message_count')
      .eq('id', conversationId)
      .single();

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date(event.timestamp).toISOString(),
        message_count: (convRow?.message_count ?? 0) + 1,
      })
      .eq('id', conversationId);

    if (process.env.REDIS_URL) {
      await enqueueProcessMessage({
        clientId,
        conversationId,
        leadId: lead.id,
        messageId: message.id,
        inboundContent: event.text,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
