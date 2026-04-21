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
    /*
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Bienvenue dans la bêta Qyraze',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111">
          <h2>Bienvenue chez Qyraze</h2>
          <p>Ton inscription à la liste d’attente est bien confirmée.</p>
          <p>Tu seras informé en priorité dès l’ouverture de la bêta.</p>
          <p>À très vite,<br />Jérémy<br />Qyraze</p>
        </div>
      `,
    })
    */

    return res.status(200).json({ ok: true, emailSent: false })
  } catch (error) {
    console.error('Waitlist signup error:', error)
    return res.status(500).json({
      error: 'Impossible d’inscrire cet email pour le moment',
    })
  }
}