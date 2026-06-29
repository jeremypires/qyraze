import {
  MAX_CONVERSATION_HISTORY,
  QUEUE_NAMES,
  SIGNAL_SCORES,
  computeReplyDelay,
  getLocalHour,
  parseReplyDelaySettings,
  type AIResponse,
  type NotifyTelegramJob,
  type ProcessMessageJob,
  type QualificationSignals,
} from '@qyraze/shared';
import { createWorkerSupabase } from '../lib/supabase.js';
import { generateAIResponse } from '../services/ai.js';
import { sendInstagramReply } from '../services/meta.js';
import { notifyHotLead } from '../services/telegram.js';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scoreSignals(signals: QualificationSignals): number {
  return (Object.entries(signals) as Array<[keyof QualificationSignals, boolean | undefined]>)
    .filter(([, value]) => value === true)
    .reduce((total, [key]) => total + (SIGNAL_SCORES[key] ?? 0), 0);
}

export async function handleProcessMessage(job: ProcessMessageJob) {
  const supabase = createWorkerSupabase();

  const { data: client } = await supabase
    .from('clients')
    .select('id, status, qualification_threshold, telegram_chat_id, settings')
    .eq('id', job.clientId)
    .single();

  if (!client || client.status !== 'active') return;

  const { data: prompt } = await supabase
    .from('client_prompts')
    .select('system_prompt')
    .eq('client_id', job.clientId)
    .eq('is_active', true)
    .maybeSingle();

  if (!prompt?.system_prompt) {
    throw new Error(`No active prompt for client ${job.clientId}`);
  }

  const { data: history } = await supabase
    .from('messages')
    .select('direction, role, content')
    .eq('conversation_id', job.conversationId)
    .order('created_at', { ascending: false })
    .limit(MAX_CONVERSATION_HISTORY);

  const { data: lead } = await supabase
    .from('leads')
    .select('id, name, username, score, status, external_user_id, notified_at')
    .eq('id', job.leadId)
    .single();

  if (!lead) return;

  const { data: inboundMessage } = await supabase
    .from('messages')
    .select('created_at')
    .eq('id', job.messageId)
    .single();

  const inboundAt = inboundMessage?.created_at
    ? new Date(inboundMessage.created_at).getTime()
    : Date.now();

  const delaySettings = parseReplyDelaySettings(client.settings);

  const ai: AIResponse = await generateAIResponse({
    systemPrompt: prompt.system_prompt,
    history: (history ?? []).reverse(),
    inbound: job.inboundContent,
    lead,
  });

  const { data: outboundMessage, error: outboundError } = await supabase
    .from('messages')
    .insert({
      client_id: job.clientId,
      conversation_id: job.conversationId,
      lead_id: job.leadId,
      platform: 'instagram',
      direction: 'outbound',
      role: 'setter',
      content: ai.reply,
      ai_model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6',
    })
    .select('id')
    .single();

  if (outboundError || !outboundMessage) throw outboundError;

  const exchangeCount = Math.floor((history ?? []).length / 2);
  const { delayMs } = computeReplyDelay({
    inboundMessage: job.inboundContent,
    leadScore: lead.score ?? 0,
    exchangeCount,
    replyLength: ai.reply.length,
    localHour: getLocalHour(delaySettings.timezone),
    businessOpenHour: delaySettings.businessOpenHour,
    businessCloseHour: delaySettings.businessCloseHour,
    signals: ai.signals,
  });

  const elapsed = Date.now() - inboundAt;
  await sleep(Math.max(0, delayMs - elapsed));

  const delta = scoreSignals(ai.signals);
  const nextScore = Math.min(100, (lead.score ?? 0) + delta);
  const nextStatus = nextScore >= client.qualification_threshold ? 'hot' : 'qualifying';

  await supabase
    .from('leads')
    .update({ score: nextScore, status: nextStatus })
    .eq('id', job.leadId);

  for (const [signal, value] of Object.entries(ai.signals)) {
    if (value !== true) continue;
    await supabase.from('qualification_events').insert({
      client_id: job.clientId,
      lead_id: job.leadId,
      signal,
      value: true,
      source_message_id: outboundMessage.id,
    });
  }

  await sendInstagramReply({
    clientId: job.clientId,
    recipientId: lead.external_user_id,
    text: ai.reply,
  });

  const shouldNotify =
    nextScore >= client.qualification_threshold &&
    !lead.notified_at &&
    client.telegram_chat_id;

  if (shouldNotify) {
    await notifyHotLead({
      clientId: job.clientId,
      leadId: job.leadId,
      chatId: client.telegram_chat_id!,
      leadName: lead.name ?? lead.username ?? 'Prospect',
      score: nextScore,
      summary: ai.reply,
    });

    await supabase
      .from('leads')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', job.leadId);
  }
}

export type { NotifyTelegramJob, ProcessMessageJob };
