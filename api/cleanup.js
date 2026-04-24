import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // sécurité : clé secrète (Vercel Cron n'envoie pas d'Authorization header)
  if (req.query.secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  console.log('Cleanup triggered at', new Date().toISOString());

  const { data, error } = await supabase
    .from('leads')
    .delete()
    .is('verified_at', null)
    .lt('verification_expires_at', new Date().toISOString())
    .select();

  console.log('Deleted leads:', data?.length || 0);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Cleanup failed' });
  }

  return res.status(200).json({ success: true });
}