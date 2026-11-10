'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Gift,
  DollarSign,
  FileCheck,
  Users,
  Calendar,
  CheckSquare,
  BookOpen,
  Home,
  ChevronRight,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';

export default function ModulIndexPage() {
  const coreModules = [
    {
      title: 'Ta’aruf & Komitmen',
      desc: 'Biodata mendalam, riwayat kesehatan, & tanya jawab pranikah',
      href: '/taaruf',
      icon: Sparkles,
      color: 'bg-blush text-rose',
      border: 'border-blush',
    },
    {
      title: 'Persiapan Khitbah',
      desc: 'Tracker 20+ seserahan & susunan acara lamaran otomatis',
      href: '/khitbah',
      icon: Gift,
      color: 'bg-sky text-ink',
      border: 'border-sky',
    },
    {
      title: 'Budgeting & Cashflow',
      desc: 'Pemisahan pos anggaran, mahar, sumber dana, & tracker vendor multi-termin',
      href: '/budget',
      icon: DollarSign,
      color: 'bg-blush text-rose',
      border: 'border-blush',
    },
    {
      title: 'Administrasi KUA',
      desc: 'Checklist dokumen Catin (N1-N6), numpang nikah, suntik TT & Bimwin',
      href: '/kua',
      icon: FileCheck,
      color: 'bg-sky text-ink',
      border: 'border-sky',
    },
    {
      title: 'Hari-H Akad & Walimah',
      desc: 'Daftar tamu, kuota katering, panitia keluarga, saksi & rundown hari-H',
      href: '/hari-h',
      icon: Users,
      color: 'bg-blush text-rose',
      border: 'border-blush',
    },
  ];

  const additionalModules = [
    {
      title: 'Kalender & Timeline',
      desc: 'Jadwal terpadu khitbah, TT, bimwin, jatuh tempo, & hari-H (H-180 s/d Hari-H)',
      href: '/modul/kalender',
      icon: Calendar,
      color: 'bg-sky text-ink',
    },
    {
      title: 'Daftar Tugas (To-Do)',
      desc: 'Manajemen to-do terpadu lintas modul dari persiapan awal sampai walimah',
      href: '/modul/tugas',
      icon: CheckSquare,
      color: 'bg-blush text-rose',
    },
    {
      title: 'Catatan & Doa Pernikahan',
      desc: 'Kumpulan doa berkah pengantin baru, adab malam pertama, & jurnal pribadi',
      href: '/modul/doa',
      icon: BookOpen,
      color: 'bg-sky text-ink',
    },
    {
      title: 'Persiapan Rumah Tangga',
      desc: 'Rencana perabot dasar, kontrak/sewa rumah, & anggaran bulan pertama pascanikah',
      href: '/modul/rumah-tangga',
      icon: Home,
      color: 'bg-blush text-rose',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-16">
      <AppHeader title="Semua Modul" subtitle="Pusat kontrol persiapan pernikahan Anda" />

      <div className="p-5 space-y-6">
        {/* Core Modules Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-rose uppercase tracking-wider">5 Modul Inti</h2>
            <span className="text-[11px] text-ink/60">P0 Wajib</span>
          </div>

          <div className="space-y-3">
            {coreModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className={`p-4 rounded-3xl bg-white border ${mod.border} shadow-soft hover:shadow-md hover:border-rose/50 active:scale-[0.98] transition-all flex items-center justify-between gap-3`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${mod.color}`}>
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-extrabold text-ink truncate">{mod.title}</h3>
                      <p className="text-xs text-ink/70 line-clamp-1 mt-0.5">{mod.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-ink/40 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Additional Modules Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-rose uppercase tracking-wider">Modul Pendukung</h2>
            <span className="text-[11px] text-ink/60">P1 &amp; P2</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {additionalModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={mod.href}
                  href={mod.href}
                  className="p-4 rounded-3xl bg-white border border-blush hover:border-rose/40 shadow-soft hover:scale-[1.01] active:scale-98 transition-all flex flex-col justify-between"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-3 shrink-0 ${mod.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-ink leading-snug">{mod.title}</h3>
                    <p className="text-[10px] text-ink/65 line-clamp-2 mt-1">{mod.desc}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
