import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle } from 'lucide-react';

export default function SyaratPage() {
  return (
    <div className="min-h-screen p-6 bg-white text-ink space-y-6 pb-20">
      <div className="flex items-center gap-2 pt-2">
        <Link href="/profil" className="w-9 h-9 rounded-full bg-blush flex items-center justify-center text-ink hover:bg-rose hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-extrabold">Syarat Penggunaan</h1>
      </div>

      <div className="p-4 bg-sky/40 border border-sky rounded-2xl flex items-start gap-3">
        <BookOpen size={24} className="text-ink shrink-0 mt-0.5" />
        <p className="text-xs text-ink/80 leading-relaxed">
          Nikahku adalah alat bantu mandiri untuk memudahkan pencatatan persiapan pernikahan Anda.
        </p>
      </div>

      <div className="space-y-4 text-xs text-ink/85 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink">1. Ketentuan Penggunaan</h2>
          <p>
            Setiap pengguna wajib menjaga kerahasiaan kata sandi dan akun masing-masing. Dilarang mengunggah materi yang melanggar hukum, norma kesusilaan, atau hak cipta pihak lain ke dalam sistem.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink flex items-center gap-1.5">
            <AlertCircle size={16} className="text-rose" /> 2. Panduan KUA &amp; Administrasi Resmi
          </h2>
          <p>
            Daftar persyaratan dokumen KUA, jadwal Bimwin, dan imunisasi yang terdapat di dalam aplikasi bersifat sebagai <strong>panduan umum</strong>. Calon pengantin wajib memverifikasi secara langsung ke Kantor Urusan Agama (KUA) setempat terkait aturan spesifik di wilayah masing-masing.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-ink">3. Batasan Tanggung Jawab</h2>
          <p>
            Nikahku bukan marketplace vendor dan tidak melayani transaksi finansial langsung antara Anda dan vendor pernikahan. Seluruh kesepakatan harga, pembayaran DP, dan kontrak kerja sama merupakan kesepakatan langsung antara Anda dan vendor terkait.
          </p>
        </section>
      </div>
    </div>
  );
}
