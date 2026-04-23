

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // use service role on server only

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, instagram, linkedin, business, goal } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Erreur vérification email' });
    }

    if (existing) {
      return res.status(409).json({ error: 'Email déjà enregistré' });
    }

    // Insert new lead
    const { error: insertError } = await supabase
      .from('leads')
      .insert([
        {
          email: normalizedEmail,
          name: name || null,
          instagram: instagram || null,
          linkedin: linkedin || null,
          business: business || null,
          goal: goal || null,
          unsubscribed: false,
          created_at: new Date().toISOString(),
        },
      ]);

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Erreur insertion' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}