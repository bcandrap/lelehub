# LeleHub Farm - Hosting Ready

## Cara cek lokal
1. Extract ZIP.
2. Buka `index.html` langsung di browser, atau jalankan:
   `python3 -m http.server 8000`
3. Buka `http://localhost:8000`.

## Cara hosting
1. Upload seluruh isi folder ini ke `public_html` atau root domain.
2. Aktifkan SSL/HTTPS di hosting.
3. Pastikan `.htaccess` aktif bila memakai Apache/LiteSpeed.
4. Ganti domain pada `sitemap.xml` dan `robots.txt` jika domain bukan `lelehub.farm`.
5. Ganti nomor WhatsApp dan link sosial media pada `index.html` jika akun final berbeda.

## Keamanan yang sudah disiapkan
- Tidak memakai CDN atau script eksternal.
- Content Security Policy.
- X-Frame-Options / frame protection.
- X-Content-Type-Options.
- Referrer Policy.
- HSTS aktif saat HTTPS.
- Directory listing dimatikan.

Catatan: security headers berjalan saat file di-host pada server yang mendukung `.htaccess`, bukan saat dibuka langsung sebagai file lokal.
