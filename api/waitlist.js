import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(process.env.RESEND_API_KEY);

function getConfirmationEmailHtml(verifyUrl, unsubscribeToken, isResend = false) {
  return `
    <div style="margin:0;padding:0;background-color:#f5f7fb;">
      <div style="max-width:640px;margin:0 auto;padding:40px 20px;font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;">
        <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;padding:40px 40px 28px 40px;box-shadow:0 1px 2px rgba(16,24,40,0.04);">

          <div style="text-align:center;margin-bottom:28px;">
            <img
              src="https://qyraze.com/logo.png"
              alt="Qyraze"
              width="56"
              height="56"
              style="display:inline-block;border-radius:14px;"
            />
          </div>

          <h1 style="margin:0 0 18px 0;font-size:30px;line-height:1.15;font-weight:800;color:#111827;letter-spacing:-0.03em;text-align:left;">
            Confirme ton inscription à Qyraze
          </h1>

          <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
            Bonjour,
          </p>

          ${
            isResend
              ? `
          <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
            Ton inscription existe déjà, mais ton adresse email n’a pas encore été confirmée.
          </p>

          <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
            Nous t’avons renvoyé un nouveau lien de confirmation pour finaliser ton inscription.
          </p>
          `
              : `
          <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
            Merci pour ton inscription à <strong style="color:#111827;">Qyraze</strong>.
          </p>

          <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
            Pour confirmer ton adresse email et finaliser ton inscription, clique sur le bouton ci-dessous.
          </p>
          `
          }

          <div style="text-align:left;margin:0 0 28px 0;">
            <a
              href="${verifyUrl}"
              style="display:inline-block;padding:14px 22px;background:#111827;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;"
            >
              Valider mon email
            </a>
          </div>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:20px 22px;margin:0 0 24px 0;">
            <div style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#111827;">
              Ce que cette validation permet :
            </div>
            <div style="margin:0 0 8px 0;font-size:15px;color:#374151;">• confirmer que ton adresse email est correcte</div>
            <div style="margin:0 0 8px 0;font-size:15px;color:#374151;">• éviter les erreurs d’inscription</div>
            <div style="margin:0;font-size:15px;color:#374151;">• recevoir ensuite les emails Qyraze sur la bonne adresse</div>
          </div>

          <div style="background:#eef2ff;border:1px solid #dbe4ff;border-radius:16px;padding:18px 20px;margin:0 0 28px 0;">
            <div style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#111827;">
              Lien de confirmation valable 24 heures.
            </div>
            <div style="margin:0;font-size:15px;color:#4b5563;">
              Passé ce délai, le lien expirera automatiquement et ne pourra plus être utilisé.
            </div>
          </div>

          <p style="margin:0 0 16px 0;font-size:14px;line-height:1.7;color:#6b7280;">
            Si le bouton ne fonctionne pas, copie et colle ce lien dans ton navigateur :<br />
            <a href="${verifyUrl}" style="color:#2563eb;word-break:break-all;">${verifyUrl}</a>
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
                      alt="Qyraze"
                      width="81"
                      height="81"
                    />
                  </td>
                  <td style="border-left:1px solid #d8d8d8;padding-left:20px;vertical-align:middle;">
                    <div style="font-size:22px;font-weight:800;color:#111111;letter-spacing:0.6px;line-height:24px;">
                      QYRAZE
                    </div>
                    <div style="margin-top:6px;font-size:13px;font-weight:600;color:#444444;line-height:18px;">
                      Confirmation • Inscriptions • Emails Qyraze
                    </div>
                    <div style="margin-top:6px;font-size:12px;color:#666666;line-height:18px;">
                      Des emails utiles, précis et pensés pour aider les entrepreneurs à avancer plus vite.
                    </div>
                    <div style="margin-top:14px;font-size:12px;line-height:22px;color:#222222;">
                      <a style="color:#222;text-decoration:none;" href="mailto:focus@qyrazeos.fr">focus@qyrazeos.fr</a>
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

          <p style="margin-top:24px;font-size:12px;color:#9ca3af;text-align:left;">
            Si tu ne souhaites plus recevoir d'emails, tu peux te désinscrire ici :
            <br />
            <a href="https://qyraze.com/api/unsubscribe?token=${unsubscribeToken}" style="color:#2563eb;">
              Se désinscrire
            </a>
          </p>

        </div>
      </div>
    </div>
  `;
}

async function sendConfirmationEmail(to, verifyUrl, unsubscribeToken, isResend = false) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to,
    subject: 'Confirme ton inscription à Qyraze',
    html: getConfirmationEmailHtml(verifyUrl, unsubscribeToken, isResend),
  });

  if (error) {
    console.error('Resend send error:', error);
    throw new Error('Erreur envoi email');
  }

  console.log('Resend send success:', data);
  return data;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, name, instagram, linkedin, business, goal } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Configuration email manquante' });
    }

    if (!process.env.EMAIL_FROM) {
      console.error('Missing EMAIL_FROM');
      return res.status(500).json({ error: 'Expéditeur email manquant' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const { data: existing, error: checkError } = await supabase
      .from('leads')
      .select('id, verified_at')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (checkError) {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Erreur vérification email' });
    }

    if (existing?.verified_at) {
      return res.status(409).json({
        error: 'Email déjà vérifié',
        status: 'confirmed',
      });
    }

    if (existing) {
      // Récupérer le token actuel
      const { data: existingData, error: fetchError } = await supabase
        .from('leads')
        .select('verification_token_hash, verification_expires_at, unsubscribe_token_hash')
        .eq('id', existing.id)
        .single();

      if (fetchError) {
        console.error('Fetch existing error:', fetchError);
        return res.status(500).json({ error: 'Erreur récupération lead' });
      }

      const nowDate = new Date();
      const expiresAt = existingData.verification_expires_at
        ? new Date(existingData.verification_expires_at)
        : null;

      const isTokenStillValid =
        expiresAt && nowDate < expiresAt;

      let tokenToUse;
      let unsubscribeToUse;

      // Si token expiré → on en génère un nouveau
      if (!isTokenStillValid) {
        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');

        const { error: updateError } = await supabase
          .from('leads')
          .update({
            name: name || null,
            instagram: instagram || null,
            linkedin: linkedin || null,
            business: business || null,
            goal: goal || null,
            verification_token_hash: tokenHash,
            verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            unsubscribe_token_hash: unsubscribeTokenHash,
            verified_at: null,
            consent: false,
            subscribed: false,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return res.status(500).json({ error: 'Erreur mise à jour lead' });
        }

        tokenToUse = token;
        unsubscribeToUse = unsubscribeToken;
      } else {
        // Use existing tokens, but we only have hashes, so we can't get raw token
        // In this scenario, to resend email, we must generate new tokens
        // But instructions do not specify this, so fallback to error or generate new tokens
        // For safety, generate new tokens here

        const token = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const unsubscribeToken = crypto.randomBytes(32).toString('hex');
        const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');

        const { error: updateError } = await supabase
          .from('leads')
          .update({
            name: name || null,
            instagram: instagram || null,
            linkedin: linkedin || null,
            business: business || null,
            goal: goal || null,
            verification_token_hash: tokenHash,
            verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            unsubscribe_token_hash: unsubscribeTokenHash,
            verified_at: null,
            consent: false,
            subscribed: false,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return res.status(500).json({ error: 'Erreur mise à jour lead' });
        }

        tokenToUse = token;
        unsubscribeToUse = unsubscribeToken;
      }

      const verifyUrl = `https://qyraze.com/api/verify?token=${tokenToUse}`;

      await sendConfirmationEmail(
        normalizedEmail,
        verifyUrl,
        unsubscribeToUse,
        true
      );

      return res.status(409).json({
        error: 'Email déjà enregistré mais non confirmé',
        status: 'pending',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');
    const now = new Date().toISOString();
    const verifyUrl = `https://qyraze.com/api/verify?token=${token}`;

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
          verification_token_hash: tokenHash,
          verification_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          unsubscribe_token_hash: unsubscribeTokenHash,
          consent: false,
          subscribed: false,
          verified_at: null,
          created_at: now,
        },
      ]);

    if (insertError) {
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Erreur insertion' });
    }

    await sendConfirmationEmail(normalizedEmail, verifyUrl, unsubscribeToken, false);

    return res.status(200).json({
      success: true,
      message: 'Email de confirmation envoyé',
    });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}