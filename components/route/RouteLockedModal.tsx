'use client';

import React from 'react';
import { Lock, ArrowRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StageKey, STAGE_ORDER } from '@/lib/schemas/workspace';
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
    router.push(currentDef.path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl border-2 border-ink p-6 shadow-2xl relative animate-slide-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="locked-modal-title"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white border border-ink/30 text-ink flex items-center justify-center hover:bg-blush active:scale-95 transition-all"
          aria-label="Tutup"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-16 h-16 rounded-full bg-white border-2 border-ink border-dashed flex items-center justify-center text-ink/70 mb-4 shadow-sm">
            <Lock size={28} className="text-ink" />
          </div>

          <span className="text-[11px] font-bold uppercase tracking-wider text-ink/60 bg-blush px-3 py-1 rounded-full border border-ink/20 mb-2">
            Tahap Terkunci
          </span>

          <h3 id="locked-modal-title" className="text-lg font-black text-ink mb-1">
            {targetDef.title}
          </h3>

          <p className="text-xs text-ink/80 max-w-xs mt-1 leading-relaxed">
            {prevDef ? (
              <>
                Selesaikan dulu syarat pada{' '}
                <strong className="text-ink underline">“{prevDef.title}”</strong> untuk
                membuka tahap ini.
              </>
            ) : (
              'Tahap ini belum dapat dibuka.'
            )}
          </p>

          <div className="w-full mt-6 space-y-2.5">
            <button
              onClick={handleGoToActive}
              className="w-full py-3.5 px-4 rounded-full bg-blush border-2 border-ink text-ink font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01] active:scale-95 transition-all"
            >
              <span>Ke Tahap Aktif ({currentDef.shortTitle})</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-full bg-white border border-ink/30 text-ink/80 font-semibold text-xs hover:bg-neutral-50 active:scale-95 transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
