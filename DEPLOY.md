# Deploy DCelup Chicken ke dcelup.fscomp.id

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

Aplikasi ini static MVP dan masih menyimpan data di browser/localStorage. Untuk pemakaian operasional lintas HP/perangkat, tahap berikutnya perlu database agar data kasir dan admin sinkron.
