

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function generateCode() {
  const part1 = Math.floor(1000 + Math.random() * 9000);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  return `${part1}-${part2}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const code = generateCode();

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: 'jeremy.pereirapires@gmail.com',
      subject: '🔐 Code de connexion Qyraze',
      html: `
        <h2>Connexion détectée</h2>
        <p>Voici ton code de sécurité :</p>
        <h1 style="letter-spacing:3px;">${code}</h1>
        <p>Ne partage jamais ce code.</p>
      `,
    });

    return res.status(200).json({ success: true, code });
  } catch (error) {
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
}