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
    <div className="min-h-screen flex flex-col justify-between p-6 bg-white">
      <div className="pt-6">
        <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-rose mb-6 hover:underline">
          <ArrowLeft size={16} />
          <span>Kembali ke Login</span>
        </Link>

        <h1 className="text-2xl font-extrabold text-ink">Lupa Password</h1>
        <p className="text-xs text-ink/70 mt-1">
          Masukkan alamat email akun Anda. Kami akan mengirimkan tautan untuk membuat password baru.
        </p>

        {submitted ? (
          <div className="mt-8 p-5 rounded-3xl bg-blush/40 border border-blush text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-rose text-white mx-auto flex items-center justify-center shadow-md">
              <CheckCircle2 size={24} />
            </div>
            <h3 className="text-sm font-bold text-ink">Periksa Kotak Masuk Email Anda</h3>
            <p className="text-xs text-ink/75 leading-relaxed">
              Jika email <span className="font-semibold text-rose">{email}</span> terdaftar, tautan reset password telah dikirim dan berlaku selama 30 menit.
            </p>
            <div className="pt-2">
              <Link
                href="/login"
                className="inline-block px-5 py-2.5 bg-rose text-white text-xs font-bold rounded-full shadow-sm"
              >
                Selesai &amp; Masuk
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose/10 border border-rose/30 text-rose text-xs font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                Alamat Email Terdaftar
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-blush focus:border-rose focus:ring-2 focus:ring-rose/20 outline-none text-base text-ink transition-all placeholder:text-ink/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 bg-rose text-white font-bold rounded-full text-sm shadow-md hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Kirim Tautan Reset'}
            </button>
          </form>
        )}
      </div>

      <div className="text-center pb-4 text-xs text-ink/60">
        Butuh bantuan darurat? Hubungi Administrator di email <span className="text-rose font-medium">admin@nikahku.id</span>
      </div>
    </div>
  );
}
