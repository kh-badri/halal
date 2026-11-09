# PRD — Nikahku: Aplikasi Persiapan Pernikahan (PWA)

*Versi 1.0 · 5 November 2026 · Status: Draft siap review · “Nikahku” adalah nama kerja dan bisa diganti*

## 1. Ringkasan Eksekutif

Nikahku adalah aplikasi mobile web (PWA) yang menemani calon pengantin dari tahap ta’aruf sampai hari akad dan walimah. Isinya biodata, kartu tanya jawab pranikah, seserahan, anggaran, tracker vendor, berkas KUA, daftar tamu, dan panitia keluarga. Aplikasi dibangun dengan **Next.js + Tailwind CSS**, menyimpan data di **file JSON (tanpa SQL)**, dan dirancang agar bisa berjalan di **hosting cPanel**. Aplikasi terbuka untuk siapa saja: setiap orang mendaftar dan mendapat ruang data (workspace) pribadi.

**Prinsip produk:** bersih, modern, kekinian, mobile-first, cepat, dan data tidak boleh hilang.

## 2. Latar Belakang & Masalah

- Persiapan menikah tersebar di banyak tempat: chat WhatsApp, catatan HP, spreadsheet, dan template Notion yang rumit di layar kecil.
- Banyak pasangan baru membicarakan hal prinsip (keuangan, karier istri, tempat tinggal, mertua, pola asuh) setelah terlalu jauh melangkah.
- Biaya, jatuh tempo vendor, dan berkas KUA mudah terlewat karena tidak ada satu pusat kontrol.
- Template Notion tidak nyaman di HP, tidak bisa dipasang sebagai aplikasi, dan tidak punya pengingat.

## 3. Tujuan, Non-Tujuan & Metrik

|  | Isi |
| --- | --- |
| **Tujuan** | (1) Satu aplikasi untuk seluruh proses menuju akad. (2) Semua input tersimpan permanen per pengguna. (3) Nyaman dipakai di HP dan bisa di-install (PWA). (4) Ringan dan stabil di hosting cPanel. |
| **Non-tujuan (v1)** | Marketplace vendor, pembayaran online, undangan digital publik, chat antar pengguna, dan aplikasi native Play Store/App Store. |
| **Metrik sukses** | ≥ 70% pengguna baru mengisi profil calon di sesi pertama · ≥ 30% pengguna aktif memasang PWA · Lighthouse mobile (Performance & PWA) ≥ 90 · error rate API < 1% · **0 insiden kehilangan data** |

## 4. Pengguna & Peran

| Peran | Deskripsi | Hak akses |
| --- | --- | --- |
| **Pengguna (Catin)** | Calon pengantin pria atau wanita yang mendaftar sendiri | Penuh atas workspace miliknya |
| **Pendamping (P2)** | Pasangan, orang tua, atau murabbi yang diundang lewat kode | Baca atau ubah modul tertentu |
| **Admin** | Pengelola aplikasi (akun pertama atau email di ENV) | Kelola pengguna, reset password, unduh backup, lihat statistik agregat. Tidak membaca isi data pribadi tanpa alasan operasional |

## 5. Ruang Lingkup & Prioritas

**P0 (MVP, wajib):** registrasi/login, Beranda, Profil Calon & pengaturan, 5 modul inti, penyimpanan JSON yang aman, upload foto, PWA install, bottom navigation, backup harian, export data.

**P1:** notifikasi pengingat (in-app lalu push), bagikan rundown/daftar via WhatsApp, export PDF/CSV, lupa password via email SMTP cPanel, kalender terpadu, import tamu CSV.

**P2:** mode kolaborasi pasangan/keluarga, kunci PIN, tanggal Hijriah, mode check-in tamu, catatan & doa, modul persiapan rumah tangga.

## 6. Arsitektur & Teknologi (Ramah cPanel)

### 6.1 Stack

| Lapisan | Pilihan | Catatan |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript, Node.js 20 LTS | `output: 'standalone'`, dijalankan lewat Passenger |
| Styling | Tailwind CSS + token warna kustom | Tanpa library UI berat |
| UI | Komponen kustom, lucide-react, framer-motion (secukupnya), bottom sheet | Animasi halus, bundle kecil |
| Data fetching | SWR atau TanStack Query dengan optimistic update | UI terasa instan |
| Form & validasi | react-hook-form + zod | Skema yang sama dipakai client dan server |
| Auth | jose (JWT di cookie httpOnly) + **bcryptjs** | Pure JS, tanpa native module |
| Penyimpanan | File JSON lewat `StorageAdapter` | Lihat 6.2 |
| Locking | proper-lockfile + mutex in-memory | Aman bila Passenger menjalankan >1 proses |
| PWA | Serwist (service worker) + manifest | Offline shell + antrean sinkron |
| Gambar | Kompresi di sisi client (WebP) | **Hindari `sharp`**; set `images.unoptimized = true` |
| Tanggal | date-fns (locale id), zona Asia/Jakarta |  |

> Hindari modul native (better-sqlite3, bcrypt, sharp) karena sering gagal dikompilasi di shared hosting.

### 6.2 Penyimpanan: File JSON per Pengguna per Modul

Semua data berada di `DATA_DIR` **di luar `public_html`** (contoh `~/nikahku-data`, permission 700).

```
nikahku-data/
├─ index/users.json            # indeks email/username → userId
├─ users/{userId}/
│  ├─ account.json             # akun, hash password, peran, kuota
│  ├─ settings.json            # preferensi, tanggal target nikah, notifikasi
│  ├─ profile.json             # profil saya & profil calon
│  ├─ taaruf.json              # biodata, kesehatan, keluarga, kartu Q&A
│  ├─ khitbah.json             # seserahan, rundown, keluarga hadir
│  ├─ budget.json              # pos anggaran, item, vendor, pembayaran
│  ├─ kua.json                 # checklist berkas, rekomendasi, TT, Bimwin
│  └─ harih.json               # tamu, kuota katering, panitia, saksi
├─ uploads/{userId}/{fileId}.webp
└─ backups/YYYY-MM-DD/         # snapshot harian, simpan 14 hari
```

Setiap file memuat `schemaVersion` dan `rev`. Satu pengguna biasanya hanya ratusan KB sehingga cepat dibaca dan ditulis.

### 6.3 Jaminan Data Aman dan Bebas Error

1. **Penulisan atomik:** tulis ke file sementara → `fsync` → `rename`; versi sebelumnya disimpan sebagai `.bak`.
2. **Lock per file** agar dua request bersamaan tidak saling menimpa.
3. **Operasi tingkat item** (tambah/ubah/hapus/urutkan item), bukan menimpa seluruh file. Server menggabungkan perubahan di dalam lock, sehingga dua perangkat tidak saling menghapus data.
4. **Validasi zod** saat baca dan tulis. Jika JSON rusak, otomatis pulih dari `.bak` dan dicatat di log.
5. **Cache LRU** di memori (invalidasi via mtime) agar baca cepat.
6. **Hapus lunak** (`deletedAt`) selama 30 hari dengan tombol “Urungkan”.
7. **Backup harian** lewat Cron cPanel (`node scripts/backup.js`) dan **export JSON/ZIP mandiri** oleh pengguna.
8. **Autosave** di client (debounce 800 ms) plus antrean offline di IndexedDB yang dikirim ulang saat online.
9. **Migrasi skema** berurutan berdasarkan `schemaVersion`.
10. Lapisan `StorageAdapter` dibuat agar bila pengguna aktif melewati kira-kira 3.000–5.000, penyimpanan bisa dipindah ke SQLite/MySQL tanpa mengubah UI.

### 6.4 Upload File

- Foto calon, bukti transfer, dan scan berkas dikompres di client (maks. sisi 1280 px, ≤ 400 KB, WebP/JPEG). Foto profil dibuat versi thumbnail 256 px di client.
- Disimpan di `uploads/{userId}/` dan **hanya dilayani lewat API yang memeriksa sesi**, tidak pernah lewat URL publik.
- Kuota default 50 MB per pengguna (bisa diubah admin). Tipe file dibatasi (jpg, png, webp, pdf ≤ 2 MB).

### 6.5 Deploy di cPanel

1. Pastikan hosting punya menu **Setup Node.js App** (CloudLinux/Passenger). Jika tidak ada, aplikasi tidak bisa berjalan dan perlu VPS atau hosting Node (risiko utama).
2. Build di komputer lokal: `npm ci && npm run build`. Hindari build di server karena batas RAM/CPU shared hosting.
3. Kemas `.next/standalone`, `.next/static`, `public`, dan `server.js`, lalu unggah ke `~/apps/nikahku`.
4. Setup Node.js App: Node 20, mode Production, startup file `server.js`, set ENV `SESSION_SECRET`, `DATA_DIR`, `ADMIN_EMAIL`, `APP_URL`.
5. Aktifkan AutoSSL dan paksa HTTPS (wajib untuk PWA dan cookie Secure).
6. Tambahkan Cron harian untuk backup.
7. Update aplikasi: unggah build baru → Restart App. Folder data tidak tersentuh.

### 6.6 Struktur Proyek

```
app/
├─ (auth)/login, register
├─ (app)/layout.tsx            # shell + BottomNav
│  ├─ beranda/ modul/ budget/ profil/
│  ├─ taaruf/ khitbah/ kua/ hari-h/
├─ api/auth/*, api/m/[module]/*, api/files/*, api/admin/*
lib/storage/ (adapter, json-store, lock, atomic-write, migrations)
lib/auth/    lib/schemas/    components/ui/    public/icons/
server.js    scripts/backup.js
```

## 7. Akun, Pengguna & Pengaturan

- **Registrasi:** nama, email atau username, password (min. 8 karakter), peran (Catin Pria/Wanita), tanggal target akad (opsional). Peran menentukan sudut pandang label (“calon istri/suami”).
- **Login:** cookie httpOnly + Secure + SameSite=Lax, sesi 30 hari. Hash bcryptjs cost 10 (cukup cepat di shared hosting). Rate limit login 5 percobaan/menit/IP.
- **Lupa password:** P0 reset oleh admin; P1 lewat email (SMTP cPanel + nodemailer, token sekali pakai 30 menit).
- **Pengaturan:** profil akun, ganti password, tanggal target & lokasi, zona waktu, notifikasi, export data, backup manual, instal aplikasi, **hapus akun dan seluruh data** (sesuai prinsip UU PDP).
- **Admin minimal:** daftar pengguna, nonaktifkan, reset password, statistik agregat, pemakaian disk, unduh backup.
- **Privasi:** data kesehatan, keluarga, dan berkas bersifat sensitif. Tidak ada analitik pihak ketiga, tidak ada penjualan data, dan ada halaman Kebijakan Privasi serta Syarat Penggunaan.

## 8. Desain & UX

### 8.1 Palet 4 Warna

| Nama | Hex | Peran |
| --- | --- | --- |
| **Putih** | `#FFFFFF` | Latar utama dan kartu (± 60%) |
| **Pink Muda** | `#FFE4EE` | Latar section, kartu modul, chip “belum” (± 20%) |
| **Biru Muda** | `#D6EBFF` | Kartu modul selang-seling, chip “proses”, ikon latar (± 15%) |
| **Pink Tua** | `#D94F86` | Aksen: tombol utama, tab aktif, progress, chip “selesai” (± 5–10%) |

Catatan kontras: teks putih di atas Pink Tua hanya untuk tombol dan teks tebal ≥ 16 px (rasio ≈ 3,9:1). Untuk teks bodi dipakai **shade gelap dari Pink Tua** (`#5A1633`, “ink”) agar terbaca jelas; tetap satu keluarga warna sehingga identitas tetap 4 warna. Transparansi (misal `rose/10`) boleh untuk tint dan border.

Status hanya memakai 4 warna ini plus ikon agar tidak bergantung pada warna: **Belum** = Pink Muda + ikon lingkaran, **Proses** = Biru Muda + ikon jam, **Selesai** = Pink Tua solid + ikon centang, **Terlambat** = outline Pink Tua + ikon peringatan.

```js
// tailwind.config.ts (potongan)
colors: {
  blush: '#FFE4EE',   // pink muda
  rose:  '#D94F86',   // pink tua
  sky:   '#D6EBFF',   // biru muda
  ink:   '#5A1633',   // shade gelap rose untuk teks
  white: '#FFFFFF',
}
```

### 8.2 Gaya Visual (Clean, Modern, Kekinian)

- Font **Plus Jakarta Sans** lewat `next/font` (self-host, cepat, cocok untuk Indonesia). Judul 700, bodi 400/500.
- Sudut membulat besar (kartu 24 px, tombol pill), bayangan lembut berwarna pink, banyak ruang kosong.
- Header hero dengan gradien Pink Muda → Biru Muda, sapaan personal, dan countdown hari menuju akad.
- Bento-style grid untuk kartu modul di Beranda; progress ring per modul.
- Form tampil di **bottom sheet**, bukan halaman penuh. Ada swipe-to-delete, skeleton loading, empty state dengan ilustrasi sederhana, dan micro-interaction halus (haptic bila didukung).
- Input font ≥ 16 px (mencegah zoom iOS), area sentuh ≥ 44 px, dukung `safe-area-inset`.
- Tanpa dark mode di v1 supaya palet tetap konsisten.

### 8.3 Navigasi Bawah (Bottom Navigation)

Bar melayang berbahan kaca (putih 80% + blur) dengan 5 item:

| Posisi | Menu | Fungsi |
| --- | --- | --- |
| 1 | **Beranda** | Ringkasan, countdown, tugas terdekat |
| 2 | **Modul** | Grid 5 modul inti + modul tambahan |
| 3 | **＋ (tombol tengah)** | Aksi cepat: tambah pengeluaran, tamu, seserahan, tugas, catatan |
| 4 | **Budget** | Akses cepat anggaran dan vendor |
| 5 | **Profil** | Profil calon, pengaturan, akun |

Di dalam tiap modul, sub-bagian memakai **segmented tab** atau chip scroll horizontal di bagian atas.

### 8.4 PWA

- `manifest.webmanifest`: nama, `short_name`, `display: standalone`, `theme_color` Pink Tua, `background_color` putih, ikon 192/512 dan maskable, shortcut ke Budget dan Tambah Cepat.
- Service worker: precache app shell, strategi stale-while-revalidate untuk GET API, halaman offline, dan antrean tulis saat offline.
- Banner “Pasang Aplikasi” (Android: `beforeinstallprompt`; iOS: petunjuk Bagikan → Tambah ke Layar Utama). Splash screen dan status bar mengikuti tema.

## 9. Spesifikasi Modul

### 9.0 Beranda (P0)

Countdown ke tanggal target akad, progress per modul (cincin), 5 tugas atau jatuh tempo terdekat, ringkasan anggaran (dianggarkan, terpakai, sisa), dan pengingat tagihan vendor yang mendekati jatuh tempo.

### 9.1 Modul Ta’aruf & Komitmen (Pre-Khitbah)

**A. Biodata mendalam (Saya dan Calon, P0)**

- Identitas: foto, nama lengkap dan panggilan, tempat/tanggal lahir (usia otomatis), tinggi/berat, suku, domisili, status (lajang/janda/duda), kontak, media sosial, perantara (murabbi/pendamping) dan kontaknya.
- Pendidikan, pekerjaan, rentang penghasilan (opsional), hobi, kelebihan dan kekurangan, visi misi pernikahan, hafalan Qur’an, rutinitas ibadah, kajian/komunitas.
- Foto dan data calon dapat diedit dari sini maupun dari Profil → Pengaturan Calon.

**B. Riwayat kesehatan & keluarga (P0)**

- Kesehatan: golongan darah dan rhesus, alergi, penyakit kronis, riwayat operasi/rawat inap, obat rutin, hasil cek (hepatitis B, thalassemia, dll.), catatan kesehatan mental/konseling (opsional), kebiasaan (merokok/olahraga).
- Keluarga: nama dan pekerjaan ayah/ibu, wali nasab, jumlah dan urutan saudara, riwayat penyakit keturunan, kondisi keluarga secara umum.
- Setiap bagian punya penanda “pribadi” dan pengaturan sembunyikan di layar (blur) untuk privasi.

**C. Kartu Tanya Jawab Pranikah (P0)**

- **57 kartu bawaan** dalam 9 kategori (lihat Lampiran A) dan pengguna bisa menambah kartu sendiri.
- UI kartu bisa di-swipe/flip: pertanyaan di depan, di belakang ada **Jawaban Saya**, **Jawaban Calon**, catatan, penanda “prinsip (tidak bisa ditawar)”, dan status diskusi: *Belum dibahas · Dibahas · Sepakat · Perlu dibahas lagi*.
- Mode Acak, Per Kategori, dan Hanya yang Belum Sepakat. Progress per kategori.
- Ringkasan Kesepakatan: daftar poin sepakat dan poin yang masih berbeda, bisa dibagikan (P1).

**D. Status proses (P1):** tahapan Berkenalan → Nadzor → Ta’aruf → Istikharah → Lanjut/Tidak, dengan catatan dan kriteria pro-kontra.

### 9.2 Modul Persiapan Lamaran (Khitbah)

**A. Seserahan/Hantaran (P0)**

- Item: nama, kategori (pakaian, alat ibadah, kosmetik, tas/sepatu, makanan, perhiasan, lainnya), untuk (calon wanita/pria), jumlah, ukuran/warna, estimasi harga, harga aktual, **link toko** (Shopee, Tokopedia, dll.), foto referensi, catatan.
- **Status pembelian:** *Ingin · Dibeli · Dikirim · Diterima · Sudah Dikemas*.
- Total estimasi vs aktual, progress bar, filter (status/kategori/untuk siapa), dan tombol “Buka toko”.
- Sinkron opsional ke pos Budget “Khitbah”.
- Template awal 20–25 item yang bisa dihapus atau diedit.

**B. Susunan Acara & Rundown (P0)**

- Info: tanggal, jam, lokasi (+ link Google Maps), jumlah keluarga hadir dari dua pihak.
- Template susunan acara: pembukaan MC → tilawah → sambutan keluarga pria → penyampaian maksud → sambutan keluarga wanita → jawaban lamaran → penyerahan seserahan → pembicaraan tanggal akad → doa → ramah tamah → penutup.
- Tiap item punya durasi, PIC, dan catatan; jam mulai dan selesai terhitung otomatis; urutan bisa digeser (drag).
- Daftar keluarga yang hadir per pihak, checklist persiapan hari khitbah, dan bagikan rundown sebagai teks WhatsApp/PDF (P1).

### 9.3 Modul Budgeting & Cashflow

**A. Pemisahan anggaran (P0)**

- Tiga pos utama: **Biaya Khitbah**, **Mahar**, **Biaya Akad/Walimah**, ditambah pos kustom.
- Tiap pos: target anggaran, daftar item (nama, kategori, estimasi, aktual, status bayar), dan ringkasan Anggaran / Terpakai / Sisa dengan donut chart.
- **Mahar:** bentuk (uang, emas, seperangkat alat salat, lainnya), nominal/deskripsi, catatan, status disiapkan.
- **Sumber dana:** tabungan, bantuan keluarga, dan lainnya. Aplikasi menghitung total dana vs kebutuhan, kekurangan, dan saran target tabungan per bulan sampai tanggal akad.

**B. Tracker pembayaran vendor (P0)**

- Vendor: nama, kategori (katering, dekor, MUA, foto/video, gedung, busana, undangan, sound, dll.), kontak, catatan kontrak.
- Angka: **Total Harga**, **Nominal DP**, **Sisa Tagihan** (otomatis), **Jatuh Tempo**, dan riwayat pembayaran (bisa banyak termin) dengan **upload bukti transfer**.
- Status otomatis: Belum DP · DP · Lunas · Terlambat. Daftar diurutkan dari jatuh tempo terdekat, lalu pengingat H-7/H-3/H-1 (in-app, push di P1).
- **Cashflow:** grafik batang bulanan dari tagihan terjadwal berdasarkan jatuh tempo, ditambah total sudah dibayar dan masih harus dibayar.
- Export CSV (P1).

### 9.4 Modul Administrasi & Berkas Negara (KUA)

**A. Checklist dokumen Catin Pria dan Wanita (P0)**

Dua tab: **Catin Pria** dan **Catin Wanita**. Item bawaan:

- KTP, Kartu Keluarga, Akta Kelahiran/ijazah, Pasfoto latar biru (catat ukuran dan jumlah), Surat Pengantar RT/RW.
- **N1** (keterangan untuk nikah), **N2** (asal-usul), **N3** (persetujuan mempelai), **N4** (keterangan orang tua) dari Kelurahan/Desa.
- Kondisional: **N5** (izin orang tua bila < 21 tahun), **N6** atau akta cerai/surat kematian pasangan (janda/duda), dispensasi usia, izin atasan (TNI/Polri/ASN), surat keterangan sehat, sertifikat Bimwin.
- Tiap item: status (*Belum · Diurus · Selesai*), jumlah fotokopi, tanggal urus, tempat mengurus, catatan, dan upload scan/foto. Pengguna bebas menambah dan menghapus item karena syarat bisa berbeda antar KUA.

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

### 9.5 Modul Hari-H (Akad & Walimah)

**A. Daftar tamu & kuota katering (P0)**

- Tamu: nama, kategori (keluarga pria/wanita, teman, kolega, tetangga, VIP), jumlah orang (pax), kontak, sesi (akad/walimah), catatan (diet/meja), status undangan (*Belum · Diundang · Konfirmasi · Hadir*).
- **Kuota katering:** isi kuota porsi dari vendor, lalu aplikasi menghitung total pax vs kuota, sisa, dan **peringatan saat melebihi kuota**, juga rincian per pihak (pria/wanita).
- Pencarian, filter, import CSV (P1), tombol kirim undangan via WhatsApp dengan template pesan (P1), dan mode check-in saat acara (P2).

**B. Panitia keluarga (P0)**

- Peran bawaan: PIC buku tamu, PIC mahar, PIC katering, PIC dokumentasi, PIC penerima tamu, PIC parkir, MC, **wali nasab**, dan **2 saksi nikah**.
- Tiap orang: nama, hubungan keluarga, kontak, tugas, status konfirmasi. Ada tombol Telepon/WhatsApp sekali sentuh. Untuk saksi dan wali ada checklist kelengkapan identitas.

**C. Rundown Hari-H dan checklist H-1 (P1):** urutan acara akad/walimah per jam, daftar bawaan, dan pembagian tugas.

### 9.6 Modul Tambahan (Rekomendasi)

| Modul | Prioritas | Isi |
| --- | --- | --- |
| **Kalender & Timeline** | P1 | Gabungan semua tanggal: khitbah, TT, Bimwin, jatuh tempo vendor, akad. Mundur dari tanggal target (H-180, H-90, H-30, H-7). |
| **Tugas** | P1 | To-do lintas modul dengan template per fase |
| **Catatan & Doa** | P2 | Jurnal, doa/dzikir pilihan, bahan muhasabah |
| **Persiapan Rumah Tangga** | P2 | Daftar perabot, kontrak/KPR, rencana bulan pertama |
| **Kolaborasi** | P2 | Undang pasangan/keluarga dengan kode; hak baca atau ubah |

## 10. Profil Calon & Pengaturan Data

- Halaman **Profil → Calon**: foto (kamera atau galeri, crop bulat), nama lengkap dan panggilan, tanggal lahir, kontak, asal, pekerjaan, status proses, perantara, dan catatan.
- Foto dan nama calon tampil di header Beranda, kartu Q&A, dan rundown.
- **Profil → Saya** dengan struktur serupa, sehingga bisa dibandingkan berdampingan.
- **Data & Backup:** export semua data (ZIP: JSON + foto), import dari export, dan hapus data per modul.

## 11. Model Data (Ringkas)

```ts
type Meta = { id: string; createdAt: string; updatedAt: string; deletedAt?: string }

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
| `GET /api/m/{module}` | Ambil seluruh data modul milik pengguna |
| `POST/PATCH/DELETE /api/m/{module}/items/{id}` | Operasi per item (di dalam lock) |
| `POST /api/m/{module}/reorder` | Ubah urutan item |
| `POST /api/files` · `GET /api/files/{id}` | Upload dan unduh file (cek sesi dan kepemilikan) |
| `GET /api/export` · `POST /api/import` | Export dan import data pengguna |
| `/api/admin/*` | Kelola pengguna dan backup (khusus admin) |

Keamanan: validasi zod di semua endpoint, cek Origin/CSRF, header keamanan (CSP, X-Frame-Options), path file tidak diambil dari input pengguna, dan setiap request hanya boleh mengakses `userId` dari sesi.

## 13. Kebutuhan Non-Fungsional

- **Performa:** LCP < 2,5 detik di 4G, JS awal < 200 KB, respons API p95 < 300 ms, tanpa library berat.
- **Keandalan:** penulisan atomik, backup harian, pemulihan otomatis dari `.bak`, log error terstruktur ke file.
- **Kompatibilitas:** Chrome/Android, Safari/iOS 16.4+, desktop sebagai tampilan sekunder (layout terpusat max-width).
- **Aksesibilitas:** label jelas, fokus terlihat, area sentuh ≥ 44 px, status tidak bergantung warna saja.
- **Bahasa:** Bahasa Indonesia (format Rupiah, tanggal Indonesia). Struktur teks disiapkan agar mudah ditambah bahasa lain.
- **Skalabilitas:** nyaman untuk ribuan pengguna dengan konkurensi rendah–sedang; ada jalur migrasi lewat `StorageAdapter`.

## 14. Roadmap (Estimasi)

| Fase | Durasi | Cakupan |
| --- | --- | --- |
| **Fase 1 – Fondasi** | 1–2 minggu | Setup proyek, design system 4 warna, shell + bottom nav, PWA dasar, auth, `StorageAdapter` JSON + backup |
| **Fase 2 – MVP Modul** | 3–4 minggu | Profil calon, Beranda, Modul 1–5 (CRUD, status, kalkulasi), upload foto/bukti, export/import |
| **Fase 3 – Penyempurnaan** | 2–3 minggu | Pengingat dan push, share WhatsApp, PDF/CSV, lupa password, kalender, admin panel, uji performa dan keamanan |
| **Fase 4 – Lanjutan** | Bertahap | Kolaborasi pasangan, check-in tamu, kunci PIN, modul tambahan |

## 15. Risiko & Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Hosting cPanel tanpa Node.js App | Cek sejak awal. Alternatif: VPS murah atau hosting Node khusus |
| Batas RAM/CPU shared hosting | Build lokal, tanpa modul native, cache memori, bundle kecil |
| File JSON rusak / tertimpa | Penulisan atomik, lock, operasi per item, `.bak`, backup harian |
| Disk penuh karena foto | Kompresi client, kuota per pengguna, monitor di panel admin |
| Data sensitif bocor | File di luar `public_html`, akses via sesi, HTTPS, hash bcrypt, opsi blur, hapus akun |
| Push notification di iOS terbatas | Pengingat in-app sebagai dasar; push sebagai tambahan |
| Syarat KUA berbeda | Checklist bisa diedit + disclaimer |

## 16. Kriteria Penerimaan MVP

- Pengguna baru bisa mendaftar, mengisi profil dan foto calon, lalu semua data **tetap ada setelah logout/login dan restart server**.
- Kelima modul inti bisa tambah/ubah/hapus data dan perubahan tersimpan otomatis, termasuk saat koneksi putus lalu tersambung lagi.
- Aplikasi dapat di-install sebagai PWA (Android dan iOS) dan menu bawah tampil seperti aplikasi mobile.
- Hanya 4 warna dasar yang dipakai di seluruh UI (dengan shade teks gelap) dan tampilan konsisten di layar 360–430 px.
- Dua pengguna berbeda tidak pernah bisa melihat data satu sama lain.
- Berjalan di cPanel tanpa SQL, dan tersedia panduan deploy serta skrip backup.

## Lampiran A — 57 Kartu Tanya Jawab Pranikah (Data Awal)

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
