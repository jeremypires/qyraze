import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Token manquant');
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, email, verified, verification_token')
      .eq('verification_token', token)
      .maybeSingle();

    if (error) {
      console.error('Verify select error:', error);
      return res.status(500).send('Erreur serveur');
    }

    if (!lead) {
      return res.status(400).send('Lien invalide ou expiré');
    }

    if (lead.verified) {
      return res.redirect('https://qyraze.com?verified=already');
    }

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Verify update error:', updateError);
      return res.status(500).send('Erreur serveur');
    }

    return res.redirect('https://qyraze.com?verified=true');
  } catch (err) {
    console.error('Verify handler error:', err);
    return res.status(500).send('Erreur serveur');
  }
}