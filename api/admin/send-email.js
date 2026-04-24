import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const MAX_RECIPIENTS = 50;
const SUBJECT_MAX_LENGTH = 120;
const HTML_MAX_LENGTH = 20000;

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildEmailHtml(content) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px; color: #0f172a;">
      ${content}
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
      <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
        Vous recevez cet email via Qyraze.<br />
        Qyraze · focus@qyrazeos.fr · qyraze.com
      </p>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ') || authHeader !== `Bearer ${process.env.ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, email, subject, html } = req.body || {};

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
        .not('verified_at', 'is', null);

      if (error) throw error;

      recipients = (data || []).map((lead) => lead.email).filter(Boolean);
    }

    if (type === 'group') {
      const { data, error } = await supabase
        .from('leads')
        .select('email')
        .eq('subscribed', true)
        .eq('consent', true)
        .eq('deleted', false)
        .not('verified_at', 'is', null)
        .or('business.ilike.%freelance%,goal.ilike.%freelance%');

      if (error) throw error;

      recipients = (data || []).map((lead) => lead.email).filter(Boolean);
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

    const emailHtml = buildEmailHtml(html);

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
      results,
    });
  } catch (err) {
    console.error('Admin send email error:', err?.message || err);
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
}