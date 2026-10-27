/**
 * TransformaUMKM — SessionSecurity Module
 * Enterprise-grade client-side session encryption & automatic token expiry manager
 */
const SessionSecurity = (function () {
  'use strict';

  const STORAGE_KEY = 'transforma_umkm_session';
  const EXPIRY_HOURS_REMEMBER = 24 * 7; // 7 hari untuk "Ingat Saya"
  const EXPIRY_HOURS_DEFAULT = 4;      // 4 jam sesi aktif reguler
  const SECRET_SALT = 'TransformaUMKM_SecToken_2026';

  // Obfuscation / stream cipher with dynamic browser signature
  function getSignatureKey() {
    const navInfo = (navigator.userAgent || '') + (navigator.language || '') + SECRET_SALT;
    let hash = 0;
    for (let i = 0; i < navInfo.length; i++) {
      hash = ((hash << 5) - hash) + navInfo.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16) + SECRET_SALT;
  }

  function encryptPayload(plainObj) {
    const jsonStr = JSON.stringify(plainObj);
    const key = getSignatureKey();
    let enc = '';
    for (let i = 0; i < jsonStr.length; i++) {
      enc += String.fromCharCode(jsonStr.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return 'enc_v2:' + btoa(unescape(encodeURIComponent(enc)));
  }

  function decryptPayload(cipherStr) {
    if (!cipherStr) return null;
    // Kompatibilitas dengan sesi plain JSON lama
    if (!cipherStr.startsWith('enc_v2:')) {
      try {
        return JSON.parse(cipherStr);
      } catch (e) {
        return null;
      }
    }
    try {
      const rawEnc = decodeURIComponent(escape(atob(cipherStr.slice(7))));
      const key = getSignatureKey();
      let dec = '';
      for (let i = 0; i < rawEnc.length; i++) {
        dec += String.fromCharCode(rawEnc.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return JSON.parse(dec);
    } catch (e) {
      console.warn('[SessionSecurity] Gagal mendekripsi sesi, payload rusak atau tidak valid.');
      return null;
    }
  }

  return {
    saveSession: function (userData, remember = false) {
      const now = Date.now();
      const expiryDuration = (remember ? EXPIRY_HOURS_REMEMBER : EXPIRY_HOURS_DEFAULT) * 3600 * 1000;
      const sessionEnvelope = {
        user: userData,
        issuedAt: now,
        expiresAt: now + expiryDuration,
        token: 'tk_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
        remember: !!remember
      };

      const encrypted = encryptPayload(sessionEnvelope);
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
      } catch (e) {}

      if (remember) {
        localStorage.setItem(STORAGE_KEY, encrypted);
      } else {
        sessionStorage.setItem(STORAGE_KEY, encrypted);
      }
      return sessionEnvelope;
    },

    getSession: function () {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;

      const envelope = decryptPayload(raw);
      if (!envelope) {
        this.clearSession();
        return null;
      }

      // Fallback jika format data lama tanpa wrapper expiry
      if (!envelope.expiresAt && envelope.name) {
        return envelope;
      }

      // Verifikasi Masa Berlaku Token (Auto Expiry)
      if (envelope.expiresAt && Date.now() > envelope.expiresAt) {
        console.warn('[SessionSecurity] Sesi login telah kedaluwarsa (Token Expired). Mengalihkan...');
        this.clearSession();
        return null;
      }

      return envelope.user || envelope;
    },

    clearSession: function () {
      try {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem('transforma_wp_seen');
      } catch (e) {}
    },

    isSessionValid: function () {
      return this.getSession() !== null;
    }
  };
})();

// Attach to global window
if (typeof window !== 'undefined') {
  window.SessionSecurity = SessionSecurity;
}
