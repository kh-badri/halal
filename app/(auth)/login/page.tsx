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
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Login gagal. Periksa kembali email dan password.');
        setLoading(false);
        return;
      }

      showToast({ message: `Selamat datang kembali, ${data.user?.name || 'Calon Pengantin'}!`, type: 'success' });
      router.push('/rute');
      router.refresh();
    } catch {
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-blush/40 to-white">
      <div className="pt-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6 text-ink font-black text-sm group">
          <img
            src="/icons/icon-192x192.png?v=2"
            alt="Road To Halal"
            className="w-7 h-7 rounded-xl border border-ink/20 shadow-sm object-cover group-hover:scale-105 transition-transform"
          />
          <span>Road To Halal</span>
        </Link>

        <h1 className="text-2xl font-black text-ink">Assalamu’alaikum</h1>
        <p className="text-xs text-ink/75 mt-1">Masuk untuk melanjutkan perjalanan persiapan pernikahan</p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-white border-2 border-ink text-ink text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-ink shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-1.5">
              Email atau Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="misal: fatih@gmail.com atau fatih26"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-ink outline-none text-base text-ink transition-all placeholder:text-ink/30"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-ink">Password</label>
              <Link href="/lupa-password" className="text-xs font-semibold text-ink underline">
                Lupa password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-12 py-3 rounded-2xl bg-white border-2 border-ink outline-none text-base text-ink transition-all placeholder:text-ink/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Masuk ke Rute Saya'}
          </button>
        </form>
      </div>

      <div className="text-center pt-8 pb-4 space-y-2">
        <p className="text-xs text-ink/75">
          Belum punya akun?{' '}
          <Link href="/register" className="font-bold text-ink underline">
            Daftar Gratis
          </Link>
        </p>
        <p className="text-xs text-ink/70">
          Punya kode undangan?{' '}
          <Link href="/gabung" className="font-bold text-ink underline">
            Gabung Lewat Kode
          </Link>
        </p>
      </div>
    </div>
  );
}
