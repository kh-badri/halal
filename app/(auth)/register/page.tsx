'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Calendar, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (password.length < 8) {
      setErrorMsg('Password minimal harus 8 karakter');
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

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Pendaftaran gagal. Silakan coba lagi.');
        setLoading(false);
        return;
      }

      showToast({ message: 'Akun dan ruang persiapan berhasil dibuat! Bismillah.', type: 'success' });
      router.push('/rute');
      router.refresh();
    } catch {
      setErrorMsg('Gagal terhubung ke server. Periksa koneksi internet Anda.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-sky/30 via-white to-blush/30">
      <div className="pt-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 text-ink font-black text-sm">
          <div className="w-7 h-7 rounded-full bg-blush border-2 border-ink flex items-center justify-center text-xs">
            RTH
          </div>
          <span>Road To Halal</span>
        </Link>

        <h1 className="text-2xl font-black text-ink">Bismillah, Mulai Langkah</h1>
        <p className="text-xs text-ink/75 mt-1">Buat ruang data pernikahan pribadi Anda dan pasangan</p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-white border-2 border-ink text-ink text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={16} className="text-ink shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Nama Lengkap Anda
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="misal: Muhammad Fatih"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-ink outline-none text-base text-ink transition-all placeholder:text-ink/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Email atau Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="fatih@gmail.com atau fatih26"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-ink outline-none text-base text-ink transition-all placeholder:text-ink/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Peran Calon Pengantin
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setRole('pria')}
                className={`py-2.5 px-3 rounded-2xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'pria'
                    ? 'bg-sky border-ink text-ink shadow-sm'
                    : 'bg-white border-ink/30 text-ink/60 hover:bg-sky/20'
                }`}
              >
                <span>🤵‍♂️</span>
                <span>Catin Pria</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('wanita')}
                className={`py-2.5 px-3 rounded-2xl border-2 text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  role === 'wanita'
                    ? 'bg-blush border-ink text-ink shadow-sm'
                    : 'bg-white border-ink/30 text-ink/60 hover:bg-blush/30'
                }`}
              >
                <span>👰‍♀️</span>
                <span>Catin Wanita</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Password (min. 8 karakter)
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kombinasi huruf & angka"
                className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-white border-2 border-ink outline-none text-base text-ink transition-all placeholder:text-ink/30"
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

          <div>
            <label className="block text-xs font-bold text-ink mb-1">
              Target Tanggal Akad <span className="font-normal text-ink/60">(Opsional, bisa diubah)</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border-2 border-ink outline-none text-base text-ink transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-3 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Daftar & Buat Ruang Persiapan'}
          </button>
        </form>
      </div>

      <div className="text-center pt-6 pb-2 space-y-1.5">
        <p className="text-xs text-ink/75">
          Sudah punya akun?{' '}
          <Link href="/login" className="font-bold text-ink underline">
            Masuk di sini
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
