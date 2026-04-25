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

  if (!session || typeof session !== 'string') return null;

  const parts = session.split('.');
  if (parts.length !== 2) {
    clearAdminCookie(res);
    return null;
  }

  const [encodedPayload, signature] = parts;

  if (!safeEqual(signature, sign(encodedPayload))) {
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

  if (!payload || Date.now() > payload.exp || payload.role !== 'admin') {
    clearAdminCookie(res);
    return null;
  }

  return payload;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function createRawUnsubscribeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function logEmailSend({ recipient, subject, type, success, errorMessage, adminEmail }) {
  try {
    await supabase.from('email_logs').insert({
      recipient_email: recipient,
      subject,
      send_type: type,
      success,
      error_message: errorMessage || null,
      admin_email: adminEmail || null,
    });
  } catch (logError) {
    console.error('Email log error:', logError?.message || logError);
  }
}

/* 🔥 TEMPLATE EMAIL PREMIUM */
function buildEmailHTML(message, name, unsubscribeUrl) {
  const safeName = escapeHtml(name || 'toi');
  const safeMessage = escapeHtml(message)
    .split('\n')
    .map(line => line.trim() || '&nbsp;')
    .join('<br>');

  return `
  <div style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; margin:auto;">
      <tr>
        <td style="background:#ffffff; border-radius:18px; padding:30px; border:1px solid #e2e8f0;">

          <div style="text-align:center; margin-bottom:20px;">
            <img src="https://qyraze.com/logo.png" style="height:42px;" />
          </div>

          <h2 style="font-size:22px; color:#0f172a;">
            Hey ${safeName},
          </h2>

          <p style="font-size:15px; color:#334155; line-height:1.7;">
            ${safeMessage}
          </p>

          <div style="background:#f8fafc; border:1px solid #e2e8f0; padding:18px; border-radius:12px; margin-top:20px;">
            Cet email a été envoyé depuis Qyraze.
          </div>

          <div style="text-align:center; margin-top:20px;">
            <a href="https://qyraze.com"
              style="background:#0f172a; color:#fff; padding:12px 20px; border-radius:10px; text-decoration:none;">
              Accéder à Qyraze
            </a>
          </div>

          <hr style="margin:20px 0; border-top:1px solid #e2e8f0;">

          <div style="font-size:12px; color:#64748b;">
            <a href="${unsubscribeUrl}" style="color:#2563eb;">Se désinscrire</a>
          </div>

        </td>
      </tr>
    </table>
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminSession = verifyAdminSession(req, res);
  if (!adminSession) return res.status(401).json({ error: 'Unauthorized' });

  const { type, email, recipients: requestedRecipients, subject, html, message } = req.body || {};
  const rawMessage = typeof message === 'string' ? message : html;

  if (!subject || subject.length > SUBJECT_MAX_LENGTH) {
    return res.status(400).json({ error: 'Sujet invalide' });
  }

  if (!rawMessage || rawMessage.trim().length === 0 || rawMessage.length > HTML_MAX_LENGTH) {
    return res.status(400).json({ error: 'Message invalide' });
  }

  if (!['single', 'group', 'all'].includes(type)) {
    return res.status(400).json({ error: 'Type invalide' });
  }

  let recipients = [];

  if (type === 'single') {
    const cleanEmail = String(email || '').toLowerCase().trim();

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Email invalide' });
    }

    recipients = [cleanEmail];
  }

  if (type === 'group') {
    if (!Array.isArray(requestedRecipients)) {
      return res.status(400).json({ error: 'Liste de destinataires invalide' });
    }

    recipients = requestedRecipients
      .map((recipient) => String(recipient || '').toLowerCase().trim())
      .filter(Boolean);
  }

  if (type === 'all') {
    const { data, error } = await supabase
      .from('leads')
      .select('email,name')
      .eq('subscribed', true)
      .eq('consent', true)
      .eq('deleted', false)
      .not('verified_at', 'is', null)
      .is('unsubscribed_at', null);

    if (error) throw error;

    recipients = (data || []).map((lead) => String(lead.email || '').toLowerCase().trim()).filter(Boolean);
  }

  recipients = [...new Set(recipients)].filter(isValidEmail);

  if (!recipients.length) {
    return res.status(400).json({ error: 'Aucun destinataire valide' });
  }

  if (recipients.length > MAX_RECIPIENTS) {
    return res.status(400).json({ error: `Limite temporaire : ${MAX_RECIPIENTS} destinataires maximum par envoi` });
  }

  const results = [];

  for (const recipient of recipients) {
    const token = createRawUnsubscribeToken();
    const hash = hashToken(token);
    const unsubscribeUrl = `https://qyraze.com/api/unsubscribe?token=${token}`;

    const { error: tokenUpdateError } = await supabase
      .from('leads')
      .update({ unsubscribe_token_hash: hash })
      .eq('email', recipient);

    if (tokenUpdateError) {
      await logEmailSend({
        recipient,
        subject,
        type,
        success: false,
        errorMessage: 'Erreur génération lien désinscription',
        adminEmail: adminSession.email || null,
      });

      results.push({ email: recipient, success: false, error: 'Erreur génération lien désinscription' });
      continue;
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('name')
      .eq('email', recipient)
      .maybeSingle();

    const finalHtml = buildEmailHTML(rawMessage.trim(), lead?.name, unsubscribeUrl);

    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: recipient,
      subject,
      html: finalHtml,
    });

    await logEmailSend({
      recipient,
      subject,
      type,
      success: !error,
      errorMessage: error?.message || null,
      adminEmail: adminSession.email || null,
    });

    results.push({ email: recipient, success: !error });
  }

  return res.status(200).json({
    success: true,
    total: results.length,
    sent: results.filter(r => r.success).length,
  });
}