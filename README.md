# DCelup Chicken Crispy

MVP kasir mobile-first untuk DCelup Chicken Crispy.

## Login Demo

- Admin: `admin` / `admin123`
- Kasir: langsung masuk tanpa akun khusus

Admin perlu mengetik username dan password. Saat dibuat versi server, password admin wajib di-hash.

## Fitur

- UI HP sederhana, dominan tombol sentuh.
- Kasir input jualan tanpa ketik angka.
- Kasir tidak melihat profit.
- Kasir bisa melihat sisa uang yang harus ada.
- Kasir input gaji harian yang diambil pakai tombol nominal.
- Kasir bisa hapus transaksi, tapi jejak hapus terlihat oleh admin.
- Admin input kembalian awal pakai tombol nominal.
- Uang setor fisik pakai tombol nominal.
- Report harian ayam sisa dan ayam diambil pakai plus/minus.
- Modal per menu bisa diubah admin pakai tombol plus/minus.
- Profit bersih otomatis:

```text
profit_bersih = total_penjualan - modal_terjual - 20000_ibu - 10000_listrik - gaji_harian_diambil
```

- Sisa uang yang harus ada:

```text
sisa_uang_harus_ada = kembalian_awal + total_penjualan_app - gaji_harian_diambil
```

- Selisih setor otomatis:

```text
selisih = uang_setor_fisik - sisa_uang_harus_ada
```

## Menu Awal

- Ayam Original: dada/paha Rp10.000, sayap Rp9.000
- Ayam Celup: dada/paha Rp13.000, sayap Rp12.000
- Ayam Original + Nasi: dada/paha Rp14.000, sayap Rp13.000
- Ayam Celup + Nasi: semua Rp16.000
- Risol Mayo satuan: Rp3.500
- Risol Mayo paket isi 3: Rp10.000

## Cara Jalan Lokal

Karena masih statis, bisa langsung buka:

```text
index.html
```

Atau pakai server statis apa saja:

```bash
python -m http.server 3001
```

Lalu buka:

```text
http://localhost:3001
```

## Catatan Deployment Coolify

Pisahkan total dari FS Comp Core.

Rekomendasi:

- Project Coolify: `DCelup Chicken`
- App: `dcelup-chicken`
- Domain: `dcelup.fscomp.id`
- Port external/manual: `3001`
- Database versi server nanti: PostgreSQL baru, misalnya `dcelup_chicken`
- Jangan memakai env/database milik `core.fscomp.id`

Contoh env versi server:

```env
APP_NAME=dcelup-chicken
NEXT_PUBLIC_APP_URL=https://dcelup.fscomp.id
DATABASE_URL=postgresql://dcelup_user:password@dcelup-db:5432/dcelup_chicken
AUTH_SECRET=ganti-dengan-secret-baru
PORT=3001
```

## Rencana Versi Server

Tahap berikutnya kalau MVP UI sudah cocok:

1. Migrasi ke Next.js + TypeScript.
2. Tambah PostgreSQL + Prisma.
3. Simpan transaksi/report ke database.
4. Login beneran dengan password hash.
5. Export laporan harian.
6. Backup database otomatis.
