/**
 * TransformaUMKM — Backend REST API Server (in-memory)
 * Stack : Node.js + Express + CORS
 * Data  : array/JSON in-memory (tanpa database, reset setiap server restart)
 * Port  : 3001 (frontend live-server di port 8080)
 */

'use strict';

const express = require('express');
const cors = require('cors');
const crypto = require('node:crypto');
const path = require('node:path');

const PORT = process.env.PORT || 3001;

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

const uuid = () => crypto.randomUUID();

const pad = (n) => String(n).padStart(2, '0');

/** Format lokal: YYYY-MM-DD HH:MM:SS */
function fmt(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
const nowLocal = () => fmt(new Date());
const todayLocal = () => nowLocal().slice(0, 10);

/** Waktu N hari lalu pada jam tertentu (untuk dummy data) */
function daysAgo(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return fmt(d);
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
const bad = (msg) => new HttpError(400, msg);
const notFound = (msg) => new HttpError(404, msg);
const conflict = (msg) => new HttpError(409, msg);

const isNum = (v) => v !== undefined && v !== null && v !== '' && Number.isFinite(Number(v));
const num = (v, def = 0) => (isNum(v) ? Number(v) : def);
const has = (obj, key) => obj && Object.prototype.hasOwnProperty.call(obj, key);
const norm = (s) => String(s ?? '').trim().toLowerCase();

// ═══════════════════════════════════════════════════════════════════════════════
// IN-MEMORY STORE (7 entitas)
// ═══════════════════════════════════════════════════════════════════════════════

const db = {
  categories: [],
  suppliers: [],
  products: [],
  customers: [],
  transactions: [],
  transactionItems: [],
  stockMutations: [],
};

/** Jalankan fn secara atomik: kalau error, seluruh perubahan dibatalkan. */
function atomic(fn) {
  const snapshot = structuredClone(db);
  try {
    return fn();
  } catch (err) {
    for (const key of Object.keys(db)) db[key] = snapshot[key];
    throw err;
  }
}

// ─── Finders ──────────────────────────────────────────────────────────────────
const findCategory = (id) => db.categories.find((x) => x.id === id);
const findSupplier = (id) => db.suppliers.find((x) => x.id === id);
const findProduct = (id) => db.products.find((x) => x.id === id);
const findCustomer = (id) => db.customers.find((x) => x.id === id);
const findTransaction = (id) => db.transactions.find((x) => x.id === id);
const findItem = (id) => db.transactionItems.find((x) => x.id === id);
const findMutation = (id) => db.stockMutations.find((x) => x.id === id);

// ─── Views (join manual) ──────────────────────────────────────────────────────
function productView(p) {
  return {
    ...p,
    category_name: findCategory(p.category_id)?.name ?? null,
    supplier_name: findSupplier(p.supplier_id)?.name ?? null,
  };
}

function transactionView(t, withItems = false) {
  const c = findCustomer(t.customer_id);
  const view = { ...t, customer_name: c?.name ?? null, customer_phone: c?.phone_whatsapp ?? null };
  if (withItems) view.items = db.transactionItems.filter((i) => i.transaction_id === t.id);
  return view;
}

function mutationView(m) {
  const p = findProduct(m.product_id);
  return { ...m, product_name: p?.name ?? null, sku: p?.sku ?? null };
}

// ─── Stok & mutasi ────────────────────────────────────────────────────────────
function logMutation(productId, type, qtyChange, stockAfter, referenceId, createdAt) {
  const m = {
    id: uuid(),
    product_id: productId,
    mutation_type: type,
    qty_change: qtyChange,
    stock_after: stockAfter,
    reference_id: referenceId ?? null,
    created_at: createdAt || nowLocal(),
  };
  db.stockMutations.push(m);
  return m;
}

/** Ubah stok produk + catat mutasi. Melempar 400 jika stok akan negatif. */
function applyStock(productId, delta, type, referenceId, createdAt) {
  const p = findProduct(productId);
  if (!p) throw notFound(`Produk ${productId} tidak ditemukan`);
  const after = p.stock + delta;
  if (after < 0) throw bad(`Stok "${p.name}" tidak cukup (tersedia ${p.stock}, diminta ${-delta})`);
  p.stock = after;
  p.updated_at = createdAt || nowLocal();
  return logMutation(productId, type, delta, after, referenceId, createdAt);
}

/** Hitung ulang stock_after seluruh mutasi satu produk berdasarkan urutan waktu. */
function rebuildStockAfter(productId, baseStock) {
  const list = db.stockMutations
    .map((m, idx) => ({ m, idx }))
    .filter((x) => x.m.product_id === productId)
    .sort((a, b) => a.m.created_at.localeCompare(b.m.created_at) || a.idx - b.idx);
  let running = baseStock;
  for (const { m } of list) {
    running += m.qty_change;
    m.stock_after = running;
  }
}

// ─── Customer ─────────────────────────────────────────────────────────────────
/** sign = +1 saat transaksi berlaku, -1 saat dibatalkan/diubah. */
function customerEffect(customerId, grandTotal, sign, at) {
  const c = findCustomer(customerId);
  if (!c) return;
  c.total_spent = Math.max(0, c.total_spent + sign * grandTotal);
  c.loyalty_points = Math.max(0, c.loyalty_points + sign * Math.floor(grandTotal / 10000));
  if (sign > 0) c.last_visit_at = (at || nowLocal()).slice(0, 10);
  if (c.total_spent >= 5000000) c.segment = 'VIP';
  else if (c.segment === 'VIP') c.segment = 'REGULAR';
  else if (sign > 0 && c.segment === 'INACTIVE') c.segment = 'REGULAR';
}

// ─── Transaksi ────────────────────────────────────────────────────────────────
const isActiveTrx = (t) => t.status !== 'VOID';

function buildItem(trxId, raw) {
  if (!raw || !raw.product_id) throw bad('item.product_id wajib diisi');
  const p = findProduct(raw.product_id);
  if (!p) throw notFound(`Produk ${raw.product_id} tidak ditemukan`);
  const quantity = Number(raw.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) throw bad('item.quantity harus bilangan bulat > 0');
  const unit_price = num(raw.unit_price, p.sell_price);
  return {
    id: raw.id || uuid(),
    transaction_id: trxId,
    product_id: p.id,
    product_name: raw.product_name || p.name,
    unit_cost: num(raw.unit_cost, p.cost_price),
    unit_price,
    quantity,
    subtotal_price: unit_price * quantity,
  };
}

/** Kurangi stok untuk item-item (SALE). Validasi total per produk dulu. */
function deductItems(items, trxId, at) {
  for (const it of items) applyStock(it.product_id, -it.quantity, 'SALE', trxId, at);
}

/** Kembalikan stok item-item (ADJUSTMENT). */
function restoreItems(items, ref, at) {
  for (const it of items) {
    if (findProduct(it.product_id)) applyStock(it.product_id, it.quantity, 'ADJUSTMENT', ref, at);
  }
}

function recomputeTotals(t, { keepGrand = false } = {}) {
  const items = db.transactionItems.filter((i) => i.transaction_id === t.id);
  t.subtotal = items.reduce((s, i) => s + i.subtotal_price, 0);
  if (!keepGrand) t.grand_total = Math.max(0, t.subtotal - t.discount_amount + t.tax_amount);
}

function createTransaction(body, { createdAt } = {}) {
  const { id, customer_id, items, payment_method } = body;
  if (!Array.isArray(items) || items.length === 0) throw bad('items wajib diisi (array, minimal 1)');
  if (!payment_method) throw bad('payment_method wajib diisi');
  if (customer_id && !findCustomer(customer_id)) throw notFound('Customer tidak ditemukan');

  const trxId = id || `TRX-${Date.now()}`;
  if (findTransaction(trxId)) throw conflict(`Transaksi ${trxId} sudah ada`);

  const at = createdAt || nowLocal();
  const built = items.map((raw) => buildItem(trxId, raw));

  const discount_amount = num(body.discount_amount);
  const tax_amount = num(body.tax_amount);
  const subtotal = isNum(body.subtotal) ? Number(body.subtotal) : built.reduce((s, i) => s + i.subtotal_price, 0);
  const grand_total = isNum(body.grand_total) ? Number(body.grand_total) : Math.max(0, subtotal - discount_amount + tax_amount);
  const cash_paid = num(body.cash_paid);
  const cash_change = isNum(body.cash_change)
    ? Number(body.cash_change)
    : (norm(payment_method) === 'cash' ? Math.max(0, cash_paid - grand_total) : 0);
  const status = body.status || 'SELESAI';

  const trx = {
    id: trxId,
    customer_id: customer_id || null,
    subtotal,
    discount_amount,
    tax_amount,
    grand_total,
    payment_method,
    cash_paid,
    cash_change,
    status,
    created_at: at,
  };

  db.transactions.push(trx);
  db.transactionItems.push(...built);
  if (isActiveTrx(trx)) {
    deductItems(built, trxId, at);
    if (trx.customer_id) customerEffect(trx.customer_id, trx.grand_total, +1, at);
  }
  return trx;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DUMMY DATA
// ═══════════════════════════════════════════════════════════════════════════════

function seed() {
  const created = daysAgo(14, 8, 0);

  db.categories.push(
    { id: 'cat-001', name: 'Makanan', description: 'Makanan siap saji dan bahan makanan', created_at: created },
    { id: 'cat-002', name: 'Minuman', description: 'Minuman kemasan dan seduhan', created_at: created },
    { id: 'cat-003', name: 'Sembako', description: 'Kebutuhan pokok sehari-hari', created_at: created },
    { id: 'cat-004', name: 'Camilan', description: 'Snack dan kue kering', created_at: created },
    { id: 'cat-005', name: 'Fashion', description: 'Pakaian dan aksesori', created_at: created },
  );

  db.suppliers.push(
    { id: 'sup-001', name: 'CV Sumber Pangan Jaya', phone_whatsapp: '081211110001', address: 'Jl. Pasar Baru No. 12, Bandung', created_at: created },
    { id: 'sup-002', name: 'UD Berkah Minuman', phone_whatsapp: '081211110002', address: 'Jl. Soekarno-Hatta No. 45, Bandung', created_at: created },
    { id: 'sup-003', name: 'PT Nusantara Grosir', phone_whatsapp: '081211110003', address: 'Jl. Raya Cibiru No. 88, Bandung', created_at: created },
    { id: 'sup-004', name: 'Toko Tekstil Mandiri', phone_whatsapp: '081211110004', address: 'Jl. Cigondewah No. 7, Bandung', created_at: created },
  );

  // stock di bawah = stok AWAL (sebelum dipotong transaksi dummy)
  const P = (id, sku, name, category_id, cost, sell, stock, min, supplier_id, icon = 'auto') => ({
    id, sku, name, category_id,
    cost_price: cost, sell_price: sell, stock, min_stock_threshold: min,
    supplier_id, icon_emoji: icon, is_active: true,
    created_at: created, updated_at: created,
  });
  db.products.push(
    P('prd-001', 'MKN-001', 'Nasi Goreng Spesial', 'cat-001', 12000, 22000, 40, 8, 'sup-001'),
    P('prd-002', 'MKN-002', 'Mie Ayam Bakso', 'cat-001', 9000, 18000, 35, 8, 'sup-001'),
    P('prd-003', 'MKN-003', 'Roti Bakar Cokelat', 'cat-001', 6000, 15000, 30, 6, 'sup-001'),
    P('prd-004', 'MNM-001', 'Kopi Susu Gula Aren', 'cat-002', 7000, 18000, 60, 10, 'sup-002'),
    P('prd-005', 'MNM-002', 'Teh Tarik Dingin', 'cat-002', 4000, 12000, 50, 10, 'sup-002'),
    P('prd-006', 'MNM-003', 'Air Mineral 600ml', 'cat-002', 2000, 5000, 120, 24, 'sup-002'),
    P('prd-007', 'SMB-001', 'Beras Premium 5kg', 'cat-003', 62000, 74000, 25, 5, 'sup-003'),
    P('prd-008', 'SMB-002', 'Minyak Goreng 1L', 'cat-003', 15000, 19000, 40, 8, 'sup-003'),
    P('prd-009', 'SMB-003', 'Telur Ayam 1kg', 'cat-003', 26000, 31000, 20, 5, 'sup-003'),
    P('prd-010', 'CMN-001', 'Keripik Singkong Pedas', 'cat-004', 5000, 12000, 45, 10, 'sup-001'),
    P('prd-011', 'CMN-002', 'Kue Kering Nastar', 'cat-004', 28000, 45000, 12, 5, 'sup-001'),
    P('prd-012', 'FSN-001', 'Kaos Polos Cotton Combed', 'cat-005', 35000, 65000, 18, 4, 'sup-004'),
  );

  // Mutasi stok awal (RESTOCK)
  for (const p of db.products) {
    logMutation(p.id, 'RESTOCK', p.stock, p.stock, 'INITIAL', created);
  }

  db.customers.push(
    { id: 'cus-001', name: 'Budi Santoso', phone_whatsapp: '081300000001', total_spent: 0, loyalty_points: 0, segment: 'REGULAR', notes: 'Langganan kopi pagi', last_visit_at: null, created_at: created },
    { id: 'cus-002', name: 'Siti Rahmawati', phone_whatsapp: '081300000002', total_spent: 0, loyalty_points: 0, segment: 'REGULAR', notes: 'Sering beli sembako', last_visit_at: null, created_at: created },
    { id: 'cus-003', name: 'Andi Pratama', phone_whatsapp: '081300000003', total_spent: 0, loyalty_points: 0, segment: 'REGULAR', notes: null, last_visit_at: null, created_at: created },
    { id: 'cus-004', name: 'Dewi Lestari', phone_whatsapp: '081300000004', total_spent: 0, loyalty_points: 0, segment: 'REGULAR', notes: 'Pesan kue untuk acara kantor', last_visit_at: null, created_at: created },
    { id: 'cus-005', name: 'Rizky Maulana', phone_whatsapp: '081300000005', total_spent: 0, loyalty_points: 0, segment: 'REGULAR', notes: null, last_visit_at: null, created_at: created },
    { id: 'cus-006', name: 'Ayu Anggraini', phone_whatsapp: '081300000006', total_spent: 0, loyalty_points: 0, segment: 'INACTIVE', notes: 'Belum belanja lagi sejak bulan lalu', last_visit_at: null, created_at: created },
  );

  // Transaksi dummy (dari yang paling lama) — dibuat lewat logika yang sama dgn API,
  // sehingga stok, mutasi, dan total belanja customer otomatis konsisten.
  const trx = (id, ago, h, m, customer_id, payment_method, discount, items, cash_paid) => {
    const subtotal = items.reduce((s, [pid, q]) => s + findProduct(pid).sell_price * q, 0);
    createTransaction({
      id, customer_id, payment_method,
      discount_amount: discount, tax_amount: 0,
      subtotal, grand_total: subtotal - discount,
      cash_paid: cash_paid || 0,
      items: items.map(([product_id, quantity]) => ({ product_id, quantity })),
    }, { createdAt: daysAgo(ago, h, m) });
  };

  trx('TRX-1001', 6, 9, 15, 'cus-001', 'QRIS', 0, [['prd-004', 2], ['prd-003', 1]]);
  trx('TRX-1002', 5, 11, 30, 'cus-002', 'CASH', 0, [['prd-007', 1], ['prd-008', 2], ['prd-009', 1]], 150000);
  trx('TRX-1003', 4, 13, 5, null, 'CASH', 0, [['prd-001', 2], ['prd-005', 2]], 70000);
  trx('TRX-1004', 3, 10, 45, 'cus-003', 'TRANSFER', 5000, [['prd-012', 2], ['prd-010', 3]]);
  trx('TRX-1005', 2, 15, 20, 'cus-004', 'QRIS', 0, [['prd-011', 3], ['prd-004', 2]]);
  trx('TRX-1006', 1, 12, 10, 'cus-001', 'CASH', 0, [['prd-002', 2], ['prd-006', 3]], 60000);
  trx('TRX-1007', 1, 18, 40, 'cus-005', 'QRIS', 0, [['prd-007', 1], ['prd-012', 1], ['prd-005', 2]]);
  trx('TRX-1008', 0, 8, 30, 'cus-002', 'QRIS', 0, [['prd-004', 3], ['prd-001', 1]]);
}

seed();

// ═══════════════════════════════════════════════════════════════════════════════
// EXPRESS APP
// ═══════════════════════════════════════════════════════════════════════════════

const app = express();

app.use(cors({
  origin: (origin, cb) => {
    // izinkan tanpa origin (curl/Postman) dan localhost/127.0.0.1 di port mana pun
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return cb(null, true);
    cb(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..')));

const ok = (res, data, status = 200) => res.status(status).json({ success: true, data });
const body = (req) => req.body || {};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/categories', (req, res) => {
  const rows = [...db.categories].sort((a, b) => a.name.localeCompare(b.name));
  ok(res, rows);
});

app.get('/api/categories/:id', (req, res) => {
  const row = findCategory(req.params.id);
  if (!row) throw notFound('Kategori tidak ditemukan');
  ok(res, row);
});

app.post('/api/categories', (req, res) => {
  const { name, description } = body(req);
  if (!name) throw bad('name wajib diisi');
  if (db.categories.some((c) => norm(c.name) === norm(name))) throw conflict('Nama kategori sudah ada');
  const row = { id: body(req).id || uuid(), name, description: description || null, created_at: nowLocal() };
  db.categories.push(row);
  ok(res, row, 201);
});

app.put('/api/categories/:id', (req, res) => {
  const row = findCategory(req.params.id);
  if (!row) throw notFound('Kategori tidak ditemukan');
  const { name, description } = body(req);
  if (name !== undefined) {
    if (!name) throw bad('name tidak boleh kosong');
    if (db.categories.some((c) => c.id !== row.id && norm(c.name) === norm(name))) throw conflict('Nama kategori sudah ada');
    row.name = name;
  }
  if (description !== undefined) row.description = description || null;
  ok(res, row);
});

app.delete('/api/categories/:id', (req, res) => {
  const idx = db.categories.findIndex((c) => c.id === req.params.id);
  if (idx === -1) throw notFound('Kategori tidak ditemukan');
  db.categories.splice(idx, 1);
  db.products.forEach((p) => { if (p.category_id === req.params.id) p.category_id = null; });
  res.json({ success: true, message: 'Kategori dihapus' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/suppliers', (req, res) => {
  const rows = [...db.suppliers].sort((a, b) => a.name.localeCompare(b.name));
  ok(res, rows);
});

app.get('/api/suppliers/:id', (req, res) => {
  const row = findSupplier(req.params.id);
  if (!row) throw notFound('Supplier tidak ditemukan');
  ok(res, row);
});

app.post('/api/suppliers', (req, res) => {
  const { name, phone_whatsapp, address } = body(req);
  if (!name || !phone_whatsapp) throw bad('name dan phone_whatsapp wajib diisi');
  const row = { id: body(req).id || uuid(), name, phone_whatsapp, address: address || null, created_at: nowLocal() };
  db.suppliers.push(row);
  ok(res, row, 201);
});

app.put('/api/suppliers/:id', (req, res) => {
  const row = findSupplier(req.params.id);
  if (!row) throw notFound('Supplier tidak ditemukan');
  const { name, phone_whatsapp, address } = body(req);
  if (name !== undefined) { if (!name) throw bad('name tidak boleh kosong'); row.name = name; }
  if (phone_whatsapp !== undefined) { if (!phone_whatsapp) throw bad('phone_whatsapp tidak boleh kosong'); row.phone_whatsapp = phone_whatsapp; }
  if (address !== undefined) row.address = address || null;
  ok(res, row);
});

app.delete('/api/suppliers/:id', (req, res) => {
  const idx = db.suppliers.findIndex((s) => s.id === req.params.id);
  if (idx === -1) throw notFound('Supplier tidak ditemukan');
  db.suppliers.splice(idx, 1);
  db.products.forEach((p) => { if (p.supplier_id === req.params.id) p.supplier_id = null; });
  res.json({ success: true, message: 'Supplier dihapus' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/products?search=&category=&supplier=&low_stock=true&include_inactive=true
app.get('/api/products', (req, res) => {
  const { search, category, supplier, low_stock, include_inactive } = req.query;
  let rows = db.products.filter((p) => include_inactive === 'true' || p.is_active);
  if (search) rows = rows.filter((p) => norm(p.name).includes(norm(search)) || norm(p.sku).includes(norm(search)));
  if (category) rows = rows.filter((p) => p.category_id === category);
  if (supplier) rows = rows.filter((p) => p.supplier_id === supplier);
  if (low_stock === 'true') rows = rows.filter((p) => p.stock <= p.min_stock_threshold);
  rows = rows.map(productView).sort((a, b) => a.name.localeCompare(b.name));
  ok(res, rows);
});

app.get('/api/products/:id', (req, res) => {
  const row = findProduct(req.params.id);
  if (!row) throw notFound('Produk tidak ditemukan');
  ok(res, productView(row));
});

app.post('/api/products', (req, res) => {
  const b = body(req);
  if (!b.sku || !b.name) throw bad('sku dan name wajib diisi');
  if (db.products.some((p) => norm(p.sku) === norm(b.sku))) throw conflict('SKU sudah dipakai');
  if (b.category_id && !findCategory(b.category_id)) throw bad('category_id tidak valid');
  if (b.supplier_id && !findSupplier(b.supplier_id)) throw bad('supplier_id tidak valid');

  const stock = Math.max(0, Math.trunc(num(b.stock)));
  const now = nowLocal();
  const row = {
    id: b.id || uuid(),
    sku: b.sku,
    name: b.name,
    category_id: b.category_id || null,
    cost_price: num(b.cost_price),
    sell_price: num(b.sell_price),
    stock,
    min_stock_threshold: isNum(b.min_stock_threshold) ? Number(b.min_stock_threshold) : 5,
    supplier_id: b.supplier_id || null,
    icon_emoji: b.icon_emoji || 'auto',
    is_active: true,
    created_at: now,
    updated_at: now,
  };
  db.products.push(row);
  if (stock > 0) logMutation(row.id, 'RESTOCK', stock, stock, 'INITIAL', now);
  ok(res, productView(row), 201);
});

app.put('/api/products/:id', (req, res) => {
  const row = findProduct(req.params.id);
  if (!row) throw notFound('Produk tidak ditemukan');
  const b = body(req);

  if (b.sku !== undefined) {
    if (!b.sku) throw bad('sku tidak boleh kosong');
    if (db.products.some((p) => p.id !== row.id && norm(p.sku) === norm(b.sku))) throw conflict('SKU sudah dipakai');
  }
  if (b.category_id && !findCategory(b.category_id)) throw bad('category_id tidak valid');
  if (b.supplier_id && !findSupplier(b.supplier_id)) throw bad('supplier_id tidak valid');
  if (b.stock !== undefined && (!isNum(b.stock) || Number(b.stock) < 0)) throw bad('stock harus angka >= 0');

  const oldStock = row.stock;
  if (b.sku !== undefined) row.sku = b.sku;
  if (b.name !== undefined) row.name = b.name;
  if (b.category_id !== undefined) row.category_id = b.category_id || null;
  if (b.supplier_id !== undefined) row.supplier_id = b.supplier_id || null;
  if (b.cost_price !== undefined) row.cost_price = num(b.cost_price, row.cost_price);
  if (b.sell_price !== undefined) row.sell_price = num(b.sell_price, row.sell_price);
  if (b.min_stock_threshold !== undefined) row.min_stock_threshold = num(b.min_stock_threshold, row.min_stock_threshold);
  if (b.icon_emoji !== undefined) row.icon_emoji = b.icon_emoji || 'auto';
  if (b.is_active !== undefined) row.is_active = !!b.is_active;
  row.updated_at = nowLocal();

  if (b.stock !== undefined && Math.trunc(Number(b.stock)) !== oldStock) {
    const newStock = Math.trunc(Number(b.stock));
    row.stock = newStock;
    logMutation(row.id, 'ADJUSTMENT', newStock - oldStock, newStock, 'MANUAL-EDIT');
  }
  ok(res, productView(row));
});

// Soft delete: produk dinonaktifkan (riwayat transaksi tetap utuh)
app.delete('/api/products/:id', (req, res) => {
  const row = findProduct(req.params.id);
  if (!row) throw notFound('Produk tidak ditemukan');
  row.is_active = false;
  row.updated_at = nowLocal();
  res.json({ success: true, message: 'Produk dinonaktifkan' });
});

// PATCH /api/products/:id/restock — tambah stok
app.patch('/api/products/:id/restock', (req, res) => {
  const qty = Number(body(req).qty);
  if (!Number.isInteger(qty) || qty <= 0) throw bad('qty harus bilangan bulat > 0');
  if (!findProduct(req.params.id)) throw notFound('Produk tidak ditemukan');
  const m = applyStock(req.params.id, qty, 'RESTOCK', body(req).reference_id || null);
  ok(res, { product_id: req.params.id, new_stock: m.stock_after });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════

const SEGMENTS = ['REGULAR', 'VIP', 'INACTIVE'];

// GET /api/customers?search=&segment=
app.get('/api/customers', (req, res) => {
  const { search, segment } = req.query;
  let rows = [...db.customers];
  if (search) rows = rows.filter((c) => norm(c.name).includes(norm(search)) || norm(c.phone_whatsapp).includes(norm(search)));
  if (segment) rows = rows.filter((c) => c.segment === segment);
  rows.sort((a, b) => a.name.localeCompare(b.name));
  ok(res, rows);
});

app.get('/api/customers/:id', (req, res) => {
  const row = findCustomer(req.params.id);
  if (!row) throw notFound('Customer tidak ditemukan');
  ok(res, row);
});

app.post('/api/customers', (req, res) => {
  const b = body(req);
  if (!b.name || !b.phone_whatsapp) throw bad('name dan phone_whatsapp wajib diisi');
  if (db.customers.some((c) => c.phone_whatsapp === b.phone_whatsapp)) throw conflict('Nomor WhatsApp sudah terdaftar');
  if (b.segment && !SEGMENTS.includes(b.segment)) throw bad(`segment harus salah satu dari: ${SEGMENTS.join(', ')}`);
  const row = {
    id: b.id || uuid(),
    name: b.name,
    phone_whatsapp: b.phone_whatsapp,
    total_spent: 0,
    loyalty_points: 0,
    segment: b.segment || 'REGULAR',
    notes: b.notes || null,
    last_visit_at: null,
    created_at: nowLocal(),
  };
  db.customers.push(row);
  ok(res, row, 201);
});

app.put('/api/customers/:id', (req, res) => {
  const row = findCustomer(req.params.id);
  if (!row) throw notFound('Customer tidak ditemukan');
  const b = body(req);
  if (b.name !== undefined && !b.name) throw bad('name tidak boleh kosong');
  if (b.phone_whatsapp !== undefined) {
    if (!b.phone_whatsapp) throw bad('phone_whatsapp tidak boleh kosong');
    if (db.customers.some((c) => c.id !== row.id && c.phone_whatsapp === b.phone_whatsapp)) throw conflict('Nomor WhatsApp sudah terdaftar');
  }
  if (b.segment !== undefined && !SEGMENTS.includes(b.segment)) throw bad(`segment harus salah satu dari: ${SEGMENTS.join(', ')}`);

  if (b.name !== undefined) row.name = b.name;
  if (b.phone_whatsapp !== undefined) row.phone_whatsapp = b.phone_whatsapp;
  if (b.notes !== undefined) row.notes = b.notes || null;
  if (b.segment !== undefined) row.segment = b.segment;
  if (b.loyalty_points !== undefined) row.loyalty_points = Math.max(0, Math.trunc(num(b.loyalty_points, row.loyalty_points)));
  ok(res, row);
});

app.delete('/api/customers/:id', (req, res) => {
  const idx = db.customers.findIndex((c) => c.id === req.params.id);
  if (idx === -1) throw notFound('Customer tidak ditemukan');
  db.customers.splice(idx, 1);
  db.transactions.forEach((t) => { if (t.customer_id === req.params.id) t.customer_id = null; });
  res.json({ success: true, message: 'Customer dihapus' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/transactions?limit=50&offset=0&date_from=&date_to=&customer_id=&status=
app.get('/api/transactions', (req, res) => {
  const { limit = 50, offset = 0, date_from, date_to, customer_id, status } = req.query;
  let rows = [...db.transactions];
  if (date_from) rows = rows.filter((t) => t.created_at.slice(0, 10) >= date_from);
  if (date_to) rows = rows.filter((t) => t.created_at.slice(0, 10) <= date_to);
  if (customer_id) rows = rows.filter((t) => t.customer_id === customer_id);
  if (status) rows = rows.filter((t) => t.status === status);
  rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const start = Math.max(0, parseInt(offset, 10) || 0);
  const size = Math.max(0, parseInt(limit, 10) || 50);
  ok(res, rows.slice(start, start + size).map((t) => transactionView(t)));
});

// GET /api/transactions/:id — beserta items
app.get('/api/transactions/:id', (req, res) => {
  const t = findTransaction(req.params.id);
  if (!t) throw notFound('Transaksi tidak ditemukan');
  ok(res, transactionView(t, true));
});

// POST /api/transactions — buat transaksi + potong stok + catat mutasi + update customer
app.post('/api/transactions', (req, res) => {
  const t = atomic(() => createTransaction(body(req)));
  ok(res, transactionView(t, true), 201);
});

// PUT /api/transactions/:id — ubah header; jika `items` dikirim, item diganti total
app.put('/api/transactions/:id', (req, res) => {
  const t0 = findTransaction(req.params.id);
  if (!t0) throw notFound('Transaksi tidak ditemukan');
  const b = body(req);
  if (b.customer_id && !findCustomer(b.customer_id)) throw notFound('Customer tidak ditemukan');
  if (b.items !== undefined && (!Array.isArray(b.items) || b.items.length === 0)) throw bad('items harus array dengan minimal 1 item');

  const result = atomic(() => {
    const t = findTransaction(req.params.id);
    const at = nowLocal();
    const ref = `EDIT-${t.id}`;

    // 1) Batalkan efek lama (stok & customer) bila transaksi sebelumnya aktif
    if (isActiveTrx(t)) {
      restoreItems(db.transactionItems.filter((i) => i.transaction_id === t.id), ref, at);
      if (t.customer_id) customerEffect(t.customer_id, t.grand_total, -1, at);
    }

    // 2) Terapkan perubahan
    if (b.customer_id !== undefined) t.customer_id = b.customer_id || null;
    if (b.payment_method !== undefined) {
      if (!b.payment_method) throw bad('payment_method tidak boleh kosong');
      t.payment_method = b.payment_method;
    }
    if (b.status !== undefined) {
      if (!b.status) throw bad('status tidak boleh kosong');
      t.status = b.status;
    }
    if (b.discount_amount !== undefined) t.discount_amount = num(b.discount_amount);
    if (b.tax_amount !== undefined) t.tax_amount = num(b.tax_amount);
    if (b.cash_paid !== undefined) t.cash_paid = num(b.cash_paid);
    if (b.created_at !== undefined && b.created_at) t.created_at = String(b.created_at);

    if (b.items !== undefined) {
      const built = b.items.map((raw) => buildItem(t.id, raw));
      db.transactionItems = db.transactionItems.filter((i) => i.transaction_id !== t.id);
      db.transactionItems.push(...built);
    }

    // 3) Hitung ulang total (kecuali grand_total dikirim eksplisit)
    recomputeTotals(t, { keepGrand: isNum(b.grand_total) });
    if (isNum(b.grand_total)) t.grand_total = Number(b.grand_total);
    t.cash_change = isNum(b.cash_change)
      ? Number(b.cash_change)
      : (norm(t.payment_method) === 'cash' ? Math.max(0, t.cash_paid - t.grand_total) : 0);

    // 4) Terapkan efek baru bila transaksi aktif
    if (isActiveTrx(t)) {
      deductItems(db.transactionItems.filter((i) => i.transaction_id === t.id), t.id, at);
      if (t.customer_id) customerEffect(t.customer_id, t.grand_total, +1, at);
    }
    return t;
  });

  ok(res, transactionView(result, true));
});

// DELETE /api/transactions/:id
//   default            → VOID (stok dikembalikan, data tetap ada)
//   ?permanent=true    → hapus permanen beserta item-itemnya
app.delete('/api/transactions/:id', (req, res) => {
  const t0 = findTransaction(req.params.id);
  if (!t0) throw notFound('Transaksi tidak ditemukan');
  const permanent = req.query.permanent === 'true';

  atomic(() => {
    const t = findTransaction(req.params.id);
    const items = db.transactionItems.filter((i) => i.transaction_id === t.id);
    const at = nowLocal();

    if (isActiveTrx(t)) {
      restoreItems(items, `VOID-${t.id}`, at);
      if (t.customer_id) customerEffect(t.customer_id, t.grand_total, -1, at);
    }
    if (permanent) {
      db.transactionItems = db.transactionItems.filter((i) => i.transaction_id !== t.id);
      db.transactions = db.transactions.filter((x) => x.id !== t.id);
    } else {
      t.status = 'VOID';
    }
  });

  res.json({
    success: true,
    message: permanent
      ? `Transaksi ${req.params.id} dihapus permanen, stok dikembalikan`
      : `Transaksi ${req.params.id} di-void, stok sudah dikembalikan`,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. TRANSACTION ITEMS
//    Perubahan item otomatis menyesuaikan stok, mutasi, dan total transaksi induk.
// ═══════════════════════════════════════════════════════════════════════════════

/** Hitung ulang total transaksi induk & sesuaikan total belanja customer. */
function syncParentTransaction(t, at) {
  const oldGrand = t.grand_total;
  recomputeTotals(t);
  if (norm(t.payment_method) === 'cash') t.cash_change = Math.max(0, t.cash_paid - t.grand_total);
  if (isActiveTrx(t) && t.customer_id && t.grand_total !== oldGrand) {
    customerEffect(t.customer_id, oldGrand, -1, at);
    customerEffect(t.customer_id, t.grand_total, +1, at);
  }
}

// GET /api/transaction-items?transaction_id=&product_id=
app.get('/api/transaction-items', (req, res) => {
  const { transaction_id, product_id } = req.query;
  let rows = [...db.transactionItems];
  if (transaction_id) rows = rows.filter((i) => i.transaction_id === transaction_id);
  if (product_id) rows = rows.filter((i) => i.product_id === product_id);
  ok(res, rows);
});

app.get('/api/transaction-items/:id', (req, res) => {
  const row = findItem(req.params.id);
  if (!row) throw notFound('Item transaksi tidak ditemukan');
  ok(res, row);
});

app.post('/api/transaction-items', (req, res) => {
  const b = body(req);
  if (!b.transaction_id) throw bad('transaction_id wajib diisi');
  const t0 = findTransaction(b.transaction_id);
  if (!t0) throw notFound('Transaksi tidak ditemukan');

  const created = atomic(() => {
    const t = findTransaction(b.transaction_id);
    const at = nowLocal();
    const item = buildItem(t.id, b);
    db.transactionItems.push(item);
    if (isActiveTrx(t)) applyStock(item.product_id, -item.quantity, 'SALE', t.id, at);
    syncParentTransaction(t, at);
    return item;
  });
  ok(res, created, 201);
});

app.put('/api/transaction-items/:id', (req, res) => {
  const old0 = findItem(req.params.id);
  if (!old0) throw notFound('Item transaksi tidak ditemukan');
  const b = body(req);

  const updated = atomic(() => {
    const item = findItem(req.params.id);
    const t = findTransaction(item.transaction_id);
    const at = nowLocal();
    const active = t && isActiveTrx(t);
    const ref = `EDIT-${item.id}`;

    // kembalikan stok lama, lalu terapkan item baru
    if (active) applyStock(item.product_id, item.quantity, 'ADJUSTMENT', ref, at);

    const next = buildItem(item.transaction_id, {
      id: item.id,
      product_id: b.product_id ?? item.product_id,
      quantity: b.quantity ?? item.quantity,
      unit_price: b.unit_price ?? item.unit_price,
      unit_cost: b.unit_cost ?? item.unit_cost,
      product_name: b.product_name ?? (b.product_id && b.product_id !== item.product_id ? undefined : item.product_name),
    });
    Object.assign(item, next);

    if (active) applyStock(item.product_id, -item.quantity, 'SALE', item.transaction_id, at);
    if (t) syncParentTransaction(t, at);
    return item;
  });
  ok(res, updated);
});

app.delete('/api/transaction-items/:id', (req, res) => {
  if (!findItem(req.params.id)) throw notFound('Item transaksi tidak ditemukan');

  atomic(() => {
    const item = findItem(req.params.id);
    const t = findTransaction(item.transaction_id);
    const at = nowLocal();
    if (t && isActiveTrx(t)) applyStock(item.product_id, item.quantity, 'ADJUSTMENT', `DEL-ITEM-${item.id}`, at);
    db.transactionItems = db.transactionItems.filter((i) => i.id !== item.id);
    if (t) syncParentTransaction(t, at);
  });
  res.json({ success: true, message: 'Item transaksi dihapus, stok dikembalikan' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. STOCK MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const MUTATION_TYPES = ['SALE', 'RESTOCK', 'ADJUSTMENT'];

// GET /api/stock-mutations?product_id=&mutation_type=&limit=100
app.get('/api/stock-mutations', (req, res) => {
  const { product_id, mutation_type, limit = 100 } = req.query;
  let rows = db.stockMutations.map((m, idx) => ({ m, idx }));
  if (product_id) rows = rows.filter((x) => x.m.product_id === product_id);
  if (mutation_type) rows = rows.filter((x) => x.m.mutation_type === mutation_type);
  rows.sort((a, b) => b.m.created_at.localeCompare(a.m.created_at) || b.idx - a.idx);
  const size = Math.max(0, parseInt(limit, 10) || 100);
  ok(res, rows.slice(0, size).map((x) => mutationView(x.m)));
});

app.get('/api/stock-mutations/:id', (req, res) => {
  const m = findMutation(req.params.id);
  if (!m) throw notFound('Mutasi stok tidak ditemukan');
  ok(res, mutationView(m));
});

// POST — catat mutasi manual: stok produk berubah sebesar qty_change
app.post('/api/stock-mutations', (req, res) => {
  const b = body(req);
  if (!b.product_id) throw bad('product_id wajib diisi');
  if (!MUTATION_TYPES.includes(b.mutation_type)) throw bad(`mutation_type harus salah satu dari: ${MUTATION_TYPES.join(', ')}`);
  const qty = Number(b.qty_change);
  if (!Number.isInteger(qty) || qty === 0) throw bad('qty_change harus bilangan bulat dan tidak boleh 0');
  if (!findProduct(b.product_id)) throw notFound('Produk tidak ditemukan');

  const m = applyStock(b.product_id, qty, b.mutation_type, b.reference_id || null, b.created_at || undefined);
  ok(res, mutationView(m), 201);
});

// PUT — ubah mutasi; perubahan qty_change ikut mengubah stok produk & stock_after berantai
app.put('/api/stock-mutations/:id', (req, res) => {
  if (!findMutation(req.params.id)) throw notFound('Mutasi stok tidak ditemukan');
  const b = body(req);
  if (b.product_id !== undefined && b.product_id !== findMutation(req.params.id).product_id) {
    throw bad('product_id tidak dapat diubah; hapus mutasi lalu buat baru');
  }
  if (b.mutation_type !== undefined && !MUTATION_TYPES.includes(b.mutation_type)) {
    throw bad(`mutation_type harus salah satu dari: ${MUTATION_TYPES.join(', ')}`);
  }
  if (b.qty_change !== undefined && (!Number.isInteger(Number(b.qty_change)) || Number(b.qty_change) === 0)) {
    throw bad('qty_change harus bilangan bulat dan tidak boleh 0');
  }

  const m = atomic(() => {
    const mut = findMutation(req.params.id);
    const p = findProduct(mut.product_id);

    if (b.mutation_type !== undefined) mut.mutation_type = b.mutation_type;
    if (b.reference_id !== undefined) mut.reference_id = b.reference_id || null;
    if (b.created_at !== undefined && b.created_at) mut.created_at = String(b.created_at);

    if (p) {
      const sumAll = () => db.stockMutations.filter((x) => x.product_id === p.id).reduce((s, x) => s + x.qty_change, 0);
      const base = p.stock - sumAll();          // stok sebelum mutasi pertama
      if (b.qty_change !== undefined) mut.qty_change = Number(b.qty_change);
      p.stock = base + sumAll();
      if (p.stock < 0) throw bad(`Perubahan ini membuat stok "${p.name}" negatif`);
      p.updated_at = nowLocal();
      rebuildStockAfter(p.id, base);
    } else if (b.qty_change !== undefined) {
      mut.qty_change = Number(b.qty_change);
    }
    return mut;
  });
  ok(res, mutationView(m));
});

// DELETE — hapus mutasi; efeknya pada stok produk dibatalkan
app.delete('/api/stock-mutations/:id', (req, res) => {
  if (!findMutation(req.params.id)) throw notFound('Mutasi stok tidak ditemukan');

  atomic(() => {
    const mut = findMutation(req.params.id);
    const p = findProduct(mut.product_id);
    if (p) {
      const base = p.stock - db.stockMutations.filter((x) => x.product_id === p.id).reduce((s, x) => s + x.qty_change, 0);
      db.stockMutations = db.stockMutations.filter((x) => x.id !== mut.id);
      p.stock = base + db.stockMutations.filter((x) => x.product_id === p.id).reduce((s, x) => s + x.qty_change, 0);
      if (p.stock < 0) throw bad(`Menghapus mutasi ini membuat stok "${p.name}" negatif`);
      p.updated_at = nowLocal();
      rebuildStockAfter(p.id, base);
    } else {
      db.stockMutations = db.stockMutations.filter((x) => x.id !== mut.id);
    }
  });
  res.json({ success: true, message: 'Mutasi stok dihapus, stok produk disesuaikan' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD & HEALTH
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/api/dashboard/summary', (req, res) => {
  const today = todayLocal();
  const month = today.slice(0, 7);
  const valid = db.transactions.filter(isActiveTrx);
  const sum = (arr) => arr.reduce((s, t) => s + t.grand_total, 0);

  // 7 hari terakhir (hanya hari yang ada transaksinya, urut naik)
  const from = new Date();
  from.setDate(from.getDate() - 6);
  const fromStr = fmt(from).slice(0, 10);
  const perDay = {};
  for (const t of valid) {
    const d = t.created_at.slice(0, 10);
    if (d >= fromStr) perDay[d] = (perDay[d] || 0) + t.grand_total;
  }
  const revenue_7days = Object.keys(perDay).sort().map((date) => ({ date, total: perDay[date] }));

  // Top 5 produk terlaris
  const validIds = new Set(valid.map((t) => t.id));
  const agg = {};
  for (const i of db.transactionItems) {
    if (!validIds.has(i.transaction_id)) continue;
    const a = (agg[i.product_name] ||= { product_name: i.product_name, total_qty: 0, total_revenue: 0 });
    a.total_qty += i.quantity;
    a.total_revenue += i.subtotal_price;
  }
  const top_products = Object.values(agg).sort((a, b) => b.total_qty - a.total_qty).slice(0, 5);

  const activeProducts = db.products.filter((p) => p.is_active);
  ok(res, {
    revenue: {
      total: sum(valid),
      this_month: sum(valid.filter((t) => t.created_at.startsWith(month))),
      today: sum(valid.filter((t) => t.created_at.startsWith(today))),
    },
    transactions: { total: valid.length },
    products: {
      total: activeProducts.length,
      low_stock: activeProducts.filter((p) => p.stock <= p.min_stock_threshold).length,
    },
    customers: {
      total: db.customers.length,
      vip: db.customers.filter((c) => c.segment === 'VIP').length,
    },
    charts: { revenue_7days },
    top_products,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    version: '2.0.0',
    storage: 'in-memory',
    counts: Object.fromEntries(Object.entries(db).map(([k, v]) => [k, v.length])),
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 & Error handler ──────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint tidak ditemukan' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, error: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, error: 'Body JSON tidak valid' });
  }
  console.error('[API ERROR]', err);
  res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\nTransformaUMKM API Server (in-memory) berjalan di:');
    console.log(`   >  http://localhost:${PORT}`);
    console.log(`   >  Health: http://localhost:${PORT}/api/health\n`);
  });
}

module.exports = app;
