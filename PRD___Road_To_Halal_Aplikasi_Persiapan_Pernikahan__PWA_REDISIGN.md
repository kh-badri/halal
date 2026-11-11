# PRD — Road To Halal: Aplikasi Persiapan Pernikahan (PWA)

*Versi 1.2 · 11 November 2026 · Status: Draft siap review · Revisi UI/UX dari v1.1: fitur dan fungsi tidak berubah*

## Catatan Revisi

### v1.1 → v1.2 (khusus tampilan; fitur dan fungsi tidak berubah)

| Area | v1.1 | v1.2 |
| --- | --- | --- |
| **Warna** | Pink muda, biru muda, putih (+ ink) | **Biru Muda (Sky) sebagai warna merek**, dipadu putih/Mist, Azure untuk aksi, Navy untuk teks, aksen Peach, serta Mint dan Coral khusus status |
| **Tipografi** | Plus Jakarta Sans | Plus Jakarta Sans (judul) + Inter (isi, kolom, angka) dengan skala tipe khusus mobile |
| **Animasi** | Micro-interaction secukupnya | Sistem motion lengkap: splash, loading, transisi halaman, sheet, rute, dan perayaan, plus mode ringan dan reduced motion |
| **Teks dan kolom** | Pola dasar | Pola form, baris-kartu pengganti tabel, accordion untuk form panjang, dan panduan UX writing |
| **Perangkat** | Layar 360–430 px | iOS dan Android dari 320 px, safe area, keyboard, foldable, dan skala teks 200% |
| **Ikon aplikasi** | Logo (latar belum ditetapkan) | **Logo tetap sama**, latar diganti Biru Muda `#9FD3FF` |
| **Halaman** | Spesifikasi di tiap modul | Tampilan dan animasi untuk **semua halaman** dirangkum di 8.9 |
| **Fitur dan fungsi** | n/a | **Tidak ada perubahan** (bagian 4, 5, 7, 9, 10, 11, 12 tetap) |

### v1.0 → v1.1

| Area | v1.0 (Nikahku) | v1.1 (Road To Halal) |
| --- | --- | --- |
| **Nama** | Nikahku | **Road To Halal** |
| **Navigasi** | Bottom navigation 5 menu | **Peta rute vertikal berkelok** (tanpa bottom bar), terinspirasi diagram perjalanan bertitik |
| **Alur** | 5 modul bebas dibuka | **8 tahap berurutan**. Tahap berikutnya **terkunci** sampai tahap sebelumnya selesai (di UI dan di API) |
| **Warna** | 4 warna (putih, pink muda, biru muda, pink tua) | **3 warna dasar: pink muda, biru muda, putih** (+ shade gelap “ink” khusus teks, ikon, garis); **digantikan palet baru di v1.2** |
| **Hak akses** | Pemilik, Pendamping (P2), Admin | Pemilik + **anggota ber-level Read atau Full (P0)**, Admin |
| **Penyimpanan** | Folder per `userId` | Folder per **workspace** agar bisa dibagi ke anggota |

## 1. Ringkasan Eksekutif

Road To Halal adalah aplikasi mobile web (PWA) yang menemani calon pengantin menempuh perjalanan dari persetujuan ta’aruf sampai hari akad dan walimah, selangkah demi selangkah. Seluruh perjalanan tampil sebagai **peta rute vertikal** berisi 8 tahap yang harus diselesaikan **berurutan**: tahap berikutnya baru terbuka setelah tahap sebelumnya selesai. Isinya biodata, kartu tanya jawab pranikah, kesepakatan dan proses khitbah, seserahan, anggaran dan mahar, berkas KUA, tracker vendor, daftar tamu, dan panitia keluarga.

Aplikasi dibangun dengan **Next.js + Tailwind CSS**, menyimpan data di **file JSON (tanpa SQL)**, dan dirancang agar bisa berjalan di **hosting cPanel**. Aplikasi terbuka untuk siapa saja: setiap orang mendaftar dan mendapat ruang data (workspace) pribadi. Pemilik workspace dapat mengundang pengguna lain (pasangan, keluarga, murabbi) dan mengatur hak aksesnya: **Read** (hanya melihat) atau **Full** (melihat dan mengubah).

**Prinsip produk:** bersih, modern, kekinian, mobile-first (nyaman di semua HP iOS dan Android), cepat, data tidak boleh hilang, dan **terarah**: satu tahap aktif pada satu waktu.

## 2. Latar Belakang & Masalah

- Persiapan menikah tersebar di banyak tempat: chat WhatsApp, catatan HP, spreadsheet, dan template Notion yang rumit di layar kecil.
- Banyak pasangan baru membicarakan hal prinsip (keuangan, karier istri, tempat tinggal, mertua, pola asuh) setelah terlalu jauh melangkah.
- Urutan persiapan sering terbalik: vendor dan gedung dipesan sebelum ada kesepakatan prinsip dan restu keluarga. Aplikasi perlu memandu urutan yang sehat.
- Biaya, jatuh tempo vendor, dan berkas KUA mudah terlewat karena tidak ada satu pusat kontrol.
- Template Notion tidak nyaman di HP, tidak bisa dipasang sebagai aplikasi, dan tidak punya pengingat.

## 3. Tujuan, Non-Tujuan & Metrik

|  | Isi |
| --- | --- |
| **Tujuan** | (1) Satu aplikasi dan satu rute untuk seluruh proses menuju akad. (2) Alur **berurutan dan terkunci**: tidak ada tahap yang bisa dilompati. (3) Semua input tersimpan permanen per workspace. (4) Hak akses **Read/Full** untuk setiap pengguna yang login. (5) Nyaman dipakai di HP dan bisa di-install (PWA). (6) Ringan dan stabil di hosting cPanel. |
| **Non-tujuan (v1)** | Marketplace vendor, pembayaran online, undangan digital publik, chat antar pengguna, aplikasi native Play Store/App Store, dan melompati atau membuka paksa tahap yang belum waktunya. |
| **Metrik sukses** | ≥ 70% pengguna baru mengisi profil calon di sesi pertama · ≥ 60% pengguna aktif menyelesaikan Tahap 1 dalam 7 hari pertama · ≥ 30% pengguna aktif memasang PWA · Lighthouse mobile (Performance & PWA) ≥ 90 · error rate API < 1% · **100% percobaan akses ke tahap terkunci dan penulisan oleh anggota Read ditolak** · **0 insiden kehilangan data** |

## 4. Pengguna & Peran

| Peran | Deskripsi | Hak akses |
| --- | --- | --- |
| **Pemilik (Catin)** | Calon pengantin pria atau wanita yang mendaftar sendiri dan memiliki workspace | Full atas workspace, plus kelola anggota, buka kembali tahap, export/import, dan hapus workspace |
| **Anggota – Full Akses** | Pengguna lain (pasangan, orang tua, wali, murabbi) yang bergabung lewat kode undangan | Melihat dan mengubah semua tahap yang sudah terbuka, mengunggah berkas, dan menyelesaikan tahap |
| **Anggota – Read** | Sama seperti di atas, tetapi hanya untuk memantau | Hanya melihat tahap yang sudah terbuka. Tidak bisa menambah, mengubah, menghapus, mengunggah, atau menyelesaikan tahap |
| **Admin** | Pengelola aplikasi (akun pertama atau email di ENV) | Kelola pengguna, reset password, ubah atau cabut akses anggota untuk keperluan dukungan, unduh backup, lihat statistik agregat. Tidak membaca isi data pribadi tanpa alasan operasional |

### 4.1 Matriks Hak Akses

| Kemampuan | Pemilik | Full | Read |
| --- | :---: | :---: | :---: |
| Melihat tahap yang sudah terbuka (Aktif dan Selesai) | ✓ | ✓ | ✓ |
| Melihat tahap Terkunci | ✗ | ✗ | ✗ |
| Tambah / ubah / hapus / urutkan data | ✓ | ✓ | ✗ |
| Unggah foto dan berkas | ✓ | ✓ | ✗ |
| Menekan **Selesaikan Tahap** | ✓ | ✓ | ✗ |
| Membuka kembali tahap terakhir yang selesai | ✓ | ✗ | ✗ |
| Mengundang, mengubah level, dan mencabut anggota | ✓ | ✗ | ✗ |
| Export data | ✓ | ✓ | ✗ |
| Import data dan hapus workspace | ✓ | ✗ | ✗ |
| Ganti password akun sendiri | ✓ | ✓ | ✓ |

### 4.2 Aturan Hak Akses

1. Level dipilih Pemilik saat membuat undangan dan dapat diubah kapan saja. Perubahan berlaku pada request berikutnya tanpa perlu login ulang, karena level dibaca dari data workspace, bukan dari token sesi.
2. Hak akses **tidak menembus kunci tahap**. Pemilik, Full, dan Read sama-sama tidak bisa membuka tahap yang masih terkunci.
3. Untuk anggota Read, semua kontrol ubah (tombol tambah, edit, hapus, unggah, drag urutan, Selesaikan Tahap) disembunyikan dan diganti lencana **“Hanya Baca”**. Penegakan sebenarnya ada di server (API menolak dengan 403), bukan hanya di tampilan.
4. Pemilik tidak bisa diturunkan levelnya dan tidak bisa dihapus dari workspace sendiri.

## 5. Ruang Lingkup & Prioritas

**P0 (MVP, wajib):** registrasi/login, **Peta Rute sebagai beranda dan navigasi utama**, **penguncian tahap berurutan (UI dan API)**, Profil Calon & pengaturan, **8 tahap**, **anggota dengan hak akses Read/Full (undangan lewat kode)**, penyimpanan JSON yang aman, upload foto, PWA install, backup harian, export data.

**P1:** notifikasi pengingat (in-app lalu push), bagikan rundown/daftar via WhatsApp, export PDF/CSV, lupa password via email SMTP cPanel, kalender terpadu, import tamu CSV, mini-rute di header tahap, tombol Aksi Cepat, rundown Hari-H per jam, sakelar “sembunyikan data pribadi” per anggota, mulai ta’aruf baru (arsip).

**P2:** kunci PIN, tanggal Hijriah, mode check-in tamu, catatan & doa, modul persiapan rumah tangga (setelah Halal), hak tulis per kolom (mis. calon mengisi jawabannya sendiri).

## 6. Arsitektur & Teknologi (Ramah cPanel)

### 6.1 Stack

| Lapisan | Pilihan | Catatan |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript, Node.js 20 LTS | `output: 'standalone'`, dijalankan lewat Passenger |
| Styling | Tailwind CSS + token desain kustom (warna Sky, tipografi, spasi, gerak) | Tanpa library UI berat |
| UI | Komponen kustom, lucide-react, bottom sheet, **SVG inline untuk jalur rute** | Bundle kecil |
| Gerak | CSS animation + Motion (framer-motion) dengan `LazyMotion`, View Transitions API bila didukung | Hanya `transform`/`opacity`; anggaran ≤ 25 KB gzip di JS awal; lihat 8.8 |
| Font | `next/font`: Plus Jakarta Sans + Inter (variabel, subset Latin, self-host) | Anggaran ≤ 120 KB; lihat 8.4 |
| Data fetching | SWR atau TanStack Query dengan optimistic update | UI terasa instan |
| Form & validasi | react-hook-form + zod | Skema yang sama dipakai client dan server |
| Auth | jose (JWT di cookie httpOnly) + **bcryptjs** | Pure JS, tanpa native module |
| Rute & hak akses | Modul `lib/route` (aturan tahap) dan `lib/access` (policy Read/Full) | Dipakai bersama oleh UI dan API agar aturannya identik |
| Penyimpanan | File JSON lewat `StorageAdapter` | Lihat 6.2 |
| Locking | proper-lockfile + mutex in-memory | Aman bila Passenger menjalankan >1 proses |
| PWA | Serwist (service worker) + manifest | Offline shell + antrean sinkron |
| Gambar | Kompresi di sisi client (WebP) | **Hindari `sharp`**; set `images.unoptimized = true` |
| Tanggal | date-fns (locale id), zona Asia/Jakarta |  |

> Hindari modul native (better-sqlite3, bcrypt, sharp) karena sering gagal dikompilasi di shared hosting.

### 6.2 Penyimpanan: File JSON per Workspace per Modul

Semua data berada di `DATA_DIR` **di luar `public_html`** (contoh `~/roadtohalal-data`, permission 700). Data dikelompokkan per **workspace**, bukan per akun, supaya anggota yang diundang membaca dan menulis data yang sama.

```
roadtohalal-data/
├─ index/users.json            # indeks email/username → userId
├─ index/invites.json          # kode undangan → workspaceId, level, masa berlaku
├─ users/{userId}/
│  └─ account.json             # akun, hash password, peran sistem, workspaceId
├─ workspaces/{workspaceId}/
│  ├─ workspace.json           # pemilik, anggota + level akses (read/full), kuota
│  ├─ route.json               # tahap saat ini, riwayat penyelesaian dan pembukaan kembali
│  ├─ settings.json            # preferensi, tanggal target akad, notifikasi
│  ├─ profile.json             # profil saya & profil calon
│  ├─ taaruf.json              # Tahap 1–2: biodata, kesehatan, keluarga, keputusan, kartu Q&A
│  ├─ khitbah.json             # Tahap 3–4: kesepakatan, seserahan, rundown, pelaksanaan
│  ├─ budget.json              # Tahap 4–5 dan 7: pos anggaran, mahar, sumber dana, vendor, pembayaran
│  ├─ kua.json                 # Tahap 6: checklist berkas, rekomendasi, TT, Bimwin
│  └─ harih.json               # Tahap 7–8: tamu, kuota katering, panitia, saksi, checklist H-1
├─ uploads/{workspaceId}/{fileId}.webp
└─ backups/YYYY-MM-DD/         # snapshot harian, simpan 14 hari
```

Setiap file memuat `schemaVersion` dan `rev`. Satu workspace biasanya hanya ratusan KB sehingga cepat dibaca dan ditulis.

### 6.3 Jaminan Data Aman dan Bebas Error

1. **Penulisan atomik:** tulis ke file sementara → `fsync` → `rename`; versi sebelumnya disimpan sebagai `.bak`.
2. **Lock per file** agar dua request bersamaan tidak saling menimpa.
3. **Operasi tingkat item** (tambah/ubah/hapus/urutkan item), bukan menimpa seluruh file. Server menggabungkan perubahan di dalam lock, sehingga dua perangkat atau dua anggota Full tidak saling menghapus data.
4. **Validasi zod** saat baca dan tulis. Jika JSON rusak, otomatis pulih dari `.bak` dan dicatat di log.
5. **Cache LRU** di memori (invalidasi via mtime) agar baca cepat.
6. **Hapus lunak** (`deletedAt`) selama 30 hari dengan tombol “Urungkan”.
7. **Backup harian** lewat Cron cPanel (`node scripts/backup.js`) dan **export JSON/ZIP mandiri** oleh pengguna.
8. **Autosave** di client (debounce 800 ms) plus antrean offline di IndexedDB yang dikirim ulang saat online.
9. **Migrasi skema** berurutan berdasarkan `schemaVersion`.
10. Lapisan `StorageAdapter` dibuat agar bila workspace aktif melewati kira-kira 3.000–5.000, penyimpanan bisa dipindah ke SQLite/MySQL tanpa mengubah UI.
11. **Penjaga tahap dan hak akses di server:** setiap route handler memanggil `guard(session, stage, action)` sebelum membaca atau menulis file. `currentStage` dan level akses dibaca dari file workspace (bukan dari token sesi), sehingga pembukaan kembali tahap atau perubahan level langsung berlaku.

### 6.4 Upload File

- Foto calon, bukti transfer, dan scan berkas dikompres di client (maks. sisi 1280 px, ≤ 400 KB, WebP/JPEG). Foto profil dibuat versi thumbnail 256 px di client.
- Disimpan di `uploads/{workspaceId}/` dan **hanya dilayani lewat API yang memeriksa sesi, keanggotaan, dan tahap**, tidak pernah lewat URL publik. Unggah hanya untuk Pemilik dan Full.
- Kuota default 50 MB per workspace (bisa diubah admin). Tipe file dibatasi (jpg, png, webp, pdf ≤ 2 MB).

### 6.5 Deploy di cPanel

1. Pastikan hosting punya menu **Setup Node.js App** (CloudLinux/Passenger). Jika tidak ada, aplikasi tidak bisa berjalan dan perlu VPS atau hosting Node (risiko utama).
2. Build di komputer lokal: `npm ci && npm run build`. Hindari build di server karena batas RAM/CPU shared hosting.
3. Kemas `.next/standalone`, `.next/static`, `public`, dan `server.js`, lalu unggah ke `~/apps/roadtohalal`.
4. Setup Node.js App: Node 20, mode Production, startup file `server.js`, set ENV `SESSION_SECRET`, `DATA_DIR`, `ADMIN_EMAIL`, `APP_URL`.
5. Aktifkan AutoSSL dan paksa HTTPS (wajib untuk PWA dan cookie Secure).
6. Tambahkan Cron harian untuk backup.
7. Update aplikasi: unggah build baru → Restart App. Folder data tidak tersentuh.

### 6.6 Struktur Proyek

```
app/
├─ (auth)/login, register, gabung            # gabung = masukkan kode undangan
├─ (app)/layout.tsx                          # shell: header atas + guard rute (tanpa bottom bar)
│  ├─ rute/                                  # Peta Rute = beranda
│  ├─ tahap/persetujuan-taaruf/  proses-taaruf/  kesepakatan-khitbah/  proses-khitbah/
│  │       kesepakatan-akad/  administrasi-kua/  persiapan-walimah/  hari-h/  halal/
│  ├─ profil/  pengaturan/  anggota/
├─ api/auth/*, api/route/*, api/members/*, api/m/[module]/*, api/files/*, api/admin/*
lib/storage/ (adapter, json-store, lock, atomic-write, migrations)
lib/auth/    lib/route/ (urutan tahap, syarat selesai, guard)    lib/access/ (policy read/full)
lib/schemas/    components/ui/    components/route/ (RouteMap, RouteNode)    components/motion/ (splash, transisi, sheet, konfetti)
styles/tokens.css    public/icons/
server.js    scripts/backup.js
```

## 7. Akun, Pengguna & Pengaturan

- **Registrasi:** nama, email atau username, password (min. 8 karakter), peran (Catin Pria/Wanita), tanggal target akad (opsional). Pendaftaran membuat satu workspace baru dengan pengguna sebagai Pemilik, dan **Tahap 1 langsung aktif**. Peran menentukan sudut pandang label (“calon istri/suami”).
- **Bergabung lewat kode undangan (P0):** pengguna yang menerima kode mendaftar atau login lewat halaman `/gabung`, memasukkan kode, lalu masuk ke workspace Pemilik dengan level (Read/Full) yang ditetapkan saat undangan dibuat. Pada v1, satu akun terhubung ke satu workspace; akun yang mendaftar lewat kode tidak membuat workspace sendiri.
- **Login:** cookie httpOnly + Secure + SameSite=Lax, sesi 30 hari. Hash bcryptjs cost 10 (cukup cepat di shared hosting). Rate limit login 5 percobaan/menit/IP.
- **Lupa password:** P0 reset oleh admin; P1 lewat email (SMTP cPanel + nodemailer, token sekali pakai 30 menit).
- **Anggota & Hak Akses (P0, khusus Pemilik):** menu Pengaturan → Anggota.
  - **Buat undangan:** pilih level **Read** atau **Full**, isi label hubungan (pasangan, orang tua, wali, murabbi, saudara, lainnya). Sistem membuat kode 8 karakter sekali pakai, berlaku 7 hari, dan dapat dibagikan lewat WhatsApp (tombol bagikan di P1).
  - **Kelola anggota:** daftar anggota dengan lencana level, ubah level lewat sakelar Read ↔ Full, cabut akses, dan lihat waktu aktif terakhir.
  - **Peringatan privasi** tampil saat membuat undangan: anggota dapat melihat data pada tahap yang terbuka, termasuk data kesehatan dan keluarga. Pada P1 tersedia sakelar “sembunyikan data pribadi” per anggota.
- **Pengaturan:** profil akun, ganti password, tanggal target & lokasi, zona waktu, notifikasi, anggota & hak akses, export data, backup manual, instal aplikasi, **hapus akun dan seluruh data** (sesuai prinsip UU PDP; hapus workspace hanya oleh Pemilik).
- **Admin minimal:** daftar pengguna, nonaktifkan, reset password, ubah atau cabut level akses anggota (untuk dukungan), statistik agregat, pemakaian disk, unduh backup. Admin **tidak** dapat membuka kunci atau melompati tahap.
- **Privasi:** data kesehatan, keluarga, dan berkas bersifat sensitif. Tidak ada analitik pihak ketiga, tidak ada penjualan data, dan ada halaman Kebijakan Privasi serta Syarat Penggunaan.

## 8. Desain, UI/UX & Motion

> Bagian ini mengatur **hanya tampilan, tata letak, teks, dan animasi**. Fitur, alur tahap, hak akses, aturan data, dan API di bagian lain **tidak berubah**.

### 8.1 Prinsip UI/UX

1. **Satu layar, satu tujuan.** Setiap layar punya satu aksi utama yang jelas, diletakkan di zona jempol (sepertiga bawah layar).
2. **Mobile-first sungguhan.** Desain dimulai dari 360–393 px, baru naik ke layar lebih besar.
3. **Mudah dibaca sekilas.** Hierarki tegas (judul → nilai penting → detail), satu kolom, banyak ruang kosong, kalimat pendek.
4. **Umpan balik instan.** Setiap sentuhan merespons ≤ 100 ms dan setiap aksi punya hasil yang terlihat (gerak, toast, atau perubahan status).
5. **Memaafkan kesalahan.** Konfirmasi untuk aksi merusak, tombol Urungkan, pesan galat yang menjelaskan cara memperbaiki.
6. **Gerak punya makna.** Animasi menjelaskan apa yang berubah, dari mana, dan ke mana. Bukan hiasan, tidak menghalangi input, dan selalu bisa dibatalkan.
7. **Konsisten.** Satu komponen untuk satu fungsi, istilah yang sama di semua layar.
8. **Ringan dan inklusif.** Mulus di HP kelas menengah-bawah, menghormati pengaturan gerak dan ukuran teks pengguna.

### 8.2 Kompatibilitas Perangkat (iOS & Android)

| Aspek | Ketentuan |
| --- | --- |
| **Platform** | iOS 16.4+ (Safari dan PWA terpasang); Android dengan Chrome atau Samsung Internet dua versi mayor terbaru. Browser lain didukung untuk penggunaan dasar |
| **Lebar layar** | 320 px (HP kecil, layar luar foldable) sampai 440+ px (iPhone Pro Max, Android besar). Titik desain acuan: **360 px** (Android umum) dan **390 px** (iPhone) |
| **Breakpoint** | Compact ≤ 359 px (padding 16, tombol boleh 2 baris) · Standard 360–429 px (padding 20) · Large 430–599 px (padding 24) · Tablet/foldable terbuka ≥ 600 px (konten terpusat, lebar maks. 520 px, latar Mist di sisi) |
| **Orientasi** | Portrait sebagai utama. Orientasi **tidak dikunci**; mode landscape tetap nyaman (konten bisa di-scroll, header tidak melebihi 20% tinggi layar) |
| **Safe area** | `viewport-fit=cover` dan `env(safe-area-inset-*)` untuk header, Sticky CTA, bottom sheet, dan toast: aman dari notch, Dynamic Island, indikator home iOS, dan bar gesture Android |
| **Tinggi layar** | Memakai `dvh`/`svh` dengan fallback `vh`. Tidak memakai `100vh` mentah, sehingga bar alamat browser yang naik-turun tidak merusak layout |
| **Keyboard** | Android: `interactive-widget=resizes-content`. iOS: memantau `visualViewport`. Sticky CTA dan bottom sheet naik di atas keyboard, kolom yang fokus otomatis digulir ke tengah layar |
| **Sentuhan** | Area sentuh ≥ 48×48 px untuk aksi utama (minimal 44 px), jarak antar target ≥ 8 px, `touch-action: manipulation` (tanpa zoom ketuk ganda), `-webkit-tap-highlight-color` transparan diganti state tekan sendiri, `overscroll-behavior: contain` pada sheet dan daftar bersarang |
| **Input** | Font isian ≥ 16 px (mencegah zoom otomatis iOS), picker tanggal dan jam bawaan perangkat, `inputmode`, `autocomplete`, dan `enterkeyhint` sesuai jenis isian |
| **Skala teks** | Ukuran teks memakai `rem`. Layout diuji pada skala teks 100%, 130%, dan 200% (pengaturan ukuran font Android dan zoom iOS) tanpa teks terpotong atau tombol keluar layar |
| **Gambar dan ikon** | Ikon dan ilustrasi berupa SVG (tajam di semua kepadatan piksel). Foto memakai `object-fit: cover` dan thumbnail 256 px di daftar |
| **Fitur CSS/JS baru** | `text-wrap`, View Transitions API, `animation-timeline`, `backdrop-filter` hanya dipakai dengan `@supports` dan fallback (awalan `-webkit-` untuk Safari) |

**Perangkat uji minimum:** iPhone SE generasi 3 (± 375×667), iPhone 13 mini (± 375×812), iPhone 15/16 (± 393×852), iPhone 16 Pro Max (± 440×956), Samsung Galaxy seri A (± 360×800), Google Pixel (± 412×915), Xiaomi/Redmi/Oppo/Vivo/Realme (± 360–393 px, umum di Indonesia), satu foldable (layar luar ± 344 px dan terbuka ≥ 600 px), dan **satu HP Android RAM 2–3 GB** sebagai patokan performa.

### 8.3 Warna

Tema utama adalah **Biru Muda (Sky)**, dipadu putih dan netral kebiruan agar terasa bersih, tenang, dan modern. Navy dipakai untuk teks dan kontras, **Azure** untuk aksi, satu aksen hangat **Peach** untuk sorotan, serta Mint dan Coral **khusus status**. Komposisi acuan: ± 60% putih/Mist, ± 30% tint Sky, ± 10% Azure dan aksen.

| Token | Hex | Dipakai untuk |
| --- | --- | --- |
| **Putih** `white` | `#FFFFFF` | Kartu, sheet, kolom isian |
| **Mist** `mist` | `#F3F9FF` | Latar aplikasi |
| **Sky 100** | `#E6F3FF` | Latar chip, bagian sorotan, dasar skeleton |
| **Sky 200** | `#CBE6FF` | Tombol sekunder, border aktif lembut, ilustrasi |
| **Sky 300 (Biru Muda utama)** | `#9FD3FF` | **Warna merek**: hero, node aktif, progress, latar ikon aplikasi dan splash |
| **Azure 600** | `#1F6FDB` | Tombol utama, ikon aktif, fokus (teks putih di atasnya 4,8:1) |
| **Azure 700** | `#1B5FB3` | Teks tautan dan state tekan tombol utama (6,3:1 di putih) |
| **Navy 900** | `#0E2A47` | Teks utama dan judul (14,6:1 di putih) |
| **Slate 600** | `#4A5F78` | Teks sekunder (6,6:1 di putih) |
| **Slate 500** | `#5A6E86` | Placeholder (5,2:1 di putih) |
| **Slate 400** | `#7589A1` | Garis putus-putus, gembok, border tidak aktif (3,6:1 di putih) |
| **Line** | `#DCE9F6` | Divider dan border kartu |
| **Peach 300 / 100** | `#FFC8A2` / `#FFE9DA` | Aksen hangat (± 5%): chip “Kamu di sini”, countdown, selebrasi, callout |
| **Mint 300 / 100 / 700** | `#9BE7CC` / `#D9F7EC` / `#0B6B57` | Status selesai: isi / latar / ikon dan teks |
| **Coral 500 / 100 / 700** | `#E5484D` / `#FFE3E1` / `#9B1C20` | Status terlambat dan galat: outline dan ikon / latar / teks |

**Gradien dan bayangan**

- **Aurora Sky** (hero, splash, Login): `linear-gradient(160deg, #E6F3FF 0%, #CBE6FF 45%, #9FD3FF 100%)` ditambah cahaya Peach di sudut kanan atas `radial-gradient(60% 45% at 100% 0%, rgba(255,200,162,.40), transparent 70%)`.
- Bayangan bernuansa biru, tiga tingkat: `0 1px 2px rgba(14,42,71,.06)` (kartu), `0 8px 24px rgba(31,111,219,.12)` (terangkat), `0 16px 40px rgba(14,42,71,.16)` (sheet dan dialog).

**Aturan pemakaian**

1. Teks di atas Sky 300, Sky 200, Peach, dan Mint **selalu Navy** (kontras ≥ 9:1). Teks putih hanya di atas Azure dan Navy.
2. Peach, Mint, dan Coral tidak dipakai sebagai latar luas.
3. Setiap elemen interaktif punya state: default, ditekan, fokus, dan nonaktif. Fokus berupa cincin Azure 600 setebal 2 px dengan jarak 2 px.
4. Warna tidak pernah menjadi satu-satunya pembeda: status selalu disertai ikon dan teks.
5. Tanpa dark mode di v1 (tidak berubah).

**Status** (sama untuk node di rute dan chip item di dalam tahap)

| Status | Node rute | Chip/item | Ikon |
| --- | --- | --- | --- |
| **Belum / Terkunci** | Isi `#EAF1F8`, outline putus-putus Slate 400, label Slate 600 | Putih dengan outline putus-putus | Gembok (tahap) atau lingkaran (item) |
| **Proses / Aktif** | Isi Sky 300, cincin denyut Sky 300, outline Azure 600 2 px, chip Peach “Kamu di sini” | Sky 100, teks Azure 700 | Penanda lokasi (tahap) atau jam (item) |
| **Selesai** | Isi Mint 300, outline Mint 700 | Mint 100, teks Mint 700 | Centang |
| **Terlambat** | Putih, outline Coral 500 2 px | Coral 100, teks Coral 700 | Peringatan |

```js
// tailwind.config.ts (potongan)
colors: {
  white: '#FFFFFF', mist: '#F3F9FF', line: '#DCE9F6',
  sky:   { 100: '#E6F3FF', 200: '#CBE6FF', 300: '#9FD3FF' },   // biru muda (merek)
  azure: { 600: '#1F6FDB', 700: '#1B5FB3' },                    // aksi, tombol, tautan
  navy:  { 900: '#0E2A47' },
  slate: { 400: '#7589A1', 500: '#5A6E86', 600: '#4A5F78' },
  peach: { 100: '#FFE9DA', 300: '#FFC8A2' },
  mint:  { 100: '#D9F7EC', 300: '#9BE7CC', 700: '#0B6B57' },
  coral: { 100: '#FFE3E1', 500: '#E5484D', 700: '#9B1C20' },
}
```

### 8.4 Tipografi (Khusus Mobile)

- **Judul dan angka besar: Plus Jakarta Sans** (variabel, bobot 600–800). Geometris dan ramah, tampil modern dan hangat untuk teks Bahasa Indonesia.
- **Teks isi, kolom isian, daftar, dan angka: Inter** (variabel, bobot 400–600). Dirancang untuk layar, tetap jelas di ukuran kecil, dan punya angka tabular sehingga nominal Rupiah rata dan stabil.
- Dimuat lewat `next/font` (self-host, subset Latin, `display: swap`, `adjustFontFallback`). Anggaran total font ≤ 120 KB. Cadangan: `system-ui, -apple-system, 'SF Pro Text', 'Segoe UI', Roboto, sans-serif`.
- Bila ada teks Arab (mis. doa di Catatan & Doa), memakai Noto Naskh Arabic yang dimuat hanya di halaman itu.

| Peran | Ukuran / tinggi baris | Bobot | Font | Dipakai untuk |
| --- | --- | --- | --- | --- |
| **Display** | 32 / 38 | 800 | Jakarta | Countdown, angka ringkasan besar, judul Login dan layar Halal (tracking −0,02 em) |
| **Title 1** | 26 / 32 | 700 | Jakarta | Judul halaman dan tahap (tracking −0,015 em) |
| **Title 2** | 20 / 26 | 700 | Jakarta | Judul bagian dan kartu besar |
| **Title 3** | 17 / 24 | 600 | Inter | Judul item di daftar dan judul bottom sheet |
| **Body** | 16 / 24 | 400 | Inter | Teks utama dan isi kolom (16 px mencegah zoom iOS) |
| **Body Strong** | 16 / 24 | 600 | Inter | Nilai penting: nama, nominal |
| **Secondary** | 14 / 20 | 400 | Inter | Keterangan sekunder di daftar |
| **Footnote** | 13 / 18 | 500–600 | Inter | Label kolom, teks bantuan, metadata (+0,01 em) |
| **Chip** | 12 / 16 | 600 | Inter | Chip status dan lencana (huruf kapital hanya bila ≤ 2 kata) |
| **Button** | 16 / 20 | 600 | Inter | Semua tombol |

**Aturan keterbacaan**

1. Display dan Title 1 bersifat fluid dengan `clamp()` antara 320 dan 430 px, sehingga tidak meluap di layar kecil.
2. Teks isi tidak lebih kecil dari 14 px. Hanya chip dan lencana yang 12 px.
3. Rata kiri (tidak rata kiri-kanan), tinggi baris ≥ 1,5 untuk paragraf, panjang baris ± 40–55 karakter, `text-wrap: balance` untuk judul dan `pretty` untuk paragraf (dengan fallback).
4. Paling banyak dua bobot teks isi per layar (400 dan 600). Tanpa teks miring panjang dan tanpa kalimat penuh huruf kapital.
5. Angka memakai `font-variant-numeric: tabular-nums`. Format: `Rp 12.500.000` (“Rp” 80% ukuran), tanggal `Sab, 12 Des 2026`, jam 24 jam `14.30`, jumlah `120 pax`. Singkatan `Rp 2,5 jt` hanya di sumbu chart.
6. Judul item di daftar dipotong satu baris dengan elipsis (isi lengkap ada di sheet detail). Label tombol tidak dipotong dan boleh 2 baris di layar ≤ 359 px.

### 8.5 Layout, Spasi & Bentuk

- **Grid 4 px.** Skala spasi: 4, 8, 12, 16, 20, 24, 32, 40, 56.
- **Padding horizontal layar:** 16 / 20 / 24 px sesuai breakpoint. Jarak antar kartu 12, antar bagian 24–32, padding dalam kartu 16–20.
- **Radius:** kolom isian dan tombol 16 (tombol utama pill), kartu 24, sheet 28 (sisi atas), hero 32 (sisi bawah), chip dan node bulat penuh.
- **Elevasi:** 0 (datar dengan border Line), 1 (kartu), 2 (terangkat: FAB, toast), 3 (sheet dan dialog).
- **Ikon:** lucide-react 24 px (20 px di dalam chip), garis 1,75 px. Aksi penting selalu ikon + label.
- **Efek kaca:** header menempel dan bottom sheet memakai `backdrop-filter: blur(16px) saturate(1.4)` dengan latar putih 78% (cadangan: putih solid). Maksimal dua elemen kaca di satu layar.
- **Hierarki layar:** judul besar yang mengecil saat di-scroll (gaya large title), segmented tab menempel di bawah header, konten berupa kartu, aksi utama di Sticky CTA bawah.

**Anatomi layar standar**

```
┌────────────────────────────────────┐
│  status bar - notch                │  <- safe-area atas
│ < Rute        Judul Tahap       ...│  <- header kaca, mengecil saat scroll
│                                    │
│  Judul Besar (Title 1)             │
│  [ Tab A ][ Tab B ][ Tab C ]       │  <- segmented, menempel
│ ┌────────────────────────────────┐ │
│ │ Kartu / baris-kartu            │ │
│ └────────────────────────────────┘ │
│ ┌────────────────────────────────┐ │
│ │ Kartu / baris-kartu            │ │
│ └────────────────────────────────┘ │
│  [       Selesaikan Tahap       ]  │  <- Sticky CTA (zona jempol)
│  indikator home - bar gesture      │  <- safe-area bawah
└────────────────────────────────────┘
```

### 8.6 Komponen: Teks, Kolom Isian & Data

**A. Kolom isian (form)**

- **Satu kolom penuh.** Label di atas kolom (Footnote 13/18 tebal, Navy), teks bantuan di bawah kolom (Footnote, Slate 600), placeholder hanya contoh isi (Slate 500), bukan pengganti label.
- Tinggi kolom **52 px**, radius 16, border 1,5 px Line. Saat fokus: border Azure 600 dan cincin Sky 200 selebar 4 px. Ikon awalan 20 px.
- **Validasi ramah:** dicek saat kolom ditinggalkan dan saat kirim, bukan di setiap ketukan. Pesan galat berada tepat di bawah kolom, memakai ikon peringatan dan Coral 700, serta menyebut apa yang salah dan cara memperbaikinya (“Nomor HP minimal 10 digit”). Isian benar ditandai centang kecil Mint 700.
- **Penanda wajib/opsional:** tandai yang jarang. Pada form yang sebagian besar wajib (Login, Daftar) tandai “(opsional)”; pada form yang sebagian besar opsional (biodata, kesehatan) tandai “Wajib”.
- **Jenis input yang tepat:** Rupiah memakai `inputmode="numeric"` dengan pemisah ribuan otomatis dan awalan “Rp” tetap; kontak `tel`; link toko `url`; tanggal dan jam memakai picker bawaan perangkat.
- **Pilihan:** ≤ 4 opsi memakai segmented control; 5–7 opsi memakai chip yang boleh turun baris; lebih dari 7 memakai bottom sheet berisi pencarian; ya/tidak memakai switch (51×31 px); checkbox dan radio 24 px dengan area sentuh 48 px.
- **Form panjang dibagi menjadi kartu bagian yang bisa dibuka-tutup (accordion)**, masing-masing dengan judul, ringkasan (“4 dari 6 terisi”), dan centang bila lengkap. Pada layar ≤ 430 px satu bagian terbuka dalam satu waktu. Ini hanya penataan tampilan; isian tidak berubah.
- **Penyimpanan:** autosave tetap berjalan. Indikator kecil di header menampilkan “Menyimpan…”, “Tersimpan” atau “Belum tersimpan”. Sticky CTA hanya untuk aksi bermakna (mis. Simpan di sheet, Selesaikan Tahap).

**B. Daftar dan data (pengganti tabel)**

- **Tidak ada tabel yang harus digeser ke samping.** Data tabular (seserahan, vendor, pembayaran, tamu, item anggaran, checklist KUA) tampil sebagai **baris-kartu**: baris 1 judul (Title 3, satu baris) dengan chip status di kanan; baris 2 keterangan (Secondary, maks. 2 baris); baris 3 pasangan label–nilai dalam grid 2 kolom (label Footnote Slate 600, nilai Body Strong, angka rata kanan dan tabular).
- Tinggi baris ≥ 64 px, ikon/avatar 40 px, pemisah inset, aksi geser untuk Pemilik dan Full.
- **Kartu ringkasan** di atas daftar (Anggaran / Terpakai / Sisa; Total pax / Kuota): nilai utama Display 32, tiga mini-stat di bawahnya, dan progress bar. Versi ringkas menempel saat daftar di-scroll.
- **Filter dan pencarian:** chip yang bisa digeser horizontal (tinggi 36, area sentuh 44) dengan pudar di tepi, kolom pencarian di atas daftar.
- **Nilai kurang atau melebihi kuota** ditandai ikon peringatan dan Coral 700, bukan warna saja.
- **Empty state:** ilustrasi SVG 120 px, judul (Title 3), satu kalimat petunjuk, dan satu tombol aksi.
- **Skeleton:** berbentuk sama persis dengan konten yang akan tampil.

**C. Tulisan antarmuka (UX writing)**

- Bahasa Indonesia sehari-hari yang sopan dan hangat, kalimat aktif, ≤ 20 kata, satu ide per kalimat.
- Tombol berupa kata kerja spesifik (“Simpan seserahan”, “Selesaikan Tahap”), bukan “OK” atau “Submit”.
- Pesan galat menyebut masalah dan solusi, tanpa menyalahkan pengguna.
- Istilah konsisten (Ta’aruf, Khitbah, Tahap, Rute). Singkatan dijelaskan sekali, mis. “Bimwin (Bimbingan Perkawinan)”.
- Konfirmasi aksi merusak menyebut dampaknya (“Hapus 3 tamu? Masih bisa diurungkan selama 30 hari”).
- Kolom yang rumit (N1–N4, Elsimil) diberi teks bantuan satu kalimat di bawah kolom.

**D. Pustaka komponen**

Button, IconButton, Input, Picker/Select, Chip, Segmented, Switch, Checkbox/Radio, Card, ListRow, Accordion, BottomSheet, Dialog, Toast, Progress (bar, ring, donut, gauge), Skeleton, EmptyState, Avatar, Badge (termasuk “Hanya Baca”), RouteNode, StickyCTA, Header (large title).

| Tombol | Tampilan | Dipakai untuk |
| --- | --- | --- |
| **Primary** | Azure 600, teks putih, pill, tinggi 52, elevasi 2. Ditekan: Azure 700 dan skala 0,97 | Aksi utama (satu per layar) |
| **Secondary** | Sky 200, teks Navy | Aksi pendukung |
| **Tertiary** | Tanpa latar, teks Azure 700 | Aksi ringan, tautan |
| **Destructive** | Coral 100 dengan teks Coral 700; pada dialog konfirmasi Coral 700 dengan teks putih (8,1:1) | Hapus, cabut akses |
| **Nonaktif** | Putih, outline putus-putus Slate 400, teks Slate 600 (tetap terbaca), gembok bila terkunci | Syarat belum terpenuhi |
| **Memuat** | Teks diganti spinner 20 px di tempat yang sama, lebar tetap, tidak bisa diketuk ulang | Sedang memproses |

### 8.7 Navigasi: Peta Rute (Pengganti Bottom Navigation)

Tidak ada bottom bar. Menu utama adalah **peta rute vertikal yang berkelok**, seperti diagram perjalanan bertitik: **titik awal di bawah, tujuan di puncak**, node bulat berurutan di sepanjang jalur, dan label tahap bergantian di sisi kiri dan kanan jalur.

```
                        ★ HALAL (tujuan)
                                ┃
                                  ● 8  Hari-H: Akad & Walimah
                                ┃
         Persiapan Walimah  7 ●
                                ┃
                                  ● 6  Administrasi & Berkas KUA
                                ┃
Kesepakatan Akad & Anggaran  5 ●
                                ┃
                                  ● 4  Proses Khitbah
                                ┃
       Kesepakatan Khitbah  3 ●
                                ┃
                                  ● 2  Proses Ta’aruf (Tanya Jawab)
                                ┃
       Persetujuan Ta’aruf  1 ●
                                ┃
                              MULAI
```

**Aturan tampilan rute**

1. Jalur berupa kurva S (SVG inline, lebar acuan 360 px, jarak antar node ± 120 px). Node diposisikan di titik-titik jalur dan label ditaruh di sisi berlawanan dari arah lengkung agar tidak bertabrakan.
2. Node berdiameter 56 px (area sentuh ≥ 48 px) berisi nomor tahap. Node selesai berisi centang, node terkunci berisi gembok. Di samping node ada label tahap (Title 3, maks. 2 baris) dan subjudul satu baris (Secondary), mis. “3 dari 5 syarat”.
3. Gaya node mengikuti tabel status di 8.3. Bagian jalur yang sudah dilalui berupa **garis Azure 600 solid 5 px** berujung bulat, sisanya **garis putus-putus Slate 400** (dash 4 px, jeda 8 px).
4. Kanvas rute berlatar Mist dengan hiasan lembut (awan, bintang kecil, gelembung Sky 100) di sisi yang kosong. Hiasan tidak interaktif dan disembunyikan pada mode ringan (8.8).
5. Node “Mulai” (bawah) berupa titik Sky 300. Node “Halal” (puncak) berupa bintang ★ bernuansa Peach dan Sky; tetap terkunci sampai Tahap 8 selesai.
6. Saat Peta Rute dibuka, layar **otomatis bergulir halus ke node Aktif**. Header ringkas yang menempel menampilkan “Tahap 3 dari 8 · Kesepakatan Khitbah” dan tombol **Lanjutkan**.

**Perilaku klik (penguncian berurutan, tidak berubah)**

| Status node | Saat diketuk | Catatan |
| --- | --- | --- |
| **Aktif** | Membuka halaman tahap | Tahap tempat bekerja saat ini |
| **Selesai** | Membuka halaman tahap (bisa ditinjau dan, oleh Pemilik/Full, diedit) | Mengedit tidak mengunci ulang tahap lain |
| **Terkunci** | **Tidak membuka halaman.** Node bergoyang kecil, lalu muncul bottom sheet: “Selesaikan dulu ‘Proses Ta’aruf’ untuk membuka tahap ini” + tombol **Ke tahap saat ini** | Node `aria-disabled="true"`, tanpa tautan, disertai getar haptic bila didukung |

- Semua node **setelah/di atas** tahap aktif otomatis terkunci. Ketika Tahap 2 belum selesai, Tahap 3 sampai Halal tidak dapat diklik.
- Penguncian juga berlaku untuk akses lewat URL langsung, tautan tersimpan, dan shortcut PWA: halaman diarahkan ke tahap aktif dan API menolak dengan 403 `STAGE_LOCKED`.
- Saat **Selesaikan Tahap** ditekan dan syarat terpenuhi: dialog konfirmasi → animasi penyelesaian tahap (8.8, kelompok D).
- Tampilan alternatif untuk pembaca layar dan keyboard berupa daftar berurutan (`<ol>`); fokus keyboard hanya mendarat pada node yang bisa dibuka.

**Header atas (menggantikan fungsi bottom bar)**

- Di Peta Rute: header kaca. Hero Aurora Sky berisi sapaan, foto calon, “Tahap X dari 8”, dan countdown; saat di-scroll hero **mengecil menjadi bar 64 px** berisi logo, lonceng notifikasi (P1), dan avatar yang membuka **Profil & Pengaturan**.
- Di dalam halaman tahap: tombol **‹ Rute**, judul tahap (large title yang mengecil saat scroll), indikator simpan, dan mini-rute 8 titik kecil sebagai penanda posisi (P1; hanya titik yang terbuka yang dapat diketuk).
- Sub-bagian di dalam tahap memakai **segmented tab** atau chip scroll horizontal yang menempel di bawah header.
- **Aksi Cepat (P1):** tombol melayang 56 px (Azure 600) di Peta Rute untuk menambah pengeluaran, tamu, seserahan, tugas, atau catatan. Hanya menampilkan aksi dari tahap yang sudah terbuka dan disembunyikan untuk anggota Read.

### 8.8 Motion & Animasi

Gerak dirancang ala aplikasi native: cepat, berbasis pegas (spring), bisa dibatalkan, dan hanya memakai `transform` dan `opacity` agar tetap 60 fps.

**Token gerak**

| Token | Durasi | Dipakai untuk |
| --- | --- | --- |
| `instant` | 90 ms | State tekan, riak sentuhan |
| `fast` | 150 ms | Fokus, chip, pergantian ikon |
| `base` | 240 ms | Tab, accordion, toast, dialog |
| `slow` | 400 ms | Transisi halaman, bottom sheet, flip kartu |
| `expressive` | 600–900 ms | Gambar jalur rute, chart, count-up, perayaan |

Easing: `standard` = `cubic-bezier(.2, 0, 0, 1)`, `decelerate` (masuk) = `cubic-bezier(.05, .7, .1, 1)`, `accelerate` (keluar) = `cubic-bezier(.3, 0, .8, .15)`. Pegas: sheet dan drag (stiffness 380, damping 32), pop (stiffness 520, damping 24). Stagger 40–70 ms per item dengan total ≤ 600 ms (item ke-9 dan seterusnya muncul tanpa tunda).

**Kelompok A — Memuat (loading)**

| Animasi | Spesifikasi |
| --- | --- |
| **A1 Splash peluncuran** | Latar Sky 300 (sama dengan ikon dan splash bawaan OS agar mulus). Logo muncul dengan skala 0,8 → 1 dan fade (pop 400 ms) di atas cincin halus yang berdenyut. Di bawahnya garis rute mini berisi 8 titik tergambar (`stroke-dashoffset` 700 ms) dan titik menyala berurutan (stagger 80 ms), lalu nama “Road To Halal” fade-up. Tampil minimal 500 ms agar tidak berkedip dan maksimal 3 detik (setelah itu lanjut dengan skeleton). Selesai dengan **tirai radial** dari logo (500 ms) menuju Login atau Peta Rute. Hanya pada peluncuran awal, tidak di setiap pindah halaman |
| **A2 Progress navigasi** | Bilah 3 px bergradasi Sky 300 → Azure 600 di bawah safe area atas, muncul bila proses > 200 ms, bergerak semu sampai 80% lalu tuntas, fade out 200 ms |
| **A3 Skeleton** | Blok Sky 100 dengan kilau diagonal yang bergeser 1,4 s (loop linear). Bentuk sama persis dengan konten (judul, baris, avatar, kartu, node rute). Muncul bila data > 150 ms, tampil minimal 300 ms, konten menggantikan dengan fade 150 ms |
| **A4 Tombol memuat** | Teks memudar menjadi spinner 20 px di tempat yang sama (lebar tetap). Berhasil: centang tergambar 240 ms. Gagal: tombol bergoyang dan pesan galat muncul |
| **A5 Gambar** | Placeholder Sky 100, lalu fade-in 200 ms setelah gambar siap. Saat mengunggah foto, cincin progress melingkari thumbnail dan berubah menjadi centang Mint |
| **A6 Optimistic update** | Item baru langsung muncul (skala 0,96 → 1 dan fade 240 ms). Bila gagal tersimpan: item bergoyang sekali dan diberi tanda “Belum tersimpan” |

**Kelompok B — Transisi halaman dan overlay**

| Animasi | Spesifikasi |
| --- | --- |
| **B1 Halaman maju/mundur** | Maju: halaman baru bergeser dari kanan 24 px sambil fade (`slow`, decelerate), halaman lama bergeser −8 px dan meredup. Mundur: kebalikannya. Antar tab dan sub-bagian: crossfade + geser 12 px searah tab. Memakai View Transitions API bila didukung, cadangan `AnimatePresence`. Gestur kembali bawaan iOS dan Android tidak dihalangi |
| **B2 Bottom sheet** | Naik dengan pegas dari bawah, latar Navy 40% dengan blur 4 px (fade `base`). Handle 36×4 px, tarik untuk menutup dengan inersia dan efek karet, titik henti 50% dan 92%. Isi muncul berurutan (stagger 40 ms). Sheet naik di atas keyboard |
| **B3 Dialog** | Skala 0,94 → 1 dan fade (`base`) dari tengah, tutup dengan `accelerate` 150 ms |
| **B4 Elemen bersama** | Foto calon (header ↔ profil) dan kartu tahap ↔ halaman tahap memakai `view-transition-name` agar terasa “mengembang”. Cadangan: fade |

**Kelompok C — Interaksi mikro**

| Animasi | Spesifikasi |
| --- | --- |
| **C1 Tekan** | Skala 0,97 dan state ditekan dalam 90 ms, kembali dengan pegas. Kartu: skala 0,985 dan bayangan turun. Baris daftar: riak tipis Sky 200 |
| **C2 Switch, checkbox, radio** | Thumb meluncur dengan pegas 180 ms, centang tergambar (180 ms) disertai pop kecil, getar ringan |
| **C3 Fokus kolom** | Border berubah ke Azure 600 dan cincin Sky 200 melebar dalam 150 ms. Label tetap di atas (tidak melayang), ikon awalan ikut berwarna Azure |
| **C4 Galat** | Kolom bergoyang horizontal ±6 px ×3 (300 ms), pesan galat meluncur turun sambil fade (`fast`), getar ganda singkat |
| **C5 Tab dan segmented** | Indikator pil bergeser dengan pegas (`base`), teks crossfade, konten bergeser searah |
| **C6 Chip status berubah** | Warna crossfade 200 ms, ikon berganti dengan putar/skala, pop 1,08 → 1 |
| **C7 Toast dan snackbar** | Masuk dari atas (di bawah safe area) dengan pegas, hilang otomatis dalam 4 detik dengan garis timer di dasar, bisa digeser ke atas untuk menutup. Toast hapus menyertakan **Urungkan** |
| **C8 Geser untuk hapus** | Baris mengikuti jari, latar Coral 100 dan ikon sampah membesar sesuai jarak. Melewati 40% lebar: getar dan baris menciut (tinggi 220 ms). Efek karet di batas. Tidak tersedia untuk anggota Read |
| **C9 Urutkan dengan seret** | Item terangkat (skala 1,03, elevasi 3), item lain bergeser dengan pegas, dilepas dengan snap 180 ms. Hanya Pemilik dan Full |
| **C10 Count-up angka** | Nominal, persen, dan countdown hari menghitung naik 600 ms (ease-out) saat pertama tampil dan saat berubah. Angka tabular menjaga lebar tetap |
| **C11 Progress dan chart** | Bar terisi 600 ms disertai satu kilau. Ring: `stroke-dashoffset` 800 ms. Donut menyapu searah jarum jam 800 ms per segmen berurutan. Bar chart cashflow tumbuh dari dasar (stagger 50 ms). Sentuh batang memunculkan tooltip dengan pop |
| **C12 Flip dan geser kartu Q&A** | Flip `rotateY` 180° 450 ms (perspective 1000 px) dengan kilau menyapu. Geser kanan/kiri: kartu mengikuti jari dengan rotasi ± 8° lalu kembali dengan pegas atau terbang keluar, kartu berikutnya naik dari tumpukan (skala 0,95 → 1) |
| **C13 Haptic** | Getar pendek (10–15 ms) untuk konfirmasi, galat, dan melewati ambang geser, bila perangkat mendukung (Android). iOS web tidak menyediakan API getar sehingga tanpa haptic |

**Kelompok D — Rute dan momen perayaan**

| Animasi | Spesifikasi |
| --- | --- |
| **D1 Menggambar rute** | Saat Peta Rute dibuka, jalur tergambar dari Mulai sampai node aktif (`stroke-dashoffset` 900 ms ease-out). Node muncul berurutan dari bawah ke atas dengan pop (stagger 70 ms), label fade-in dari sisinya masing-masing, bagian di atas node aktif muncul redup. Kunjungan berikutnya dalam sesi hanya fade 150 ms |
| **D2 Node aktif** | Cincin denyut (skala 1 → 1,6, opasitas 0,5 → 0, loop 2 detik) dan chip Peach “Kamu di sini” yang melayang ±3 px (2,4 detik). Berhenti saat di luar layar atau tab tersembunyi |
| **D3 Selesaikan Tahap** | Ledakan cincin dari node (skala 1 → 2, fade 500 ms), konfetti ringan 16–24 partikel (Sky, Peach, Mint, 1,2 detik), segmen jalur terisi Azure 600 menuju node berikutnya (600 ms), node berikutnya berubah ke Aktif dengan pop, layar mengikuti ke node baru (500 ms), getar sukses, toast “Tahap selesai” |
| **D4 Tahap terkunci diketuk** | Node bergoyang ±4 px ×2 (240 ms), gembok bergetar, lalu bottom sheet naik, getar ringan |
| **D5 Layar Halal** | Aurora Sky bergerak lambat, bintang ★ besar menyala (skala dan cahaya), teks ucapan muncul per baris (stagger 120 ms), kelopak/konfetti jatuh lembut sekali selama 3 detik, angka ringkasan perjalanan menghitung naik. Setelah itu tenang tanpa loop berat |
| **D6 Empty state hidup** | Ilustrasi SVG dengan satu gerak lembut (melayang ±4 px, 3 detik). Berhenti saat reduced motion |
| **D7 Banner offline/online** | Meluncur turun 240 ms. Saat tersambung kembali, ikon sinkron berputar sampai antrean kosong, lalu berubah menjadi centang Mint dan hilang setelah 2 detik |
| **D8 Banner pasang aplikasi** | Sheet kecil naik dengan pegas, ikon aplikasi memantul sekali |

**Aturan performa dan kompatibilitas animasi**

1. Hanya animasi `transform` dan `opacity` (ditambah `clip-path` dan `stroke-dashoffset` untuk jalur). Tidak menganimasikan `width`, `height`, `top`, `left`, `box-shadow`, atau `filter` secara langsung; perubahan ukuran memakai teknik FLIP/`layout`.
2. Target **60 fps** di HP kelas menengah-bawah (RAM 3 GB). Pada uji, frame terlewat > 5% dianggap gagal.
3. **CSS animation** untuk loop, skeleton, dan denyut; **Motion (framer-motion) dengan `LazyMotion`** untuk sheet, drag, dan layout. Fitur drag/layout dimuat lazy hanya di layar yang memerlukannya. Anggaran gerak di JS awal ≤ 25 KB gzip. Tanpa Lottie, GSAP, atau three.js. Ilustrasi = SVG inline ≤ 4 KB per berkas, konfetti = canvas/CSS ≤ 2 KB.
4. `will-change` hanya pada elemen yang sedang bergerak. `backdrop-filter` maksimal dua elemen sekaligus dengan blur ≤ 20 px.
5. Loop dijeda saat elemen di luar layar (IntersectionObserver) atau tab tersembunyi (Page Visibility). Maksimal dua animasi loop aktif per layar.
6. **Mode ringan (otomatis, tanpa toggle baru):** aktif bila Save-Data menyala, memori perangkat ≤ 2 GB (bila terdeteksi), atau frame rate < 45 fps pada 1 detik pertama bersama `hardwareConcurrency` ≤ 4. Efeknya: efek kaca menjadi latar solid, hiasan rute, aurora bergerak, konfetti, flip 3D (menjadi crossfade), dan parallax dimatikan; durasi dipersingkat 30%.
7. **Reduced motion** (`prefers-reduced-motion: reduce`, mengikuti pengaturan sistem iOS dan Android): parallax, goyang, denyut, konfetti, pegas memantul, dan geser besar dihapus; transisi diganti fade ≤ 150 ms. Perubahan status tetap jelas lewat ikon dan teks.
8. Semua animasi dapat diinterupsi (ketuk atau tarik membatalkan gerak), tidak pernah memblokir input, dan tidak berkedip lebih dari 3 kali per detik.
9. View Transitions dan `animation-timeline` dipakai hanya dengan `@supports` dan cadangan. Semua animasi diuji di Safari iOS dan Chrome Android.

### 8.9 Spesifikasi Tampilan & Animasi per Halaman

Berlaku untuk **semua halaman, dari Login sampai akhir, tanpa terkecuali**. Setiap halaman, termasuk yang ditambahkan kemudian, wajib punya: (1) transisi masuk, (2) skeleton atau loader, (3) empty state, (4) state galat, dan (5) tampilan hanya-baca untuk anggota Read bila halaman itu punya kontrol ubah. Kode seperti A1 dan C8 merujuk ke katalog di 8.8.

**Awal dan autentikasi**

| Halaman | Tampilan | Animasi dan interaksi khas |
| --- | --- | --- |
| **Splash** | Latar Sky 300, logo di tengah, garis rute mini | A1 |
| **Login** | Latar Aurora Sky, logo kecil dan judul “Selamat datang kembali” (Display), kartu putih bersudut atas 32 px berisi kolom Email/username, Password (tombol tampil/sembunyi), tombol Primary “Masuk”, tautan “Lupa password” dan “Punya kode undangan? Gabung” | Logo, judul, dan kartu masuk berurutan (fade-up 16 px, stagger 60 ms). Latar aurora melayang pelan. C3 saat fokus, A4 pada tombol, C4 bila salah. Berhasil: tirai radial menuju Peta Rute. Kartu naik di atas keyboard sehingga tombol tetap terlihat |
| **Daftar** | Gaya sama dengan Login. Dua kelompok kolom: “Akun” (nama, email/username, password dengan petunjuk 8 karakter yang menyala saat terpenuhi) dan “Tentang Anda” (peran sebagai segmented Catin Pria / Catin Wanita, tanggal target akad opsional) | Masuk seperti Login, indikator segmented bergeser (C5), picker tanggal bawaan perangkat. Berhasil: Peta Rute terbuka dengan Tahap 1 muncul pop (D1) |
| **Gabung (kode undangan)** | Kolom kode 8 karakter berupa kotak terpisah (48×56 px) dengan pindah otomatis dan dukungan tempel, tombol “Gabung” | Kotak berisi muncul pop saat diisi. Kode salah: seluruh baris bergoyang (C4). Berhasil: kotak berubah Mint berurutan (stagger 40 ms) lalu transisi ke Peta Rute |
| **Lupa password (P1)** | Satu kolom email, lalu form password baru | Gaya form seperti Login. Berhasil: ilustrasi amplop meluncur sekali |
| **Kebijakan Privasi dan Syarat** | Teks 16/26, daftar isi menempel, bagian berupa accordion | Slide masuk (B1), accordion mengembang (`base`), garis progres baca 3 px di atas |

**Inti rute**

| Halaman | Tampilan | Animasi dan interaksi khas |
| --- | --- | --- |
| **Peta Rute (Beranda)** | Hero Aurora (sapaan, foto calon, “Tahap X dari 8”, countdown Display, tombol Lanjutkan), kanvas rute, lalu kartu ringkas (anggaran, tagihan, tugas) yang muncul sesuai tahap | D1 dan D2. Hero mengecil saat scroll. C10 pada angka. Skeleton: jalur abu-abu dengan node bulat berkilau |
| **Sheet tahap terkunci** | Ikon gembok, kalimat penjelas, tombol “Ke tahap saat ini” | B2 dan D4 |
| **Dialog Selesaikan Tahap** | Daftar Syarat Selesai dengan centang, tombol Primary aktif bila lengkap | B3. Centang syarat tergambar berurutan saat dibuka, tombol aktif muncul dengan pop, lalu D3 |
| **Dialog Buka Kembali Tahap (Pemilik)** | Kolom alasan wajib, tombol Destructive | B3, kolom alasan fokus otomatis |

**Tahap 1–8 dan Halal**

| Halaman | Tampilan | Animasi dan interaksi khas |
| --- | --- | --- |
| **1. Persetujuan Ta’aruf** | Header tahap dengan ring progress syarat. Segmented: Biodata · Kesehatan & Keluarga · Perantara · Keputusan. Bagian berupa kartu accordion, foto bulat dengan tombol kamera, keputusan berupa tiga kartu pilih (Setuju lanjut / Belum memutuskan / Tidak lanjut) | Accordion (`base`). Kartu pilih terpilih: border Azure 600 dan centang pop. Data pribadi yang di-blur terbuka dengan transisi blur 200 ms saat diketuk. Foto: B4 dan sheet potong |
| **2. Proses Ta’aruf** | Kategori A–I sebagai kartu bento dengan ring progress. Kartu pertanyaan besar (Title 2) dengan empat chip status. Segmented mode: Acak · Per Kategori · Belum Sepakat. Ringkasan kesepakatan | C12 (flip dan geser), C11 (ring), chip status memantul (C6). Ledakan kecil saat satu kategori mencapai 100% |
| **3. Kesepakatan Khitbah** | Kartu ringkasan (poin sepakat dengan centang Mint, poin berbeda dengan ikon peringatan), kartu restu keluarga (switch), form acara, tiga kartu keputusan | Poin masuk berurutan (stagger 40 ms), C2 pada switch, tombol “Sudah saya tinjau” menjadi centang tergambar |
| **4. Proses Khitbah** | Segmented: Seserahan · Rundown · Biaya · Pelaksanaan. Seserahan berupa baris-kartu dengan thumbnail 56 px, chip status, dan stepper 5 langkah (Ingin → Sudah Dikemas). Rundown berupa timeline vertikal dengan jam di kiri | Stepper: titik terisi dan garis tumbuh (`base`). Timeline tergambar saat masuk. C9 untuk urutan, C8 untuk hapus, C10 untuk total, C11 untuk progress |
| **5. Kesepakatan Akad & Anggaran** | Kartu ringkasan anggaran dengan donut, kartu pos, kartu Mahar khusus, sumber dana, callout Peach 100 untuk saran tabungan per bulan | C11 (donut), C10, kartu pos mengembang (`base`) |
| **6. Administrasi & Berkas KUA** | Segmented Catin Pria / Catin Wanita. Checklist dengan chip 4 status, kartu rekomendasi (pertanyaan numpang nikah berupa switch), timeline TT dan Bimwin, disclaimer berupa callout Sky 100 | Centang tergambar dan progress naik, form rekomendasi mengembang saat switch aktif, A5 untuk unggah scan |
| **7. Persiapan Walimah** | Segmented: Vendor · Tamu · Panitia. Vendor berupa baris-kartu dengan bar pembayaran (DP → Lunas) dan bar chart cashflow. Tamu berupa kartu kuota (gauge setengah lingkaran) dan daftar. Panitia berupa kartu orang dengan avatar serta tombol Telepon/WhatsApp | C11 (bar chart dan gauge). Melebihi kuota: gauge berubah Coral dan bergoyang sekali. Tombol telepon memakai C1 |
| **8. Hari-H: Akad & Walimah** | Checklist H-1 berupa kartu centang besar, rundown timeline, penutupan | Centang tergambar. Penanda “Akad terlaksana” memicu ledakan kecil sebelum Selesaikan Tahap (D3) |
| **Halal** | Layar tujuan penuh dengan bintang ★ | D5 |

**Halaman pendukung**

| Halaman | Tampilan | Animasi dan interaksi khas |
| --- | --- | --- |
| **Profil (Saya dan Calon)** | Segmented Saya · Calon, foto bulat besar, kartu info. Pada layar ≥ 600 px kedua profil tampil berdampingan | B4 pada foto. Geser antar profil dengan indikator titik |
| **Pengaturan** | Daftar berkelompok gaya iOS: ikon dalam lingkaran Sky 100, switch, chevron. Area berbahaya terpisah di bawah dengan Coral | Baris memakai C1, masuk berurutan, dialog konfirmasi Destructive (B3) |
| **Anggota dan Hak Akses (Pemilik)** | Daftar anggota (avatar, nama, lencana Read/Full) dengan switch Read ↔ Full. Kartu undangan dengan kode besar (Display, tabular), ketuk untuk menyalin. Peringatan privasi berupa callout Peach 100 | Lencana berganti dengan crossfade dan pop (C6). Kode muncul karakter demi karakter. “Tersalin” berubah menjadi centang. Geser untuk cabut akses (C8) dengan konfirmasi |
| **Notifikasi (P1)** | Daftar dikelompokkan per hari, penanda belum dibaca berupa titik Azure | Item masuk berurutan, lonceng bergoyang saat ada yang baru, C8 |
| **Kalender dan Timeline (P1)** | Strip minggu dan daftar agenda, timeline mundur dari tanggal akad | Penanda tanggal berupa pil yang bergeser (C5), agenda masuk berurutan |
| **Tugas (P1)** | Daftar centang per tahap | Centang tergambar, teks tercoret dengan animasi, progress naik |
| **Aksi Cepat (P1)** | Tombol melayang 56 px di kanan bawah (di atas safe area) yang membuka sheet aksi | Muncul dengan pop, ikon ＋ berputar 45° menjadi ×, aksi keluar berurutan (stagger 40 ms) |
| **Catatan dan Doa (P2)** | Kartu jurnal, teks Arab Noto Naskh 22/36 rata kanan | Masuk dan aksi seperti daftar lain |
| **Persiapan Rumah Tangga (P2)** | Kartu daftar dan checklist | Masuk dan aksi seperti daftar lain |

**Admin**

| Halaman | Tampilan | Animasi dan interaksi khas |
| --- | --- | --- |
| **Daftar pengguna** | Pencarian, baris-kartu (nama, email, status, pemakaian disk), aksi di bottom sheet | A3, masuk berurutan, switch nonaktifkan (C2) |
| **Statistik dan pemakaian disk** | Kartu angka (Display) dan bar pemakaian disk | C10 dan C11 |
| **Backup** | Daftar snapshot dengan tombol unduh | Ring progress unduh lalu centang (A4) |

**Halaman sistem**

| Halaman | Tampilan | Animasi dan interaksi khas |
| --- | --- | --- |
| **Offline** | Ilustrasi awan terputus, penjelasan bahwa perubahan akan dikirim saat tersambung | D6 dan D7 |
| **Galat dan 404** | Ilustrasi jalur rute yang terputus dan tombol “Kembali ke Rute” | Jalur yang terputus tersambung kembali saat tombol ditekan, lalu B1 |
| **Banner pasang aplikasi** | Sheet kecil berisi ikon, penjelasan, dan petunjuk iOS bila perlu | D8 |
| **Toast dan dialog konfirmasi** | Komponen global | C7 dan B3 |

### 8.10 PWA, Ikon & Splash

- `manifest.webmanifest`: `name` “Road To Halal”, `short_name` “RoadToHalal”, `display: standalone`, **`theme_color` `#9FD3FF`** (status bar Android berwarna Biru Muda), **`background_color` `#9FD3FF`** (splash Android menyatu dengan ikon), orientasi tidak dikunci, ikon 192/512 dan maskable, shortcut **Lanjutkan Tahap** (ke tahap aktif) dan **Peta Rute**.
- **Ikon aplikasi: logo tetap sama seperti ikon yang ada saat ini** (tidak digambar ulang dan proporsinya tidak diubah). **Hanya latar belakangnya diganti menjadi Biru Muda polos (Sky 300, `#9FD3FF`).**

| Aset | Ukuran | Aturan |
| --- | --- | --- |
| Ikon `any` | 192×192 dan 512×512 PNG | Logo di atas latar Sky 300 penuh |
| Ikon `maskable` | 512×512 PNG | Latar Sky 300 penuh, logo di dalam **zona aman lingkaran 80% tengah** agar tidak terpotong bentuk ikon Android |
| Apple touch icon | 180×180 PNG | Persegi penuh dan **opak** berlatar Sky 300, tanpa sudut membulat (iOS yang membulatkan) dan tanpa transparansi (iOS mengubahnya menjadi hitam) |
| Favicon | SVG dan 32/48 px | Logo di atas Sky 300 |
| Ikon bertema Android 13 (opsional) | monochrome | Siluet satu warna dari logo yang sama |

- **Pemeriksaan logo:** kontras bagian logo terhadap `#9FD3FF` harus ≥ 3:1. Bila ada bagian logo yang terlalu terang, laporkan ke desainer; logo tidak diubah sepihak. Pratinjau di bentuk ikon bulat, squircle, dan teardrop sebelum rilis.
- **iOS:** `apple-mobile-web-app-capable`, `apple-mobile-web-app-title` “Road To Halal”, `apple-mobile-web-app-status-bar-style` = `default` (teks status bar gelap, terbaca di atas biru muda; diverifikasi di perangkat nyata), `viewport-fit=cover`. Gambar splash (`apple-touch-startup-image`) dibuat otomatis oleh skrip build untuk semua ukuran iPhone (SE sampai Pro Max) berlatar Sky 300 dengan logo di tengah.
- **Peluncuran mulus tanpa kilatan putih:** splash OS (Sky 300 + ikon) → splash aplikasi A1 (latar sama) → tirai radial ke layar pertama. `html { background: #9FD3FF }` diset di HTML awal sebelum CSS dimuat, lalu berganti ke Mist.
- Service worker: precache app shell, strategi stale-while-revalidate untuk GET API, halaman offline, dan antrean tulis saat offline. **Server tetap menjadi sumber kebenaran** untuk kunci tahap dan hak akses: bila antrean offline ditolak (mis. level diturunkan ke Read atau tahap dibuka kembali), perubahan itu ditandai “Belum tersimpan” beserta alasan dan tidak dibuang diam-diam.
- Banner “Pasang Aplikasi” (Android: `beforeinstallprompt`; iOS: petunjuk Bagikan → Tambah ke Layar Utama) dengan animasi D8. Splash screen dan status bar mengikuti tema.

### 8.11 Checklist QA Tampilan

Sebelum rilis, setiap halaman di 8.9 diuji pada:

1. **Perangkat:** seluruh daftar di 8.2, di Safari iOS, PWA iOS, Chrome Android, dan Samsung Internet.
2. **Lebar:** 320, 360, 390, 430, 440, dan ≥ 600 px; portrait dan landscape.
3. **Skala teks:** 100%, 130%, dan 200% tanpa teks terpotong atau tombol keluar layar.
4. **Safe area dan keyboard:** notch, Dynamic Island, indikator home, bar gesture Android, serta keyboard terbuka pada setiap form (CTA dan kolom fokus tetap terlihat).
5. **Gerak:** 60 fps di HP RAM 2–3 GB, mode ringan menyala otomatis, `prefers-reduced-motion` mematikan gerak besar, animasi dapat diinterupsi.
6. **Jaringan:** 4G lambat (skeleton muncul dan hilang rapi), offline (banner dan antrean), peralihan online–offline.
7. **Kontras dan fokus:** teks ≥ 4,5:1, komponen ≥ 3:1, fokus terlihat, status tidak bergantung warna.
8. **Ikon dan splash:** ikon tampil benar di Android (bulat, squircle, teardrop) dan iOS, tanpa kilatan putih saat peluncuran.
9. **Hak akses:** tampilan Pemilik, Full, dan Read pada setiap halaman yang punya kontrol ubah.

## 9. Spesifikasi Tahap

### 9.0 Peta Rute (Beranda) & Aturan Alur

**Daftar tahap (urut dari bawah ke puncak)**

| # | Tahap | Cakupan | File data |
| --- | --- | --- | --- |
| 1 | **Persetujuan Ta’aruf** | Biodata, kesehatan & keluarga, perantara, nadzor & istikharah, keputusan | `taaruf.json` |
| 2 | **Proses Ta’aruf (Tanya Jawab)** | 57 kartu tanya jawab pranikah | `taaruf.json` |
| 3 | **Kesepakatan Khitbah** | Ringkasan kesepakatan, restu keluarga, tanggal dan lokasi khitbah | `khitbah.json` |
| 4 | **Proses Khitbah** | Seserahan, rundown, biaya khitbah, pelaksanaan, penetapan tanggal akad | `khitbah.json`, `budget.json` |
| 5 | **Kesepakatan Akad & Anggaran** | Mahar, pembagian anggaran, sumber dana, wali nasab | `budget.json` |
| 6 | **Administrasi & Berkas KUA** | Checklist berkas, surat rekomendasi, TT, cek kesehatan, Bimwin | `kua.json` |
| 7 | **Persiapan Walimah** | Tracker vendor dan cashflow, daftar tamu dan kuota katering, panitia keluarga | `budget.json`, `harih.json` |
| 8 | **Hari-H: Akad & Walimah** | Checklist H-1, rundown, penutupan akad | `harih.json` |
| ★ | **Halal** | Layar tujuan: ringkasan perjalanan dan doa | — |

**Aturan alur**

1. **Satu tahap aktif pada satu waktu.** `currentStage` disimpan di `route.json`. Tahap sebelum `currentStage` berstatus Selesai, tahap itu sendiri Aktif, dan semua tahap sesudahnya Terkunci.
2. Tahap berikutnya terbuka **hanya** lewat tombol **Selesaikan Tahap**. Tombol aktif bila semua **Syarat Selesai** tahap itu terpenuhi. Syarat dihitung otomatis di client dan **dihitung ulang oleh server** saat tombol ditekan (409 `REQUIREMENTS_NOT_MET` bila belum lengkap).
3. Tahap 1 terbuka sejak workspace dibuat. Tidak ada lompat tahap, dan tidak ada pengecualian untuk Pemilik, Full, maupun Admin.
4. Tahap Selesai tetap dapat dibuka dan diedit oleh Pemilik dan Full. Mengedit tidak mengunci ulang tahap lain.
5. **Buka Kembali Tahap** hanya oleh Pemilik, hanya untuk tahap terakhir yang selesai, dengan konfirmasi dan alasan wajib. Tahap aktif kembali Terkunci dan datanya tetap tersimpan. Riwayat dicatat di `route.json`.
6. **Persimpangan keputusan:** di Tahap 1 dan Tahap 3, jika salah satu pihak memilih **Tidak lanjut**, status rute menjadi *berhenti* dan seluruh tahap menjadi hanya-baca; Pemilik tetap bisa export data. “Mulai ta’aruf baru” (data lama diarsipkan) tersedia di P1.
7. Anggota Read melihat rute yang sama persis, termasuk gembok dan progres syarat, tetapi tidak bisa menyelesaikan tahap.

**Isi Beranda di atas rute:** sapaan dan foto calon, “Tahap X dari 8”, countdown ke tanggal akad (setelah ditetapkan), tombol **Lanjutkan**, serta kartu ringkas yang muncul sesuai tahap: tugas terdekat (P1), ringkasan anggaran (setelah Tahap 4), dan pengingat tagihan vendor yang mendekati jatuh tempo (setelah Tahap 7).

### 9.1 Tahap 1 — Persetujuan Ta’aruf

**A. Biodata mendalam (Saya dan Calon, P0)**

- Identitas: foto, nama lengkap dan panggilan, tempat/tanggal lahir (usia otomatis), tinggi/berat, suku, domisili, status (lajang/janda/duda), kontak, media sosial, perantara (murabbi/pendamping) dan kontaknya.
- Pendidikan, pekerjaan, rentang penghasilan (opsional), hobi, kelebihan dan kekurangan, visi misi pernikahan, hafalan Qur’an, rutinitas ibadah, kajian/komunitas.
- Foto dan data calon dapat diedit dari sini maupun dari Profil → Pengaturan Calon.

**B. Riwayat kesehatan & keluarga (P0)**

- Kesehatan: golongan darah dan rhesus, alergi, penyakit kronis, riwayat operasi/rawat inap, obat rutin, hasil cek (hepatitis B, thalassemia, dll.), catatan kesehatan mental/konseling (opsional), kebiasaan (merokok/olahraga).
- Keluarga: nama dan pekerjaan ayah/ibu, wali nasab, jumlah dan urutan saudara, riwayat penyakit keturunan, kondisi keluarga secara umum.
- Setiap bagian punya penanda “pribadi” dan pengaturan sembunyikan di layar (blur) untuk privasi. Pengisian detail bersifat opsional; yang diwajibkan hanya penanda “sudah saling bertukar”.

**C. Perantara, Nadzor & Istikharah (P0)**

- Perantara/pendamping dan kontaknya, checklist **Nadzor** dan **Istikharah** (tanggal dan catatan masing-masing), serta kriteria pro-kontra.

**D. Keputusan persetujuan (P0)**

- Masing-masing untuk **Saya** dan **Calon**: *Setuju lanjut ta’aruf · Belum memutuskan · Tidak lanjut*, dengan catatan.

**Syarat Selesai:** field wajib biodata Saya dan Calon terisi (nama, tanggal lahir, domisili, pekerjaan, kontak) · perantara terisi · checklist Nadzor dan Istikharah tercentang · penanda “data kesehatan & keluarga sudah saling ditukar” tercentang · keputusan Saya dan Calon sama-sama *Setuju lanjut ta’aruf*.

### 9.2 Tahap 2 — Proses Ta’aruf (Tanya Jawab)

- **57 kartu bawaan** dalam 9 kategori (lihat Lampiran A) dan pengguna bisa menambah kartu sendiri.
- UI kartu bisa di-swipe/flip: pertanyaan di depan, di belakang ada **Jawaban Saya**, **Jawaban Calon**, catatan, penanda “prinsip (tidak bisa ditawar)”, dan status diskusi: *Belum dibahas · Dibahas · Sepakat · Perlu dibahas lagi*.
- Mode Acak, Per Kategori, dan Hanya yang Belum Sepakat. Progress per kategori dan progress total.
- Ringkasan Kesepakatan: daftar poin sepakat dan poin yang masih berbeda (dipakai di Tahap 3).
- Bila calon bergabung sebagai anggota Full, ia dapat mengisi Jawaban Calon sendiri (hak tulis per kolom di P2).

**Syarat Selesai:** tidak ada kartu berstatus *Belum dibahas* · tidak ada kartu berstatus *Perlu dibahas lagi* · semua kartu bertanda **Prinsip** berstatus *Sepakat*. Kartu yang dihapus (hapus lunak) tidak dihitung.

### 9.3 Tahap 3 — Kesepakatan Khitbah

**A. Ringkasan kesepakatan (P0):** ditarik otomatis dari Tahap 2 (poin sepakat dan poin berbeda), dapat dibagikan ke keluarga (P1). Tombol **Sudah saya tinjau** mencatat bahwa ringkasan telah dibaca.

**B. Restu keluarga & wali (P0):** checklist *orang tua/wali pihak saya setuju* dan *orang tua/wali pihak calon setuju*, masing-masing dengan tanggal dan catatan.

**C. Kesepakatan acara khitbah (P0):** tanggal, jam, lokasi (+ link Google Maps), perkiraan jumlah keluarga hadir dari dua pihak, juru bicara penyampai maksud, dan catatan adab/aturan yang disepakati.

**D. Keputusan lanjut khitbah (P0):** untuk **Saya** dan **Calon**: *Lanjut khitbah · Belum memutuskan · Tidak lanjut*.

**Syarat Selesai:** ringkasan kesepakatan sudah ditinjau · restu keluarga kedua pihak tercentang · tanggal, jam, dan lokasi khitbah terisi · keputusan Saya dan Calon sama-sama *Lanjut khitbah*.

### 9.4 Tahap 4 — Proses Khitbah

**A. Seserahan/Hantaran (P0)**

- Item: nama, kategori (pakaian, alat ibadah, kosmetik, tas/sepatu, makanan, perhiasan, lainnya), untuk (calon wanita/pria), jumlah, ukuran/warna, estimasi harga, harga aktual, **link toko** (Shopee, Tokopedia, dll.), foto referensi, catatan.
- **Status pembelian:** *Ingin · Dibeli · Dikirim · Diterima · Sudah Dikemas*.
- Total estimasi vs aktual, progress bar, filter (status/kategori/untuk siapa), dan tombol “Buka toko”.
- Sinkron opsional ke pos “Biaya Khitbah” (lihat C).
- Template awal 20–25 item yang bisa dihapus atau diedit.

**B. Susunan Acara & Rundown (P0)**

- Info tanggal, jam, dan lokasi terisi otomatis dari Tahap 3 dan dapat diubah. Jumlah keluarga hadir dari dua pihak.
- Template susunan acara: pembukaan MC → tilawah → sambutan keluarga pria → penyampaian maksud → sambutan keluarga wanita → jawaban lamaran → penyerahan seserahan → pembicaraan tanggal akad → doa → ramah tamah → penutup.
- Tiap item punya durasi, PIC, dan catatan; jam mulai dan selesai terhitung otomatis; urutan bisa digeser (drag).
- Daftar keluarga yang hadir per pihak, **checklist persiapan hari khitbah**, dan bagikan rundown sebagai teks WhatsApp/PDF (P1).

**C. Biaya Khitbah (P0):** panel untuk pos “Biaya Khitbah” (target anggaran dan daftar item dengan estimasi, aktual, status bayar). Data disimpan di `budget.json` sehingga otomatis muncul di Tahap 5.

**D. Pelaksanaan (P0):** penanda **Khitbah terlaksana** (tanggal dan catatan hasil) dan penetapan **tanggal akad**, yang mengisi target akad dan mengaktifkan countdown di Beranda.

**Syarat Selesai:** semua item seserahan berstatus *Sudah Dikemas* (item yang tidak jadi dibeli dihapus) · semua item checklist persiapan hari khitbah selesai · *Khitbah terlaksana* ditandai dengan tanggal · tanggal akad terisi.

### 9.5 Tahap 5 — Kesepakatan Akad & Anggaran

**A. Pemisahan anggaran (P0)**

- Tiga pos utama: **Biaya Khitbah** (terisi dari Tahap 4), **Mahar**, **Biaya Akad/Walimah**, ditambah pos kustom.
- Tiap pos: target anggaran, daftar item (nama, kategori, estimasi, aktual, status bayar), dan ringkasan Anggaran / Terpakai / Sisa dengan donut chart.
- **Mahar:** bentuk (uang, emas, seperangkat alat salat, lainnya), nominal/deskripsi, catatan, status disiapkan.
- **Sumber dana:** tabungan, bantuan keluarga, dan lainnya. Aplikasi menghitung total dana vs kebutuhan, kekurangan, dan saran target tabungan per bulan sampai tanggal akad.

**B. Kesepakatan akad (P0):** tanggal akad (dari Tahap 4, dapat diubah), lokasi akad/walimah, **wali nasab** (nilai awal diambil dari Tahap 1), persetujuan kedua keluarga atas tanggal dan anggaran, serta catatan pembagian biaya antar keluarga.

**Syarat Selesai:** tanggal akad terisi · mahar terisi (bentuk dan nominal/deskripsi) · target pos Mahar dan Biaya Akad/Walimah terisi · minimal satu sumber dana · wali nasab terisi · persetujuan kedua keluarga tercentang.

### 9.6 Tahap 6 — Administrasi & Berkas Negara (KUA)

**A. Checklist dokumen Catin Pria dan Wanita (P0)**

Dua tab: **Catin Pria** dan **Catin Wanita**. Item bawaan:

- KTP, Kartu Keluarga, Akta Kelahiran/ijazah, Pasfoto latar biru (catat ukuran dan jumlah), Surat Pengantar RT/RW.
- **N1** (keterangan untuk nikah), **N2** (asal-usul), **N3** (persetujuan mempelai), **N4** (keterangan orang tua) dari Kelurahan/Desa.
- Kondisional: **N5** (izin orang tua bila < 21 tahun), **N6** atau akta cerai/surat kematian pasangan (janda/duda), dispensasi usia, izin atasan (TNI/Polri/ASN), surat keterangan sehat, sertifikat Bimwin.
- Tiap item: status (*Belum · Diurus · Selesai · Tidak berlaku*), jumlah fotokopi, tanggal urus, tempat mengurus, catatan, dan upload scan/foto. Pengguna bebas menambah dan menghapus item karena syarat bisa berbeda antar KUA.

**B. Surat Rekomendasi Nikah (P0)**

- Pertanyaan awal: “Menikah di luar wilayah KUA domisili (numpang nikah)?” Jika ya, form muncul.
- Isian: KUA asal, KUA tujuan, tanggal pengajuan, status (*Belum diajukan · Diajukan · Terbit · Diserahkan ke KUA tujuan*), nomor surat, lampiran, catatan.
- Tanggal pendaftaran nikah ke KUA dan pengingat batas waktu pendaftaran. Informasi umumnya paling lambat 10 hari kerja sebelum akad; verifikasi ke KUA setempat.

**C. Kesehatan & Bimbingan (P0)**

- **Jadwal suntik TT** (TT1, TT2, dst.) dan **cek kesehatan pranikah**: tanggal, faskes/lokasi, status, hasil (upload), untuk pria dan wanita.
- **Bimbingan Perkawinan (Bimwin):** tanggal, lokasi atau online, status, nomor/foto sertifikat.
- Kolom opsional untuk skrining Elsimil (BKKBN).
- Semua jadwal masuk ke Kalender dan pengingat.

> Disclaimer di aplikasi: daftar syarat bersifat panduan umum, bukan pengganti informasi resmi dari KUA setempat.

**Syarat Selesai:** semua item checklist Catin Pria dan Wanita berstatus *Selesai* atau *Tidak berlaku* · surat rekomendasi berstatus *Diserahkan ke KUA tujuan* (bila numpang nikah) · pendaftaran nikah ke KUA ditandai terdaftar dengan tanggal · TT dan cek kesehatan pranikah berstatus selesai · Bimwin selesai dengan nomor/foto sertifikat.

### 9.7 Tahap 7 — Persiapan Walimah

**A. Tracker pembayaran vendor (P0)**

- Vendor: nama, kategori (katering, dekor, MUA, foto/video, gedung, busana, undangan, sound, dll.), kontak, catatan kontrak.
- Angka: **Total Harga**, **Nominal DP**, **Sisa Tagihan** (otomatis), **Jatuh Tempo**, dan riwayat pembayaran (bisa banyak termin) dengan **upload bukti transfer**. Biaya vendor otomatis masuk ke pos “Biaya Akad/Walimah”.
- Status otomatis: Belum DP · DP · Lunas · Terlambat. Daftar diurutkan dari jatuh tempo terdekat, lalu pengingat H-7/H-3/H-1 (in-app, push di P1).
- **Cashflow:** grafik batang bulanan dari tagihan terjadwal berdasarkan jatuh tempo, ditambah total sudah dibayar dan masih harus dibayar.
- Export CSV (P1).

**B. Daftar tamu & kuota katering (P0)**

- Tamu: nama, kategori (keluarga pria/wanita, teman, kolega, tetangga, VIP), jumlah orang (pax), kontak, sesi (akad/walimah), catatan (diet/meja), status undangan (*Belum · Diundang · Konfirmasi · Hadir*).
- **Kuota katering:** isi kuota porsi dari vendor, lalu aplikasi menghitung total pax vs kuota, sisa, dan **peringatan saat melebihi kuota**, juga rincian per pihak (pria/wanita).
- Pencarian, filter, import CSV (P1), tombol kirim undangan via WhatsApp dengan template pesan (P1).

**C. Panitia keluarga (P0)**

- Peran bawaan: PIC buku tamu, PIC mahar, PIC katering, PIC dokumentasi, PIC penerima tamu, PIC parkir, MC, **wali nasab**, dan **2 saksi nikah**.
- Tiap orang: nama, hubungan keluarga, kontak, tugas, status konfirmasi. Ada tombol Telepon/WhatsApp sekali sentuh. Untuk saksi dan wali ada checklist kelengkapan identitas.

**Syarat Selesai:** semua vendor terdaftar berstatus *DP* atau *Lunas* dan tidak ada yang *Terlambat* · total pax tidak melebihi kuota katering · wali nasab dan 2 saksi berstatus *Konfirmasi* · semua tamu berstatus minimal *Diundang*.

### 9.8 Tahap 8 — Hari-H: Akad & Walimah

- **Checklist H-1 dan daftar bawaan (P0):** dokumen, mahar, seserahan akad, busana, perlengkapan, dan pembagian tugas.
- **Rundown Hari-H per jam (P1):** urutan acara akad/walimah, PIC, dan catatan.
- **Mode check-in tamu (P2):** tandai tamu hadir saat acara.
- **Penutupan (P0):** penanda **Akad terlaksana** (tanggal dan catatan). Penanda *Walimah terlaksana* bersifat opsional.

**Syarat Selesai:** semua item checklist H-1 selesai · *Akad terlaksana* ditandai.

### 9.9 Tujuan — Halal

Terbuka setelah Tahap 8 selesai. Layar penutup berisi ucapan dan doa, **ringkasan perjalanan** (lama perjalanan, jumlah tahap, anggaran terpakai vs target), tombol export data, dan pintu masuk ke modul pascanikah (P2). Semua tahap tetap dapat dibuka untuk ditinjau.

### 9.10 Modul Pendukung (Tidak Berurutan)

| Modul | Prioritas | Isi |
| --- | --- | --- |
| **Profil & Pengaturan** | P0 | Dibuka dari avatar di header, tidak terkunci. Lihat bagian 7 dan 10 |
| **Kalender & Timeline** | P1 | Gabungan tanggal dari tahap yang sudah terbuka: khitbah, TT, Bimwin, jatuh tempo vendor, akad. Mundur dari tanggal target (H-180, H-90, H-30, H-7) |
| **Tugas** | P1 | To-do lintas tahap dengan template per fase; tugas dari tahap terkunci tidak ditampilkan |
| **Catatan & Doa** | P2 | Jurnal, doa/dzikir pilihan, bahan muhasabah |
| **Persiapan Rumah Tangga** | P2 | Daftar perabot, kontrak/KPR, rencana bulan pertama. Terbuka setelah Halal |

## 10. Profil Calon & Pengaturan Data

- Halaman **Profil → Calon**: foto (kamera atau galeri, crop bulat), nama lengkap dan panggilan, tanggal lahir, kontak, asal, pekerjaan, status proses, perantara, dan catatan.
- Foto dan nama calon tampil di header Beranda, kartu Q&A, dan rundown.
- **Profil → Saya** dengan struktur serupa, sehingga bisa dibandingkan berdampingan.
- Profil dan Pengaturan tidak terkunci oleh rute. Untuk anggota Read, semua isian profil bersifat hanya-baca.
- **Data & Backup (Pemilik):** export semua data (ZIP: JSON + foto; juga untuk Full), import dari export, dan hapus data per modul.

## 11. Model Data (Ringkas)

```ts
type Meta = { id: string; createdAt: string; updatedAt: string; deletedAt?: string }

// --- Rute & tahap ---
type StageKey =
  | 'persetujuan-taaruf' | 'proses-taaruf' | 'kesepakatan-khitbah' | 'proses-khitbah'
  | 'kesepakatan-akad' | 'administrasi-kua' | 'persiapan-walimah' | 'hari-h' | 'halal'
const STAGE_ORDER: StageKey[] = [ /* urutan di atas, indeks 0–8 */ ]

type RouteState = {
  schemaVersion: number; rev: number
  currentStage: StageKey                     // sebelum = selesai, sama = aktif, sesudah = terkunci
  status: 'berjalan' | 'berhenti' | 'selesai' // berhenti = ada keputusan “tidak lanjut”
  completed: Partial<Record<StageKey, { at: string; by: string }>>
  reopenLog: { stage: StageKey; at: string; by: string; reason: string }[]
}

// --- Workspace & hak akses ---
type AccessLevel = 'read' | 'full'
type Member = {
  userId: string; name: string; relation: string
  access: AccessLevel; joinedAt: string; lastSeenAt?: string
}
type Invite = { code: string; access: AccessLevel; relation: string; expiresAt: string; usedBy?: string }
type Workspace = { id: string; ownerId: string; members: Member[]; invites: Invite[]; quotaMB: number }

// Aturan yang sama dipakai UI dan API (lib/route, lib/access)
const idx = (s: StageKey) => STAGE_ORDER.indexOf(s)
const isUnlocked = (r: RouteState, s: StageKey) => idx(s) <= idx(r.currentStage)
const canRead  = (r: RouteState, s: StageKey) => isUnlocked(r, s)
const canWrite = (level: AccessLevel | 'owner', r: RouteState, s: StageKey) =>
  level !== 'read' && isUnlocked(r, s) && r.status !== 'berhenti'

// --- Data modul ---
type QACard = Meta & {
  category: string; question: string; custom?: boolean
  answerSelf?: string; answerPartner?: string; note?: string
  principle?: boolean; status: 'belum' | 'dibahas' | 'sepakat' | 'ulang'
}

type Gift = Meta & {
  name: string; category: string; forWho: 'pria' | 'wanita'
  qty: number; estimate: number; actual?: number; storeUrl?: string
  status: 'ingin' | 'dibeli' | 'dikirim' | 'diterima' | 'dikemas'
}

type Payment = { id: string; date: string; amount: number; proofFileId?: string }
type Vendor = Meta & {
  name: string; category: string; contact?: string
  total: number; downPayment: number; payments: Payment[]
  dueDate?: string  // sisa tagihan = total - sum(payments)
}

type Guest = Meta & {
  name: string; group: string; pax: number; side: 'pria' | 'wanita'
  session: 'akad' | 'walimah' | 'keduanya'
  status: 'belum' | 'diundang' | 'konfirmasi' | 'hadir'
}
```

## 12. API (Ringkas)

| Endpoint | Fungsi |
| --- | --- |
| `POST /api/auth/register · login · logout` | Autentikasi |
| `GET /api/route` | Status rute: tahap aktif, status tiap tahap, dan progres Syarat Selesai (dihitung server) |
| `POST /api/route/complete` | Selesaikan tahap aktif. Server menghitung ulang syarat. Hanya Pemilik/Full |
| `POST /api/route/reopen` | Buka kembali tahap terakhir yang selesai. Hanya Pemilik, alasan wajib |
| `GET/POST/PATCH/DELETE /api/members` | Undangan, daftar anggota, ubah level Read/Full, cabut akses. Hanya Pemilik |
| `POST /api/members/join` | Bergabung dengan kode undangan |
| `GET /api/m/{module}` | Ambil data modul workspace. Hanya bagian dari tahap yang sudah terbuka |
| `POST/PATCH/DELETE /api/m/{module}/items/{id}` | Operasi per item (di dalam lock). Ditolak untuk anggota Read |
| `POST /api/m/{module}/reorder` | Ubah urutan item. Ditolak untuk anggota Read |
| `POST /api/files` · `GET /api/files/{id}` | Upload (Pemilik/Full) dan unduh file (cek sesi, keanggotaan, dan tahap) |
| `GET /api/export` · `POST /api/import` | Export (Pemilik/Full) dan import (Pemilik) data workspace |
| `/api/admin/*` | Kelola pengguna dan backup (khusus admin) |

**Pemetaan data ke tahap minimum** (dipakai `guard`)

| Bagian data | Tahap minimum |
| --- | :---: |
| `taaruf`: biodata, kesehatan, keluarga, perantara, keputusan | 1 |
| `taaruf`: kartu Q&A | 2 |
| `khitbah`: ringkasan, restu keluarga, kesepakatan acara | 3 |
| `khitbah`: seserahan, rundown, pelaksanaan · `budget`: pos Biaya Khitbah | 4 |
| `budget`: mahar, pos anggaran, sumber dana | 5 |
| `kua` (semua) | 6 |
| `budget`: vendor dan pembayaran · `harih`: tamu, kuota, panitia | 7 |
| `harih`: checklist H-1, rundown, penutupan | 8 |

**Kode penolakan:** `401` belum login · `403 STAGE_LOCKED` tahap belum terbuka · `403 READ_ONLY` anggota Read mencoba menulis · `403 OWNER_ONLY` aksi khusus Pemilik · `409 REQUIREMENTS_NOT_MET` syarat selesai belum lengkap.

Keamanan: validasi zod di semua endpoint, cek Origin/CSRF, header keamanan (CSP, X-Frame-Options), path file tidak diambil dari input pengguna, dan setiap request hanya boleh mengakses `workspaceId` tempat sesi menjadi anggota, setelah lolos `guard` (keanggotaan → tahap → level akses).

## 13. Kebutuhan Non-Fungsional

- **Performa:** LCP < 2,5 detik di 4G, CLS < 0,1, INP < 200 ms, JS awal < 200 KB (termasuk anggaran gerak ≤ 25 KB), font ≤ 120 KB, respons API p95 < 300 ms, tanpa library berat. Animasi 60 fps di HP kelas menengah-bawah. Peta Rute dirender dengan SVG ringan (tanpa library grafik).
- **Keandalan:** penulisan atomik, backup harian, pemulihan otomatis dari `.bak`, log error terstruktur ke file.
- **Kompatibilitas:** Safari iOS 16.4+ (browser dan PWA), Chrome dan Samsung Internet di Android, layar 320–440+ px termasuk foldable; desktop dan tablet sebagai tampilan sekunder (konten terpusat, lebar maks. 520 px). Detail di 8.2.
- **Aksesibilitas:** label jelas, fokus terlihat, area sentuh ≥ 48 px untuk aksi utama (minimal 44 px), kontras teks ≥ 4,5:1, mendukung skala teks hingga 200%, menghormati `prefers-reduced-motion`, status tidak bergantung warna saja (gembok, centang, penanda lokasi, dan outline selalu menyertai warna), rute tersedia sebagai daftar berurutan untuk pembaca layar, node terkunci `aria-disabled`.
- **Bahasa:** Bahasa Indonesia (format Rupiah, tanggal Indonesia). Struktur teks disiapkan agar mudah ditambah bahasa lain.
- **Skalabilitas:** nyaman untuk ribuan pengguna dengan konkurensi rendah–sedang; ada jalur migrasi lewat `StorageAdapter`.

## 14. Roadmap (Estimasi)

Estimasi direvisi dari v1.0 karena ada tambahan Peta Rute, penguncian tahap, dan hak akses (v1.1), serta sistem UI/UX dan animasi (v1.2).

| Fase | Durasi | Cakupan |
| --- | --- | --- |
| **Fase 1 – Fondasi** | 2–3 minggu | Setup proyek, design system (token warna Sky, tipografi, spasi, gerak), splash dan loading, header + **Peta Rute** (SVG, node, status, auto-scroll), **guard tahap di UI dan API**, PWA dasar, auth, workspace + **anggota Read/Full**, `StorageAdapter` JSON + backup |
| **Fase 2 – Tahap 1–4** | 3–4 minggu | Profil, Persetujuan Ta’aruf, Tanya Jawab, Kesepakatan Khitbah, Proses Khitbah (CRUD, status, kalkulasi, Syarat Selesai), upload foto, Biaya Khitbah |
| **Fase 3 – Tahap 5–8** | 3–4 minggu | Anggaran dan mahar, KUA, vendor dan cashflow, tamu dan panitia, Hari-H, layar Halal, upload bukti/berkas, export/import |
| **Fase 4 – Penyempurnaan** | 3–4 minggu | Pengingat dan push, share WhatsApp, PDF/CSV, lupa password, kalender, mini-rute, Aksi Cepat, sakelar data pribadi, admin panel, polish animasi dan uji perangkat nyata iOS/Android (8.11), uji performa dan keamanan (termasuk uji penolakan tahap terkunci dan anggota Read) |
| **Fase 5 – Lanjutan** | Bertahap | Check-in tamu, kunci PIN, mulai ta’aruf baru (arsip), modul pascanikah |

## 15. Risiko & Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Hosting cPanel tanpa Node.js App | Cek sejak awal. Alternatif: VPS murah atau hosting Node khusus |
| Batas RAM/CPU shared hosting | Build lokal, tanpa modul native, cache memori, bundle kecil |
| File JSON rusak / tertimpa | Penulisan atomik, lock, operasi per item, `.bak`, backup harian |
| Disk penuh karena foto | Kompresi client, kuota per workspace, monitor di panel admin |
| Data sensitif bocor | File di luar `public_html`, akses via sesi, HTTPS, hash bcrypt, opsi blur, hapus akun, peringatan privasi saat mengundang anggota |
| Push notification di iOS terbatas | Pengingat in-app sebagai dasar; push sebagai tambahan |
| Syarat KUA berbeda | Checklist bisa diedit, status “Tidak berlaku”, dan disclaimer |
| **Alur ketat terasa kaku** (tugas di dunia nyata sering paralel, mis. DP vendor sebelum KUA selesai) | Tahap yang selesai tetap bisa diedit, Pemilik bisa buka kembali tahap terakhir, dan Syarat Selesai dibuat sepadat mungkin. Validasi ke calon pengguna sebelum rilis |
| **Kunci tahap atau hak Read ditembus lewat URL/API langsung** | Penegakan di server lewat `guard` pada setiap endpoint, bukan hanya di UI. Uji otomatis untuk semua kode penolakan |
| **Antrean offline ditolak server** (level diturunkan atau tahap dibuka kembali) | Perubahan ditandai “Belum tersimpan” dengan alasan, tidak dibuang diam-diam |
| **Anggota melihat data pribadi** | Peringatan saat membuat undangan, level Read sebagai default, sakelar sembunyikan data pribadi (P1) |
| **Peta Rute panjang di layar kecil** | Auto-scroll ke node aktif, header ringkas yang menempel, mini-rute di dalam tahap |
| **Animasi berat di HP kelas bawah** | Hanya `transform`/`opacity`, anggaran JS gerak, mode ringan otomatis, uji di HP RAM 2–3 GB |
| **Perbedaan perilaku Safari iOS dan Chrome Android** (`100vh`, keyboard, `backdrop-filter`, status bar PWA) | `dvh`, `visualViewport`, awalan `-webkit-`, cadangan `@supports`, uji di perangkat nyata (8.11) |
| **Kontras rendah pada warna biru muda** | Teks di atas Sky 300 selalu Navy, teks putih hanya di atas Azure/Navy, nilai kontras sudah diverifikasi (8.3) |
| **Logo saat ini kurang kontras di latar biru muda** | Periksa kontras ≥ 3:1 dan pratinjau di semua bentuk ikon. Logo tidak diubah sepihak (8.10) |
| **Dua font tambahan memperlambat muat** | Dua font variabel subset Latin, self-host, `display: swap`, cadangan font sistem, anggaran ≤ 120 KB |

## 16. Kriteria Penerimaan MVP

- Pengguna baru bisa mendaftar, mengisi profil dan foto calon, lalu semua data **tetap ada setelah logout/login dan restart server**.
- **Rute:** pada workspace baru hanya Tahap 1 yang Aktif; Tahap 2–8 dan Halal Terkunci (ikon gembok) dan **tidak bisa diketuk**. Membuka URL tahap terkunci langsung diarahkan ke tahap aktif, dan API mengembalikan `403 STAGE_LOCKED`.
- Tombol **Selesaikan Tahap** nonaktif sampai semua Syarat Selesai terpenuhi. Setelah ditekan, tahap berikutnya terbuka dan jalur beranimasi. Tidak ada cara melompati tahap.
- Pemilik dapat membuat undangan, menetapkan **Read** atau **Full**, dan mengubahnya kapan saja. Anggota Read tidak melihat kontrol tambah/ubah/hapus/unggah/selesaikan, dan API menolak penulisannya dengan `403 READ_ONLY`. Perubahan level berlaku tanpa login ulang.
- Kedelapan tahap bisa tambah/ubah/hapus data (oleh Pemilik dan Full) dan perubahan tersimpan otomatis, termasuk saat koneksi putus lalu tersambung lagi.
- Aplikasi dapat di-install sebagai PWA (Android dan iOS). Navigasi utama berupa **peta rute** (tanpa bottom navigation) dan tampil konsisten di layar 320–440 px.
- Palet **Biru Muda (Sky)** dan token di 8.3 dipakai konsisten di seluruh UI. Teks memenuhi kontras ≥ 4,5:1 dan status tidak bergantung pada warna saja.
- Tampilan benar tanpa teks terpotong atau elemen tertutup notch, indikator home, atau keyboard pada lebar 320–440 px di iOS (Safari dan PWA) dan Android (Chrome dan Samsung Internet), termasuk skala teks 200%.
- **Semua halaman**, dari Login sampai akhir (termasuk Admin dan halaman sistem), memiliki transisi masuk, skeleton atau loader, empty state, state galat, dan tampilan hanya-baca bila relevan, sesuai 8.9.
- Animasi berjalan sekitar 60 fps di HP uji kelas menengah-bawah. Mode ringan dan reduced motion berfungsi.
- Ikon aplikasi memakai logo yang sama dengan latar Biru Muda `#9FD3FF` di Android (maskable) dan iOS (apple-touch-icon), dan peluncuran tidak menampilkan kilatan putih.
- Dua workspace berbeda tidak pernah bisa melihat data satu sama lain.
- Berjalan di cPanel tanpa SQL, dan tersedia panduan deploy serta skrip backup.

## 17. Asumsi & Keputusan Terbuka

1. **Tahap 5–8** dan urutannya diturunkan dari modul di PRD v1.0 untuk melengkapi “dan seterusnya”. Urutan dan Syarat Selesai tiap tahap dapat disesuaikan.
2. **Pengatur hak akses** diasumsikan Pemilik workspace (Admin hanya untuk dukungan). Jika yang dimaksud pengaturan di level admin aplikasi, bagian 4 dan 7 perlu disesuaikan.
3. **Palet dan tipografi v1.2** (Sky, Azure, Navy, aksen Peach, status Mint dan Coral; Plus Jakarta Sans dan Inter) adalah rekomendasi desain. Semuanya berupa token sehingga dapat diganti tanpa mengubah komponen.
4. **Logo aplikasi** tidak tercantum dalam PRD ini, sehingga yang ditetapkan hanya aturan latar Biru Muda `#9FD3FF`. Keterbacaan logo saat ini di atas warna tersebut perlu dicek.
5. **Tanpa dark mode** (tidak berubah) dan **tanpa pengaturan animasi baru**: mode ringan dan reduced motion aktif otomatis.
6. **Syarat Selesai Tahap 2** cukup ketat (semua kartu dibahas, semua prinsip sepakat). Perlu divalidasi apakah kartu yang berbeda pendapat boleh lolos dengan catatan.
7. **Kerja paralel** (mis. mengurus KUA sambil memesan vendor) tidak didukung di v1 sesuai kebutuhan alur berurutan. Pertimbangkan pengecualian terbatas di versi berikutnya.
8. Satu akun terhubung ke **satu workspace** pada v1.

## Lampiran A — 57 Kartu Tanya Jawab Pranikah (Data Awal Tahap 2)

**A. Visi, Agama & Ibadah**

- Q1. Apa tujuan utama Anda menikah, dan seperti apa rumah tangga ideal menurut Anda?
- Q2. Bagaimana pembagian peran suami dan istri dalam ibadah dan pembinaan keluarga?
- Q3. Seberapa penting kajian rutin/komunitas bagi Anda, dan bagaimana jika berbeda pandangan dengan pasangan?
- Q4. Target ibadah apa yang ingin dicapai bersama (salat berjamaah, tilawah, hafalan, puasa sunnah)?
- Q5. Bagaimana sikap Anda terhadap perbedaan amalan di keluarga besar?
- Q6. Apa yang kita lakukan jika salah satu merasa imannya sedang menurun?

**B. Karier & Peran Istri**

- Q7. Bagaimana pandangan Anda tentang istri bekerja setelah menikah?
- Q8. Jika istri bekerja, bagaimana pembagian tugas rumah dan pengasuhan?
- Q9. Jika suami diminta pindah kota/negara karena pekerjaan, bagaimana sikap Anda?
- Q10. Bagaimana pandangan tentang istri berbisnis atau berkarya dari rumah?
- Q11. Apakah istri tetap bekerja setelah punya anak? Sampai kapan?
- Q12. Bagaimana jika penghasilan istri lebih besar dari suami?
- Q13. Bagaimana pandangan tentang melanjutkan pendidikan (S2/S3) setelah menikah?

**C. Keuangan Rumah Tangga**

- Q14. Siapa yang memegang dan mengatur keuangan rumah tangga?
- Q15. Berapa persen penghasilan untuk kebutuhan, tabungan, dan sedekah?
- Q16. Bagaimana pandangan tentang nafkah suami dan penghasilan istri sebagai hak pribadinya?
- Q17. Bagaimana sikap Anda terhadap utang, paylater, dan cicilan?
- Q18. Apakah ada tanggungan finansial saat ini (orang tua, adik, cicilan) yang perlu saya ketahui?
- Q19. Bagaimana rencana dana darurat, asuransi, dan investasi?
- Q20. Berapa batas pengeluaran yang wajib didiskusikan berdua?
- Q21. Bagaimana pandangan tentang membantu keuangan orang tua dan saudara?

**D. Tempat Tinggal Pascanikah**

- Q22. Setelah menikah, ingin tinggal mandiri, mengontrak, atau bersama orang tua?
- Q23. Jika awalnya tinggal bersama orang tua, sampai kapan dan apa batasannya?
- Q24. Kota atau lokasi seperti apa yang diinginkan? Siapkah pindah?
- Q25. Rencana memiliki rumah: KPR, menabung, atau sewa dulu?
- Q26. Bagaimana pembagian tugas rumah tangga dan kebersihan?

**E. Pola Asuh & Anak**

- Q27. Berapa jumlah anak yang diharapkan, dan bagaimana pandangan tentang jarak kelahiran?
- Q28. Bagaimana sikap kita jika belum dikaruniai anak dalam waktu lama?
- Q29. Bagaimana pandangan tentang KB, ASI, dan metode persalinan?
- Q30. Pendidikan anak: sekolah umum, Islam terpadu, pesantren, atau homeschooling?
- Q31. Gaya disiplin seperti apa yang kita sepakati (apresiasi, konsekuensi, batasan)?
- Q32. Siapa yang mengasuh anak sehari-hari: orang tua, ART, daycare, atau salah satu dari kita?
- Q33. Bagaimana aturan gadget dan screen time anak?
- Q34. Nilai apa yang paling ingin kita wariskan kepada anak?

**F. Keluarga & Batasan dengan Mertua**

- Q35. Seberapa sering kita mengunjungi keluarga masing-masing?
- Q36. Sejauh mana orang tua/mertua boleh ikut campur dalam keputusan rumah tangga?
- Q37. Bagaimana menyikapi perbedaan pendapat dengan mertua atau ipar?
- Q38. Bagaimana rencana jika orang tua membutuhkan perawatan di masa tua?
- Q39. Bagaimana kita menjalani adat, tradisi, mudik, dan hajatan keluarga?
- Q40. Siapa yang menjadi penengah saat ada konflik dengan keluarga besar?
- Q41. Hal apa dalam rumah tangga yang tidak boleh dibagikan ke keluarga besar?

**G. Komunikasi & Konflik**

- Q42. Bagaimana cara Anda menyampaikan kekecewaan, dan cara terbaik pasangan menyikapinya?
- Q43. Apa yang Anda lakukan saat marah, dan berapa lama jeda sebelum kita berdiskusi?
- Q44. Siapa pihak ketiga (murabbi/konselor) yang kita sepakati bila buntu?
- Q45. Bagaimana kesepakatan soal keterbukaan (HP, media sosial, keuangan)?
- Q46. Apa “bahasa kasih” Anda?
- Q47. Apa batas yang tidak boleh dilewati dalam berselisih (kekerasan, kata kasar, mengungkit masa lalu)?

**H. Kesehatan & Keluarga Sehat**

- Q48. Bersediakah menjalani pemeriksaan kesehatan pranikah lengkap bersama?
- Q49. Bagaimana pandangan Anda tentang konseling atau psikolog bila dibutuhkan?
- Q50. Bagaimana kebiasaan hidup sehat Anda (olahraga, makan, merokok/vape)?
- Q51. Bagaimana harapan dan adab dalam hubungan suami istri, dan bagaimana membicarakannya dengan nyaman?
- Q52. Bagaimana sikap kita bila salah satu sakit dalam jangka panjang?

**I. Gaya Hidup, Sosial & Masa Depan**

- Q53. Bagaimana batas pergaulan dengan lawan jenis dan etika bermedia sosial (foto, privasi)?
- Q54. Berapa waktu pribadi atau hobi yang dibutuhkan masing-masing?
- Q55. Bagaimana gaya hidup yang diinginkan (liburan, hiburan, belanja, kuliner)?
- Q56. Apa impian 5 dan 10 tahun ke depan, dan bagaimana kita saling mendukung?
- Q57. Hal apa yang bagi Anda tidak dapat ditawar (dealbreaker)?
