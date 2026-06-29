(function () {
  const STORAGE_KEY = 'qyraze_lang';
  const DEFAULT_LANG = 'en';

  const T = {
    en: {
      meta: {
        title: 'Qyraze | Your personal partner for business growth',
        description: 'We help entrepreneurs save time, get organized, and grow with tailored solutions and long-term human support.',
        ogTitle: 'Qyraze — Your optimization partner',
        ogDescription: 'Tailored solutions for your business, with long-term human support.',
      },
      cookie: {
        title: 'This site uses cookies',
        text: 'We use Google Analytics to measure traffic. Enabled only with your consent.',
        learnMore: 'Learn more',
        refuse: 'Decline',
        accept: 'Accept',
      },
      nav: {
        home: 'Home',
        solutions: 'Solutions',
        method: 'How it works',
        demo: 'Demo',
        work: 'Examples',
        about: 'About',
        contact: 'Contact',
      },
      hero: {
        eyebrow: 'Your personal partner · Small businesses',
        title: 'Less admin. More growth.',
        audience: 'Shop owners · Freelancers · SMBs · Consultants',
        copy: 'We help freelancers, shop owners, and small businesses save time with simple tools, better organization, and human support.',
        cta: 'Free diagnostic',
        mission: 'We don\u2019t sell tools. We help entrepreneurs build a business that is simpler, more efficient, and more enjoyable to run.',
        photoAlt: 'Jeremy Pereira Pires — Founder of Qyraze',
        trust: ['🇫🇷 France', '🇲🇾 Malaysia', '🤝 Human support', '✦ Tailored solutions'],
        proof: ['10+ projects completed', 'France & Malaysia', 'Long-term support'],
        workPhotoAlt: 'Jeremy Pereira Pires working on a client project',
      },
      positioning: {
        notTitle: 'What Qyraze is not',
        yesTitle: 'What Qyraze is',
        not: ['Web agency', 'Tech agency', 'SaaS vendor', 'Freelancer'],
        yes: ['Optimization partner', 'Tailored solutions', 'Human support', 'Time saved', 'Growth', 'Simplicity'],
      },
      problem: {
        kicker: 'The reality',
        title: 'You spend your days managing instead of growing.',
        items: ['Too many tools', 'Too many repetitive tasks', 'Scattered information', 'Lack of follow-up', 'Wasted time'],
      },
      solutions: {
        kicker: 'Solutions',
        title: 'We help simplify your day-to-day.',
        cards: [
          { title: 'Websites', desc: 'We help you present your business with clarity and confidence.' },
          { title: 'Custom tools', desc: 'We work with you to shape tools that fit how you operate.' },
          { title: 'Automation', desc: 'We help you spend less time on repetitive tasks.' },
          { title: 'Ongoing support', desc: 'We stay by your side to improve results over time.' },
        ],
      },
      method: {
        kicker: 'How it works',
        title: 'From first call to ongoing support',
        cta: 'Book your free diagnostic',
        steps: [
          { title: 'Free diagnostic', desc: '30 minutes' },
          { title: 'Action plan', desc: 'Full audit' },
          { title: 'Implementation', desc: 'Website, tools, organization' },
          { title: 'Ongoing support', desc: 'Monthly follow-up' },
        ],
      },
      about: {
        kicker: 'About',
        title: 'Why I created Qyraze',
        p1: 'After working with dozens of small businesses, I kept seeing the same thing: companies don\u2019t need more tools.',
        p2: 'They need simple solutions, adapted to their reality — and a partner who supports them over time.',
        p3: 'Qyraze was born from that belief.',
      },
      work: {
        kicker: 'Examples',
        title: 'Real work with real businesses.',
        projects: [
          { name: 'Sandjo Pizza', items: ['Online ordering website', 'Simplified order management', 'Daily sales tracking'] },
          { name: 'Jiwa Voyage', items: ['Digital guide sales', 'Automated client journey', 'Appointment booking'] },
          { name: 'Jeremy', items: ['Instagram AI setter', 'Automatic lead qualification', 'Telegram alerts'] },
        ],
      },
      beforeAfter: {
        kicker: 'Before / After',
        title: 'What changes when we work together',
        beforeLabel: 'Before Qyraze',
        afterLabel: 'After Qyraze',
        before: ['15 tools', 'No follow-up', 'Manual work'],
        after: ['One workflow', 'Clear process', 'Time saved'],
      },
      contact: {
        kicker: 'Contact',
        title: 'Let\u2019s talk about your business.',
        sub: 'A 30-minute conversation is often enough to spot several ways to improve.',
        cta: 'Let\u2019s talk',
      },
      footer: {
        tagline: 'Your personal partner — not another agency.',
        location: 'France & Malaysia',
        legal: 'Legal notice',
        privacy: 'Privacy',
        terms: 'Terms',
      },
    },
    fr: {
      meta: {
        title: 'Qyraze | Votre partenaire personnel pour la croissance',
        description: 'Qyraze accompagne les entrepreneurs avec des solutions sur mesure, des outils adaptés et un suivi humain pour gagner du temps et développer leur activité.',
        ogTitle: 'Qyraze — Votre partenaire d\u2019optimisation',
        ogDescription: 'Des solutions adaptées à votre activité, avec un accompagnement humain sur le long terme.',
      },
      cookie: {
        title: 'Ce site utilise des cookies',
        text: 'Nous utilisons Google Analytics pour mesurer l\u2019audience. Activé uniquement avec votre consentement.',
        learnMore: 'En savoir plus',
        refuse: 'Refuser',
        accept: 'Accepter',
      },
      nav: {
        home: 'Accueil',
        solutions: 'Solutions',
        method: 'Comment ça marche',
        demo: 'Démo',
        work: 'Exemples',
        about: 'À propos',
        contact: 'Contact',
      },
      hero: {
        eyebrow: 'Votre partenaire personnel · TPE & PME',
        title: 'Moins de gestion. Plus de croissance.',
        audience: 'Commerçants · Indépendants · PME · Consultants',
        copy: 'Nous aidons les indépendants, commerçants et petites entreprises à gagner du temps grâce à des outils simples, une meilleure organisation et un accompagnement humain.',
        cta: 'Diagnostic gratuit',
        mission: 'Nous ne vendons pas des outils. Nous aidons les entrepreneurs à construire une entreprise plus simple, plus efficace et plus agréable à gérer.',
        photoAlt: 'Jérémy Pereira Pires — Fondateur de Qyraze',
        trust: ['🇫🇷 France', '🇲🇾 Malaisie', '🤝 Accompagnement humain', '✦ Solutions sur mesure'],
        proof: ['10+ projets livrés', 'France & Malaisie', 'Accompagnement long terme'],
        workPhotoAlt: 'Jérémy Pereira Pires en session de travail avec un client',
      },
      positioning: {
        notTitle: 'Ce que Qyraze n\u2019est pas',
        yesTitle: 'Ce que Qyraze est',
        not: ['Agence web', 'Agence tech', 'Vendeur de SaaS', 'Freelance'],
        yes: ['Partenaire d\u2019optimisation', 'Solutions sur mesure', 'Accompagnement humain', 'Gain de temps', 'Croissance', 'Simplicité'],
      },
      problem: {
        kicker: 'Le constat',
        title: 'Vous passez vos journées à gérer plutôt qu\u2019à développer.',
        items: ['Trop d\u2019outils', 'Trop de tâches répétitives', 'Informations dispersées', 'Manque de suivi', 'Temps perdu'],
      },
      solutions: {
        kicker: 'Solutions',
        title: 'Nous vous aidons à simplifier votre quotidien.',
        cards: [
          { title: 'Sites web', desc: 'Nous vous aidons à présenter votre activité avec clarté et confiance.' },
          { title: 'Outils sur mesure', desc: 'Nous travaillons avec vous pour créer des outils adaptés à votre façon de travailler.' },
          { title: 'Automatisation', desc: 'Nous vous aidons à passer moins de temps sur les tâches répétitives.' },
          { title: 'Suivi', desc: 'Nous restons à vos côtés pour améliorer les résultats dans le temps.' },
        ],
      },
      method: {
        kicker: 'Comment ça fonctionne',
        title: 'Du diagnostic à l\u2019accompagnement',
        cta: 'Réserver votre diagnostic gratuit',
        steps: [
          { title: 'Diagnostic gratuit', desc: '30 minutes' },
          { title: 'Plan d\u2019action', desc: 'Audit complet' },
          { title: 'Mise en place', desc: 'Site, outils, organisation' },
          { title: 'Accompagnement', desc: 'Suivi mensuel' },
        ],
      },
      about: {
        kicker: 'À propos',
        title: 'Pourquoi j\u2019ai créé Qyraze ?',
        p1: 'Après avoir accompagné des dizaines de petites entreprises, j\u2019ai constaté la même chose : les entreprises n\u2019ont pas besoin de plus d\u2019outils.',
        p2: 'Elles ont besoin de solutions simples, adaptées à leur réalité — et d\u2019un partenaire qui les accompagne dans le temps.',
        p3: 'Qyraze est né de cette conviction.',
      },
      work: {
        kicker: 'Exemples',
        title: 'Du concret, avec de vraies entreprises.',
        projects: [
          { name: 'Sandjo Pizza', items: ['Site de commande en ligne', 'Gestion des commandes simplifiée', 'Suivi quotidien des ventes'] },
          { name: 'Jiwa Voyage', items: ['Vente de guides digitaux', 'Parcours client automatisé', 'Prise de rendez-vous'] },
          { name: 'Jeremy', items: ['Setter IA Instagram', 'Qualification automatique des leads', 'Alertes Telegram'] },
        ],
      },
      beforeAfter: {
        kicker: 'Avant / Après',
        title: 'Ce qui change quand nous travaillons ensemble',
        beforeLabel: 'Avant Qyraze',
        afterLabel: 'Après Qyraze',
        before: ['15 outils', 'Pas de suivi', 'Travail manuel'],
        after: ['Un seul flux', 'Process clair', 'Temps gagné'],
      },
      contact: {
        kicker: 'Contact',
        title: 'Parlons de votre entreprise.',
        sub: 'Un échange de 30 minutes suffit souvent pour identifier plusieurs pistes d\u2019amélioration.',
        cta: 'Discutons-en',
      },
      footer: {
        tagline: 'Votre partenaire personnel — pas une agence de plus.',
        location: 'France & Malaisie',
        legal: 'Mentions légales',
        privacy: 'Confidentialité',
        terms: 'CGU',
      },
    },
  };

  const linkT = {
    en: {
      meta: { title: 'Jeremy Pereira Pires — Qyraze', description: 'Optimization partner for small businesses. We help, we support, we stay by your side.' },
      profile: {
        title: 'Optimization partner',
        tagline: 'Less admin. More growth. Simple tools, better organization, human support.',
        footer: 'Qyraze · Transformation partner',
      },
      buttons: {
        calendar: 'Schedule a call',
        whatsapp: 'WhatsApp',
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        website: 'Qyraze website',
        email: 'Email',
      },
      navLabel: 'Links',
    },
    fr: {
      meta: { title: 'Jérémy Pereira Pires — Qyraze', description: 'Partenaire d\u2019optimisation pour petites entreprises. Nous accompagnons, nous restons à vos côtés.' },
      profile: {
        title: 'Partenaire d\u2019optimisation',
        tagline: 'Moins de gestion. Plus de croissance. Outils simples, organisation et accompagnement humain.',
        footer: 'Qyraze · Partenaire de transformation',
      },
      buttons: {
        calendar: 'Prendre rendez-vous',
        whatsapp: 'WhatsApp',
        instagram: 'Instagram',
        linkedin: 'LinkedIn',
        website: 'Site Qyraze',
        email: 'Email',
      },
      navLabel: 'Liens',
    },
  };

  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'fr' ? 'fr' : DEFAULT_LANG;
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang === 'fr' ? 'fr' : 'en');
    applyLang(lang === 'fr' ? 'fr' : 'en');
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
  }

  function fillList(id, items) {
    const ul = document.getElementById(id);
    if (!ul || !items) return;
    const isBa = id.indexOf('ba-') === 0;
    ul.innerHTML = items.map(function (item) {
      return '<li>' + item + '</li>';
    }).join('');
  }

  function fillProblemList(items) {
    const ul = document.getElementById('problem-list');
    if (!ul) return;
    ul.innerHTML = items.map(function (item) {
      return '<li class="problem-item"><span>' + item + '</span></li>';
    }).join('');
  }

  function applyHome(lang) {
    const s = T[lang];
    if (!s) return;

    document.documentElement.lang = lang;
    document.title = s.meta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = s.meta.description;

    setText('cookie-title', s.cookie.title);
    setText('cookie-refuse', s.cookie.refuse);
    setText('cookie-accept', s.cookie.accept);
    const cookieText = document.getElementById('cookie-text');
    if (cookieText) {
      cookieText.innerHTML = s.cookie.text + ' <a href="/confidentialite">' + s.cookie.learnMore + '</a>';
    }

    setText('nav-home', s.nav.home);
    setText('nav-solutions', s.nav.solutions);
    setText('nav-method', s.nav.method);
    setText('nav-demo', s.nav.demo);
    setText('nav-work', s.nav.work);
    setText('nav-about', s.nav.about);
    setText('nav-contact', s.nav.contact);

    setText('hero-eyebrow', s.hero.eyebrow);
    setText('hero-title', s.hero.title);
    setText('hero-audience', s.hero.audience);
    setText('hero-copy', s.hero.copy);
    setText('hero-cta', s.hero.cta);
    setText('hero-mission', s.hero.mission);
    const heroImg = document.getElementById('hero-photo');
    if (heroImg) heroImg.alt = s.hero.photoAlt;
    if (s.hero.trust) {
      s.hero.trust.forEach(function (t, i) { setText('trust-' + i, t); });
    }
    if (s.hero.proof) {
      s.hero.proof.forEach(function (t, i) { setText('proof-' + i, t); });
    }
    const workPhoto = document.getElementById('about-work-photo');
    if (workPhoto && s.hero.workPhotoAlt) workPhoto.alt = s.hero.workPhotoAlt;

    setText('pos-not-title', s.positioning.notTitle);
    setText('pos-yes-title', s.positioning.yesTitle);
    fillList('pos-not-list', s.positioning.not);
    fillList('pos-yes-list', s.positioning.yes);

    setText('problem-kicker', s.problem.kicker);
    setText('problem-title', s.problem.title);
    fillProblemList(s.problem.items);

    setText('solutions-kicker', s.solutions.kicker);
    setText('solutions-title', s.solutions.title);
    s.solutions.cards.forEach(function (card, i) {
      setText('solution-title-' + i, card.title);
      setText('solution-desc-' + i, card.desc);
    });

    setText('method-kicker', s.method.kicker);
    setText('method-title', s.method.title);
    setText('method-cta', s.method.cta);
    s.method.steps.forEach(function (step, i) {
      setText('step-title-' + i, step.title);
      setText('step-desc-' + i, step.desc);
    });

    setText('about-kicker', s.about.kicker);
    setText('about-title', s.about.title);
    setText('about-p1', s.about.p1);
    setText('about-p2', s.about.p2);
    setText('about-p3', s.about.p3);

    setText('work-kicker', s.work.kicker);
    setText('work-title', s.work.title);
    s.work.projects.forEach(function (project, i) {
      setText('project-name-' + i, project.name);
      fillList('project-list-' + i, project.items);
    });

    if (s.beforeAfter) {
      setText('ba-kicker', s.beforeAfter.kicker);
      setText('ba-title', s.beforeAfter.title);
      setText('ba-before-label', s.beforeAfter.beforeLabel);
      setText('ba-after-label', s.beforeAfter.afterLabel);
      fillList('ba-before-list', s.beforeAfter.before);
      fillList('ba-after-list', s.beforeAfter.after);
    }

    setText('contact-kicker', s.contact.kicker);
    setText('contact-title', s.contact.title);
    setText('contact-sub', s.contact.sub);
    setText('contact-cta', s.contact.cta);

    setText('footer-tagline', s.footer.tagline);
    setText('footer-location', s.footer.location);
    setText('footer-legal', s.footer.legal);
    setText('footer-privacy', s.footer.privacy);
    setText('footer-terms', s.footer.terms);

    updateLangButtons(lang);
  }

  function applyLink(lang) {
    const s = linkT[lang];
    if (!s) return;

    document.documentElement.lang = lang;
    document.title = s.meta.title;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.content = s.meta.description;

    setText('profile-title', s.profile.title);
    setText('profile-tagline', s.profile.tagline);
    setText('profile-footer', s.profile.footer);

    const actions = document.getElementById('link-actions');
    if (actions) {
      actions.setAttribute('aria-label', s.navLabel);
      actions.querySelectorAll('[data-btn]').forEach(function (btn) {
        const key = btn.getAttribute('data-btn');
        const label = btn.querySelector('.link-btn-label');
        if (s.buttons[key] && label) label.textContent = s.buttons[key];
      });
    }

    updateLangButtons(lang);
  }

  function updateLangButtons(lang) {
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      const active = btn.getAttribute('data-lang') === lang;
      btn.classList.toggle('lang-btn--active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function applyLang(lang) {
    if (document.getElementById('marketingPage')) applyHome(lang);
    if (document.getElementById('link-page')) applyLink(lang);
    document.dispatchEvent(new CustomEvent('qyraze:lang', { detail: { lang: lang } }));
    if (window.QyrazeDemoChat?.refresh) window.QyrazeDemoChat.refresh();
  }

  function initLangSwitcher() {
    document.querySelectorAll('[data-lang]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLang(btn.getAttribute('data-lang'));
      });
    });
  }

  function initAboutWorkPhoto() {
    const img = document.getElementById('about-work-photo');
    const scene = document.getElementById('about-work-scene');
    if (!img || !scene) return;

    function showPhoto() {
      img.classList.remove('is-hidden');
      scene.classList.add('is-hidden');
      scene.setAttribute('aria-hidden', 'true');
    }

    function showScene() {
      img.classList.add('is-hidden');
      scene.classList.remove('is-hidden');
      scene.setAttribute('aria-hidden', 'false');
    }

    img.addEventListener('load', function () {
      if (img.naturalWidth > 0) showPhoto();
    });
    img.addEventListener('error', showScene);

    if (img.complete) {
      if (img.naturalWidth > 0) showPhoto();
      else showScene();
    }
  }

  window.QyrazeDemoStrings = {
    en: {
      fab: 'Try AI demo',
      title: 'Instagram DM demo',
      subtitle: 'Built by Jeremy Pereira Pires · Qyraze',
      score: 'Lead score',
      typing: 'Typing…',
      empty_prompt: 'Pick one of the 5 personalities above, then write as a prospect — or tap a suggestion below.',
      pick_profile_placeholder: 'Choose a personality above to start…',
      hints_label: 'Try a reply to see what happens:',
      hint_hot: 'Hot lead path',
      hint_warm: 'Warm lead path',
      hint_cold: 'Cold lead path',
      placeholder: 'Reply as a prospect…',
      closed_placeholder: 'Conversation ended',
      send: 'Send',
      note: 'Demo only — switch personality anytime. Simulates Instagram DMs + Telegram alert.',
      profiles_label: 'Choose who you talk to',
      error: 'Demo temporarily unavailable. Try again shortly.',
      section_kicker: 'Live demo',
      section_title: 'Find the personality that fits you',
      section_sub: 'Five distinct styles — start with Jeremy\u2019s personal assistant, or pick the tone that fits your brand. Chat as a prospect and watch the AI qualify (Telegram alert, booking link, or polite goodbye).',
      section_cta: 'Open the demo chat',
      status_new: 'New',
      status_qualifying: 'Qualifying',
      status_hot: 'Hot lead',
      status_lost: 'Closed',
      conversation_ended: 'Conversation ended',
      calendar_title: 'Book a slot',
      calendar_desc: 'The AI sends your calendar link to interested prospects.',
      calendar_cta: 'Open calendar (demo)',
      telegram_now: 'now',
      telegram_bot: 'Qyraze Setter Bot',
      telegram_to: '→ Jeremy Pereira Pires',
      telegram_title: 'Qualified lead',
      telegram_name: 'Name',
      telegram_platform: 'Platform',
      telegram_score: 'Score',
      telegram_summary: 'Summary',
      telegram_footer: '↑ Alert sent to Jeremy on Telegram',
      default_prospect: 'Prospect',
      default_summary: 'Interested, ready to move forward',
      outcome_hot_title: 'Hot lead',
      outcome_hot_desc: 'Score 70+ → instant Telegram alert to you',
      outcome_warm_title: 'Warm lead',
      outcome_warm_desc: 'Interested but not urgent → calendar link sent',
      outcome_cold_title: 'Not a fit',
      outcome_cold_desc: 'Low interest → polite goodbye, conversation closed',
      profiles: {
        jeremy: {
          name: 'Jeremy Pereira Pires',
          tagline: 'Chat with my personal assistant.',
          badge: 'My daily assistant',
        },
        premium: {
          name: 'Professional & Elegant',
          tagline: 'Premium, reassuring image.',
        },
        closer: {
          name: 'Dynamic & Sales-driven',
          tagline: 'Qualify fast, book appointments.',
        },
        companion: {
          name: 'Warm & Caring',
          tagline: 'Build lasting trust.',
        },
        efficient: {
          name: 'Simple & Efficient',
          tagline: 'Straight to the point, save time.',
        },
      },
    },
    fr: {
      fab: 'Démo IA',
      title: 'Démo DM Instagram',
      subtitle: 'Par Jeremy Pereira Pires · Qyraze',
      score: 'Score lead',
      typing: 'Écriture…',
      empty_prompt: 'Choisissez l\u2019une des 5 personnalités ci-dessus, puis écrivez comme un prospect — ou touchez une suggestion.',
      pick_profile_placeholder: 'Choisissez une personnalité pour commencer…',
      hints_label: 'Essayez une réponse pour voir le résultat :',
      hint_hot: 'Lead chaud',
      hint_warm: 'Lead tiède',
      hint_cold: 'Lead froid',
      placeholder: 'Répondez comme un prospect…',
      closed_placeholder: 'Conversation terminée',
      send: 'Envoyer',
      note: 'Démo uniquement — changez de personnalité à tout moment. Simule DM Instagram + alerte Telegram.',
      profiles_label: 'Choisissez avec qui discuter',
      error: 'Démo temporairement indisponible. Réessayez dans un instant.',
      section_kicker: 'Démo live',
      section_title: 'Trouvez la personnalité qui vous ressemble',
      section_sub: 'Cinq styles distincts — commencez par mon assistant personnel, ou choisissez le ton qui correspond à votre marque. Discutez comme un prospect et voyez l\u2019IA qualifier (alerte Telegram, lien RDV ou au revoir poli).',
      section_cta: 'Ouvrir le chat démo',
      status_new: 'Nouveau',
      status_qualifying: 'En cours',
      status_hot: 'Lead chaud',
      status_lost: 'Fermé',
      conversation_ended: 'Conversation terminée',
      calendar_title: 'Réserver un créneau',
      calendar_desc: 'L\u2019IA envoie votre lien agenda aux prospects intéressés.',
      calendar_cta: 'Ouvrir l\u2019agenda (démo)',
      telegram_now: 'maintenant',
      telegram_bot: 'Qyraze Setter Bot',
      telegram_to: '→ Jeremy Pereira Pires',
      telegram_title: 'Lead qualifié',
      telegram_name: 'Nom',
      telegram_platform: 'Plateforme',
      telegram_score: 'Score',
      telegram_summary: 'Résumé',
      telegram_footer: '↑ Alerte envoyée à Jeremy sur Telegram',
      default_prospect: 'Prospect',
      default_summary: 'Intéressé, prêt à avancer',
      outcome_hot_title: 'Lead brûlant',
      outcome_hot_desc: 'Score 70+ → alerte Telegram instantanée',
      outcome_warm_title: 'Lead tiède',
      outcome_warm_desc: 'Intéressé mais pas urgent → lien agenda envoyé',
      outcome_cold_title: 'Pas qualifié',
      outcome_cold_desc: 'Peu d\u2019intérêt → au revoir poli, conversation fermée',
      profiles: {
        jeremy: {
          name: 'Jeremy Pereira Pires',
          tagline: 'Discutez avec mon assistant personnel.',
          badge: 'Mon assistant au quotidien',
        },
        premium: {
          name: 'Professionnel & Élégant',
          tagline: 'Image haut de gamme et rassurante.',
        },
        closer: {
          name: 'Dynamique & Commercial',
          tagline: 'Qualifier vite, générer des RDV.',
        },
        companion: {
          name: 'Chaleureux & Bienveillant',
          tagline: 'Relation de confiance durable.',
        },
        efficient: {
          name: 'Simple & Efficace',
          tagline: 'Droit au but, gain de temps.',
        },
      },
    },
  };

  window.QyrazeI18n = {
    getLang: getLang,
    setLang: setLang,
    applyLang: applyLang,
    init: function () {
      const lang = getLang();
      applyLang(lang);
      initLangSwitcher();
      initAboutWorkPhoto();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.QyrazeI18n.init(); });
  } else {
    window.QyrazeI18n.init();
  }
})();
