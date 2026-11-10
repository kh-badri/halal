import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
import { PWAInstallBanner } from '@/components/ui/PWAInstallBanner';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Road To Halal - Aplikasi Persiapan Pernikahan (PWA)',
  description: 'Aplikasi pendamping calon pengantin dari persetujuan ta’aruf sampai hari-H akad dan walimah.',
  manifest: '/manifest.webmanifest?v=4',
  icons: {
    icon: '/icons/icon-192x192.png?v=4',
    apple: '/icons/icon-192x192.png?v=4',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Road To Halal',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFF1F4',
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
    <html lang="id" className={plusJakartaSans.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png?v=4" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192x192.png?v=4" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icons/icon-512x512.png?v=4" />
      </head>
      <body className="bg-[#FAF7F8] min-h-screen text-ink flex justify-center selection:bg-rose-100 selection:text-rose-700">
        <ToastProvider>
          {/* Main Mobile App Frame (No bottom navigation) */}
          <div className="w-full max-w-md min-h-screen bg-white shadow-[0_0_60px_-15px_rgba(240,86,124,0.12)] border-x border-rose-100/50 relative flex flex-col overflow-x-hidden">
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
