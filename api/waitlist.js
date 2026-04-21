import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
})

const isValidEmail = (email) =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const email = req.body?.email?.trim().toLowerCase()

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email invalide' })
  }

  try {
    const { error } = await supabaseAdmin
      .from('waitlist_emails')
      .insert([{ email }])

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Email déjà inscrit' })
      }

      throw error
    }

    // Temporairement désactivé pour isoler le problème SMTP Amen sur Vercel.
    // Décommente ce bloc quand la configuration SMTP sera validée.
    
    await transporter.sendMail({
  from: process.env.SMTP_FROM,
  to: email,
  subject: 'Bienvenue dans la bêta privée Qyraze',
  html: `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;color:#111;line-height:1.6;">

      <p style="font-size:15px;margin:0 0 16px 0;">
        Bonjour,
      </p>

      <p style="font-size:15px;margin:0 0 16px 0;">
        Merci d’avoir rejoint la liste d’attente de <strong>Qyraze</strong>.
      </p>

      <p style="font-size:15px;margin:0 0 16px 0;">
        Votre inscription est bien confirmée. Vous ferez partie des premiers informés lors de l’ouverture de la bêta privée.
      </p>

      <p style="font-size:15px;margin:0 0 12px 0;">
        Nous partagerons prochainement :
      </p>

      <ul style="font-size:15px;color:#222;margin:0 0 20px 20px;padding:0;">
        <li style="margin-bottom:8px;">l’accès anticipé à la plateforme</li>
        <li style="margin-bottom:8px;">les nouveautés produit</li>
        <li style="margin-bottom:8px;">les premières invitations utilisateurs</li>
      </ul>

      <div style="background:#f6f8fb;padding:18px 20px;border-radius:12px;font-size:14px;color:#222;margin:24px 0;">
        Accès bêta privé — Places limitées.<br />
        Nous contacterons les premiers inscrits en priorité.
      </div>

      <p style="font-size:15px;margin:0 0 16px 0;">
        Merci pour votre confiance.
      </p>

      <p style="font-size:15px;margin:0 0 24px 0;">
        À très bientôt,<br />
        <strong>Jérémy Pereira</strong><br />
        Fondateur — Qyraze
      </p>

      <hr style="margin:30px 0;border:none;border-top:1px solid #ddd;" />

      <table style="font-family: Arial,Helvetica,sans-serif; max-width: 620px; border-collapse: collapse;" cellspacing="0" cellpadding="0">
        <tbody>
          <tr>
            <td style="padding: 20px 24px 0 0;">
              <table cellspacing="0" cellpadding="0">
                <tbody>
                  <tr>
                    <td style="padding-right: 20px; vertical-align: middle;">
                      <img
                        style="display: block; border-radius: 14px;"
                        src="https://qyraze.com/logo.png"
                        alt="Qyraze OS"
                        width="81"
                        height="81"
                      />
                    </td>
                    <td style="border-left: 1px solid #d8d8d8; padding-left: 20px; vertical-align: middle;">
                      <div style="font-size: 22px; font-weight: 800; color: #111111; letter-spacing: 0.6px; line-height: 24px;">
                        QYRAZE OS
                      </div>
                      <div style="margin-top: 6px; font-size: 13px; font-weight: 600; color: #444444; line-height: 18px;">
                        Support • Inscriptions • Accès plateforme
                      </div>
                      <div style="margin-top: 6px; font-size: 12px; color: #666666; line-height: 18px;">
                        Gérez, analysez et automatisez vos opérations depuis un seul espace.
                      </div>
                      <div style="margin-top: 14px; font-size: 12px; line-height: 22px; color: #222222;">
                        <a style="color: #222; text-decoration: none;" href="mailto:contact@qyrazeos.fr">contact@qyrazeos.fr</a>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        <a style="color: #222; text-decoration: none;" href="https://qyraze.com">qyraze.com</a>
                        &nbsp;&nbsp;|&nbsp;&nbsp;
                        France
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

    </div>
  `,
})
    

    return res.status(200).json({ ok: true, emailSent: true })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return res.status(500).json({
      error: 'Impossible d’inscrire cet email pour le moment',
    })
  }
}