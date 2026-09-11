# Deploy DCelup Chicken ke dcelup.fscomp.id

> **Catatan (2026-09-11)**: dokumen ini sebelumnya menyarankan Coolify, tapi deployment yang
> AKTUAL berjalan di server toko dilakukan manual lewat `docker build`/`docker run` + Cloudflare
> Tunnel (bukan Coolify). Detail lengkap dan langkah redeploy ada di `CLAUDE.md` di repo ini.
> Bagian "Deploy Lewat Coolify" di bawah masih didokumentasikan sebagai opsi alternatif kalau
> suatu saat app ini dipindah ke Coolify, tapi jangan jadikan acuan topology yang sedang jalan.

## Deploy Aktual: Manual Docker di Server Toko

- Server: `fscomp-server` (`100.97.87.101`, Tailscale), SSH key `~/.ssh/fscomp_local_server`, user `faza`
- Source di server: `/home/faza/dcelup-app` (git clone dari repo ini, branch `main`)
- Container: `dcelup-chicken`, port container `80` di-map ke `127.0.0.1:3011` di host
- Publik: Cloudflare Tunnel (`cloudflared.service`) meneruskan `dcelup.fscomp.id` -> `localhost:3011`

Redeploy setelah ada perubahan kode:

```bash
ssh -i ~/.ssh/fscomp_local_server faza@100.97.87.101
cd /home/faza/dcelup-app
git pull
docker build -t dcelup-chicken:latest .
docker stop dcelup-chicken && docker rm dcelup-chicken
docker run -d --name dcelup-chicken --restart unless-stopped -p 127.0.0.1:3011:80 dcelup-chicken:latest
```

## (Alternatif, belum dipakai) Deploy Lewat Coolify

## Yang Dibutuhkan

- Akses DNS `fscomp.id`
- Akses Coolify
- Repo GitHub baru khusus DCelup, misalnya `dcelup-chicken`
- Jangan pakai repo, database, env, atau app milik FS Comp Core

## DNS

Buat record:

```text
Type: A
Name: dcelup
Value: IP VPS/Coolify
```

Tunggu propagasi DNS. Biasanya beberapa menit, kadang lebih lama.

## Deploy Lewat Coolify

1. Buka Coolify.
2. Buat project baru: `DCelup Chicken`.
3. Tambah resource baru: `Application`.
4. Pilih source dari GitHub repo `dcelup-chicken`.
5. Pilih build pack: `Dockerfile`.
6. Pastikan domain:

```text
https://dcelup.fscomp.id
```

7. Exposed/internal port:

```text
80
```

8. Deploy.
9. Aktifkan SSL/HTTPS dari Coolify.

## Catatan Penting

Aplikasi ini static MVP dan masih menyimpan data di browser/localStorage per perangkat (sekarang
sudah ada arsip harian otomatis + tombol Export Backup JSON di menu Admin supaya data tidak hilang
begitu saja, tapi ini tetap bukan pengganti database). Untuk pemakaian operasional lintas HP/perangkat
dan uang nyata, tahap berikutnya wajib migrasi ke backend dengan autentikasi server-side dan database
(lihat roadmap di README.md) sebelum dipakai untuk transaksi sungguhan.
