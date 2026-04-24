import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const MAX_RECIPIENTS = 50;
const SUBJECT_MAX_LENGTH = 120;
const HTML_MAX_LENGTH = 20000;
const COOKIE_NAME = 'qyraze_admin_session';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!target) return null;

  return decodeURIComponent(target.slice(name.length + 1));
}

function clearAdminCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  );
}

function verifyAdminSession(req, res) {
  const session = getCookie(req, COOKIE_NAME);

  if (!session || typeof session !== 'string') {
    return null;
  }

  const parts = session.split('.');

  if (parts.length !== 2) {
    clearAdminCookie(res);
    return null;
  }

  const [encodedPayload, signature] = parts;

  if (!encodedPayload || !signature) {
    clearAdminCookie(res);
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    clearAdminCookie(res);
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    clearAdminCookie(res);
    return null;
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !payload.exp ||
    typeof payload.exp !== 'number' ||
    Date.now() > payload.exp ||
    payload.role !== 'admin'
  ) {
    clearAdminCookie(res);
    return null;
  }

  return payload;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (!process.env.ADMIN_SECRET) {
    return res.status(500).json({ error: 'Configuration serveur manquante' });
  }

  const adminSession = verifyAdminSession(req, res);

  if (!adminSession) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { recipients, subject, html } = req.body;

  if (!Array.isArray(recipients) || recipients.length === 0 || recipients.length > MAX_RECIPIENTS) {
    return res.status(400).json({ error: 'Invalid recipients list' });
  }

  if (typeof subject !== 'string' || subject.length === 0 || subject.length > SUBJECT_MAX_LENGTH) {
    return res.status(400).json({ error: 'Invalid subject' });
  }

  if (typeof html !== 'string' || html.length === 0 || html.length > HTML_MAX_LENGTH) {
    return res.status(400).json({ error: 'Invalid HTML content' });
  }

  // Send email logic here, omitted for brevity
  const results = [];

  return res.status(200).json({
    admin: adminSession.email || null,
    results,
  });
}
