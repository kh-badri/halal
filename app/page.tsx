'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.replace('/rute');
        }
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-aurora">
      <div className="pt-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-sky-300/40 blur-md -z-10" />
          <img
            src="/icons/icon-192x192.png?v=5"
            alt="Road To Halal Logo"
            width={96}
            height={96}
            className="w-24 h-24 rounded-3xl shadow-raised border border-sky-300 object-cover"
          />
        </div>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight font-display">
          Road To Halal
        </h1>
        <p className="text-xs text-azure-700 font-extrabold uppercase tracking-widest mt-1">
          Aplikasi Persiapan Pernikahan (PWA)
        </p>
        <p className="text-xs sm:text-sm text-slate-600 mt-3 max-w-xs mx-auto leading-relaxed">
          Menemani langkah calon pengantin dari persetujuan ta’aruf sampai hari akad dan walimah, selangkah demi selangkah.
        </p>
      </div>

      <div className="my-6 space-y-3">
        <div className="p-4 rounded-2xl bg-white/95 border border-line shadow-subtle flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100 border border-sky-200 text-azure-700 flex items-center justify-center shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy-900">Peta Rute 8 Tahap Berkelok</h3>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Alur berurutan &amp; terkunci. Memastikan setiap persiapan prinsip tuntas sebelum melangkah ke tahap berikutnya.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 border border-line shadow-subtle flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-mint-100 border border-mint-300 text-mint-700 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy-900">Sesi Tanya Jawab Ta’aruf</h3>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Kupas tuntas 57 pertanyaan prinsip, visi keluarga, finansial, dan adab pranikah secara terarah bersama calon pasangan.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/95 border border-line shadow-subtle flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-peach-100 border border-peach-300 text-navy-900 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-navy-900">Ruang Pribadi &amp; Hak Akses</h3>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Undang pasangan, orang tua, atau perantara dengan hak akses Read (hanya melihat) atau Full (ikut mengisi).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pb-6">
        <Link
          href="/register"
          className="w-full py-3.5 bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Mulai Perjalanan Sekarang</span>
          <ArrowRight size={16} />
        </Link>
        <Link
          href="/gabung"
          className="w-full py-3.5 bg-sky-100 hover:bg-sky-200 border border-sky-300 text-azure-700 font-extrabold rounded-full text-xs shadow-xs hover:scale-[1.01] active:scale-95 transition-all text-center block"
        >
          Gabung Lewat Kode Undangan
        </Link>
        <Link
          href="/login"
          className="w-full py-3 bg-white border border-line text-navy-900 font-bold rounded-full text-xs hover:bg-slate-50 active:scale-95 transition-all text-center block"
        >
          Masuk ke Akun Saya
        </Link>

        {/* Tombol Cadangan Install PWA */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const installBtn = document.querySelector('button:has(svg.stroke-\\[2\\.5\\])') as HTMLButtonElement;
            if (installBtn) {
              installBtn.click();
            } else {
              alert('Aplikasi dapat dipasang melalui menu browser Anda: ketuk titik tiga (⋮) atau tombol Share lalu pilih Tambah ke Layar Utama.');
            }
          }}
          className="w-full py-2.5 bg-sky-50 border border-sky-200 text-azure-700 font-extrabold rounded-full text-xs hover:bg-sky-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Download size={14} className="shrink-0 stroke-[2.5]" />
          <span>Pasang / Install Aplikasi di HP</span>
        </button>

        <p className="text-[11px] text-center text-slate-500 pt-2">
          Dengan mendaftar, Anda menyetujui{' '}
          <Link href="/syarat" className="underline text-azure-700 font-semibold">
            Syarat
          </Link>{' '}
          &amp;{' '}
          <Link href="/privasi" className="underline text-azure-700 font-semibold">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
