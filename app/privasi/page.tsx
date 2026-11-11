'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, Lock, ChevronDown } from 'lucide-react';

export default function PrivasiPage() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total > 0) {
        setScrollProgress(Math.min(100, Math.round((window.scrollY / total) * 100)));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-mist text-navy-900 pb-20">
      {/* 3px Reading Progress Bar (PRD Section 8.9) */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-sky-200 z-50">
        <div
          className="h-full bg-azure transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header className="sticky top-0 z-40 glass-header border-b border-line px-4 py-3 flex items-center gap-3">
        <Link
          href="/"
          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-100 hover:bg-sky-200 border border-sky-200 text-azure-700 text-xs font-bold transition-all"
        >
          <ChevronLeft size={16} className="stroke-[2.5] -ml-0.5" />
          <span>Kembali</span>
        </Link>
        <h1 className="text-sm font-extrabold text-navy-900">Kebijakan Privasi</h1>
      </header>

      <div className="p-6 max-w-lg mx-auto space-y-5">
        <div className="p-4 bg-sky-100 border border-sky-200 rounded-3xl flex items-start gap-3 shadow-subtle">
          <ShieldCheck size={22} className="text-azure-700 shrink-0 mt-0.5" />
          <p className="text-xs text-navy-900 leading-relaxed font-medium">
            <strong>Road To Halal</strong> berkomitmen penuh menjaga kerahasiaan data pribadi, kesehatan, dan keluarga calon pengantin sesuai prinsip Undang-Undang Perlindungan Data Pribadi (UU PDP).
          </p>
        </div>

        <div className="space-y-3">
          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all" open>
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span className="flex items-center gap-2">
                <Lock size={15} className="text-azure-600" />
                1. Pengumpulan &amp; Penyimpanan Data
              </span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Data yang Anda masukkan (biodata ta’aruf, riwayat kesehatan, catatan keluarga, anggaran, daftar tamu, dan pindaian berkas KUA) disimpan secara terisolasi per ruang kerja (workspace) akun Anda sendiri.
            </p>
          </details>

          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all" open>
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-azure-600" />
                2. Tanpa Pelacak Pihak Ketiga &amp; Tanpa Iklan
              </span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Aplikasi Road To Halal <strong>tidak menggunakan pelacak pihak ketiga</strong> (seperti Google Analytics atau Facebook Pixel) dan <strong>tidak pernah memperjualbelikan atau membagikan data Anda kepada pihak pengiklan atau vendor manapun</strong>.
            </p>
          </details>

          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span className="flex items-center gap-2">
                <Lock size={15} className="text-azure-600" />
                3. Keamanan Berkas &amp; Sensor Privasi
              </span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Semua dokumen tersimpan di luar direktori publik server web dan hanya dapat diakses melalui verifikasi sesi login yang sah. Terdapat fitur Blur Privasi pada data kesehatan dan keluarga untuk mencegah intipan visual di tempat umum.
            </p>
          </details>

          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-azure-600" />
                4. Penghapusan &amp; Ekspor Data
              </span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Anda berhak mengunduh seluruh data dalam format JSON melalui menu Ekspor kapan saja, atau menghapus akun dan seluruh data ruang persiapan secara permanen melalui Pengaturan Akun.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
