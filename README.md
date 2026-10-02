# KasirMart — Aplikasi Kasir Minimarket (Next.js)

Aplikasi kasir sederhana bertema minimarket (seperti Indomaret) dengan 2 role:
- **Admin**: kelola produk & stok, lihat laporan penjualan + grafik dashboard.
- **Kasir**: input transaksi penjualan (POS) dan cetak struk.

Dibangun dengan **Next.js 14 (App Router)**, **Prisma ORM**, **MySQL**, **NextAuth.js**, dan **Tailwind CSS**.

## 1. Persyaratan

- Node.js 18+ (cek dengan `node -v`)
- MySQL server aktif (misal via XAMPP/Laragon), dan **HeidiSQL** untuk melihat/mengelola datanya

## 2. Setup Database dengan HeidiSQL

1. Pastikan MySQL server (XAMPP/Laragon/MySQL Server) sudah berjalan.
2. Buka HeidiSQL, buat koneksi baru ke `localhost` port `3306` dengan user/password MySQL kamu.
3. Buat database baru, contoh nama: `kasir_minimarket`.
   - Bisa lewat HeidiSQL: klik kanan pada koneksi → **Create new** → **Database** → beri nama `kasir_minimarket`.
   - Tabel-tabelnya TIDAK perlu dibuat manual — nanti otomatis dibuat oleh Prisma di langkah 4.

## 3. Konfigurasi Project

1. Extract/pindahkan folder project ini, lalu buka terminal di dalamnya.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Salin file environment:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env`, sesuaikan `DATABASE_URL` dengan user/password MySQL kamu, contoh:
   ```
   DATABASE_URL="mysql://root:password_kamu@localhost:3306/kasir_minimarket"
   ```
   Ganti juga `NEXTAUTH_SECRET` dengan string acak (boleh generate di https://generate-secret.vercel.app/32 atau ketik bebas yang panjang).

## 4. Migrasi & Seed Data

Jalankan perintah berikut untuk membuat tabel di database dan mengisi data awal (akun login + contoh produk):

```bash
npx prisma migrate dev --name init
npm run seed
```

Setelah ini, buka HeidiSQL dan refresh — tabel `User`, `Product`, `Category`, `Transaction`, dll akan muncul otomatis beserta datanya.

Akun default hasil seed:
| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | admin    | admin123  |
| Kasir | kasir    | kasir123  |

## 5. Menjalankan Aplikasi

```bash
npm run dev
```

Buka `http://localhost:3000` di browser, lalu login sesuai role.

## 6. Struktur Fitur

- `/login` — halaman login
- `/admin` — dashboard admin (ringkasan pendapatan, grafik penjualan 7 hari, stok menipis)
- `/admin/products` — CRUD produk & stok
- `/admin/reports` — riwayat transaksi + filter tanggal + export CSV
- `/kasir` — halaman kasir (POS): cari produk, keranjang, checkout, cetak struk

## 7. Struktur Folder Penting

```
app/
  api/            -> semua API route (products, categories, transactions, auth, reports)
  admin/          -> halaman-halaman untuk role admin
  kasir/          -> halaman POS untuk role kasir
  login/          -> halaman login
components/       -> komponen UI (sidebar, navbar, modal, chart, struk)
lib/              -> konfigurasi Prisma, NextAuth, helper format Rupiah
prisma/
  schema.prisma   -> struktur tabel database
  seed.ts         -> data awal (akun & produk contoh)
```

## 8. Catatan untuk Tugas / Laporan

- Autentikasi & otorisasi role menggunakan **NextAuth.js (Credentials Provider)** + **middleware.ts** untuk membatasi akses `/admin` hanya untuk role ADMIN.
- Password disimpan ter-enkripsi dengan **bcryptjs**, tidak plain text.
- Stok otomatis berkurang saat transaksi kasir berhasil (menggunakan **Prisma transaction** agar aman/atomic).
- Grafik dashboard memakai **Recharts**.

Selamat mengerjakan tugasnya! 🛒
