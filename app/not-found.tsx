'use client';

import React from 'react';
import Link from 'next/link';
import { MapPinOff, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-mist select-none">
      <div className="w-20 h-20 rounded-full bg-peach-100 border border-peach-300 flex items-center justify-center text-navy-900 mb-4 shadow-subtle">
        <MapPinOff size={36} className="stroke-[2.2]" />
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-0.5 rounded-full border border-slate-300 mb-2">
        Halaman Tidak Ditemukan
      </span>
      <h2 className="text-xl font-extrabold text-navy-900 font-display">Jalur Rute Terputus</h2>
      <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
        Halaman atau tahap yang Anda tuju tidak ditemukan atau berada di luar rute persiapan pernikahan Road To Halal.
      </p>
      <Link
        href="/rute"
        className="mt-6 px-6 py-3 bg-azure hover:bg-azure-700 text-white text-xs font-extrabold rounded-full shadow-subtle flex items-center gap-2 active:scale-95 transition-all"
      >
        <span>Kembali ke Peta Rute</span>
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}
