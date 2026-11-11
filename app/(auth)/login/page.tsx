'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg(`Server merespons kode ${res.status}. Silakan coba beberapa saat lagi.`);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Login gagal. Periksa kembali email dan password.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setLoading(false);
        return;
      }

      showToast({ message: `Selamat datang kembali, ${data.user?.name || 'Calon Pengantin'}!`, type: 'success' });
      router.push('/rute');
      router.refresh();
    } catch {
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-aurora">
      {/* Top Branding Section */}
      <div className="pt-8 px-6 pb-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
          <div className="w-8 h-8 rounded-xl bg-sky-300 border border-sky-400 p-0.5 overflow-hidden shadow-subtle group-hover:scale-105 transition-transform">
            <img
              src="/icons/icon-192x192.png?v=5"
              alt="Road To Halal"
              className="w-full h-full object-cover rounded-lg"
            />
          </div>
          <span className="font-extrabold text-navy-900 text-sm tracking-tight">Road To Halal</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight font-display">
          Selamat datang kembali
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Masuk untuk melanjutkan perjalanan persiapan pernikahan Anda
        </p>
      </div>

      {/* White Sheet Form (Rounded Top 32px per PRD 8.9) */}
      <div
        className={`flex-1 bg-white rounded-t-[32px] sm:rounded-[32px] sm:mx-4 sm:mb-6 border-t sm:border border-line shadow-sheet p-6 flex flex-col justify-between ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        <div>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-coral-100 border border-coral-200 text-coral-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="text-coral-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1.5">
                Email atau Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="misal: fatih@gmail.com atau fatih26"
                  className="w-full h-[52px] pl-10 pr-4 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-navy-900">Password</label>
                <Link href="/lupa-password" className="text-xs font-semibold text-azure-600 hover:underline">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full h-[52px] pl-10 pr-12 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900"
                  aria-label="Tampilkan / sembunyikan password"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] mt-2 bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-white" /> : 'Masuk ke Rute Saya'}
            </button>
          </form>
        </div>

        <div className="text-center pt-8 pb-2 space-y-2">
          <p className="text-xs text-slate-600">
            Belum punya akun?{' '}
            <Link href="/register" className="font-extrabold text-azure-700 hover:underline">
              Daftar Gratis
            </Link>
          </p>
          <p className="text-xs text-slate-500">
            Punya kode undangan?{' '}
            <Link href="/gabung" className="font-extrabold text-azure-700 hover:underline">
              Gabung Lewat Kode
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
