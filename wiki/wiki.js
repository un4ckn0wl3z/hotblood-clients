// Player wiki: language switch (shares the game's hb-lang), search, team filters, picture zoom, live shop prices.
(function () {
  'use strict';
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  // ---- language
  let lang = new URLSearchParams(location.search).get('lang');
  if (!lang) try { lang = localStorage.getItem('hb-lang'); } catch (e) { /* storage blocked */ }
  if (!lang) lang = /^th/i.test(navigator.language || '') ? 'th' : 'en';
  const setLang = l => {
    lang = l === 'en' ? 'en' : 'th';
    document.documentElement.classList.toggle('en', lang === 'en');
    document.documentElement.lang = lang;
    $$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === lang));
    try { localStorage.setItem('hb-lang', lang); } catch (e) { /* ignore */ }
  };
  setLang(lang);
  $$('.lang button').forEach(b => b.onclick = () => setLang(b.dataset.lang));

  // ---- search: cards whose name / players match stay, the rest hide (sections with nothing left hide too)
  const q = $('#q');
  q.oninput = () => {
    const s = q.value.trim().toLowerCase();
    $$('.card').forEach(c => c.classList.toggle('hide', !!s && !(c.dataset.q || '').toLowerCase().includes(s) && !c.textContent.toLowerCase().includes(s)));
    $$('section').forEach(sec => {
      const cards = sec.querySelectorAll('.card');
      sec.classList.toggle('hide', !!s && (!cards.length || ![...cards].some(c => !c.classList.contains('hide'))));
    });
  };
  q.onkeydown = e => { if (e.key === 'Enter') { const c = $('.card:not(.hide)'); if (c) c.scrollIntoView(); } };

  // ---- team shelves
  $$('.filters button').forEach(b => b.onclick = () => {
    $$('.filters button').forEach(x => x.classList.toggle('on', x === b));
    $$('.card.team').forEach(c => c.classList.toggle('hide', !!b.dataset.f && c.dataset.k !== b.dataset.f));
  });

  // ---- side menu (phones) + current section
  $('#menu').onclick = () => $('#side').classList.toggle('open');
  $$('#side a').forEach(a => a.addEventListener('click', () => $('#side').classList.remove('open')));
  const links = new Map($$('#side a[href^="#"]').map(a => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach((a, id) => a.classList.toggle('on', id === e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
    $$('main > section').forEach(s => io.observe(s));
  }
  // a link to a card lights it up
  const mark = () => { $$('.card.hit').forEach(c => c.classList.remove('hit')); const t = location.hash && document.getElementById(location.hash.slice(1)); if (t && t.classList.contains('card')) t.classList.add('hit'); };
  addEventListener('hashchange', mark); mark();

  // ---- picture zoom
  const lb = $('#lb');
  document.addEventListener('click', e => {
    if (e.target.tagName === 'IMG' && e.target.closest('main') && !e.target.classList.contains('face')) { lb.querySelector('img').src = e.target.src; lb.hidden = false; }
  });
  lb.onclick = () => { lb.hidden = true; };
  addEventListener('keydown', e => { if (e.key === 'Escape') lb.hidden = true; });

  // ---- live shop prices / sale from the game server (same rules as META.priceOf)
  fetch((document.documentElement.dataset.game || '') + '/api/tune').then(r => r.json()).then(o => {
    const shop = o && o.shop;
    if (!shop) return;
    const now = Date.now(), s = shop.sale, on = s && s.pct > 0 && (!s.until || s.until > now);
    $$('[data-price]').forEach(el => {
      const id = el.dataset.price, kind = id.split(':')[0], base = +el.textContent;
      if (shop.hidden && shop.hidden.includes(id)) { el.innerHTML = '<span class="off">' + base + '</span> ✖'; return; }
      let p = shop.prices && shop.prices[id] != null ? shop.prices[id] : base;
      const was = p;
      if (on && (s.scope === 'all' || s.scope === kind) && p > 0) p = Math.floor(p * (100 - s.pct) / 100);
      el.innerHTML = p !== was ? '<span class="off">' + was + '</span> ' + p : String(p);
    });
    if (on) {
      const el = $('#sale');
      el.hidden = false;
      el.textContent = '🏷 SALE -' + s.pct + '%' + (s.name ? ' · ' + s.name : '') + (s.until ? ' · ' + new Date(s.until).toLocaleString(lang === 'en' ? 'en-GB' : 'th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '');
    }
  }).catch(() => { /* opened as a file / server down: the default prices stay */ });
})();
