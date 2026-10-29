/**
 * TransformaUMKM — Backend REST API Server
 * Stack: Node.js (v22+) + Express + node:sqlite (built-in)
 * Port: 3001 (frontend live-server tetap di port 8080)
 */

'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

// ─── Config ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, 'database', 'transforma.db');

// ─── Database Init ────────────────────────────────────────────────────────────
// Pastikan folder database ada
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

// Aktifkan Foreign Key support & WAL mode untuk performa
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Buat semua tabel kalau belum ada
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_whatsapp TEXT NOT NULL,
    address TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    cost_price REAL NOT NULL DEFAULT 0,
    sell_price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock_threshold INTEGER NOT NULL DEFAULT 5,
    supplier_id TEXT REFERENCES suppliers(id) ON DELETE SET NULL,
    icon_emoji TEXT DEFAULT '📦',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    updated_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone_whatsapp TEXT NOT NULL UNIQUE,
    total_spent REAL DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    segment TEXT DEFAULT 'REGULAR',
    notes TEXT,
    last_visit_at TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    customer_id TEXT REFERENCES customers(id) ON DELETE SET NULL,
    subtotal REAL NOT NULL,
    discount_amount REAL DEFAULT 0,
    tax_amount REAL DEFAULT 0,
    grand_total REAL NOT NULL,
    payment_method TEXT NOT NULL,
    cash_paid REAL DEFAULT 0,
    cash_change REAL DEFAULT 0,
    status TEXT DEFAULT 'SELESAI',
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    unit_cost REAL NOT NULL,
    unit_price REAL NOT NULL,
    quantity INTEGER NOT NULL,
    subtotal_price REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS stock_mutations (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    mutation_type TEXT NOT NULL,
    qty_change INTEGER NOT NULL,
    stock_after INTEGER NOT NULL,
    reference_id TEXT,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
  CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_whatsapp);
`);

console.log(`✅ Database siap: ${DB_PATH}`);

// ─── Helper ───────────────────────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID();
}

function nowLocal() {
  return new Date().toLocaleString('sv-SE'); // format: YYYY-MM-DD HH:MM:SS
}

// ─── Express App ──────────────────────────────────────────────────────────────
const app = express();

app.use(cors({
  origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://localhost:3001'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(__dirname));

// ─── Middleware: Error Handler ────────────────────────────────────────────────
function asyncHandler(fn) {
  return (req, res, next) => {
    try {
      fn(req, res, next);
    } catch (err) {
      console.error('[API ERROR]', err.message);
      res.status(500).json({ success: false, error: err.message });
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/categories
app.get('/api/categories', asyncHandler((req, res) => {
  const rows = db.prepare('SELECT * FROM categories ORDER BY name ASC').all();
  res.json({ success: true, data: rows });
}));

// POST /api/categories
app.post('/api/categories', asyncHandler((req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name wajib diisi' });

  const id = uuid();
  db.prepare('INSERT INTO categories (id, name, description) VALUES (?, ?, ?)').run(id, name, description || null);
  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: created });
}));

// PUT /api/categories/:id
app.put('/api/categories/:id', asyncHandler((req, res) => {
  const { name, description } = req.body;
  db.prepare('UPDATE categories SET name = ?, description = ? WHERE id = ?').run(name, description || null, req.params.id);
  const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
}));

// DELETE /api/categories/:id
app.delete('/api/categories/:id', asyncHandler((req, res) => {
  db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Kategori dihapus' });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: SUPPLIERS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/suppliers
app.get('/api/suppliers', asyncHandler((req, res) => {
  const rows = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
  res.json({ success: true, data: rows });
}));

// POST /api/suppliers
app.post('/api/suppliers', asyncHandler((req, res) => {
  const { name, phone_whatsapp, address } = req.body;
  if (!name || !phone_whatsapp) return res.status(400).json({ success: false, error: 'name dan phone_whatsapp wajib diisi' });

  const id = uuid();
  db.prepare('INSERT INTO suppliers (id, name, phone_whatsapp, address) VALUES (?, ?, ?, ?)').run(id, name, phone_whatsapp, address || null);
  const created = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: created });
}));

// PUT /api/suppliers/:id
app.put('/api/suppliers/:id', asyncHandler((req, res) => {
  const { name, phone_whatsapp, address } = req.body;
  db.prepare('UPDATE suppliers SET name = ?, phone_whatsapp = ?, address = ? WHERE id = ?').run(name, phone_whatsapp, address || null, req.params.id);
  const updated = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
}));

// DELETE /api/suppliers/:id
app.delete('/api/suppliers/:id', asyncHandler((req, res) => {
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Supplier dihapus' });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/products?search=&category=&low_stock=true
app.get('/api/products', asyncHandler((req, res) => {
  const { search, category, low_stock } = req.query;

  let query = `
    SELECT p.*, c.name AS category_name, s.name AS supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.is_active = 1
  `;
  const params = [];

  if (search) {
    query += ' AND (p.name LIKE ? OR p.sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += ' AND p.category_id = ?';
    params.push(category);
  }
  if (low_stock === 'true') {
    query += ' AND p.stock <= p.min_stock_threshold';
  }

  query += ' ORDER BY p.name ASC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, data: rows });
}));

// GET /api/products/:id
app.get('/api/products/:id', asyncHandler((req, res) => {
  const row = db.prepare(`
    SELECT p.*, c.name AS category_name, s.name AS supplier_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });
  res.json({ success: true, data: row });
}));

// POST /api/products
app.post('/api/products', asyncHandler((req, res) => {
  const { sku, name, category_id, cost_price, sell_price, stock, min_stock_threshold, supplier_id, icon_emoji } = req.body;
  if (!sku || !name) return res.status(400).json({ success: false, error: 'sku dan name wajib diisi' });

  const id = uuid();
  db.prepare(`
    INSERT INTO products (id, sku, name, category_id, cost_price, sell_price, stock, min_stock_threshold, supplier_id, icon_emoji)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, sku, name, category_id || null, cost_price || 0, sell_price || 0, stock || 0, min_stock_threshold || 5, supplier_id || null, icon_emoji || '📦');

  // Catat mutasi stok awal jika ada
  if (stock && stock > 0) {
    db.prepare(`
      INSERT INTO stock_mutations (id, product_id, mutation_type, qty_change, stock_after, reference_id)
      VALUES (?, ?, 'RESTOCK', ?, ?, 'INITIAL')
    `).run(uuid(), id, stock, stock);
  }

  const created = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: created });
}));

// PUT /api/products/:id
app.put('/api/products/:id', asyncHandler((req, res) => {
  const { sku, name, category_id, cost_price, sell_price, stock, min_stock_threshold, supplier_id, icon_emoji, is_active } = req.body;

  const old = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });

  db.prepare(`
    UPDATE products SET
      sku = ?, name = ?, category_id = ?, cost_price = ?, sell_price = ?,
      stock = ?, min_stock_threshold = ?, supplier_id = ?, icon_emoji = ?,
      is_active = ?, updated_at = datetime('now','localtime')
    WHERE id = ?
  `).run(
    sku ?? old.sku, name ?? old.name, category_id ?? old.category_id,
    cost_price ?? old.cost_price, sell_price ?? old.sell_price,
    stock ?? old.stock, min_stock_threshold ?? old.min_stock_threshold,
    supplier_id ?? old.supplier_id, icon_emoji ?? old.icon_emoji,
    is_active !== undefined ? (is_active ? 1 : 0) : old.is_active,
    req.params.id
  );

  // Catat perubahan stok sebagai ADJUSTMENT jika berbeda
  if (stock !== undefined && stock !== old.stock) {
    const diff = stock - old.stock;
    db.prepare(`
      INSERT INTO stock_mutations (id, product_id, mutation_type, qty_change, stock_after, reference_id)
      VALUES (?, ?, 'ADJUSTMENT', ?, ?, 'MANUAL-EDIT')
    `).run(uuid(), req.params.id, diff, stock);
  }

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
}));

// DELETE /api/products/:id (soft delete)
app.delete('/api/products/:id', asyncHandler((req, res) => {
  db.prepare("UPDATE products SET is_active = 0, updated_at = datetime('now','localtime') WHERE id = ?").run(req.params.id);
  res.json({ success: true, message: 'Produk dinonaktifkan' });
}));

// PATCH /api/products/:id/restock — tambah stok
app.patch('/api/products/:id/restock', asyncHandler((req, res) => {
  const { qty, reference_id } = req.body;
  if (!qty || qty <= 0) return res.status(400).json({ success: false, error: 'qty harus > 0' });

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Produk tidak ditemukan' });

  const newStock = product.stock + qty;
  db.prepare("UPDATE products SET stock = ?, updated_at = datetime('now','localtime') WHERE id = ?").run(newStock, req.params.id);
  db.prepare(`
    INSERT INTO stock_mutations (id, product_id, mutation_type, qty_change, stock_after, reference_id)
    VALUES (?, ?, 'RESTOCK', ?, ?, ?)
  `).run(uuid(), req.params.id, qty, newStock, reference_id || null);

  res.json({ success: true, data: { product_id: req.params.id, new_stock: newStock } });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/customers?search=&segment=
app.get('/api/customers', asyncHandler((req, res) => {
  const { search, segment } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (name LIKE ? OR phone_whatsapp LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (segment) {
    query += ' AND segment = ?';
    params.push(segment);
  }

  query += ' ORDER BY name ASC';
  const rows = db.prepare(query).all(...params);
  res.json({ success: true, data: rows });
}));

// GET /api/customers/:id
app.get('/api/customers/:id', asyncHandler((req, res) => {
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ success: false, error: 'Customer tidak ditemukan' });
  res.json({ success: true, data: row });
}));

// POST /api/customers
app.post('/api/customers', asyncHandler((req, res) => {
  const { name, phone_whatsapp, notes, segment } = req.body;
  if (!name || !phone_whatsapp) return res.status(400).json({ success: false, error: 'name dan phone_whatsapp wajib diisi' });

  const id = uuid();
  db.prepare('INSERT INTO customers (id, name, phone_whatsapp, notes, segment) VALUES (?, ?, ?, ?, ?)').run(id, name, phone_whatsapp, notes || null, segment || 'REGULAR');
  const created = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  res.status(201).json({ success: true, data: created });
}));

// PUT /api/customers/:id
app.put('/api/customers/:id', asyncHandler((req, res) => {
  const { name, phone_whatsapp, notes, segment } = req.body;
  const old = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!old) return res.status(404).json({ success: false, error: 'Customer tidak ditemukan' });

  db.prepare('UPDATE customers SET name = ?, phone_whatsapp = ?, notes = ?, segment = ? WHERE id = ?').run(
    name ?? old.name, phone_whatsapp ?? old.phone_whatsapp, notes ?? old.notes, segment ?? old.segment, req.params.id
  );
  const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json({ success: true, data: updated });
}));

// DELETE /api/customers/:id
app.delete('/api/customers/:id', asyncHandler((req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true, message: 'Customer dihapus' });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/transactions?limit=50&offset=0&date_from=&date_to=
app.get('/api/transactions', asyncHandler((req, res) => {
  const { limit = 50, offset = 0, date_from, date_to, customer_id } = req.query;

  let query = `
    SELECT t.*, c.name AS customer_name, c.phone_whatsapp AS customer_phone
    FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (date_from) { query += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
  if (date_to)   { query += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }
  if (customer_id) { query += ' AND t.customer_id = ?'; params.push(customer_id); }

  query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const rows = db.prepare(query).all(...params);
  res.json({ success: true, data: rows });
}));

// GET /api/transactions/:id — beserta items
app.get('/api/transactions/:id', asyncHandler((req, res) => {
  const trx = db.prepare(`
    SELECT t.*, c.name AS customer_name FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);

  if (!trx) return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });

  const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(req.params.id);
  res.json({ success: true, data: { ...trx, items } });
}));

// POST /api/transactions — buat transaksi baru + update stok
app.post('/api/transactions', asyncHandler((req, res) => {
  const {
    id, customer_id, items, subtotal, discount_amount, tax_amount,
    grand_total, payment_method, cash_paid, cash_change, status
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'items wajib diisi' });
  }
  if (!payment_method || grand_total === undefined) {
    return res.status(400).json({ success: false, error: 'payment_method dan grand_total wajib diisi' });
  }

  const trxId = id || `TRX-${Date.now()}`;

  // Gunakan transaksi DB (atomic)
  const insertTrx = db.prepare(`
    INSERT INTO transactions (id, customer_id, subtotal, discount_amount, tax_amount, grand_total, payment_method, cash_paid, cash_change, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertItem = db.prepare(`
    INSERT INTO transaction_items (id, transaction_id, product_id, product_name, unit_cost, unit_price, quantity, subtotal_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const updateStock = db.prepare("UPDATE products SET stock = stock - ?, updated_at = datetime('now','localtime') WHERE id = ?");
  const insertMutation = db.prepare(`
    INSERT INTO stock_mutations (id, product_id, mutation_type, qty_change, stock_after, reference_id)
    VALUES (?, ?, 'SALE', ?, (SELECT stock FROM products WHERE id = ?), ?)
  `);

  const updateCustomer = db.prepare(`
    UPDATE customers SET
      total_spent = total_spent + ?,
      loyalty_points = loyalty_points + ?,
      last_visit_at = date('now','localtime'),
      segment = CASE
        WHEN total_spent + ? >= 5000000 THEN 'VIP'
        WHEN total_spent + ? >= 500000  THEN 'REGULAR'
        ELSE segment
      END
    WHERE id = ?
  `);

  // Jalankan semua dalam satu transaksi DB
  const runTransaction = db.transaction(() => {
    insertTrx.run(trxId, customer_id || null, subtotal || 0, discount_amount || 0, tax_amount || 0, grand_total, payment_method, cash_paid || 0, cash_change || 0, status || 'SELESAI');

    for (const item of items) {
      const itemId = uuid();
      insertItem.run(itemId, trxId, item.product_id, item.product_name, item.unit_cost || 0, item.unit_price, item.quantity, item.subtotal_price);

      // Kurangi stok
      updateStock.run(item.quantity, item.product_id);

      // Catat mutasi
      insertMutation.run(uuid(), item.product_id, -item.quantity, item.product_id, trxId);
    }

    // Update customer jika ada
    if (customer_id) {
      const pts = Math.floor(grand_total / 10000); // 1 poin per Rp10.000
      updateCustomer.run(grand_total, pts, grand_total, grand_total, customer_id);
    }
  });

  runTransaction();

  const created = db.prepare(`
    SELECT t.*, c.name AS customer_name FROM transactions t
    LEFT JOIN customers c ON t.customer_id = c.id WHERE t.id = ?
  `).get(trxId);
  const itemsData = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(trxId);

  res.status(201).json({ success: true, data: { ...created, items: itemsData } });
}));

// DELETE /api/transactions/:id (void/cancel)
app.delete('/api/transactions/:id', asyncHandler((req, res) => {
  const trx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
  if (!trx) return res.status(404).json({ success: false, error: 'Transaksi tidak ditemukan' });

  const items = db.prepare('SELECT * FROM transaction_items WHERE transaction_id = ?').all(req.params.id);

  const voidTrx = db.transaction(() => {
    // Kembalikan stok
    for (const item of items) {
      db.prepare("UPDATE products SET stock = stock + ?, updated_at = datetime('now','localtime') WHERE id = ?").run(item.quantity, item.product_id);
      db.prepare(`
        INSERT INTO stock_mutations (id, product_id, mutation_type, qty_change, stock_after, reference_id)
        VALUES (?, ?, 'ADJUSTMENT', ?, (SELECT stock FROM products WHERE id = ?), ?)
      `).run(uuid(), item.product_id, item.quantity, item.product_id, `VOID-${req.params.id}`);
    }

    // Update status transaksi menjadi VOID
    db.prepare("UPDATE transactions SET status = 'VOID' WHERE id = ?").run(req.params.id);
  });

  voidTrx();
  res.json({ success: true, message: `Transaksi ${req.params.id} di-void, stok sudah dikembalikan` });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: STOCK MUTATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/stock-mutations?product_id=&limit=100
app.get('/api/stock-mutations', asyncHandler((req, res) => {
  const { product_id, limit = 100 } = req.query;
  let query = `
    SELECT sm.*, p.name AS product_name, p.sku
    FROM stock_mutations sm
    JOIN products p ON sm.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (product_id) { query += ' AND sm.product_id = ?'; params.push(product_id); }
  query += ' ORDER BY sm.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const rows = db.prepare(query).all(...params);
  res.json({ success: true, data: rows });
}));

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES: DASHBOARD / ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════

// GET /api/dashboard/summary
app.get('/api/dashboard/summary', asyncHandler((req, res) => {
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
  const thisMonth = today.substring(0, 7); // YYYY-MM

  const totalRevenue      = db.prepare("SELECT COALESCE(SUM(grand_total),0) AS v FROM transactions WHERE status != 'VOID'").get();
  const monthRevenue      = db.prepare("SELECT COALESCE(SUM(grand_total),0) AS v FROM transactions WHERE status != 'VOID' AND strftime('%Y-%m', created_at) = ?").get(thisMonth);
  const todayRevenue      = db.prepare("SELECT COALESCE(SUM(grand_total),0) AS v FROM transactions WHERE status != 'VOID' AND DATE(created_at) = ?").get(today);
  const totalTransactions = db.prepare("SELECT COUNT(*) AS v FROM transactions WHERE status != 'VOID'").get();
  const totalProducts     = db.prepare('SELECT COUNT(*) AS v FROM products WHERE is_active = 1').get();
  const lowStockProducts  = db.prepare('SELECT COUNT(*) AS v FROM products WHERE is_active = 1 AND stock <= min_stock_threshold').get();
  const totalCustomers    = db.prepare('SELECT COUNT(*) AS v FROM customers').get();
  const vipCustomers      = db.prepare("SELECT COUNT(*) AS v FROM customers WHERE segment = 'VIP'").get();

  // Revenue per hari 7 hari terakhir
  const revenueChart = db.prepare(`
    SELECT DATE(created_at) AS date, SUM(grand_total) AS total
    FROM transactions WHERE status != 'VOID'
    AND DATE(created_at) >= DATE('now', '-6 days', 'localtime')
    GROUP BY DATE(created_at) ORDER BY date ASC
  `).all();

  // Top 5 produk terlaris
  const topProducts = db.prepare(`
    SELECT ti.product_name, SUM(ti.quantity) AS total_qty, SUM(ti.subtotal_price) AS total_revenue
    FROM transaction_items ti
    JOIN transactions t ON ti.transaction_id = t.id
    WHERE t.status != 'VOID'
    GROUP BY ti.product_name
    ORDER BY total_qty DESC LIMIT 5
  `).all();

  res.json({
    success: true,
    data: {
      revenue: {
        total: totalRevenue.v,
        this_month: monthRevenue.v,
        today: todayRevenue.v,
      },
      transactions: { total: totalTransactions.v },
      products: { total: totalProducts.v, low_stock: lowStockProducts.v },
      customers: { total: totalCustomers.v, vip: vipCustomers.v },
      charts: { revenue_7days: revenueChart },
      top_products: topProducts,
    }
  });
}));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    version: '1.0.0',
    db: DB_PATH,
    timestamp: new Date().toISOString()
  });
});

// ─── Fallback: serve index.html untuk SPA routing ────────────────────────────
app.get('/{*path}', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, error: 'API endpoint tidak ditemukan' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 TransformaUMKM API Server berjalan di:`);
  console.log(`   ➜  http://localhost:${PORT}`);
  console.log(`   ➜  Health: http://localhost:${PORT}/api/health`);
  console.log(`   ➜  DB: ${DB_PATH}\n`);
});

module.exports = app;
