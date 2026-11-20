'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const t = searchParams.get('token');
    if (t) setToken(t);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 8) {
      setErrorMsg('Password baru minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengubah password');
        setLoading(false);
        return;
      }

      setSuccess(true);
      showToast({ message: 'Password berhasil diubah!', type: 'success' });
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch {
      setErrorMsg('Gagal terhubung ke server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-aurora flex flex-col justify-center items-center py-8 sm:py-12 px-4 sm:px-6">
      <div className="w-full max-w-md mx-auto space-y-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-azure hover:underline">
          <ArrowLeft size={16} />
          <span>Kembali ke Login</span>
        </Link>

        {/* Elevated Card */}
        <div className="bg-white rounded-3xl border border-line shadow-card p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold text-navy-900 font-display">Buat Password Baru</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Masukkan password baru untuk akun Road To Halal Anda
            </p>
          </div>

          {success ? (
            <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-azure text-white mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-navy-900">Password Berhasil Diperbarui</h3>
              <p className="text-xs text-slate-600 leading-relaxed">Mengalihkan Anda ke halaman login...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-2xl bg-coral-100 border border-coral-200 text-coral-700 text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1.5">
                  Password Baru (min. 8 karakter)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Password baru"
                    className="w-full h-[52px] pl-10 pr-12 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-900"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full h-[52px] pl-10 pr-4 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] mt-2 bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin text-white" /> : 'Simpan Password Baru'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs">
          <Link href="/login" className="font-extrabold text-azure-700 hover:underline">
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-rose" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
