import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { PWAInstallBanner } from '@/components/ui/PWAInstallBanner';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Road To Halal - Aplikasi Persiapan Pernikahan (PWA)',
  description: 'Menemani langkah calon pengantin dari persetujuan ta’aruf sampai hari akad dan walimah, selangkah demi selangkah.',
  manifest: '/manifest.webmanifest?v=5',
  icons: {
    icon: '/icons/icon-192x192.png?v=5',
    apple: '/icons/icon-192x192.png?v=5',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Road To Halal',
  },
};

export const viewport: Viewport = {
  themeColor: '#9FD3FF',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${plusJakartaSans.variable} ${inter.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png?v=5" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png?v=5" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png?v=5" />
      </head>
      <body className="bg-mist min-h-screen text-navy-900 font-sans flex justify-center selection:bg-sky-200 selection:text-navy-900">
        <ToastProvider>
          {/* Main Mobile App Frame (No bottom navigation - Section 8.5 & 8.7) */}
          <div className="w-full max-w-md min-h-screen bg-white shadow-card border-x border-line relative flex flex-col overflow-x-hidden">
            <PWAInstallBanner />
            <main className="flex-1 w-full pb-8">{children}</main>
          </div>
        </ToastProvider>

        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(reg) {
                      console.log('Road To Halal SW registered:', reg.scope);
                      reg.update();
                    },
                    function(err) {
                      console.log('Road To Halal SW failed:', err);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
