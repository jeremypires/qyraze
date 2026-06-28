import { createWorkerSupabase } from '../lib/supabase.js';

interface NotifyHotLeadInput {
  clientId: string;
  leadId: string;
  chatId: string;
  leadName: string;
  score: number;
  summary: string;
}

export async function notifyHotLead(input: NotifyHotLeadInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not configured');

  const text = [
    '🔥 Lead qualifié',
    '',
    `Nom : ${input.leadName}`,
    'Plateforme : Instagram',
    `Score : ${input.score}/100`,
    '',
    `Résumé : ${input.summary}`,
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: input.chatId,
      text,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Telegram API error: ${err}`);
  }

  const supabase = createWorkerSupabase();
  await supabase.from('notifications').insert({
    client_id: input.clientId,
    lead_id: input.leadId,
    type: 'hot_lead',
    channel: 'telegram',
    payload: { score: input.score, summary: input.summary },
  });
}
