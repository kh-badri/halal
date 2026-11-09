'use client';

import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already in standalone mode
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Check iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Listen for Android beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem('roadtohalal_pwa_dismissed');
      if (!dismissed) {
        setShowAndroidBanner(true);
      }
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
        setShowAndroidBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    }
  };

  const handleDismiss = () => {
    setShowAndroidBanner(false);
    localStorage.setItem('roadtohalal_pwa_dismissed', 'true');
  };

  if (isStandalone) return null;

  return (
    <>
      {showAndroidBanner && (
        <div className="mx-4 my-2.5 p-3 bg-white border-2 border-ink rounded-2xl shadow-subtle flex items-center justify-between gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blush border border-ink text-ink flex items-center justify-center shrink-0">
              <Download size={16} />
            </div>
            <div className="truncate">
              <p className="text-xs font-black text-ink leading-tight">Pasang Road To Halal</p>
              <p className="text-[11px] text-ink/70 truncate">Akses cepat &amp; nyaman di layar utama</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1 bg-blush border border-ink text-ink text-xs font-bold rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              Pasang
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
      )}

      {/* iOS Safari Install Guide Modal */}
      <BottomSheet isOpen={showIosModal} onClose={() => setShowIosModal(false)} title="Cara Pasang di iPhone (iOS)">
        <div className="space-y-3.5 py-2 text-ink text-sm">
          <p className="text-xs text-ink/75 leading-relaxed">
            Pasang Road To Halal di layar utama iPhone Anda tanpa melalui App Store:
          </p>
          <div className="flex items-start gap-3 p-3 bg-sky/30 border border-ink/20 rounded-2xl">
            <div className="w-7 h-7 rounded-full bg-white border border-ink text-ink flex items-center justify-center shrink-0 font-black text-xs">1</div>
            <div>
              <p className="font-bold text-xs text-ink">Ketuk tombol Bagikan (Share)</p>
              <p className="text-[11px] text-ink/70 flex items-center gap-1 mt-0.5">
                Ikon kotak dengan panah ke atas <Share size={12} className="inline text-ink" /> di bilah browser Safari.
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
    </>
  );
};
