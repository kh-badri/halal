'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ArrowRight, Download, Share2, Sparkles, Heart } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function HalalCelebrationPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [partnerName, setPartnerName] = useState('');

  useEffect(() => {
    fetch('/api/m/profile')
      .then((res) => res.json())
      .then((data) => {
        const prof = data.data || data;
        setPartnerName(prof?.partner?.fullName || prof?.partner?.nickname || '');
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-aurora flex flex-col justify-between p-6 text-center select-none">
      {/* Top Bar */}
      <div className="pt-4 flex items-center justify-between">
        <Link
          href="/rute"
          className="px-3.5 py-1.5 rounded-full bg-white/90 border border-line text-xs font-bold text-navy-900 shadow-xs hover:bg-white"
        >
          ‹ Peta Rute
        </Link>
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
          Tujuan Tercapai ★
        </span>
      </div>

      {/* Main Celebration Content (PRD 8.8 D5) */}
      <div className="my-auto py-8 space-y-6 max-w-sm mx-auto">
        {/* Big Star Badge */}
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-peach-300/40 blur-xl animate-pulse" />
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-peach-300 via-sky-300 to-azure text-navy-900 border-4 border-white shadow-raised flex items-center justify-center animate-scale-up">
            <Star size={56} className="fill-peach-300 text-navy-900 stroke-[2.2]" />
          </div>
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-3.5 py-1 rounded-full border border-sky-300 shadow-xs">
            <Sparkles size={13} className="text-azure-600" />
            <span>Alhamdulillah, Barakallahu Lakum</span>
          </span>

          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight font-display">
            Resmi Menuju Halal
          </h1>

          {partnerName && (
            <p className="text-sm font-extrabold text-azure-700">
              Bersama {partnerName}
            </p>
          )}

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xs mx-auto pt-1">
            Seluruh 8 tahap persiapan pernikahan telah diselesaikan dengan ikhtiar terbaik dan prinsip yang disepakati bersama.
          </p>
        </div>

        {/* Milestone Statistics Card */}
        <div className="p-4 rounded-3xl bg-white/95 border border-line shadow-card grid grid-cols-3 gap-2 text-center">
          <div className="p-2.5 rounded-2xl bg-sky-50 border border-sky-200">
            <span className="text-xl font-extrabold text-azure-700 font-display block">8/8</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Tahap</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-mint-100 border border-mint-300">
            <span className="text-xl font-extrabold text-mint-700 font-display block">100%</span>
            <span className="text-[10px] font-bold text-mint-700 uppercase">Tuntas</span>
          </div>
          <div className="p-2.5 rounded-2xl bg-peach-100 border border-peach-300">
            <span className="text-xl font-extrabold text-navy-900 font-display block">Halal</span>
            <span className="text-[10px] font-bold text-navy-900 uppercase">Berkah</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 max-w-sm mx-auto w-full pb-4">
        <Link
          href="/rute"
          className="w-full py-3.5 bg-azure hover:bg-azure-700 text-white font-extrabold text-xs rounded-full shadow-subtle flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Lihat Peta Rute Lengkap</span>
          <ArrowRight size={15} />
        </Link>

        <a
          href="/api/export"
          download="roadtohalal-rekap-perjalanan.json"
          className="w-full py-3 bg-white border border-line text-navy-900 font-bold text-xs rounded-full shadow-xs hover:bg-slate-50 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <Download size={14} className="text-slate-500" />
          <span>Ekspor Rekap Perjalanan</span>
        </a>
      </div>
    </div>
  );
}
