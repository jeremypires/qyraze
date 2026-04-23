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

function bootRoutes() {
  if (isConnexionRoute) {
    document.title = 'Connexion — Qyraze';
    setVisible(marketingPage, false);
    setVisible(appRoute, false);
    setVisible(loginRoute, true);
    return;
  }

  if (isAppRoute) {
    document.title = 'Admin — Qyraze';
    setVisible(marketingPage, false);
    setVisible(loginRoute, false);
    setVisible(appRoute, true);
    return;
  }

  document.title = 'Qyraze — Analyse personnalisée pour ton business';
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

  if (!ctaSuccess) return;
  if (ctaForm) ctaForm.style.display = 'none';

  ctaSuccess.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
      <circle cx="8" cy="8" r="7.5" stroke="#3dd68c" stroke-opacity=".6"/>
      <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#3dd68c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    ${message}
  `;
  ctaSuccess.classList.add('visible');
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
          showCtaSuccess('Cet email est déjà enregistré. Tu recevras l’analyse sur cette adresse si elle est déjà en cours de traitement.');
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
      ctaBtn.textContent = 'Recevoir mon analyse →';
    }
  });
}

bootRoutes();
bootCta();
function showVerificationMessage() {
  const params = new URLSearchParams(window.location.search);
  const verified = params.get('verified');

  if (!verified) return;

  if (verified === 'true') {
    showCtaSuccess('Ton email a bien été confirmé. Tu es maintenant inscrit sur Qyraze.');
  }

  if (verified === 'already') {
    showCtaSuccess('Cet email a déjà été validé. Ton inscription Qyraze est bien confirmée.');
  }

  // clean URL (remove ?verified=...)
  const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.hash || ''}`;
  window.history.replaceState({}, document.title, cleanUrl);

  // scroll to CTA
  const ctaSection = $('cta');
  if (ctaSection) {
    ctaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
showVerificationMessage();