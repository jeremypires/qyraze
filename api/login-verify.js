

import crypto from 'crypto';

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SECRET)
    .update(value)
    .digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challenge, code } = req.body || {};

    if (!process.env.ADMIN_SECRET) {
      return res.status(500).json({ error: 'Configuration admin manquante' });
    }

    if (!challenge || !code || typeof challenge !== 'string') {
      return res.status(400).json({ error: 'Code requis' });
    }

    const [encodedPayload, signature] = challenge.split('.');

    if (!encodedPayload || !signature) {
      return res.status(400).json({ error: 'Session de vérification invalide' });
    }

    const expectedSignature = sign(encodedPayload);

    if (!safeEqual(signature, expectedSignature)) {
      return res.status(401).json({ error: 'Session de vérification invalide' });
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));

    if (!payload.exp || Date.now() > payload.exp) {
      return res.status(401).json({ error: 'Code expiré' });
    }

    const normalizedCode = String(code).trim();

    if (!safeEqual(hash(normalizedCode), payload.codeHash)) {
      return res.status(401).json({ error: 'Code incorrect' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Login verify error:', error);
    return res.status(500).json({ error: 'Erreur vérification code' });
  }
}