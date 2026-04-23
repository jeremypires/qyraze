import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Méthode non autorisée');
  }

  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Token manquant');
  }

  const { data: existing, error: fetchError } = await supabase
    .from('leads')
    .select('is_subscribed')
    .eq('unsubscribe_token', token)
    .single();

  if (fetchError || !existing) {
    return res.status(400).send('Lien invalide ou expiré');
  }

  if (existing.is_subscribed === false) {
    return res.send(`
      <html>
        <body style="font-family: Arial; text-align:center; padding:40px;">
          <h1>Déjà désinscrit</h1>
          <p>Tu ne reçois déjà plus d'emails de Qyraze.</p>
        </body>
      </html>
    `);
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ is_subscribed: false })
    .eq('unsubscribe_token', token)
    .select();

  if (error || !data) {
    return res.status(400).send('Lien invalide ou expiré');
  }

  return res.send(`
    <html>
      <body style="font-family: Arial; text-align:center; padding:40px;">
        <h1>Tu es bien désinscrit</h1>
        <p>Tu ne recevras plus d'emails de Qyraze.</p>
      </body>
    </html>
  `);
}