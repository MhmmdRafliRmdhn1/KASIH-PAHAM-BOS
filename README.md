# TransformaUMKM

> **Platform Operasi Digital Terpadu untuk UMKM Indonesia**  
> Kasir POS · Inventori · Asisten Bisnis AI · CRM · Katalog Digital — didukung arsitektur REST API Backend.

[![Platform](https://img.shields.io/badge/Platform-Web%20SPA%20%2B%20REST%20API-00D4FF)](#)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%2F%20Express%205-68a063)](#)
[![Frontend](https://img.shields.io/badge/Frontend-HTML5%20%2F%20CSS3%20%2F%20Vanilla%20JS-F7DF1E)](#)
[![License](https://img.shields.io/badge/License-MIT-10B981)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-22c55e)](#)

---

## Arsitektur Sistem (Client-Server REST API)

TransformaUMKM mengadopsi arsitektur terpisah antara **Frontend Single Page Application (SPA)** dan **Backend REST API**:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (Port 8080)                     │
│  - Semantic HTML5, CSS Variables, Native Canvas 2D Charts              │
│  - Lucide Icons CDN + Local Storage SVG Cache                          │
│  - Session Security (XOR Cipher Token Expiry di localStorage)          │
│  - script.js: Mengonsumsi data bisnis via async/await                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                         HTTP REST API (JSON / CORS)
                       http://localhost:3001/api/...
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                       BACKEND SERVER (Port 3001)                       │
│  - Node.js + Express 5 + CORS Middleware (backend/server.js)           │
│  - API Client SDK (backend/api-client.js)                              │
│  - Atomic Business Logic (Rollback on failure)                         │
│  - 7 Entitas Inti: Categories, Suppliers, Products, Customers,         │
│    Transactions, Transaction Items, Stock Mutations                    │
│  - Executive Dashboard Aggregator & Health Endpoint                    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Fitur Utama & Ke-7 Entitas Bisnis

Aplikasi mengintegrasikan 7 entitas bisnis secara relasional dan atomik:

| Entitas | Deskripsi & Operasi API | Fitur Terkait |
|---|---|---|
| **1. Categories** | Manajemen kategori produk (`/api/categories`) | POS category chips, donat chart omzet, filter inventori |
| **2. Suppliers** | Direktori pemasok & kontak WhatsApp (`/api/suppliers`) | AI WhatsApp Purchase Order, pengadaan barang |
| **3. Products** | Katalog SKU, harga modal/jual, stok & threshold (`/api/products`) | Kasir POS, inventori, etalase publik, restock alert |
| **4. Customers** | Direktori pelanggan, segmentasi VIP/Regular (`/api/customers`) | Poin loyalitas (1 pt / Rp 10.000), WhatsApp blast |
| **5. Transactions** | Header transaksi penjualan, diskon, PPN, bayar/kembalian (`/api/transactions`) | Checkout POS, struk digital, omzet dashboard |
| **6. Transaction Items** | Rincian produk per transaksi penjualan (`/api/transaction-items`) | Kalkulasi margin keuntungan, top 5 best seller |
| **7. Stock Mutations** | Audit trail keluar-masuk stok (SALE, RESTOCK, ADJUSTMENT) (`/api/stock-mutations`) | Laju penjualan (*sales velocity*), AI Restock |

---

## Modul Fungsional

| Modul | Deskripsi |
|-------|-----------|
| 📊 **Executive Dashboard** | KPI real-time: omzet harian, estimasi laba bersih, total transaksi, alert stok. Grafik tren 7 hari (Canvas line) & breakdown kategori (Canvas donut). |
| 🛒 **Kasir POS** | Transaksi instan, filter kategori, diskon fleksibel, toggle PPN, kalkulator uang/kembalian, QRIS canvas dinamis, cetak & kirim struk digital WhatsApp. |
| 📦 **Inventori & Stok** | CRUD produk lengkap, SKU otomatis, peringatan stok minimum, auto-icon Lucide cerdas (zero config). |
| 🤖 **Asisten Bisnis AI** | Saran restock berbasis sales velocity & runout days, generator deskripsi produk, caption promosi WA/IG/TikTok, chat konsultasi bisnis. |
| 👥 **CRM Pelanggan** | Database pelanggan, poin reward otomatis, segmentasi VIP, template pesan promosi & ucapan WhatsApp. |
| 🏪 **Katalog Digital Publik** | Mini storefront publik dengan sinkronisasi stok real-time dan direct order ke WhatsApp toko. |
| ⚙️ **Pengaturan Terpadu** | Profil Toko, Kasir/Pembayaran, Inventori, Backup Data JSON 7 entitas, Akun & Keamanan. |
| 🔐 **Auth Mandiri** | Registrasi & login kredensial lokal, enkripsi sesi XOR, auto-expiry token (tetap tersimpan di `localStorage` sesi). |

---

## Cara Menjalankan

### Prasyarat

- **Node.js** versi 18 ke atas → [Download di nodejs.org](https://nodejs.org)
- **pnpm** atau **npm**

---

### 1. Install Dependensi

Buka terminal di folder proyek, lalu jalankan:

```bash
pnpm install
# atau menggunakan npm:
npm install
```

---

### 2. Menjalankan Server & Aplikasi

Jalankan backend dan frontend secara bersamaan:

```bash
pnpm run dev
# atau:
npm run dev
```

Perintah di atas akan menjalankan:
- **Backend REST API**: `http://localhost:3001`
- **Frontend Web SPA**: `http://localhost:8080`

#### Menjalankan Secara Terpisah:

```bash
# Terminal 1 - Backend REST API
pnpm run backend
# (atau: node backend/server.js)

# Terminal 2 - Frontend Web SPA
pnpm run frontend
# (atau: npx live-server . --port=8080 --ignore=backend)
```

Buka browser dan akses: **http://localhost:8080**

---

## Alur Pertama Kali Pakai

```
1. Buka http://localhost:8080
         ↓
2. Halaman Login → klik "Daftar Sekarang"
         ↓
3. Isi form registrasi (Nama, Usaha, No. WA, Email, Password)
         ↓
4. Login dengan akun yang baru didaftarkan
         ↓
5. Dashboard terhubung otomatis dengan REST API Backend di port 3001!
   → Tambah/kelola produk di menu Inventori
   → Lakukan transaksi kasir di menu Kasir POS
   → Pantau omzet, laba bersih, dan grafik tren di Dashboard
```

---

## Struktur Proyek

```
TransformaUMKM/
├── index.html              # Aplikasi SPA utama (terhubung ke backend/api-client.js)
├── style.css               # Design system, CSS variables & komponen UI
├── script.js               # Logika aplikasi frontend (async/await ke REST API)
├── auth-security.js        # Modul enkripsi sesi & autentikasi lokal
├── welcome.js              # Onboarding & landing animation
├── dev-inspector.js        # Tool inspeksi & developer diagnostic
├── package.json            # Konfigurasi dependensi Express, CORS, live-server
├── vercel.json             # Konfigurasi hosting
├── favicon.ico             # Favicon web
├── backend/
│   ├── server.js           # Server REST API Express (In-Memory Atomic Store)
│   └── api-client.js       # Client SDK CRUD 7 entitas (fetch async/await)
├── assets/
│   ├── logo.svg            # Logo TransformaUMKM
│   ├── teks-logo.svg       # Versi teks logo
│   ├── favicon.png         # Favicon PNG
│   └── icons/              # Ikon SVG produk Lucide (offline fallback)
├── docs/
│   └── PROPOSAL_UX_CASE_STUDY.md
├── PRD.md                  # Product Requirement Document v2.0
└── LICENSE                 # Lisensi MIT
```

---

## Endpoint REST API Backend (`http://localhost:3001/api`)

| Metode | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/health` | Status server dan jumlah data tiap entitas |
| `GET` | `/dashboard/summary` | Agregasi metrik KPI omzet, laba, tren 7 hari, dan top produk |
| `GET, POST` | `/categories` | Ambil semua kategori atau buat kategori baru |
| `GET, PUT, DELETE`| `/categories/:id` | Ambil detail, perbarui, atau hapus kategori |
| `GET, POST` | `/suppliers` | Ambil semua supplier atau tambah supplier |
| `GET, PUT, DELETE`| `/suppliers/:id` | Detail, ubah, atau hapus supplier |
| `GET, POST` | `/products` | Daftar produk (dukung filter search/low_stock) atau tambah |
| `GET, PUT, DELETE`| `/products/:id` | Detail, ubah, atau nonaktifkan produk |
| `PATCH` | `/products/:id/restock` | Tambah stok produk secara langsung |
| `GET, POST` | `/customers` | Daftar pelanggan atau tambah pelanggan baru |
| `GET, PUT, DELETE`| `/customers/:id` | Detail, perbarui, atau hapus data pelanggan |
| `GET, POST` | `/transactions` | Riwayat transaksi atau checkout transaksi baru (atomik) |
| `GET, PUT, DELETE`| `/transactions/:id` | Detail transaksi (+items), ubah, atau void transaksi |
| `GET, POST` | `/transaction-items` | Daftar rincian item atau tambah item transaksi |
| `GET, PUT, DELETE`| `/transaction-items/:id` | Detail, ubah, atau hapus item transaksi |
| `GET, POST` | `/stock-mutations` | Riwayat kartu stok atau catat mutasi manual |
| `GET, PUT, DELETE`| `/stock-mutations/:id` | Detail, ubah, atau hapus catatan mutasi stok |

---

## Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan.  
Lihat file [LICENSE](LICENSE) untuk detail lengkap.

---

<p align="center">
  Dibuat dengan ❤️ untuk UMKM Indonesia &nbsp;•&nbsp; TransformaUMKM 2026
</p>
