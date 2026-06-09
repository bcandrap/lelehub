# LeleHub Farm — Website

Static multi-page website untuk LeleHub Farm. Tidak ada build step, tidak ada framework — murni HTML/CSS/JS. Bisa di-host di Netlify, Apache/LiteSpeed, atau static host mana pun.

**Live:** https://lelehub.netlify.app

---

## Struktur File

```
lelehub-deploy/
├── index.html              # Halaman utama
├── privacy.html            # Kebijakan privasi
├── terms.html              # Syarat & ketentuan
├── security.html           # Halaman keamanan
├── sitemap.xml             # Sitemap (domain: lelehub.netlify.app)
├── robots.txt              # Robots directive
├── netlify.toml            # Konfigurasi Netlify (headers + cache)
├── .htaccess               # Headers untuk Apache/LiteSpeed (diabaikan Netlify)
├── assets/
│   ├── css/styles.css      # Seluruh styling
│   ├── js/main.js          # Seluruh interaktivitas
│   └── img/                # Logo, hero, galeri, produk
├── api/health.php          # Health check (HANYA jalan di server PHP — tidak aktif di Netlify)
└── storage/                # Folder kosong (placeholder)
```

---

## Deploy ke Netlify (Rekomendasi)

### Cara 1 — Drag & Drop
1. Buka [app.netlify.com](https://app.netlify.com)
2. **Add new site → Deploy manually**
3. Drag seluruh folder `lelehub-deploy` ke drop zone
4. Selesai — Netlify membaca `netlify.toml` otomatis

### Cara 2 — Re-deploy ke site yang sudah ada
1. Buka site di Netlify → tab **Deploys**
2. Drag & drop folder ke area "Drag and drop your site output folder here"
3. Domain `lelehub.netlify.app` tetap dipakai

> **Jangan** buat site baru untuk update — drag ke site yang sudah ada agar domain tidak berubah.

---

## Deploy ke Apache / LiteSpeed (cPanel, dll)

1. Upload seluruh isi folder ke `public_html` atau root domain
2. Aktifkan SSL/HTTPS
3. Pastikan `.htaccess` aktif — file ini yang memuat security headers di server Apache
4. `api/health.php` akan berfungsi di sini (mengembalikan JSON status)

---

## Catatan Penting

| Hal | Keterangan |
|---|---|
| **`netlify.toml` vs `.htaccess`** | Netlify **mengabaikan** `.htaccess`. Semua security headers untuk Netlify ada di `netlify.toml`. Sebaliknya, server Apache mengabaikan `netlify.toml` dan memakai `.htaccess`. Keduanya disertakan agar portable. |
| **`api/health.php`** | PHP **tidak dieksekusi** di Netlify (static host). File ini hanya aktif di server PHP. Tidak dipanggil oleh frontend, jadi aman diabaikan di Netlify. |
| **Ganti domain** | Jika pindah domain, update `sitemap.xml` dan `robots.txt` (cari-ganti `lelehub.netlify.app`). |
| **Tanpa CDN eksternal** | Semua asset di-host lokal. CSP diset `default-src 'self'` — tidak ada script/style dari luar. |

---

## Security Headers Aktif

Diset via `netlify.toml` (Netlify) atau `.htaccess` (Apache):

- Content-Security-Policy (`default-src 'self'`)
- Strict-Transport-Security (HSTS)
- X-Frame-Options (`SAMEORIGIN`)
- X-Content-Type-Options (`nosniff`)
- Referrer-Policy (`strict-origin-when-cross-origin`)
- Permissions-Policy (geolocation/mic/camera/payment dimatikan)

---

## Cek Lokal

```bash
# Dari dalam folder lelehub-deploy
python3 -m http.server 8000
# Buka http://localhost:8000
```

> Catatan: security headers **tidak** aktif saat dibuka sebagai file lokal atau via `http.server` — hanya aktif di host yang mendukung `netlify.toml` / `.htaccess`.

---

## Edit Konten

| Mau ubah | Edit file |
|---|---|
| Teks, section, nomor WhatsApp, link sosmed | `index.html` |
| Warna, font, layout | `assets/css/styles.css` |
| Interaktivitas (galeri, scroll, dll) | `assets/js/main.js` |
| Gambar produk/galeri/logo | ganti file di `assets/img/` (pakai nama sama agar tidak perlu edit HTML) |
