# TransformaUMKM — versi Tugas 9

Versi ini mempertahankan antarmuka aplikasi asal dan menambahkan integrasi backend untuk Produk, Pelanggan, serta Transaksi. Backend menggunakan modul HTTP bawaan Node.js; versi ini **tidak memakai Express atau SQLite**. Sesuaikan penyebutan Express pada laporan jika menggunakan paket ini.

## Menjalankan

1. Instal Node.js 22 atau versi LTS lebih baru.
2. Ekstrak paket ZIP, buka terminal pada folder yang berisi `package.json`.
3. Jalankan `npm start`.
4. Buka `http://localhost:3001`, daftar akun demo melalui halaman registrasi, kemudian login.
5. Tambahkan produk pada Inventori dan pelanggan pada CRM.
6. Gunakan kasir atau tombol **Kelola transaksi** di kiri bawah untuk membuat, melihat, mengubah, dan menghapus draft transaksi serta membayar tunai.

Tidak perlu instal dependensi untuk menjalankan backend. Jangan membuka `index.html` langsung atau menggunakan live-server: frontend membutuhkan API pada origin yang sama.

## Ketentuan tugas yang diterapkan

- Frontend HTML/CSS/JavaScript terhubung ke `/api/*`.
- Tiga entitas: Produk, Pelanggan, Transaksi. Kategori dan supplier merupakan atribut produk, bukan entitas mandiri.
- CRUD produk melalui Inventori; CRUD pelanggan melalui CRM (tombol Edit/Hapus ditambahkan).
- CRUD transaksi melalui **Kelola transaksi**. Draft dapat diedit/dihapus; transaksi selesai dipertahankan untuk riwayat. Produk/pelanggan yang sudah direferensikan transaksi tidak dapat dihapus.
- Checkout memakai Produk, Pelanggan, Transaksi; harga dihitung server, stok diperiksa dan dikurangi sekali, poin pelanggan diperbarui.
- Seluruh data bisnis hardcoded sebagai objek/array kosong di memori (`backend/server.js`), tanpa database dan tanpa penulisan file. Perubahan hilang ketika proses server restart.
- Satu proses backend; jangan memakai cluster/multi-worker karena memori tidak dibagikan. Horizontal scaling dalam laporan tetap berupa pembahasan konseptual.
- Pengaturan tampilan dan login demo lama masih menggunakan penyimpanan browser. Login ini belum merupakan autentikasi API/server atau isolasi toko. Semua pengguna demo berbagi data bisnis satu server; gunakan data simulasi, bukan data nyata.
- Import/reset data lokal dinonaktifkan pada versi ini; gunakan CRUD di server. Export tetap merupakan snapshot.
- Pembayaran QRIS/transfer pada tampilan lama hanyalah pencatatan/simulasi, bukan integrasi payment gateway.

## Pengujian

`npm test` menjalankan tes API dengan server sementara: CRUD, perhitungan harga, saldo stok/poin, checkout ganda, stok kurang, aturan referensi, serta penolakan akses file backend/database/.git. Pemeriksaan sintaks frontend dan simulasi DOM (jsdom) juga dilakukan: formulir produk/pelanggan mencapai API, tombol CRUD muncul, checkout memperbarui stok/poin, draft berhasil dibuat melalui antarmuka, dan data bisnis tidak ditulis ke localStorage. Pengujian browser sungguhan belum dilakukan.

## Deploy IDCloudHost

1. Buat VPS Ubuntu, instal Node.js LTS dan Nginx. Periksa `node --version` dan `command -v node`.
2. Unggah isi paket ke `/var/www/transforma`.
3. Jalankan `npm test`, lalu `npm start` untuk tes awal. Backend mendengarkan `127.0.0.1:3001`.
4. Buat akun layanan Linux `transforma`, beri izin baca/akses direktori aplikasi. Buat layanan systemd seperti contoh di `deploy/transforma.service`; sesuaikan path executable Node. Aktifkan dengan `sudo systemctl daemon-reload` dan `sudo systemctl enable --now transforma`.
5. Pasang konfigurasi `deploy/nginx.conf` di `/etc/nginx/sites-available/transforma`, ganti `IP_ATAU_DOMAIN`. Aktifkan symlink ke `sites-enabled`, jalankan `sudo nginx -t` dan `sudo systemctl reload nginx`.
6. Konfigurasi contoh membatasi akses web ke IP laptop/penguji. Ganti `IP_LAPTOP_PENGUJI` dengan IP publik laptop dan tambahkan IP dosen bila dibutuhkan. Ini diperlukan karena autentikasi API produksi belum ditambahkan. Untuk demo melalui jaringan umum, gunakan HTTPS dan perlindungan akses yang sesuai sebelum membuka akses lebih luas.
7. Izinkan SSH dan HTTP/HTTPS di firewall. Port 3001 tidak dibuka ke internet.
8. Buka `http://IP_ATAU_DOMAIN` dari IP yang diizinkan. Tambahkan domain/HTTPS jika tersedia, lalu uji ulang fitur. Paket ini belum diunggah atau dideploy ke akun IDCloudHost pengguna.

## API

- `GET /api/health`, `GET /api/state`
- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/:id`
- `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/:id`
- `GET/POST /api/transactions`, `GET/PUT/DELETE /api/transactions/:id`
- `POST /api/transactions/:id/checkout`

Berkas utama yang diubah: `backend/server.js`, `index.html`, `package.json`; berkas baru `course-api.js`, `backend/server.test.js`, dan `deploy/`. File SQLite lama sengaja tidak disertakan dalam paket. File JS legacy lain tetap disertakan sebagai bagian aplikasi asal, tetapi alur aktif menggunakan embedded script dalam `index.html` dan override API di `course-api.js`.
