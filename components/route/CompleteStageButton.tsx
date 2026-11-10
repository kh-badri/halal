'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Lock, Loader2, Sparkles, AlertCircle } from 'lucide-react';
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

  // Read-only members cannot complete stages
  if (isReadOnly) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center p-3 pointer-events-none pb-safe">
        <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-rose-200 px-4 py-2.5 rounded-full shadow-md flex items-center justify-center gap-2 pointer-events-auto">
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
        <div className="w-full max-w-md bg-sky-50 border border-sky-200 px-4 py-2.5 rounded-full shadow-md flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-sky-700 stroke-[3]" />
            <span className="text-xs font-black text-sky-800">
              Tahap Ini Sudah Selesai
            </span>
          </div>
          <button
            onClick={() => router.push('/rute')}
            className="px-3.5 py-1 rounded-full bg-white border border-sky-200 text-xs font-bold text-sky-800 hover:bg-sky-100/50 active:scale-95 transition-all"
          >
            Lihat Rute
          </button>
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    if (!canComplete) {
      setShowUnmetModal(true);
      return;
    }

    if (!confirm('Apakah Anda yakin ingin menyelesaikan tahap ini dan membuka tahap berikutnya?')) {
      return;
    }

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

      // Navigate to route map to show progress
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
              onClick={handleComplete}
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#FF6584] to-[#F0567C] hover:from-[#F0567C] hover:to-[#E03E67] text-white font-black text-sm shadow-rose border border-white/40 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-95 transition-all"
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
              className="w-full py-3 px-4 rounded-full bg-white/95 backdrop-blur-md border border-rose-200 text-slate-700 font-bold text-xs shadow-md shadow-rose-950/5 flex items-center justify-center gap-2 hover:border-rose-300 hover:bg-rose-50/30 active:scale-95 transition-all"
            >
              <Lock size={15} className="text-rose-500" />
              <span>Lengkapi {unmetCount} syarat lagi untuk menyelesaikan</span>
            </button>
          )}
        </div>
      </div>

      {/* Unmet Requirements Dialog Modal */}
      {showUnmetModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border border-rose-100 p-5 shadow-2xl relative animate-slide-up">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <Lock size={17} />
              </div>
              <div>
                <h3 className="text-sm font-black text-ink">Syarat Belum Lengkap</h3>
                <p className="text-[11px] text-slate-500">
                  Tahap berikutnya akan terbuka setelah syarat di bawah terpenuhi:
                </p>
              </div>
            </div>

            <div className="my-3 space-y-2 max-h-60 overflow-y-auto pr-1">
              {unmetItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs text-slate-700 flex items-start gap-2"
                >
                  <AlertCircle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowUnmetModal(false)}
              className="w-full mt-2 py-3 bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white font-bold text-xs rounded-full shadow-rose-sm active:scale-95 transition-all"
            >
              Tutup &amp; Lengkapi Data
            </button>
          </div>
        </div>
      )}
    </>
  );
};
