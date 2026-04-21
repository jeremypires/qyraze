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
    <div style="margin:0;padding:0;background-color:#f5f7fb;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;">

        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:40px 40px 28px 40px;box-shadow:0 1px 2px rgba(16,24,40,0.04);">

          <div style="text-align:center;margin-bottom:28px;">
            <img
              src="https://qyraze.com/logo.png"
              alt="Qyraze OS"
              width="56"
              height="56"
              style="display:inline-block;border-radius:14px;"
            />
          </div>

          <h1 style="margin:0 0 18px 0;font-size:30px;line-height:1.15;font-weight:800;color:#111827;letter-spacing:-0.03em;text-align:left;">
            Bienvenue dans la bêta privée Qyraze
          </h1>

          <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
            Bonjour,
          </p>

          <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
            Merci d’avoir rejoint la liste d’attente de <strong style="color:#111827;">Qyraze</strong>.
          </p>

          <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
            Votre inscription est confirmée. Vous ferez partie des premiers à découvrir Qyraze, l’<strong style="color:#111827;">Operating System</strong> conçu pour synchroniser vos outils et centraliser votre travail dans une interface unique.
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:20px 22px;margin:0 0 24px 0;">
            <div style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#111827;">
              Nous partagerons prochainement :
            </div>
            <div style="margin:0 0 8px 0;font-size:15px;color:#374151;">• l’accès anticipé à la plateforme</div>
            <div style="margin:0 0 8px 0;font-size:15px;color:#374151;">• les nouveautés produit</div>
            <div style="margin:0;font-size:15px;color:#374151;">• les premières invitations utilisateurs</div>
          </div>

          <div style="background:#eef2ff;border:1px solid #dbe4ff;border-radius:16px;padding:18px 20px;margin:0 0 28px 0;">
            <div style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#111827;">
              Accès bêta privé — Places limitées.
            </div>
            <div style="margin:0;font-size:15px;color:#4b5563;">
              Nous contacterons les premiers inscrits en priorité.
            </div>
          </div>

          <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
            Merci pour votre confiance.
          </p>

          <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
            À bientôt,<br />
            <strong>Jérémy Pereira Pires</strong><br />
            Fondateur — Qyraze
          </p>


          <div style="padding-top:24px;border-top:1px solid #e5e7eb;">
            <table style="font-family:Arial,Helvetica,sans-serif;border-collapse:collapse;max-width:620px;" cellspacing="0" cellpadding="0">
              <tbody>
                <tr>
                  <td style="padding-right:20px;vertical-align:middle;">
                    <img
                      style="display:block;border-radius:14px;"
                      src="https://qyraze.com/logo.png"
                      alt="Qyraze OS"
                      width="81"
                      height="81"
                    />
                  </td>
                  <td style="border-left:1px solid #d8d8d8;padding-left:20px;vertical-align:middle;">
                    <div style="font-size:22px;font-weight:800;color:#111111;letter-spacing:0.6px;line-height:24px;">
                      QYRAZE OS
                    </div>
                    <div style="margin-top:6px;font-size:13px;font-weight:600;color:#444444;line-height:18px;">
                      Support • Inscriptions • Accès plateforme
                    </div>
                    <div style="margin-top:6px;font-size:12px;color:#666666;line-height:18px;">
                      Synchronisez vos outils et centralisez vos opérations dans une interface unique.
                    </div>
                    <div style="margin-top:14px;font-size:12px;line-height:22px;color:#222222;">
                      <a style="color:#222;text-decoration:none;" href="mailto:contact@qyrazeos.fr">contact@qyrazeos.fr</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      <a style="color:#222;text-decoration:none;" href="https://qyraze.com">qyraze.com</a>
                      &nbsp;&nbsp;|&nbsp;&nbsp;
                      France
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </div>
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