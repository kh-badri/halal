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
        white: '#FFFFFF',
        // Gelato / Strawberry Pink Theme (User Reference)
        blush: '#FFF1F4',        // Creamy soft blush pink background
        'blush-soft': '#FFF7F9', // Ultra soft ambient tint
        'blush-border': '#FED7E2',// Soft rose border
        rose: {
          DEFAULT: '#F0567C',    // Vibrant strawberry rose (Reference CTA & accents)
          50: '#FFF1F4',
          100: '#FFE4EC',
          200: '#FECDD8',
          300: '#FDA4B8',
          400: '#FB7190',
          500: '#F0567C',
          600: '#E03E67',
          700: '#BE264E',
          800: '#9F2243',
          900: '#84203B',
        },
        sky: {
          DEFAULT: '#E0F2FE',    // Airy soft blue
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
        },
        ink: {
          DEFAULT: '#1E293B',    // Crisp modern dark slate/ink typography
          muted: '#64748B',      // Secondary text
          subtle: '#94A3B8',     // Placeholder text
          deep: '#0F172A',
        },
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta-sans)', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '18px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        soft: '0 8px 30px -4px rgba(240, 86, 124, 0.12), 0 2px 10px rgba(30, 41, 59, 0.04)',
        subtle: '0 2px 12px rgba(240, 86, 124, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)',
        rose: '0 8px 24px -4px rgba(240, 86, 124, 0.32)',
        'rose-sm': '0 4px 14px -2px rgba(240, 86, 124, 0.22)',
        card: '0 4px 20px -2px rgba(30, 41, 59, 0.05), 0 1px 3px rgba(240, 86, 124, 0.04)',
      },
    },
  },
  plugins: [],
};

export default config;
