# PRODUCT REQUIREMENT DOCUMENT (PRD)
## TransformaUMKM — Platform Operasi Digital Terpadu untuk Bisnis & UMKM Indonesia

---

### Informasi Dokumen
- **Nama Produk**: TransformaUMKM
- **Versi Dokumen**: 2.0 (Production-Ready Spec)
- **Status Dokumen**: Final / Approved for Project Reporting
- **Penyusun**: Tim Pengembang TransformaUMKM
- **Target Pembaca**: Dosen Penguji, Reviewer Kompetisi, Stakeholder Bisnis, dan Software Engineer

---

## 1. Executive Summary & Latar Belakang

### 1.1 Latar Belakang Masalah
Usaha Mikro, Kecil, dan Menengah (UMKM) merupakan tulang punggung perekonomian Indonesia dengan kontribusi lebih dari 61% terhadap PDB nasional. Meskipun demikian, mayoritas pelaku usaha masih menghadapi kendala besar dalam transformasi digital, antara lain:
1. **Stock Blindness (Kebutaan Stok)**: Tidak adanya pemantauan laju penjualan harian (*sales velocity*) menyebabkan stok habis tiba-tiba (*stockout*) atau menumpuknya barang tidak laku (*dead stock*) yang mengunci modal kerja.
2. **Keterbatasan Keterampilan Pemasaran & Copywriting**: Pemilik usaha kesulitan menyusun narasi produk persuasif dan materi promosi harian untuk media sosial (WhatsApp, Instagram, TikTok).
3. **Pencatatan Keuangan Manual & Terfragmentasi**: Kasir manual berbasis kertas rawan selisih hitung dan tidak terintegrasi langsung dengan kalkulasi margin keuntungan bersih.
4. **Hambatan Adopsi Teknologi**: Solusi POS enterprise di pasar umumnya mensyaratkan biaya langganan bulanan mahal, instalasi rumit, serta ketergantungan koneksi internet backend yang tinggi.

### 1.2 Visi & Pernyataan Misi Produk
- **Visi**: Menjadi sistem operasi digital terpadu (All-in-One SME Operating System) yang inklusif, mandiri (*offline-first*), cepat, dan cerdas bagi UMKM Indonesia.
- **Misi**: Menghilangkan hambatan digitalisasi dengan menyediakan platform kasir (POS), inventori otomatis, analitik keuangan real-time, dan asisten bisnis AI tanpa ketergantungan infrastruktur backend server yang berat.

---

## 2. Profil Pengguna & User Persona

| Persona | Peran | Kebutuhan Utama | Rasa Frustrasi (Pain Points) |
|---|---|---|---|
| **Pak Hendro (42 th)** | Pemilik Toko (Business Owner) | Memantau laba bersih harian, status stok kritis, dan mengekspor cadangan data toko. | Waktu habis untuk rekap manual nota kasir setiap malam; sering telat kulakan ke supplier. |
| **Siti (22 th)** | Kasir / Staf Operasional | Melakukan input transaksi cepat (< 15 detik), cetak struk, dan generate QRIS otomatis. | Aplikasi kasir yang lambat (laggy), proses diskon/pajak yang membingungkan. |
| **Ibu Ratna (35 th)** | Pelanggan / Konsumen | Melihat katalog toko via tautan online, cek stok barang, dan pesan via WhatsApp. | Enggan download aplikasi baru hanya untuk belanja kebutuhan toko langganan. |

---

## 3. Arsitektur Teknis & Tech Stack

Aplikasi dirancang dengan pendekatan **Zero-Heavy-Dependency Single Page Application (SPA)** dengan prinsip *Offline-First Architecture*:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                            │
│  Semantic HTML5 • CSS3 Variables (Design Tokens) • Responsive Viewport │
│         Mobile Simulator Engine • Lucide SVG Icon CDN Hydration        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                           BUSINESS LOGIC                               │
│  - SessionSecurity Module (XOR Cipher & Auto-Expiry)                   │
│  - Smart POS Engine (Cart calculation, Tax, Dynamic QRIS Canvas)       │
│  - AI Restock Engine (Velocity formula & Runout Forecast)              │
│  - AI Copywriter & Marketing Content Generators                        │
│  - Native Canvas 2D Chart Engine (Line Trend & Donut Breakdown)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────┴────────────────────────────────────┐
│                            DATA PERSISTENCE                            │
│  LocalStorage Cache Engine • JSON Backup/Restore • schema.sql Ready    │
└────────────────────────────────────────────────────────────────────────┘
```

- **Frontend Core**: HTML5 Semantik, Vanilla JavaScript (ES6+ Native Module Pattern).
- **Styling**: Vanilla CSS3, CSS Custom Properties (Design Tokens), Light Glassmorphism.
- **Visualisasi Grafik**: Native HTML5 Canvas 2D Context API (Bebas dari Chart.js / library pihak ketiga).
- **Icon System**: Lucide Icons CDN via jsDelivr + Local Storage cache + Offline Embedded SVG fallback.
- **Penyimpanan Data**: Web LocalStorage berstruktur JSON dengan isolasi prefix `transforma_umkm_*`.
- **Kesiapan Database Relasional**: Disediakan `database/schema.sql` (PostgreSQL / SQLite ready) untuk eskalasi ke arsitektur multi-tenant berbasis cloud.

---

## 4. Rincian Modul & Kebutuhan Fungsional (Functional Requirements)

### 4.1 Modul 1: Autentikasi & Keamanan Sesi Mandiri
- **FR-1.1 Registrasi Akun Mandiri**: Pengguna baru dapat mendaftarkan akun dengan memasukkan Nama, Nama Usaha, Nomor WhatsApp, Email, dan Kata Sandi (minimal 6 karakter). Data tersimpan di database lokal pengguna (`transforma_umkm_users_db`).
- **FR-1.2 Validasi Login Kredensial**: Sistem memverifikasi kecocokan email dan kata sandi terhadap data terdaftar.
- **FR-1.3 Enkripsi Sesi (SessionSecurity)**: Token sesi dienkripsi menggunakan stream cipher berbasis signature browser sebelum disimpan pada `localStorage` atau `sessionStorage`.
- **FR-1.4 Fitur Ingat Saya & Auto-Expiry**: Opsi "Ingat Saya" mengaktifkan masa berlaku sesi 7 hari; sesi reguler kedaluwarsa otomatis dalam 4 jam.
- **FR-1.5 Blank Initial State**: Sistem memulai lingkungan data bersih (0 produk, 0 transaksi, 0 pelanggan) untuk pengguna baru tanpa injeksi data demo acak.

### 4.2 Modul 2: Executive Business Dashboard
- **FR-2.1 Kartu KPI Real-Time**: Menampilkan 4 metrik utama:
  1. *Total Omzet Hari Ini* (Rp) beserta indikator perubahan performa.
  2. *Estimasi Laba Bersih* (Rp) dengan perhitungan margin laba riil (Omzet - Modal Pokok).
  3. *Total Transaksi* dan rata-rata nilai transaksi (*basket size*).
  4. *Peringatan Stok Kritis* (jumlah SKU yang berada di bawah ambang batas minimum).
- **FR-2.2 Canvas Line Chart (Tren 7 Hari)**: Visualisasi grafis omzet 7 hari terakhir yang digambar secara native menggunakan Canvas 2D.
- **FR-2.3 Canvas Donut Chart (Kontribusi Kategori)**: Diagram lingkaran proporsional persentase omzet per kategori produk (*Kopi & Minuman, Makanan & Snack, Bahan Pokok, Kerajinan & Fashion*).

### 4.3 Modul 3: Smart Point of Sale (POS) & Kasir
- **FR-3.1 Filter & Pencarian Cepat**: Filter instan berbasis kategori serta kolom pencarian langsung berdasarkan nama atau SKU.
- **FR-3.2 Manajemen Keranjang (Cart Engine)**: Menambah kuantitas, mengurangi, serta validasi ketersediaan stok produk secara dinamis.
- **FR-3.3 Kalkulasi Finansial Dinamis**:
  - Subtotal keranjang.
  - Input diskon (nominal atau persentase).
  - Pajak PPN dinamis sesuai pengaturan toko.
  - Total Akhir yang selalu sinkron.
- **FR-3.4 Pembayaran Tunai & Kembalian**: Menghitung uang diterima dan nilai kembalian secara presisi.
- **FR-3.5 Pembayaran Non-Tunai (QRIS Canvas Dinamis)**: Menggambar QR code QRIS dinamis pada elemen canvas sesuai nama toko dan nominal transaksi.
- **FR-3.6 Cetak & Bagikan Struk WhatsApp**: Modal struk digital lengkap dengan rincian item, nomor nota, footer toko, serta tombol kirim draf struk langsung ke nomor WhatsApp pelanggan.

### 4.4 Modul 4: Inventori & Katalog Produk
- **FR-4.1 CRUD Produk Lengkap**: Formulir tambah, ubah, dan hapus produk (Nama, Kategori, Harga Jual, Harga Modal/Beli, Stok Saat Ini, Stok Minimum, dan Deskripsi).
- **FR-4.2 Generator SKU Otomatis**: Menghasilkan kode SKU standar secara otomatis berdasarkan kombinasi kategori, nama, dan ukuran (contoh: `KOP-ARABIKA-250`).
- **FR-4.3 Otomasi Icon Lucide (Zero Configuration)**: Algoritma cerdas mencocokkan nama dan kategori produk dengan kamus kata kunci 24+ icon Lucide, tanpa memerlukan input icon manual dari pengguna.
- **FR-4.4 Peringatan Status Stok**: Badge visual dinamis (*Aman, Kritis, Menipis, Habis*) dengan pewarnaan intuitif.

### 4.5 Modul 5: Asisten Bisnis AI (TransformaAI Copilot)
- **FR-5.1 AI Restock & Prediksi Kritis**:
  - Menghitung *Sales Velocity* (unit terjual / hari).
  - Menghitung *Runout Days* (Sisa Hari = Stok Saat Ini / Sales Velocity).
  - Mengelompokkan status urgensi restock: *Darurat, Kritis, Aman, Overstock*.
  - Tombol **"Pesan via WA"** untuk membuat Purchase Order terformat otomatis ke supplier dalam 1 klik.
- **FR-5.2 AI Product Copywriter**: Generator deskripsi pemasaran instan dengan 4 variasi gaya bahasa: *Storytelling, Persuasif, Premium/Elegan, dan FOMO/Mendesak*.
- **FR-5.3 AI Promo Caption Generator**: Membaca data riil toko untuk menghasilkan materi copywriting promosi (WhatsApp Broadcast, Instagram Feed/Reels, TikTok) untuk produk terlaris maupun cuci gudang (*dead stock*).
- **FR-5.4 Chat Konsultan Bisnis AI**: Dialog interaktif cerdas yang menjawab pertanyaan strategis pemilik usaha dengan menyajikan angka riil toko (omzet, persentase margin laba kotor, dan saran bundling).

### 4.6 Modul 6: CRM & Manajemen Pelanggan
- **FR-6.1 Database Direktori Pelanggan**: Pencatatan Nama, Nomor WhatsApp, Catatan Preferensi, Riwayat Kunjungan, dan Total Belanja.
- **FR-6.2 Sistem Poin Loyalitas**: Perhitungan otomatis 1 poin hadiah setiap transaksi kelipatan Rp 10.000.
- **FR-6.3 Segmentasi Otomatis (VIP vs Regular)**: Mengklasifikasikan pelanggan dengan akumulasi belanja di atas batas tertentu sebagai *VIP Member*.
- **FR-6.4 Integrasi One-Click WhatsApp Chat**: Tombol pintas untuk menyapa atau mengirim ucapan personal/voucher diskon via WhatsApp Web/App.

### 4.7 Modul 7: Katalog Digital Publik (Public Storefront)
- **FR-7.1 Tampilan Mini Storefront Publik**: Halaman khusus etalase produk yang bersih untuk dibagikan kepada pelanggan umum.
- **FR-7.2 Sinkronisasi Stok & Data Toko**: Menampilkan nama toko, nomor telepon, alamat, dan stok produk secara langsung dari database utama.
- **FR-7.3 Order via WhatsApp**: Pelanggan dapat memilih produk dan langsung diarahkan ke nomor WhatsApp toko untuk menyelesaikan pemesanan.

### 4.8 Modul 8: Modul Pengaturan (5 Kelompok Fungsional)
- **FR-8.1 Kelompok 1: Profil Toko & Usaha**: Pengaturan Nama Toko, Nomor WhatsApp Layanan, Deskripsi/Slogan, Alamat Fisik, dan Catatan Kaki (*Footer*) Struk Belanja.
- **FR-8.2 Kelompok 2: Kasir & Pembayaran**: Penyesuaian persentase tarif PPN (0% - 100%), nomor rekening bank transfer, dan nama pemilik akun QRIS.
- **FR-8.3 Kelompok 3: Aturan Inventori**: Pengaturan batas minimum stok default (*default threshold*) untuk peringatan dini sistem.
- **FR-8.4 Kelompok 4: Pencadangan & Pemulihan Data**:
  - *Export Data*: Mengunduh seluruh database toko dalam format file `.json`.
  - *Import Data*: Memulihkan data toko dari file cadangan `.json`.
  - *Kosongkan Semua Data*: Fitur pembersihan total (*factory reset*) untuk memulai buku toko baru.
- **FR-8.5 Kelompok 5: Akun & Keamanan Sesi**: Pembaruan kata sandi akun dengan validasi kata sandi saat ini (*current password check*) terhadap basis data tersimpan.

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

### 5.1 Kinerja (Performance)
- **Waktu Muat (Load Time)**: Halaman aplikasi pertama kali dimuat di bawah **1,0 detik** pada koneksi standar 4G berkat arsitektur SPA tanpa bundling besar.
- **Respon Antarmuka**: Seluruh interaksi form, penyaringan kategori, dan penambahan item kasir memiliki latensi render di bawah **16 milidetik** (60 FPS smooth rendering).

### 5.2 Keamanan (Security)
- **Proteksi Kredensial**: Tidak ada hardcoded API keys atau credential di sisi client script.
- **Session Obfuscation**: Enkripsi simetris XOR pada sesi lokal mencegah eksfiltrasi data plain-text melalui inspeksi kasual browser.
- **XSS Mitigation**: Pemanfaatan sanitasi template dan text escaping sebelum melakukan innerHTML rendering.

### 5.3 Keandalan & Offline-First (Reliability)
- **Zero Internet POS Execution**: Transaksi kasir, pembaruan stok, dan kalkulasi dashboard tetap dapat berjalan normal 100% saat koneksi internet terputus (data disimpan lokal).
- **Graceful CDN Degradation**: Apabila CDN Lucide Icons tidak terjangkau jaringan, sistem otomatis beralih ke inline embedded SVG package icons.

### 5.4 Aksesibilitas & Responsivitas (Usability & Responsiveness)
- Desain antarmuka fleksibel untuk desktop monitor kasir, tablet iPad/Android, hingga smartphone Android/iOS.
- Disediakan fitur **Mobile Simulator Mode** untuk pengujian langsung pengalaman pengguna pada rasio layar handphone.

---

## 6. Model Data & Skema Penyimpanan

### 6.1 Struktur Penyimpanan Web LocalStorage
| Key Storage | Tipe Data | Deskripsi |
|---|---|---|
| `transforma_umkm_session` | Encrypted Object | Token sesi aktif, payload user, dan waktu kedaluwarsa. |
| `transforma_umkm_users_db` | Array of Objects | Daftar akun pengguna terdaftar (`id, name, businessName, phone, email, password`). |
| `transforma_umkm_products` | Array of Objects | Katalog produk (`id, name, category, price, cost, stock, minStock, sku, desc`). |
| `transforma_umkm_transactions` | Array of Objects | Riwayat transaksi (`id, date, items, subtotal, discount, tax, total, payMethod`). |
| `transforma_umkm_customers` | Array of Objects | Direktori CRM (`id, name, phone, points, totalSpent, lastVisit, notes`). |
| `transforma_umkm_store_profile` | Object | Identitas toko (`name, phone, desc, address, receiptFooter`). |
| `transforma_umkm_pos_settings` | Object | Konfigurasi kasir (`taxRate, bankInfo, qrisHolder`). |
| `transforma_umkm_inv_settings` | Object | Aturan stok (`defaultMinStock`). |
| `transforma_umkm_app_version` | String | Penanda versi rilis (saat ini `"2.0"`) untuk auto-migration. |

### 6.2 Relasi Entitas (Kesiapan SQL Schema)
Disediakan berkas acuan `database/schema.sql` yang mendefinisikan 6 tabel relasional inti:
1. `users` (Manajemen Akun Toko)
2. `categories` (Kategori Produk)
3. `products` (Katalog Inventori)
4. `customers` (Direktori Pelanggan & Loyalitas)
5. `transactions` (Header Penjualan)
6. `transaction_items` (Rincian Item Penjualan dengan referensi foreign key ke `products`)

---

## 7. Metrik Keberhasilan (Success Metrics / KPI)

| Metrik | Baseline (Metode Konvensional) | Target TransformaUMKM |
|---|---|---|
| **Durasi Pencatatan Transaksi** | 45 – 90 detik per transaksi nota kertas | **< 15 detik** per transaksi via Smart POS |
| **Akurasi Perhitungan Laba Bersih** | Rekap manual akhir bulan (sering selisih) | **100% Real-time otomatis** per hari |
| **Insiden Stockout (Kehabisan Barang)** | Rata-rata 4-6 kejadian per bulan | **Turun hingga < 1 kejadian per bulan** berkat AI Restock PO |
| **Waktu Pembuatan Caption & Promo** | 30 – 60 menit per materi promo | **< 30 detik** melalui AI Promo Generator |
| **Kesiapan Audit Data Usaha** | Arsip nota rentan hilang/rusak | **1-Click JSON Backup** tersimpan aman |

---

## 8. Roadmap Pengembangan Selanjutnya (Future Roadmap)

- **Fase 1 (Saat Ini - v2.0)**: Standalone Single Page App, Offline-first LocalStorage, 5 Kelompok Pengaturan, AI Heuristic Engines, dan WhatsApp Automation.
- **Fase 2 (v2.5)**: Integrasi Web Bluetooth ESC/POS Thermal Receipt Printer untuk cetak fisik nota 58mm/80mm.
- **Fase 3 (v3.0)**: Sinkronisasi Cloud Multi-Cabang opsional melalui backend Node.js / PostgreSQL RESTful API dengan tetap mempertahankan mode offline fallback.

---
*Dokumen ini disusun untuk melengkapi laporan teknis, publikasi akademik, dan pengujian mutu perangkat lunak TransformaUMKM.*
