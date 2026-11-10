'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/ui/AppHeader';
import { useToast } from '@/components/ui/Toast';
import {
  Users,
  UserPlus,
  ShieldAlert,
  Copy,
  Trash2,
  Check,
  Clock,
  Shield,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface Member {
  userId: string;
  name: string;
  relation: string;
  access: 'read' | 'full';
  joinedAt: string;
  lastSeenAt?: string;
}

interface Invite {
  code: string;
  access: 'read' | 'full';
  relation: string;
  expiresAt: string;
  usedBy?: string;
  createdAt: string;
}

export default function AnggotaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [userAccess, setUserAccess] = useState<'owner' | 'full' | 'read'>('read');
  const [ownerId, setOwnerId] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);

  // Create invite form states
  const [accessChoice, setAccessChoice] = useState<'read' | 'full'>('read');
  const [relationChoice, setRelationChoice] = useState('Pasangan');
  const [customRelation, setCustomRelation] = useState('');
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [createdInviteCode, setCreatedInviteCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (!res.ok || res.status === 401) {
        router.replace('/login');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setUserAccess(data.userAccess);
        setOwnerId(data.ownerId);
        setMembers(data.members || []);
        setInvites(data.invites || []);
      }
    } catch {
      showToast({ message: 'Gagal memuat data anggota', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingInvite(true);
    setCreatedInviteCode(null);

    const relation = relationChoice === 'Lainnya' ? customRelation : relationChoice;

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access: accessChoice,
          relation: relation || 'Keluarga',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error || 'Gagal membuat undangan', type: 'error' });
        setCreatingInvite(false);
        return;
      }

      setCreatedInviteCode(data.invite.code);
      showToast({ message: 'Kode undangan berhasil dibuat!', type: 'success' });
      fetchMembers();
    } catch {
      showToast({ message: 'Terjadi kesalahan server', type: 'error' });
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleToggleAccess = async (member: Member) => {
    const newAccess = member.access === 'read' ? 'full' : 'read';
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: member.userId,
          access: newAccess,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error || 'Gagal mengubah hak akses', type: 'error' });
        return;
      }

      showToast({ message: data.message, type: 'success' });
      fetchMembers();
    } catch {
      showToast({ message: 'Gagal mengubah akses anggota', type: 'error' });
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Keluarkan ${name} dari workspace persiapan?`)) return;

    try {
      const res = await fetch(`/api/members?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error || 'Gagal menghapus anggota', type: 'error' });
        return;
      }
      showToast({ message: data.message, type: 'success' });
      fetchMembers();
    } catch {
      showToast({ message: 'Terjadi kesalahan server', type: 'error' });
    }
  };

  const handleRevokeInvite = async (code: string) => {
    try {
      const res = await fetch(`/api/members?code=${code}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        showToast({ message: data.error || 'Gagal mencabut kode', type: 'error' });
        return;
      }
      showToast({ message: data.message, type: 'success' });
      fetchMembers();
    } catch {
      showToast({ message: 'Terjadi kesalahan server', type: 'error' });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    showToast({ message: 'Kode undangan disalin ke clipboard!', type: 'success' });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const isOwner = userAccess === 'owner';

  return (
    <div className="min-h-screen bg-white">
      <AppHeader
        title="Anggota & Hak Akses"
        subtitle="Kelola siapa saja yang dapat melihat dan mengisi data"
        backHref="/rute"
      />

      <div className="p-4 space-y-6">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-ink/60">
            <Loader2 className="animate-spin mb-2" size={24} />
            <span className="text-xs">Memuat data anggota...</span>
          </div>
        ) : (
          <>
            {/* Non-Owner Informative Notice */}
            {!isOwner && (
              <div className="p-4 rounded-3xl bg-neutral-50 border-2 border-ink/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-sky border border-ink flex items-center justify-center text-ink shrink-0 mt-0.5">
                  <Shield size={16} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-ink">
                    Akses Anda: {userAccess === 'full' ? 'Full Akses' : 'Hanya Baca (Read-Only)'}
                  </h3>
                  <p className="text-[11px] text-ink/75 leading-relaxed">
                    {userAccess === 'full'
                      ? 'Anda dapat melihat dan mengisi data rute persiapan. Pembuatan kode undangan dan pengelolaan hak akses anggota hanya dapat dilakukan oleh Pemilik ruang.'
                      : 'Anda dapat memantau rute dan melengkapi biodata diri. Pembuatan kode undangan dan pengelolaan hak akses anggota hanya dapat dilakukan oleh Pemilik ruang.'}
                  </p>
                </div>
              </div>
            )}

            {/* 1. Create Invite Section (Pemilik only) */}
            {isOwner && (
              <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blush border border-ink flex items-center justify-center text-ink">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-ink">Buat Undangan Baru</h2>
                    <p className="text-[11px] text-ink/70">Bagikan kode agar orang lain bisa bergabung</p>
                  </div>
                </div>

                {/* Privacy Warning */}
                <div className="p-3 rounded-2xl bg-blush/40 border border-ink/20 text-xs text-ink flex items-start gap-2.5">
                  <ShieldAlert size={16} className="text-ink shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>Peringatan Privasi:</strong> Anggota dapat melihat seluruh data pada tahap yang sudah terbuka, termasuk data biodata, kesehatan, dan keluarga.
                  </p>
                </div>

                <form onSubmit={handleCreateInvite} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      Tingkat Hak Akses
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccessChoice('read')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          accessChoice === 'read'
                            ? 'bg-sky border-2 border-ink shadow-sm'
                            : 'bg-white border-ink/30 text-ink/70'
                        }`}
                      >
                        <span className="text-xs font-black block text-ink">Read (Hanya Baca)</span>
                        <span className="text-[10px] text-ink/75 leading-tight block mt-0.5">
                          Hanya memantau tahap yang terbuka tanpa bisa mengubah
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccessChoice('full')}
                        className={`p-2.5 rounded-2xl border text-left transition-all ${
                          accessChoice === 'full'
                            ? 'bg-blush border-2 border-ink shadow-sm'
                            : 'bg-white border-ink/30 text-ink/70'
                        }`}
                      >
                        <span className="text-xs font-black block text-ink">Full Akses</span>
                        <span className="text-[10px] text-ink/75 leading-tight block mt-0.5">
                          Bisa melihat, mengedit berkas, dan menyelesaikan tahap
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink mb-1.5">
                      Hubungan / Peran Anggota
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Pasangan', 'Orang Tua / Wali', 'Murabbi', 'Saudara', 'Lainnya'].map((rel) => (
                        <button
                          key={rel}
                          type="button"
                          onClick={() => setRelationChoice(rel)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                            relationChoice === rel
                              ? 'bg-blush border-2 border-ink text-ink shadow-sm'
                              : 'bg-white border-ink/20 text-ink/60 hover:bg-neutral-50'
                          }`}
                        >
                          {rel}
                        </button>
                      ))}
                    </div>
                    {relationChoice === 'Lainnya' && (
                      <input
                        type="text"
                        required
                        value={customRelation}
                        onChange={(e) => setCustomRelation(e.target.value)}
                        placeholder="Sebutkan hubungan, misal: Sahabat / Panitia"
                        className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-ink outline-none"
                      />
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={creatingInvite}
                    className="w-full py-3 bg-blush border-2 border-ink text-ink font-black rounded-full text-xs shadow-sm hover:scale-[1.01] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {creatingInvite ? <Loader2 size={16} className="animate-spin" /> : 'Buat Kode Undangan (Berlaku 7 Hari)'}
                  </button>
                </form>

                {/* Generated Code Display */}
                {createdInviteCode && (
                  <div className="p-3.5 rounded-2xl bg-white border-2 border-ink flex items-center justify-between shadow-subtle animate-fade-in">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-ink/60">Kode Undangan Dibuat:</p>
                      <p className="text-lg font-mono font-black text-ink tracking-widest">{createdInviteCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(createdInviteCode)}
                      className="px-3.5 py-2 rounded-full bg-sky border-2 border-ink text-ink text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      {copiedCode ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedCode ? 'Disalin' : 'Salin'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 2. Members List Section */}
            <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky border border-ink flex items-center justify-center text-ink">
                    <Users size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-ink">Anggota Ruang Persiapan</h2>
                    <p className="text-[11px] text-ink/70">{members.length} anggota terdaftar</p>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-ink/10 pt-1">
                {members.map((member) => {
                  const isThisOwner = member.userId === ownerId;

                  return (
                    <div key={member.userId} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-black text-ink truncate">{member.name}</p>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                              isThisOwner
                                ? 'bg-blush border-ink text-ink'
                                : member.access === 'full'
                                ? 'bg-blush/60 border-ink/40 text-ink'
                                : 'bg-sky border-ink text-ink'
                            }`}
                          >
                            {isThisOwner ? 'Pemilik' : member.access === 'full' ? 'Full Akses' : 'Hanya Baca'}
                          </span>
                        </div>
                        <p className="text-[11px] text-ink/70 mt-0.5">
                          Hubungan: <strong>{member.relation}</strong> · Bergabung sejak{' '}
                          {new Date(member.joinedAt).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                        </p>
                      </div>

                      {/* Action buttons (Owner can toggle access or remove) */}
                      {isOwner && !isThisOwner && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleAccess(member)}
                            className="px-2.5 py-1 rounded-full bg-white border border-ink text-[10px] font-bold text-ink hover:bg-neutral-50 active:scale-95 transition-all"
                            title="Ganti Read / Full"
                          >
                            Ubah: {member.access === 'read' ? 'Jadikan Full' : 'Jadikan Read'}
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.userId, member.name)}
                            className="p-1.5 rounded-full bg-white border border-ink/30 text-ink/70 hover:text-ink active:scale-95 transition-all"
                            title="Keluarkan anggota"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Pending Invites List Section (Owner only) */}
            {isOwner && invites.length > 0 && (
              <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white border border-ink flex items-center justify-center text-ink">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-ink">Kode Undangan Aktif</h2>
                    <p className="text-[11px] text-ink/70">{invites.length} kode menunggu digunakan</p>
                  </div>
                </div>

                <div className="divide-y divide-ink/10 pt-1">
                  {invites.map((inv) => (
                    <div key={inv.code} className="py-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-ink">{inv.code}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky border border-ink text-ink">
                            {inv.access.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-[10px] text-ink/60">
                          Untuk: {inv.relation} · Kedaluwarsa:{' '}
                          {new Date(inv.expiresAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => copyToClipboard(inv.code)}
                          className="p-1.5 rounded-full bg-white border border-ink/30 text-ink hover:bg-sky active:scale-95 transition-all"
                          title="Salin kode"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => handleRevokeInvite(inv.code)}
                          className="p-1.5 rounded-full bg-white border border-ink/30 text-ink/70 hover:text-ink active:scale-95 transition-all"
                          title="Cabut undangan"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
