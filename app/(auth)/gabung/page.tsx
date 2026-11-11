'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, User, Mail, Lock, CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function GabungPage() {
  const router = useRouter();
  const { showToast } = useToast();

  // 6 separate digit slots for the invite code
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [checking, setChecking] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [invitePreview, setInvitePreview] = useState<{
    code: string;
    access: 'read' | 'full';
    relation: string;
    workspaceOwnerName: string;
    suggestedRole?: 'pria' | 'wanita';
    partnerName?: string;
  } | null>(null);

  // New account fields if not logged in
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'pria' | 'wanita'>('wanita');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fullCode = digits.join('').toUpperCase();

  const handleDigitChange = (index: number, value: string) => {
    const val = value.slice(-1).toUpperCase();
    const newDigits = [...digits];
    newDigits[index] = val;
    setDigits(newDigits);

    // Auto-advance to next box if char entered
    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setDigits(newDigits);
    const targetIdx = Math.min(pasted.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  // Step 1: Check invite code
  const handleCheckCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanCode = fullCode.trim();
    if (cleanCode.length < 6) {
      setErrorMsg('Masukkan 6 karakter kode undangan');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setChecking(true);
    try {
      const res = await fetch(`/api/members/join?code=${cleanCode}`);
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Kode undangan tidak valid.');
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
        setChecking(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setInvitePreview(data);
        if (data.suggestedRole) {
          setRole(data.suggestedRole);
        }
        if (data.partnerName && !name) {
          setName(data.partnerName);
        }
        setChecking(false);
      }, 400);
    } catch {
      setErrorMsg('Gagal memeriksa kode. Periksa koneksi internet Anda.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setChecking(false);
    }
  };

  // Step 2: Submit join
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const payload: any = { code: fullCode };
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
          Gabung Lewat Kode
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Masukkan 6 karakter kode undangan yang dibagikan oleh calon pasangan atau keluarga
        </p>
      </div>

      <div className="flex-1 bg-white rounded-t-[32px] sm:rounded-[32px] sm:mx-4 sm:mb-6 border-t sm:border border-line shadow-sheet p-6 flex flex-col justify-between">
        <div>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-coral-100 border border-coral-200 text-coral-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="text-coral-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form 1: Input Code in 6 separate 48x56 px boxes (PRD 8.9) */}
          {!invitePreview ? (
            <form onSubmit={handleCheckCode} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-3 text-center">
                  6 Karakter Kode Undangan
                </label>
                <div
                  className={`flex items-center justify-center gap-2 sm:gap-2.5 ${
                    isShaking ? 'animate-shake' : ''
                  }`}
                  onPaste={handlePaste}
                >
                  {digits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      className={`w-[44px] xs:w-[48px] h-[56px] text-center font-display font-extrabold text-xl rounded-2xl border transition-all outline-none ${
                        isSuccess
                          ? 'bg-mint-100 border-mint-400 text-mint-700'
                          : digit
                          ? 'bg-white border-azure ring-2 ring-azure/20 text-navy-900 scale-105 shadow-xs'
                          : 'bg-mist border-line text-navy-900 focus:border-azure focus:bg-white'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={checking || fullCode.length < 6}
                className="w-full h-[52px] bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {checking ? <Loader2 size={16} className="animate-spin text-white" /> : 'Periksa Kode Undangan'}
              </button>
            </form>
          ) : (
            /* Form 2: Show Invite Details & Registration */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-mint-100 text-mint-700 border border-mint-300">
                    Undangan Valid
                  </span>
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-100 border border-sky-300 text-azure-700">
                    Akses: {invitePreview.access.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm font-extrabold text-navy-900">
                  Undangan dari {invitePreview.workspaceOwnerName}
                </p>
                <p className="text-xs text-slate-600">
                  Sebagai: <strong className="text-navy-900 font-bold">{invitePreview.relation}</strong>
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  {invitePreview.access === 'full'
                    ? 'Anda dapat melihat dan ikut mengisi data tahap yang telah terbuka.'
                    : 'Anda dapat memantau perjalanan dan berkas tanpa mengubah data.'}
                </p>
              </div>

              <form onSubmit={handleJoin} className="space-y-3">
                <p className="text-xs font-bold text-navy-900 pt-1">
                  Lengkapi profil akun Anda untuk bergabung:
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-navy-900 mb-1">
                    Nama Anda
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama lengkap"
                      className="w-full h-[46px] pl-9 pr-3 rounded-2xl bg-white border border-line text-sm text-navy-900 outline-none focus:border-azure focus:ring-2 focus:ring-azure/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-navy-900 mb-1">
                    Email atau Username
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="misal: aisyah@gmail.com atau aisyah26"
                      className="w-full h-[46px] pl-9 pr-3 rounded-2xl bg-white border border-line text-sm text-navy-900 outline-none focus:border-azure focus:ring-2 focus:ring-azure/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-navy-900 mb-1">
                    Password Baru
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      className="w-full h-[46px] pl-9 pr-3 rounded-2xl bg-white border border-line text-sm text-navy-900 outline-none focus:border-azure focus:ring-2 focus:ring-azure/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[52px] mt-2 bg-azure hover:bg-azure-700 text-white font-extrabold rounded-full text-xs shadow-subtle hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin text-white" /> : 'Bergabung Sekarang'}
                </button>
              </form>
            </div>
          )}
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
