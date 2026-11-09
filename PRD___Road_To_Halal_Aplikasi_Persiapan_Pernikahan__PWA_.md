# PRD — Road To Halal: Aplikasi Persiapan Pernikahan (PWA)

*Versi 1.1 · 9 November 2026 · Status: Draft siap review · Revisi dari PRD Nikahku v1.0*

## Catatan Revisi (v1.0 → v1.1)

| Area | v1.0 (Nikahku) | v1.1 (Road To Halal) |
| --- | --- | --- |
| **Nama** | Nikahku | **Road To Halal** |
| **Navigasi** | Bottom navigation 5 menu | **Peta rute vertikal berkelok** (tanpa bottom bar), terinspirasi diagram perjalanan bertitik |
| **Alur** | 5 modul bebas dibuka | **8 tahap berurutan**. Tahap berikutnya **terkunci** sampai tahap sebelumnya selesai (di UI dan di API) |
| **Warna** | 4 warna (putih, pink muda, biru muda, pink tua) | **3 warna dasar: pink muda, biru muda, putih** (+ shade gelap “ink” khusus teks, ikon, garis) |
| **Hak akses** | Pemilik, Pendamping (P2), Admin | Pemilik + **anggota ber-level Read atau Full (P0)**, Admin |
| **Penyimpanan** | Folder per `userId` | Folder per **workspace** agar bisa dibagi ke anggota |

## 1. Ringkasan Eksekutif

Road To Halal adalah aplikasi mobile web (PWA) yang menemani calon pengantin menempuh perjalanan dari persetujuan ta’aruf sampai hari akad dan walimah, selangkah demi selangkah. Seluruh perjalanan tampil sebagai **peta rute vertikal** berisi 8 tahap yang harus diselesaikan **berurutan**: tahap berikutnya baru terbuka setelah tahap sebelumnya selesai. Isinya biodata, kartu tanya jawab pranikah, kesepakatan dan proses khitbah, seserahan, anggaran dan mahar, berkas KUA, tracker vendor, daftar tamu, dan panitia keluarga.

Aplikasi dibangun dengan **Next.js + Tailwind CSS**, menyimpan data di **file JSON (tanpa SQL)**, dan dirancang agar bisa berjalan di **hosting cPanel**. Aplikasi terbuka untuk siapa saja: setiap orang mendaftar dan mendapat ruang data (workspace) pribadi. Pemilik workspace dapat mengundang pengguna lain (pasangan, keluarga, murabbi) dan mengatur hak aksesnya: **Read** (hanya melihat) atau **Full** (melihat dan mengubah).

**Prinsip produk:** bersih, modern, kekinian, mobile-first, cepat, data tidak boleh hilang, dan **terarah**: satu tahap aktif pada satu waktu.

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
| Styling | Tailwind CSS + token warna kustom (3 warna dasar + ink) | Tanpa library UI berat |
| UI | Komponen kustom, lucide-react, framer-motion (secukupnya), bottom sheet, **SVG inline untuk jalur rute** | Animasi halus, bundle kecil |
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
lib/schemas/    components/ui/    components/route/ (RouteMap, RouteNode)    public/icons/
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

## 8. Desain & UX

### 8.1 Palet 3 Warna Dasar

| Nama | Hex | Peran |
| --- | --- | --- |
| **Putih** | `#FFFFFF` | Latar utama, kartu, dan node/tombol berstatus belum atau terkunci (± 60%) |
| **Pink Muda** | `#FFE4EE` | Tahap aktif, hero, kartu sorotan, tombol utama, chip “proses” (± 20%) |
| **Biru Muda** | `#D6EBFF` | Tahap selesai, kartu selang-seling, ikon latar, chip “selesai” (± 20%) |
| *Ink (shade gelap, bukan warna dasar)* | `#1E3A5F` | **Hanya** untuk teks, ikon, outline, dan garis jalur. Tidak dipakai sebagai warna isi besar |

Catatan kontras: Pink Muda dan Biru Muda terhadap putih hanya sekitar 1,2:1, sehingga **bentuk tidak boleh bergantung pada warna isi saja**. Elemen berstatus selalu diberi outline ink dan ikon. Teks ink terhadap putih 11,5:1, terhadap Pink Muda 9,6:1, dan terhadap Biru Muda 9,4:1. Jalur putus-putus memakai ink 55% (3,1:1 di atas putih) dan label tahap terkunci memakai ink 70% (4,7:1 di atas putih). Transparansi ink boleh untuk tint dan border.

Status memakai 3 warna dasar, outline, dan ikon, berlaku sama untuk **node di rute** maupun **chip item di dalam tahap**:

| Status | Tampilan | Ikon |
| --- | --- | --- |
| **Belum / Terkunci** | Putih, outline putus-putus ink 55%, label ink 70% | Gembok (tahap) atau lingkaran (item) |
| **Proses / Aktif** | Pink Muda, outline ink 2 px; node aktif berdenyut halus dan diberi chip “Kamu di sini” | Penanda lokasi (tahap) atau jam (item) |
| **Selesai** | Biru Muda, outline ink 2 px | Centang |
| **Terlambat** (item/tagihan) | Putih, outline ink tebal 2 px | Peringatan |

```js
// tailwind.config.ts (potongan)
colors: {
  blush: '#FFE4EE',   // pink muda
  sky:   '#D6EBFF',   // biru muda
  white: '#FFFFFF',
  ink:   '#1E3A5F',   // shade gelap: hanya teks, ikon, garis
}
```

### 8.2 Gaya Visual (Clean, Modern, Kekinian)

- Font **Plus Jakarta Sans** lewat `next/font` (self-host, cepat, cocok untuk Indonesia). Judul 700, bodi 400/500.
- Sudut membulat besar (kartu 24 px, tombol pill), bayangan lembut (ink 8%), banyak ruang kosong.
- Header hero di atas rute dengan gradien Pink Muda → Biru Muda, sapaan personal, dan indikator “Tahap X dari 8”. Countdown hari menuju akad tampil setelah tanggal akad ditetapkan (Tahap 4).
- **Tombol utama:** pill Pink Muda, outline ink 2 px, teks ink tebal. **Tombol sekunder:** putih dengan outline ink. **Selesaikan Tahap:** pill penuh lebar, Biru Muda + centang saat aktif; putih + gembok + teks “Lengkapi N syarat lagi” saat belum memenuhi syarat.
- Form tampil di **bottom sheet**, bukan halaman penuh. Ada swipe-to-delete, skeleton loading, empty state dengan ilustrasi sederhana, dan micro-interaction halus (haptic bila didukung).
- Input font ≥ 16 px (mencegah zoom iOS), area sentuh ≥ 44 px, dukung `safe-area-inset`.
- Tanpa dark mode di v1 supaya palet tetap konsisten.

### 8.3 Navigasi: Peta Rute (Pengganti Bottom Navigation)

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
2. Node berdiameter 56 px (area sentuh ≥ 44 px) berisi nomor tahap. Node selesai berisi centang, node terkunci berisi gembok. Di samping node ada label tahap (maks. 2 baris, ≥ 14 px) dan subjudul satu baris, mis. “3 dari 5 syarat”.
3. Gaya status mengikuti tabel di 8.1. Bagian jalur yang sudah dilalui berupa **garis ink solid 4 px**, sisanya **garis putus-putus ink 55%**.
4. Node “Mulai” (bawah) dan “Halal” (puncak) bukan tahap isian. Halal tetap terkunci sampai Tahap 8 selesai.
5. Saat Peta Rute dibuka, layar **otomatis bergulir halus ke node Aktif**. Header ringkas yang menempel di atas menampilkan “Tahap 3 dari 8 · Kesepakatan Khitbah” dan tombol **Lanjutkan**.

**Perilaku klik (penguncian berurutan)**

| Status node | Saat diketuk | Catatan |
| --- | --- | --- |
| **Aktif** | Membuka halaman tahap | Tahap tempat bekerja saat ini |
| **Selesai** | Membuka halaman tahap (bisa ditinjau dan, oleh Pemilik/Full, diedit) | Mengedit tidak mengunci ulang tahap lain |
| **Terkunci** | **Tidak membuka halaman.** Muncul bottom sheet: “Selesaikan dulu ‘Proses Ta’aruf’ untuk membuka tahap ini” + tombol **Ke tahap saat ini** | Node `aria-disabled="true"`, tanpa tautan, disertai getar haptic bila didukung |

- Semua node **setelah/di atas** tahap aktif otomatis terkunci. Ketika Tahap 2 belum selesai, Tahap 3 sampai Halal tidak dapat diklik.
- Penguncian juga berlaku untuk akses lewat URL langsung, tautan tersimpan, dan shortcut PWA: halaman diarahkan ke tahap aktif dan API menolak dengan 403 `STAGE_LOCKED`.
- Saat **Selesaikan Tahap** ditekan dan syarat terpenuhi: dialog konfirmasi → jalur “tergambar” ke node berikutnya (≤ 600 ms), node baru berubah Aktif, haptic ringan. Animasi mengikuti `prefers-reduced-motion`.
- Tampilan alternatif untuk pembaca layar dan keyboard berupa daftar berurutan (`<ol>`); fokus keyboard hanya mendarat pada node yang bisa dibuka.

**Header atas (menggantikan fungsi bottom bar)**

- Di Peta Rute: logo Road To Halal di kiri; di kanan lonceng notifikasi (P1) dan avatar yang membuka **Profil & Pengaturan**.
- Di dalam halaman tahap: tombol **← Rute**, judul tahap, dan mini-rute 8 titik kecil sebagai penanda posisi (P1; hanya titik yang terbuka yang dapat diketuk).
- Sub-bagian di dalam tahap memakai **segmented tab** atau chip scroll horizontal di bagian atas.
- **Aksi Cepat (P1):** tombol melayang kecil di Peta Rute untuk menambah pengeluaran, tamu, seserahan, tugas, atau catatan. Hanya menampilkan aksi dari tahap yang sudah terbuka dan disembunyikan untuk anggota Read.

### 8.4 PWA

- `manifest.webmanifest`: `name` “Road To Halal”, `short_name` “RoadToHalal”, `display: standalone`, `theme_color` Pink Muda (`#FFE4EE`), `background_color` putih, ikon 192/512 dan maskable, shortcut **Lanjutkan Tahap** (diarahkan ke tahap aktif) dan **Peta Rute**.
- Service worker: precache app shell, strategi stale-while-revalidate untuk GET API, halaman offline, dan antrean tulis saat offline. **Server tetap menjadi sumber kebenaran** untuk kunci tahap dan hak akses: bila antrean offline ditolak (mis. level diturunkan ke Read atau tahap dibuka kembali), perubahan itu ditandai “Belum tersimpan” beserta alasan dan tidak dibuang diam-diam.
- Banner “Pasang Aplikasi” (Android: `beforeinstallprompt`; iOS: petunjuk Bagikan → Tambah ke Layar Utama). Splash screen dan status bar mengikuti tema.

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

- **Performa:** LCP < 2,5 detik di 4G, JS awal < 200 KB, respons API p95 < 300 ms, tanpa library berat. Peta Rute dirender dengan SVG ringan (tanpa library grafik).
- **Keandalan:** penulisan atomik, backup harian, pemulihan otomatis dari `.bak`, log error terstruktur ke file.
- **Kompatibilitas:** Chrome/Android, Safari/iOS 16.4+, desktop sebagai tampilan sekunder (layout terpusat max-width).
- **Aksesibilitas:** label jelas, fokus terlihat, area sentuh ≥ 44 px, status tidak bergantung warna saja (gembok, centang, penanda lokasi, dan outline selalu menyertai warna), rute tersedia sebagai daftar berurutan untuk pembaca layar, node terkunci `aria-disabled`.
- **Bahasa:** Bahasa Indonesia (format Rupiah, tanggal Indonesia). Struktur teks disiapkan agar mudah ditambah bahasa lain.
- **Skalabilitas:** nyaman untuk ribuan pengguna dengan konkurensi rendah–sedang; ada jalur migrasi lewat `StorageAdapter`.

## 14. Roadmap (Estimasi)

Estimasi direvisi dari v1.0 karena ada tambahan Peta Rute, penguncian tahap, dan hak akses.

| Fase | Durasi | Cakupan |
| --- | --- | --- |
| **Fase 1 – Fondasi** | 2–3 minggu | Setup proyek, design system 3 warna, header + **Peta Rute** (SVG, node, status, auto-scroll), **guard tahap di UI dan API**, PWA dasar, auth, workspace + **anggota Read/Full**, `StorageAdapter` JSON + backup |
| **Fase 2 – Tahap 1–4** | 3–4 minggu | Profil, Persetujuan Ta’aruf, Tanya Jawab, Kesepakatan Khitbah, Proses Khitbah (CRUD, status, kalkulasi, Syarat Selesai), upload foto, Biaya Khitbah |
| **Fase 3 – Tahap 5–8** | 3–4 minggu | Anggaran dan mahar, KUA, vendor dan cashflow, tamu dan panitia, Hari-H, layar Halal, upload bukti/berkas, export/import |
| **Fase 4 – Penyempurnaan** | 2–3 minggu | Pengingat dan push, share WhatsApp, PDF/CSV, lupa password, kalender, mini-rute, Aksi Cepat, sakelar data pribadi, admin panel, uji performa dan keamanan (termasuk uji penolakan tahap terkunci dan anggota Read) |
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

## 16. Kriteria Penerimaan MVP

- Pengguna baru bisa mendaftar, mengisi profil dan foto calon, lalu semua data **tetap ada setelah logout/login dan restart server**.
- **Rute:** pada workspace baru hanya Tahap 1 yang Aktif; Tahap 2–8 dan Halal Terkunci (ikon gembok) dan **tidak bisa diketuk**. Membuka URL tahap terkunci langsung diarahkan ke tahap aktif, dan API mengembalikan `403 STAGE_LOCKED`.
- Tombol **Selesaikan Tahap** nonaktif sampai semua Syarat Selesai terpenuhi. Setelah ditekan, tahap berikutnya terbuka dan jalur beranimasi. Tidak ada cara melompati tahap.
- Pemilik dapat membuat undangan, menetapkan **Read** atau **Full**, dan mengubahnya kapan saja. Anggota Read tidak melihat kontrol tambah/ubah/hapus/unggah/selesaikan, dan API menolak penulisannya dengan `403 READ_ONLY`. Perubahan level berlaku tanpa login ulang.
- Kedelapan tahap bisa tambah/ubah/hapus data (oleh Pemilik dan Full) dan perubahan tersimpan otomatis, termasuk saat koneksi putus lalu tersambung lagi.
- Aplikasi dapat di-install sebagai PWA (Android dan iOS). Navigasi utama berupa **peta rute** (tanpa bottom navigation) dan tampil konsisten di layar 360–430 px.
- Hanya **3 warna dasar** (putih, pink muda, biru muda) yang dipakai di seluruh UI, dengan ink hanya untuk teks, ikon, dan garis. Status tidak bergantung pada warna saja.
- Dua workspace berbeda tidak pernah bisa melihat data satu sama lain.
- Berjalan di cPanel tanpa SQL, dan tersedia panduan deploy serta skrip backup.

## 17. Asumsi & Keputusan Terbuka

1. **Tahap 5–8** dan urutannya saya turunkan dari modul di PRD v1.0 untuk melengkapi “dan seterusnya”. Urutan dan Syarat Selesai tiap tahap dapat disesuaikan.
2. **Pengatur hak akses** diasumsikan Pemilik workspace (Admin hanya untuk dukungan). Jika yang dimaksud pengaturan di level admin aplikasi, bagian 4 dan 7 perlu disesuaikan.
3. **Ink (`#1E3A5F`)** dipakai sebagai shade gelap untuk keterbacaan teks. Ini bukan warna dasar keempat, tetapi bila ingin benar-benar tanpa warna gelap, kontras teks harus dikorbankan.
4. **Syarat Selesai Tahap 2** cukup ketat (semua kartu dibahas, semua prinsip sepakat). Perlu divalidasi apakah kartu yang berbeda pendapat boleh lolos dengan catatan.
5. **Kerja paralel** (mis. mengurus KUA sambil memesan vendor) tidak didukung di v1 sesuai kebutuhan alur berurutan. Pertimbangkan pengecualian terbatas di versi berikutnya.
6. Satu akun terhubung ke **satu workspace** pada v1.

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
