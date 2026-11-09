'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Users,
  HardDrive,
  Archive,
  ArrowLeft,
  KeyRound,
  Download,
  Power,
  RotateCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { formatDateIndo } from '@/lib/utils/formatters';

export default function AdminPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Reset Password Modal
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
      ]);

      if (statsRes.status === 403 || usersRes.status === 403) {
        showToast({ message: 'Akses ditolak: Hanya untuk Administrator', type: 'error' });
        router.push('/rute');
        return;
      }

      if (statsRes.ok) setStats((await statsRes.json()).stats);
      if (usersRes.ok) setUsers((await usersRes.json()).users);
    } catch (err) {
      console.error('Error loading admin:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleToggleUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle`, { method: 'POST' });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Gagal mengubah status');

      showToast({ message: resJson.message, type: 'success' });
      loadAdminData();
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || newPassword.length < 8) {
      showToast({ message: 'Password minimal 8 karakter', type: 'error' });
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Gagal mereset password');

      showToast({ message: resJson.message, type: 'success' });
      setResetModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/backup', { method: 'POST' });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Gagal membuat cadangan');

      showToast({ message: resJson.message, type: 'success' });
      loadAdminData();
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={30} className="animate-spin text-rose" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Panel Administrator"
        subtitle="Monitoring sistem, pengguna &amp; cadangan"
        backHref="/profil"
      />

      <div className="p-4 space-y-5 text-xs">
        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-3xl bg-white border border-blush shadow-soft">
            <div className="w-8 h-8 rounded-xl bg-blush text-rose flex items-center justify-center mb-2">
              <Users size={16} />
            </div>
            <p className="text-[10px] text-ink/70">Total Pengguna</p>
            <h3 className="text-xl font-black text-ink mt-0.5">{stats?.totalUsers || 0}</h3>
            <p className="text-[10px] text-rose font-semibold mt-1">
              {stats?.activeUsers || 0} Aktif · {stats?.disabledUsers || 0} Nonaktif
            </p>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-sky shadow-soft">
            <div className="w-8 h-8 rounded-xl bg-sky text-ink flex items-center justify-center mb-2">
              <HardDrive size={16} />
            </div>
            <p className="text-[10px] text-ink/70">Pemakaian Disk</p>
            <h3 className="text-xl font-black text-ink mt-0.5">{stats?.totalStorageMb || 0} MB</h3>
            <p className="text-[10px] text-ink/60 mt-1">
              Uploads: {stats?.uploadsStorageMb || 0} MB
            </p>
          </div>
        </div>

        {/* System Backup Section */}
        <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose">
              <Archive size={16} />
              <h4 className="font-extrabold text-xs uppercase tracking-wider">Cadangan Sistem (Retensi 14 Hari)</h4>
            </div>

            <button
              onClick={handleTriggerBackup}
              disabled={actionLoading}
              className="px-3 py-1.5 bg-rose text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95 disabled:opacity-50 transition-all"
            >
              {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <RotateCw size={12} />}
              <span>Cadangkan Sekarang</span>
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {stats?.backups && stats.backups.length > 0 ? (
              stats.backups.slice(0, 5).map((b: any, idx: number) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-neutral-50 border border-blush/60 flex items-center justify-between text-[11px]"
                >
                  <span className="font-mono text-ink/80 truncate">{b.name}</span>
                  <a
                    href={`/api/admin/backups/${b.name}`}
                    className="px-2 py-0.5 bg-sky text-ink font-bold rounded-full text-[10px] flex items-center gap-1 hover:bg-rose hover:text-white transition-colors"
                  >
                    <Download size={10} />
                    <span>Unduh</span>
                  </a>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-ink/60 text-center py-2">Belum ada file backup snapshot.</p>
            )}
          </div>
        </div>

        {/* User Management Section */}
        <div className="space-y-3">
          <h4 className="font-extrabold text-ink text-xs flex items-center gap-1.5">
            <Users size={16} className="text-rose" />
            <span>Daftar Pengguna ({users.length})</span>
          </h4>

          <div className="space-y-2.5">
            {users.map((u: any) => (
              <div
                key={u.id}
                className="p-4 rounded-3xl bg-white border border-blush shadow-soft space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-ink text-sm leading-snug">{u.name}</h5>
                    <p className="text-[11px] text-ink/65">{u.identifier} · Catin {u.role}</p>
                    <p className="text-[10px] text-ink/50 mt-0.5">Daftar: {formatDateIndo(u.createdAt)}</p>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      u.isDisabled ? 'bg-red-100 text-red-600' : 'bg-blush text-rose'
                    }`}
                  >
                    {u.isDisabled ? 'Dinonaktifkan' : 'Aktif'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-blush/60">
                  <button
                    onClick={() => {
                      setSelectedUser(u);
                      setNewPassword('');
                      setResetModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-neutral-100 text-ink/80 font-bold rounded-full text-[11px] flex items-center gap-1 hover:bg-rose hover:text-white transition-colors"
                  >
                    <KeyRound size={12} />
                    <span>Reset Password</span>
                  </button>

                  <button
                    onClick={() => handleToggleUser(u.id)}
                    className={`px-3 py-1 font-bold rounded-full text-[11px] flex items-center gap-1 transition-all ${
                      u.isDisabled
                        ? 'bg-sky text-ink hover:bg-sky/80'
                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                    }`}
                  >
                    <Power size={12} />
                    <span>{u.isDisabled ? 'Aktifkan Akun' : 'Nonaktifkan'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sheet: Reset Password by Admin */}
      <BottomSheet isOpen={resetModalOpen} onClose={() => setResetModalOpen(false)} title={`Reset Password: ${selectedUser?.name || ''}`}>
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Password Baru (min. 8 karakter):</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru untuk pengguna"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <button
            onClick={handleResetPassword}
            disabled={actionLoading}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2 flex items-center justify-center gap-2"
          >
            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Terapkan Password Baru'}
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
