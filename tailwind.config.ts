import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Road To Halal PRD v1.2 Color System
        white: '#FFFFFF',
        mist: '#F3F9FF',      // Latar aplikasi utama
        line: '#DCE9F6',      // Divider dan border kartu

        // Biru Muda (Sky) - Warna Merek
        sky: {
          50: '#F5FAFF',
          100: '#E6F3FF',     // Latar chip, bagian sorotan, skeleton
          200: '#CBE6FF',     // Tombol sekunder, border aktif lembut
          300: '#9FD3FF',     // Biru Muda utama (merek, hero, node aktif, latar ikon)
          DEFAULT: '#9FD3FF',
        },

        // Azure - Tombol Aksi Utama
        azure: {
          600: '#1F6FDB',     // Tombol utama, aksi, ikon aktif, fokus
          700: '#1B5FB3',     // Teks tautan, state tekan tombol utama
          DEFAULT: '#1F6FDB',
        },

        // Navy - Tipografi Utama
        navy: {
          800: '#143659',
          900: '#0E2A47',     // Teks utama dan judul (kontras 14.6:1)
          DEFAULT: '#0E2A47',
        },

        // Slate - Teks Sekunder & Border Terkunci
        slate: {
          400: '#7589A1',     // Garis putus-putus, gembok, border terkunci
          500: '#5A6E86',     // Placeholder
          600: '#4A5F78',     // Teks sekunder
          DEFAULT: '#4A5F78',
        },

        // Peach - Aksen Hangat (±5%)
        peach: {
          100: '#FFE9DA',     // Latar chip "Kamu di sini", callout
          300: '#FFC8A2',     // Aksen hangat: countdown, selebrasi
          DEFAULT: '#FFC8A2',
        },

        // Mint - Status Selesai
        mint: {
          100: '#D9F7EC',     // Latar status selesai
          300: '#9BE7CC',     // Isi status selesai
          700: '#0B6B57',     // Ikon dan teks status selesai
          DEFAULT: '#9BE7CC',
        },

        // Coral - Status Terlambat & Galat
        coral: {
          100: '#FFE3E1',     // Latar galat / terlambat
          500: '#E5484D',     // Outline dan ikon galat
          700: '#9B1C20',     // Teks galat
          DEFAULT: '#E5484D',
        },

        // Compatibility Aliases to ensure graceful transition
        ink: {
          DEFAULT: '#0E2A47', // Mapped to Navy 900
          muted: '#4A5F78',   // Mapped to Slate 600
          subtle: '#5A6E86',  // Mapped to Slate 500
          deep: '#071829',
        },
        blush: {
          DEFAULT: '#E6F3FF', // Mapped to Sky 100
          soft: '#F3F9FF',    // Mapped to Mist
          border: '#DCE9F6',  // Mapped to Line
        },
        rose: {
          DEFAULT: '#1F6FDB', // Mapped to Azure 600
          50: '#F5FAFF',
          100: '#E6F3FF',
          200: '#CBE6FF',
          300: '#9FD3FF',
          400: '#38BDF8',
          500: '#1F6FDB',
          600: '#1B5FB3',
          700: '#0E2A47',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        inter: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        title: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
        jakarta: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '28px',
        '5xl': '32px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 42, 71, 0.06)',
        subtle: '0 1px 3px rgba(14, 42, 71, 0.08)',
        raised: '0 8px 24px rgba(31, 111, 219, 0.12)',
        sheet: '0 16px 40px rgba(14, 42, 71, 0.16)',
        soft: '0 4px 16px rgba(14, 42, 71, 0.08)',
      },
    },
  },
  plugins: [],
};

export default config;
