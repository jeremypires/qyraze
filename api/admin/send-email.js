import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const MAX_RECIPIENTS = 50;
const SUBJECT_MAX_LENGTH = 120;
const HTML_MAX_LENGTH = 20000;

const COOKIE_NAME = 'qyraze_admin_session';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const { type, email, recipients: requestedRecipients, subject, html } = req.body || {};

  if (!subject || typeof subject !== 'string' || subject.length > SUBJECT_MAX_LENGTH) {
    return res.status(400).json({ error: 'Sujet invalide' });
  }

  if (!html || typeof html !== 'string' || html.length > HTML_MAX_LENGTH) {
    return res.status(400).json({ error: 'Contenu HTML invalide' });
  }

  if (!['single', 'all', 'group'].includes(type)) {
    return res.status(400).json({ error: 'Type invalide' });
  }

  try {
    let recipients = [];

    if (type === 'single') {
      if (!email || !isValidEmail(email)) {
        return res.status(400).json({ error: 'Email invalide' });
      }

      recipients = [email.toLowerCase().trim()];
    }

    if (type === 'all') {
      const { data, error } = await supabase
        .from('leads')
        .select('email')
        .eq('subscribed', true)
        .eq('consent', true)
        .eq('deleted', false)
        .not('verified_at', 'is', null)
        .is('unsubscribed_at', null);

      if (error) throw error;

      recipients = (data || []).map((lead) => lead.email).filter(Boolean);
    }

    if (type === 'group') {
      if (!Array.isArray(requestedRecipients)) {
        return res.status(400).json({ error: 'Liste de destinataires invalide' });
      }

      recipients = requestedRecipients
        .map((recipient) => String(recipient || '').toLowerCase().trim())
        .filter(Boolean);
    }

    const uniqueRecipients = [...new Set(recipients)];

    if (!uniqueRecipients.length) {
      return res.status(400).json({ error: 'Aucun destinataire' });
    }

    if (uniqueRecipients.length > MAX_RECIPIENTS) {
      return res.status(400).json({ error: `Limite temporaire : ${MAX_RECIPIENTS} destinataires maximum par envoi` });
    }

    const filteredRecipients = uniqueRecipients.filter(isValidEmail);

    if (!filteredRecipients.length) {
      return res.status(400).json({ error: 'Aucun email valide' });
    }

    const emailHtml = html;

    const results = [];

    for (const recipient of filteredRecipients) {
      const { error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: recipient,
        subject,
        html: emailHtml,
      });

      if (error) {
        results.push({ email: recipient, success: false, error: error.message || 'Erreur Resend' });
      } else {
        results.push({ email: recipient, success: true });
      }
    }

    const sent = results.filter((result) => result.success).length;
    const failed = results.length - sent;

    return res.status(200).json({
      success: failed === 0,
      sent,
      failed,
      total: filteredRecipients.length,
      admin: adminSession.email || null,
      results,
    });
  } catch (err) {
    console.error('Admin send email error:', err?.message || err);
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
}