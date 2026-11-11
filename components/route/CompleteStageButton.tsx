'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Loader2, Sparkles, AlertCircle, X } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { StageKey } from '@/lib/schemas/workspace';
import { STAGE_DEFINITIONS } from '@/lib/route/stages';

interface CompleteStageButtonProps {
  stageKey: StageKey;
  canComplete: boolean;
  unmetCount: number;
  unmetItems: string[];
  isCompleted: boolean;
  isReadOnly: boolean;
}

export const CompleteStageButton: React.FC<CompleteStageButtonProps> = ({
  stageKey,
  canComplete,
  unmetCount,
  unmetItems,
  isCompleted,
  isReadOnly,
}) => {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showUnmetModal, setShowUnmetModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Read-only members cannot complete stages
  if (isReadOnly) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-3 pointer-events-none pb-safe">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-line px-4 py-2.5 rounded-full shadow-subtle flex items-center justify-center gap-2 pointer-events-auto">
          <span className="text-xs font-bold text-slate-600">
            Mode Hanya Baca · Lencana View Only
          </span>
        </div>
      </div>
    );
  }

  // Already completed
  if (isCompleted) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-3 pointer-events-none pb-safe">
        <div className="w-full max-w-md bg-mint-100 border border-mint-300 px-4 py-2.5 rounded-full shadow-subtle flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-mint-700 stroke-[3]" />
            <span className="text-xs font-extrabold text-mint-700">
              Tahap Ini Sudah Selesai
            </span>
          </div>
          <button
            onClick={() => router.push('/rute')}
            className="px-3.5 py-1 rounded-full bg-white border border-mint-300 text-xs font-bold text-mint-700 hover:bg-mint-50 active:scale-95 transition-all shadow-xs"
          >
            Lihat Rute
          </button>
        </div>
      </div>
    );
  }

  const handleExecuteComplete = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    try {
      const res = await fetch('/api/route/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({
          message: data.error || 'Syarat belum lengkap',
          type: 'error',
        });
        setLoading(false);
        return;
      }

      showToast({
        message: data.message || 'Tahap berhasil diselesaikan! Bismillah.',
        type: 'success',
      });

      router.push('/rute');
      router.refresh();
    } catch {
      showToast({ message: 'Terjadi kesalahan server', type: 'error' });
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-3 pointer-events-none pb-safe">
        <div className="w-full max-w-md pointer-events-auto">
          {canComplete ? (
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-azure hover:bg-azure-700 text-white font-extrabold text-sm shadow-subtle flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin text-white" />
              ) : (
                <>
                  <Check size={18} className="stroke-[3] text-white" />
                  <span>Selesaikan Tahap Ini</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setShowUnmetModal(true)}
              className="w-full py-3 px-4 rounded-full bg-white/95 backdrop-blur-md border border-line text-slate-700 font-bold text-xs shadow-subtle flex items-center justify-center gap-2 hover:border-azure/40 hover:bg-sky-50 active:scale-95 transition-all"
            >
              <Lock size={15} className="text-azure-600" />
              <span>Lengkapi {unmetCount} syarat lagi untuk menyelesaikan</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog Modal (PRD B3) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl border border-line p-5 shadow-sheet space-y-4 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-mint-100 border border-mint-300 text-mint-700 flex items-center justify-center mx-auto">
              <Check size={24} className="stroke-[3]" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-extrabold text-navy-900">Selesaikan Tahap Ini?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Semua syarat telah terpenuhi. Anda dapat membuka tahap berikutnya di Peta Rute.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-full border border-line text-slate-700 font-bold text-xs hover:bg-slate-50 active:scale-95 transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteComplete}
                className="flex-1 py-2.5 rounded-full bg-azure hover:bg-azure-700 text-white font-extrabold text-xs shadow-subtle active:scale-95 transition-all"
              >
                Ya, Selesaikan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unmet Requirements Dialog Modal */}
      {showUnmetModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-line p-5 shadow-sheet relative animate-slide-up">
            <button
              onClick={() => setShowUnmetModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-mist text-slate-500 hover:text-navy-900 flex items-center justify-center"
            >
              <X size={15} />
            </button>

            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-azure-700 shrink-0">
                <Lock size={17} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-navy-900">Syarat Belum Lengkap</h3>
                <p className="text-[11px] text-slate-500">
                  Tahap berikutnya akan terbuka setelah syarat di bawah terpenuhi:
                </p>
              </div>
            </div>

            <div className="my-3 space-y-2 max-h-60 overflow-y-auto pr-1">
              {unmetItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-coral-100/60 border border-coral-200 text-xs text-navy-900 flex items-start gap-2"
                >
                  <AlertCircle size={15} className="text-coral-500 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUnmetModal(false)}
              className="w-full mt-2 py-3 bg-azure hover:bg-azure-700 text-white font-extrabold text-xs rounded-full shadow-subtle active:scale-95 transition-all"
            >
              Tutup &amp; Lengkapi Data
            </button>
          </div>
        </div>
      )}
    </>
  );
};
