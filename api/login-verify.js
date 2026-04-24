import crypto from 'crypto';

const VERIFY_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const VERIFY_RATE_LIMIT_MAX = 10;
const verifyAttempts = new Map();
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

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

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

function isRateLimited(key) {
  const now = Date.now();
  const current = verifyAttempts.get(key) || [];
  const recent = current.filter((t) => now - t < VERIFY_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= VERIFY_RATE_LIMIT_MAX) {
    verifyAttempts.set(key, recent);
    return true;
  }

  recent.push(now);
  verifyAttempts.set(key, recent);
  return false;
}

function createAdminSession(email) {
  const payload = {
    email,
    role: 'admin',
    exp: Date.now() + ADMIN_SESSION_TTL_MS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { challenge, code } = req.body || {};
    const clientIp = getClientIp(req);
    const rateKey = `${clientIp}:${challenge || 'unknown'}`;

    if (isRateLimited(rateKey)) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessaie plus tard.' });
    }

    if (!process.env.ADMIN_SECRET) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
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

    let payload;

    try {
      payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    } catch {
      return res.status(400).json({ error: 'Payload invalide' });
    }

    if (!payload.exp || Date.now() > payload.exp) {
      return res.status(401).json({ error: 'Code expiré' });
    }

    const normalizedCode = String(code).trim();

    if (!/^\d{4}-\d{4}$/.test(normalizedCode)) {
      return res.status(400).json({ error: 'Format de code invalide' });
    }

    if (!safeEqual(hash(normalizedCode), payload.codeHash)) {
      return res.status(401).json({ error: 'Code incorrect' });
    }

    const sessionToken = createAdminSession(payload.email || 'admin');

    res.setHeader(
      'Set-Cookie',
      `qyraze_admin_session=${sessionToken}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${ADMIN_SESSION_TTL_MS / 1000}`
    );

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Login verify error:', error);
    return res.status(500).json({ error: 'Erreur vérification code' });
  }
}