/**
 * TransformaUMKM — Frontend API Client
 * Wrapper untuk semua call ke backend REST API (http://localhost:3001)
 * Digunakan oleh script.js sebagai pengganti localStorage operations
 */

'use strict';

const API = (() => {
  const BASE_URL = 'http://localhost:3001/api';

  // ─── HTTP Helper ─────────────────────────────────────────────────────────
  async function request(method, endpoint, body = null) {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, options);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      return data;
    } catch (err) {
      // Jika backend mati, tampilkan notifikasi tapi jangan crash app
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        console.warn('[API] Backend tidak tersedia, gunakan mode offline (localStorage)');
        throw new Error('OFFLINE');
      }
      throw err;
    }
  }

  const get    = (ep, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', qs ? `${ep}?${qs}` : ep);
  };
  const post   = (ep, body) => request('POST', ep, body);
  const put    = (ep, body) => request('PUT', ep, body);
  const patch  = (ep, body) => request('PATCH', ep, body);
  const del    = (ep)       => request('DELETE', ep);

  // ─── Health ──────────────────────────────────────────────────────────────
  const health = () => get('/health');

  // ─── Categories ──────────────────────────────────────────────────────────
  const categories = {
    getAll:   ()                    => get('/categories'),
    create:   (data)                => post('/categories', data),
    update:   (id, data)            => put(`/categories/${id}`, data),
    remove:   (id)                  => del(`/categories/${id}`),
  };

  // ─── Suppliers ───────────────────────────────────────────────────────────
  const suppliers = {
    getAll:   ()                    => get('/suppliers'),
    create:   (data)                => post('/suppliers', data),
    update:   (id, data)            => put(`/suppliers/${id}`, data),
    remove:   (id)                  => del(`/suppliers/${id}`),
  };

  // ─── Products ────────────────────────────────────────────────────────────
  const products = {
    getAll:   (params = {})         => get('/products', params),
    getById:  (id)                  => get(`/products/${id}`),
    create:   (data)                => post('/products', data),
    update:   (id, data)            => put(`/products/${id}`, data),
    remove:   (id)                  => del(`/products/${id}`),
    restock:  (id, qty, ref)        => patch(`/products/${id}/restock`, { qty, reference_id: ref }),
    getLowStock: ()                 => get('/products', { low_stock: 'true' }),
  };

  // ─── Customers ───────────────────────────────────────────────────────────
  const customers = {
    getAll:   (params = {})         => get('/customers', params),
    getById:  (id)                  => get(`/customers/${id}`),
    create:   (data)                => post('/customers', data),
    update:   (id, data)            => put(`/customers/${id}`, data),
    remove:   (id)                  => del(`/customers/${id}`),
  };

  // ─── Transactions ─────────────────────────────────────────────────────────
  const transactions = {
    getAll:   (params = {})         => get('/transactions', params),
    getById:  (id)                  => get(`/transactions/${id}`),
    create:   (data)                => post('/transactions', data),
    void:     (id)                  => del(`/transactions/${id}`),
  };

  // ─── Stock Mutations ──────────────────────────────────────────────────────
  const stockMutations = {
    getAll:   (params = {})         => get('/stock-mutations', params),
  };

  // ─── Dashboard ────────────────────────────────────────────────────────────
  const dashboard = {
    getSummary: ()                  => get('/dashboard/summary'),
  };

  // ─── Connectivity Check ───────────────────────────────────────────────────
  let _isOnline = false;
  let _onlineCallbacks = [];

  async function checkConnectivity() {
    try {
      await health();
      _isOnline = true;
    } catch {
      _isOnline = false;
    }
    return _isOnline;
  }

  function isOnline() { return _isOnline; }

  function onOnline(cb) { _onlineCallbacks.push(cb); }

  // Cek koneksi saat pertama kali dimuat
  checkConnectivity().then((online) => {
    if (online) {
      console.log('%c[API] ✅ Backend terhubung — http://localhost:3001', 'color: #22c55e; font-weight: bold');
      _onlineCallbacks.forEach(cb => cb());
    } else {
      console.warn('%c[API] ⚠️  Backend tidak aktif — jalankan: pnpm server', 'color: #f59e0b; font-weight: bold');
    }
  });

  return {
    health,
    categories,
    suppliers,
    products,
    customers,
    transactions,
    stockMutations,
    dashboard,
    checkConnectivity,
    isOnline,
    onOnline,
  };
})();

// Expose ke window agar bisa dipakai oleh script.js
window.API = API;
