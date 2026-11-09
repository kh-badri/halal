/**
 * Road To Halal Design System Colors (Refined Gelato Rose / Strawberry Theme)
 *
 * Modern Pastel Palette:
 * - White: Latar bersih, kontras kartu (#FFFFFF)
 * - Blush / Creamy Pink: Latar lembut (#FFF1F4)
 * - Strawberry Rose: Tombol aksi utama, aksen aktif, badge glow (#F0567C)
 * - Soft Sky: Status selesai, elemen pendukung (#E0F2FE)
 * - Ink: Tipografi modern elegan (#1E293B)
 */

export const PALETTE = {
  white: '#FFFFFF',
  blush: '#FFF1F4',        // Creamy soft blush pink background
  blushBorder: '#FED7E2',  // Soft rose border
  rose: '#F0567C',         // Vibrant strawberry rose (Reference image)
  roseGradient: 'linear-gradient(135deg, #FF6B8B 0%, #F0567C 100%)',
  sky: '#E0F2FE',          // Soft airy blue
  skyBorder: '#BAE6FD',
  ink: '#1E293B',          // Deep modern slate
  inkMuted: '#64748B',     // Secondary slate text
} as const;

export const STATUS_STYLES = {
  belum: {
    bg: 'bg-white',
    text: 'text-slate-500',
    border: 'border border-slate-200',
    label: 'Belum',
  },
  terkunci: {
    bg: 'bg-slate-50/60',
    text: 'text-slate-400',
    border: 'border border-dashed border-slate-200',
    label: 'Terkunci',
  },
  proses: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border border-rose-200',
    label: 'Proses',
  },
  aktif: {
    bg: 'bg-gradient-to-r from-rose-500 to-rose-600',
    text: 'text-white',
    border: 'border-0',
    label: 'Aktif',
  },
  selesai: {
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border border-sky-200',
    label: 'Selesai',
  },
  terlambat: {
    bg: 'bg-rose-50',
    text: 'text-rose-800 font-bold',
    border: 'border border-rose-300',
    label: 'Terlambat',
  },
} as const;
