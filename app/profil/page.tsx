'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  Heart,
  Settings,
  Shield,
  Download,
  Upload,
  KeyRound,
  LogOut,
  Trash2,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Loader2,
  Bell,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { formatDateIndo, calculateAge } from '@/lib/utils/formatters';

export default function ProfilPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'profil' | 'pengaturan'>('profil');
  const [profileSide, setProfileSide] = useState<'self' | 'partner'>('self');

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [weddingSheetOpen, setWeddingSheetOpen] = useState(false);
  const [deleteAccountSheetOpen, setDeleteAccountSheetOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Wedding Settings State
  const [targetDate, setTargetDate] = useState('');
  const [weddingLocation, setWeddingLocation] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, profRes, settRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/m/profile'),
          fetch('/api/m/settings'),
        ]);

        if (!meRes.ok) {
          router.replace('/login');
          return;
        }

        const uJson = await meRes.json();
        setUser(uJson.user);

        if (profRes.ok) {
          const pJson = await profRes.json();
          setProfile(pJson.data || pJson);
        }
        if (settRes.ok) {
          const sJson = await settRes.json();
          const sData = sJson.data || sJson;
          setSettings(sData);
          setTargetDate(sData?.targetDate || '');
          setWeddingLocation(sData?.weddingLocation || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSaveWeddingSettings = async () => {
    try {
      const updated = { ...settings, targetDate, weddingLocation };
      await fetch('/api/m/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setSettings(updated);
      setWeddingSheetOpen(false);
      showToast({ message: 'Pengaturan pernikahan disimpan', type: 'success' });
    } catch {
      showToast({ message: 'Gagal menyimpan pengaturan', type: 'error' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast({ message: 'Password baru minimal 8 karakter', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ message: 'Konfirmasi password tidak cocok', type: 'error' });
      return;
    }

    setPassLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Gagal mengubah password');

      setPasswordSheetOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showToast({ message: 'Password berhasil diubah!', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message, type: 'error' });
    } finally {
      setPassLoading(false);
    }
  };

  const handleExportData = () => {
    window.location.href = '/api/export';
    showToast({ message: 'Menyiapkan berkas cadangan ZIP...', type: 'info' });
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast({ message: 'Memulihkan data dari berkas ZIP...', type: 'info' });
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Import gagal');

      showToast({ message: resJson.message || 'Data berhasil dipulihkan!', type: 'success' });
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      showToast({ message: err.message || 'Gagal memulihkan cadangan', type: 'error' });
    }
  };

  const handleDeleteAccountPermanently = async () => {
    if (deleteConfirmText !== 'HAPUS PERMANEN') {
      showToast({ message: 'Ketik "HAPUS PERMANEN" untuk mengonfirmasi', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (res.ok) {
        showToast({ message: 'Seluruh akun dan data Anda telah dihapus', type: 'success' });
        router.push('/');
      }
    } catch {
      showToast({ message: 'Gagal menghapus akun', type: 'error' });
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-ink/70">Memuat profil...</p>
      </div>
    );
  }

  const person = profile?.[profileSide] || {};

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Profil &amp; Pengaturan"
        subtitle="Kelola profil calon pengantin &amp; ruang data"
        backHref="/rute"
      />

      {/* Segmented Top Tabs */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-ink/10 px-4 py-2">
        <div className="flex bg-neutral-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('profil')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profil' ? 'bg-blush border-2 border-ink text-ink shadow-sm' : 'text-ink/70 hover:text-ink'
            }`}
          >
            Profil Kami Berdua
          </button>
          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'pengaturan' ? 'bg-blush border-2 border-ink text-ink shadow-sm' : 'text-ink/70 hover:text-ink'
            }`}
          >
            Pengaturan &amp; Data
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* ============================================================== */}
        {/* TAB 1: PROFIL SAYA & CALON (SECTION 10)                         */}
        {/* ============================================================== */}
        {activeTab === 'profil' && (
          <div className="space-y-4">
            <div className="flex bg-neutral-100 p-1 rounded-2xl gap-1">
              <button
                onClick={() => setProfileSide('self')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  profileSide === 'self' ? 'bg-blush border border-ink text-ink shadow-sm' : 'text-ink/70 hover:text-ink'
                }`}
              >
                Profil Saya ({profile?.self?.fullName || user?.name || 'Saya'})
              </button>
              <button
                onClick={() => setProfileSide('partner')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  profileSide === 'partner' ? 'bg-sky border border-ink text-ink shadow-sm' : 'text-ink/70 hover:text-ink'
                }`}
              >
                Profil Calon ({profile?.partner?.fullName || 'Calon'})
              </button>
            </div>

            {/* Profile Avatar Card */}
            <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blush flex items-center justify-center overflow-hidden border-2 border-ink shrink-0 shadow-sm">
                {person.photoFileId ? (
                  <img
                    src={`/api/files/${person.photoFileId}`}
                    alt="Foto Profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User size={30} className="text-ink/60" />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-base font-extrabold text-ink truncate">
                  {person.fullName || (profileSide === 'self' ? user?.name : 'Nama Calon')}
                </h3>
                <p className="text-xs text-rose font-medium mt-0.5">
                  {person.occupation || 'Pekerjaan belum diisi'}
                </p>
                <Link
                  href="/taaruf?tab=biodata"
                  className="inline-block text-[11px] text-ink font-bold underline mt-1.5"
                >
                  Edit Lengkap di Biodata &rarr;
                </Link>
              </div>
            </div>

            {/* Quick Details Table */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-2.5 text-xs">
              <h4 className="text-xs font-extrabold text-rose uppercase tracking-wider mb-2">Ringkasan Data</h4>

              <div className="flex justify-between py-1.5 border-b border-blush/60">
                <span className="text-ink/65">Panggilan</span>
                <span className="font-bold text-ink">{person.nickname || '-'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-blush/60">
                <span className="text-ink/65">Usia / Tanggal Lahir</span>
                <span className="font-bold text-ink">
                  {person.birthDate ? `${calculateAge(person.birthDate)} Tahun (${formatDateIndo(person.birthDate)})` : '-'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-blush/60">
                <span className="text-ink/65">Domisili / Suku</span>
                <span className="font-bold text-ink">{person.domicile || person.ethnicity || '-'}</span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-blush/60">
                <span className="text-ink/65">Status Pernikahan</span>
                <span className="font-bold text-ink">
                  {person.status === 'duda'
                    ? 'Duda'
                    : person.status === 'janda'
                    ? 'Janda'
                    : 'Belum Pernah Menikah'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-blush/60">
                <span className="text-ink/65">Pendidikan Terakhir</span>
                <span className="font-bold text-ink">{person.education || '-'}</span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-ink/65">Perantara Ta’aruf</span>
                <span className="font-bold text-ink">{person.intermediaryName || '-'}</span>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PENGATURAN & DATA (SECTION 7 & 10)                      */}
        {/* ============================================================== */}
        {activeTab === 'pengaturan' && (
          <div className="space-y-4 text-xs">
            {/* Wedding Target Settings Card */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-ink text-sm">Target Tanggal &amp; Lokasi Akad</h4>
                  <p className="text-[11px] text-ink/70 mt-0.5">
                    {settings?.targetDate ? `${formatDateIndo(settings.targetDate)} · ${settings.weddingLocation || 'Lokasi belum diisi'}` : 'Belum diatur'}
                  </p>
                </div>
                <button
                  onClick={() => setWeddingSheetOpen(true)}
                  className="px-3 py-1.5 bg-blush border-2 border-ink text-ink font-bold rounded-full text-xs shadow-xs"
                >
                  Ubah
                </button>
              </div>
            </div>

            {/* Workspace & Members Section */}
            <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-3">
              <h4 className="text-xs font-black text-ink uppercase tracking-wider">Ruang Data &amp; Anggota</h4>
              <p className="text-[11px] text-ink/75 leading-relaxed">
                Kelola hak akses Read (hanya memantau) dan Full (ikut mengisi data) untuk pasangan, keluarga, atau murabbi.
              </p>
              <Link
                href="/anggota"
                className="w-full p-3 rounded-2xl bg-sky border-2 border-ink flex items-center justify-between font-bold text-xs text-ink hover:bg-sky/80 active:scale-95 transition-all shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Users size={18} className="text-ink" />
                  <span>Kelola Anggota &amp; Kode Undangan</span>
                </div>
                <span>&rarr;</span>
              </Link>
            </div>

            {/* Account Management & Security */}
            <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-3">
              <h4 className="text-xs font-black text-ink uppercase tracking-wider">Akun &amp; Keamanan</h4>

              <div className="flex items-center justify-between py-1.5 border-b border-ink/10">
                <div>
                  <p className="font-bold text-ink">{user?.name}</p>
                  <p className="text-[11px] text-ink/60">{user?.identifier} · Catin {user?.role}</p>
                </div>
              </div>

              <button
                onClick={() => setPasswordSheetOpen(true)}
                className="w-full flex items-center justify-between py-2 text-ink hover:underline transition-colors"
              >
                <div className="flex items-center gap-2">
                  <KeyRound size={16} className="text-ink" />
                  <span className="font-semibold text-xs">Ganti Password Akun</span>
                </div>
                <span>&rarr;</span>
              </button>

              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className="w-full flex items-center justify-between py-2 text-ink font-bold hover:underline text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Shield size={16} />
                    <span>Panel Administrator Sistem</span>
                  </div>
                  <span>&rarr;</span>
                </Link>
              )}
            </div>

            {/* Data & Backup Options */}
            <div className="p-5 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-3">
              <h4 className="text-xs font-black text-ink uppercase tracking-wider">Cadangan &amp; Ekspor Data</h4>
              <p className="text-[11px] text-ink/75">
                Unduh seluruh data pernikahan Anda dalam bentuk arsip ZIP mandiri untuk disimpan di Google Drive atau komputer pribadi.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={handleExportData}
                  className="p-3 rounded-2xl bg-sky border-2 border-ink flex flex-col items-center text-center gap-1.5 font-bold text-xs text-ink hover:bg-sky/80 transition-all shadow-xs"
                >
                  <Download size={18} className="text-ink" />
                  <span>Ekspor Data (ZIP)</span>
                </button>

                <label className="p-3 rounded-2xl bg-blush border-2 border-ink flex flex-col items-center text-center gap-1.5 font-bold text-xs text-ink hover:bg-blush/80 transition-all shadow-xs cursor-pointer">
                  <Upload size={18} className="text-ink" />
                  <span>Pulihkan dari ZIP</span>
                  <input type="file" accept=".zip,.json" className="hidden" onChange={handleImportData} />
                </label>
              </div>
            </div>

            {/* Links to Privacy & Terms */}
            <div className="p-4 rounded-3xl bg-white border-2 border-ink shadow-subtle space-y-2 text-xs">
              <Link href="/privasi" className="flex items-center justify-between py-1 text-ink/80 hover:text-ink">
                <span>Kebijakan Privasi (UU PDP)</span>
                <ExternalLink size={14} />
              </Link>
              <Link href="/syarat" className="flex items-center justify-between py-1 text-ink/80 hover:text-ink border-t border-ink/10">
                <span>Syarat &amp; Ketentuan Penggunaan</span>
                <ExternalLink size={14} />
              </Link>
            </div>

            {/* Logout and Delete Account */}
            <div className="space-y-2.5 pt-2">
              <button
                onClick={handleLogout}
                className="w-full py-3 bg-white border-2 border-ink text-ink font-bold rounded-full flex items-center justify-center gap-2 hover:bg-blush/40 active:scale-95 transition-all text-xs"
              >
                <LogOut size={16} />
                <span>Keluar dari Akun</span>
              </button>

              <button
                onClick={() => setDeleteAccountSheetOpen(true)}
                className="w-full py-3 bg-white border-2 border-ink text-ink font-bold rounded-full flex items-center justify-center gap-2 hover:bg-neutral-100 active:scale-95 transition-all text-xs"
              >
                <Trash2 size={15} />
                <span>Hapus Akun &amp; Seluruh Data Permanen</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sheet: Wedding Settings */}
      <BottomSheet isOpen={weddingSheetOpen} onClose={() => setWeddingSheetOpen(false)} title="Target Pernikahan">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Target Tanggal Akad:</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Kota / Lokasi Pernikahan:</label>
            <input
              type="text"
              value={weddingLocation}
              onChange={(e) => setWeddingLocation(e.target.value)}
              placeholder="misal: Bandung, Jawa Barat"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-ink/30 focus:border-ink outline-none text-ink"
            />
          </div>

          <button
            onClick={handleSaveWeddingSettings}
            className="w-full py-3 bg-blush border-2 border-ink text-ink font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Pengaturan
          </button>
        </div>
      </BottomSheet>

      {/* Sheet: Change Password */}
      <BottomSheet isOpen={passwordSheetOpen} onClose={() => setPasswordSheetOpen(false)} title="Ganti Password">
        <form onSubmit={handleChangePassword} className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Password Lama:</label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-ink/30 focus:border-ink outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Password Baru (min. 8 karakter):</label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-ink/30 focus:border-ink outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Konfirmasi Password Baru:</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-ink/30 focus:border-ink outline-none text-ink"
            />
          </div>

          <button
            type="submit"
            disabled={passLoading}
            className="w-full py-3 bg-blush border-2 border-ink text-ink font-bold rounded-full text-xs shadow-md mt-2 flex items-center justify-center gap-2"
          >
            {passLoading ? <Loader2 size={16} className="animate-spin" /> : 'Perbarui Password'}
          </button>
        </form>
      </BottomSheet>

      {/* Sheet: Delete Account Permanently (UU PDP) */}
      <BottomSheet isOpen={deleteAccountSheetOpen} onClose={() => setDeleteAccountSheetOpen(false)} title="Hapus Akun Permanen">
        <div className="space-y-3 pb-6 text-xs">
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 leading-relaxed">
            <p className="font-bold">Tindakan ini tidak dapat dibatalkan!</p>
            <p className="text-[11px] mt-1">
              Seluruh biodata, kartu tanya jawab, data anggaran, kontak vendor, checklist KUA, dan berkas foto Anda akan dihapus permanen dari server sesuai UU Perlindungan Data Pribadi (UU PDP).
            </p>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">
              Ketik teks <span className="text-red-600 font-extrabold">&quot;HAPUS PERMANEN&quot;</span> untuk melanjutkan:
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="HAPUS PERMANEN"
              className="w-full p-2.5 rounded-2xl border border-red-300 focus:border-red-600 outline-none font-bold text-red-600 text-center"
            />
          </div>

          <button
            onClick={handleDeleteAccountPermanently}
            disabled={deleteConfirmText !== 'HAPUS PERMANEN'}
            className="w-full py-3 bg-red-600 text-white font-bold rounded-full text-xs shadow-md disabled:opacity-40 transition-all"
          >
            Hapus Akun Saya Sekarang
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
