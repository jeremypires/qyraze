import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = process.env.SITE_URL || 'https://qyraze.com';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    .select('id, subscribed, consent, deleted')
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

  return redirectToHome(res, 'true');
}