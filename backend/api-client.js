/**
 * TransformaUMKM — Frontend API Client
 * Wrapper untuk semua call ke backend REST API (http://localhost:3001)
 * Menyediakan fungsi fetch CRUD lengkap untuk ke-7 entitas bisnis:
 * 1. categories
 * 2. suppliers
 * 3. products
 * 4. customers
 * 5. transactions
 * 6. transactionItems
 * 7. stockMutations
 * Serta endpoint dashboard summary dan health check.
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
      if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        console.warn('[API] Backend tidak tersedia di ' + BASE_URL);
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
  const del    = (ep, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('DELETE', qs ? `${ep}?${qs}` : ep);
  };

  // ─── Health ──────────────────────────────────────────────────────────────
  const health = () => get('/health');

  // ─── 1. Categories ───────────────────────────────────────────────────────
  const categories = {
    getAll:   (params = {})         => get('/categories', params),
    getById:  (id)                  => get(`/categories/${id}`),
    create:   (data)                => post('/categories', data),
    update:   (id, data)            => put(`/categories/${id}`, data),
    remove:   (id)                  => del(`/categories/${id}`),
  };

  // ─── 2. Suppliers ────────────────────────────────────────────────────────
  const suppliers = {
    getAll:   (params = {})         => get('/suppliers', params),
    getById:  (id)                  => get(`/suppliers/${id}`),
    create:   (data)                => post('/suppliers', data),
    update:   (id, data)            => put(`/suppliers/${id}`, data),
    remove:   (id)                  => del(`/suppliers/${id}`),
  };

  // ─── 3. Products ─────────────────────────────────────────────────────────
  const products = {
    getAll:   (params = {})         => get('/products', params),
    getById:  (id)                  => get(`/products/${id}`),
    create:   (data)                => post('/products', data),
    update:   (id, data)            => put(`/products/${id}`, data),
    remove:   (id)                  => del(`/products/${id}`),
    restock:  (id, qty, ref)        => patch(`/products/${id}/restock`, { qty, reference_id: ref }),
    getLowStock: ()                 => get('/products', { low_stock: 'true' }),
  };

  // ─── 4. Customers ────────────────────────────────────────────────────────
  const customers = {
    getAll:   (params = {})         => get('/customers', params),
    getById:  (id)                  => get(`/customers/${id}`),
    create:   (data)                => post('/customers', data),
    update:   (id, data)            => put(`/customers/${id}`, data),
    remove:   (id)                  => del(`/customers/${id}`),
  };

  // ─── 5. Transactions ─────────────────────────────────────────────────────
  const transactions = {
    getAll:   (params = {})         => get('/transactions', params),
    getById:  (id)                  => get(`/transactions/${id}`),
    create:   (data)                => post('/transactions', data),
    update:   (id, data)            => put(`/transactions/${id}`, data),
    remove:   (id, permanent = false) => del(`/transactions/${id}`, permanent ? { permanent: 'true' } : {}),
    void:     (id)                  => del(`/transactions/${id}`),
  };

  // ─── 6. Transaction Items ────────────────────────────────────────────────
  const transactionItems = {
    getAll:   (params = {})         => get('/transaction-items', params),
    getById:  (id)                  => get(`/transaction-items/${id}`),
    create:   (data)                => post('/transaction-items', data),
    update:   (id, data)            => put(`/transaction-items/${id}`, data),
    remove:   (id)                  => del(`/transaction-items/${id}`),
  };

  // ─── 7. Stock Mutations ──────────────────────────────────────────────────
  const stockMutations = {
    getAll:   (params = {})         => get('/stock-mutations', params),
    getById:  (id)                  => get(`/stock-mutations/${id}`),
    create:   (data)                => post('/stock-mutations', data),
    update:   (id, data)            => put(`/stock-mutations/${id}`, data),
    remove:   (id)                  => del(`/stock-mutations/${id}`),
  };

  // ─── Dashboard ───────────────────────────────────────────────────────────
  const dashboard = {
    getSummary: ()                  => get('/dashboard/summary'),
  };

  // ─── Connectivity Check ──────────────────────────────────────────────────
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

  function onOnline(cb) {
    if (_isOnline) {
      cb();
    } else {
      _onlineCallbacks.push(cb);
    }
  }

  // Cek koneksi saat pertama kali dimuat
  checkConnectivity().then((online) => {
    if (online) {
      console.log('%c[API] OK - Backend terhubung — ' + BASE_URL, 'color: #22c55e; font-weight: bold');
      _onlineCallbacks.forEach(cb => {
        try { cb(); } catch (e) { console.error('[API] Callback error:', e); }
      });
      _onlineCallbacks = [];
    } else {
      console.warn('%c[API] PERINGATAN - Backend tidak aktif di ' + BASE_URL + ' — jalankan: pnpm backend', 'color: #f59e0b; font-weight: bold');
    }
  });

  return {
    BASE_URL,
    request,
    health,
    categories,
    suppliers,
    products,
    customers,
    transactions,
    transactionItems,
    stockMutations,
    dashboard,
    checkConnectivity,
    isOnline,
    onOnline,
  };
})();

// Expose ke window agar bisa dipakai oleh script.js dan komponen lain
window.API = API;
