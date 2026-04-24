const $ = id => document.getElementById(id);

const path = window.location.pathname;
const isConnexionRoute = path === '/connexion';
const isAppRoute = path === '/app';

const marketingPage = $('marketingPage');
const loginRoute = $('loginRoute');
const appRoute = $('appRoute');

function ensureLoginRoute() {
  if (!isConnexionRoute || $('loginRoute')) return;

  const route = document.createElement('main');
  route.id = 'loginRoute';
  route.className = 'login-route active';
  route.innerHTML = `
    <section class="section login-section" style="min-height: calc(100vh - 64px); display: flex; align-items: center; justify-content: center; padding: 80px 20px;">
      <div class="login-card" style="width: 100%; max-width: 460px; margin: 0 auto; padding: 34px 28px; border: 1px solid rgba(255,255,255,.08); border-radius: 20px; background: rgba(9,13,26,.92); box-shadow: 0 20px 60px rgba(0,0,0,.6);">
        <div class="login-badge" style="display:inline-block; margin-bottom:16px; padding:5px 12px; border:1px solid rgba(255,255,255,.08); border-radius:999px; font-size:10px; letter-spacing:.12em; color:#7c8baa; text-transform:uppercase;">Accès sécurisé</div>
        <h1 class="login-title" style="margin:0 0 8px; font-family: var(--font-head, Syne, sans-serif); font-size:28px; line-height:1.1; color:#eef2ff;">Connexion Qyraze</h1>
        <p class="login-subtitle" style="margin:0 0 24px; color:#7c8baa; font-size:14px; line-height:1.6;">Entre tes identifiants, puis valide le code reçu par email.</p>
        <form id="loginForm" class="login-form" style="display:grid; gap:10px;">
          <input id="loginEmail" type="email" placeholder="Email admin" autocomplete="email" required style="width:100%; padding:14px 16px; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); color:#eef2ff; outline:none;" />
          <input id="loginPassword" type="password" placeholder="Mot de passe" autocomplete="current-password" required style="width:100%; padding:14px 16px; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); color:#eef2ff; outline:none;" />
          <button type="submit" class="login-submit" style="width:100%; padding:14px 16px; border:0; border-radius:10px; background:#5bc8ff; color:#03101e; font-weight:800; cursor:pointer;">Se connecter</button>
        </form>
        <form id="codeForm" class="login-form" style="display:none; gap:10px; margin-top:14px;">
          <p class="login-subtitle" style="margin:0 0 6px; color:#7c8baa; font-size:14px; line-height:1.6;">Code envoyé par email. Entre le code reçu au format 1234-5678.</p>
          <input id="loginCode" type="text" placeholder="Code 1234-5678" inputmode="numeric" autocomplete="one-time-code" style="width:100%; padding:14px 16px; border-radius:10px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); color:#eef2ff; outline:none;" />
          <button id="codeSubmit" type="submit" class="login-submit" style="width:100%; padding:14px 16px; border:0; border-radius:10px; background:#5bc8ff; color:#03101e; font-weight:800; cursor:pointer;">Valider le code</button>
          <button id="restartLogin" type="button" class="login-submit" style="width:100%; padding:14px 16px; border:1px solid rgba(255,255,255,.08); border-radius:10px; background:transparent; color:#7c8baa; font-weight:800; cursor:pointer;">Recommencer</button>
        </form>
        <p id="loginError" class="login-error" style="min-height:20px; margin:12px 0 0; color:#ff5f5f; font-size:13px;"></p>
        <a href="/" class="login-back" style="display:inline-block; margin-top:12px; color:#7c8baa; font-size:13px;">← Retour à l’accueil</a>
      </div>
    </section>
  `;

  document.body.appendChild(route);
}

function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle('active', visible);
  el.classList.toggle('route-hidden', !visible);
}

async function hasAdminSession() {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) return false;

    const data = await response.json().catch(() => ({}));
    return data?.authenticated === true;
  } catch {
    return false;
  }
}

async function bootRoutes() {
  if (isConnexionRoute) {
    if (await hasAdminSession()) {
      window.location.href = '/app';
      return;
    }

    ensureLoginRoute();
    const currentLoginRoute = $('loginRoute') || loginRoute;

    document.title = 'Connexion — Qyraze';
    setVisible(marketingPage, false);
    setVisible(appRoute, false);
    setVisible(currentLoginRoute, true);
    return;
  }

  if (isAppRoute) {
    setVisible(marketingPage, false);
    setVisible(loginRoute, false);
    setVisible(appRoute, false);

    const authenticated = await hasAdminSession();

    if (!authenticated) {
      window.location.href = '/connexion';
      return;
    }

    document.title = 'Admin — Qyraze';
    setVisible(appRoute, true);
    return;
  }

  document.title = 'Qyraze — Une priorité claire chaque matin';
  setVisible(marketingPage, true);
  setVisible(loginRoute, false);
  setVisible(appRoute, false);
}

function getOptionalValue(id) {
  const el = $(id);
  return el ? el.value.trim() : '';
}

function getLeadPayload() {
  return {
    email: getOptionalValue('ctaEmail').toLowerCase(),
    name: getOptionalValue('leadName'),
    instagram: getOptionalValue('leadInstagram'),
    linkedin: getOptionalValue('leadLinkedin'),
    business: getOptionalValue('leadBusiness'),
    goal: getOptionalValue('leadGoal'),
  };
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showCtaSuccess(message) {
  const ctaForm = $('ctaForm');
  const ctaSuccess = $('ctaSuccess');

  if (ctaForm) ctaForm.style.display = 'none';

  if (ctaSuccess) {
    ctaSuccess.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
        <circle cx="8" cy="8" r="7.5" stroke="#3dd68c" stroke-opacity=".6"/>
        <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#3dd68c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      ${message}
    `;
    ctaSuccess.classList.add('visible');
  }

  const toastEl = document.getElementById('toast');
  const toastText = toastEl?.querySelector('.toast-text');

  if (toastEl && toastText) {
    toastText.textContent = message;
    toastEl.style.display = 'flex';
    toastEl.style.opacity = '1';
  }
}

function bootCta() {
  const ctaForm = $('ctaForm');
  const ctaEmail = $('ctaEmail');
  const ctaBtn = $('ctaBtn');

  if (!ctaBtn || !ctaEmail) return;

  ctaBtn.addEventListener('click', async () => {
    const payload = getLeadPayload();

    if (!payload.email || !isValidEmail(payload.email)) {
      ctaEmail.focus();
      ctaEmail.setCustomValidity('Email invalide');
      ctaEmail.reportValidity();
      return;
    }

    ctaEmail.setCustomValidity('');
    ctaBtn.disabled = true;
    ctaBtn.textContent = 'Analyse en cours...';

    let data = null;

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 409) {
          showCtaSuccess("Cet email est déjà enregistré. Si tu n'as pas encore confirmé ton inscription, vérifie ta boîte mail. Sinon, tu es déjà inscrit et tu recevras les prochains emails Qyraze.");
          return;
        }

        throw new Error(data?.error || 'Impossible d’enregistrer la demande pour le moment.');
      }

      showCtaSuccess('C’est noté. Vérifie ta boîte mail pour confirmer ton inscription.');

      if (ctaForm) ctaForm.reset?.();
    } catch (error) {
      console.error('Erreur inscription Qyraze :', error);
      ctaEmail.focus();
      ctaEmail.setCustomValidity(data?.error || 'Impossible d’enregistrer l’email pour le moment.');
      ctaEmail.reportValidity();
    } finally {
      ctaBtn.disabled = false;
      ctaBtn.textContent = 'Recevoir ma première priorité →';
    }
  });
}

function showVerificationMessage() {
  const params = new URLSearchParams(window.location.search);
  const verified = params.get('verified');
  const confirmationSection = $('confirmationSection');

  if (!verified) return;

  setVisible(marketingPage, true);
  setVisible(loginRoute, false);
  setVisible(appRoute, false);

  if (verified === 'true') {
    showCtaSuccess('Ton email a bien été confirmé. Tu es maintenant inscrit sur Qyraze.');
    if (confirmationSection) {
      confirmationSection.classList.remove('route-hidden');
      confirmationSection.classList.add('active');
    }
  }

  if (verified === 'already') {
    showCtaSuccess('Cet email a déjà été validé. Ton inscription Qyraze est bien confirmée.');
    if (confirmationSection) {
      confirmationSection.classList.remove('route-hidden');
      confirmationSection.classList.add('active');
    }
  }

  if (verified === 'expired') {
    showCtaSuccess('Ce lien a expiré. Inscris-toi à nouveau pour recevoir un nouveau lien de confirmation.');
    if (confirmationSection) {
      confirmationSection.classList.remove('route-hidden');
      confirmationSection.classList.add('active');
    }
  }

  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`;
  window.history.replaceState({}, document.title, cleanUrl);

  const targetSection = confirmationSection && !confirmationSection.classList.contains('route-hidden')
    ? confirmationSection
    : $('cta');

  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function showUnsubscribeMessage() {
  const params = new URLSearchParams(window.location.search);
  const unsubscribed = params.get('unsubscribed');

  if (!unsubscribed) return;

  setVisible(marketingPage, true);
  setVisible(loginRoute, false);
  setVisible(appRoute, false);

  const messages = {
    true: 'Tu es bien désinscrit. Tu ne recevras plus d’emails Qyraze.',
    already: 'Tu étais déjà désinscrit. Tu ne recevras plus d’emails Qyraze.',
    invalid: 'Lien de désinscription invalide ou expiré.',
    deleted: 'Tes données ont déjà été supprimées. Tu ne recevras plus d’emails Qyraze.',
    error: 'Une erreur est survenue pendant la désinscription. Contacte contact@qyrazeos.fr si le problème continue.',
  };

  showCtaSuccess(messages[unsubscribed] || messages.error);

  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`;
  window.history.replaceState({}, document.title, cleanUrl);

  const targetSection = $('cta') || marketingPage;

  if (targetSection) {
    targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function bootLogin() {
  const loginForm = $('loginForm') || document.querySelector('#loginForm');
  const codeForm = $('codeForm') || document.querySelector('#codeForm');
  const loginEmail = $('loginEmail') || loginForm?.querySelector('input[type="email"]');
  const loginPassword = $('loginPassword') || loginForm?.querySelector('input[type="password"]');
  const loginCode = $('loginCode') || codeForm?.querySelector('input[type="text"]');
  const loginError = $('loginError') || document.querySelector('.login-error');
  const loginSubmit = $('loginSubmit') || loginForm?.querySelector('button[type="submit"], .login-submit');
  const codeSubmit = $('codeSubmit') || codeForm?.querySelector('button[type="submit"], .login-submit');
  const restartLogin = $('restartLogin') || codeForm?.querySelector('button[type="button"]');

  if (!loginForm || !loginEmail || !loginPassword) return;

  let currentChallenge = null;

  function showError(message) {
    if (loginError) {
      loginError.style.color = '#ff5f5f';
      loginError.textContent = message || 'Connexion impossible';
    } else {
      alert(message || 'Connexion impossible');
    }
  }

  function showSuccess(message) {
    if (loginError) {
      loginError.style.color = '#3dd68c';
      loginError.textContent = message;
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (loginError) loginError.textContent = '';
    if (loginSubmit) {
      loginSubmit.disabled = true;
      loginSubmit.textContent = 'Envoi du code...';
    }

    try {
      const startResponse = await fetch('/api/login-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.value.trim(),
          password: loginPassword.value,
        }),
      });

      const startData = await startResponse.json().catch(() => ({}));

      if (!startResponse.ok) {
        throw new Error(startData?.error || 'Connexion refusée');
      }

      currentChallenge = startData.challenge;
      loginForm.style.display = 'none';

      if (codeForm) {
        codeForm.style.display = 'grid';
      }

      if (loginCode) {
        loginCode.value = '';
        loginCode.focus();
      }

      showSuccess('Code envoyé. Vérifie ta boîte mail.');
    } catch (error) {
      showError(error.message || 'Connexion impossible');
    } finally {
      if (loginSubmit) {
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Se connecter';
      }
    }
  });

  if (codeForm && loginCode) {
    codeForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (loginError) loginError.textContent = '';
      if (codeSubmit) {
        codeSubmit.disabled = true;
        codeSubmit.textContent = 'Vérification...';
      }

      try {
        const code = loginCode.value.trim();

        if (!currentChallenge) {
          throw new Error('Session expirée. Recommence la connexion.');
        }

        if (!/^\d{4}-\d{4}$/.test(code)) {
          throw new Error('Format invalide. Exemple : 1234-5678');
        }

        const verifyResponse = await fetch('/api/login-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            challenge: currentChallenge,
            code,
          }),
        });

        const verifyData = await verifyResponse.json().catch(() => ({}));

        if (!verifyResponse.ok) {
          throw new Error(verifyData?.error || 'Code incorrect');
        }

        window.location.href = '/app';
      } catch (error) {
        showError(error.message || 'Connexion impossible');
      } finally {
        if (codeSubmit) {
          codeSubmit.disabled = false;
          codeSubmit.textContent = 'Valider le code';
        }
      }
    });
  }

  if (restartLogin) {
    restartLogin.addEventListener('click', () => {
      currentChallenge = null;

      if (loginCode) loginCode.value = '';
      if (loginPassword) loginPassword.value = '';
      if (loginError) loginError.textContent = '';
      if (codeForm) codeForm.style.display = 'none';

      loginForm.style.display = 'grid';
      loginPassword.focus();
    });
  }
}

const toastClose = document.getElementById('toastClose');
const toastEl = document.getElementById('toast');

if (toastClose && toastEl) {
  toastClose.addEventListener('click', () => {
    toastEl.style.opacity = '0';
    setTimeout(() => {
      toastEl.style.display = 'none';
      toastEl.style.opacity = '1';
    }, 200);
  });
}

bootRoutes();
bootCta();
bootLogin();
showVerificationMessage();
showUnsubscribeMessage();