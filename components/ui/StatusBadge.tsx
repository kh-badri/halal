'use client';

import React from 'react';
import { Circle, Clock, Check, AlertTriangle, Lock, HelpCircle } from 'lucide-react';

export type StatusType =
  | 'belum'
  | 'terkunci'
  | 'proses'
  | 'aktif'
  | 'selesai'
  | 'terlambat'
  | 'ulang'
  | 'dibahas'
  | 'sepakat'
  | 'ingin'
  | 'dibeli'
  | 'dikirim'
  | 'diterima'
  | 'dikemas'
  | 'diurus'
  | 'diundang'
  | 'konfirmasi'
  | 'hadir'
  | 'lunas'
  | 'dp'
  | 'terdaftar'
  | 'tidak_berlaku';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md';
  customLabel?: string;
  onClick?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  customLabel,
  onClick,
}) => {
  const normalized = (status || 'belum').toLowerCase();

  // PRD 8.3 Status Styling Table
  let bgClass = 'bg-white text-slate-600 border border-dashed border-slate-400';
  let IconComponent: any = Circle;
  let iconClass = 'text-slate-400';
  let defaultLabel = 'Belum';

  if (
    normalized === 'selesai' ||
    normalized === 'sepakat' ||
    normalized === 'lunas' ||
    normalized === 'hadir' ||
    normalized === 'dikemas' ||
    normalized === 'siap' ||
    normalized === 'terbit' ||
    normalized === 'diserahkan' ||
    normalized === 'siap_nikah'
  ) {
    // Selesai: Mint 100 bg, Mint 300 border, Mint 700 text & checkmark
    bgClass = 'bg-mint-100 text-mint-700 border border-mint-300';
    IconComponent = Check;
    iconClass = 'text-mint-700';
    defaultLabel = customLabel || (normalized === 'sepakat' ? 'Sepakat' : normalized === 'hadir' ? 'Hadir' : 'Selesai');
  } else if (
    normalized === 'proses' ||
    normalized === 'aktif' ||
    normalized === 'dibahas' ||
    normalized === 'sebagian' ||
    normalized === 'dp' ||
    normalized === 'dibeli' ||
    normalized === 'dikirim' ||
    normalized === 'diterima' ||
    normalized === 'diurus' ||
    normalized === 'konfirmasi' ||
    normalized === 'diajukan' ||
    normalized === 'terdaftar' ||
    normalized === 'diundang'
  ) {
    // Proses / Aktif: Sky 100 bg, Sky 200 border, Azure 700 text & clock
    bgClass = 'bg-sky-100 text-azure-700 border border-sky-200';
    IconComponent = Clock;
    iconClass = 'text-azure-700';
    defaultLabel = customLabel || (normalized === 'dibahas' ? 'Dibahas' : normalized === 'dp' ? 'DP Terbayar' : normalized === 'diundang' ? 'Diundang' : 'Proses');
  } else if (normalized === 'terlambat' || normalized === 'batal') {
    // Terlambat / Batal: Coral 100 bg, Coral 500 border, Coral 700 text & alert
    bgClass = 'bg-coral-100 text-coral-700 border border-coral-500';
    IconComponent = AlertTriangle;
    iconClass = 'text-coral-700';
    defaultLabel = normalized === 'batal' ? 'Batal' : 'Terlambat';
  } else if (normalized === 'ulang' || normalized === 'pertimbangan') {
    // Pertimbangan / Perlu Bahas Lagi: Peach 100 bg, Peach 300 border, Navy 900 text & help
    bgClass = 'bg-peach-100 text-navy-900 border border-peach-300';
    IconComponent = HelpCircle;
    iconClass = 'text-navy-900';
    defaultLabel = 'Perlu Bahas Lagi';
  } else if (normalized === 'terkunci') {
    bgClass = 'bg-slate-100 text-slate-500 border border-slate-300';
    IconComponent = Lock;
    iconClass = 'text-slate-500';
    defaultLabel = 'Terkunci';
  } else if (normalized === 'tidak_berlaku') {
    bgClass = 'bg-mist text-slate-400 border border-line';
    IconComponent = Circle;
    iconClass = 'text-slate-400';
    defaultLabel = 'Tidak Berlaku';
  } else {
    // Default Belum / Ingin: Putih, Slate 400 dashed border, Slate 600 text
    bgClass = 'bg-white text-slate-600 border border-dashed border-slate-400';
    IconComponent = Circle;
    iconClass = 'text-slate-400';
    defaultLabel = customLabel || (normalized === 'ingin' ? 'Ingin' : 'Belum');
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-bold rounded-full transition-all select-none shadow-xs ${bgClass} ${paddingClass} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      }`}
    >
      <IconComponent size={iconSize} className={`shrink-0 stroke-[2.5] ${iconClass}`} />
      <span>{customLabel || defaultLabel}</span>
    </span>
  );
};
