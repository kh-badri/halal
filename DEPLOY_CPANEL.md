# Panduan Deploy Road To Halal di cPanel Hosting (Node.js Passenger)

Dokumen ini adalah panduan resmi langkah-demi-langkah untuk melakukan deployment aplikasi **Road To Halal: Aplikasi Persiapan Pernikahan (PWA)** pada hosting cPanel menggunakan fitur **Setup Node.js App** (CloudLinux / Phusion Passenger) dan **Git Version Control**.

---

## 1. Persiapan Awal di cPanel

1. Masuk ke cPanel hosting Anda.
2. Pastikan menu **"Setup Node.js App"** tersedia di bagian *Software*.
3. Buka **SSL/TLS Status** dan pastikan domain/subdomain Anda sudah aktif **AutoSSL** (HTTPS wajib untuk PWA dan cookie Secure).
4. Di menu **Domains**, aktifkan opsi **"Force HTTPS Redirect"**.

---

## 2. Struktur Direktori yang Direkomendasikan di Server

Sesuai prinsip keamanan PRD Bagian 6.2, seluruh data JSON dan berkas unggahan pengguna diletakkan **di luar `public_html`** agar tidak dapat diakses langsung oleh publik:

```
/home/username/
├── apps/
│   └── halal/                 <-- Clone branch "cpanel" dari GitHub
│       ├── .next/
│       ├── public/
│       ├── scripts/
│       │   └── backup.js
│       ├── server.js
│       ├── package.json
│       └── .env.production
├── roadtohalal-data/          <-- DATA_DIR (di luar public_html, chmod 700)
│   ├── index/
│   ├── workspaces/
│   ├── users/
│   ├── uploads/
│   └── backups/
└── public_html/               <-- Website reguler / dialihkan ke Node App
```

---

## 3. Clone Repository Git di cPanel

Anda dapat melakukan clone langsung branch `cpanel` melalui **Terminal cPanel** (SSH) atau fitur **Git Version Control** di cPanel:

### Opsi A: Melalui Terminal cPanel (Disarankan)
1. Buka menu **Terminal** di cPanel.
2. Buat folder apps dan lakukan clone branch `cpanel`:
   ```bash
   mkdir -p ~/apps
   cd ~/apps
   git clone -b cpanel https://github.com/kh-badri/halal.git halal
   cd ~/apps/halal
   ```

### Opsi B: Melalui Menu "Git Version Control" cPanel
1. Buka menu **Git Version Control** di cPanel.
2. Klik tombol **Create**:
   - **Clone URL:** `https://github.com/kh-badri/halal.git`
   - **Repository Path:** `apps/halal`
   - **Repository Name:** `halal`
3. Setelah repository ter-clone, checkout ke branch `cpanel`.

---

## 4. Konfigurasi "Setup Node.js App" di cPanel

1. Buka menu **Setup Node.js App** di cPanel.
2. Klik tombol **Create Application**:
   - **Node.js version:** Pilih **20.x** LTS (atau minimal 18.x).
   - **Application mode:** Pilih **Production**.
   - **Application root:** `apps/halal`
   - **Application URL:** Pilih domain atau subdomain Anda (misal `halal.domainanda.com`).
   - **Application startup file:** `server.js`
3. Masukkan **Environment Variables (ENV)** di bagian bawah formulir:
   - `SESSION_SECRET`: Masukkan kode rahasia acak minimal 32 karakter (contoh: `kunci_jwt_super_aman_roadtohalal_2026_xyz`).
   - `DATA_DIR`: `/home/username/roadtohalal-data` (ganti `username` dengan username cPanel Anda).
   - `ADMIN_EMAIL`: `admin@roadtohalal.id` (email akun super admin Anda).
   - `APP_URL`: `https://halal.domainanda.com`
   - `NODE_ENV`: `production`
   - *(Opsional untuk pengiriman email & reset password):*
     - `SMTP_HOST`: `mail.domainanda.com`
     - `SMTP_PORT`: `587`
     - `SMTP_USER`: `noreply@domainanda.com`
     - `SMTP_PASS`: `PasswordEmailAnda`
     - `SMTP_FROM`: `Road To Halal <noreply@domainanda.com>`
4. Klik **Create** lalu klik **Run / Restart Application**.
5. *(Catatan: Branch `cpanel` ini sudah berstatus Standalone Pre-Built, sehingga Anda **TIDAK PERLU** menjalankan `npm install` maupun `npm run build` di terminal cPanel. Aplikasi langsung siap jalan!)*

---

## 5. Pengaturan Izin Folder Data (`DATA_DIR`)

Buka Terminal cPanel atau File Manager, dan pastikan folder data dibuat di luar `public_html` dengan hak akses aman (chmod 700):
```bash
mkdir -p /home/username/roadtohalal-data
chmod 700 /home/username/roadtohalal-data
```

---

## 6. Pengaturan Cron Job Harian untuk Backup Otomatis

Untuk menjaga jaminan **0 Insiden Kehilangan Data**, jadwalkan backup otomatis setiap dini hari:

1. Buka menu **Cron Jobs** di cPanel.
2. Pilih pengaturan waktu **Once Per Day (Setiap Hari jam 03:00 Subuh)**:
   - Menit: `0`
   - Jam: `3`
   - Hari: `*`
   - Bulan: `*`
   - Hari dalam seminggu: `*`
3. Isi kolom **Command**:
   ```bash
   /usr/local/bin/node /home/username/apps/halal/scripts/backup.js >> /home/username/halal-backup.log 2>&1
   ```
   *(Catatan: Sesuaikan path binary node jika versi node Anda berada di `/opt/cpanel/ea-nodejs20/bin/node` atau path CloudLinux nodevenv).*
4. Klik **Add New Cron Job**.
5. Skrip otomatis menyimpan snapshot ZIP harian ke `/home/username/roadtohalal-data/backups/` dan otomatis merotasi arsip yang lebih tua dari **14 hari**.

---

## 7. Cara Melakukan Update Aplikasi di Masa Mendatang

Jika ada pembaruan kode aplikasi di GitHub:
1. Masuk ke Terminal cPanel:
   ```bash
   cd ~/apps/halal
   git pull origin cpanel
   ```
2. Buka menu **Setup Node.js App** di cPanel, lalu klik tombol **Restart**.
3. **Data pengguna tidak akan hilang** karena seluruh data JSON dan file unggahan tersimpan terpisah di direktori `/home/username/roadtohalal-data`.
