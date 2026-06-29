const CALENDLY_URL = 'https://calendar.app.google/Tr3jnHzo7oHt8Ehd7';

const SCENARIO_BASE = `You simulate an Instagram DM setter for a demo on qyraze.com.
Qualify the prospect in 2-4 message exchanges max. Match their language (French or English).
Keep replies short (1-3 sentences), warm, professional.

Decide the next action:
- "notify_owner": score >= 70 OR clear hot lead (budget + urgency + wants call). Reply confirms you'll alert the team. Do NOT share calendar link.
- "send_calendar": score 40-69, interested but not urgent enough for owner alert. Reply warmly and mention booking a slot (calendar card shown separately).
- "close": score < 40 OR not a fit OR prospect says goodbye / not interested. Polite short farewell, no push.
- "continue": still qualifying, need more info.

Return JSON only:
{"reply":"...","score":0-100,"status":"new|qualifying|hot|lost","action":"continue|notify_owner|send_calendar|close","summary":"one line for owner (if notify_owner)","prospect_name":"name or Prospect"}`;

const SCENARIOS = {
  pizza: {
    business: 'Sandjo Pizza',
    system: `${SCENARIO_BASE}\nBusiness: Sandjo Pizza — catering & large orders.`,
  },
  travel: {
    business: 'Jiwa Voyage',
    system: `${SCENARIO_BASE}\nBusiness: Jiwa Voyage — travel guides & custom trips.`,
  },
  local: {
    business: 'Local business',
    system: `${SCENARIO_BASE}\nBusiness: local service company — CRM & client follow-up.`,
  },
};

const ipAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 30;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const recent = (ipAttempts.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    ipAttempts.set(ip, recent);
    return true;
  }
  recent.push(now);
  ipAttempts.set(ip, recent);
  return false;
}

function parseAIJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function resolveAction(score, rawAction) {
  const valid = ['continue', 'notify_owner', 'send_calendar', 'close'];
  if (valid.includes(rawAction)) return rawAction;
  if (score >= 70) return 'notify_owner';
  if (score >= 40) return 'send_calendar';
  if (score < 30) return 'close';
  return 'continue';
}

function resolveStatus(score, action) {
  if (action === 'close') return 'lost';
  if (action === 'notify_owner' || score >= 70) return 'hot';
  if (score >= 30) return 'qualifying';
  return 'new';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Demo chat unavailable' });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Too many messages. Try again in a few minutes.' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const scenario = SCENARIOS[body?.scenario];
  const message = String(body?.message || '').trim().slice(0, 500);
  const history = Array.isArray(body?.history) ? body.history.slice(-8) : [];

  if (!scenario) {
    return res.status(400).json({ error: 'Invalid scenario' });
  }
  if (!message) {
    return res.status(400).json({ error: 'Message required' });
  }

  const historyText = history
    .map((m) => `${m.role === 'assistant' ? 'Business' : 'Prospect'}: ${m.content}`)
    .join('\n');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
        max_tokens: 450,
        system: scenario.system,
        messages: [
          {
            role: 'user',
            content: `Conversation so far:\n${historyText || '(new conversation)'}\n\nNew prospect message:\n${message}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'AI service error' });
    }

    const payload = await response.json();
    const text = payload.content?.find((c) => c.type === 'text')?.text ?? '';
    const parsed = parseAIJson(text);

    if (!parsed?.reply) {
      return res.status(502).json({ error: 'Invalid AI response' });
    }

    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
    const action = resolveAction(score, parsed.action);
    const status = resolveStatus(score, action);

    return res.status(200).json({
      reply: String(parsed.reply).slice(0, 600),
      score,
      status,
      action,
      summary: String(parsed.summary || '').slice(0, 200),
      prospectName: String(parsed.prospect_name || 'Prospect').slice(0, 80),
      business: scenario.business,
      calendarUrl: CALENDLY_URL,
    });
  } catch (error) {
    console.error('demo-chat error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
