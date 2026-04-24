const $ = id => document.getElementById(id);

const path = window.location.pathname;
const isConnexionRoute = path === '/connexion';
const isAppRoute = path === '/app';

const marketingPage = $('marketingPage');
const loginRoute = $('loginRoute');
const appRoute = $('appRoute');

function setVisible(el, visible) {
  if (!el) return;
  el.classList.toggle('active', visible);
  el.classList.toggle('route-hidden', !visible);
}

function hasAdminSession() {
  return sessionStorage.getItem('qyraze_admin_session') === 'true';
}

function bootRoutes() {
  if (isConnexionRoute) {
    if (hasAdminSession()) {
      window.location.href = '/app';
      return;
    }

    document.title = 'Connexion — Qyraze';
    setVisible(marketingPage, false);
    setVisible(appRoute, false);
    setVisible(loginRoute, true);
    return;
  }

  if (isAppRoute) {
    if (!hasAdminSession()) {
      window.location.href = '/connexion';
      return;
    }

    document.title = 'Admin — Qyraze';
    setVisible(marketingPage, false);
    setVisible(loginRoute, false);
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
  const loginForm = $('loginForm') || document.querySelector('.login-form');
  const loginEmail = $('loginEmail') || loginForm?.querySelector('input[type="email"]');
  const loginPassword = $('loginPassword') || loginForm?.querySelector('input[type="password"]');
  const loginError = $('loginError') || document.querySelector('.login-error');
  const loginSubmit = loginForm?.querySelector('button[type="submit"], .login-submit');

  if (!loginForm || !loginEmail || !loginPassword) return;

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

      const code = window.prompt('Entre le code reçu par email (format 1234-5678)');

      if (!code) {
        throw new Error('Code obligatoire');
      }

      if (loginSubmit) loginSubmit.textContent = 'Vérification...';

      const verifyResponse = await fetch('/api/login-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge: startData.challenge,
          code,
        }),
      });

      const verifyData = await verifyResponse.json().catch(() => ({}));

      if (!verifyResponse.ok) {
        throw new Error(verifyData?.error || 'Code incorrect');
      }

      sessionStorage.setItem('qyraze_admin_session', 'true');
      window.location.href = '/app';
    } catch (error) {
      if (loginError) {
        loginError.textContent = error.message || 'Connexion impossible';
      } else {
        alert(error.message || 'Connexion impossible');
      }
    } finally {
      if (loginSubmit) {
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Se connecter';
      }
    }
  });
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