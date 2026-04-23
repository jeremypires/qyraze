import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

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

    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id, verified')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Erreur vérification email' });
    }

    if (existing?.verified) {
      return res.status(409).json({ error: 'Email déjà vérifié' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date().toISOString();
    const verifyUrl = `https://qyraze.com/api/verify?token=${token}`;

    if (existing) {
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          name: name || null,
          instagram: instagram || null,
          linkedin: linkedin || null,
          business: business || null,
          goal: goal || null,
          verification_token: token,
          verification_sent_at: now,
          verified: false,
          verified_at: null,
          unsubscribed: false,
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('Update error:', updateError);
        return res.status(500).json({ error: 'Erreur mise à jour lead' });
      }
    } else {
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
            verified: false,
            verification_token: token,
            verification_sent_at: now,
            verified_at: null,
            created_at: now,
          },
        ]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return res.status(500).json({ error: 'Erreur insertion' });
      }
    }

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.MAIL_FROM || process.env.SMTP_USER,
      to: normalizedEmail,
      subject: 'Confirme ton inscription à Qyraze',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;">
          <h1 style="font-size:24px;margin-bottom:16px;">Confirme ton email</h1>
          <p style="font-size:16px;line-height:1.6;margin-bottom:16px;">
            Merci pour ton inscription à Qyraze. Clique sur le bouton ci-dessous pour confirmer ton adresse email.
          </p>
          <p style="margin:24px 0;">
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 22px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;">
              Valider mon email
            </a>
          </p>
          <p style="font-size:14px;line-height:1.6;color:#6b7280;">
            Si le bouton ne fonctionne pas, copie et colle ce lien dans ton navigateur :<br />
            <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all;">${verifyUrl}</a>
          </p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: 'Email de confirmation envoyé',
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}