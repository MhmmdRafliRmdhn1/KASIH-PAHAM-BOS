// ========================================================
// TransformaUMKM — Main Application Logic
// Akselerasi Transformasi Digital UMKM & Bisnis
// TransformaUMKM Digital Business Platform
// ========================================================

const STORAGE_KEY_PRODUCTS = 'transforma_umkm_products';
const STORAGE_KEY_TRX = 'transforma_umkm_transactions';
const STORAGE_KEY_CUSTOMERS = 'transforma_umkm_customers';
const STORAGE_KEY_AUTH = 'transforma_umkm_session';

// Default User Profile
const DEFAULT_USER = {
  name: 'Hendra Wijaya',
  role: 'owner',
  roleLabel: 'Owner (Pemilik)',
  email: 'owner@nusantara.id',
  storeName: 'Kopi & Ritel Nusantara',
  phone: '081234567890',
  category: 'Kuliner & F&B'
};

// Initial Demo Dataset (Realistic Indonesian SME)
const INITIAL_PRODUCTS = [
  {
    id: 'prod-001',
    sku: 'KOP-GAYO-250',
    name: 'Kopi Arabika Gayo Single Origin 250g',
    category: 'Kopi & Minuman',
    costPrice: 42000,
    sellPrice: 65000,
    stock: 18,
    minStock: 8,
    supplier: 'Koperasi Kopi Gayo (081234567890)',
    icon: '☕'
  },
  {
    id: 'prod-002',
    sku: 'KOP-ROB-500',
    name: 'Biji Kopi Robusta Temanggung 500g',
    category: 'Kopi & Minuman',
    costPrice: 35000,
    sellPrice: 55000,
    stock: 4, // Low stock for demonstration!
    minStock: 10,
    supplier: 'Petani Lereng Sindoro (082199887766)',
    icon: '🫘'
  },
  {
    id: 'prod-003',
    sku: 'SNK-PISANG-200',
    name: 'Keripik Pisang Cokelat Lumer 200g',
    category: 'Makanan & Snack',
    costPrice: 12000,
    sellPrice: 22000,
    stock: 25,
    minStock: 10,
    supplier: 'UMKM Berkah Lumajang (085678123456)',
    icon: '🍌'
  },
  {
    id: 'prod-004',
    sku: 'FOD-RENDANG-250',
    name: 'Rendang Daging Sapi Kemasan Vakum 250g',
    category: 'Makanan & Snack',
    costPrice: 48000,
    sellPrice: 75000,
    stock: 2, // Critical low stock
    minStock: 6,
    supplier: 'Dapur Minang Asli (081344556677)',
    icon: '🥩'
  },
  {
    id: 'prod-005',
    sku: 'SEM-BERAS-5KG',
    name: 'Beras Organik Pandan Wangi 5kg',
    category: 'Bahan Pokok',
    costPrice: 72000,
    sellPrice: 88000,
    stock: 14,
    minStock: 5,
    supplier: 'Gapoktan Cianjur (081900112233)',
    icon: '🌾'
  },
  {
    id: 'prod-006',
    sku: 'TEX-BATIK-MGM',
    name: 'Kain Batik Tulis Motif Mega Mendung',
    category: 'Kerajinan & Fashion',
    costPrice: 160000,
    sellPrice: 250000,
    stock: 7,
    minStock: 3,
    supplier: 'Pengrajin Trusmi Cirebon (087788990011)',
    icon: '👘'
  },
  {
    id: 'prod-007',
    sku: 'SNK-SAMBAL-ROA',
    name: 'Sambal Roa Khas Manado Botol 150g',
    category: 'Makanan & Snack',
    costPrice: 20000,
    sellPrice: 35000,
    stock: 0, // Out of stock for demonstration
    minStock: 8,
    supplier: 'Ibu Maryam Manado (081298765432)',
    icon: '🌶️'
  }
];

const INITIAL_CUSTOMERS = [
  {
    id: 'cust-001',
    name: 'Ibu Ratna Dewi',
    phone: '081288990011',
    totalSpent: 480000,
    points: 48,
    lastVisit: '2026-10-18',
    notes: 'Pelanggan setia, suka biji kopi Arabika'
  },
  {
    id: 'cust-002',
    name: 'Mas Dimas Pratama',
    phone: '085711223344',
    totalSpent: 215000,
    points: 21,
    lastVisit: '2026-10-17',
    notes: 'Suka camilan dan rendang siap saji'
  },
  {
    id: 'cust-003',
    name: 'Pak Hendro Kusumo',
    phone: '081399001122',
    totalSpent: 75000,
    points: 7,
    lastVisit: '2026-10-10',
    notes: 'Pelanggan baru'
  }
];

// App State
let products = [];
let transactions = [];
let customers = [];
let cart = [];
let currentCartCustomer = 'guest';
let lastCompletedTrx = null;
let currentPosCategory = 'all';
let currentInvFilter = 'all';
let currentUser = null;

// ========================================================
// INITIALIZATION
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
  initStorage();
<<<<<<< HEAD:script.js
  initAuth();
  initMobileSimulator();
  initTheme();
=======
  const isAuthenticated = initAuth();
  if (!isAuthenticated) return;
>>>>>>> b800731308c4e40c9af0693c781267216e961c99:transforma-umkm/script.js
  initClock();
  initNav();
  initShell();
  renderAllViews();
});

function initStorage() {
  const storedProds = localStorage.getItem(STORAGE_KEY_PRODUCTS);
  if (!storedProds) {
    products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
    saveProducts();
  } else {
    products = JSON.parse(storedProds);
  }

  const storedTrx = localStorage.getItem(STORAGE_KEY_TRX);
  if (!storedTrx) {
    transactions = generateInitialTransactions();
    saveTransactions();
  } else {
    transactions = JSON.parse(storedTrx);
  }

  const storedCust = localStorage.getItem(STORAGE_KEY_CUSTOMERS);
  if (!storedCust) {
    customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
    saveCustomers();
  } else {
    customers = JSON.parse(storedCust);
  }
}

function generateInitialTransactions() {
  const now = new Date();
  const trxs = [];
  const sampleProducts = [INITIAL_PRODUCTS[0], INITIAL_PRODUCTS[2], INITIAL_PRODUCTS[4]];

  // Generate simulated history for past 3 days
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;

    trxs.push({
      id: `TRX-${1000 + i}`,
      date: dateStr,
      time: timeStr,
      customerId: 'cust-001',
      customerName: 'Ibu Ratna Dewi',
      items: [
        { id: sampleProducts[0].id, name: sampleProducts[0].name, price: sampleProducts[0].sellPrice, cost: sampleProducts[0].costPrice, qty: 2 }
      ],
      subtotal: sampleProducts[0].sellPrice * 2,
      discount: 0,
      tax: 0,
      grandTotal: sampleProducts[0].sellPrice * 2,
      method: 'QRIS',
      status: 'Selesai'
    });
  }
  return trxs;
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY_TRX, JSON.stringify(transactions));
}

function saveCustomers() {
  localStorage.setItem(STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
}

// ========================================================
// UTILITIES
// ========================================================
function cssVar(name) {
  return getComputedStyle(document.body).getPropertyValue(name).trim() || '#888';
}

function initClock() {
  const clockEl = document.getElementById('liveClock');
  if (!clockEl) return;
  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
  }
  update();
  setInterval(update, 1000);
}

function initNav() {
  document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
    link.addEventListener('click', () => switchTab(link.getAttribute('data-tab')));
  });

  // Reset/Seed Button
  document.getElementById('btnResetSeed').addEventListener('click', () => {
    if (confirm('Muat ulang dataset realistis UMKM? Data yang diubah akan kembali ke nilai default demo.')) {
      products = JSON.parse(JSON.stringify(INITIAL_PRODUCTS));
      customers = JSON.parse(JSON.stringify(INITIAL_CUSTOMERS));
      transactions = generateInitialTransactions();
      cart = [];
      saveProducts();
      saveCustomers();
      saveTransactions();
      renderAllViews();
      showToast('Dataset demo UMKM berhasil dimuat ulang!');
    }
  });

  // Export Data Button
  document.getElementById('btnExportData').addEventListener('click', exportDatabase);
}

const TAB_TITLES = {
  dashboard: 'Dashboard', pos: 'Kasir (POS)', inventory: 'Inventori', crm: 'Pelanggan (CRM)',
  storefront: 'Katalog Digital', 'ai-assistant': 'Asisten AI', settings: 'Pengaturan'
};

function switchTab(tabId) {
  document.querySelectorAll('.nav-link[data-tab]').forEach(t => {
    const on = t.getAttribute('data-tab') === tabId;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tab-pane').forEach(p => {
    p.classList.toggle('active', p.id === `pane-${tabId}`);
  });
  const title = document.getElementById('topbarTitle');
  if (title) title.textContent = TAB_TITLES[tabId] || 'Dashboard';
  document.title = `${TAB_TITLES[tabId] || 'Dashboard'} — TransformaUMKM`;
  closeSidebarMobile();
  closeAllDropdowns();
  window.scrollTo(0, 0);

  if (tabId === 'dashboard') {
    renderDashboard();
  } else if (tabId === 'pos') {
    renderPosCatalog();
  } else if (tabId === 'inventory') {
    renderInventoryTable();
  } else if (tabId === 'crm') {
    renderCrmTable();
  } else if (tabId === 'storefront') {
    renderPublicStorefront();
  } else if (tabId === 'ai-assistant') {
    renderAiAssistant();
  }
}

function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>⚡</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatRupiah(num) {
  return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}
// ========================================================
// SECURITY & DATA NORMALIZATION HELPERS
// ========================================================
function escapeHtml(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function normalizeIndonesianPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  let digits = rawPhone.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('62')) {
    if (digits.length < 10 || digits.length > 15) return null;
    return digits;
  }
  if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1);
    if (digits.length < 10 || digits.length > 15) return null;
    return digits;
  }
  if (digits.startsWith('8')) {
    digits = '62' + digits;
    if (digits.length < 10 || digits.length > 15) return null;
    return digits;
  }
  return null;
}

function extractIndonesianPhone(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/(\+?62|08|8)[0-9\s-]{7,16}/);
  if (match) {
    return normalizeIndonesianPhone(match[0]);
  }
  return null;
}

function getWhatsAppUrl(rawPhone, message = '') {
  const textParam = message ? `?text=${encodeURIComponent(message)}` : '';
  if (!rawPhone) {
    return `https://wa.me/${textParam}`;
  }
  const normalized = normalizeIndonesianPhone(rawPhone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}${textParam}`;
}


// ========================================================
// RENDER ALL VIEWS
// ========================================================
function renderAllViews() {
  renderDashboard();
  renderPosCatalog();
  renderPosCart();
  renderInventoryTable();
  renderCrmTable();
  renderPublicStorefront();
  updateAlertBadges();
}

// ========================================================
// 1. DASHBOARD LOGIC & SMART AI INSIGHTS
// ========================================================
function renderDashboard() {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTrx = transactions.filter(t => t.date === todayStr);

  const totalRevenue = todayTrx.reduce((sum, t) => sum + (t.grandTotal || 0), 0);
  const totalTrxCount = todayTrx.length;

  // Calculate Net Profit: Revenue - Cost Price of sold items
  let totalCost = 0;
  todayTrx.forEach(t => {
    t.items.forEach(item => {
      totalCost += (item.cost || 0) * item.qty;
    });
  });
  const netProfit = totalRevenue - totalCost;
  const marginPct = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Low Stock Count
  const lowStockProds = products.filter(p => p.stock <= p.minStock);

  // Update KPI UI
  document.getElementById('kpiRevenue').textContent = formatRupiah(totalRevenue);
  document.getElementById('kpiNetProfit').textContent = formatRupiah(netProfit);
  document.getElementById('kpiProfitMargin').textContent = `Margin Bersih: ~${marginPct}%`;
  document.getElementById('kpiTransactions').textContent = totalTrxCount;
  document.getElementById('kpiAvgOrder').textContent = totalTrxCount > 0 ? `Avg: ${formatRupiah(Math.round(totalRevenue / totalTrxCount))}` : 'Avg: Rp 0';
  document.getElementById('kpiStockAlerts').textContent = lowStockProds.length;

  const stockBadge = document.getElementById('kpiStockAlertStatus');
  if (lowStockProds.length === 0) {
    stockBadge.textContent = 'Semua Aman';
    stockBadge.className = 'kpi-badge success';
  } else {
    stockBadge.textContent = `${lowStockProds.length} Item Menipis`;
    stockBadge.className = 'kpi-badge warning';
  }

  // Render Smart AI Insight
  renderSmartInsight(lowStockProds);

  // Render Charts
  renderSalesTrendChart();
  renderCategoryDonutChart();

  // Render Recent Transactions
  renderRecentTransactionsTable();
}

function renderSmartInsight(lowStockProds) {
  const insightBox = document.getElementById('smartInsightBox');
  const insightText = document.getElementById('smartInsightText');
  const insightAction = document.getElementById('smartInsightAction');

  if (lowStockProds.length > 0) {
    const worst = lowStockProds[0];
    insightText.innerHTML = `⚠️ <strong>TransformaAI Smart Restock:</strong> Stok produk <strong>${escapeHtml(worst.name)}</strong> tersisa <strong>${worst.stock} unit</strong> (di bawah ambang ${worst.minStock}). AI menyarankan restock segera ke supplier.`;
    insightAction.textContent = 'Buka Saran Stok AI →';
    insightAction.onclick = () => {
      switchTab('ai-assistant');
      switchAiTab('stock-advisor');
    };
  } else {
    insightText.innerHTML = `✨ <strong>TransformaAI Smart Opportunity:</strong> Semua stok dalam kondisi aman. AI merekomendasikan pembuatan kampanye promosi dan bundling untuk meningkatkan omzet hingga +25%.`;
    insightAction.textContent = 'Buka Asisten AI →';
    insightAction.onclick = () => {
      switchTab('ai-assistant');
      switchAiTab('social-caption');
    };
  }
}

function renderRecentTransactionsTable() {
  const tbody = document.getElementById('recentTransactionsTableBody');
  tbody.innerHTML = '';

  const recent = [...transactions].reverse().slice(0, 5);
  if (recent.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-subtle);">Belum ada riwayat transaksi.</td></tr>`;
    return;
  }

  recent.forEach(t => {
    const totalItems = t.items.reduce((sum, i) => sum + i.qty, 0);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(t.id)}</strong></td>
      <td>${escapeHtml(t.date)} ${escapeHtml(t.time || '')}</td>
      <td>${escapeHtml(t.customerName || 'Umum')}</td>
      <td><span class="status-badge cyan">${escapeHtml(t.method)}</span></td>
      <td>${totalItems} item</td>
      <td><strong style="color:var(--cyan-primary);">${formatRupiah(t.grandTotal)}</strong></td>
      <td><span class="status-badge success">${escapeHtml(t.status)}</span></td>
      <td>
        <button type="button" class="btn btn-xs btn-outline-cyan btn-struk-action">Struk</button>
      </td>
    `;
    const btnStruk = tr.querySelector('.btn-struk-action');
    if (btnStruk) {
      btnStruk.onclick = () => showReceiptModalById(t.id);
    }
    tbody.appendChild(tr);
  });
}

// ========================================================
// 2. CANVAS CHARTS (NO EXTERNAL LIBS - FAST & RESILIENT)
// ========================================================
function renderSalesTrendChart() {
  const canvas = document.getElementById('salesTrendChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = 220;
  ctx.clearRect(0, 0, w, h);

  // Group transactions for the last 7 days
  const days = [];
  const amounts = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('id-ID', { weekday: 'short' });
    days.push(dayLabel);

    const sum = transactions
      .filter(t => t.date === dateStr)
      .reduce((acc, t) => acc + t.grandTotal, 0);
    amounts.push(sum);
  }

  const maxVal = Math.max(...amounts, 300000);
  const padLeft = 60;
  const padBottom = 30;
  const padTop = 20;
  const padRight = 20;
  const chartW = w - padLeft - padRight;
  const chartH = h - padBottom - padTop;

  // Grid Lines
  ctx.strokeStyle = cssVar('--border-color');
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padTop + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();

    const val = Math.round(maxVal - (maxVal / 3) * i);
    ctx.fillStyle = cssVar('--text-subtle');
    ctx.font = '10px "JetBrains Mono"';
    ctx.textAlign = 'right';
    ctx.fillText((val / 1000) + 'k', padLeft - 8, y + 3);
  }

  // Draw Area Curve
  const points = [];
  amounts.forEach((amt, idx) => {
    const x = padLeft + (chartW / (amounts.length - 1)) * idx;
    const y = padTop + chartH - (amt / maxVal) * chartH;
    points.push({ x, y });
  });

  // Area Fill
  const grad = ctx.createLinearGradient(0, padTop, 0, h - padBottom);
  grad.addColorStop(0, 'rgba(99, 102, 241, 0.32)');
  grad.addColorStop(1, 'rgba(99, 102, 241, 0)');

  ctx.beginPath();
  ctx.moveTo(points[0].x, h - padBottom);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, h - padBottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Stroke Line
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Dots & Labels
  points.forEach((p, idx) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = cssVar('--bg-card');
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = cssVar('--text-muted');
    ctx.font = '11px "Inter"';
    ctx.textAlign = 'center';
    ctx.fillText(days[idx], p.x, h - 8);
  });
}

function renderCategoryDonutChart() {
  const canvas = document.getElementById('categoryDonutChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;

  canvas.width = 180 * dpr;
  canvas.height = 180 * dpr;
  ctx.scale(dpr, dpr);

  const cx = 90;
  const cy = 90;
  const r = 70;
  const innerR = 45;

  // Aggregate category sales
  const catSums = {};
  products.forEach(p => catSums[p.category] = 0);

  transactions.forEach(t => {
    t.items.forEach(it => {
      const p = products.find(prod => prod.id === it.id);
      if (p) {
        catSums[p.category] = (catSums[p.category] || 0) + (it.price * it.qty);
      }
    });
  });

  const categories = Object.keys(catSums);
  const colors = ['#6366f1', '#f97316', '#10b981', '#8b5cf6'];
  let totalVal = Object.values(catSums).reduce((a, b) => a + b, 0);
  if (totalVal === 0) totalVal = 1; // avoid division by zero

  let startAngle = -Math.PI / 2;
  const legendEl = document.getElementById('categoryLegend');
  legendEl.innerHTML = '';

  categories.forEach((cat, idx) => {
    const val = catSums[cat];
    const sliceAngle = (val / totalVal) * (Math.PI * 2);
    const color = colors[idx % colors.length];

    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, startAngle + sliceAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += sliceAngle;

    // Legend
    const pct = ((val / totalVal) * 100).toFixed(0);
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-left">
        <span class="legend-color-dot" style="background:${color}"></span>
        <span>${cat}</span>
      </div>
      <span class="legend-val">${pct}%</span>
    `;
    legendEl.appendChild(item);
  });
}

// ========================================================
// 3. SMART POS & KASIR
// ========================================================
function renderPosCatalog() {
  const container = document.getElementById('posProductsGrid');
  const search = (document.getElementById('posSearchInput').value || '').toLowerCase();
  container.innerHTML = '';

  const filtered = products.filter(p => {
    const matchCat = currentPosCategory === 'all' || p.category === currentPosCategory;
    const matchSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-subtle);">Tidak ada produk ditemukan.</div>`;
    return;
  }

  filtered.forEach(p => {
    const isOut = p.stock <= 0;
    const isLow = p.stock > 0 && p.stock <= p.minStock;
    const card = document.createElement('div');
    card.className = `product-pos-card ${isOut ? 'out-of-stock' : ''}`;
    card.onclick = () => {
      if (!isOut) addToCart(p.id);
      else showToast(`Stok ${p.name} telah habis!`, 'warning');
    };

    let badgeClass = '';
    let badgeText = `Stok: ${p.stock}`;
    if (isOut) {
      badgeClass = 'out';
      badgeText = 'Habis';
    } else if (isLow) {
      badgeClass = 'low';
      badgeText = `Sisa ${p.stock}`;
    }

    card.innerHTML = `
      <span class="prod-badge-stock ${badgeClass}">${badgeText}</span>
      <span class="prod-icon-large">${escapeHtml(p.icon || '📦')}</span>
      <div>
        <div class="prod-name">${escapeHtml(p.name)}</div>
        <div class="prod-sku">${escapeHtml(p.sku)}</div>
      </div>
      <div class="prod-price">${formatRupiah(p.sellPrice)}</div>
    `;
    container.appendChild(card);
  });

  // Customer dropdown populate
  populateCustomerSelect();
}

function populateCustomerSelect() {
  const select = document.getElementById('cartCustomerSelect');
  select.innerHTML = `<option value="guest">Umum (Guest / Walk-in)</option>`;
  customers.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.points} pts)`;
    if (c.id === currentCartCustomer) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = (e) => {
    currentCartCustomer = e.target.value;
  };
}

// Category Chips click event
document.querySelectorAll('#posCategoryChips .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('#posCategoryChips .chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentPosCategory = chip.getAttribute('data-cat');
    renderPosCatalog();
  });
});

document.getElementById('posSearchInput').addEventListener('input', () => {
  renderPosCatalog();
});

// Cart Functions
function addToCart(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;

  const existing = cart.find(x => x.id === productId);
  if (existing) {
    if (existing.qty + 1 > p.stock) {
      showToast(`Stok tidak mencukupi (Tersedia: ${p.stock})`, 'warning');
      return;
    }
    existing.qty += 1;
  } else {
    cart.push({
      id: p.id,
      name: p.name,
      price: p.sellPrice,
      cost: p.costPrice,
      qty: 1
    });
  }
  renderPosCart();
}

function updateCartQty(productId, delta) {
  const item = cart.find(x => x.id === productId);
  const p = products.find(x => x.id === productId);
  if (!item) return;

  const nextQty = item.qty + delta;
  if (nextQty <= 0) {
    cart = cart.filter(x => x.id !== productId);
  } else {
    if (p && nextQty > p.stock) {
      showToast(`Stok maksimal: ${p.stock}`, 'warning');
      return;
    }
    item.qty = nextQty;
  }
  renderPosCart();
}

function renderPosCart() {
  const list = document.getElementById('cartItemsList');
  const countPill = document.getElementById('navCartCount');
  const totalItemCount = cart.reduce((sum, i) => sum + i.qty, 0);
  if (countPill) {
    countPill.textContent = totalItemCount;
    countPill.style.display = totalItemCount > 0 ? 'inline-block' : 'none';
  }

  if (cart.length === 0) {
    list.innerHTML = `
      <div class="empty-cart-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="21" r="1" stroke="currentColor" stroke-width="2"/><circle cx="20" cy="21" r="1" stroke="currentColor" stroke-width="2"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" stroke="currentColor" stroke-width="2"/></svg>
        <p>Keranjang masih kosong</p>
        <small>Klik produk di sebelah kiri untuk menambahkan item.</small>
      </div>
    `;
    updateCartTotals(0);
    return;
  }

  list.innerHTML = '';
  let subtotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.qty;
    subtotal += itemTotal;

    const row = document.createElement('div');
    row.className = 'cart-item-row';
    row.innerHTML = `
      <div class="cir-left">
        <div class="cir-name">${escapeHtml(item.name)}</div>
        <div class="cir-price">${formatRupiah(item.price)}</div>
      </div>
      <div class="cir-qty-ctrl">
        <button type="button" class="qty-btn btn-qty-minus">-</button>
        <span class="cir-qty-num">${item.qty}</span>
        <button type="button" class="qty-btn btn-qty-plus">+</button>
      </div>
      <div class="cir-total">${formatRupiah(itemTotal)}</div>
    `;
    const btnMinus = row.querySelector('.btn-qty-minus');
    const btnPlus = row.querySelector('.btn-qty-plus');
    if (btnMinus) btnMinus.onclick = () => updateCartQty(item.id, -1);
    if (btnPlus) btnPlus.onclick = () => updateCartQty(item.id, 1);
    list.appendChild(row);
  });

  updateCartTotals(subtotal);
}

function updateCartTotals(subtotal) {
  const discountPct = Number(document.getElementById('cartDiscountPercent').value) || 0;
  const isTaxActive = document.getElementById('cartTaxToggle').checked;

  const discountAmount = Math.round(subtotal * (discountPct / 100));
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = isTaxActive ? Math.round(afterDiscount * 0.11) : 0;
  const grandTotal = afterDiscount + taxAmount;

  document.getElementById('cartSubtotal').textContent = formatRupiah(subtotal);
  document.getElementById('cartDiscountAmount').textContent = `(-${formatRupiah(discountAmount)})`;
  document.getElementById('cartTaxAmount').textContent = formatRupiah(taxAmount);
  document.getElementById('cartGrandTotal').textContent = formatRupiah(grandTotal);
}

document.getElementById('cartDiscountPercent').addEventListener('input', () => {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  updateCartTotals(subtotal);
});

document.getElementById('cartTaxToggle').addEventListener('change', () => {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  updateCartTotals(subtotal);
});

document.getElementById('btnClearCart').addEventListener('click', () => {
  if (cart.length > 0) {
    cart = [];
    renderPosCart();
    showToast('Keranjang transaksi dikosongkan.');
  }
});

// Checkout Modal
document.getElementById('btnOpenCheckout').addEventListener('click', () => {
  if (cart.length === 0) {
    showToast('Keranjang kosong! Silakan pilih produk terlebih dahulu.', 'warning');
    return;
  }

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountPct = Number(document.getElementById('cartDiscountPercent').value) || 0;
  const isTaxActive = document.getElementById('cartTaxToggle').checked;
  const discAmt = Math.round(subtotal * (discountPct / 100));
  const taxAmt = isTaxActive ? Math.round((subtotal - discAmt) * 0.11) : 0;
  const grand = subtotal - discAmt + taxAmt;

  document.getElementById('checkoutPayableAmount').textContent = formatRupiah(grand);

  const custObj = customers.find(c => c.id === currentCartCustomer);
  document.getElementById('checkoutCustomerName').textContent = custObj ? custObj.name : 'Umum (Guest / Walk-in)';

  // Reset Payment selection to QRIS
  handlePayMethodChange('qris');
  renderQrisDummyCanvas();

  openModal('checkoutModal');
});

function handlePayMethodChange(method) {
  document.querySelectorAll('.method-card').forEach(c => {
    c.classList.toggle('active', c.querySelector('input').value === method);
  });
  document.getElementById('payViewQris').classList.toggle('hidden', method !== 'qris');
  document.getElementById('payViewCash').classList.toggle('hidden', method !== 'cash');
  document.getElementById('payViewTransfer').classList.toggle('hidden', method !== 'transfer');

  if (method === 'cash') {
    calculateCashChange();
  }
}

function calculateCashChange() {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountPct = Number(document.getElementById('cartDiscountPercent').value) || 0;
  const isTaxActive = document.getElementById('cartTaxToggle').checked;
  const discAmt = Math.round(subtotal * (discountPct / 100));
  const taxAmt = isTaxActive ? Math.round((subtotal - discAmt) * 0.11) : 0;
  const grand = subtotal - discAmt + taxAmt;

  const rec = Number(document.getElementById('cashReceivedInput').value) || 0;
  const change = Math.max(0, rec - grand);
  document.getElementById('cashChangeAmount').textContent = formatRupiah(change);
}

function setCashAmount(val) {
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountPct = Number(document.getElementById('cartDiscountPercent').value) || 0;
  const isTaxActive = document.getElementById('cartTaxToggle').checked;
  const discAmt = Math.round(subtotal * (discountPct / 100));
  const taxAmt = isTaxActive ? Math.round((subtotal - discAmt) * 0.11) : 0;
  const grand = subtotal - discAmt + taxAmt;

  if (val === 'exact') {
    document.getElementById('cashReceivedInput').value = grand;
  } else {
    document.getElementById('cashReceivedInput').value = val;
  }
  calculateCashChange();
}

function renderQrisDummyCanvas() {
  const canvas = document.getElementById('qrisCanvas');
  const ctx = canvas.getContext('2d');
  const size = 180;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Generate pattern matrix
  ctx.fillStyle = '#000000';
  const grid = 18;
  const cellSize = size / grid;

  // Corners
  function drawCorner(ox, oy) {
    ctx.fillRect(ox, oy, cellSize * 5, cellSize * 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ox + cellSize, oy + cellSize, cellSize * 3, cellSize * 3);
    ctx.fillStyle = '#000000';
    ctx.fillRect(ox + cellSize * 2, oy + cellSize * 2, cellSize, cellSize);
  }

  drawCorner(cellSize, cellSize);
  drawCorner(size - cellSize * 6, cellSize);
  drawCorner(cellSize, size - cellSize * 6);

  // Random QR cells
  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c > 10) || (r > 10 && c < 7)) continue;
      if (Math.sin(r * 12.5 + c * 33.1) > 0) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  // Center QRIS tag
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(size / 2 - 16, size / 2 - 10, 32, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('QRIS', size / 2, size / 2 + 3);
}

function processPayment() {
  const method = document.querySelector('input[name="payMethod"]:checked').value;
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const discountPct = Number(document.getElementById('cartDiscountPercent').value) || 0;
  const isTaxActive = document.getElementById('cartTaxToggle').checked;
  const discAmt = Math.round(subtotal * (discountPct / 100));
  const taxAmt = isTaxActive ? Math.round((subtotal - discAmt) * 0.11) : 0;
  const grand = subtotal - discAmt + taxAmt;

  if (method === 'cash') {
    const rec = Number(document.getElementById('cashReceivedInput').value) || 0;
    if (rec < grand) {
      showToast('Uang diterima kurang dari total tagihan!', 'danger');
      return;
    }
  }

  // 1. Deduct Stock in Database
  cart.forEach(item => {
    const p = products.find(prod => prod.id === item.id);
    if (p) {
      p.stock = Math.max(0, p.stock - item.qty);
    }
  });
  saveProducts();

  // 2. Add Customer Reward Points (1 point per Rp 10.000)
  const cust = customers.find(c => c.id === currentCartCustomer);
  if (cust) {
    const earnedPoints = Math.floor(grand / 10000);
    cust.points += earnedPoints;
    cust.totalSpent += grand;
    cust.lastVisit = new Date().toISOString().split('T')[0];
    saveCustomers();
  }

  // 3. Record Transaction
  const now = new Date();
  const trxId = 'TRX-' + (1000 + transactions.length + 1);
  const newTrx = {
    id: trxId,
    date: now.toISOString().split('T')[0],
    time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    customerId: cust ? cust.id : null,
    customerName: cust ? cust.name : 'Umum (Guest)',
    customerPhone: cust ? cust.phone : '',
    items: JSON.parse(JSON.stringify(cart)),
    subtotal: subtotal,
    discount: discAmt,
    tax: taxAmt,
    grandTotal: grand,
    method: method.toUpperCase(),
    cashPaid: method === 'cash' ? Number(document.getElementById('cashReceivedInput').value) : grand,
    cashChange: method === 'cash' ? Number(document.getElementById('cashReceivedInput').value) - grand : 0,
    status: 'Selesai'
  };

  transactions.push(newTrx);
  saveTransactions();
  lastCompletedTrx = newTrx;

  closeModal('checkoutModal');
  showToast(`Transaksi ${trxId} BERHASIL disimpan!`, 'success');

  // Reset Cart
  cart = [];
  renderPosCart();
  renderPosCatalog();
  renderDashboard();
  renderInventoryTable();
  updateAlertBadges();

  // Show Digital Receipt Modal
  showReceiptModal(newTrx);
}

// ========================================================
// 4. STRUK DIGITAL & WHATSAPP GENERATOR
// ========================================================
function showReceiptModal(trx) {
  document.getElementById('rcId').textContent = trx.id;
  document.getElementById('rcDate').textContent = `${trx.date} ${trx.time}`;
  document.getElementById('rcCustomer').textContent = trx.customerName;

  const itemsContainer = document.getElementById('rcItemsList');
  itemsContainer.innerHTML = '';
  trx.items.forEach(it => {
    const div = document.createElement('div');
    div.className = 'rc-row';
    div.innerHTML = `
      <span>${escapeHtml(it.name)} x${it.qty}</span>
      <span>${formatRupiah(it.price * it.qty)}</span>
    `;
    itemsContainer.appendChild(div);
  });

  document.getElementById('rcSubtotal').textContent = formatRupiah(trx.subtotal);
  document.getElementById('rcDiscount').textContent = `-${formatRupiah(trx.discount)}`;
  document.getElementById('rcTax').textContent = formatRupiah(trx.tax);
  document.getElementById('rcGrand').textContent = formatRupiah(trx.grandTotal);
  document.getElementById('rcMethod').textContent = trx.method;

  if (trx.method === 'CASH') {
    document.getElementById('rcPayCashRow').style.display = 'flex';
    document.getElementById('rcChangeRow').style.display = 'flex';
    document.getElementById('rcPaid').textContent = formatRupiah(trx.cashPaid);
    document.getElementById('rcChange').textContent = formatRupiah(trx.cashChange);
  } else {
    document.getElementById('rcPayCashRow').style.display = 'none';
    document.getElementById('rcChangeRow').style.display = 'none';
  }

  openModal('receiptModal');
}

function showReceiptModalById(trxId) {
  const trx = transactions.find(t => t.id === trxId);
  if (trx) {
    lastCompletedTrx = trx;
    showReceiptModal(trx);
  }
}

function printReceipt() {
  window.print();
}

function sendReceiptViaWhatsApp() {
  if (!lastCompletedTrx) return;
  const trx = lastCompletedTrx;

  let msg = `*STRUK DIGITAL — TRANSFORMA UMKM*\n`;
  msg += `No. Nota: ${trx.id}\n`;
  msg += `Tanggal: ${trx.date} ${trx.time}\n`;
  msg += `Pelanggan: ${trx.customerName}\n`;
  msg += `--------------------------------\n`;
  trx.items.forEach(it => {
    msg += `• ${it.name} (${it.qty}x) = ${formatRupiah(it.price * it.qty)}\n`;
  });
  msg += `--------------------------------\n`;
  if (trx.discount > 0) msg += `Diskon: -${formatRupiah(trx.discount)}\n`;
  msg += `*TOTAL BAYAR: ${formatRupiah(trx.grandTotal)}* (${trx.method})\n\n`;
  msg += `Terima kasih telah berbelanja di UMKM kami! 🙏`;

  const phone = trx.customerPhone || '';
  if (phone) {
    const waUrl = getWhatsAppUrl(phone, msg);
    if (waUrl) {
      window.open(waUrl, '_blank');
    } else {
      showToast('Nomor WhatsApp pelanggan tidak valid (format: 08xx / 628xx)!', 'warning');
    }
  } else {
    // Pelanggan umum/guest tanpa nomor telepon: buka share unaddressed
    window.open(getWhatsAppUrl('', msg), '_blank');
  }
}

// ========================================================
// 5. INVENTORY & CRUD OPERATIONS
// ========================================================
function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  const search = (document.getElementById('invSearchInput').value || '').toLowerCase();
  tbody.innerHTML = '';

  let filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search) || (p.supplier || '').toLowerCase().includes(search);
    if (!matchSearch) return false;

    if (currentInvFilter === 'safe') return p.stock > p.minStock;
    if (currentInvFilter === 'warning') return p.stock > 0 && p.stock <= p.minStock;
    if (currentInvFilter === 'out') return p.stock <= 0;
    return true;
  });

  // Update counts
  const totalSafe = products.filter(p => p.stock > p.minStock).length;
  const totalLow = products.filter(p => p.stock > 0 && p.stock <= p.minStock).length;
  const totalOut = products.filter(p => p.stock <= 0).length;

  document.getElementById('invTotalCount').textContent = products.length;
  document.getElementById('invSafeCount').textContent = totalSafe;
  document.getElementById('invLowCount').textContent = totalLow;
  document.getElementById('invOutCount').textContent = totalOut;
  document.getElementById('invTableCountText').textContent = `Menampilkan ${filtered.length} dari ${products.length} produk`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:var(--text-subtle);padding:2rem;">Tidak ada produk yang cocok dengan kriteria.</td></tr>`;
    return;
  }

  filtered.forEach(p => {
    const margin = p.sellPrice - p.costPrice;
    const marginPct = ((margin / p.sellPrice) * 100).toFixed(0);

    let statusBadge = '<span class="status-badge success">Aman</span>';
    if (p.stock <= 0) {
      statusBadge = '<span class="status-badge danger">Habis</span>';
    } else if (p.stock <= p.minStock) {
      statusBadge = '<span class="status-badge warning">Menipis</span>';
    }

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="font-size:1.3rem;">${escapeHtml(p.icon || '📦')}</span>
          <div>
            <strong>${escapeHtml(p.name)}</strong><br/>
            <small style="font-family:var(--font-mono);color:var(--text-subtle);">${escapeHtml(p.sku)}</small>
          </div>
        </div>
      </td>
      <td>${escapeHtml(p.category)}</td>
      <td style="font-family:var(--font-mono);">${formatRupiah(p.costPrice)}</td>
      <td style="font-family:var(--font-mono);color:var(--cyan-primary);"><strong>${formatRupiah(p.sellPrice)}</strong></td>
      <td><small style="color:var(--emerald-primary);font-weight:700;">+${marginPct}%</small></td>
      <td>
        <strong style="font-family:var(--font-mono);">${p.stock}</strong> / <small style="color:var(--text-subtle);">${p.minStock}</small>
      </td>
      <td>${statusBadge}</td>
      <td><small style="color:var(--text-muted);">${escapeHtml(p.supplier || '-')}</small></td>
      <td>
        <div style="display:flex;gap:0.35rem;">
          <button type="button" class="btn btn-xs btn-outline-cyan btn-edit-prod">Edit</button>
          <button type="button" class="btn btn-xs btn-ghost-danger btn-del-prod">Hapus</button>
        </div>
      </td>
    `;
    const btnEdit = tr.querySelector('.btn-edit-prod');
    const btnDel = tr.querySelector('.btn-del-prod');
    if (btnEdit) btnEdit.onclick = () => openEditProductModal(p.id);
    if (btnDel) btnDel.onclick = () => deleteProduct(p.id);
    tbody.appendChild(tr);
  });
}

// Filter chips in Inventory
document.querySelectorAll('.inv-stat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.inv-stat-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    currentInvFilter = chip.getAttribute('data-filter');
    renderInventoryTable();
  });
});

document.getElementById('invSearchInput').addEventListener('input', () => {
  renderInventoryTable();
});

// Product CRUD
function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = 'Tambah Produk Baru';
  document.getElementById('prodEditId').value = '';
  document.getElementById('productForm').reset();
  const descEl = document.getElementById('prodDescription');
  if (descEl) descEl.value = '';
  openModal('productModal');
}

function openEditProductModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  document.getElementById('productModalTitle').textContent = 'Edit Data Produk';
  document.getElementById('prodEditId').value = p.id;
  document.getElementById('prodName').value = p.name;
  document.getElementById('prodCategory').value = p.category;
  document.getElementById('prodSku').value = p.sku;
  document.getElementById('prodCostPrice').value = p.costPrice;
  document.getElementById('prodSellPrice').value = p.sellPrice;
  document.getElementById('prodStock').value = p.stock;
  document.getElementById('prodMinStock').value = p.minStock;
  document.getElementById('prodSupplier').value = p.supplier || '';
  document.getElementById('prodImage').value = p.icon || '📦';
  const descEl = document.getElementById('prodDescription');
  if (descEl) descEl.value = p.description || '';

  openModal('productModal');
}

function handleProductFormSubmit(e) {
  e.preventDefault();
  const editId = document.getElementById('prodEditId').value;
  const name = document.getElementById('prodName').value.trim();
  const category = document.getElementById('prodCategory').value;
  const sku = document.getElementById('prodSku').value.trim() || `SKU-${Date.now().toString().slice(-4)}`;
  const costPrice = Number(document.getElementById('prodCostPrice').value);
  const sellPrice = Number(document.getElementById('prodSellPrice').value);
  const stock = Number(document.getElementById('prodStock').value);
  const minStock = Number(document.getElementById('prodMinStock').value);
  const supplier = document.getElementById('prodSupplier').value.trim();
  const icon = document.getElementById('prodImage').value.trim() || '📦';
  const descEl = document.getElementById('prodDescription');
  const description = descEl ? descEl.value.trim() : '';

  if (sellPrice < costPrice) {
    if (!confirm('Harga jual lebih rendah daripada harga pokok (HPP)! Anda yakin ingin melanjutkan?')) {
      return;
    }
  }

  if (editId) {
    const p = products.find(x => x.id === editId);
    if (p) {
      p.name = name;
      p.category = category;
      p.sku = sku;
      p.costPrice = costPrice;
      p.sellPrice = sellPrice;
      p.stock = stock;
      p.minStock = minStock;
      p.supplier = supplier;
      p.icon = icon;
      p.description = description;
      showToast(`Produk "${name}" berhasil diperbarui!`, 'success');
    }
  } else {
    const newProd = {
      id: 'prod-' + Date.now().toString().slice(-6),
      name,
      category,
      sku,
      costPrice,
      sellPrice,
      stock,
      minStock,
      supplier,
      icon,
      description
    };
    products.unshift(newProd);
    showToast(`Produk baru "${name}" berhasil ditambahkan!`, 'success');
  }

  saveProducts();
  closeModal('productModal');
  renderAllViews();
}

function deleteProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;

  if (confirm(`Apakah Anda yakin ingin menghapus produk "${p.name}"? Data yang dihapus tidak dapat dikembalikan.`)) {
    products = products.filter(x => x.id !== id);
    saveProducts();
    showToast(`Produk "${p.name}" telah dihapus.`);
    renderAllViews();
  }
}

// SMART FEATURE: AUTO PURCHASE ORDER GENERATOR VIA WHATSAPP
function generateAutoRestockOrders() {
  const lowItems = products.filter(p => p.stock <= p.minStock);
  if (lowItems.length === 0) {
    showToast('Seluruh inventori dalam kuota aman! Tidak ada item yang perlu restock.', 'info');
    return;
  }

  let poMsg = `*SURAT PESANAN RESTOCK (PURCHASE ORDER)*\n`;
  poMsg += `Toko: ${(currentUser && currentUser.storeName) || 'Transforma UMKM'}\n`;
  poMsg += `Tanggal: ${new Date().toLocaleDateString('id-ID')}\n`;
  poMsg += `------------------------------------\n`;
  poMsg += `Mohon dipersiapkan barang restock berikut:\n`;

  lowItems.forEach((it, idx) => {
    const recommendOrderQty = (it.minStock * 2) - it.stock;
    poMsg += `${idx + 1}. *${it.name}*\n`;
    poMsg += `   - Sisa Stok Saat Ini: ${it.stock} unit\n`;
    poMsg += `   - Jumlah Pesanan: *${recommendOrderQty} unit*\n`;
    poMsg += `   - Supplier: ${it.supplier || '-'}\n`;
  });

  poMsg += `------------------------------------\n`;
  poMsg += `Harap konfirmasi ketersediaan dan total tagihan. Terima kasih!`;

  const waUrl = getWhatsAppUrl('', poMsg);
  window.open(waUrl, '_blank');
  showToast('Draft Purchase Order WhatsApp siap dikirimkan!', 'success');
}

// ========================================================
// 6. CRM & WHATSAPP MARKETING
// ========================================================
function renderCrmTable() {
  const tbody = document.getElementById('crmTableBody');
  const search = (document.getElementById('crmSearchInput').value || '').toLowerCase();
  tbody.innerHTML = '';

  const filtered = customers.filter(c => {
    return c.name.toLowerCase().includes(search) || c.phone.includes(search);
  });

  // Calculate totals
  const totalCust = customers.length;
  const vipCust = customers.filter(c => c.totalSpent >= 200000).length;
  const totalPoints = customers.reduce((sum, c) => sum + (c.points || 0), 0);

  document.getElementById('crmTotalCust').textContent = totalCust;
  document.getElementById('crmVipCust').textContent = vipCust;
  document.getElementById('crmTotalPoints').textContent = `${totalPoints} pts`;

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-subtle);padding:2rem;">Tidak ada pelanggan ditemukan.</td></tr>`;
    return;
  }

  filtered.forEach(c => {
    const isVip = c.totalSpent >= 200000;
    const segmentBadge = isVip
      ? '<span class="status-badge" style="background:rgba(168,85,247,0.2);color:#c084fc;">⭐ VIP Member</span>'
      : '<span class="status-badge" style="background:var(--bg-hover);color:var(--text-muted);">Regular</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${escapeHtml(c.name)}</strong><br/><small style="color:var(--text-subtle);">${escapeHtml(c.notes || '-')}</small></td>
      <td style="font-family:var(--font-mono);">${escapeHtml(c.phone)}</td>
      <td>${segmentBadge}</td>
      <td style="font-family:var(--font-mono);color:var(--cyan-primary);">${formatRupiah(c.totalSpent)}</td>
      <td style="font-family:var(--font-mono);font-weight:700;">${c.points} pts</td>
      <td><small style="color:var(--text-subtle);">${escapeHtml(c.lastVisit || '-')}</small></td>
      <td>
        <button type="button" class="btn btn-xs btn-smart btn-crm-chat" style="text-decoration:none;">
          <span>💬 Chat WA</span>
        </button>
      </td>
    `;
    const chatBtn = tr.querySelector('.btn-crm-chat');
    if (chatBtn) {
      chatBtn.onclick = () => {
        const waText = `Halo ${c.name}, terima kasih telah menjadi pelanggan setia Transforma UMKM! Anda memiliki ${c.points} poin loyalitas yang dapat ditukar dengan voucher diskon belanja.`;
        const waUrl = getWhatsAppUrl(c.phone, waText);
        if (waUrl) {
          window.open(waUrl, '_blank');
        } else {
          showToast('Nomor WhatsApp pelanggan tidak valid (format: 08xx / 628xx)!', 'warning');
        }
      };
    }
    tbody.appendChild(tr);
  });
}

document.getElementById('crmSearchInput').addEventListener('input', () => {
  renderCrmTable();
});

function openAddCustomerModal() {
  document.getElementById('customerModalTitle').textContent = 'Tambah Pelanggan Baru';
  document.getElementById('customerForm').reset();
  openModal('customerModal');
}

function handleCustomerFormSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const notes = document.getElementById('custNotes').value.trim();

  if (!normalizeIndonesianPhone(phone)) {
    showToast('Format nomor telepon pelanggan tidak valid (contoh: 08123456789 atau +628123456789)!', 'warning');
    return;
  }

  const newCust = {
    id: 'cust-' + Date.now().toString().slice(-6),
    name,
    phone,
    totalSpent: 0,
    points: 0,
    lastVisit: new Date().toISOString().split('T')[0],
    notes
  };

  customers.unshift(newCust);
  saveCustomers();
  closeModal('customerModal');
  showToast(`Pelanggan "${name}" berhasil ditambahkan!`, 'success');
  renderCrmTable();
  populateCustomerSelect();
}

function openBroadcastPromoModal() {
  selectPromoTemplate('weekend');
  openModal('broadcastModal');
}

function selectPromoTemplate(type) {
  const textarea = document.getElementById('promoCustomText');
  if (type === 'weekend') {
    textarea.value = `Halo kak! 🎉 Promo Spesial Weekend hadir di Transforma UMKM!\nDapatkan diskon langsung 15% untuk semua pembelian varian kopi dan makanan pilihan kami.\nKunjungi toko kami atau pesan langsung via katalog online!`;
  } else if (type === 'loyalty') {
    textarea.value = `Halo kak! ⭐ Poin loyalitas belanja Anda di Transforma UMKM sudah terkumpul!\nTukarkan 20 poin belanja Anda untuk mendapatkan GRATIS 1 kemasan Keripik Pisang Lumer atau potongan harga langsung di kasir!`;
  } else if (type === 'new') {
    textarea.value = `Halo kak! ✨ Menu baru sudah tiba di Transforma UMKM: Biji Kopi Gayo Single Origin 250g dengan aroma bunga dan rasa karamel khas.\nStok terbatas, pesan sekarang ya kak!`;
  }
}

function triggerBatchWaPromo() {
  const text = document.getElementById('promoCustomText').value;
  if (!text) {
    showToast('Teks promo tidak boleh kosong.', 'warning');
    return;
  }
  const targetCust = customers[0]; // demo send to top customer
  const cleanPhone = targetCust ? targetCust.phone.replace(/\D/g, '') : '';
  const waUrl = `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
  closeModal('broadcastModal');
  showToast('Pesan promo WhatsApp berhasil dibuka!', 'success');
}

// ========================================================
// 7. PUBLIC STOREFRONT (DIGITAL ECONOMY ENABLER)
// ========================================================
function renderPublicStorefront() {
  const grid = document.getElementById('pubProductsGrid');
  grid.innerHTML = '';

  const activeCategory = document.querySelector('#pubCategoryFilters .store-tab.active')?.getAttribute('data-cat') || 'all';
  const available = products.filter(p => {
    const matchCat = activeCategory === 'all' || p.category === activeCategory;
    return matchCat && p.stock > 0;
  });

  if (available.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-subtle);">Belum ada produk aktif yang tersedia di katalog.</div>`;
    return;
  }

  available.forEach(p => {
    const card = document.createElement('div');
    card.className = 'public-product-card';
    card.innerHTML = `
      <div>
        <div class="pub-prod-icon">${escapeHtml(p.icon || '📦')}</div>
        <div class="pub-prod-name">${escapeHtml(p.name)}</div>
        <div class="pub-prod-cat">${escapeHtml(p.category)} &bull; Stok: ${p.stock}</div>
        ${p.description ? `<p style="font-size:0.75rem;color:var(--text-subtle);margin-top:0.4rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35;">${escapeHtml(p.description)}</p>` : ''}
      </div>
      <div class="pub-prod-bottom">
        <div class="pub-prod-price">${formatRupiah(p.sellPrice)}</div>
        <button type="button" class="btn btn-xs btn-outline-cyan btn-order-wa">Pesan via WA</button>
      </div>
    `;
    const btnOrder = card.querySelector('.btn-order-wa');
    if (btnOrder) {
      btnOrder.onclick = () => orderViaWhatsApp(p.id);
    }
    grid.appendChild(card);
  });
}

document.querySelectorAll('#pubCategoryFilters .store-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#pubCategoryFilters .store-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    renderPublicStorefront();
  });
});

function orderViaWhatsApp(productId) {
  const p = products.find(x => x.id === productId);
  if (!p) return;
  const storeName = (currentUser && currentUser.storeName) || 'Transforma UMKM';
  const storePhone = (currentUser && currentUser.phone) || (DEFAULT_USER && DEFAULT_USER.phone) || '081234567890';
  const msg = `Halo ${storeName}! Saya ingin memesan *${p.name}* seharga ${formatRupiah(p.sellPrice)}. Apakah stok masih tersedia?`;

  const waUrl = getWhatsAppUrl(storePhone, msg);
  if (waUrl) {
    window.open(waUrl, '_blank');
  } else {
    showToast('Nomor WhatsApp toko tidak valid. Silakan periksa profil akun toko.', 'warning');
  }
}

function copyStorefrontLink() {
  const url = window.location.href.split('#')[0] + '#storefront';
  navigator.clipboard.writeText(url).then(() => {
    showToast('Tautan katalog online UMKM berhasil disalin ke clipboard!', 'success');
  });
}

// ========================================================
// 8. DATABASE EXPORT & BACKUP
// ========================================================
function exportDatabase() {
  const backup = {
    appName: 'TransformaUMKM',
    version: '1.0.0',
    platform: 'TransformaUMKM Business Operating System',
    exportedAt: new Date().toISOString(),
    products,
    transactions,
    customers
  };

  const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', jsonStr);
  dlAnchor.setAttribute('download', `TransformaUMKM_Database_${Date.now()}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();

  showToast('Database JSON berhasil diekspor!', 'success');
}

function updateAlertBadges() {
  const lowCount = products.filter(p => p.stock <= p.minStock).length;
  const alertPill = document.getElementById('navStockAlertCount');
  if (alertPill) {
    alertPill.textContent = lowCount;
    alertPill.style.display = lowCount > 0 ? 'inline-block' : 'none';
  }
  if (typeof renderNotifications === 'function') renderNotifications();
}

// ========================================================
// 9. AUTHENTICATION & USER SESSION (LOGIN & REGISTRASI)
// ========================================================
// Catatan: Sesi autentikasi disimpan pada client-side Storage (localStorage/sessionStorage)
// untuk keperluan purwarupa (prototype) standalone offline-first.
// Pada fase produksi penuh, verifikasi token JWT/session harus dikelola oleh backend server.
function initAuth() {
  const savedSession = localStorage.getItem(STORAGE_KEY_AUTH) || sessionStorage.getItem(STORAGE_KEY_AUTH);
  if (savedSession) {
    try {
      currentUser = JSON.parse(savedSession);
    } catch (err) {
      currentUser = null;
    }
  }

  // Jika tidak ada sesi aktif, alihkan langsung ke portal login mandiri
  if (!currentUser) {
    window.location.replace('login.html');
    return false;
  }
  updateAuthUI();
  return true;
}

function updateAuthUI() {
  const headerName = document.getElementById('headerUserName');
  const headerRole = document.getElementById('headerUserRole');
  const avatarChar = document.getElementById('userAvatarChar');
  const udName = document.getElementById('udName');
  const udEmail = document.getElementById('udEmail');
  const udRoleBadge = document.getElementById('udRoleBadge');
  const currentStore = document.getElementById('currentStoreName');
  const pubStoreTitle = document.getElementById('pubStoreTitle');

  if (!currentUser) {
    if (headerName) headerName.textContent = 'Belum Masuk';
    if (headerRole) headerRole.textContent = 'Tamu (Guest)';
    if (avatarChar) avatarChar.textContent = '?';
    return;
  }

  if (headerName) headerName.textContent = currentUser.name;
  if (headerRole) headerRole.textContent = currentUser.roleLabel || 'Pengguna';
  if (avatarChar) avatarChar.textContent = (currentUser.name || 'U').charAt(0).toUpperCase();
  if (udName) udName.textContent = currentUser.name;
  if (udEmail) udEmail.textContent = currentUser.email || 'user@umkm.id';
  if (udRoleBadge) udRoleBadge.textContent = currentUser.roleLabel || 'Member';
  if (currentStore && currentUser.storeName) currentStore.textContent = currentUser.storeName;
  if (pubStoreTitle && currentUser.storeName) pubStoreTitle.textContent = currentUser.storeName;
}

// ========================================================
// SHELL: dropdowns, sidebar, search, notifications
// ========================================================
const DROPDOWNS = ['userDropdownMenu', 'notifDropdown', 'searchResults'];

function closeAllDropdowns(except) {
  DROPDOWNS.forEach(id => {
    if (id === except) return;
    const el = document.getElementById(id);
    if (el) el.classList.remove('show');
  });
  const prof = document.getElementById('btnUserProfile');
  if (prof) prof.setAttribute('aria-expanded', except === 'userDropdownMenu' ? 'true' : 'false');
}

function toggleDropdown(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const willShow = !el.classList.contains('show');
  closeAllDropdowns(willShow ? id : undefined);
  el.classList.toggle('show', willShow);
  if (id === 'userDropdownMenu') {
    const prof = document.getElementById('btnUserProfile');
    if (prof) prof.setAttribute('aria-expanded', String(willShow));
  }
}

function toggleUserDropdown() { toggleDropdown('userDropdownMenu'); }
function closeUserDropdown() { closeAllDropdowns(); }

// ---- Sidebar (collapse on desktop, drawer on mobile) ----
const SB_KEY = 'transforma_sb_collapsed';
const isMobileViewport = () => window.innerWidth <= 1024;

function toggleSidebar() {
  if (isMobileViewport()) {
    document.body.classList.toggle('sb-open');
    return;
  }
  const collapsed = document.body.classList.toggle('sb-collapsed');
  try { localStorage.setItem(SB_KEY, collapsed ? '1' : '0'); } catch (e) {}
  const btn = document.getElementById('btnSidebarToggle');
  if (btn) { btn.setAttribute('aria-expanded', String(!collapsed)); }
  // Charts depend on container width — redraw after the width transition
  setTimeout(() => { renderSalesTrendChart(); renderCategoryDonutChart(); }, 260);
}

function closeSidebarMobile() { document.body.classList.remove('sb-open'); }

// ---- Global search (pages, products, customers) ----
function runGlobalSearch(q) {
  const box = document.getElementById('searchResults');
  if (!box) return;
  q = q.trim().toLowerCase();
  if (!q) { box.classList.remove('show'); return; }

  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const groups = [];
  const pages = Object.entries(TAB_TITLES).filter(([, t]) => t.toLowerCase().includes(q))
    .map(([id, t]) => ({ label: t, meta: 'Halaman', tab: id }));
  if (pages.length) groups.push(['Halaman', pages]);
  const prods = products.filter(p => (p.name + ' ' + (p.sku || '') + ' ' + (p.category || '')).toLowerCase().includes(q)).slice(0, 5)
    .map(p => ({ label: p.name, meta: 'Stok ' + p.stock, tab: 'inventory' }));
  if (prods.length) groups.push(['Produk', prods]);
  const custs = customers.filter(c => (c.name + ' ' + (c.phone || '')).toLowerCase().includes(q)).slice(0, 5)
    .map(c => ({ label: c.name, meta: c.phone || 'Pelanggan', tab: 'crm' }));
  if (custs.length) groups.push(['Pelanggan', custs]);

  box.innerHTML = groups.length
    ? groups.map(([g, items]) => `<div class="sr-label">${g}</div>` + items.map(i =>
        `<button type="button" class="sr-item" data-tab="${i.tab}"><span>${esc(i.label)}</span><small>${esc(i.meta)}</small></button>`).join('')).join('')
    : '<div class="sr-empty">Tidak ada hasil untuk “' + esc(q) + '”</div>';
  closeAllDropdowns('searchResults');
  box.classList.add('show');
}

// ---- Notifications (low stock + latest sales) ----
let notifReadAt = 0;
function buildNotifications() {
  const items = [];
  products.filter(p => p.stock <= p.minStock).slice(0, 5).forEach(p => items.push({
    kind: 'warn', icon: '⚠️', title: 'Stok menipis', text: `${p.name} tersisa ${p.stock} unit`, tab: 'inventory', ts: 2
  }));
  transactions.slice().reverse().slice(0, 3).forEach(t => items.push({
    kind: 'ok', icon: '🧾', title: `Transaksi ${t.id}`, text: `${t.customerName || 'Umum'} · ${formatRupiah(t.grandTotal)}`, tab: 'dashboard', ts: 1
  }));
  return items;
}

function renderNotifications() {
  const list = document.getElementById('notifList');
  const dot = document.getElementById('notifDot');
  if (!list) return;
  const items = buildNotifications();
  list.innerHTML = items.length ? items.map(n =>
    `<button type="button" class="notif-item" data-tab="${n.tab}"><span class="notif-ico ${n.kind}">${n.icon}</span>` +
    `<span class="notif-txt"><strong>${n.title}</strong><span>${n.text}</span></span></button>`).join('')
    : '<div class="notif-empty">Tidak ada notifikasi baru.</div>';
  const unread = notifReadAt ? 0 : items.filter(n => n.kind === 'warn').length;
  if (dot) { dot.textContent = unread; dot.style.display = unread ? 'flex' : 'none'; }
}

function initShell() {
  const on = (id, ev, fn) => { const el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
  on('btnSidebarToggle', 'click', toggleSidebar);
  on('btnSidebarMobile', 'click', toggleSidebar);
  on('sbBackdrop', 'click', closeSidebarMobile);

  on('btnNotif', 'click', e => { e.stopPropagation(); toggleDropdown('notifDropdown'); });
  on('btnNotifRead', 'click', e => { e.stopPropagation(); notifReadAt = Date.now(); renderNotifications(); });

  const search = document.getElementById('globalSearch');
  if (search) {
    search.addEventListener('input', () => runGlobalSearch(search.value));
    search.addEventListener('focus', () => runGlobalSearch(search.value));
    search.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const first = document.querySelector('#searchResults .sr-item');
        if (first) first.click();
      } else if (e.key === 'Escape') { search.blur(); closeAllDropdowns(); }
    });
  }
  // Delegated clicks for search / notification rows
  document.addEventListener('click', e => {
    const row = e.target.closest('.sr-item[data-tab], .notif-item[data-tab]');
    if (!row) return;
    switchTab(row.getAttribute('data-tab'));
    if (search) { search.value = ''; }
  });

  // Shortcuts: Ctrl/Cmd+K focus search · Esc closes menus
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); if (search) search.focus(); }
    else if (e.key === 'Escape') { closeAllDropdowns(); closeSidebarMobile(); }
  });

  window.addEventListener('resize', () => { if (!isMobileViewport()) closeSidebarMobile(); });
  renderNotifications();
}

// Redirect to separate auth portals
function openAuthModal(target = 'login') {
  if (target === 'register') {
    window.location.href = 'register.html';
  } else {
    window.location.href = 'login.html';
  }
}

// LOGOUT: Opens confirmation dialog giving choice between Login and Register
function handleLogout() {
  closeUserDropdown();
  const modal = document.getElementById('logoutModal');
  if (modal) {
    modal.classList.add('open');
  } else {
    proceedLogout('login');
  }
}

// Proceed Logout action with target redirection
function proceedLogout(target = 'login') {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.removeItem('transforma_wp_seen');
  } catch (err) {
    console.warn('Storage error on logout:', err);
  }
  currentUser = null;

  if (target === 'register') {
    window.location.replace('register.html');
  } else {
    window.location.replace('login.html');
  }
}

<<<<<<< HEAD:script.js
function handleMobileAccountClick() {
  handleLogout();
}

// ========================================================
// 10. RESPONSIVE MOBILE NAVIGATION
// ========================================================
function initMobileNav() {
  // Mobile Bottom Navigation Tabs Event Listeners (for actual mobile screens)
  document.querySelectorAll('#mobileBottomNav .mob-nav-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-tab');
      switchTab(tab);
    });
  });
}

=======
>>>>>>> b800731308c4e40c9af0693c781267216e961c99:transforma-umkm/script.js
// Modal generic helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

// Close dropdowns and modals when clicking outside
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
  }

  // Close any open dropdown when clicking outside of its widget
  if (!e.target.closest('.dd-wrap') && !e.target.closest('#searchBox')) {
    closeAllDropdowns();
  }
});

// ========================================================
// 11. ASISTEN BISNIS BERBASIS AI (TRANSFORMA-AI)
// ========================================================

let currentAiTab = 'stock-advisor';
let lastGeneratedAiCopy = null;
let lastGeneratedAiCaption = null;

function switchAiTab(tab) {
  currentAiTab = tab;
  const tabBtns = {
    'stock-advisor': 'btnAiTab-stock',
    'product-copywriter': 'btnAiTab-copywriter',
    'social-caption': 'btnAiTab-caption',
    'chat-consultant': 'btnAiTab-chat'
  };
  const tabPanes = {
    'stock-advisor': 'aiTab-stock-advisor',
    'product-copywriter': 'aiTab-product-copywriter',
    'social-caption': 'aiTab-social-caption',
    'chat-consultant': 'aiTab-chat-consultant'
  };

  Object.keys(tabBtns).forEach(k => {
    const btn = document.getElementById(tabBtns[k]);
    if (btn) btn.classList.toggle('active', k === tab);
  });

  Object.keys(tabPanes).forEach(k => {
    const pane = document.getElementById(tabPanes[k]);
    if (pane) {
      if (k === tab) {
        pane.style.display = 'block';
        pane.classList.add('active');
      } else {
        pane.style.display = 'none';
        pane.classList.remove('active');
      }
    }
  });

  if (tab === 'stock-advisor') {
    renderAiStockAdvisor();
  } else if (tab === 'product-copywriter') {
    populateAiCopywriterDropdown();
  }
}

function renderAiAssistant() {
  updateAiHeaderStats();
  renderAiStockAdvisor();
  populateAiCopywriterDropdown();
}

function updateAiHeaderStats() {
  // Count items needing restock
  const restockItems = products.filter(p => p.stock <= p.minStock);
  const countEl = document.getElementById('aiStatRestockCount');
  if (countEl) countEl.textContent = `${restockItems.length} Produk`;

  // Best seller
  const salesMap = {};
  transactions.forEach(t => {
    t.items.forEach(it => {
      salesMap[it.name] = (salesMap[it.name] || 0) + it.qty;
    });
  });

  let bestSellerName = products[0] ? products[0].name : 'Kopi Gayo';
  let maxQty = -1;
  Object.keys(salesMap).forEach(name => {
    if (salesMap[name] > maxQty) {
      maxQty = salesMap[name];
      bestSellerName = name;
    }
  });

  const bsEl = document.getElementById('aiStatBestSeller');
  if (bsEl) bsEl.textContent = bestSellerName.length > 18 ? bestSellerName.slice(0, 16) + '...' : bestSellerName;
}

// 1. SARAN STOK CERDAS BERBASIS DATA PENJUALAN RIIL
function renderAiStockAdvisor() {
  const tbody = document.getElementById('aiStockTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  // Calculate sales velocity from transactions past 7 days
  const soldMap = {};
  transactions.forEach(t => {
    t.items.forEach(it => {
      soldMap[it.id] = (soldMap[it.id] || 0) + it.qty;
    });
  });

  let criticalCount = 0;
  let totalEstRestockCost = 0;

  products.forEach(p => {
    const qtySold = soldMap[p.id] || 0;
    // Estimated daily rate (past 7 days / 7, minimum 0.5 for realistic projection)
    const dailyRate = Math.max(0.4, Number((qtySold / 7 + 0.3).toFixed(1)));
    const runoutDays = p.stock <= 0 ? 0 : Number((p.stock / dailyRate).toFixed(1));

    let statusHtml = '';
    let recRestock = 0;
    let recAction = '';

    if (p.stock <= 0) {
      criticalCount++;
      recRestock = Math.max(20, p.minStock * 3);
      statusHtml = '<span class="runout-badge runout-danger">🚨 Stok Habis (0 Hari)</span>';
      recAction = `Restock darurat +${recRestock} unit`;
    } else if (p.stock <= p.minStock || runoutDays <= 3) {
      criticalCount++;
      recRestock = Math.max(15, p.minStock * 2 - p.stock);
      statusHtml = `<span class="runout-badge runout-warning">⚠️ Kritis (~${runoutDays} Hari)</span>`;
      recAction = `Pesan ulang +${recRestock} unit (Target 14 hari)`;
    } else if (p.stock > p.minStock * 3 && qtySold < 3) {
      recRestock = 0;
      statusHtml = `<span class="runout-badge runout-overstock">📦 Overstock (~${runoutDays} Hari)</span>`;
      recAction = `Diskon promo / bundling untuk putar modal`;
    } else {
      recRestock = 0;
      statusHtml = `<span class="runout-badge runout-safe">✅ Aman (~${runoutDays} Hari)</span>`;
      recAction = `Kondisi aman, pantau akhir pekan`;
    }

    const estCost = recRestock * p.costPrice;
    totalEstRestockCost += estCost;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>
        <div style="display:flex;align-items:center;gap:0.5rem;">
          <span style="font-size:1.3rem;">${escapeHtml(p.icon || '📦')}</span>
          <div>
            <strong>${escapeHtml(p.name)}</strong><br/>
            <small style="color:var(--text-muted);">${escapeHtml(p.category)} &bull; SKU: ${escapeHtml(p.sku)}</small>
          </div>
        </div>
      </td>
      <td>
        <strong style="font-family:var(--font-mono);">${p.stock}</strong>
        <small style="color:var(--text-muted);">/ min ${p.minStock}</small>
      </td>
      <td>
        <span style="font-family:var(--font-mono); font-weight:600;">${dailyRate}</span>
        <small style="color:var(--text-muted);">unit/hari</small>
      </td>
      <td>
        <strong style="font-family:var(--font-mono); color:${runoutDays <= 3 ? '#f87171' : runoutDays <= 7 ? '#fbbf24' : '#34d399'};">
          ${p.stock <= 0 ? 'HABIS' : runoutDays + ' Hari'}
        </strong>
      </td>
      <td>${statusHtml}</td>
      <td>
        <strong>${escapeHtml(recAction)}</strong><br/>
        ${estCost > 0 ? `<small style="color:var(--cyan-primary); font-family:var(--font-mono);">Est. Modal: ${formatRupiah(estCost)}</small>` : '<small style="color:var(--text-muted);">&mdash;</small>'}
      </td>
      <td>
        <button type="button" class="btn btn-xs ${recRestock > 0 ? 'btn-smart' : 'btn-outline-cyan'} btn-ai-order">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>Pesan via WA</span>
        </button>
      </td>
    `;
    const btnAiOrder = tr.querySelector('.btn-ai-order');
    if (btnAiOrder) {
      btnAiOrder.onclick = () => triggerAiSupplierOrder(p.id, recRestock || 15);
    }
    tbody.appendChild(tr);
  });

  const summaryFooter = document.getElementById('aiStockSummaryFooter');
  if (summaryFooter) {
    summaryFooter.innerHTML = `
      <div style="display:flex; align-items:flex-start; gap:0.75rem;">
        <span style="font-size:1.4rem;">💡</span>
        <div>
          <strong>Diagnosis Intelijen AI TransformaUMKM:</strong>
          <p style="margin-top:0.25rem; color:var(--text-muted);">
            Terdapat <strong>${criticalCount} produk berstatus darurat/kritis</strong> yang berisiko kehabisan stok sebelum akhir pekan. 
            Estimasi modal kerja yang dianjurkan untuk pengadaan kembali adalah <strong>${formatRupiah(totalEstRestockCost)}</strong>.
            Gunakan tombol <em>"Pesan via WA"</em> untuk mengirim Purchase Order otomatis dengan draf WhatsApp yang diformat rapi.
          </p>
        </div>
      </div>
    `;
  }
}

function refreshAiStockAnalysis() {
  renderAiStockAdvisor();
  updateAiHeaderStats();
  showToast('Analisis ketersediaan stok AI berhasil diperbarui!');
}

function triggerAiSupplierOrder(prodId, qty) {
  const p = products.find(x => x.id === prodId);
  if (!p) return;

  const orderQty = qty || 20;
  const estCost = orderQty * p.costPrice;

  let msg = `*PURCHASE ORDER OTOMATIS (AI RE-STOCK) — TRANSFORMA UMKM*\n`;
  msg += `Halo ${p.supplier || 'Pemasok Rekanan'},\n`;
  msg += `Kami ingin melakukan pemesanan ulang (restock) stok produk usaha kami:\n\n`;
  msg += `• *Nama Produk*: ${p.name}\n`;
  msg += `• *Kode SKU*: ${p.sku}\n`;
  msg += `• *Jumlah Pesanan*: ${orderQty} unit\n`;
  msg += `• *Estimasi Nilai HPP*: ${formatRupiah(estCost)}\n\n`;
  msg += `Mohon konfirmasi ketersediaan dan nomor rekening faktur pengiriman. Terima kasih!\n`;
  msg += `— Dibuat otomatis via TransformaAI Smart Inventory System.`;

  const extractedPhone = extractIndonesianPhone(p.supplier);
  const waUrl = extractedPhone ? getWhatsAppUrl(extractedPhone, msg) : getWhatsAppUrl('', msg);
  window.open(waUrl, '_blank');
}

// 2. GENERATOR DESKRIPSI PRODUK OTOMATIS BERBASIS AI
function populateAiCopywriterDropdown() {
  const select = document.getElementById('aiCopySelectProduct');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="">-- Buat Produk Baru Secara Manual --</option>';

  products.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = `${p.icon || '📦'} ${p.name} (${p.category}) - ${formatRupiah(p.sellPrice)}`;
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

function handleSelectProductForCopywriting(prodId) {
  if (!prodId) return;
  const p = products.find(x => x.id === prodId);
  if (!p) return;

  document.getElementById('aiCopyProdName').value = p.name;
  document.getElementById('aiCopyCategory').value = p.category;
  if (!document.getElementById('aiCopyFeatures').value) {
    if (p.category.includes('Kopi')) {
      document.getElementById('aiCopyFeatures').value = '100% Biji kopi pilihan Nusantara, aroma wangi memikat, rasa seimbang dan nikmat diseduh panas atau dingin.';
    } else if (p.category.includes('Makanan')) {
      document.getElementById('aiCopyFeatures').value = 'Renyah, gurih, bumbu rempah alami tanpa pengawet buatan, kemasan higienis tahan lama.';
    } else {
      document.getElementById('aiCopyFeatures').value = 'Kualitas premium bahan pilihan, pengerjaan rapi, otentik buatan tangan pengrajin lokal.';
    }
  }
}

function handleGenerateAiDescription(e) {
  e.preventDefault();
  const name = document.getElementById('aiCopyProdName').value.trim();
  const category = document.getElementById('aiCopyCategory').value;
  const features = document.getElementById('aiCopyFeatures').value.trim();
  const tone = document.getElementById('aiCopyTone').value;
  const audience = document.getElementById('aiCopyTargetAudience').value;

  const btn = document.getElementById('btnRunAiCopywriter');
  btn.disabled = true;
  btn.innerHTML = `<span>⏳ AI Meracik Copywriting...</span>`;

  setTimeout(() => {
    const aiResult = generateSmartProductDescription(name, category, features, tone, audience);
    lastGeneratedAiCopy = {
      name,
      category,
      text: aiResult.rawText,
      bullets: aiResult.bullets,
      hashtags: aiResult.hashtags
    };

    const outputBox = document.getElementById('aiCopywriterOutputBox');
    outputBox.innerHTML = `
      <div class="ai-copy-result-card">
        <div style="font-size:1.15rem; font-weight:800; color:var(--cyan-primary); margin-bottom:0.75rem;">
          ✨ ${aiResult.headline}
        </div>
        <p style="font-size:0.92rem; line-height:1.6; margin-bottom:1rem; color:var(--text-main);">
          ${aiResult.body}
        </p>
        <div style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:0.75rem; margin-bottom:1rem;">
          <strong style="color:var(--text-main); font-size:0.85rem; display:block; margin-bottom:0.4rem;">🌟 Keunggulan Produk:</strong>
          <ul style="padding-left:1.25rem; font-size:0.85rem; color:var(--text-muted); line-height:1.6;">
            ${aiResult.bullets.map(b => `<li>${b}</li>`).join('')}
          </ul>
        </div>
        <div style="font-size:0.85rem; font-weight:700; color:#10b981; margin-bottom:0.75rem;">
          🛍️ ${aiResult.cta}
        </div>
        <div style="color:var(--cyan-primary); font-size:0.8rem; font-family:var(--font-mono);">
          ${aiResult.hashtags}
        </div>
      </div>
    `;

    document.getElementById('aiCopyActionsRow').style.display = 'flex';
    btn.disabled = false;
    btn.innerHTML = `<span>✨ Hasilkan Deskripsi AI Otomatis</span>`;
    showToast('Deskripsi produk AI berhasil dibuat!', 'success');
  }, 450);
}

function generateSmartProductDescription(name, category, features, tone, audience) {
  let headline = '';
  let body = '';
  let bullets = [];
  let cta = '';
  let hashtags = '';

  if (tone === 'storytelling') {
    headline = `Sensasi Kehangatan dan Kenikmatan Sejati: ${name}!`;
    body = `Dihadirkan dari kecintaan mendalam terhadap cita rasa lokal, ${name} memadukan keaslian bahan berkualitas dengan proses higienis terbaik. ${features || 'Setiap gigitan dan tegukannya menghadirkan kepuasan yang memanjakan lidah Anda.'}`;
    bullets = [
      `🌱 Bahan Pilihan Otentik: Diproses dari hasil bumi Nusantara bermutu tinggi.`,
      `☕ Cita Rasa Khas: Harmoni rasa yang seimbang, nyaman dinikmati kapan saja.`,
      `❤️ Mendukung UMKM Lokal: Setiap pembelian Anda berkontribusi pada petani & pengrajin daerah.`
    ];
    cta = `Pesan sekarang untuk menemani momen santai berkualitas Anda!`;
    hashtags = `#${name.replace(/[^a-zA-Z0-9]/g, '')} #UMKMIndonesia #CitaRasaNusantara #BanggaBuatanIndonesia`;
  } else if (tone === 'premium') {
    headline = `Kemewahan Cita Rasa Eksklusif: ${name}`;
    body = `Sebuah persembahan mahakarya artisan untuk Anda yang menghargai kesempurnaan. ${name} diracik secara presisi dengan standar kemurnian tinggi. ${features || 'Karakter rasa yang kompleks dan elegan memberikan pengalaman istimewa di setiap kesempatan.'}`;
    bullets = [
      `💎 Kualitas Seleksi Teratas: Hanya varietas dan bahan terbaik grade A.`,
      `🏆 Standar Higienis Artisan: Dikemas secara eksklusif menjaga kesegaran maksimal.`,
      `✨ Kesempurnaan Momen: Pilihan tepat untuk konsumsi pribadi berkelas maupun bingkisan elegan.`
    ];
    cta = `Miliki edisi terbaik ini sekarang sebelum kehabisan kuota batch!`;
    hashtags = `#${name.replace(/[^a-zA-Z0-9]/g, '')} #ArtisanSelection #ProdukPremium #GayaHidupBerkelas`;
  } else if (tone === 'fomo') {
    headline = `🔥 SPESIAL HARI INI! Dapatkan ${name} Sebelum Kehabisan!`;
    body = `Peringatan: Stok batch terbatas! ${name} menjadi incaran banyak pelanggan berkat kenikmatannya yang tak tertandingi. ${features || 'Rasa juara yang selalu bikin repeat order.'}`;
    bullets = [
      `⚡ Best Value Guarantee: Kualitas bintang lima dengan harga ramah kantong.`,
      `📦 Fresh From Production: Baru selesai diproduksi untuk menjaga kesegaran tertinggi.`,
      `🚀 Pengiriman Cepat: Siap dikirim hari ini ke alamat Anda.`
    ];
    cta = `Checkout segera sebelum stok ludes diserbu pembeli lain!`;
    hashtags = `#FlashSale #PromoHariIni #BuruanBeli #${name.replace(/[^a-zA-Z0-9]/g, '')}`;
  } else {
    // Persuasive / Commercial
    headline = `Pilihan Juara Pelanggan: ${name} Paling Direkomendasikan!`;
    body = `Ingin menikmati produk terbaik dengan kualitas terjamin dan harga jujur? ${name} adalah solusi sempurna untuk kebutuhan harian Anda. ${features || 'Terbukti disukai banyak pelanggan dan menjadi produk favorit di toko kami.'}`;
    bullets = [
      `⭐ 100% Kualitas Terjamin: Bahan segar bermutu tanpa kompromi.`,
      `💰 Harga Jujur & Kompetitif: Langsung dari tangan pertama produsen UMKM.`,
      `👍 Praktis & Siap Dinikmati: Cocok untuk konsumsi harian keluarga tercinta.`
    ];
    cta = `Klik pesan sekarang dan nikmati promo spesialnya!`;
    hashtags = `#${name.replace(/[^a-zA-Z0-9]/g, '')} #RekomendasiUMKM #ProdukFavorit #JualOnline`;
  }

  const rawText = `${headline}\n\n${body}\n\nKeunggulan Utama:\n• ${bullets.join('\n• ')}\n\n${cta}\n\n${hashtags}`;
  return { headline, body, bullets, cta, hashtags, rawText };
}

function applyAiDescriptionToSelectedProduct() {
  const select = document.getElementById('aiCopySelectProduct');
  const prodId = select ? select.value : '';

  if (!prodId) {
    showToast('Silakan pilih produk toko pada dropdown untuk menyimpan deskripsi!', 'warning');
    return;
  }

  const p = products.find(x => x.id === prodId);
  if (p && lastGeneratedAiCopy) {
    p.description = lastGeneratedAiCopy.text;
    saveProducts();
    renderAllViews();
    showToast(`Deskripsi AI berhasil disimpan ke data produk "${p.name}"!`, 'success');
  }
}

function generateAiDescriptionInModal() {
  const nameInput = document.getElementById('prodName');
  const catInput = document.getElementById('prodCategory');
  const name = (nameInput.value || '').trim();
  const category = catInput.value || 'Kopi & Minuman';

  if (!name) {
    showToast('Ketik Nama Produk terlebih dahulu agar AI dapat meracik deskripsi!', 'warning');
    nameInput.focus();
    return;
  }

  showToast('✨ AI sedang meracik deskripsi produk...', 'info');
  setTimeout(() => {
    const descObj = generateSmartProductDescription(name, category, '', 'persuasive', 'umum');
    const descArea = document.getElementById('prodDescription');
    if (descArea) {
      descArea.value = descObj.rawText;
      showToast('Deskripsi produk AI berhasil dibuat dan dimasukkan!', 'success');
    }
  }, 350);
}

// 3. GENERATOR CAPTION PROMOSI BERBASIS DATA PENJUALAN
function handleGenerateAiCaption(e) {
  e.preventDefault();
  const platform = document.querySelector('input[name="aiPlatform"]:checked').value;
  const strategy = document.getElementById('aiCaptionStrategy').value;
  const discount = document.getElementById('aiCaptionDiscount').value;
  const urgency = document.getElementById('aiCaptionUrgency').value;

  const btn = document.getElementById('btnRunAiCaption');
  btn.disabled = true;
  btn.innerHTML = `<span>⏳ AI Mengolah Data Penjualan...</span>`;

  setTimeout(() => {
    // Identify top selling product and slow moving product from data
    const salesMap = {};
    transactions.forEach(t => {
      t.items.forEach(it => {
        salesMap[it.name] = (salesMap[it.name] || 0) + it.qty;
      });
    });

    let bestSeller = products[0] || { name: 'Kopi Arabika Gayo', sellPrice: 65000 };
    let maxSold = -1;
    products.forEach(p => {
      if ((salesMap[p.name] || 0) > maxSold) {
        maxSold = salesMap[p.name] || 0;
        bestSeller = p;
      }
    });

    // Slow moving item (high stock, lowest sales)
    let slowMoving = products[products.length - 1] || products[0];
    let minSold = 9999;
    products.forEach(p => {
      if (p.stock > 5 && (salesMap[p.name] || 0) < minSold) {
        minSold = salesMap[p.name] || 0;
        slowMoving = p;
      }
    });

    const caption = generateAiCaptionText(platform, strategy, discount, urgency, bestSeller, slowMoving);
    lastGeneratedAiCaption = caption;

    const outputBox = document.getElementById('aiCaptionOutputBox');
    outputBox.innerHTML = `
      <div style="background:var(--bg-hover); border:1px solid var(--border-color); border-radius:var(--radius-sm); padding:1rem; font-family:${platform === 'whatsapp' ? 'var(--font-mono)' : 'var(--font-sans)'}; font-size:0.88rem; line-height:1.65; white-space:pre-wrap;">${caption}</div>
    `;

    document.getElementById('aiCaptionActionsRow').style.display = 'flex';
    btn.disabled = false;
    btn.innerHTML = `<span>🚀 Buat Caption AI Berdasarkan Data Penjualan</span>`;
    showToast('Caption promosi AI berhasil dibuat berdasarkan data riil!', 'success');
  }, 400);
}

function generateAiCaptionText(platform, strategy, discount, urgency, bestSeller, slowMoving) {
  let caption = '';
  const storeName = (currentUser && currentUser.storeName) || 'Kopi & Ritel Nusantara';
  const discPriceBest = formatRupiah(Math.round(bestSeller.sellPrice * 0.85));
  const discPriceSlow = formatRupiah(Math.round(slowMoving.sellPrice * 0.8));

  if (platform === 'whatsapp') {
    if (strategy === 'bestseller') {
      caption = `🔥 *PROMO SPESIAL PRODUK TERLARIS: ${bestSeller.name.toUpperCase()}!*\n\n` +
        `Halo Sahabat setia ${storeName}! 👋\n\n` +
        `Kabar gembira! Produk nomor #1 paling banyak dibeli minggu ini, *${bestSeller.name}*, sedang promo spesial:\n\n` +
        `✨ *PENAWARAN*: Diskon Spesial ${discount}!\n` +
        `🏷️ Dari harga normal ~${formatRupiah(bestSeller.sellPrice)}~ jadi *HANYA ${discPriceBest}*!\n` +
        `⏰ *WAKTU*: ${urgency}!\n\n` +
        `Kenapa wajib order sekarang?\n` +
        `✅ Bahan pilihan bermutu tinggi & cita rasa juara\n` +
        `✅ Stok cepat habis karena banyak pesanan harian\n` +
        `✅ Kemasan aman & higienis\n\n` +
        `📲 *Mau pesan sekarang?*\n` +
        `Balas pesan ini atau ketik: *"Kak, saya mau ambil Promo ${bestSeller.name}"*\n\n` +
        `_Salam hangat dari UMKM ${storeName} 🙏_`;
    } else if (strategy === 'slowmoving') {
      caption = `⚡ *FLASH SALE CUCI GUDANG — HEMAT HINGGA ${discount}!* ⚡\n\n` +
        `Halo semuanya! Mau cemilan / produk berkualitas dengan harga modal?\n\n` +
        `Khusus *${urgency}*, kami buka Flash Sale spesial untuk:\n` +
        `🎁 *${slowMoving.name}*\n` +
        `💸 Harga Cuci Gudang: *Cuma ${discPriceSlow}* (Stok Terbatas!)\n\n` +
        `Jangan sampai ketinggalan kesempatan hemat ini ya!\n` +
        `👉 Balas *"PESAN FLASH SALE"* sekarang juga sebelum stok ludes!`;
    } else if (strategy === 'loyalty') {
      caption = `⭐ *APRESIASI SPESIAL MEMBER LOYALITAS KAMI!* ⭐\n\n` +
        `Terima kasih telah setia berbelanja di *${storeName}*.\n\n` +
        `Punya poin belanja yang tersimpan? Tukarkan poin Anda sekarang dan nikmati:\n` +
        `🎉 ${discount} untuk transaksi berikutnya!\n` +
        `🎁 Hadiah langsung produk pilihan setiap penukaran 50 poin.\n\n` +
        `Cek poin Anda sekarang dengan membalas pesan ini!`;
    } else {
      caption = `🎉 *PROMO AKHIR PEKAN SERU — HEMAT ${discount}!* 🎉\n\n` +
        `Weekend makin asik ditemani sajian favorit dari *${storeName}*.\n\n` +
        `Nikmati penawaran istimewa *${discount}* untuk semua menu dan produk pilihan!\n` +
        `⏰ Berlaku: *${urgency}*\n\n` +
        `Yuk pesan sekarang dan rasakan kelezatannya bersama keluarga! Hubungi kami sekarang ya! 🙏`;
    }
  } else if (platform === 'instagram') {
    if (strategy === 'bestseller') {
      caption = `🔥 IT'S OFFICIAL: ${bestSeller.name} JADI JUARA TERLARIS PEKAN INI! 🔥\n\n` +
        `Buat kamu yang belum coba, ini dia produk yang selalu bikin pelanggan setia kami repeat order tiada henti! Cita rasa otentik yang bikin nagih sejak suapan / seduhan pertama. ✨\n\n` +
        `Spesial minggu ini, kamu bisa nikmati:\n` +
        `🏷️ ${discount} OFF\n` +
        `⚡ Hanya berlaku: ${urgency}!\n\n` +
        `Buruan amankan stokmu sekarang sebelum kehabisan slot!\n` +
        `👉 Klik link di bio untuk order via WhatsApp!\n\n` +
        `#${bestSeller.name.replace(/[^a-zA-Z0-9]/g, '')} #KulinerIndonesia #UMKMIndonesia #BestSeller #DiskonSpesial #FoodieNusantara #BanggaBuatanIndonesia`;
    } else {
      caption = `✨ SAATNYA SELF-REWARD DENGAN PROMO ${discount.toUpperCase()}! ✨\n\n` +
        `Weekend seru makin lengkap kalau ditemani produk terbaik dari @${storeName.toLowerCase().replace(/[^a-z0-9]/g, '')}.\n\n` +
        `Dapatkan potongan harga spesial ${discount} untuk produk pilihan favorit kamu! (${urgency})\n\n` +
        `Jangan nunggu besok, pesan sekarang juga via link di bio! 🛒\n\n` +
        `#PromoSpesial #DiskonWeekend #JajanOnline #UMKMJuara #ProdukLokal`;
    }
  } else {
    // TikTok script & caption
    caption = `[HOOK VIDEO 3 DETIK PERTAMA]: "Jangan beli ini kalau kamu gak mau ketagihan tiap hari!" 😱\n\n` +
      `Kenalin ${bestSeller.name} dari ${storeName}. Teksturnya juara, rasanya beneran otentik dan harganya lagi diskon ${discount} khusus ${urgency}!\n\n` +
      `Check out sekarang di keranjang kuning / klik link profil ya! 🛒✨\n\n` +
      `#racuntiktok #tiktokshopindonesia #fyp #kulinerenak #jajanantiktok #${bestSeller.name.replace(/[^a-zA-Z0-9]/g, '')}`;
  }

  return caption;
}

function shareAiCaptionToWhatsApp() {
  if (!lastGeneratedAiCaption) {
    showToast('Buat caption promosi terlebih dahulu!', 'warning');
    return;
  }
  const url = `https://wa.me/?text=${encodeURIComponent(lastGeneratedAiCaption)}`;
  window.open(url, '_blank');
}

function copyAiGeneratedText(boxId) {
  const box = document.getElementById(boxId);
  if (!box) return;
  const text = box.innerText || box.textContent;
  if (!text || text.includes('akan muncul di sini')) {
    showToast('Belum ada teks yang di-generate!', 'warning');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    showToast('Teks berhasil disalin ke clipboard!', 'success');
  }).catch(() => {
    showToast('Gagal menyalin teks secara otomatis.', 'danger');
  });
}

// 4. KONSULTASI INTERAKTIF BISNIS AI (CHAT COPILOT)
let aiChatHistory = [];

function handleSendAiChatMessage(e) {
  e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const query = (input.value || '').trim();
  if (!query) return;

  input.value = '';
  appendUserChatMessage(query);

  // Generate intelligent AI response based on real store database
  setTimeout(() => {
    const aiAnswer = processAiBusinessQuery(query);
    appendAssistantChatMessage(aiAnswer);
  }, 450);
}

function sendAiQuickPrompt(type) {
  const prompts = {
    omzet: 'Bagaimana strategi menaikkan omzet toko 25% minggu ini?',
    profit: 'Analisis margin keuntungan & HPP toko saya saat ini',
    bundling: 'Buatkan ide paket bundling produk terlaris + snack',
    restock: 'Produk apa yang paling berisiko kehabisan stok?'
  };

  const text = prompts[type] || 'Berikan analisis bisnis untuk toko saya';
  appendUserChatMessage(text);

  setTimeout(() => {
    const aiAnswer = processAiBusinessQuery(text);
    appendAssistantChatMessage(aiAnswer);
  }, 450);
}

function appendUserChatMessage(text) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg user';
  div.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function appendAssistantChatMessage(htmlContent) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg assistant';
  div.innerHTML = `<div class="chat-bubble">${htmlContent}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function processAiBusinessQuery(query) {
  const q = query.toLowerCase();

  // Calculate live store figures
  const totalRev = transactions.reduce((s, t) => s + (t.grandTotal || 0), 0);
  let totalCost = 0;
  transactions.forEach(t => {
    t.items.forEach(it => { totalCost += (it.cost || 0) * it.qty; });
  });
  const grossProfit = totalRev - totalCost;
  const marginPct = totalRev > 0 ? ((grossProfit / totalRev) * 100).toFixed(1) : '38.5';

  // Identify best seller and low stock
  const salesMap = {};
  transactions.forEach(t => {
    t.items.forEach(it => { salesMap[it.name] = (salesMap[it.name] || 0) + it.qty; });
  });
  let bestName = products[0] ? products[0].name : 'Kopi Arabika Gayo';
  let maxSold = 0;
  Object.keys(salesMap).forEach(k => {
    if (salesMap[k] > maxSold) {
      maxSold = salesMap[k];
      bestName = k;
    }
  });

  const lowStockItems = products.filter(p => p.stock <= p.minStock);

  if (q.includes('omzet') || q.includes('naik') || q.includes('strategi')) {
    return `
      <p>Berdasarkan data <strong>${transactions.length} transaksi</strong> terakhir dengan omzet tercatat <strong>${formatRupiah(totalRev)}</strong>, berikut 3 strategi konkret dari AI untuk menaikkan omzet sebesar 20-25%:</p>
      <ol style="padding-left:1.2rem; margin:0.5rem 0; line-height:1.6;">
        <li><strong>Strategi Paket Bundling (Average Order Value):</strong> Pasangkan produk terlaris Anda (<em>${bestName}</em>) dengan camilan ber-margin tinggi (seperti <em>Keripik Pisang Cokelat</em>). Berikan diskon 10% jika beli keduanya sekaligus.</li>
        <li><strong>Flash Sale Khusus Jam Sepi (Jam 14.00 - 17.00):</strong> Kirim broadcast WhatsApp penawaran diskon khusus di jam istirahat sore untuk memancing repeat order dari pelanggan terdaftar.</li>
        <li><strong>Aktivasi Katalog Mini Online:</strong> Bagikan link katalog publik toko Anda ke status WhatsApp dan grup komunitas lokal untuk menjaring pembeli tanpa potongan komisi marketplace.</li>
      </ol>
      <p style="color:var(--cyan-primary); font-weight:700;">💡 Saran Aksi Cepat: Gunakan tab <em>"3. Caption Promosi WA & Medsos"</em> di atas untuk membuat pesan promosi paket bundling sekarang!</p>
    `;
  } else if (q.includes('margin') || q.includes('profit') || q.includes('laba') || q.includes('hpp')) {
    return `
      <p>Berikut adalah <strong>Diagnosis Finansial Real-time</strong> toko Anda:</p>
      <ul style="padding-left:1.2rem; margin:0.5rem 0; line-height:1.6;">
        <li>💰 <strong>Total Pendapatan Terhitung:</strong> ${formatRupiah(totalRev)}</li>
        <li>📦 <strong>Total Beban Pokok (HPP):</strong> ${formatRupiah(totalCost)}</li>
        <li>📈 <strong>Laba Kotor Bersih:</strong> ${formatRupiah(grossProfit)} (Margin Rata-rata: <strong>${marginPct}%</strong>)</li>
      </ul>
      <p>Kesehatan finansial toko Anda berada pada kategori <strong>Sangat Baik</strong> (margin di atas 30%). Produk dengan kontribusi keuntungan tertinggi adalah kategori <em>Kopi & Minuman</em> dan <em>Kerajinan</em>.</p>
    `;
  } else if (q.includes('stok') || q.includes('restock') || q.includes('habis')) {
    const listNames = lowStockItems.map(p => `<strong>${p.name}</strong> (sisa ${p.stock} unit)`).join(', ');
    return `
      <p>⚠️ Peringatan Kritis Ketersediaan Stok:</p>
      <p>Saat ini terdapat <strong>${lowStockItems.length} produk</strong> yang berada di bawah batas safety stock: ${listNames || 'Semua stok dalam batas aman'}.</p>
      <p>AI menyarankan untuk segera mengirim Purchase Order ke pemasok agar tidak kehilangan momentum penjualan di akhir pekan. Silakan buka tab <em>"1. Saran Stok & Prediksi Kritis"</em> untuk mengirim PO via WhatsApp dalam 1 klik!</p>
    `;
  } else if (q.includes('bundling') || q.includes('paket') || q.includes('snack')) {
    return `
      <p>🎁 <strong>Rekomendasi Paket Bundling Cerdas (AI Synergy):</strong></p>
      <div style="background:var(--bg-hover); border:1px solid var(--border-color); padding:0.75rem; border-radius:6px; margin:0.5rem 0;">
        <strong style="color:var(--cyan-primary);">Paket "Ngopi Santai Nusantara"</strong><br/>
        • 1x ${bestName} (Harga Normal: ${formatRupiah(65000)})<br/>
        • 1x Keripik Pisang Cokelat Lumer 200g (Harga Normal: ${formatRupiah(22000)})<br/>
        • <em>Harga Bundling Normal: Rp 87.000 &rarr; <strong>Harga Promo: Rp 78.000 (Hemat 10%)</strong></em>
      </div>
      <p>Bundling ini meningkatkan rata-rata belanja konsumen (*basket size*) dari Rp 65.000 menjadi Rp 78.000 (+20%).</p>
    `;
  } else {
    return `
      <p>Terima kasih atas pertanyaannya! Berdasarkan pantauan operasional toko Anda:</p>
      <p>Toko Anda memiliki <strong>${products.length} item aktif</strong> dan <strong>${customers.length} pelanggan terdaftar</strong>. Produk dengan perputaran paling cepat saat ini adalah <em>${bestName}</em>.</p>
      <p>Rekomendasi AI: Pastikan ketersediaan stok produk unggulan Anda selalu aman dan manfaatkan fitur <strong>Generator Caption Promosi AI</strong> untuk menjangkau pelanggan baru secara berkala.</p>
    `;
  }
}

function resetAiChatHistory() {
  const container = document.getElementById('aiChatMessages');
  if (container) {
    container.innerHTML = `
      <div class="chat-msg assistant">
        <div class="chat-bubble">
          <p>Halo kembali! Riwayat konsultasi telah dibersihkan. Silakan ajukan pertanyaan baru mengenai strategi bisnis, stok, promosi, atau analisis finansial toko Anda.</p>
        </div>
      </div>
    `;
  }
  showToast('Riwayat chat konsultasi AI telah dibersihkan.');
}

// (escapeHtml defined at top security helpers)

// Redraw canvas charts when the viewport changes (browser zoom / window resize)
(function () {
  let t = null;
  window.addEventListener('resize', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (typeof renderSalesTrendChart === 'function') renderSalesTrendChart();
      if (typeof renderCategoryDonutChart === 'function') renderCategoryDonutChart();
    }, 150);
  });
})();
