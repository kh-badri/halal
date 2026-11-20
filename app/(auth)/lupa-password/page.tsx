'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal memproses permintaan.');
        setLoading(false);
        return;
      }

      setSubmitted(true);
      setLoading(false);
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
            <h1 className="text-2xl font-extrabold text-navy-900 font-display">Lupa Password</h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk membuat password baru.
            </p>
          </div>

          {submitted ? (
            <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-azure text-white mx-auto flex items-center justify-center shadow-xs">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="text-sm font-extrabold text-navy-900">Periksa Kotak Masuk Email Anda</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Jika email <span className="font-semibold text-azure-700">{email}</span> terdaftar, tautan reset password telah dikirim dan berlaku selama 30 menit.
              </p>
              <div className="pt-2">
                <Link
                  href="/login"
                  className="inline-block px-5 py-2.5 bg-azure hover:bg-azure-700 text-white text-xs font-extrabold rounded-full shadow-subtle transition-all active:scale-95"
                >
                  Selesai &amp; Masuk
                </Link>
              </div>
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
                  Alamat Email Terdaftar
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full h-[52px] pl-10 pr-4 rounded-2xl bg-white border border-line text-sm text-navy-900 placeholder:text-slate-400 focus:border-azure focus:ring-2 focus:ring-azure/20 outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] mt-2 bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 size={16} className="animate-spin text-white" /> : 'Kirim Tautan Reset'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-xs text-slate-500">
          Butuh bantuan? Hubungi kami via email <span className="text-azure-700 font-semibold">support@roadtohalal.id</span>
        </div>
      </div>
    </div>
  );
}
