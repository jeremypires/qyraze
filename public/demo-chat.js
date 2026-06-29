(function () {
  const PROFILES = [
    { id: 'jeremy', icon: '⭐', featured: true },
    { id: 'premium', icon: '👔' },
    { id: 'closer', icon: '🚀' },
    { id: 'companion', icon: '🌿' },
    { id: 'efficient', icon: '🍕' },
  ];

  const CALENDLY_URL = 'https://calendar.app.google/Tr3jnHzo7oHt8Ehd7';

  const HINTS = {
    en: {
      hot: 'Budget 800€, can we call tomorrow?',
      warm: 'Interested, maybe next month',
      cold: 'Just browsing, thanks',
    },
    fr: {
      hot: 'Budget 800€, on peut s\'appeler demain ?',
      warm: 'Intéressé, peut-être le mois prochain',
      cold: 'Je regarde seulement, merci',
    },
  };

  function lang() {
    return window.QyrazeI18n?.getLang?.() === 'fr' ? 'fr' : 'en';
  }

  function t(key) {
    return window.QyrazeDemoStrings?.[lang()]?.[key] ?? key;
  }

  function profileLabel(id) {
    return window.QyrazeDemoStrings?.[lang()]?.profiles?.[id]?.name ?? id;
  }

  function profileTagline(id) {
    return window.QyrazeDemoStrings?.[lang()]?.profiles?.[id]?.tagline ?? '';
  }

  function profileBadge(id) {
    return window.QyrazeDemoStrings?.[lang()]?.profiles?.[id]?.badge ?? '';
  }

  function statusLabel(status) {
    return t('status_' + status) || status;
  }

  const state = {
    profile: null,
    history: [],
    score: 0,
    status: 'new',
    open: false,
    loading: false,
    closed: false,
    lastAction: null,
  };

  let root, panel, fabEl, messagesEl, inputEl, formEl, scoreEl, statusEl, hintsEl, hintsLabelEl, profilesEl, scoreWrapEl, telegramRoot;

  function setCompactMode(compact) {
    if (panel) panel.classList.toggle('is-compact', compact);
    if (hintsEl) hintsEl.hidden = compact || state.closed;
    if (hintsLabelEl) hintsLabelEl.hidden = compact;
  }

  function syncInputState() {
    if (!inputEl || !formEl) return;
    const ready = !!state.profile && !state.closed && !state.loading;
    inputEl.disabled = !ready;
    formEl.querySelector('button').disabled = !ready;
    if (!state.profile) {
      inputEl.placeholder = t('pick_profile_placeholder');
    } else if (!state.closed) {
      inputEl.placeholder = t('placeholder');
    }
  }

  function setOpen(open) {
    state.open = open;
    if (panel) panel.hidden = !open;
    if (root) root.classList.toggle('is-open', open);
    if (fabEl) fabEl.hidden = open;
    if (open && messagesEl && messagesEl.childElementCount === 0) {
      if (state.profile) {
        resetConversation(state.profile);
      } else {
        showEmptyPrompt();
        syncInputState();
      }
    }
    if (open && !state.closed && state.profile) inputEl.focus();
  }

  function sleep(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  /** Research-backed delay — see packages/shared/src/reply-delay.ts */
  function computeReplyDelay(message, replyText, signals) {
    if (window.QyrazeReplyDelay && window.QyrazeReplyDelay.compute) {
      var exchanges = Math.floor(state.history.length / 2);
      return window.QyrazeReplyDelay.compute({
        inboundMessage: message,
        leadScore: state.score,
        exchangeCount: exchanges,
        replyLength: replyText ? replyText.length : 0,
        signals: signals || {},
      }).delayMs;
    }
    return 45000;
  }

  function showEmptyPrompt() {
    const el = document.createElement('div');
    el.className = 'demo-chat-empty';
    el.id = 'demoChatEmpty';
    el.textContent = t('empty_prompt');
    messagesEl.appendChild(el);
  }

  function clearEmptyPrompt() {
    const el = document.getElementById('demoChatEmpty');
    if (el) el.remove();
  }

  function showTypingIndicator() {
    const wrap = document.createElement('div');
    wrap.className = 'demo-chat-msg demo-chat-msg--assistant demo-chat-typing';
    wrap.innerHTML =
      '<div class="demo-chat-bubble">' +
      '<span class="demo-chat-typing-label">' + t('typing') + '</span>' +
      '<span class="demo-chat-typing-dots"><span></span><span></span><span></span></span>' +
      '</div>';
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function renderMessage(role, content, extraClass) {
    clearEmptyPrompt();
    const wrap = document.createElement('div');
    wrap.className = 'demo-chat-msg demo-chat-msg--' + role + (extraClass ? ' ' + extraClass : '');
    const bubble = document.createElement('div');
    bubble.className = 'demo-chat-bubble';
    bubble.textContent = content;
    wrap.appendChild(bubble);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return wrap;
  }

  function renderCalendlyCard(url) {
    const wrap = document.createElement('div');
    wrap.className = 'demo-chat-msg demo-chat-msg--assistant demo-chat-msg--card';
    wrap.innerHTML = `
      <div class="demo-chat-card">
        <div class="demo-chat-card-icon">📅</div>
        <div class="demo-chat-card-body">
          <strong>${t('calendar_title')}</strong>
          <p>${t('calendar_desc')}</p>
          <a href="${url}" target="_blank" rel="noopener" class="demo-chat-card-btn">${t('calendar_cta')}</a>
        </div>
      </div>
    `;
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTelegramNotification(data) {
    const name = data.prospectName || t('default_prospect');
    const summary = data.summary || t('default_summary');
    const score = data.score ?? state.score;
    const personality = profileLabel(state.profile);

    const toast = document.createElement('div');
    toast.className = 'demo-telegram-toast';
    toast.innerHTML = `
      <button type="button" class="demo-telegram-close" aria-label="Close">×</button>
      <div class="demo-telegram-header">
        <span class="demo-telegram-app">Telegram</span>
        <span class="demo-telegram-time">${t('telegram_now')}</span>
      </div>
      <div class="demo-telegram-bot">${t('telegram_bot')}</div>
      <div class="demo-telegram-to">${t('telegram_to')}</div>
      <div class="demo-telegram-body">
        <strong>🔥 ${t('telegram_title')}</strong>
        <p>${t('telegram_name')}: ${escapeHtml(name)}<br>
        ${t('telegram_platform')}: Instagram · ${escapeHtml(personality)}<br>
        ${t('telegram_score')}: ${score}/100</p>
        <p class="demo-telegram-summary">${t('telegram_summary')}: ${escapeHtml(summary)}</p>
      </div>
      <div class="demo-telegram-footer">${t('telegram_footer')}</div>
    `;

    toast.querySelector('.demo-telegram-close').addEventListener('click', () => toast.remove());
    telegramRoot.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    setTimeout(() => {
      toast.classList.remove('is-visible');
      setTimeout(() => toast.remove(), 400);
    }, 12000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateScoreUI(score, status) {
    state.score = score;
    state.status = status;
    if (scoreEl) scoreEl.style.width = score + '%';
    if (statusEl) {
      statusEl.textContent = statusLabel(status);
      statusEl.dataset.status = status;
    }
  }

  function setConversationClosed() {
    state.closed = true;
    inputEl.placeholder = t('closed_placeholder');
    if (hintsEl) hintsEl.hidden = true;
    if (hintsLabelEl) hintsLabelEl.hidden = true;
    setCompactMode(true);
    syncInputState();

    const banner = document.createElement('div');
    banner.className = 'demo-chat-ended';
    banner.textContent = t('conversation_ended');
    messagesEl.appendChild(banner);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function clearEndedState() {
    state.closed = false;
    state.lastAction = null;
    if (hintsEl) hintsEl.hidden = false;
    if (hintsLabelEl) hintsLabelEl.hidden = false;
    setCompactMode(state.history.length > 0);
    syncInputState();
  }

  function selectProfile(profileId) {
    if (state.loading || !profileId) return;
    resetConversation(profileId);
    if (state.open && inputEl) inputEl.focus();
  }

  function handleAction(data) {
    state.lastAction = data.action;

    if (data.action === 'notify_owner') {
      showTelegramNotification(data);
      setTimeout(setConversationClosed, 1500);
      return;
    }

    if (data.action === 'send_calendar') {
      renderCalendlyCard(data.calendarUrl || CALENDLY_URL);
      setTimeout(setConversationClosed, 800);
      return;
    }

    if (data.action === 'close') {
      setConversationClosed();
    }
  }

  function resetConversation(profileId) {
    state.profile = profileId;
    state.history = [];
    state.score = 0;
    state.status = 'new';
    clearEndedState();
    messagesEl.innerHTML = '';
    updateScoreUI(0, 'new');

    document.querySelectorAll('.demo-chat-profile').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.profile === profileId);
    });

    document.querySelectorAll('.demo-personality-card').forEach((card) => {
      card.classList.toggle('is-active', card.dataset.profile === profileId);
    });

    showEmptyPrompt();
    syncInputState();
  }

  async function fetchReply(message, historyBefore) {
    state.loading = true;
    syncInputState();
    clearEmptyPrompt();

    const started = Date.now();
    const typing = showTypingIndicator();

    try {
      const res = await fetch('/api/demo-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: state.profile,
          message,
          history: historyBefore,
          currentScore: state.score,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        await sleep(Math.max(0, 1200 - (Date.now() - started)));
        typing.remove();
        renderMessage('assistant', data.error || t('error'));
        return;
      }

      const delay =
        typeof data.delayMs === 'number'
          ? data.delayMs
          : computeReplyDelay(message, data.reply, data.signals);
      const elapsed = Date.now() - started;
      await sleep(Math.max(0, delay - elapsed));

      typing.remove();

      state.history.push({ role: 'user', content: message });
      state.history.push({ role: 'assistant', content: data.reply });
      renderMessage('assistant', data.reply);
      updateScoreUI(data.score ?? 0, data.status ?? 'qualifying');
      handleAction(data);
    } catch {
      typing.remove();
      renderMessage('assistant', t('error'));
    } finally {
      state.loading = false;
      syncInputState();
    }
  }

  async function sendMessage(text) {
    const message = text.trim();
    if (!message || state.loading || state.closed || !state.profile) return;

    setCompactMode(true);

    renderMessage('user', message);
    inputEl.value = '';
    await fetchReply(message, state.history);
    if (state.open && !state.closed) inputEl.focus();
  }

  function buildHints() {
    if (!hintsEl) return;
    const hints = HINTS[lang()];
    hintsEl.innerHTML = '';
    [
      { key: 'hot', label: t('hint_hot'), text: hints.hot },
      { key: 'warm', label: t('hint_warm'), text: hints.warm },
      { key: 'cold', label: t('hint_cold'), text: hints.cold },
    ].forEach((h) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-chat-hint demo-chat-hint--' + h.key;
      btn.title = h.label;
      btn.textContent = h.text;
      btn.addEventListener('click', () => sendMessage(h.text));
      hintsEl.appendChild(btn);
    });
  }

  function buildWidget() {
    root = document.createElement('div');
    root.className = 'demo-chat-root';
    root.innerHTML = `
      <button type="button" class="demo-chat-fab" id="demoChatFab" aria-label="Open demo chat">
        <span class="demo-chat-fab-icon">💬</span>
        <span class="demo-chat-fab-label" id="demoChatFabLabel"></span>
      </button>
      <div class="demo-chat-panel" id="demoChatPanel" hidden>
        <header class="demo-chat-header">
          <div>
            <div class="demo-chat-header-title" id="demoChatTitle"></div>
            <div class="demo-chat-header-sub" id="demoChatSub"></div>
          </div>
          <button type="button" class="demo-chat-close" id="demoChatClose" aria-label="Close">×</button>
        </header>
        <p class="demo-chat-profiles-label" id="demoChatProfilesLabel"></p>
        <div class="demo-chat-profiles" id="demoChatProfiles"></div>
        <div class="demo-chat-score" id="demoChatScoreWrap">
          <div class="demo-chat-score-label">
            <span id="demoChatScoreLabel"></span>
            <span class="demo-chat-status" id="demoChatStatus" data-status="new"></span>
          </div>
          <div class="demo-chat-score-bar"><div class="demo-chat-score-fill" id="demoChatScoreFill"></div></div>
        </div>
        <p class="demo-chat-hints-label" id="demoChatHintsLabel"></p>
        <div class="demo-chat-hints" id="demoChatHints"></div>
        <div class="demo-chat-messages" id="demoChatMessages"></div>
        <form class="demo-chat-form" id="demoChatForm">
          <input type="text" id="demoChatInput" maxlength="500" autocomplete="off" />
          <button type="submit" id="demoChatSend"></button>
        </form>
        <p class="demo-chat-note" id="demoChatNote"></p>
      </div>
    `;
    document.body.appendChild(root);

    telegramRoot = document.createElement('div');
    telegramRoot.className = 'demo-telegram-root';
    telegramRoot.setAttribute('aria-live', 'polite');
    document.body.appendChild(telegramRoot);

    panel = document.getElementById('demoChatPanel');
    fabEl = document.getElementById('demoChatFab');
    messagesEl = document.getElementById('demoChatMessages');
    inputEl = document.getElementById('demoChatInput');
    formEl = document.getElementById('demoChatForm');
    scoreEl = document.getElementById('demoChatScoreFill');
    statusEl = document.getElementById('demoChatStatus');
    hintsEl = document.getElementById('demoChatHints');
    hintsLabelEl = document.getElementById('demoChatHintsLabel');
    scoreWrapEl = document.getElementById('demoChatScoreWrap');
    profilesEl = document.getElementById('demoChatProfiles');

    PROFILES.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'demo-chat-profile' + (p.featured ? ' demo-chat-profile--featured' : '');
      btn.dataset.profile = p.id;
      btn.title = profileTagline(p.id);
      btn.innerHTML =
        '<span class="demo-chat-profile-icon">' +
        p.icon +
        '</span>' +
        '<span class="demo-chat-profile-name">' +
        profileLabel(p.id) +
        '</span>';
      btn.addEventListener('click', () => selectProfile(p.id));
      profilesEl.appendChild(btn);
    });

    fabEl.addEventListener('click', () => {
      setOpen(true);
    });

    document.getElementById('demoChatClose').addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      sendMessage(inputEl.value);
    });

    applyLabels();
  }

  function applyLabels() {
    if (!root) return;
    document.getElementById('demoChatFabLabel').textContent = t('fab');
    document.getElementById('demoChatTitle').textContent = t('title');
    document.getElementById('demoChatSub').textContent = t('subtitle');
    document.getElementById('demoChatProfilesLabel').textContent = t('profiles_label');
    document.getElementById('demoChatScoreLabel').textContent = t('score');
    document.getElementById('demoChatHintsLabel').textContent = t('hints_label');
    document.getElementById('demoChatSend').textContent = t('send');
    document.getElementById('demoChatNote').textContent = t('note');
    document.querySelectorAll('.demo-chat-profile').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.profile === state.profile);
      btn.title = profileTagline(btn.dataset.profile);
      const nameEl = btn.querySelector('.demo-chat-profile-name');
      if (nameEl) nameEl.textContent = profileLabel(btn.dataset.profile);
    });
    if (statusEl) statusEl.textContent = statusLabel(state.status);
    const emptyEl = document.getElementById('demoChatEmpty');
    if (emptyEl) emptyEl.textContent = t('empty_prompt');
    buildHints();

    ['demo-section-kicker', 'demo-section-title', 'demo-section-sub'].forEach((id, i) => {
      const el = document.getElementById(id);
      const keys = ['section_kicker', 'section_title', 'section_sub'];
      if (el) el.textContent = t(keys[i]);
    });

    const profilesLabel = document.getElementById('demo-profiles-label');
    if (profilesLabel) profilesLabel.textContent = t('profiles_label');

    const personalityGrid = document.getElementById('demo-personalities');
    if (personalityGrid) {
      personalityGrid.querySelectorAll('[data-profile]').forEach((card) => {
        const id = card.dataset.profile;
        const name = card.querySelector('.demo-personality-name');
        const tagline = card.querySelector('.demo-personality-tagline');
        const badge = card.querySelector('.demo-personality-badge');
        if (name) name.textContent = profileLabel(id);
        if (tagline) tagline.textContent = profileTagline(id);
        if (badge) badge.textContent = profileBadge(id);
        card.classList.toggle('is-active', id === state.profile);
      });
    }

    const outcomes = document.getElementById('demo-outcomes');
    if (outcomes) {
      outcomes.querySelectorAll('[data-outcome]').forEach((card) => {
        const key = card.dataset.outcome;
        const title = card.querySelector('.demo-outcome-title');
        const desc = card.querySelector('.demo-outcome-desc');
        if (title) title.textContent = t('outcome_' + key + '_title');
        if (desc) desc.textContent = t('outcome_' + key + '_desc');
      });
    }

    const openBtn = document.getElementById('demo-section-cta');
    if (openBtn) openBtn.textContent = t('section_cta');
    syncInputState();
  }

  function bindPersonalityCards() {
    document.querySelectorAll('[data-profile][data-open-demo]').forEach((el) => {
      el.addEventListener('click', () => {
        if (!panel) return;
        setOpen(true);
        selectProfile(el.dataset.profile);
      });
    });
  }

  function bindSectionCta() {
    const cta = document.getElementById('demo-section-cta');
    if (!cta) return;
    cta.addEventListener('click', () => {
      setOpen(true);
      panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  window.QyrazeDemoChat = {
    refresh: applyLabels,
    open: function () {
      if (!panel) return;
      setOpen(true);
    },
    openWithProfile: function (profileId) {
      if (!panel) return;
      setOpen(true);
      selectProfile(profileId || 'jeremy');
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (!document.getElementById('marketingPage')) return;
      buildWidget();
      bindSectionCta();
      bindPersonalityCards();
    });
  } else if (document.getElementById('marketingPage')) {
    buildWidget();
    bindSectionCta();
    bindPersonalityCards();
  }

  document.addEventListener('qyraze:lang', function () {
    applyLabels();
    syncInputState();
    if (panel && !panel.hidden && messagesEl.childElementCount > 0 && !state.loading && state.profile) {
      resetConversation(state.profile);
    }
  });
})();
