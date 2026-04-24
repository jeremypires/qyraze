import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);


const CODE_TTL_MS = 5 * 60 * 1000;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_REQUESTS = 8;
const LOGIN_EMAIL_COOLDOWN_MS = 60 * 1000;
const PASSWORD_MAX_LENGTH = 128;
const loginAttempts = new Map();
const lastCodeSentAt = new Map();

function generateCode() {
  const part1 = crypto.randomInt(1000, 10000);
  const part2 = crypto.randomInt(1000, 10000);
  return `${part1}-${part2}`;
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
  const current = loginAttempts.get(key) || [];
  const recent = current.filter((timestamp) => now - timestamp < LOGIN_RATE_LIMIT_WINDOW_MS);

  if (recent.length >= LOGIN_RATE_LIMIT_MAX_REQUESTS) {
    loginAttempts.set(key, recent);
    return true;
  }

  recent.push(now);
  loginAttempts.set(key, recent);
  return false;
}

function isCooldownActive(key) {
  const now = Date.now();
  const lastSentAt = lastCodeSentAt.get(key) || 0;

  if (now - lastSentAt < LOGIN_EMAIL_COOLDOWN_MS) {
    return true;
  }

  lastCodeSentAt.set(key, now);
  return false;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SECRET)
    .update(value)
    .digest('hex');
}

function createChallenge(code, email) {
  const payload = {
    email,
    codeHash: hash(code),
    exp: Date.now() + CODE_TTL_MS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
}

function verifyPassword(password, storedPasswordHash) {
  if (!password || !storedPasswordHash || !storedPasswordHash.includes(':')) {
    return false;
  }

  const [salt, originalHash] = storedPasswordHash.split(':');

  if (!salt || !originalHash) return false;

  const testedHash = crypto
    .pbkdf2Sync(password, salt, 100000, 64, 'sha512')
    .toString('hex');

  return safeEqual(testedHash, originalHash);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body || {};

    if (
      !process.env.ADMIN_SECRET ||
      !process.env.RESEND_API_KEY ||
      !process.env.EMAIL_FROM ||
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const normalizedEmail = String(email || '').toLowerCase().trim();
    const clientIp = getClientIp(req);
    const rateLimitKey = `${clientIp}:${normalizedEmail || 'unknown'}`;

    if (isRateLimited(rateLimitKey)) {
      return res.status(429).json({ error: 'Trop de tentatives. Réessaie dans quelques minutes.' });
    }

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: 'Email et mot de passe requis' });
    }

    if (typeof password !== 'string' || password.length > PASSWORD_MAX_LENGTH) {
      return res.status(400).json({ error: 'Mot de passe invalide' });
    }

    if (!isValidEmail(normalizedEmail) || normalizedEmail.length > 254) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('email, password_hash, active')
      .eq('email', normalizedEmail)
      .eq('active', true)
      .maybeSingle();

    if (adminError) {
      console.error('Admin lookup error:', adminError);
      return res.status(500).json({ error: 'Erreur vérification admin' });
    }

    if (!adminUser || !verifyPassword(password, adminUser.password_hash)) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const cooldownKey = `code:${normalizedEmail}`;

    if (isCooldownActive(cooldownKey)) {
      return res.status(429).json({ error: 'Code déjà envoyé. Attends une minute avant de recommencer.' });
    }

    const code = generateCode();
    const challenge = createChallenge(code, normalizedEmail);
    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'jeremy.pereirapires@gmail.com';
    const safeEmail = escapeHtml(normalizedEmail);

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: notifyEmail,
      subject: '🔐 Code de connexion Qyraze',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #0f172a;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">Code de connexion Qyraze</h1>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">Une connexion admin vient d’être demandée.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0 0 18px;">Compte : ${safeEmail}</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 18px;">Voici ton code de sécurité :</p>
          <div style="font-size: 34px; font-weight: 700; letter-spacing: 4px; padding: 18px 20px; border-radius: 14px; background: #f1f5f9; text-align: center; margin-bottom: 18px;">${code}</div>
          <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0;">Ce code expire dans 5 minutes. Ne le partage jamais.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 24px 0 0;">
            Qyraze<br />
            focus@qyrazeos.fr<br />
            qyraze.com
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, challenge });
  } catch (error) {
    console.error('Login notify error:', error?.message || error);
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
}
