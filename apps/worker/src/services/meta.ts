import { createWorkerSupabase } from '../lib/supabase.js';

interface SendReplyInput {
  clientId: string;
  recipientId: string;
  text: string;
}

export async function sendInstagramReply({ clientId, recipientId, text }: SendReplyInput) {
  const supabase = createWorkerSupabase();
  const { data: connection } = await supabase
    .from('meta_connections')
    .select('page_id, access_token')
    .eq('client_id', clientId)
    .single();

  if (!connection) throw new Error(`No Meta connection for client ${clientId}`);

  const response = await fetch(
    `https://graph.facebook.com/v21.0/${connection.page_id}/messages`,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${connection.access_token}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Meta Send API error: ${err}`);
  }
}
