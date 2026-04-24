import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.SITE_URL || 'https://qyraze.com';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

function redirectToHome(res, status) {
  return res.redirect(302, `${SITE_URL}/?unsubscribed=${status}`);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Méthode non autorisée');
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return redirectToHome(res, 'invalid');
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('id, email, subscribed, consent, deleted')
    .eq('unsubscribe_token_hash', tokenHash)
    .maybeSingle();

  if (fetchError || !existing) {
    return redirectToHome(res, 'invalid');
  }

  if (existing.deleted === true) {
    return redirectToHome(res, 'deleted');
  }

  if (existing.subscribed === false && existing.consent === false) {
    return redirectToHome(res, 'already');
  }

  const { error: updateError } = await supabase
    .from('leads')
    .update({
      subscribed: false,
      consent: false,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq('id', existing.id);

  if (updateError) {
    return redirectToHome(res, 'error');
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: existing.email,
      subject: 'Tu es bien désinscrit',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #0f172a;">
          <h1 style="font-size: 24px; margin: 0 0 16px;">Tu es bien désinscrit</h1>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 14px;">Tu ne recevras plus d’emails Qyraze.</p>
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 22px;">Si c’est une erreur, tu peux te réinscrire à tout moment depuis le site.</p>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
            Qyraze<br />
            focus@qyrazeos.fr<br />
            qyraze.com
          </p>
        </div>
      `,
    });
  } catch (mailError) {
    console.error('Unsubscribe confirmation email error:', mailError);
  }
  return redirectToHome(res, 'true');
}