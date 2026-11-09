# Road To Halal — Aplikasi Persiapan Pernikahan (PWA)

**Road To Halal** adalah aplikasi mobile-first Progressive Web App (PWA) Islami yang mendampingi calon pengantin dari tahap persetujuan ta’aruf sampai hari akad dan walimah.

Dibangun dengan **Next.js 14 (App Router) + TypeScript + Tailwind CSS**, aplikasi ini menggunakan navigasi peta rute vertikal berkelok (*Vertical S-Curve Route Map*) dengan alur 8 tahap berurutan dan penyimpanan JSON modular per workspace (tanpa SQL).

---

## 🌟 Fitur Utama (Sesuai PRD v1.1)

1. **Peta Rute Vertikal Berkelok (*Route Map*):**
   - Navigasi utama berbentuk peta jalur vertikal dari **MULAI** (bawah) menuju **HALAL** (puncak).
   - Tanpa *bottom navigation* konvensional untuk pengalaman perjalanan yang terarah dan fokus.

2. **Alur 8 Tahap Berurutan (*Stage Locking*):**
   - **Tahap 1:** Persetujuan Ta’aruf (Biodata, Kesehatan, Nadzor & Istikharah, Keputusan)
   - **Tahap 2:** Proses Ta’aruf (57 Kartu Tanya Jawab Pranikah — Lampiran A PRD)
   - **Tahap 3:** Kesepakatan Khitbah (Tinjauan Kesepakatan, Restu Keluarga, Acara)
   - **Tahap 4:** Proses Khitbah (Tracker 22 Seserahan, Rundown Otomatis, Biaya Khitbah, Tanggal Akad)
   - **Tahap 5:** Kesepakatan Akad & Anggaran
   - **Tahap 6:** Administrasi & Berkas KUA
   - **Tahap 7:** Persiapan Walimah (Vendor, Tamu, Panitia)
   - **Tahap 8:** Hari-H (Checklist H-1, Rundown Ijab Kabul & Resepsi)
   - **Puncak:** Layar Pencapaian HALAL

3. **Multi-Role & Workspace Access Control:**
   - Hak akses dinamis *Owner*, *Full Access*, dan *Read-Only* (evaluasi per-request di server).
   - Proteksi API server-side (`403 STAGE_LOCKED`, `403 READ_ONLY`, `403 ROUTE_HALTED`).

4. **Desain Modern Strawberry Gelato Rose & Pastel:**
   - **Strawberry Rose** (`#F0567C` & `#E03E67`): Tombol aksi utama, active badge glow, garis rute aktif.
   - **Creamy Soft Blush** (`#FFF1F4` & `#FAF7F8`): Latar belakang lembut yang nyaman.
   - **Airy Sky Blue** (`#E0F2FE` & `#BAE6FD`): Indikator tahapan selesai.
   - **Deep Crisp Slate** (`#1E293B`): Tipografi tajam dan elegan.

5. **Penyimpanan Data Aman Tanpa Database SQL (PRD 6.2):**
   - Penyimpanan berbasis JSON terisolasi per workspace (`roadtohalal-data/workspaces/{workspaceId}/`).
   - Penulisan atomic write dengan berkas `.bak` dan file locking (`proper-lockfile`).
   - Di luar direktori web publik untuk keamanan maksimal.

---

## 🌿 Struktur Branch Git

Repositori ini dikelola dengan 2 branch utama:
* **`main`**: Berisi seluruh source code aplikasi lengkap, komponen, dokumentasi, skrip pengujian, dan konfigurasi pengembangan lokal.
* **`cpanel`**: Branch khusus deployment hosting cPanel (berisi konfigurasi server, panduan deploy, dan berkas siap produksi untuk CloudLinux / Phusion Passenger).

---

## 🚀 Menjalankan di Komputer Lokal

1. **Instal Dependensi:**
   ```bash
   npm install
   ```

2. **Salin Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```

3. **Jalankan Mode Pengembangan:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000) di browser.

4. **Jalankan Pengujian Otomatis:**
   ```bash
   node scripts/test-fase2.js
   ```

---

## 🌐 Panduan Deployment cPanel Hosting

Lihat panduan lengkap pada [DEPLOY_CPANEL.md](./DEPLOY_CPANEL.md) untuk langkah-langkah *Setup Node.js App* (Phusion Passenger) di hosting cPanel.

---

## 📄 Lisensi
Hak Cipta © 2026 Road To Halal. Semua Hak Dilindungi.
