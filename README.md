# DCelup Chicken Crispy

Aplikasi kasir mobile-first untuk DCelup Chicken Crispy. **Versi 2**: Next.js (App Router) +
PostgreSQL via Prisma - auth & data sungguhan di server, bukan lagi static HTML/localStorage.

Versi static/localStorage (v1) masih ada di git history (`git log -- app.js` sebelum commit
migrasi ini) kalau perlu dibandingkan.

## Login

- Admin: username + password, tersimpan ter-hash (`scrypt`) di database. Kredensial pertama
  diambil dari env `ADMIN_USERNAME`/`ADMIN_PASSWORD` saat login pertama kali (lihat `DEPLOY.md`),
  setelah itu env tidak dipakai lagi untuk akun itu.
- Kasir: langsung masuk tanpa akun khusus (sesi tetap ada, cuma tanpa password) - sesuai desain
  awal.

## Fitur

Sama seperti v1, sekarang sungguhan tersimpan di database & sinkron antar device (polling tiap
~5 detik):

- Kasir input jualan tanpa ketik angka, tidak melihat profit, bisa melihat sisa uang yang harus
  ada.
- Kasir input gaji harian yang diambil pakai tombol nominal.
- Kasir bisa hapus transaksi (dengan konfirmasi), jejak hapus terlihat admin.
- Admin input kembalian awal & uang setor fisik pakai tombol nominal.
- Report harian ayam sisa/diambil pakai plus/minus, bisa direset (dengan konfirmasi + tercatat).
- Modal per menu bisa diubah admin pakai tombol plus/minus - **dicek di server**, bukan cuma
  disembunyikan di UI, jadi tidak bisa dilewati lewat console browser seperti di v1.
- Export backup JSON per hari (`Admin -> Export Backup`).
- Riwayat hari-hari sebelumnya (tiap tanggal WIB otomatis punya baris tersendiri di database -
  tidak perlu tombol "arsip manual", dan datanya permanen).

Rumus profit/kas sama seperti sebelumnya, lihat `lib/calc.ts`.

## Menu Awal

Lihat `lib/menu.ts` (`MENU`, `GROUPS`) - modal (`cost`) awal di-seed ke tabel `MenuItem` saat
container pertama kali jalan (`prisma/seed.ts`), setelah itu perubahan modal lewat aplikasi
tersimpan di database dan seed tidak menimpanya lagi.

## Jalan Lokal

Butuh Node.js 22+ dan PostgreSQL (lokal atau lewat `docker compose up dcelup-db`).

```bash
npm install
cp .env.example .env   # isi DATABASE_URL, SESSION_SECRET, dst
npx prisma db push
npm run db:seed
npm run dev
```

Buka `http://localhost:3000`.

## Deploy Production

Lihat `DEPLOY.md` - manual Docker Compose di server toko (`fscomp-server`), bukan Coolify.
