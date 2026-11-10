'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone, MoreVertical } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  // Default to showing banner if not in standalone mode
  const [showBanner, setShowBanner] = useState(true);
  const [showIosModal, setShowIosModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Clear old permanent dismissed flag so install button always appears as requested
    try {
      localStorage.removeItem('roadtohalal_pwa_dismissed');
    } catch {}

    // Check if user temporarily dismissed in this current session
    try {
      const sessionDismissed = sessionStorage.getItem('roadtohalal_pwa_session_dismissed');
      if (sessionDismissed === 'true') {
        setShowBanner(false);
      }
    } catch {}

    // Check if already running in standalone PWA mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) {
      setShowBanner(false);
      return;
    }

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Android/Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      setShowManualModal(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    try {
      sessionStorage.setItem('roadtohalal_pwa_session_dismissed', 'true');
    } catch {}
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      <div className="mx-3.5 my-2.5 p-3 bg-white border-2 border-ink rounded-2xl shadow-subtle flex items-center justify-between gap-2.5 animate-in fade-in duration-300">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/icons/icon-192x192.png?v=3"
            alt="Road To Halal"
            className="w-10 h-10 rounded-xl border border-rose-200 shadow-sm object-cover shrink-0"
          />
          <div className="truncate">
            <p className="text-xs font-black text-ink leading-tight">Pasang Road To Halal</p>
            <p className="text-[11px] text-ink/70 truncate">Akses cepat di layar utama HP</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleInstallClick}
            className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white border-2 border-ink text-xs font-black rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Download size={14} className="shrink-0 stroke-[2.5]" />
            <span>Install</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 text-ink/50 hover:text-ink transition-colors"
            aria-label="Tutup"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* iOS Safari Install Guide Modal */}
      <BottomSheet isOpen={showIosModal} onClose={() => setShowIosModal(false)} title="Cara Pasang di iPhone (iOS)">
        <div className="space-y-3.5 py-2 text-ink text-sm">
          <div className="flex items-center gap-3 p-3 bg-blush/30 border border-ink/20 rounded-2xl">
            <img
              src="/icons/icon-192x192.png?v=3"
              alt="Road To Halal"
              className="w-12 h-12 rounded-2xl shadow-sm border border-rose-200/80 object-cover shrink-0"
            />
            <div>
              <p className="text-xs font-black text-ink">Road To Halal</p>
              <p className="text-[11px] text-ink/70">Aplikasi Persiapan Pernikahan Islami</p>
            </div>
          </div>

          <p className="text-xs text-ink/75 leading-relaxed">
            Pasang Road To Halal di layar utama iPhone Anda tanpa melalui App Store:
          </p>

          <div className="flex items-start gap-3 p-3 bg-sky/30 border border-ink/20 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">1</div>
            <div>
              <p className="font-bold text-xs text-ink">Ketuk tombol Bagikan (Share)</p>
              <p className="text-[11px] text-ink/70 flex items-center gap-1 mt-0.5">
                Ikon kotak dengan panah ke atas <Share size={12} className="inline text-ink" /> di bilah bawah browser Safari.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blush/30 border border-ink/20 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">2</div>
            <div>
              <p className="font-bold text-xs text-ink">Pilih &quot;Tambah ke Layar Utama&quot;</p>
              <p className="text-[11px] text-ink/70 flex items-center gap-1 mt-0.5">
                Scroll dan ketuk <PlusSquare size={12} className="inline text-ink" /> &quot;Add to Home Screen&quot;.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white border border-ink/30 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">3</div>
            <div>
              <p className="font-bold text-xs text-ink">Ketuk &quot;Tambah&quot; di pojok kanan atas</p>
              <p className="text-[11px] text-ink/70 mt-0.5">
                Ikon Road To Halal akan langsung muncul di layar utama iPhone Anda siap dibuka seperti aplikasi bawaan!
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowIosModal(false)}
            className="w-full py-3 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm mt-3 active:scale-95 transition-all"
          >
            Mengerti, Siap Pasang
          </button>
        </div>
      </BottomSheet>

      {/* Android / Desktop Manual Guide Modal */}
      <BottomSheet isOpen={showManualModal} onClose={() => setShowManualModal(false)} title="Cara Pasang Aplikasi">
        <div className="space-y-3.5 py-2 text-ink text-sm">
          <div className="flex items-center gap-3 p-3 bg-blush/30 border border-ink/20 rounded-2xl">
            <img
              src="/icons/icon-192x192.png?v=3"
              alt="Road To Halal"
              className="w-12 h-12 rounded-2xl shadow-sm border border-rose-200/80 object-cover shrink-0"
            />
            <div>
              <p className="text-xs font-black text-ink">Road To Halal</p>
              <p className="text-[11px] text-ink/70">Aplikasi Persiapan Pernikahan Islami</p>
            </div>
          </div>

          <p className="text-xs text-ink/75 leading-relaxed">
            Pasang langsung ke layar utama handphone Anda melalui browser:
          </p>

          <div className="flex items-start gap-3 p-3 bg-sky/30 border border-ink/20 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">1</div>
            <div>
              <p className="font-bold text-xs text-ink">Buka Menu Browser</p>
              <p className="text-[11px] text-ink/70 flex items-center gap-1 mt-0.5">
                Ketuk tombol titik tiga <MoreVertical size={12} className="inline text-ink" /> di pojok kanan atas browser (Chrome/Edge/Samsung).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-blush/30 border border-ink/20 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">2</div>
            <div>
              <p className="font-bold text-xs text-ink">Pilih &quot;Instal aplikasi&quot; atau &quot;Tambahkan ke Layar Utama&quot;</p>
              <p className="text-[11px] text-ink/70 flex items-center gap-1 mt-0.5">
                <Smartphone size={12} className="inline text-ink" /> Pilih opsi Install atau Add to Home Screen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-white border border-ink/30 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">3</div>
            <div>
              <p className="font-bold text-xs text-ink">Konfirmasi Pemasangan</p>
              <p className="text-[11px] text-ink/70 mt-0.5">
                Aplikasi Road To Halal akan terpasang di layar utama handphone dan dapat diakses cepat secara offline.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowManualModal(false)}
            className="w-full py-3 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm mt-3 active:scale-95 transition-all"
          >
            Mengerti, Siap Pasang
          </button>
        </div>
      </BottomSheet>
    </>
  );
};
