import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Lock, FileText } from 'lucide-react';

export default function PrivasiPage() {
  return (
    <div className="min-h-screen p-6 bg-white text-ink space-y-6 pb-20">
      <div className="flex items-center gap-2 pt-2">
        <Link href="/profil" className="w-9 h-9 rounded-full bg-blush flex items-center justify-center text-ink hover:bg-rose hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-extrabold">Kebijakan Privasi</h1>
      </div>

      <div className="p-4 bg-blush/40 border border-blush rounded-2xl flex items-start gap-3">
        <ShieldCheck size={24} className="text-rose shrink-0 mt-0.5" />
        <p className="text-xs text-ink/80 leading-relaxed">
          Nikahku berkomitmen penuh melindungi kerahasiaan data pribadi, kesehatan, dan keluarga calon pengantin sesuai prinsip Undang-Undang Perlindungan Data Pribadi (UU PDP).
        </p>
      </div>

      <div className="space-y-4 text-xs text-ink/85 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Lock size={16} className="text-rose" /> 1. Pengumpulan Data
          </h2>
          <p>
            Data yang Anda masukkan (biodata ta&apos;aruf, riwayat kesehatan, catatan keluarga, anggaran, daftar tamu, dan pindaian berkas KUA) disimpan secara privat di dalam ruang data (workspace) akun Anda sendiri.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <ShieldCheck size={16} className="text-rose" /> 2. Tanpa Analitik Pihak Ketiga &amp; Tanpa Penjualan Data
          </h2>
          <p>
            Aplikasi Nikahku <strong>tidak menggunakan pelacak pihak ketiga</strong> (seperti Google Analytics atau Facebook Pixel) dan <strong>tidak pernah memperjualbelikan atau membagikan data Anda kepada pihak pengiklan atau vendor manapun</strong>.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <Lock size={16} className="text-rose" /> 3. Penyimpanan &amp; Keamanan Berkas
          </h2>
          <p>
            Semua berkas foto dan dokumen tersimpan di luar folder publik server web dan hanya dapat diakses melalui verifikasi sesi login yang sah. Terdapat fitur Blur Privasi pada data kesehatan dan keluarga untuk mencegah intipan visual di tempat umum.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <FileText size={16} className="text-rose" /> 4. Hak Pengguna &amp; Penghapusan Data Permanen
          </h2>
          <p>
            Sesuai UU PDP, Anda memiliki hak penuh untuk:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1 text-ink/75">
            <li>Mengekspor seluruh data dalam bentuk file arsip ZIP/JSON kapan saja.</li>
            <li>Memulihkan data dari cadangan mandiri.</li>
            <li>Menghapus akun beserta seluruh data secara permanen dari server melalui menu Pengaturan Profil.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
