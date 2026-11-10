'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, MapPin, CheckCircle2, ShieldCheck } from 'lucide-react';

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
      <div className="pt-8 text-center">
        <div className="w-20 h-20 mx-auto mb-4 relative flex items-center justify-center">
          <img
            src="/icons/icon-192x192.png"
            alt="Road To Halal Logo"
            className="w-20 h-20 rounded-3xl shadow-lg border-2 border-ink/20 object-cover"
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
