// ========================================================
// TransformaUMKM — Alur Landing sebelum Login
//
//  Urutan (login.html): Navbar sticky + 4 section
//    Section 1  #beranda  → Hero / Welcoming page (headline, ringkasan, chip fitur, CTA)
//                           Naik sebagai "tirai" parallax menyingkap Section 2
//    Section 2  #tentang  → Potensi UMKM Indonesia (peran, tantangan, digitalisasi)
//    Section 3  #solusi   → Fitur & Solusi (Kasir POS, Manajemen Inventori, Smart Restock AI)
//    Section 4  #login    → Form Login utama menuju dasbor
//
//  Fitur:
//    - Navbar (position: fixed) tersembunyi di Section 1; class .show-nav ditambahkan
//      lewat IntersectionObserver begitu Section 1 benar-benar keluar dari layar
//      (Section 2 sepenuhnya masuk), lalu tetap tampil di Section 2–4.
//    - Navbar sticky + tombol "Langsung Login" (jalan pintas ke Section 4)
//    - Smooth scroll untuk setiap tautan [data-lp-scroll]
//    - Scroll-spy (menu aktif mengikuti section yang sedang dilihat)
//    - Parallax scroll-down Hero → Section 2: Hero terangkat utuh, Section 2 tersingkap
//      di bawahnya (pin lewat CSS sticky); lapisan Hero bergerak beda kecepatan
//    - Satu arah: begitu Hero terlewati (pengguna sudah di Section 2–4), Hero dilepas
//      dari layout (html.lp-passed) sehingga tidak bisa di-scroll balik ke Section 1.
//      Muat ulang halaman = Hero tampil lagi.
//    - Hero: partikel kanvas + parallax kursor (otomatis nonaktif bila
//      pengguna memilih "reduce motion")
//    - Animasi muncul (reveal) saat scroll, otomatis nonaktif bila
//      pengguna memilih "reduce motion"
//    - Toggle di Pengaturan (localStorage: transforma_wp_enabled) tetap
//      berfungsi: OFF → hanya Section 4 (form Login) yang ditampilkan.
//
//  File ini juga dimuat di index.html (dasbor) hanya untuk menyediakan
//  handleWpToggle() bagi halaman Pengaturan.
// ========================================================
(function () {
  'use strict';

  var LS_ENABLED = 'transforma_wp_enabled';
  var root = document.documentElement;

  // ---------- Storage helpers (aman saat storage diblokir) ----------
  function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function lsSet(key, value) { try { localStorage.setItem(key, value); } catch (e) {} }

  function isWpEnabled() {
    var v = lsGet(LS_ENABLED);
    return v === null ? true : v === 'true';
  }
  window.isWelcomingPageEnabled = isWpEnabled;

  // ---------- Pengaturan (index.html) ----------
  function syncSettingsControls() {
    var wpToggle = document.getElementById('toggleWelcomingPage');
    if (wpToggle) wpToggle.checked = isWpEnabled();
  }

  window.handleWpToggle = function (checked) {
    lsSet(LS_ENABLED, checked ? 'true' : 'false');
    if (typeof showToast === 'function') {
      showToast(checked
        ? 'Halaman sambutan diaktifkan. Alur: Hero → Potensi UMKM → Fitur → Login.'
        : 'Halaman sambutan dinonaktifkan. Langsung menuju form Login.',
        checked ? 'info' : 'warning');
    }
  };

  syncSettingsControls();

  // ========================================================
  // LANDING FLOW — hanya berjalan bila navbar landing ada (login.html)
  // ========================================================
  var nav = document.getElementById('lpNav');
  if (!nav) return;

  // Sinkronkan mode "langsung ke form" (skrip pra-render di <head> sudah
  // melakukannya; ini hanya jaring pengaman).
  root.classList.toggle('lp-skip', !isWpEnabled());
  root.classList.add('lp-ready');   // memberi tahu <head> bahwa skrip ini termuat

  function prefersReducedMotion() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function setHash(id) {
    try { if (window.history && history.replaceState) history.replaceState(null, '', '#' + id); } catch (e) {}
  }

  var hero = document.getElementById('beranda');
  var navH = function () { return nav.offsetHeight || 64; };
  var heroH = function () { return hero && hero.offsetParent !== null ? hero.offsetHeight : 0; };
  var scrollY = function () { return window.pageYOffset || root.scrollTop || 0; };

  // Tinggi Hero → CSS (--lp-hero-h) agar panggung "tirai" Section 2 selalu pas,
  // juga saat layar diputar / bilah alamat mobile naik-turun.
  function syncHeroHeight() {
    var h = heroH();
    if (h) root.style.setProperty('--lp-hero-h', h + 'px');
  }
  syncHeroHeight();
  if (hero && 'ResizeObserver' in window) new ResizeObserver(syncHeroHeight).observe(hero);
  window.addEventListener('resize', syncHeroHeight);

  // ---------- Kunci Hero: tidak bisa kembali ke Section 1 ----------
  // Saat Hero sudah sepenuhnya di luar layar (pengguna masuk Section 2–4), Hero
  // dilepas dari layout. Tata letak Section 2 disetel di CSS (html.lp-passed) agar
  // tampilannya identik, lalu posisi scroll dikurangi tinggi Hero supaya tidak ada
  // lompatan visual. Dengan begitu batas atas halaman = Section 2.
  var passed = false;

  function passHero(y, h) {
    passed = true;
    root.classList.add('lp-passed');
    window.scrollTo({ top: Math.max(0, y - h), left: 0, behavior: 'instant' });
    // Smooth scroll yang sedang berjalan ikut terhenti oleh scrollTo di atas → lanjutkan.
    if (pendingId && Date.now() < pendingUntil) {
      var id = pendingId;
      window.scrollTo({ top: landingTop(id), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    }
  }

  // Tautan / riwayat browser ke #beranda setelah Hero dikunci → arahkan ke atas Section 2.
  window.addEventListener('hashchange', function () {
    if (passed && location.hash === '#beranda') {
      setHash('tentang');
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  });

  // ---------- Smooth scroll ----------
  // Section 2 sekarang "tertahan" (sticky) di bawah Hero, jadi scrollIntoView tidak
  // lagi menunjukkan posisi sebenarnya. Posisi tujuan dihitung manual:
  //   Beranda → 0 · Potensi UMKM → akhir angkatan Hero (= tinggi Hero)
  //   Fitur & Login → posisi dokumen section dikurangi tinggi navbar.
  function landingTop(id) {
    var target = document.getElementById(id);
    if (!target || target.offsetParent === null) return 0;   // mode "langsung ke form"
    if (id === 'beranda') return 0;
    if (id === 'tentang') return heroH();
    return Math.max(0, target.getBoundingClientRect().top + scrollY() - navH());
  }

  function setHash(id) {
    try { if (window.history && history.replaceState) history.replaceState(null, '', '#' + id); } catch (e) {}
  }

  // Tujuan scroll yang sedang berjalan (agar bisa dilanjutkan bila Hero dilepas di tengah jalan).
  var pendingId = null, pendingUntil = 0;

  function scrollToSection(id) {
    var target = document.getElementById(id);
    if (!target) return;

    pendingId = id; pendingUntil = Date.now() + 1800;
    window.scrollTo({ top: landingTop(id), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setHash(id);

    // Pindahkan fokus agar pengguna keyboard / pembaca layar ikut berpindah,
    // tanpa memicu lompatan scroll tambahan.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[data-lp-scroll]') : null;
    if (!link) return;
    // Biarkan Ctrl/Cmd/Shift + klik (buka tab baru) berjalan normal.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    var id = (link.getAttribute('href') || '').replace(/^#/, '');
    if (!id) return;

    e.preventDefault();
    scrollToSection(id);
  });

  // Dibuka dengan #tentang (mis. dari tautan luar): browser tidak bisa menghitungnya
  // sendiri karena Section 2 sticky, jadi arahkan manual.
  if (location.hash === '#tentang') window.scrollTo(0, landingTop('tentang'));

  // ---------- Scroll-spy: tandai menu aktif ----------
  // Berbasis posisi scroll (bukan IntersectionObserver) karena Section 2 sudah
  // "ada" di layar di balik Hero sebelum Hero terangkat.
  var menuLinks = Array.prototype.slice.call(nav.querySelectorAll('[data-lp-link]'));
  var spyIds = ['beranda', 'tentang', 'solusi', 'login'];
  var currentActive = null;

  function setActive(id) {
    if (id === currentActive) return;
    currentActive = id;
    menuLinks.forEach(function (link) {
      if (link.getAttribute('data-lp-link') === id) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function updateSpy(y) {
    var vh = window.innerHeight;
    var line = y + vh * 0.45;           // garis pantau sedikit di atas tengah layar
    var id = 'beranda';
    spyIds.forEach(function (key) {
      if (key !== 'beranda' && line >= landingTop(key)) id = key;
    });
    // Mentok di dasar halaman → section terakhir (Login) aktif.
    if (y + vh >= (root.scrollHeight || 0) - 2 && hero && hero.offsetParent !== null) id = 'login';
    setActive(id);
  }

  // ---------- Navbar: muncul hanya setelah Section 1 benar-benar lewat ----------
  // Hero diamati: selama masih ada bagian Hero di layar → navbar disembunyikan. Begitu Hero
  // keluar sepenuhnya (atau dilepas dari layout oleh kunci Hero / mode langsung-login) →
  // .show-nav ditambahkan. Scroll balik ke Hero (bila masih memungkinkan) → disembunyikan lagi.
  if (hero && hero.offsetParent !== null && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var heroInView = entries[entries.length - 1].isIntersecting;
      nav.classList.toggle('show-nav', !heroInView);
    }, { threshold: 0 }).observe(hero);
  } else {
    nav.classList.add('show-nav');   // tanpa Hero / tanpa IntersectionObserver: navbar selalu tampil
  }

  // ---------- Parallax Hero (lapisan bergerak beda kecepatan) ----------
  // Lembar Hero sendiri naik 1:1 mengikuti scroll (native, tanpa fade). Di dalamnya,
  // tiap lapisan diberi pergeseran searah turun sehingga tampak naik lebih lambat:
  // latar 0,55 · konten 0,22 · orb 0,30 / 0,42 / 0,54 (nilai yang sama dengan zip).
  var bg = document.getElementById('wpBg');
  var content = document.getElementById('wpContent');
  var orbs = hero ? Array.prototype.slice.call(hero.querySelectorAll('.wp-orb')) : [];
  var cue = hero ? hero.querySelector('.wp-scroll-cue') : null;
  var mx = 0, my = 0;                   // posisi kursor (-1..1), diisi di bawah
  var motionOK = !prefersReducedMotion();

  function renderHero(y) {
    if (!hero || !motionOK) return;
    var h = heroH();
    if (!h) return;
    var p = Math.max(0, Math.min(1, y / h));
    if (bg) bg.style.transform = 'translate3d(' + (-mx * 18) + 'px,' + (p * h * 0.55 - my * 14) + 'px,0)';
    if (content) content.style.transform = 'translate3d(' + (mx * 8) + 'px,' + (p * h * 0.22 + my * 6) + 'px,0)';
    // Penanda scroll ikut lapisan konten (0,22) agar tidak bertumpuk dengan tombol CTA.
    if (cue) cue.style.translate = '0 ' + (p * h * 0.22) + 'px';
    orbs.forEach(function (orb, i) {
      // properti "translate" terpisah dari "transform", jadi tidak menimpa animasi melayang orb.
      orb.style.translate = '0 ' + (p * h * (0.3 + i * 0.12)) + 'px';
    });
  }

  // ---------- Satu loop scroll untuk navbar, spy, dan parallax ----------
  var ticking = false;
  function frame() {
    var y = scrollY();
    if (!passed && hero && hero.offsetParent !== null) {
      var h = heroH();
      if (h && y >= h - 1) { passHero(y, h); y = scrollY(); }
    }
    updateSpy(y);
    renderHero(y);
    ticking = false;
  }
  function queueFrame() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(frame);
  }
  window.addEventListener('scroll', queueFrame, { passive: true });
  window.addEventListener('resize', queueFrame);
  frame();

  // ---------- Reveal saat scroll ----------
  // Kelas "lp-anim" dipasang oleh skrip di <head> hanya bila animasi boleh jalan
  // (IntersectionObserver tersedia & bukan reduce-motion).
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('.lp-reveal'));

  if (root.classList.contains('lp-anim') && 'IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach(function (item) { reveal.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-in'); });
  }

  // ---------- Hero: partikel + parallax kursor ----------
  // Murni dekoratif. Dilewati bila pengguna memilih "reduce motion"; animasi
  // dijeda otomatis saat hero tidak terlihat agar hemat CPU/baterai.
  var canvas = document.getElementById('wpParticlesCanvas');

  if (hero && canvas && canvas.getContext && motionOK) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var heroVisible = true;
    var particleRaf = null;

    function sizeCanvas() {
      canvas.width = hero.clientWidth;
      canvas.height = hero.clientHeight;
    }
    function seedParticles() {
      particles = [];
      for (var i = 0; i < 56; i++) {
        particles.push({
          x: Math.random() * canvas.width, y: Math.random() * canvas.height,
          r: Math.random() * 1.3 + 0.25, a: Math.random() * 0.45 + 0.12,
          dx: (Math.random() - 0.5) * 0.2, dy: (Math.random() - 0.5) * 0.14,
          da: (Math.random() - 0.5) * 0.0035
        });
      }
    }
    function drawParticles() {
      particleRaf = null;
      if (!heroVisible) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.dx; p.y += p.dy; p.a += p.da;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        if (p.a < 0.05 || p.a > 0.6) p.da *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(148,163,184,' + p.a + ')'; ctx.fill();
      });
      particleRaf = window.requestAnimationFrame(drawParticles);
    }
    function startParticles() { if (!particleRaf && heroVisible && hero.offsetParent !== null) particleRaf = window.requestAnimationFrame(drawParticles); }

    sizeCanvas(); seedParticles(); startParticles();
    window.addEventListener('resize', function () { sizeCanvas(); seedParticles(); startParticles(); });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
        if (heroVisible) startParticles();
      }).observe(hero);
    }

    // Parallax kursor (perangkat dengan mouse), digabung dengan parallax scroll di renderHero().
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      queueFrame();
    });
    hero.addEventListener('mouseleave', function () { mx = my = 0; queueFrame(); });
  }
})();
