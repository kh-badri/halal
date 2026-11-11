'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, User, Check, Cloud } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  rightAction?: React.ReactNode;
  userRoleBadge?: string;
  isReadOnly?: boolean;
  saveStatus?: 'idle' | 'saving' | 'saved' | 'error';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  backHref,
  backLabel = 'Rute',
  rightAction,
  userRoleBadge,
  isReadOnly,
  saveStatus = 'idle',
}) => {
  return (
    <header className="sticky top-0 z-30 glass-header border-b border-line px-4 py-3 flex items-center justify-between gap-3 transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-100/90 hover:bg-sky-200 border border-sky-200 text-azure-700 text-xs font-bold active:scale-95 transition-all shrink-0"
            aria-label="Kembali ke Rute"
          >
            <ChevronLeft size={16} className="stroke-[2.5] -ml-0.5" />
            <span>{backLabel}</span>
          </Link>
        ) : (
          <Link href="/rute" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-sky-300 border border-sky-400 p-0.5 flex items-center justify-center shrink-0 shadow-subtle group-hover:scale-105 transition-transform overflow-hidden">
              <img
                src="/icons/icon-192x192.png?v=5"
                alt="Road To Halal"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="truncate hidden xs:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-azure-600 block leading-none">
                Road To Halal
              </span>
              <span className="text-xs font-extrabold text-navy-900 tracking-tight block mt-0.5">
                Persiapan Pernikahan
              </span>
            </div>
          </Link>
        )}

        {backHref && (
          <div className="truncate">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm font-extrabold text-navy-900 truncate tracking-tight">{title}</h1>
              {isReadOnly && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-300 font-bold shrink-0">
                  Hanya Baca
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] font-medium text-slate-500 truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Autosave Indicator */}
        {saveStatus === 'saving' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-azure-600 bg-sky-100 px-2.5 py-0.5 rounded-full border border-sky-200 font-bold animate-pulse">
            <Cloud size={11} className="animate-spin" />
            <span>Menyimpan...</span>
          </span>
        )}
        {saveStatus === 'saved' && (
          <span className="inline-flex items-center gap-1 text-[10px] text-mint-700 bg-mint-100 px-2.5 py-0.5 rounded-full border border-mint-300 font-bold">
            <Check size={11} className="stroke-[3]" />
            <span>Tersimpan</span>
          </span>
        )}

        {userRoleBadge && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-sky-100 text-azure-700 border border-sky-200 font-bold hidden sm:inline-block">
            {userRoleBadge}
          </span>
        )}

        {rightAction ? (
          rightAction
        ) : (
          <Link
            href="/profil"
            className="w-9 h-9 rounded-2xl bg-white border border-line hover:border-azure hover:bg-sky-100/50 flex items-center justify-center text-slate-600 hover:text-azure-600 shadow-xs active:scale-95 transition-all"
            aria-label="Profil dan Pengaturan"
          >
            <User size={16} className="stroke-[2.2]" />
          </Link>
        )}
      </div>
    </header>
  );
};
