# Deploy DCelup Chicken (v2: Next.js + Postgres)

> Menggantikan versi static/nginx sebelumnya. Kalau butuh rollback ke v1, lihat bagian
> "Rollback ke v1" di bawah - image nginx statis lama sengaja tidak dihapus dari server.

## Topology

- Server: **server toko** (`fscomp-server`, `100.97.87.101`, Tailscale-reachable), akses SSH
  key `~/.ssh/fscomp_local_server`, user `faza`.
- Direktori deploy: `/home/faza/dcelup-app` (git clone repo ini, sama seperti v1).
- Cara deploy: **manual Docker Compose** (bukan Coolify) - `docker-compose.yml` menjalankan 2
  service: `dcelup-app` (Next.js) dan `dcelup-db` (`postgres:16-alpine`, volume
  `dcelup_pgdata`).
- Port: `dcelup-app` bind ke `127.0.0.1:${APP_PORT:-3011}:3000` - **port host sama dengan v1**,
  jadi Cloudflare Tunnel (`cloudflared.service`, ingress `dcelup.fscomp.id -> localhost:3011`)
  **tidak perlu diubah**.

## Environment (`.env` di server, tidak di-commit)

Salin dari `.env.example` lalu isi nilai sungguhan:

```env
POSTGRES_PASSWORD=<random, sama persis dengan password di DATABASE_URL>
DATABASE_URL=postgresql://dcelup:<password sama>@dcelup-db:5432/dcelup_chicken
SESSION_SECRET=<random minimal 32 karakter>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<ganti dari admin123>
TZ=Asia/Jakarta
NEXT_PUBLIC_APP_URL=https://dcelup.fscomp.id
APP_PORT=3011
```

`SESSION_SECRET` wajib diisi (>=16 karakter) saat `NODE_ENV=production` - server menolak
membuat/memverifikasi sesi kalau kosong. `ADMIN_USERNAME`/`ADMIN_PASSWORD` cuma dipakai untuk
membuat akun admin pertama kali (bootstrap) - setelah user itu ada di DB, ganti env ini tidak
berpengaruh lagi; ganti password lewat re-seed manual di database kalau perlu (belum ada UI ganti
password - catat sebagai keterbatasan, bukan untuk multi-admin).

## Deploy Awal / Redeploy

```bash
ssh -i ~/.ssh/fscomp_local_server faza@100.97.87.101
cd /home/faza/dcelup-app
git pull --ff-only origin main
docker compose build
docker compose up -d
docker compose ps                              # pastikan kedua service healthy
curl -s http://127.0.0.1:3011/api/health        # {"status":"ok","database":"connected"}
```

Image otomatis menjalankan `prisma db push` + seed menu (`prisma/seed.ts`) setiap start - aman
diulang (idempotent), volume `dcelup_pgdata` menyimpan data lintas redeploy.

## Rollback ke v1 (static)

Image nginx lama (`dcelup-chicken:latest`) tidak dihapus dari server. Kalau v2 bermasalah:

```bash
cd /home/faza/dcelup-app
docker compose down
docker run -d --name dcelup-chicken --restart unless-stopped -p 127.0.0.1:3011:80 dcelup-chicken:latest
```

Catatan: data yang sudah masuk ke Postgres (transaksi dsb setelah cutover ke v2) tidak ikut
kembali ke v1 (v1 cuma baca localStorage per device) - rollback ini untuk situasi darurat
("aplikasi harus tetap bisa dipakai kasir"), bukan untuk pindah data balik.

## Backup

Sudah masuk ke sistem backup harian generik server toko per 2026-09-11 (config
`/srv/fscomp/server-config/apps-backup.d/dcelup.conf`, engine `postgres-dump`, sama seperti
`nexabyte-invoice.conf`/`core-fscomp.conf`) - tidak perlu script/timer baru, cukup file config
ini karena `backup-apps-daily-all.sh` sudah loop semua `*.conf` otomatis.

- Jalan tiap hari jam 22:00 WIB (root crontab, sudah ada sebelumnya, tidak diubah).
- `pg_dump -Fc` dari container `dcelup-app-dcelup-db-1` + tar seluruh folder
  `/home/faza/dcelup-app` (termasuk `.env` produksi untuk kebutuhan redeploy/rollback).
- Upload otomatis ke `gdrive:FS-Server/apps-daily/dcelup/<tanggal>`, retensi 30 hari (lokal &
  Google Drive).
- **Sudah diuji manual end-to-end 2026-09-11**: dump terkonfirmasi valid
  (`PostgreSQL custom database dump - v1.15-0` via `file`), checksum SHA256 dibuat, dan file
  terkonfirmasi muncul di Google Drive lewat `rclone lsl`. Restore belum pernah dipraktikkan -
  kalau perlu, `pg_restore` dari file `.dump` ke container `dcelup-db` yang masih kosong/baru.

Detail infra backup lintas-app ada di
`D:\backup otmatis server\rencana-backup-otomatis-google-drive.md`.

## Health check

- Path: `/api/health`
- Expected: HTTP 200, `{"status":"ok","database":"connected"}`

## Pemeriksaan sebelum go-live

- Login admin (bootstrap dari `ADMIN_USERNAME`/`ADMIN_PASSWORD`), lalu login kasir.
- Buka shift (Kembalian Awal + Buka Jualan), simpan beberapa transaksi.
- Hapus salah satu transaksi, cek muncul di Jejak Hapus (login admin).
- Ubah modal salah satu menu, cek konsisten di device lain (polling ~5 detik).
- Cek pergantian tanggal WIB: `GET /api/shift?date=YYYY-MM-DD` untuk tanggal kemarin harus tetap
  mengembalikan data lama (bukan kosong/error).
- Export Backup (JSON) dari menu Admin - pastikan file berisi transaksi hari itu.
