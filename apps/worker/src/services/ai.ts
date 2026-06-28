interface GenerateAIInput {
  systemPrompt: string;
  history: Array<{ direction: string; role: string; content: string }>;
  inbound: string;
  lead: { name: string | null; username: string | null; score: number | null };
}

export async function generateAIResponse(input: GenerateAIInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const historyText = input.history
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: `${input.systemPrompt}\n\nReturn JSON only:\n{"reply":"...","signals":{"budget_confirmed":false,"urgency":false,"wants_call":false,"interested":false}}`,
      messages: [
        {
          role: 'user',
          content: `Lead: ${input.lead.name ?? input.lead.username ?? 'unknown'} (score ${input.lead.score ?? 0})\n\nHistory:\n${historyText}\n\nNew message:\n${input.inbound}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error: ${err}`);
  }

  const payload = await response.json() as {
    content?: Array<{ type: string; text?: string }>;
  };

  const text = payload.content?.find((c) => c.type === 'text')?.text ?? '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI response missing JSON payload');

  return JSON.parse(jsonMatch[0]) as {
    reply: string;
    signals: {
      budget_confirmed?: boolean;
      urgency?: boolean;
      wants_call?: boolean;
      interested?: boolean;
    };
  };
}
