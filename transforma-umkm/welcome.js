// ========================================================
// TransformaUMKM — Welcoming Page & Full-Page Parallax
//  - Shown BEFORE Login/Register (auth pages), on every visit/refresh unless disabled.
//  - It takes several scrolls to slide it up (translate only, no fade) to the Dashboard.
//  - After that it is removed from the DOM and flagged in sessionStorage,
//    so scrolling back up never reveals it again in this session.
//  - Disabled via Settings toggle (localStorage: transforma_wp_enabled).
// ========================================================
(function () {
  'use strict';

  var LS_ENABLED = 'transforma_wp_enabled';
  var SS_SEEN = 'transforma_wp_seen';
  var DAMPING = 0.1;        // easing toward the target; lower = softer
  var DONE_AT = 0.999;

  function store(area, fn) { try { return fn(area); } catch (e) { return null; } }
  function lsGet(k) { return store(localStorage, function (s) { return s.getItem(k); }); }
  function ssGet(k) { return store(sessionStorage, function (s) { return s.getItem(k); }); }

  function isWpEnabled() { var v = lsGet(LS_ENABLED); return v === null ? true : v === 'true'; }
  function markSeen() { store(sessionStorage, function (s) { s.setItem(SS_SEEN, '1'); }); }

  window.isWelcomingPageEnabled = isWpEnabled;

  // ---------- Settings controls ----------
  function syncSettingsControls() {
    var wpToggle = document.getElementById('toggleWelcomingPage');
    if (wpToggle) wpToggle.checked = isWpEnabled();
  }

  window.handleWpToggle = function (checked) {
    store(localStorage, function (s) { s.setItem(LS_ENABLED, checked ? 'true' : 'false'); });
    if (!checked) { markSeen(); detach(); }
    if (typeof showToast === 'function') {
      showToast(checked
        ? 'Welcoming Page diaktifkan. Tampil sebelum halaman Login/Register.'
        : 'Welcoming Page dinonaktifkan. Langsung menuju form Login/Register.',
        checked ? 'info' : 'warning');
    }
  };

  syncSettingsControls();

  // ---------- State ----------
  var isAuthPage = document.body.classList.contains('auth-page');
  var wp = null;

  function buildWelcome() {
    var el = document.createElement('div');
    el.id = 'welcomingPage';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Selamat datang di TransformaUMKM');
    el.innerHTML =
      '<div class="wp-bg" id="wpBg"></div>' +
      '<div class="wp-orb wp-orb-1" aria-hidden="true"></div>' +
      '<div class="wp-orb wp-orb-2" aria-hidden="true"></div>' +
      '<div class="wp-orb wp-orb-3" aria-hidden="true"></div>' +
      '<canvas id="wpParticlesCanvas" aria-hidden="true"></canvas>' +
      '<div class="wp-content" id="wpContent">' +
        '<div class="wp-logo" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
        '<div class="wp-kicker"><span class="wp-kicker-dot"></span>Solusi Digital &nbsp;·&nbsp; Untuk UMKM Indonesia</div>' +
        '<h1 class="wp-headline">Kelola UMKM dengan <span class="hl-gradient">Transformasi Digital</span></h1>' +
        '<p class="wp-sub">Platform operasi digital terpadu untuk POS, inventori, CRM, dan analitik bisnis &mdash; semua dalam satu dasbor yang intuitif.</p>' +
        '<div class="wp-features">' +
          '<span class="wp-feature-chip">📊 Dashboard Real-time</span><span class="wp-feature-chip">🛒 Smart POS Kasir</span>' +
          '<span class="wp-feature-chip">📦 Manajemen Stok</span><span class="wp-feature-chip">👥 CRM Pelanggan</span>' +
          '<span class="wp-feature-chip">✨ Asisten AI</span><span class="wp-feature-chip">🌐 Katalog Digital</span>' +
        '</div>' +
        '<button class="wp-cta-btn" id="wpCtaBtn" type="button" onclick="dismissWelcomingPage()" aria-label="Lanjut ke Login atau Register"><span>Mulai Sekarang</span>' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '</div>' +
      '<div class="wp-scroll-cue" aria-hidden="true"><span>Scroll untuk Masuk atau Daftar</span>' +
        '<div class="wp-scroll-cue-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div></div>';
    document.body.appendChild(el);
    return el;
  }

  // A refresh counts as a fresh visit: show the Welcoming Page again.
  try {
    var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
    if (nav && nav.type === 'reload') sessionStorage.removeItem(SS_SEEN);
  } catch (e) {}

  var active = false;
  var progress = 0, target = 0, rafId = null, mx = 0, my = 0, particleRaf = null;
  var layers = {};

  function detach() {
    active = false;
    if (rafId) cancelAnimationFrame(rafId);
    if (particleRaf) cancelAnimationFrame(particleRaf);
    rafId = particleRaf = null;
    window.removeEventListener('wheel', onWheel, { passive: false });
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove, { passive: false });
    window.removeEventListener('keydown', onKey);
    window.removeEventListener('mousemove', onMouse);
    window.removeEventListener('resize', onResize);
    document.body.classList.remove('wp-active');
    if (wp && wp.parentNode) wp.parentNode.removeChild(wp);   // fully detached from the DOM
    wp = null;
  }

  window.dismissWelcomingPage = function () {
    if (!active) { detach(); return; }
    target = 1; tickStart();
  };

  if (!isAuthPage || !isWpEnabled() || ssGet(SS_SEEN) === '1') { detach(); return; }
  wp = buildWelcome();

  // ---------- Parallax ----------
  layers.bg = document.getElementById('wpBg');
  layers.content = document.getElementById('wpContent');
  layers.orbs = Array.prototype.slice.call(document.querySelectorAll('.wp-orb'));

  function render() {
    var vh = window.innerHeight;
    // The whole page slides up as one sheet; inner layers move at different
    // speeds to give depth. Opacity is never touched.
    wp.style.transform = 'translate3d(0,' + (-progress * vh) + 'px,0)';
    layers.bg.style.transform = 'translate3d(' + (-mx * 18) + 'px,' + (progress * vh * 0.55 - my * 14) + 'px,0)';
    layers.content.style.transform = 'translate3d(' + (mx * 8) + 'px,' + (progress * vh * 0.22 + my * 6) + 'px,0)';
    layers.orbs.forEach(function (o, i) {
      o.style.transform = 'translate3d(' + (mx * (10 + i * 6)) + 'px,' + (progress * vh * (0.3 + i * 0.12) + my * 8) + 'px,0)';
    });
  }

  function tick() {
    rafId = null;
    var d = target - progress;
    var step = d * DAMPING + (d > 0 ? 0.0015 : -0.0015);   // min speed so the ease-out never crawls
    progress = Math.abs(step) >= Math.abs(d) ? target : progress + step;
    render();
    if (target === 1 && progress >= DONE_AT) {
      markSeen();
      detach();
      return;
    }
    if (progress !== target) rafId = requestAnimationFrame(tick);
  }
  function tickStart() { if (!rafId) rafId = requestAnimationFrame(tick); }

  // Progress accumulates with scroll distance: it takes several wheel notches
  // (~1 screen height of scrolling) to reach the Dashboard. Scrolling up
  // moves the page back down. Nothing snaps or completes from a single gesture.
  function advance(px) {
    target = Math.max(0, Math.min(1, target + px / (window.innerHeight * 1.1)));
    tickStart();
  }

  function onWheel(e) {
    e.preventDefault();
    var dy = Math.max(-120, Math.min(120, e.deltaY));   // cap one fast flick
    advance(dy);
  }
  var ty = 0;
  function onTouchStart(e) { ty = e.touches[0].clientY; }
  function onTouchMove(e) {
    e.preventDefault();
    var y = e.touches[0].clientY;
    advance((ty - y) * 1.4);
    ty = y;
  }
  function onKey(e) {
    if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    var step = window.innerHeight * 0.25;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); advance(step); }
    else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); advance(-step); }
  }
  function onMouse(e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
    if (!rafId) render();
  }

  // ---------- Particles ----------
  var canvas = document.getElementById('wpParticlesCanvas');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var particles = [];
  function onResize() { if (canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } }
  if (canvas && canvas.getContext && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    onResize();
    for (var i = 0; i < 56; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        r: Math.random() * 1.3 + 0.25, a: Math.random() * 0.45 + 0.12,
        dx: (Math.random() - 0.5) * 0.2, dy: (Math.random() - 0.5) * 0.14, da: (Math.random() - 0.5) * 0.0035 });
    }
    var draw = function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.dx; p.y += p.dy; p.a += p.da;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        if (p.a < 0.05 || p.a > 0.6) p.da *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148,163,184,' + p.a + ')'; ctx.fill();
      });
      particleRaf = requestAnimationFrame(draw);
    };
    draw();
  }

  // ---------- Go ----------
  active = true;
  document.body.classList.add('wp-active');
  wp.removeAttribute('hidden');
  wp.style.display = 'flex';
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('keydown', onKey);
  window.addEventListener('mousemove', onMouse);
  window.addEventListener('resize', onResize);
  render();
})();
