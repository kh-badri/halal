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
    <div className="w-full bg-white/95 backdrop-blur-md border-b border-rose-100 px-4 py-3 shadow-[0_2px_10px_rgba(240,86,124,0.05)]">
      <div className="relative flex items-center justify-between max-w-md mx-auto">
        {/* Subtle connecting line behind the dots */}
        <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-0.5 bg-rose-100 z-0" />

        {STAGE_ORDER.map((key, index) => {
          const stepNum = index + 1;
          const isCurrent = key === currentStageKey;
          const isUnlocked = isStageUnlocked(routeData, key);
          const status = getStageStatus(routeData, key);
          const isCompleted = status === 'completed';

          const content = (
            <div
              className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-black transition-all ${
                isCurrent
                  ? 'bg-gradient-to-tr from-[#FF6584] to-[#F0567C] text-white ring-4 ring-rose-200/60 scale-110 shadow-rose-sm'
                  : isCompleted
                  ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-xs hover:scale-105'
                  : 'bg-white text-slate-300 border border-slate-200'
              }`}
              title={`Tahap ${stepNum}: ${STAGE_DEFINITIONS[key].title}`}
            >
              {isCompleted ? (
                <Check className="w-4 h-4 text-sky-800 stroke-[3]" />
              ) : isUnlocked ? (
                <span>{stepNum}</span>
              ) : (
                <Lock className="w-3 h-3 text-slate-300" />
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
