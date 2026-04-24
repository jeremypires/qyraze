import crypto from 'crypto';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendWelcomeEmail(email, unsubscribeToken) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Bienvenue chez Qyraze — voilà comment ça va se passer',
    html: `
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
              Bienvenue chez Qyraze
            </h1>

            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
              Bonjour,
            </p>

            <p style="margin:0 0 16px 0;font-size:16px;color:#374151;">
              Ton email est bien confirmé 👌
            </p>

            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
              Tu fais maintenant partie des premiers inscrits à <strong style="color:#111827;">Qyraze</strong>.
            </p>

            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:16px;padding:20px 22px;margin:0 0 24px 0;">
              <div style="margin:0 0 10px 0;font-size:14px;font-weight:700;color:#111827;">
                Voilà exactement ce que tu vas recevoir :
              </div>
              <div style="margin:0 0 8px 0;font-size:15px;color:#374151;">• des emails courts, utiles et actionnables</div>
              <div style="margin:0 0 8px 0;font-size:15px;color:#374151;">• des idées concrètes pour améliorer ton business</div>
              <div style="margin:0;font-size:15px;color:#374151;">• 0 bullshit, 0 spam</div>
            </div>

            <div style="background:#eef2ff;border:1px solid #dbe4ff;border-radius:16px;padding:18px 20px;margin:0 0 28px 0;">
              <div style="margin:0 0 6px 0;font-size:15px;font-weight:700;color:#111827;">
                Rythme prévu
              </div>
              <div style="margin:0;font-size:15px;color:#4b5563;">
                1 email par jour à 8h, avec un contenu pensé pour t’aider à avancer plus clairement.
              </div>
            </div>

            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
              Pense à ajouter <strong style="color:#111827;">focus@qyrazeos.fr</strong> à tes contacts pour éviter que nos prochains emails arrivent dans les spams.
            </p>

            <p style="margin:0 0 24px 0;font-size:16px;color:#374151;">
              Tu pourras te désinscrire à tout moment.
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
                        Bienvenue • Inscriptions • Emails Qyraze
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
    `,
  });

  if (error) {
    console.error('Resend welcome email error:', error);
    throw new Error('Erreur envoi email bienvenue');
  }

  console.log('Resend welcome email success:', data);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method not allowed');
  }

  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Token manquant');
    }

    if (!process.env.RESEND_API_KEY) {
      console.error('Missing RESEND_API_KEY');
      return res.status(500).send('Configuration email manquante');
    }

    if (!process.env.EMAIL_FROM) {
      console.error('Missing EMAIL_FROM');
      return res.status(500).send('Expéditeur email manquant');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const { data: lead, error } = await supabase
      .from('leads')
      .select('id, email, verified_at, verification_expires_at')
      .eq('verification_token_hash', tokenHash)
      .maybeSingle();

    if (error) {
      console.error('Verify select error:', error);
      return res.status(500).send('Erreur serveur');
    }

    if (!lead) {
      return res.status(400).send('Lien invalide ou expiré');
    }

    if (lead.verified_at) {
      return res.redirect('https://qyraze.com?verified=already');
    }

    const now = new Date();

    if (!lead.verification_expires_at || new Date(lead.verification_expires_at) < now) {
      await supabase
        .from('leads')
        .update({
          verification_token_hash: null,
          verification_expires_at: null,
        })
        .eq('id', lead.id);

      return res.redirect('https://qyraze.com?verified=expired');
    }

    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeTokenHash = crypto.createHash('sha256').update(unsubscribeToken).digest('hex');

    const { error: updateError } = await supabase
      .from('leads')
      .update({
        verified_at: now.toISOString(),
        consent: true,
        subscribed: true,
        verification_token_hash: null,
        verification_expires_at: null,
        unsubscribe_token_hash: unsubscribeTokenHash,
      })
      .eq('id', lead.id);

    if (updateError) {
      console.error('Verify update error:', updateError);
      return res.status(500).send('Erreur serveur');
    }

    try {
      await sendWelcomeEmail(lead.email, unsubscribeToken);
    } catch (mailError) {
      console.error('Post-confirmation email error:', mailError);
    }

    return res.redirect('https://qyraze.com?verified=true');
  } catch (err) {
    console.error('Verify handler error:', err);
    return res.status(500).send('Erreur serveur');
  }
}