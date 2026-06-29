/** Browser copy of packages/shared/src/reply-delay.ts — keep in sync. */
(function (global) {
  var MIN_HUMAN_MS = 3000;

  function randomBetween(minSec, maxSec) {
    var minMs = minSec * 1000;
    var maxMs = maxSec * 1000;
    return minMs + Math.floor(Math.random() * (maxMs - minMs + 1));
  }

  function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  }

  function detectIntent(message, signals) {
    var t = normalize(message);

    if (
      (signals && signals.urgency) ||
      /\b(aujourd'hui|today|maintenant|now|reserver|réserver|book|payer|pay|commander|order|commencer|start)\b/.test(t)
    ) {
      return 'buying_imminent';
    }
    if (
      (signals && signals.wants_call) ||
      /\b(rdv|rendez[- ]vous|appel|call|creneau|slot|calendar|agenda)\b/.test(t)
    ) {
      return 'booking';
    }
    if (
      (signals && signals.budget_confirmed) ||
      /\b(prix|price|tarif|cost|combien|how much|devis|quote|budget)\b/.test(t)
    ) {
      return 'price_inquiry';
    }
    if (/\b(pas content|mécontent|refund|rembours|problem|problème|plainte|complaint)\b/.test(t)) {
      return 'complaint';
    }
    if (/\b(cher|too expensive|trop|hésit|hesit|pas sûr|not sure)\b/.test(t)) {
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

  function lengthTierDelayMs(charCount) {
    if (charCount < 15) return randomBetween(20, 60);
    if (charCount < 80) return randomBetween(30, 90);
    if (charCount < 200) return randomBetween(60, 180);
    if (charCount < 500) return randomBetween(180, 480);
    return randomBetween(300, 600);
  }

  function intentDelayMs(intent, exchangeCount) {
    if (exchangeCount === 0) return randomBetween(20, 90);
    switch (intent) {
      case 'buying_imminent': return randomBetween(15, 45);
      case 'booking': return randomBetween(20, 60);
      case 'price_inquiry': return randomBetween(30, 90);
      case 'complaint': return randomBetween(15, 90);
      case 'objection': return randomBetween(60, 180);
      case 'complex_question': return randomBetween(120, 300);
      case 'greeting': return randomBetween(20, 60);
      case 'casual_cold': return randomBetween(120, 300);
      default: return randomBetween(60, 240);
    }
  }

  function scoreFactor(score) {
    if (score >= 70) return 0.55;
    if (score >= 40) return 0.85;
    return 1;
  }

  function compute(input) {
    var inbound = input.inboundMessage || '';
    var score = input.leadScore || 0;
    var exchanges = input.exchangeCount || 0;
    var replyLen = input.replyLength || Math.min(200, Math.max(40, inbound.length));
    var intent = detectIntent(inbound, input.signals);
    var fromIntent = intentDelayMs(intent, exchanges);
    var fromLength = lengthTierDelayMs(inbound.length);
    var fromReply = lengthTierDelayMs(replyLen) * 0.35;
    var delayMs = Math.round((fromIntent * 0.55 + fromLength * 0.3 + fromReply * 0.15) * scoreFactor(score));

    if (exchanges === 1) {
      delayMs = Math.round(delayMs * 1.1 + randomBetween(40, 180) * 0.3);
    }

    return {
      delayMs: Math.max(MIN_HUMAN_MS, Math.min(delayMs, 600000)),
      intent: intent,
    };
  }

  global.QyrazeReplyDelay = { compute: compute };
})(typeof window !== 'undefined' ? window : globalThis);
