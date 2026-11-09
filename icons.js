/**
 * TransformaUMKM — UI Icon System (Lucide via CDN)
 * ------------------------------------------------------------------
 * Pengganti SELURUH emoji di antarmuka. Dipakai di semua halaman (login, register, dasbor).
 *
 *  - Ikon diambil per nama dari CDN jsDelivr (paket lucide-static), lalu di-cache (memori + localStorage,
 *    cache dibagi dengan Product Icon System di script.js sehingga tiap ikon hanya diunduh sekali).
 *  - HTML statis  : <i data-ic="sparkles"></i>                 (otomatis diisi SVG; warna pastel mengikuti fungsi)
 *                   <i data-ic="zap" data-badge></i>           (dengan latar badge pastel)
 *  - Template JS  : UIIcon.html('triangle-alert', { badge: true })
 *  - Fallback     : nama kosong / tidak valid / tidak ada di Lucide / CDN gagal → ikon paket (package) bawaan offline.
 *  - Tone pastel  : rose · peach · amber · lime · mint · teal · sky · indigo · lavender · pink · slate
 *                   (otomatis dari nama ikon lewat TONE_OF, bisa dipaksa: data-tone="mint" / { tone: 'mint' })
 */
(function (w) {
  'use strict';
  if (w.UIIcon) return;

  var VERSION = '1.70.0';
  var CDN = 'https://cdn.jsdelivr.net/npm/lucide-static@' + VERSION + '/icons/';
  var LS_PREFIX = 'pi_lucide_' + VERSION + '_';       // sama dengan Product Icon System → cache bersama
  var FALLBACK = 'package';
  var NAME_RE = /^[a-z][a-z0-9-]*$/;
  var SAFE_RE = /^(?:\s*<(?:path|circle|rect|line|polyline|polygon|ellipse)\b[^<>]*\/?>\s*)+$/i;

  // Salinan tertanam (offline) untuk ikon fallback — Lucide "package", lisensi ISC.
  var BUILTIN = { 'package': '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z" /><path d="M12 22V12" /><polyline points="3.29 7 12 12 20.71 7" /><path d="m7.5 4.27 9 5.15" />' };

  // Nama lama (alias) bila CDN tidak punya nama kanonik; dicoba berurutan sebelum jatuh ke fallback.
  var ALTS = {
    'triangle-alert': ['alert-triangle'],
    'circle-check': ['check-circle-2', 'check-circle'],
    'circle-x': ['x-circle'],
    'hand-heart': ['heart-handshake'],
    'pen-line': ['pen-tool', 'pencil'],
    'party-popper': ['sparkles'],
    'message-circle': ['message-square']
  };

  // Fungsi ikon → warna pastel (garis tebal + latar lembut)
  var TONE_OF = {
    'sparkles': 'lavender', 'sparkle': 'lavender', 'wand-sparkles': 'lavender', 'bot': 'lavender', 'pen-line': 'lavender',
    'zap': 'amber', 'star': 'amber', 'lightbulb': 'amber', 'hourglass': 'amber', 'trophy': 'amber', 'hand': 'amber', 'triangle-alert': 'amber',
    'package': 'peach', 'flame': 'peach', 'tag': 'peach', 'megaphone': 'peach', 'coffee': 'peach', 'wheat': 'peach',
    'party-popper': 'pink', 'gift': 'pink', 'camera': 'pink', 'shopping-bag': 'pink', 'hand-heart': 'pink',
    'heart': 'rose', 'siren': 'rose', 'alarm-clock': 'rose', 'circle-x': 'rose', 'map-pin': 'rose',
    'sprout': 'lime', 'leaf': 'lime',
    'circle-check': 'mint', 'wallet': 'mint', 'banknote': 'mint', 'coins': 'mint', 'trending-up': 'mint', 'shopping-cart': 'mint', 'circle': 'mint',
    'phone': 'teal', 'message-circle': 'teal', 'receipt': 'teal',
    'info': 'sky', 'gem': 'sky', 'file-text': 'sky', 'thumbs-up': 'sky', 'landmark': 'sky',
    'smartphone': 'indigo', 'rocket': 'indigo', 'music': 'indigo',
    'arrow-right': 'slate', 'arrow-up': 'slate', 'chevron-down': 'slate'
  };

  var cache = {};      // nama → markup dalam <svg>
  var pending = {};    // nama → Promise
  var failed = {};     // nama → true (semua kandidat gagal)

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function cleanName(name) {
    var n = String(name == null ? '' : name).trim().toLowerCase();
    return NAME_RE.test(n) ? n : FALLBACK;
  }

  function innerFromSvg(text) {
    var m = /<svg\b[^>]*>([\s\S]*?)<\/svg>/i.exec(String(text || ''));
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  }

  // Markup ikon bila sudah ada secara sinkron (memori → localStorage → bawaan offline), selain itu ''.
  function getInner(name) {
    if (cache[name]) return cache[name];
    try {
      var v = w.localStorage.getItem(LS_PREFIX + name);
      if (v && SAFE_RE.test(v)) { cache[name] = v; return v; }
    } catch (e) { /* storage tidak tersedia */ }
    return BUILTIN[name] || '';
  }

  function fetchOne(candidate) {
    return fetch(CDN + encodeURIComponent(candidate) + '.svg').then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      var inner = innerFromSvg(t);
      if (!SAFE_RE.test(inner)) throw new Error('format ikon tidak dikenal');
      return inner;
    });
  }

  function tryCandidates(list) {
    return list.reduce(function (p, c) {
      return p.catch(function () { return fetchOne(c); });
    }, Promise.reject());
  }

  // Cat ulang semua elemen untuk satu nama (setelah ikon selesai dimuat / gagal).
  function repaint(name) {
    var els = document.querySelectorAll('[data-ic="' + name + '"]');
    for (var i = 0; i < els.length; i++) paint(els[i], true);
  }

  function load(name) {
    if (!name || cache[name] || pending[name] || failed[name] || BUILTIN[name]) return Promise.resolve();
    if (typeof w.fetch !== 'function') { failed[name] = true; repaint(name); return Promise.resolve(); }
    pending[name] = tryCandidates([name].concat(ALTS[name] || []))
      .then(function (inner) {
        cache[name] = inner;
        try { w.localStorage.setItem(LS_PREFIX + name, inner); } catch (e) { /* abaikan */ }
      })
      .catch(function () { failed[name] = true; })
      .then(function () { delete pending[name]; repaint(name); });
    return pending[name];
  }

  function preload(names) {
    return Promise.all((names || Object.keys(TONE_OF)).map(function (n) { return load(cleanName(n)); }));
  }

  // Isi satu elemen [data-ic]. force = isi ulang walau sudah pernah.
  function paint(el, force) {
    var raw = el.getAttribute('data-ic');
    var name = cleanName(raw);
    if (!force && el.getAttribute('data-ic-ok') === name) return;

    if (!/\bui-ic\b/.test(el.className || '')) el.classList.add('ui-ic');
    if (el.hasAttribute('data-badge') && !el.classList.contains('ui-ic--badge')) el.classList.add('ui-ic--badge');
    if (!el.getAttribute('data-tone')) el.setAttribute('data-tone', TONE_OF[name] || 'slate');
    if (!el.hasAttribute('role') && !el.hasAttribute('aria-hidden') && !el.hasAttribute('aria-label')) el.setAttribute('aria-hidden', 'true');

    var svg = el.querySelector(':scope > svg');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('focusable', 'false');
      svg.setAttribute('aria-hidden', 'true');
      el.appendChild(svg);
    }

    var inner = getInner(name);
    if (!inner && failed[name]) {                      // CDN gagal / ikon tidak ada → paket bawaan
      inner = BUILTIN[FALLBACK];
      el.setAttribute('data-ic-fallback', '1');
    }
    if (inner) {
      svg.innerHTML = inner;
      el.setAttribute('data-ic-ok', name);
    } else {
      svg.innerHTML = '';                              // menunggu CDN (kotak ikon sudah punya ukuran tetap)
      el.removeAttribute('data-ic-ok');
      load(name);
    }
  }

  function hydrate(root) {
    var scope = root && root.querySelectorAll ? root : document;
    var els = scope.querySelectorAll('[data-ic]:not([data-ic-ok])');
    for (var i = 0; i < els.length; i++) paint(els[i]);
  }

  // Markup ikon untuk template string JS.
  // opts: { tone, badge, size ('sm'|'lg'|angka px), cls, label (aria-label), stroke }
  function html(name, opts) {
    opts = opts || {};
    var n = cleanName(name);
    var tone = opts.tone || TONE_OF[n] || 'slate';
    var cls = 'ui-ic' + (opts.badge ? ' ui-ic--badge' : '') + (opts.size === 'sm' ? ' ui-ic--sm' : '') + (opts.size === 'lg' ? ' ui-ic--lg' : '') + (opts.cls ? ' ' + esc(opts.cls) : '');
    var style = typeof opts.size === 'number' ? ' style="--ic-size:' + opts.size + 'px"' : '';
    var inner = getInner(n);
    if (!inner && failed[n]) inner = BUILTIN[FALLBACK];
    if (!inner) load(n);
    var a11y = opts.label ? ' role="img" aria-label="' + esc(opts.label) + '"' : ' aria-hidden="true"';
    return '<span class="' + cls + '" data-ic="' + n + '" data-tone="' + esc(tone) + '"' + (inner ? ' data-ic-ok="' + n + '"' : '') + style + a11y + '>' +
      '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">' + inner + '</svg></span>';
  }

  // Ubah penanda {{nama-ikon}} di dalam teks menjadi ikon (teks lain di-escape). Berguna untuk teks template.
  function iconize(text, opts) {
    return String(text == null ? '' : text).split(/(\{\{[a-z0-9-]+\}\})/).map(function (part) {
      var m = /^\{\{([a-z0-9-]+)\}\}$/.exec(part);
      return m ? html(m[1], opts) : part;
    }).join('');
  }

  var api = { version: VERSION, html: html, iconize: iconize, hydrate: hydrate, preload: preload, load: load, TONE_OF: TONE_OF, FALLBACK: FALLBACK, esc: esc };
  w.UIIcon = api;
  w.uiIcon = html;

  // Hidrasi otomatis semua [data-ic] (halaman awal + elemen yang ditambahkan belakangan oleh template/JS).
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    (w.requestAnimationFrame || w.setTimeout)(function () { queued = false; hydrate(document); });
  }
  function start() {
    hydrate(document);
    if (typeof w.MutationObserver === 'function') {
      new w.MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(window);
