'use client';

import React from 'react';
import { Circle, Clock, Check, AlertTriangle, Lock } from 'lucide-react';

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
  const normalized = status.toLowerCase();

  let bgClass = 'bg-white text-ink/70 border-dashed border-ink/55';
  let IconComponent = Circle;
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
    // Selesai: Biru Muda + 2px ink border + centang (PRD 8.1)
    bgClass = 'bg-sky text-ink border-2 border-ink';
    IconComponent = Check;
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
    // Proses / Aktif: Pink Muda + 2px ink border + jam (PRD 8.1)
    bgClass = 'bg-blush text-ink border-2 border-ink';
    IconComponent = Clock;
    defaultLabel = customLabel || (normalized === 'dibahas' ? 'Dibahas' : normalized === 'dp' ? 'DP Terbayar' : normalized === 'diundang' ? 'Diundang' : 'Proses');
  } else if (normalized === 'terlambat' || normalized === 'ulang') {
    // Terlambat: Putih + outline ink tebal 2px + peringatan (PRD 8.1)
    bgClass = 'bg-white text-ink border-2 border-ink font-bold';
    IconComponent = AlertTriangle;
    defaultLabel = normalized === 'ulang' ? 'Perlu Bahas Lagi' : 'Terlambat';
  } else if (normalized === 'terkunci') {
    bgClass = 'bg-white text-ink/70 border-dashed border-ink/55';
    IconComponent = Lock;
    defaultLabel = 'Terkunci';
  } else if (normalized === 'tidak_berlaku') {
    bgClass = 'bg-neutral-100 text-ink/50 border border-ink/20';
    IconComponent = Circle;
    defaultLabel = 'Tidak Berlaku';
  } else {
    // Default Belum: Putih + outline putus-putus ink 55% + lingkaran (PRD 8.1)
    bgClass = 'bg-white text-ink/70 border-dashed border-ink/55';
    IconComponent = Circle;
    defaultLabel = customLabel || (normalized === 'ingin' ? 'Ingin' : 'Belum');
  }

  const paddingClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-bold rounded-full transition-all select-none ${bgClass} ${paddingClass} ${
        onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''
      }`}
    >
      <IconComponent size={iconSize} className="shrink-0 stroke-[2.5]" />
      <span>{customLabel || defaultLabel}</span>
    </span>
  );
};
