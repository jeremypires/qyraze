import type { QualificationSignals } from './index.js';

export type MessageIntent =
  | 'buying_imminent'
  | 'price_inquiry'
  | 'booking'
  | 'complaint'
  | 'objection'
  | 'complex_question'
  | 'greeting'
  | 'casual_cold'
  | 'normal';

export interface ReplyDelayInput {
  inboundMessage: string;
  /** Current lead score before this reply (0–100). */
  leadScore?: number;
  /** Prior back-and-forth rounds (each side spoke once = 1). */
  exchangeCount?: number;
  /** Estimated outbound reply length (chars). */
  replyLength?: number;
  /** Local hour 0–23 for the business. */
  localHour?: number;
  businessOpenHour?: number;
  businessCloseHour?: number;
  signals?: QualificationSignals;
}

export interface ReplyDelayResult {
  delayMs: number;
  reason: string;
  intent: MessageIntent;
}

const MIN_HUMAN_MS = 3000;

function randomBetween(minSec: number, maxSec: number): number {
  const minMs = minSec * 1000;
  const maxMs = maxSec * 1000;
  return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
}

function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
}

function detectIntent(message: string, signals?: QualificationSignals): MessageIntent {
  const t = normalize(message);

  if (
    signals?.urgency ||
    /\b(aujourd'hui|today|maintenant|now|reserver|réserver|book|payer|pay|commander|order|commencer|start)\b/.test(t)
  ) {
    return 'buying_imminent';
  }

  if (signals?.wants_call || /\b(rdv|rendez[- ]vous|appel|call|creneau|slot|calendar|agenda)\b/.test(t)) {
    return 'booking';
  }

  if (signals?.budget_confirmed || /\b(prix|price|tarif|cost|combien|how much|devis|quote|budget)\b/.test(t)) {
    return 'price_inquiry';
  }

  if (/\b(pas content|mécontent|refund|rembours|problem|problème|plainte|complaint|arnaque|scam)\b/.test(t)) {
    return 'complaint';
  }

  if (/\b(cher|too expensive|trop|hésit|hesit|pas sûr|not sure|objection)\b/.test(t)) {
    return 'objection';
  }

  if (/\b(pourquoi|why|comment ça marche|how does|explique|explain|détail|detail)\b/.test(t) || t.length > 280) {
    return 'complex_question';
  }

  if (/\b(bonjour|salut|hello|hi|hey|coucou)\b/.test(t) && t.length < 40) {
    return 'greeting';
  }

  if (/\b(regarde|browsing|juste|just looking|peut[- ]être|maybe|plus tard|later|merci|thanks)\b/.test(t)) {
    return 'casual_cold';
  }

  return 'normal';
}

function lengthTierDelayMs(charCount: number): number {
  if (charCount < 15) return randomBetween(20, 60);
  if (charCount < 80) return randomBetween(30, 90);
  if (charCount < 200) return randomBetween(60, 180);
  if (charCount < 500) return randomBetween(180, 480);
  return randomBetween(300, 600);
}

function intentDelayMs(intent: MessageIntent, exchangeCount: number): number {
  if (exchangeCount === 0) {
    return randomBetween(20, 90);
  }

  switch (intent) {
    case 'buying_imminent':
      return randomBetween(15, 45);
    case 'booking':
      return randomBetween(20, 60);
    case 'price_inquiry':
      return randomBetween(30, 90);
    case 'complaint':
      return randomBetween(15, 90);
    case 'objection':
      return randomBetween(60, 180);
    case 'complex_question':
      return randomBetween(120, 300);
    case 'greeting':
      return randomBetween(20, 60);
    case 'casual_cold':
      return randomBetween(120, 300);
    case 'normal':
    default:
      return randomBetween(60, 240);
  }
}

function scoreFactor(score: number): number {
  if (score >= 70) return 0.55;
  if (score >= 40) return 0.85;
  return 1;
}

function isOutsideBusinessHours(
  hour: number,
  openHour = 8,
  closeHour = 20
): boolean {
  return hour < openHour || hour >= closeHour;
}

/** Research-backed human-like reply delay for setter DMs. */
export function computeReplyDelay(input: ReplyDelayInput): ReplyDelayResult {
  const inbound = input.inboundMessage ?? '';
  const score = input.leadScore ?? 0;
  const exchanges = input.exchangeCount ?? 0;
  const replyLen = input.replyLength ?? Math.min(200, Math.max(40, inbound.length));
  const hour = input.localHour ?? new Date().getHours();
  const openHour = input.businessOpenHour ?? 8;
  const closeHour = input.businessCloseHour ?? 20;

  const intent = detectIntent(inbound, input.signals);

  if (isOutsideBusinessHours(hour, openHour, closeHour)) {
    const hoursUntilOpen = hour >= closeHour ? openHour + 24 - hour : openHour - hour;
    const delayMs = hoursUntilOpen * 3600 * 1000 + randomBetween(20, 90);
    return {
      delayMs,
      reason: 'outside_business_hours',
      intent,
    };
  }

  const fromIntent = intentDelayMs(intent, exchanges);
  const fromLength = lengthTierDelayMs(inbound.length);
  const fromReply = lengthTierDelayMs(replyLen) * 0.35;

  let delayMs = Math.round((fromIntent * 0.55 + fromLength * 0.3 + fromReply * 0.15) * scoreFactor(score));

  if (exchanges === 1) {
    delayMs = Math.round(delayMs * 1.1 + randomBetween(40, 180) * 0.3);
  } else if (exchanges >= 2) {
    delayMs = Math.round(delayMs * 1.05);
  }

  delayMs = Math.max(MIN_HUMAN_MS, delayMs);
  delayMs = Math.min(delayMs, 10 * 60 * 1000);

  return {
    delayMs,
    reason: `intent:${intent},score:${score},ex:${exchanges}`,
    intent,
  };
}
