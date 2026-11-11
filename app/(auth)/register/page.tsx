'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Calendar, Eye, EyeOff, Loader2, AlertCircle, Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'pria' | 'wanita'>('pria');
  const [targetDate, setTargetDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const isPasswordValid = password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isPasswordValid) {
      setErrorMsg('Password minimal harus 8 karakter');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          identifier,
          password,
          role,
          targetDate: targetDate || undefined,
        }),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg(`Server merespons kode ${res.status}. Silakan coba lagi.`);
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran gagal. Silakan coba lagi.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setLoading(false);
        return;
      }

      showToast({ message: 'Akun dan ruang persiapan berhasil dibuat! Bismillah.', type: 'success' });
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
          Bismillah, Mulai Langkah
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Buat ruang data pernikahan pribadi Anda dan pasangan
        </p>
      </div>

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
            {/* Kelompok 1: Akun */}
            <div className="space-y-3">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                Akun
              </span>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Nama Lengkap Anda
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="misal: Muhammad Fatih"
                    className="w-full h-[50px] pl-10 pr-4 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
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
                    className="w-full h-[50px] pl-10 pr-4 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full h-[50px] pl-10 pr-12 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
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
                {/* 8-char indicator (PRD 8.9) */}
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px]">
                  <span
                    className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full ${
                      isPasswordValid ? 'bg-mint-300 text-mint-700' : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    <Check size={10} className="stroke-[3]" />
                  </span>
                  <span className={isPasswordValid ? 'text-mint-700 font-bold' : 'text-slate-500'}>
                    Minimal 8 karakter
                  </span>
                </div>
              </div>
            </div>

            {/* Kelompok 2: Tentang Anda */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                Tentang Anda
              </span>

              {/* Segmented Catin Pria / Catin Wanita (C5) */}
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1.5">
                  Peran Anda di Ruang Ini
                </label>
                <div className="grid grid-cols-2 p-1 bg-mist rounded-2xl border border-line gap-1">
                  <button
                    type="button"
                    onClick={() => setRole('pria')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      role === 'pria'
                        ? 'bg-azure text-white shadow-subtle'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    Catin Pria
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('wanita')}
                    className={`py-2 rounded-xl text-xs font-extrabold transition-all ${
                      role === 'wanita'
                        ? 'bg-azure text-white shadow-subtle'
                        : 'text-slate-600 hover:text-navy-900'
                    }`}
                  >
                    Catin Wanita
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Target Tanggal Akad <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full h-[50px] pl-10 pr-4 rounded-2xl bg-white border border-line text-sm text-navy-900 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] mt-4 bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin text-white" /> : 'Buka Ruang & Mulai Perjalanan'}
            </button>
          </form>
        </div>

        <div className="text-center pt-6 pb-2">
          <p className="text-xs text-slate-600">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-extrabold text-azure-700 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
