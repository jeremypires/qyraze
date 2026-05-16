import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value) {
  return String(value || '—')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanPhone(phone) {
  return String(phone || '').replace(/[\s\-().+]/g, '');
}

function row(label, value) {
  return `<tr>
    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;color:#6b7280;width:180px;vertical-align:top;font-size:13px;">${label}</td>
    <td style="padding:9px 0;border-bottom:1px solid #f1f5f9;font-size:14px;line-height:1.6;">${escapeHtml(value)}</td>
  </tr>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prenom, nom, age, sexe, ville, tel,
      activite, anciennete, statut, reseaux,
      revenus, stabilite,
      blocage, reseau_ent, investissement,
      objectifs, motivation_score, pourquoi_retraite,
      dispos, alimentaire, vehicule,
      budget, source,
      conviction
    } = req.body || {};

    if (!prenom || !tel) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
      return res.status(500).json({ error: 'Configuration serveur manquante' });
    }

    const notifyEmail = process.env.ADMIN_NOTIFY_EMAIL || 'jeremy.pereirapires@gmail.com';
    const waLink = `https://wa.me/${cleanPhone(tel)}`;
    const fullName = `${prenom} ${nom}`.trim();

    await Promise.all([
      fetch('https://hook.eu2.make.com/worhohcplewpt56sj4w6a2zz4e6w99w6', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body)
      }),
      resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: notifyEmail,
      subject: `🏕️ Candidature retraite — ${escapeHtml(fullName)}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#111827;">
          <h1 style="font-size:20px;margin:0 0 4px;">Nouvelle candidature retraite</h1>
          <p style="font-size:13px;color:#6b7280;margin:0 0 28px;">Reçu via qyraze.com/retraite</p>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Identité</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Prénom / Nom', fullName)}
            ${row('Âge', age)}
            ${row('Sexe', sexe)}
            ${row('Ville / Pays', ville)}
            ${row('WhatsApp', tel)}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Activité</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Activité', activite)}
            ${row('Ancienneté', anciennete)}
            ${row('Statut', statut)}
            ${row('Réseaux / Site', reseaux || '—')}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Revenus</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Revenus mensuels', revenus)}
            ${row('Stabilité', stabilite)}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Situation actuelle</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Ce qui bloque', blocage)}
            ${row('Entourage entrepreneurs', reseau_ent)}
            ${row('Investissement formation', investissement)}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Ambition</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Objectifs 3 mois', objectifs)}
            ${row('Score motivation', `${motivation_score}/10`)}
            ${row('Pourquoi retraite vs formation', pourquoi_retraite)}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Logistique</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Disponibilités', dispos)}
            ${row('Contraintes alimentaires', alimentaire)}
            ${row('Permis / Véhicule', vehicule)}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Budget & engagement</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            ${row('Budget', budget)}
            ${row('Source', source)}
          </table>

          <h2 style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#9ca3af;margin:0 0 8px;">Conviction</h2>
          <div style="background:#f9fafb;border-radius:10px;padding:16px;font-size:14px;line-height:1.7;color:#374151;margin-bottom:24px;">${escapeHtml(conviction)}</div>

          <div style="padding:16px 20px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;">
            <a href="${waLink}" style="color:#16a34a;font-size:14px;font-weight:600;text-decoration:none;">
              📱 Contacter ${escapeHtml(prenom)} sur WhatsApp →
            </a>
          </div>
        </div>
      `,
      })
    ]);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Retraite candidature error:', error?.message || error);
    return res.status(500).json({ error: 'Erreur envoi email' });
  }
}
