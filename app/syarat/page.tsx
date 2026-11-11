'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, BookOpen, AlertCircle, ChevronDown, Check } from 'lucide-react';

export default function SyaratPage() {
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
        <h1 className="text-sm font-extrabold text-navy-900">Syarat Penggunaan</h1>
      </header>

      <div className="p-6 max-w-lg mx-auto space-y-5">
        <div className="p-4 bg-sky-100 border border-sky-200 rounded-3xl flex items-start gap-3 shadow-subtle">
          <BookOpen size={22} className="text-azure-700 shrink-0 mt-0.5" />
          <p className="text-xs text-navy-900 leading-relaxed font-medium">
            <strong>Road To Halal</strong> adalah alat bantu mandiri untuk memandu dan mencatat proses persiapan pernikahan secara terarah, mulai dari ta’aruf hingga akad dan walimah.
          </p>
        </div>

        <div className="space-y-3">
          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all" open>
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span>1. Ketentuan Penggunaan Akun</span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Setiap pengguna bertanggung jawab atas keamanan akun dan kata sandi masing-masing. Dilarang mengunggah materi yang melanggar hukum, norma agama, kesusilaan, atau hak pihak lain ke dalam ruang data bersama.
            </p>
          </details>

          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all" open>
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span>2. Panduan KUA &amp; Administrasi Resmi</span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Daftar dokumen KUA, persyaratan numpang nikah, jadwal Bimwin, dan imunisasi yang terdapat di dalam aplikasi merupakan <strong>panduan umum</strong> sesuai ketentuan Kemenag RI. Calon pengantin wajib memverifikasi secara langsung ke Kantor Urusan Agama (KUA) setempat terkait aturan spesifik di wilayah masing-masing.
            </p>
          </details>

          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span>3. Batasan Tanggung Jawab</span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Aplikasi ini adalah media bantu perencanaan. Keputusan ta’aruf, khitbah, akad, dan pemilihan vendor sepenuhnya merupakan hak serta tanggung jawab masing-masing calon pengantin dan pihak keluarga yang bersangkutan.
            </p>
          </details>

          <details className="bg-white border border-line rounded-2xl p-4 shadow-subtle group open:pb-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none text-xs font-extrabold text-navy-900">
              <span>4. Hak Akses Read dan Full</span>
              <ChevronDown size={16} className="text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <p className="text-xs text-slate-600 mt-2.5 leading-relaxed border-t border-line pt-2.5">
              Pemilik ruang persiapan berhak memberikan hak akses Read (hanya melihat) atau Full (ikut mengisi data) kepada pasangan, perantara, atau keluarga. Akses dapat dicabut sewaktu-waktu oleh pemilik akun.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
