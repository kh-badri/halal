/**
 * Road To Halal Design System Colors (PRD v1.2 - Sky & Navy Palette)
 *
 * Primary Brand: Sky 300 (#9FD3FF)
 * Primary Action: Azure 600 (#1F6FDB)
 * Base Background: Mist (#F3F9FF)
 * Typography: Navy 900 (#0E2A47) & Slate 600 (#4A5F78)
 * Accents: Peach (#FFC8A2), Mint (#9BE7CC), Coral (#E5484D)
 */

export const PALETTE = {
  white: '#FFFFFF',
  mist: '#F3F9FF',        // Latar aplikasi
  line: '#DCE9F6',        // Divider dan border kartu
  sky100: '#E6F3FF',      // Latar chip, skeleton
  sky200: '#CBE6FF',      // Tombol sekunder
  sky300: '#9FD3FF',      // Warna merek utama
  azure600: '#1F6FDB',    // Aksi utama
  azure700: '#1B5FB3',    // Tautan / state tekan
  navy900: '#0E2A47',     // Teks judul dan utama
  slate400: '#7589A1',    // Border terkunci
  slate500: '#5A6E86',    // Placeholder
  slate600: '#4A5F78',    // Teks sekunder
  peach100: '#FFE9DA',    // Aksen chip latar
  peach300: '#FFC8A2',    // Aksen hangat
  mint100: '#D9F7EC',     // Status selesai latar
  mint300: '#9BE7CC',     // Status selesai isi
  mint700: '#0B6B57',     // Status selesai teks
  coral100: '#FFE3E1',    // Status galat latar
  coral500: '#E5484D',    // Status galat border
  coral700: '#9B1C20',    // Status galat teks

  // Aurora Sky Gradient
  auroraGradient: 'linear-gradient(160deg, #E6F3FF 0%, #CBE6FF 45%, #9FD3FF 100%)',

  // Backward compatibility
  blush: '#E6F3FF',
  blushBorder: '#DCE9F6',
  rose: '#1F6FDB',
  ink: '#0E2A47',
  inkMuted: '#4A5F78',
} as const;

export const STATUS_STYLES = {
  belum: {
    bg: 'bg-white',
    text: 'text-slate-600',
    border: 'border border-dashed border-slate-400',
    label: 'Belum',
  },
  terkunci: {
    bg: 'bg-[#EAF1F8]',
    text: 'text-slate-600',
    border: 'border border-dashed border-slate-400',
    label: 'Terkunci',
  },
  proses: {
    bg: 'bg-sky-100',
    text: 'text-azure-700 font-bold',
    border: 'border border-sky-300',
    label: 'Proses',
  },
  aktif: {
    bg: 'bg-sky-300',
    text: 'text-navy-900 font-extrabold',
    border: 'border-2 border-azure-600',
    label: 'Aktif',
  },
  selesai: {
    bg: 'bg-mint-100',
    text: 'text-mint-700 font-bold',
    border: 'border border-mint-300',
    label: 'Selesai',
  },
  terlambat: {
    bg: 'bg-coral-100',
    text: 'text-coral-700 font-bold',
    border: 'border border-coral-500',
    label: 'Terlambat',
  },
  pertimbangan: {
    bg: 'bg-peach-100',
    text: 'text-navy-900 font-bold',
    border: 'border border-peach-300',
    label: 'Dipertimbangkan',
  },
} as const;
