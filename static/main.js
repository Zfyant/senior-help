'use strict';
/*
Site JavaScript (Optional Enhancements)

Purpose:
- Placeholder for small UX improvements (e.g., mobile menu toggles, smooth scrolling tweaks).
- Keep logic minimal; most styling is handled via Tailwind utilities.

Maintenance:
- If you add interactive components, document them here.
- Avoid storing secrets; this is client-side code.
*/

document.addEventListener('DOMContentLoaded', () => {
  const gaId = document.body.getAttribute('data-ga-id') || '';
  const initGA = (id) => {
    if (!id) return;
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);} 
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', id);
  };
  initGA(gaId);

  const trackSearchEvent = (eventName, payload) => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, payload);
    }
  };
  const formNameInput = document.querySelector('#name');
  if (formNameInput) {
    // formNameInput.focus();
  }

  // Rotating placeholders for assistant search
  const searchInput = document.getElementById('assistant-search');
  const searchBtn = document.getElementById('assistant-search-btn');
  const searchResults = document.getElementById('search-results');
  const placeholders = ["'Print a photo'", "'Fix my sound'", "'Connect to Wi‑Fi'", "'Zoom call grandkids'"];
  let placeholderIndex = 0;
  if (searchInput) {
    searchInput.setAttribute('placeholder', `e.g., ${placeholders[placeholderIndex]}...`);
    setInterval(() => {
      placeholderIndex = (placeholderIndex + 1) % placeholders.length;
      searchInput.setAttribute('placeholder', `e.g., ${placeholders[placeholderIndex]}...`);
    }, 3000);
  }

  if (searchInput && searchBtn) {
    const runSearch = () => {
      const q = searchInput.value.trim();
      if (!q) { renderResults([]); return; }
      const res = filterHelp(q);
      renderResults(res);
      trackSearchEvent('assistant_search_submit', { query: q, results: res.length });
    };
    searchBtn.addEventListener('click', runSearch);
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runSearch();
    });
    let inputTimer;
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      const res = q ? filterHelp(q) : [];
      renderResults(res);
      clearTimeout(inputTimer);
      inputTimer = setTimeout(() => {
        if (q) trackSearchEvent('assistant_search_input', { query: q, results: res.length });
      }, 400);
    });
  }

  const helpDatabase = [
    { id: 'printer', title: 'Printer Issues', url: 'learn-printer.html', keywords: ['printer','print','paper','jam','driver','spooler','ink','cannot print'], content: 'Check connections, select correct printer, update drivers, and clear queue.' },
    { id: 'email', title: 'Email Issues', url: 'learn-email.html', keywords: ['email','gmail','outlook','yahoo','send','receive','login','password','imap','smtp'], content: 'Confirm credentials, check internet, verify server settings, and attachment limits.' },
    { id: 'wifi', title: 'Wi‑Fi Issues', url: 'learn-wifi.html', keywords: ['wifi','wi-fi','network','internet','router','signal','reconnect','no internet','firmware'], content: 'Restart network, improve router placement, update firmware, and test devices.' },
    { id: 'power', title: 'Device Frozen', url: 'learn-power.html', keywords: ['frozen','stuck','crash','restart','unresponsive','force restart','freeze'], content: 'Wait and close app, force restart, free space, and update system.' },
    { id: 'passwords', title: 'Password Security 101', url: 'learn-passwords.html', keywords: ['password','security','passcode','login','recovery','2fa','two factor'], content: 'Use passphrases, unique per site, set recovery options, enable 2‑factor.' },
    { id: 'cloud', title: 'Understanding The Cloud', url: 'learn-cloud.html', keywords: ['cloud','photos','icloud','google photos','onedrive','backup','storage'], content: 'Identify provider, check sync settings, access anywhere, and share safely.' },
    { id: 'iphone', title: 'iPhone Settings Explained', url: 'learn-iphone.html', keywords: ['iphone','ios','settings','text size','accessibility','sound','ringer','volume'], content: 'Adjust text size, ringer volume, accessibility, and notifications.' },
    { id: 'zoom', title: 'Zoom Calls with Grandkids', url: null, keywords: ['zoom','video call','grandkids','meeting','microphone','camera'], content: '<p>Install Zoom, sign in, and join with meeting ID. Check microphone and camera in settings, and enable audio on join.</p>' },
    { id: 'volume', title: 'Volume Settings', url: null, keywords: ['volume','sound','audio','mute','can\'t hear','cant hear','speaker'], content: '<p>Increase system volume, ensure device is not muted, check output device, and test with a sample sound.</p>' }
  ];

  const norm = (s) => s.toLowerCase();
  const filterHelp = (query) => {
    const q = norm(query);
    return helpDatabase.filter((item) => {
      if (norm(item.title).includes(q)) return true;
      return item.keywords.some((k) => norm(k).includes(q) || q.includes(norm(k)));
    }).slice(0, 8);
  };

  const renderResults = (items) => {
    if (!searchResults) return;
    if (!items.length) { searchResults.classList.add('hidden'); searchResults.innerHTML = ''; return; }
    searchResults.classList.remove('hidden');
    searchResults.innerHTML = items.map((item) => `
      <button class="w-full text-left px-4 py-3 hover:bg-slate-800 border-b border-slate-800 flex justify-between items-center" data-article="${item.id}">
        <span class="text-slate-200">${item.title}</span>
        <span class="text-slate-500 text-sm">${item.url ? 'Open guide' : 'Quick help'}</span>
      </button>
    `).join('');
    searchResults.querySelectorAll('[data-article]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-article');
        const item = helpDatabase.find((x) => x.id === id);
        if (!item) return;
        trackSearchEvent('assistant_search_open', { id: item.id, title: item.title, hasUrl: !!item.url });
        openArticle(item);
      });
    });
  };

  const articleModal = document.getElementById('article-modal');
  const articleClose = document.getElementById('article-close');
  const articleTitle = document.getElementById('article-title');
  const articleBody = document.getElementById('article-body');
  const openArticle = (item) => {
    if (!articleModal || !articleTitle || !articleBody) return;
    articleTitle.textContent = item.title;
    articleBody.innerHTML = item.content + (item.url ? ` <p class="mt-4"><a href="${item.url}" class="text-cyan-400 underline">Open full guide</a></p>` : '');
    articleModal.classList.remove('hidden');
    articleModal.classList.add('flex');
  };
  if (articleClose && articleModal) {
    articleClose.addEventListener('click', () => {
      articleModal.classList.add('hidden');
      articleModal.classList.remove('flex');
    });
    articleModal.addEventListener('click', (e) => {
      if (e.target === articleModal) {
        articleModal.classList.add('hidden');
        articleModal.classList.remove('flex');
      }
    });
  }

  // Quick actions were converted to links; no alerts needed

  // Modal open/close
  const openModalBtn = document.getElementById('open-help-modal');
  const modal = document.getElementById('helper-modal');
  const closeModalBtn = document.getElementById('helper-close');
  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  }
  if (closeModalBtn && modal) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }

  const openContactBtn = document.getElementById('open-contact-modal');
  const contactModal = document.getElementById('contact-modal');
  const contactClose = document.getElementById('contact-close');
  const tabCallChat = document.getElementById('tab-callchat');
  const tabCallback = document.getElementById('tab-callback');
  const panelCallChat = document.getElementById('contact-callchat');
  const panelCallback = document.getElementById('contact-callback');
  const cbForm = document.getElementById('contact-callback');
  const cbSubmit = document.getElementById('cb-submit');
  document.querySelectorAll('[data-open-contact]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (contactModal) {
        contactModal.classList.remove('hidden');
        contactModal.classList.add('flex');
      }
    });
  });
  if (openContactBtn && contactModal) {
    openContactBtn.addEventListener('click', (e) => {
      e.preventDefault();
      contactModal.classList.remove('hidden');
      contactModal.classList.add('flex');
    });
  }
  if (contactClose && contactModal) {
    contactClose.addEventListener('click', () => {
      contactModal.classList.add('hidden');
      contactModal.classList.remove('flex');
    });
  }
  if (contactModal) {
    contactModal.addEventListener('click', (e) => {
      if (e.target === contactModal) {
        contactModal.classList.add('hidden');
        contactModal.classList.remove('flex');
      }
    });
  }

  const switchTab = (which) => {
    if (!panelCallChat || !panelCallback || !tabCallChat || !tabCallback) return;
    const activeClasses = ['bg-slate-700','text-slate-200','text-heal-teal','border-b-2','border-teal-700'];
    const inactiveClasses = ['bg-slate-800','text-slate-300'];
    if (which === 'callback') {
      panelCallChat.classList.add('hidden');
      panelCallback.classList.remove('hidden');
      tabCallChat.classList.remove(...activeClasses);
      tabCallChat.classList.add(...inactiveClasses);
      tabCallback.classList.remove(...inactiveClasses);
      tabCallback.classList.add(...activeClasses);
    } else {
      panelCallback.classList.add('hidden');
      panelCallChat.classList.remove('hidden');
      tabCallback.classList.remove(...activeClasses);
      tabCallback.classList.add(...inactiveClasses);
      tabCallChat.classList.remove(...inactiveClasses);
      tabCallChat.classList.add(...activeClasses);
    }
  };
  if (tabCallChat) tabCallChat.addEventListener('click', () => switchTab('callchat'));
  if (tabCallback) tabCallback.addEventListener('click', () => switchTab('callback'));

  if (cbForm) {
    cbForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('cb-name')?.value || '';
      const phone = document.getElementById('cb-phone')?.value || '';
      const msg = document.getElementById('cb-message')?.value || '';
      const subject = encodeURIComponent(`Call Back Request from ${name}`);
      const body = encodeURIComponent(`Phone: ${phone}\n\nMessage:\n${msg}`);
      const mailtoTo = document.body.getAttribute('data-mailto-to') || '';
      const href = `mailto:${mailtoTo}?subject=${subject}&body=${body}`;
      window.location.href = href;
    });
  }
});