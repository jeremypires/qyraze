<!-- In /Users/jeremypereirapires/Documents/qyraze/public/app.html -->

          <div class="admin-recipient-zone" id="adminRecipientsWrap">
            <label class="admin-field admin-recipient-field">
              <span>Destinataires</span>
              <div class="admin-combobox">
                <div id="adminChips" class="admin-chips"></div>
                <input id="adminEmailInput" class="admin-input admin-recipient-input" type="text" placeholder="Rechercher un lead ou saisir un email" autocomplete="off" />
                <div id="adminLeadSuggestions" class="admin-lead-suggestions"></div>
              </div>
              <small class="admin-help-text">Tape un email puis Entrée, ou recherche un lead validé et clique dessus.</small>
            </label>
          </div>

    function bootAdminEmail() {
      const form = document.getElementById('adminEmailForm');
      const sendAll = document.getElementById('adminSendAll');
      const recipientsWrap = document.getElementById('adminRecipientsWrap');
      const emailInput = document.getElementById('adminEmailInput');
      const chipsContainer = document.getElementById('adminChips');
      const suggestionsBox = document.getElementById('adminLeadSuggestions');
      const subjectInput = document.getElementById('adminSubject');
      const htmlInput = document.getElementById('adminHtml');
      const resultEl = document.getElementById('adminEmailResult');
      const previewEl = document.getElementById('adminEmailPreview');
      const previewBtn = document.getElementById('adminPreviewBtn');
      const sendBtn = document.getElementById('adminSendBtn');

      if (!form || !subjectInput || !htmlInput) return;

      let recipients = [];
      let availableLeads = [];

      function isEmail(value) {
        return /^\S+@\S+\.\S+$/.test(String(value || '').trim());
      }

      function updateRecipientVisibility() {
        if (!recipientsWrap || !sendAll) return;
        recipientsWrap.style.display = sendAll.checked ? 'none' : 'grid';
      }

      function setResult(message, success = false) {
        if (!resultEl) return;
        resultEl.className = success ? 'admin-result success' : 'admin-result error';
        resultEl.textContent = message;
      }

      function renderChips() {
        if (!chipsContainer) return;
        chipsContainer.innerHTML = '';

        recipients.forEach((email) => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'admin-chip';
          chip.innerHTML = `<span>${email}</span><strong aria-label="Retirer">×</strong>`;
          chip.addEventListener('click', () => {
            recipients = recipients.filter((item) => item !== email);
            renderChips();
            renderSuggestions(emailInput?.value || '');
          });
          chipsContainer.appendChild(chip);
        });
      }

      function addRecipient(email) {
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (!isEmail(normalizedEmail)) {
          setResult('Email invalide. Exemple : contact@exemple.com');
          return;
        }

        if (!recipients.includes(normalizedEmail)) {
          recipients.push(normalizedEmail);
        }

        if (emailInput) emailInput.value = '';
        if (suggestionsBox) suggestionsBox.style.display = 'none';
        renderChips();
      }

      function renderSuggestions(query = '') {
        if (!suggestionsBox) return;

        const normalizedQuery = String(query || '').trim().toLowerCase();
        suggestionsBox.innerHTML = '';

        if (!normalizedQuery) {
          suggestionsBox.style.display = 'none';
          return;
        }

        const matches = availableLeads
          .filter((lead) => lead.email && !recipients.includes(lead.email))
          .filter((lead) => lead.email.includes(normalizedQuery))
          .slice(0, 8);

        if (!matches.length) {
          suggestionsBox.style.display = 'none';
          return;
        }

        matches.forEach((lead) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'admin-lead-suggestion';
          button.textContent = lead.email;
          button.addEventListener('click', () => addRecipient(lead.email));
          suggestionsBox.appendChild(button);
        });

        suggestionsBox.style.display = 'grid';
      }

      if (sendAll) sendAll.addEventListener('change', updateRecipientVisibility);
      updateRecipientVisibility();

      fetch('/api/admin/leads', {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data?.leads) return;
          availableLeads = data.leads
            .map((lead) => ({ email: String(lead.email || '').toLowerCase().trim() }))
            .filter((lead) => isEmail(lead.email));
        })
        .catch(() => {});

      if (previewBtn && previewEl) {
        previewBtn.addEventListener('click', () => {
          previewEl.style.display = 'block';
          previewEl.innerHTML = htmlInput.value || '<p>Aucun contenu à prévisualiser.</p>';
        });
      }

      if (emailInput) {
        emailInput.addEventListener('input', () => {
          renderSuggestions(emailInput.value);
        });

        emailInput.addEventListener('focus', () => {
          if (emailInput.value.trim()) renderSuggestions(emailInput.value);
        });

        emailInput.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            const firstSuggestion = suggestionsBox?.querySelector('.admin-lead-suggestion');

            if (firstSuggestion && !isEmail(emailInput.value)) {
              firstSuggestion.click();
              return;
            }

            addRecipient(emailInput.value);
          }

          if (event.key === 'Escape' && suggestionsBox) {
            suggestionsBox.style.display = 'none';
          }
        });

        document.addEventListener('click', (event) => {
          if (!event.target.closest('.admin-combobox') && suggestionsBox) {
            suggestionsBox.style.display = 'none';
          }
        });
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (resultEl) {
          resultEl.className = 'admin-result';
          resultEl.style.display = 'block';
          resultEl.textContent = 'Envoi en cours...';
        }

        if (sendBtn) {
          sendBtn.disabled = true;
          sendBtn.textContent = 'Envoi...';
        }

        try {
          const selectedEmails = [...recipients];

          if (!sendAll?.checked && selectedEmails.length === 0) {
            throw new Error('Ajoute au moins un destinataire.');
          }

          const payload = sendAll?.checked
            ? {
                type: 'all',
                email: '',
                recipients: [],
                subject: subjectInput.value.trim(),
                html: htmlInput.value.trim(),
              }
            : {
                type: selectedEmails.length > 1 ? 'group' : 'single',
                email: selectedEmails.length === 1 ? selectedEmails[0] : '',
                recipients: selectedEmails,
                subject: subjectInput.value.trim(),
                html: htmlInput.value.trim(),
              };

          const response = await fetch('/api/admin/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
          });

          const data = await response.json().catch(() => ({}));

          if (!response.ok) {
            throw new Error(data.error || 'Envoi impossible');
          }

          setResult(`Email envoyé : ${data.sent || 0}/${data.total || 0} succès.`, true);
        } catch (error) {
          setResult(error.message || 'Erreur pendant l’envoi');
        } finally {
          if (sendBtn) {
            sendBtn.disabled = false;
            sendBtn.textContent = 'Envoyer l’email';
          }
        }
      });
    }

/* At the very end of /Users/jeremypereirapires/Documents/qyraze/public/style.css */

  
/* Admin recipients search — clean Gmail-like input */
.admin-recipient-zone {
  display: grid;
  grid-template-columns: 1fr;
}

.admin-send-options {
  display: grid;
  gap: 8px;
  margin-bottom: 4px;
}

.admin-check-row {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--white);
  font-size: 14px;
  cursor: pointer;
}

.admin-check-row input {
  accent-color: var(--cyan);
}

.admin-help-text {
  color: var(--muted-2);
  font-size: 12px;
  line-height: 1.5;
}

.admin-combobox {
  position: relative;
  display: grid;
  gap: 10px;
  width: 100%;
}

.admin-recipient-input {
  width: 100%;
  min-height: 52px;
  font-size: 15px;
}

.admin-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.admin-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(91, 200, 255, 0.24);
  border-radius: 999px;
  background: rgba(91, 200, 255, 0.09);
  color: var(--white);
  cursor: pointer;
  font: inherit;
  font-size: 13px;
}

.admin-chip span {
  overflow: hidden;
  text-overflow: ellipsis;
}

.admin-chip strong {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  font-weight: 800;
}

.admin-lead-suggestions {
  display: none;
  position: absolute;
  left: 0;
  right: 0;
  top: calc(100% + 6px);
  z-index: 80;
  gap: 4px;
  padding: 8px;
  border-radius: var(--r-sm);
  border: 1px solid var(--border);
  background: rgba(10, 14, 25, 0.98);
  box-shadow: var(--shadow-lg);
}

.admin-lead-suggestion {
  width: 100%;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--white);
  text-align: left;
  padding: 11px 12px;
  cursor: pointer;
  font: inherit;
}

.admin-lead-suggestion:hover {
  background: rgba(91, 200, 255, 0.1);
}
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const COOKIE_NAME = 'qyraze_admin_session';
const MAX_LEADS = 500;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function sign(value) {
  return crypto
    .createHmac('sha256', process.env.ADMIN_SECRET)
    .update(value)
    .digest('hex');
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));

  if (left.length !== right.length) return false;

  return crypto.timingSafeEqual(left, right);
}

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  const target = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  if (!target) return null;

  return decodeURIComponent(target.slice(name.length + 1));
}

function clearAdminCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
  );
}

function verifyAdminSession(req, res) {
  const session = getCookie(req, COOKIE_NAME);

  if (!session || typeof session !== 'string') return null;

  const parts = session.split('.');

  if (parts.length !== 2) {
    clearAdminCookie(res);
    return null;
  }

  const [encodedPayload, signature] = parts;

  if (!encodedPayload || !signature) {
    clearAdminCookie(res);
    return null;
  }

  const expectedSignature = sign(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    clearAdminCookie(res);
    return null;
  }

  let payload;

  try {
    payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  } catch {
    clearAdminCookie(res);
    return null;
  }

  if (
    !payload ||
    typeof payload !== 'object' ||
    !payload.exp ||
    typeof payload.exp !== 'number' ||
    Date.now() > payload.exp ||
    payload.role !== 'admin'
  ) {
    clearAdminCookie(res);
    return null;
  }

  return payload;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Cache-Control', 'no-store');

  try {
    const adminSession = verifyAdminSession(req, res);

    if (!adminSession) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data, error } = await supabase
      .from('leads')
      .select('id,email,created_at,verified_at,consent,subscribed,deleted,unsubscribed_at')
      .not('verified_at', 'is', null)
      .eq('consent', true)
      .eq('subscribed', true)
      .eq('deleted', false)
      .is('unsubscribed_at', null)
      .order('created_at', { ascending: false })
      .limit(MAX_LEADS);

    if (error) {
      return res.status(500).json({ error: 'Erreur récupération leads' });
    }

    const leads = (data || []).map((lead) => ({
      id: lead.id,
      email: String(lead.email || '').toLowerCase().trim(),
      created_at: lead.created_at,
    }));

    return res.status(200).json({ success: true, leads });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}