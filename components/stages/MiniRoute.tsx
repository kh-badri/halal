'use client';

import React from 'react';
import Link from 'next/link';
import { StageKey, STAGE_ORDER } from '@/lib/schemas/workspace';
import { STAGE_DEFINITIONS, isStageUnlocked, getStageStatus } from '@/lib/route/stages';
import { Check, Lock } from 'lucide-react';

interface MiniRouteProps {
  currentStageKey: StageKey;
  routeData: any;
}

export function MiniRoute({ currentStageKey, routeData }: MiniRouteProps) {
  if (!routeData) return null;

  return (
    <div className="w-full glass-header border-b border-line px-4 py-2.5">
      <div className="relative flex items-center justify-between max-w-md mx-auto">
        {/* Connecting line behind the dots */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-line z-0" />

        {STAGE_ORDER.map((key, index) => {
          const stepNum = index + 1;
          const isCurrent = key === currentStageKey;
          const isUnlocked = isStageUnlocked(routeData, key);
          const status = getStageStatus(routeData, key);
          const isCompleted = status === 'completed';

          const content = (
            <div
              className={`relative z-10 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-bold transition-all ${
                isCurrent
                  ? 'bg-azure text-white ring-4 ring-azure/20 scale-110 shadow-subtle'
                  : isCompleted
                  ? 'bg-mint-300 text-mint-700 border border-mint-400 shadow-xs hover:scale-105'
                  : isUnlocked
                  ? 'bg-sky-100 text-azure-700 border border-sky-300 hover:scale-105'
                  : 'bg-slate-100 text-slate-400 border border-slate-300'
              }`}
              title={`Tahap ${stepNum}: ${STAGE_DEFINITIONS[key]?.title || key}`}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-mint-700 stroke-[3]" />
              ) : isUnlocked ? (
                <span>{stepNum}</span>
              ) : (
                <Lock className="w-3 h-3 text-slate-400" />
              )}
            </div>
          );

          if (isUnlocked && !isCurrent) {
            return (
              <Link
                key={key}
                href={`/tahap/${key}`}
                className="hover:opacity-80 active:scale-95 transition-all"
                aria-label={`Buka Tahap ${stepNum}`}
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={key} aria-disabled={!isUnlocked}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
