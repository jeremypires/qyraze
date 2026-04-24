import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // sécurité : clé secrète
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { error } = await supabase
    .from('leads')
    .delete()
    .is('verified_at', null)
    .lt('verification_expires_at', new Date().toISOString());

  if (error) {
    console.error(error);
    return res.status(500).json({ error: 'Cleanup failed' });
  }

  return res.status(200).json({ success: true });
}