'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, ShieldCheck } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  rightAction?: React.ReactNode;
  userRoleBadge?: string;
  isReadOnly?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  backHref,
  backLabel = 'Rute',
  rightAction,
  userRoleBadge,
  isReadOnly,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-rose-100 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_2px_15px_-3px_rgba(240,86,124,0.05)]">
      <div className="flex items-center gap-2.5 min-w-0">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/80 hover:bg-rose-100/80 border border-rose-200 text-rose-600 text-xs font-bold active:scale-95 transition-all shrink-0"
            aria-label="Kembali ke Rute"
          >
            <ArrowLeft size={14} className="stroke-[2.5]" />
            <span>{backLabel}</span>
          </Link>
        ) : (
          <Link href="/rute" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#FF6584] to-[#F0567C] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md shadow-rose-500/25 group-hover:scale-105 transition-transform">
              💍
            </div>
            <div className="truncate hidden xs:block">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block leading-none">
                Aplikasi Pranikah
              </span>
              <span className="text-sm font-black text-ink tracking-tight block">
                Road To Halal
              </span>
            </div>
          </Link>
        )}

        {backHref && (
          <div className="truncate">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm font-black text-ink truncate">{title}</h1>
              {isReadOnly && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky text-sky-800 border border-sky-200 font-bold shrink-0">
                  Hanya Baca
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] font-medium text-slate-500 truncate">{subtitle}</p>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {userRoleBadge && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-bold hidden sm:inline-block">
            {userRoleBadge}
          </span>
        )}
        {rightAction ? (
          rightAction
        ) : (
          <Link
            href="/profil"
            className="w-9 h-9 rounded-2xl bg-white border border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/50 flex items-center justify-center text-slate-600 hover:text-rose-600 shadow-xs active:scale-95 transition-all"
            aria-label="Profil dan Pengaturan"
          >
            <User size={16} className="stroke-[2.2]" />
          </Link>
        )}
      </div>
    </header>
  );
};
