import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanPhone(phone) {
  return String(phone || '').replace(/[\s\-().+]/g, '');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { activite, revenus, blocage, dispos, motivation, budget, tel } = req.body || {};

    if (!activite || !tel) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'jeremy.pereirapires@gmail.com';
    const waLink = `https://wa.me/${cleanPhone(tel)}`;

    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: notifyEmail,
      subject: `🏕️ Candidature retraite — ${escapeHtml(activite)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#111827;">
          <h1 style="font-size:20px;margin:0 0 8px;">Nouvelle candidature retraite</h1>
          <p style="font-size:13px;color:#6b7280;margin:0 0 24px;">Reçu via qyraze.com/retraite</p>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;width:150px;vertical-align:top;">Activité</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">${escapeHtml(activite)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">Revenus/mois</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">${escapeHtml(revenus)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">Ce qui bloque</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;line-height:1.6;">${escapeHtml(blocage)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">Disponibilités</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">${escapeHtml(dispos)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">Motivation</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;line-height:1.6;">${escapeHtml(motivation)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;vertical-align:top;">Budget</td>
              <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;">${escapeHtml(budget)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;vertical-align:top;">Téléphone</td>
              <td style="padding:10px 0;font-weight:700;">${escapeHtml(tel)}</td>
            </tr>
          </table>

          <div style="margin-top:24px;padding:16px 20px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
            <a href="${waLink}" style="color:#16a34a;font-size:14px;font-weight:600;text-decoration:none;">
              📱 Contacter sur WhatsApp →
            </a>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Retraite candidature error:', error?.message || error);
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
}
