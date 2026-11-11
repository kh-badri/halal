'use client';

import React from 'react';
import { CloudOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-mist select-none">
      <div className="w-20 h-20 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-azure-700 mb-4 shadow-subtle animate-bounce">
        <CloudOff size={36} className="stroke-[2.2]" />
      </div>
      <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-3 py-0.5 rounded-full border border-sky-300 mb-2">
        Koneksi Terputus
      </span>
      <h2 className="text-xl font-extrabold text-navy-900 font-display">Sedang Offline</h2>
      <p className="text-xs text-slate-600 mt-2 max-w-xs leading-relaxed">
        Koneksi internet Anda sedang terputus. Data Anda tetap tersimpan aman di perangkat dan akan disinkronkan ke server secara otomatis saat tersambung kembali.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-3 bg-azure hover:bg-azure-700 text-white text-xs font-extrabold rounded-full shadow-subtle flex items-center gap-2 active:scale-95 transition-all"
      >
        <RefreshCw size={14} />
        <span>Coba Sambungkan Kembali</span>
      </button>
    </div>
  );
}
