import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let supabase = null;
let calendarViewMode = 'week';
let cachedGoogleEvents = [];

async function initSupabase() {
  if (supabase) return supabase;
  const config = await fetch('/api/config').then(r => r.json());
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    throw new Error('Configuration Supabase manquante');
  }
  supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  return supabase;
}

const path = window.location.pathname;
const isConnexionRoute = path === '/connexion';
const isAppRoute = path === '/app';
const $ = id => document.getElementById(id);

const marketingPage = $('marketingPage');
const loginRoute = $('loginRoute');
const appRoute = $('appRoute');
const loginForm = $('loginForm');
const loginEmail = $('loginEmail');
const loginPassword = $('loginPassword');
const loginError = $('loginError');
const loginSubmit = $('loginSubmit');
const logoutBtn = $('logoutBtn');
const appUserEmail = $('appUserEmail');
const connectGoogleBtn = $('connectGoogleBtn');
const disconnectGoogleBtn = $('disconnectGoogleBtn');
const googleStatusText = $('googleStatusText');
const googleEventsList = $('googleEventsList');
const calendarWeekBtn = $('calendarWeekBtn');
const calendarDayBtn = $('calendarDayBtn');
const calendarRangeLabel = $('calendarRangeLabel');

if (isConnexionRoute || isAppRoute) {
  document.title = isConnexionRoute ? 'Connexion — Qyraze' : 'App — Qyraze';
  marketingPage?.classList.add('route-hidden');
}

const ctaForm = $('ctaForm');
const ctaEmail = $('ctaEmail');
const ctaBtn = $('ctaBtn');
const ctaSuccess = $('ctaSuccess');

ctaBtn?.addEventListener('click', async () => {
  const email = ctaEmail?.value.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    ctaEmail?.focus();
    ctaEmail?.setCustomValidity('Email invalide');
    ctaEmail?.reportValidity();
    return;
  }

  ctaEmail?.setCustomValidity('');
  ctaBtn.disabled = true;
  ctaBtn.textContent = 'Enregistrement...';

  try {
    await initSupabase();

    const { error } = await supabase
      .from('waitlist_emails')
      .insert([{ email }]);

    if (error) {
      if (error.code === '23505') {
        ctaForm.style.display = 'none';
        ctaSuccess.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
            <circle cx="8" cy="8" r="7.5" stroke="#3dd68c" stroke-opacity=".6"/>
            <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#3dd68c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Cet email est déjà enregistré sur la liste.
        `;
        ctaSuccess.classList.add('visible');
        return;
      }

      throw error;
    }

    ctaForm.style.display = 'none';
    ctaSuccess.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0">
        <circle cx="8" cy="8" r="7.5" stroke="#3dd68c" stroke-opacity=".6"/>
        <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#3dd68c" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Tu es sur la liste ! On te contacte dès l'ouverture de la bêta.
    `;
    ctaSuccess.classList.add('visible');
  } catch (error) {
    console.error('Erreur waitlist:', error);
    ctaEmail?.focus();
    ctaEmail?.setCustomValidity("Impossible d'enregistrer l'email pour le moment.");
    ctaEmail?.reportValidity();
  } finally {
    ctaBtn.disabled = false;
    ctaBtn.textContent = 'Rejoindre →';
  }
});

const fmtHM = d =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(d);

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

const addDays = (d, n) => {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const hoursArr = () => Array.from({ length: 13 }, (_, i) => i + 11);

const buildGridLines = () =>
  hoursArr()
    .map((_, i) => `<div class="calendar-grid-line" style="top:${i * 60}px"></div>`)
    .join('');

const buildTimeCol = () =>
  `<div class="calendar-time-column">${
    hoursArr()
      .map(
        (h, i) =>
          `<div class="calendar-time-slot" style="top:${i * 60}px">${String(h).padStart(2, '0')}:00</div>`
      )
      .join('')
  }</div>`;

function normalizeEv(ev) {
  const isAllDay = !!ev.start?.date && !ev.start?.dateTime;
  const start = new Date(ev.start?.dateTime || ev.start?.date);
  let end = new Date(ev.end?.dateTime || ev.end?.date || ev.start?.dateTime || ev.start?.date);

  if (isAllDay) {
    end = new Date(start);
    end.setHours(23, 59, 59, 999);
  }

  return {
    summary: ev.summary || 'Événement sans titre',
    location: ev.location || '',
    start,
    end,
    isAllDay,
  };
}

function evBlock(ev) {
  const sh = ev.start.getHours() + ev.start.getMinutes() / 60;
  const eh = ev.end.getHours() + ev.end.getMinutes() / 60;
  const vs = Math.max(11, sh);
  const ve = Math.min(24, Math.max(vs + 0.25, eh));
  const top = (vs - 11) * 60;
  const height = Math.max(42, (ve - vs) * 60);
  const loc = ev.location ? `<div class="calendar-event-meta">${ev.location}</div>` : '';

  return `<div class="calendar-event-block" style="top:${top}px;height:${height}px;">
    <div class="calendar-event-title">${ev.summary}</div>
    <div class="calendar-event-meta">${fmtHM(ev.start)} → ${fmtHM(ev.end)}</div>${loc}
  </div>`;
}

const updateViewBtns = () => {
  calendarWeekBtn?.classList.toggle('active', calendarViewMode === 'week');
  calendarDayBtn?.classList.toggle('active', calendarViewMode === 'day');
};

function sessionHasGoogle(session) {
  const providers = session?.user?.app_metadata?.providers || [];
  const identities = session?.user?.identities || [];
  return providers.includes('google') || identities.some(identity => identity.provider === 'google');
}

function syncGoogleButtons(isConnected) {
  if (connectGoogleBtn) {
    connectGoogleBtn.style.display = isConnected ? 'none' : 'inline-flex';
  }
  if (disconnectGoogleBtn) {
    disconnectGoogleBtn.style.display = isConnected ? 'inline-flex' : 'none';
  }
}

function persistGoogleProviderToken(session) {
  const providerToken = session?.provider_token;
  if (providerToken) {
    localStorage.setItem('google_provider_token', providerToken);
  }
}

function getStoredGoogleProviderToken() {
  return localStorage.getItem('google_provider_token');
}

function clearStoredGoogleProviderToken() {
  localStorage.removeItem('google_provider_token');
}

function markGoogleCalendarDisconnected() {
  localStorage.setItem('google_calendar_disabled', '1');
}

function clearGoogleCalendarDisconnected() {
  localStorage.removeItem('google_calendar_disabled');
}

function isGoogleCalendarDisconnected() {
  return localStorage.getItem('google_calendar_disabled') === '1';
}

function renderWeek(events) {
  const ws = startOfWeek(startOfToday());
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  if (calendarRangeLabel) {
    calendarRangeLabel.textContent = `Semaine du ${ws.toLocaleDateString('fr-FR')} au ${addDays(ws, 6).toLocaleDateString('fr-FR')}`;
  }

  const norm = events.map(normalizeEv);
  const allDay = norm.filter(e => e.isAllDay);
  const timed = norm.filter(e => !e.isAllDay);

  const header = `<div class="calendar-agenda-header week"><div class="calendar-agenda-head-cell"></div>${
    days
      .map(
        d => `<div class="calendar-agenda-head-cell">
      <div class="calendar-day-label">${d.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
      <div class="calendar-day-date">${d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</div>
    </div>`
      )
      .join('')
  }</div>`;

  const allDayRow = allDay.length
    ? `<div class="calendar-all-day-row">${allDay
        .map(e => `<div class="calendar-all-day-chip">${e.summary}</div>`)
        .join('')}</div>`
    : '';

  const body = `<div class="calendar-agenda-body week">${buildTimeCol()}${
    days
      .map(
        d => `<div class="calendar-day-column">
      <div class="calendar-grid-lines">${buildGridLines()}</div>
      <div class="calendar-events-layer">${timed.filter(e => sameDay(e.start, d)).map(evBlock).join('')}</div>
    </div>`
      )
      .join('')
  }</div>`;

  googleEventsList.innerHTML = `<div class="calendar-agenda-week">${header}${allDayRow}${body}</div>`;
}

function renderDay(events) {
  const today = startOfToday();
  const norm = events.map(normalizeEv).filter(e => sameDay(e.start, today));
  const allDay = norm.filter(e => e.isAllDay);
  const timed = norm.filter(e => !e.isAllDay);

  if (calendarRangeLabel) {
    calendarRangeLabel.textContent = `Vue du ${today.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long'
    })}`;
  }

  const header = `<div class="calendar-agenda-header day"><div class="calendar-agenda-head-cell"></div>
    <div class="calendar-agenda-head-cell">
      <div class="calendar-day-label">${today.toLocaleDateString('fr-FR', { weekday: 'long' })}</div>
      <div class="calendar-day-date">${today.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
    </div></div>`;

  const allDayRow = allDay.length
    ? `<div class="calendar-all-day-row">${allDay
        .map(e => `<div class="calendar-all-day-chip">${e.summary}</div>`)
        .join('')}</div>`
    : '';

  const body = `<div class="calendar-agenda-body day">${buildTimeCol()}
    <div class="calendar-day-column">
      <div class="calendar-grid-lines">${buildGridLines()}</div>
      <div class="calendar-events-layer">${timed.map(evBlock).join('')}</div>
    </div></div>`;

  googleEventsList.innerHTML = `<div class="calendar-agenda-day">${header}${allDayRow}${body}</div>`;
}

function renderGoogleEvents(events) {
  if (!googleEventsList) return;

  cachedGoogleEvents = events || [];
  updateViewBtns();

  if (!cachedGoogleEvents.length) {
    googleEventsList.innerHTML = '<div class="calendar-empty">Aucun événement sur les 7 prochains jours.</div>';
    if (calendarRangeLabel) {
      calendarRangeLabel.textContent = 'Aucun événement à venir';
    }
    return;
  }

  if (calendarViewMode === 'day') {
    renderDay(cachedGoogleEvents);
  } else {
    renderWeek(cachedGoogleEvents);
  }
}

async function loadGoogleCalendarData() {
  if (!googleStatusText || !googleEventsList) return;

  const { data: { session } } = await supabase.auth.getSession();
  const hasGoogle = sessionHasGoogle(session) && !isGoogleCalendarDisconnected();
  syncGoogleButtons(hasGoogle);

  if (!hasGoogle) {
    googleStatusText.textContent = 'Google Calendar non connecté';
    googleStatusText.classList.remove('connected');
    googleEventsList.innerHTML = '<div class="calendar-empty">Connecte Google Calendar pour afficher les rendez-vous des 7 prochains jours.</div>';
    return;
  }

  const providerToken = session?.provider_token || getStoredGoogleProviderToken();

  if (!providerToken) {
    googleStatusText.textContent = 'Google connecté, mais token calendrier indisponible';
    googleStatusText.classList.add('connected');
    googleEventsList.innerHTML = '<div class="calendar-empty">Connexion Google détectée, mais aucun token Google Calendar n’a été trouvé dans la session.</div>';
    return;
  }

  try {
    const now = new Date();
    const inSevenDays = new Date();
    inSevenDays.setDate(inSevenDays.getDate() + 7);

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(inSevenDays.toISOString())}&singleEvents=true&orderBy=startTime&maxResults=20`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${providerToken}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error?.message || 'Erreur Google Calendar');
    }

    googleStatusText.textContent = 'Google Calendar connecté';
    googleStatusText.classList.add('connected');
    renderGoogleEvents(data.items || []);
  } catch (error) {
    console.error('Erreur Google Calendar:', error);
    googleStatusText.textContent = 'Erreur de synchronisation Google Calendar';
    googleStatusText.classList.remove('connected');
    googleEventsList.innerHTML = '<div class="calendar-empty">Impossible de charger les événements Google.</div>';
  }
}

async function bootAuth() {
  if (!isConnexionRoute && !isAppRoute) return;

  try {
    await initSupabase();
  } catch (err) {
    if (loginError) loginError.textContent = err.message;
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  console.log('SESSION SUPABASE', session);
  console.log('PROVIDER TOKEN', session?.provider_token);

  persistGoogleProviderToken(session);

  supabase.auth.onAuthStateChange((_event, nextSession) => {
    persistGoogleProviderToken(nextSession);
  });

  if (isConnexionRoute) {
    if (session) {
      window.location.href = '/app';
      return;
    }
    loginRoute?.classList.add('active');
  }

  if (isAppRoute) {
    if (!session) {
      window.location.href = '/connexion';
      return;
    }
    appRoute?.classList.add('active');
    if (appUserEmail) {
      appUserEmail.textContent = session.user?.email || '';
    }
    await loadGoogleCalendarData();
  }

  syncGoogleButtons(sessionHasGoogle(session) && !isGoogleCalendarDisconnected());

  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!supabase) return;

    if (loginError) loginError.textContent = '';
    if (loginSubmit) loginSubmit.disabled = true;

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.value.trim(),
      password: loginPassword.value,
    });

    if (loginSubmit) loginSubmit.disabled = false;

    if (error) {
      console.error('Erreur login complète:', error);
      if (loginError) {
        loginError.textContent = error.message || 'Identifiants incorrects.';
      }
      return;
    }

    window.location.href = '/app';
  });

  calendarWeekBtn?.addEventListener('click', () => {
    calendarViewMode = 'week';
    renderGoogleEvents(cachedGoogleEvents);
  });

  calendarDayBtn?.addEventListener('click', () => {
    calendarViewMode = 'day';
    renderGoogleEvents(cachedGoogleEvents);
  });

  connectGoogleBtn?.addEventListener('click', async () => {
    if (!supabase) return;

    if (googleStatusText) {
      googleStatusText.textContent = 'Connexion Google en cours...';
      googleStatusText.classList.remove('connected');
    }

    clearGoogleCalendarDisconnected();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/app`,
        scopes: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error && googleStatusText) {
      console.error('Erreur connexion Google:', error);
      googleStatusText.textContent = 'Impossible de démarrer la connexion Google.';
    }
  });

  disconnectGoogleBtn?.addEventListener('click', async () => {
    markGoogleCalendarDisconnected();
    clearStoredGoogleProviderToken();
    syncGoogleButtons(false);

    if (googleStatusText) {
      googleStatusText.textContent = 'Google Calendar déconnecté';
      googleStatusText.classList.remove('connected');
    }

    if (googleEventsList) {
      googleEventsList.innerHTML = '<div class="calendar-empty">Google Calendar a été déconnecté pour cette session. Clique sur « Connecter Google » pour le réactiver.</div>';
    }

    if (calendarRangeLabel) {
      calendarRangeLabel.textContent = 'Google Calendar déconnecté';
    }
  });

  logoutBtn?.addEventListener('click', async () => {
    clearStoredGoogleProviderToken();
    clearGoogleCalendarDisconnected();
    await supabase.auth.signOut();
    window.location.href = '/connexion';
  });
}

bootAuth();