'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, CheckCircle2, ShieldCheck, Download } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (res.ok) {
          router.replace('/rute');
        }
      })
      .catch(() => {});
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-blush/60 via-white to-sky/40">
      <div className="pt-6 text-center">
        <div className="w-24 h-24 mx-auto mb-3.5 relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-blush/60 blur-sm -z-10" />
          <img
            src="/icons/icon-192x192.png?v=3"
            alt="Road To Halal Logo"
            width={96}
            height={96}
            className="w-24 h-24 rounded-3xl shadow-sm border border-rose-200/60 object-cover"
          />
        </div>
        <h1 className="text-3xl font-black text-ink tracking-tight">Road To Halal</h1>
        <p className="text-xs text-ink/80 font-bold uppercase tracking-widest mt-1">
          Aplikasi Persiapan Pernikahan (PWA)
        </p>
        <p className="text-sm text-ink/80 mt-3 max-w-xs mx-auto leading-relaxed">
          Menemani langkah calon pengantin dari persetujuan ta’aruf sampai hari akad dan walimah, selangkah demi selangkah.
        </p>
      </div>

      <div className="my-8 space-y-3">
        <div className="p-4 rounded-2xl bg-white border-2 border-ink shadow-subtle flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blush border border-ink text-ink flex items-center justify-center shrink-0">
            <MapPin size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-ink">Peta Rute 8 Tahap Berkelok</h3>
            <p className="text-[11px] text-ink/75 mt-0.5">
              Alur berurutan &amp; terkunci. Memastikan setiap persiapan prinsip tuntas sebelum melangkah ke tahap berikutnya.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-ink shadow-subtle flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky border border-ink text-ink flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-ink">Sesi Tanya Jawab Ta’aruf</h3>
            <p className="text-[11px] text-ink/75 mt-0.5">
              Kupas tuntas prinsip kesepakatan, visi keluarga, finansial, dan adab pranikah secara terarah bersama calon pasangan.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border-2 border-ink shadow-subtle flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-ink text-ink flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-xs font-black text-ink">Ruang Pribadi &amp; Hak Akses</h3>
            <p className="text-[11px] text-ink/75 mt-0.5">
              Undang pasangan, orang tua, atau murabbi dengan hak akses Read (hanya melihat) atau Full (ikut mengisi).
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 pb-6">
        <Link
          href="/register"
          className="w-full py-3.5 bg-blush border-2 border-ink text-ink font-black rounded-full text-sm shadow-sm hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <span>Mulai Perjalanan Sekarang</span>
          <ArrowRight size={18} />
        </Link>
        <Link
          href="/gabung"
          className="w-full py-3.5 bg-sky border-2 border-ink text-ink font-black rounded-full text-sm shadow-sm hover:scale-[1.01] active:scale-95 transition-all text-center block"
        >
          Gabung Lewat Kode Undangan
        </Link>
        <Link
          href="/login"
          className="w-full py-3 bg-white border border-ink/40 text-ink font-bold rounded-full text-xs hover:bg-neutral-50 active:scale-95 transition-all text-center block"
        >
          Masuk ke Akun Saya
        </Link>

        {/* Tombol Cadangan Install PWA */}
        <button
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            const banner = document.querySelector('button[aria-label="Tutup"]') as HTMLElement;
            const installBtn = document.querySelector('button:has(svg.stroke-\\[2\\.5\\])') as HTMLButtonElement;
            if (installBtn) {
              installBtn.click();
            } else {
              alert('Aplikasi dapat dipasang melalui menu browser Anda: ketuk titik tiga (⋮) atau tombol Share lalu pilih Tambah ke Layar Utama.');
            }
          }}
          className="w-full py-2.5 bg-gradient-to-r from-rose-50 via-blush/40 to-rose-50 border border-rose-300 text-rose-700 font-extrabold rounded-full text-xs hover:bg-rose-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Download size={14} className="shrink-0 stroke-[2.5]" />
          <span>Pasang / Install Aplikasi di HP</span>
        </button>

        <p className="text-[11px] text-center text-ink/60 pt-2">
          Dengan mendaftar, Anda menyetujui{' '}
          <Link href="/syarat" className="underline text-ink font-semibold">
            Syarat
          </Link>{' '}
          &amp;{' '}
          <Link href="/privasi" className="underline text-ink font-semibold">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
