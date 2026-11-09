'use client';

import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
      <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center text-rose mb-4 shadow-sm">
        <WifiOff size={32} />
      </div>
      <h2 className="text-xl font-extrabold text-ink">Sedang Offline</h2>
      <p className="text-xs text-ink/70 mt-2 max-w-xs leading-relaxed">
        Koneksi internet Anda sedang terputus. Data Anda tetap tersimpan di perangkat ini dan akan otomatis disinkronkan saat online kembali.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-6 px-6 py-2.5 bg-rose text-white text-xs font-bold rounded-full shadow-md flex items-center gap-2 active:scale-95 transition-all"
      >
        <RefreshCw size={14} />
        <span>Coba Muat Ulang</span>
      </button>
    </div>
  );
}
