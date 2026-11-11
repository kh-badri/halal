'use client';

import React from 'react';
import { Lock, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StageKey } from '@/lib/schemas/workspace';
import { STAGE_DEFINITIONS, getPreviousStage } from '@/lib/route/stages';

interface RouteLockedModalProps {
  targetStage: StageKey | null;
  currentActiveStage: StageKey;
  isOpen: boolean;
  onClose: () => void;
}

export const RouteLockedModal: React.FC<RouteLockedModalProps> = ({
  targetStage,
  currentActiveStage,
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  if (!isOpen || !targetStage) return null;

  const targetDef = STAGE_DEFINITIONS[targetStage];
  const prevStageKey = getPreviousStage(targetStage);
  const prevDef = prevStageKey ? STAGE_DEFINITIONS[prevStageKey] : null;
  const currentDef = STAGE_DEFINITIONS[currentActiveStage];

  const handleGoToActive = () => {
    onClose();
    if (currentDef) {
      router.push(currentDef.path);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] border border-line p-6 shadow-sheet relative animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-modal-title"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto -mt-2 mb-4 sm:hidden" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-mist border border-line text-slate-500 hover:text-navy-900 flex items-center justify-center active:scale-95 transition-all"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center text-azure-700 mb-4 shadow-subtle">
            <Lock size={28} className="text-azure-700 stroke-[2.2]" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-300 mb-2">
            Tahap Terkunci
          </span>

          <h3 id="locked-modal-title" className="text-lg font-extrabold text-navy-900 mb-1">
            {targetDef?.title || 'Tahap Terkunci'}
          </h3>

          <p className="text-xs text-slate-600 max-w-xs mt-1 leading-relaxed">
            {prevDef ? (
              <>
                Selesaikan dulu syarat pada{' '}
                <strong className="text-navy-900 font-bold">“{prevDef.title}”</strong> untuk
                membuka tahap ini.
              </>
            ) : (
              'Tahap ini belum dapat dibuka.'
            )}
          </p>

          <div className="w-full mt-6 space-y-2.5">
            <button
              onClick={handleGoToActive}
              className="w-full py-3.5 px-4 rounded-full bg-azure hover:bg-azure-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-subtle active:scale-95 transition-all"
            >
              <span>Ke Tahap Saat Ini ({currentDef?.shortTitle || 'Tahap Aktif'})</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-navy-900 font-semibold"
            >
              Kembali ke Peta Rute
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
