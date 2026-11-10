'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, User, Mail, Lock, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function GabungPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [invitePreview, setInvitePreview] = useState<{
    code: string;
    access: 'read' | 'full';
    relation: string;
    workspaceOwnerName: string;
  } | null>(null);

  // New account fields if not logged in
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'pria' | 'wanita'>('wanita');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 1: Check invite code
  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length < 6) {
      setErrorMsg('Kode undangan minimal 6-8 karakter');
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/members/join?code=${cleanCode}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Kode undangan tidak valid.');
        setChecking(false);
        return;
      }

      setInvitePreview(data);
      setCode(cleanCode);
      if (data.suggestedRole) {
        setRole(data.suggestedRole);
      }
      if (data.partnerName && !name) {
        setName(data.partnerName);
      }
      setChecking(false);
    } catch {
      setErrorMsg('Gagal memeriksa kode. Periksa koneksi internet Anda.');
      setChecking(false);
    }
  };

  // Step 2: Submit join
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const payload: any = { code };
      if (name) payload.name = name;
      if (identifier) payload.identifier = identifier;
      if (password) payload.password = password;
      if (role) payload.role = role;

      const res = await fetch('/api/members/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        setErrorMsg(`Server merespons kode ${res.status}. Silakan coba lagi.`);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal bergabung ke workspace.');
        setLoading(false);
        return;
      }

      showToast({ message: data.message || 'Berhasil bergabung!', type: 'success' });
      router.push('/rute');
      router.refresh();
    } catch {
      setErrorMsg('Gagal terhubung ke server. Silakan coba lagi.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 bg-gradient-to-b from-sky/30 via-white to-blush/30">
      <div className="pt-6">
        <Link href="/" className="inline-flex items-center gap-2 mb-4 text-ink font-black text-sm group">
          <img
            src="/icons/icon-192x192.png?v=4"
            alt="Road To Halal"
            className="w-7 h-7 rounded-xl border border-ink/20 shadow-sm object-cover group-hover:scale-105 transition-transform"
          />
          <span>Road To Halal</span>
        </Link>

        <h1 className="text-2xl font-black text-ink">Gabung Ruang Persiapan</h1>
        <p className="text-xs text-ink/75 mt-1">
          Masukkan kode undangan yang diberikan oleh calon pengantin
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-2xl bg-white border-2 border-ink text-xs font-semibold flex items-center gap-2 text-ink">
            <AlertCircle size={16} className="text-ink shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form 1: Input Code */}
        {!invitePreview ? (
          <form onSubmit={handleCheckCode} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">
                8 Karakter Kode Undangan
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={18} />
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="misal: 7K2M9N4P"
                  maxLength={12}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border-2 border-ink outline-none text-center font-mono font-black text-lg tracking-widest text-ink placeholder:text-ink/30"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={checking || !code}
              className="w-full py-3.5 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {checking ? <Loader2 size={16} className="animate-spin" /> : 'Periksa Kode Undangan'}
            </button>
          </form>
        ) : (
          /* Form 2: Show Invite Details & Registration */
          <div className="mt-5 space-y-4">
            {/* Invite Info Card */}
            <div className="p-4 rounded-2xl bg-white border-2 border-ink shadow-subtle space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blush border border-ink">
                  Undangan Valid
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky border border-ink text-ink">
                  Akses: {invitePreview.access.toUpperCase()}
                </span>
              </div>
              <p className="text-sm font-black text-ink">
                Undangan dari {invitePreview.workspaceOwnerName}
              </p>
              <p className="text-xs text-ink/80">
                Sebagai: <strong>{invitePreview.relation}</strong>
              </p>
              <p className="text-[11px] text-ink/65 italic">
                {invitePreview.access === 'full'
                  ? 'Anda dapat melihat dan ikut mengisi data tahap yang telah terbuka.'
                  : 'Anda dapat memantau perjalanan dan berkas tanpa mengubah data.'}
              </p>
            </div>

            {/* Registration Form if joining as new user */}
            <form onSubmit={handleJoin} className="space-y-3">
              <p className="text-xs font-bold text-ink pt-1">
                Lengkapi profil akun Anda untuk bergabung:
              </p>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Nama Anda
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-ink text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Email atau Username
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email@example.com atau username"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-ink text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Password (min. 8 karakter)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white border border-ink text-sm text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">
                  Peran
                </label>
                {invitePreview?.relation?.toLowerCase() === 'pasangan' && (
                  <p className="text-[11px] text-ink/70 mb-2 bg-blush/30 px-3 py-1.5 rounded-xl border border-ink/20">
                    Otomatis diselaraskan sebagai <strong>Catin {role === 'wanita' ? 'Wanita' : 'Pria'}</strong> untuk pasangan.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('wanita')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'wanita'
                        ? 'bg-blush border-2 border-ink text-ink shadow-sm'
                        : 'bg-white border-ink/30 text-ink/60'
                    }`}
                  >
                    👰‍♀️ Catin Wanita
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('pria')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      role === 'pria'
                        ? 'bg-sky border-2 border-ink text-ink shadow-sm'
                        : 'bg-white border-ink/30 text-ink/60'
                    }`}
                  >
                    🤵‍♂️ Catin Pria / Lainnya
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Gabung Sekarang</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setInvitePreview(null)}
                className="w-full py-2 text-center text-xs text-ink/70 hover:underline"
              >
                Gunakan kode lain
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="text-center pt-6 pb-2">
        <p className="text-xs text-ink/70">
          Sudah punya akun sendiri?{' '}
          <Link href="/login" className="font-bold text-ink underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
