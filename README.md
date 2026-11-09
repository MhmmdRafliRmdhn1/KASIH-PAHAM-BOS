# TransformaUMKM

> **Platform Operasi Digital Terpadu untuk UMKM Indonesia**  
> Kasir POS · Inventori · Asisten Bisnis AI · CRM · Katalog Digital — dalam satu aplikasi web.

[![Platform](https://img.shields.io/badge/Platform-Web%20SPA-00D4FF)](#)
[![Tech](https://img.shields.io/badge/Stack-HTML%20%2F%20CSS%20%2F%20Vanilla%20JS-F7DF1E)](#)
[![License](https://img.shields.io/badge/License-MIT-10B981)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Production%20Ready-22c55e)](#)

---

## Tampilan Aplikasi

| Dashboard | Kasir POS | Asisten AI |
|-----------|-----------|------------|
| Monitoring omzet, laba, stok real-time | Transaksi cepat dengan filter kategori | Rekomendasi restock & caption promosi |

---

## Fitur Utama

| Modul | Deskripsi |
|-------|-----------|
| 📊 **Executive Dashboard** | KPI real-time: omzet harian, estimasi laba bersih, total transaksi, alert stok. Grafik tren 7 hari & donut chart kategori. |
| 🛒 **Kasir POS** | Transaksi cepat, filter kategori produk, diskon fleksibel, toggle PPN, QRIS canvas dinamis, struk digital via WhatsApp. |
| 📦 **Inventori & Stok** | CRUD produk, SKU otomatis, peringatan stok minimum, ikon produk otomatis dari Lucide Icons. |
| 🤖 **Asisten Bisnis AI** | Saran restock berbasis sales velocity, generator deskripsi produk, caption promosi WA/IG/TikTok, chat konsultan AI. |
| 👥 **CRM Pelanggan** | Database pelanggan, poin reward (1 pt / Rp 10.000), segmentasi VIP, template pesan WhatsApp. |
| 🏪 **Katalog Digital Publik** | Mini storefront publik dengan sinkronisasi stok real-time, order via WhatsApp. |
| ⚙️ **Pengaturan (5 Kelompok)** | Profil Toko, Kasir/Pembayaran, Inventori, Backup Data, Akun & Keamanan. |
| 🔐 **Auth Mandiri** | Registrasi & login dengan kredensial sendiri, enkripsi sesi XOR, auto-expiry token. |

---

## Cara Menjalankan

### Prasyarat

- **Node.js** versi 18 ke atas → [Download di nodejs.org](https://nodejs.org)
- **pnpm** (package manager) — lihat cara install di bawah

---

### 1. Install pnpm (Sekali Saja)

Buka **Terminal / PowerShell**, jalankan:

```powershell
npm install -g pnpm@9
```

> **Windows — pnpm tidak dikenali?**  
> Jalankan perintah ini di PowerShell untuk patch otomatis:
> ```powershell
> $f = "$env:APPDATA\npm\pnpm.ps1"
> $c = Get-Content $f -Raw
> $patched = $c -replace 'if \(Test-Path.*?\n.*?\n.*?\} else \{', '# patched'
> # Cara manual: edit file $f, ganti baris node dengan path absolut:
> # & "C:\Program Files\nodejs\node.exe" "$basedir/node_modules/pnpm/bin/pnpm.cjs" $args
> ```
> Atau ikuti langkah manual di bagian **Troubleshooting** bawah.

---

### 2. Clone / Download Proyek

```bash
# Clone via Git
git clone https://github.com/username/transforma-umkm.git
cd transforma-umkm

# Atau: ekstrak ZIP yang sudah didownload, lalu buka foldernya
```

---

### 3. Install Dependensi

```powershell
cd C:\Users\NamaAnda\Downloads\KASIH-PAHAM-BOS

pnpm install
```

---

### 4. Jalankan Dev Server

```powershell
pnpm run dev
```

Aplikasi akan berjalan di: **http://127.0.0.1:8080**

Buka browser dan akses URL tersebut.

---

### Alternatif: Tanpa pnpm (Python)

Jika tidak ingin install Node.js/pnpm, gunakan Python:

```bash
# Python 3
python -m http.server 8080

# Buka browser: http://localhost:8080
```

---

### Alternatif: Buka File Langsung

Klik ganda `index.html` untuk membuka langsung di browser.  
> ⚠️ Beberapa fitur (CDN icon, font) membutuhkan koneksi internet.

---

## Alur Pertama Kali Pakai

```
1. Buka http://127.0.0.1:8080
         ↓
2. Halaman Login → klik "Daftar Sekarang"
         ↓
3. Isi form registrasi:
   - Nama pemilik
   - Nama usaha / toko
   - No. WhatsApp
   - Email
   - Kata sandi (min. 6 karakter)
         ↓
4. Login dengan email & kata sandi yang baru didaftarkan
         ↓
5. Dashboard kosong siap digunakan!
   → Tambah produk di menu Inventori
   → Lakukan transaksi di menu Kasir
   → Pantau performa di Dashboard
```

---

## Pengaturan Aplikasi

Buka sidebar → klik **Pengaturan** untuk mengakses 5 kelompok konfigurasi:

| Kelompok | Isi |
|----------|-----|
| **1. Profil Toko** | Nama toko, nomor WA, deskripsi, alamat, footer struk |
| **2. Kasir & Pembayaran** | Tarif PPN (%), info rekening bank, nama pemegang QRIS |
| **3. Aturan Inventori** | Stok minimum default untuk peringatan restock |
| **4. Backup & Restore Data** | Export data ke file JSON, import dari backup, kosongkan semua data |
| **5. Akun & Keamanan** | Ganti kata sandi (verifikasi password lama dulu) |

---

## Struktur Proyek

```
KASIH-PAHAM-BOS/
├── index.html              # Aplikasi utama (SPA — semua modul terintegrasi)
├── style.css               # Design system lengkap (CSS Variables, komponen)
├── package.json            # Konfigurasi proyek & script dev server
├── pnpm-lock.yaml          # Lock file dependensi pnpm
├── vercel.json             # Konfigurasi deploy ke Vercel
├── favicon.ico             # Favicon aplikasi
├── assets/
│   ├── logo.svg            # Logo TransformaUMKM
│   ├── teks-logo.svg       # Versi teks logo
│   ├── favicon.png         # Favicon PNG
│   └── icons/              # Icon SVG produk (Lucide Icons, offline fallback)
├── database/
│   ├── schema.sql          # Skema database relasional (siap migrasi ke PostgreSQL)
│   └── transforma.db       # SQLite database (referensi struktur)
├── docs/
│   └── PROPOSAL_UX_CASE_STUDY.md
└── LICENSE                 # Lisensi MIT
```

> **Catatan**: File `script.js`, `api.js`, `server.js`, dll. adalah file referensi legacy.  
> Semua logika aktif ada di dalam `index.html` sebagai embedded scripts.

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| **Frontend** | HTML5 Semantik, Vanilla JavaScript (ES6+) |
| **Styling** | Vanilla CSS3, CSS Custom Properties (Design Tokens) |
| **Charts** | HTML5 Canvas 2D (tanpa library eksternal) |
| **Storage** | localStorage (offline-first, JSON serialization) |
| **Icons** | Lucide Icons via jsDelivr CDN + cache localStorage |
| **Fonts** | Plus Jakarta Sans, Inter, JetBrains Mono (Google Fonts) |
| **Dev Server** | live-server (via pnpm) |
| **Auth** | Client-side XOR session encryption + auto token expiry |

---

## Deploy ke Hosting Publik

### Vercel (Gratis, Tercepat)

```bash
npm i -g vercel
cd KASIH-PAHAM-BOS
vercel --prod
```

### Netlify

Drag & drop folder `KASIH-PAHAM-BOS` ke [app.netlify.com/drop](https://app.netlify.com/drop)

### GitHub Pages

1. Push ke GitHub repository
2. Settings → Pages → pilih branch `main` → Save
3. Akses di `https://username.github.io/nama-repo`

---

## Troubleshooting

### `pnpm` tidak dikenali di PowerShell

**Penyebab**: Node.js tidak ada di PATH yang digunakan pnpm.ps1.

**Solusi**:

1. Buka file: `C:\Users\NamaAnda\AppData\Roaming\npm\pnpm.ps1`
2. Edit dengan Notepad, ubah isinya menjadi:

```powershell
#!/usr/bin/env pwsh
$basedir=Split-Path $MyInvocation.MyCommand.Definition -Parent
$nodeExe = "C:\Program Files\nodejs\node.exe"
if (Test-Path "$basedir/node.exe") { $nodeExe = "$basedir/node.exe" }
if ($MyInvocation.ExpectingInput) {
  $input | & "$nodeExe" "$basedir/node_modules/pnpm/bin/pnpm.cjs" $args
} else {
  & "$nodeExe" "$basedir/node_modules/pnpm/bin/pnpm.cjs" $args
}
exit $LASTEXITCODE
```

3. Simpan → buka terminal baru → coba `pnpm --version`

---

### Data lama / demo masih muncul setelah update

Aplikasi otomatis membersihkan data lama saat versi berubah. Jika masih muncul:

1. Buka browser → `F12` → tab **Application**
2. Kiri: **Local Storage** → `http://127.0.0.1:8080`
3. Klik kanan → **Clear All** → refresh halaman

---

### Port 8080 sudah dipakai

```powershell
# Cek proses yang pakai port 8080
netstat -ano | findstr :8080

# Kill proses (ganti PID dengan angka dari hasil di atas)
taskkill /PID 12345 /F

# Lalu jalankan ulang
pnpm run dev
```

---

### Lupa kata sandi

Karena sistem berbasis localStorage (tidak ada backend), reset manual:

1. Buka DevTools → Application → Local Storage
2. Hapus key `transforma_umkm_users_db`
3. Refresh → daftar akun baru

---

## Lisensi

Proyek ini menggunakan lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan.  
Lihat file [LICENSE](LICENSE) untuk detail lengkap.

---

<p align="center">
  Dibuat dengan ❤️ untuk UMKM Indonesia &nbsp;•&nbsp; TransformaUMKM 2026
</p>
