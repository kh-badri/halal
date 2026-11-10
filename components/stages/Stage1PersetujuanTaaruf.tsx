'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Heart,
  Activity,
  Users,
  Shield,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Calendar,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { calculateAge } from '@/lib/utils/formatters';
import { compressImage } from '@/lib/utils/image-compression';
import { useToast } from '@/components/ui/Toast';

interface Stage1Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage1PersetujuanTaaruf({ workspaceId, isReadOnly, onDataChanged }: Stage1Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'biodata' | 'kesehatan' | 'nadzor' | 'keputusan'>('biodata');
  const [personTab, setPersonTab] = useState<'self' | 'partner'>('self');
  const [loading, setLoading] = useState(true);

  const [taarufData, setTaarufData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [blurSensitive, setBlurSensitive] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load both taaruf and profile data
  useEffect(() => {
    async function load() {
      try {
        const [tRes, pRes] = await Promise.all([
          fetch('/api/m/taaruf'),
          fetch('/api/m/profile'),
        ]);

        if (tRes.ok) {
          const tJson = await tRes.json();
          const tData = tJson.data || tJson;
          setTaarufData(tData);
          setBlurSensitive(Boolean(tData?.privacyBlurEnabled));
        }
        if (pRes.ok) {
          const pJson = await pRes.json();
          setProfileData(pJson.data || pJson);
        }
      } catch (err) {
        console.error('Error loading Stage 1 data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Fast auto-save for profile (selalu diizinkan untuk biodata/profil)
  const saveProfile = (newProfile: any, immediate = false) => {
    setProfileData(newProfile);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newProfile),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (e) {
        console.error('Failed to save profile:', e);
      }
    }, immediate ? 20 : 250);
  };

  // Fast auto-save for taaruf
  const saveTaaruf = (newTaaruf: any, immediate = false) => {
    setTaarufData(newTaaruf);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/taaruf', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTaaruf),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (e) {
        console.error('Failed to save taaruf:', e);
      }
    }, immediate ? 20 : 250);
  };

  const handleProfileFieldChange = (field: string, value: any) => {
    const currentPerson = profileData?.[personTab] || {};
    const updatedPerson = { ...currentPerson, [field]: value };
    const updated = {
      ...profileData,
      [personTab]: updatedPerson,
    };
    saveProfile(updated);
  };

  const handleHealthFieldChange = (field: string, value: any) => {
    const targetKey = personTab === 'self' ? 'healthSelf' : 'healthPartner';
    const current = taarufData?.[targetKey] || {};
    const updated = {
      ...taarufData,
      [targetKey]: { ...current, [field]: value },
    };
    saveTaaruf(updated);
  };

  const handleFamilyFieldChange = (field: string, value: any) => {
    const targetKey = personTab === 'self' ? 'familySelf' : 'familyPartner';
    const current = taarufData?.[targetKey] || {};
    const updated = {
      ...taarufData,
      [targetKey]: { ...current, [field]: value },
    };
    saveTaaruf(updated);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast('Mengompres foto...', 'info');
      const compressed = await compressImage(file, 800, 0.8);
      const formData = new FormData();
      formData.append('file', compressed.file);

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Gagal upload');
      const json = await res.json();
      handleProfileFieldChange('photoFileId', json.fileId);
      showToast('Foto profil tersimpan', 'success');
    } catch (err: any) {
      showToast(err.message || 'Gagal mengunggah foto', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
        <p className="text-xs text-ink/70">Memuat data Persetujuan Ta’aruf...</p>
      </div>
    );
  }

  const currentPerson = profileData?.[personTab] || {};
  const currentHealth = personTab === 'self' ? taarufData?.healthSelf || {} : taarufData?.healthPartner || {};
  const currentFamily = personTab === 'self' ? taarufData?.familySelf || {} : taarufData?.familyPartner || {};
  // Catin diperbolehkan mengedit biodata & kesehatannya sendiri walaupun berstatus read-only
  const isBiodataDisabled = isReadOnly && personTab !== 'self';
  const isHealthSelfDisabled = isReadOnly && personTab !== 'self';

  return (
    <div className="space-y-4">
      {/* Segmented Navigation Tabs (Gelato / Strawberry Aesthetic) */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/70 rounded-2xl overflow-x-auto shadow-inner no-scrollbar border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('biodata')}
          className={`flex-1 min-w-[88px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'biodata'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Biodata
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('kesehatan')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'kesehatan'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kesehatan &amp; Keluarga
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('nadzor')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'nadzor'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Nadzor &amp; Istikharah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keputusan')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'keputusan'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Keputusan
        </button>
      </div>

      {/* Sub-selector: Saya vs Calon */}
      {(activeTab === 'biodata' || activeTab === 'kesehatan') && (
        <div className="flex items-center justify-between bg-rose-50/60 p-1.5 rounded-2xl border border-rose-100">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setPersonTab('self')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                personTab === 'self'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Biodata Saya
            </button>
            <button
              type="button"
              onClick={() => setPersonTab('partner')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                personTab === 'partner'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Biodata Calon
            </button>
          </div>

          {activeTab === 'kesehatan' && (
            <button
              type="button"
              onClick={() => {
                const nextBlur = !blurSensitive;
                setBlurSensitive(nextBlur);
                saveTaaruf({ ...taarufData, privacyBlurEnabled: nextBlur });
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-white border border-rose-200 rounded-xl text-[11px] font-bold text-rose-600 shadow-xs hover:bg-rose-50 transition-all"
              title="Sensor data sensitif untuk privasi"
            >
              {blurSensitive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{blurSensitive ? 'Sensor Aktif' : 'Privasi'}</span>
            </button>
          )}
        </div>
      )}

      {/* TAB 1: BIODATA */}
      {activeTab === 'biodata' && (
        <div className="space-y-4">
          {/* Card: Foto Profil & Info Utama */}
          <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(240,86,124,0.06)] space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 rounded-2xl border-2 border-rose-200 overflow-hidden bg-rose-50 flex items-center justify-center shrink-0 shadow-xs">
                {currentPerson.photoFileId ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/files/${currentPerson.photoFileId}`}
                    alt={currentPerson.fullName || 'Foto'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-ink/40" />
                )}
                {!isBiodataDisabled && (
                  <label className="absolute inset-0 bg-ink/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white">
                    <Upload className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="flex-1">
                <span className="text-[10px] font-black uppercase text-ink/60 tracking-wider">
                  {personTab === 'self' ? 'Profil Pribadi' : 'Profil Calon Pasangan'}
                </span>
                <h3 className="text-base font-black text-ink">
                  {currentPerson.fullName || (personTab === 'self' ? 'Nama Anda' : 'Nama Calon')}
                </h3>
                <p className="text-xs text-ink/70">
                  {currentPerson.birthDate
                    ? `${calculateAge(currentPerson.birthDate)} tahun · ${currentPerson.domicile || 'Domisili belum diisi'}`
                    : 'Lengkapi tanggal lahir dan domisili'}
                </p>
              </div>
            </div>

            {/* Field Wajib Biodata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Nama Lengkap <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="text"
                  disabled={isBiodataDisabled}
                  value={currentPerson.fullName || ''}
                  onChange={(e) => handleProfileFieldChange('fullName', e.target.value)}
                  placeholder="Contoh: Ahmad Fauzan"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Nama Panggilan</label>
                <input
                  type="text"
                  disabled={isBiodataDisabled}
                  value={currentPerson.nickname || ''}
                  onChange={(e) => handleProfileFieldChange('nickname', e.target.value)}
                  placeholder="Contoh: Fauzan"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Tanggal Lahir <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="date"
                  disabled={isBiodataDisabled}
                  value={currentPerson.birthDate || currentPerson.dob || ''}
                  onChange={(e) => {
                    handleProfileFieldChange('birthDate', e.target.value);
                    handleProfileFieldChange('dob', e.target.value);
                  }}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Tempat Lahir</label>
                <input
                  type="text"
                  disabled={isBiodataDisabled}
                  value={currentPerson.birthPlace || ''}
                  onChange={(e) => handleProfileFieldChange('birthPlace', e.target.value)}
                  placeholder="Kota kelahiran"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Domisili Saat Ini <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="text"
                  disabled={isBiodataDisabled}
                  value={currentPerson.domicile || ''}
                  onChange={(e) => handleProfileFieldChange('domicile', e.target.value)}
                  placeholder="Kota / Kabupaten tempat tinggal"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Pekerjaan <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="text"
                  disabled={isBiodataDisabled}
                  value={currentPerson.occupation || ''}
                  onChange={(e) => handleProfileFieldChange('occupation', e.target.value)}
                  placeholder="Profesi atau instansi"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Kontak WhatsApp / Telepon <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="tel"
                  disabled={isBiodataDisabled}
                  value={currentPerson.phone || currentPerson.whatsapp || ''}
                  onChange={(e) => {
                    handleProfileFieldChange('phone', e.target.value);
                    handleProfileFieldChange('whatsapp', e.target.value);
                  }}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Status Pernikahan</label>
                <select
                  disabled={isBiodataDisabled}
                  value={currentPerson.status || 'lajang'}
                  onChange={(e) => handleProfileFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                >
                  <option value="lajang">Lajang (Belum Pernah Menikah)</option>
                  <option value="duda">Duda</option>
                  <option value="janda">Janda</option>
                </select>
              </div>
            </div>
          </div>

          {/* Card: Latar Belakang & Nilai Pribadi */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <h4 className="text-sm font-black text-ink flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-ink" /> Latar Belakang & Nilai
            </h4>

            <div className="space-y-3.5">
              {/* Row 1: Tinggi & Berat Badan - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Tinggi Badan (cm)
                  </label>
                  <input
                    type="number"
                    disabled={isBiodataDisabled}
                    value={currentPerson.heightCm || ''}
                    onChange={(e) => handleProfileFieldChange('heightCm', Number(e.target.value))}
                    placeholder="Contoh: 170"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Berat Badan (kg)
                  </label>
                  <input
                    type="number"
                    disabled={isBiodataDisabled}
                    value={currentPerson.weightKg || ''}
                    onChange={(e) => handleProfileFieldChange('weightKg', Number(e.target.value))}
                    placeholder="Contoh: 65"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Suku & Pendidikan - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Suku / Etnis
                  </label>
                  <input
                    type="text"
                    disabled={isBiodataDisabled}
                    value={currentPerson.ethnicity || ''}
                    onChange={(e) => handleProfileFieldChange('ethnicity', e.target.value)}
                    placeholder="Contoh: Jawa, Sunda"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Pendidikan Terakhir
                  </label>
                  <input
                    type="text"
                    disabled={isBiodataDisabled}
                    value={currentPerson.education || ''}
                    onChange={(e) => handleProfileFieldChange('education', e.target.value)}
                    placeholder="Contoh: S1 / D3 / SMA"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Visi & Misi Pernikahan</label>
                <textarea
                  rows={2}
                  disabled={isBiodataDisabled}
                  value={currentPerson.visionMission || ''}
                  onChange={(e) => handleProfileFieldChange('visionMission', e.target.value)}
                  placeholder="Gambarkan rumah tangga impian yang ingin dibangun bersama..."
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Rutinitas Ibadah & Amalan</label>
                  <textarea
                    rows={2}
                    disabled={isBiodataDisabled}
                    value={currentPerson.worshipRoutine || ''}
                    onChange={(e) => handleProfileFieldChange('worshipRoutine', e.target.value)}
                    placeholder="Kebiasaan salat berjamaah, tilawah, puasa sunnah, dll."
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Hafalan Qur’an & Kajian</label>
                  <textarea
                    rows={2}
                    disabled={isBiodataDisabled}
                    value={currentPerson.quranHafalan || currentPerson.routineStudy || ''}
                    onChange={(e) => {
                      handleProfileFieldChange('quranHafalan', e.target.value);
                      handleProfileFieldChange('routineStudy', e.target.value);
                    }}
                    placeholder="Juz hafalan, kajian atau ustadz yang sering disimak..."
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Kelebihan Diri</label>
                  <input
                    type="text"
                    disabled={isBiodataDisabled}
                    value={currentPerson.strengths || ''}
                    onChange={(e) => handleProfileFieldChange('strengths', e.target.value)}
                    placeholder="Contoh: Sabar, teliti, gemar belajar"
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Hal yang Perlu Ditoleransi / Diperbaiki</label>
                  <input
                    type="text"
                    disabled={isBiodataDisabled}
                    value={currentPerson.weaknesses || ''}
                    onChange={(e) => handleProfileFieldChange('weaknesses', e.target.value)}
                    placeholder="Contoh: Terkadang pelupa saat lelah"
                    className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KESEHATAN & KELUARGA */}
      {activeTab === 'kesehatan' && (
        <div className="space-y-4">
          {/* Card: Riwayat Kesehatan */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-ink flex items-center gap-2">
                <Activity className="w-4 h-4 text-ink" /> Riwayat Kesehatan (
                {personTab === 'self' ? 'Saya' : 'Calon'})
              </h4>
              {blurSensitive && (
                <span className="text-[10px] font-bold text-ink bg-sky px-2.5 py-0.5 rounded-full border border-ink">
                  Sensor Ditampilkan
                </span>
              )}
            </div>

            <div className={`space-y-3.5 ${blurSensitive ? 'blur-xs select-none' : ''}`}>
              {/* Row 1: Golongan Darah & Rhesus - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Golongan Darah
                  </label>
                  <select
                    disabled={isHealthSelfDisabled}
                    value={currentHealth.bloodType || ''}
                    onChange={(e) => handleHealthFieldChange('bloodType', e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  >
                    <option value="">Pilih Golongan</option>
                    <option value="A">Golongan A</option>
                    <option value="B">Golongan B</option>
                    <option value="AB">Golongan AB</option>
                    <option value="O">Golongan O</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Rhesus (+ / -)
                  </label>
                  <select
                    disabled={isHealthSelfDisabled}
                    value={currentHealth.rhesus || ''}
                    onChange={(e) => handleHealthFieldChange('rhesus', e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  >
                    <option value="">Pilih Rhesus</option>
                    <option value="+">Positif (+)</option>
                    <option value="-">Negatif (-)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Alergi & Penyakit Bawaan - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Riwayat Alergi
                  </label>
                  <input
                    type="text"
                    disabled={isHealthSelfDisabled}
                    value={currentHealth.allergies || ''}
                    onChange={(e) => handleHealthFieldChange('allergies', e.target.value)}
                    placeholder="Makanan, obat, dll."
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Penyakit Kronis / Bawaan
                  </label>
                  <input
                    type="text"
                    disabled={isHealthSelfDisabled}
                    value={currentHealth.chronicIllness || ''}
                    onChange={(e) => handleHealthFieldChange('chronicIllness', e.target.value)}
                    placeholder="Asma, maag, dll."
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Riwayat Operasi & Obat Rutin - Full Width */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Riwayat Operasi & Obat Rutin
                </label>
                <textarea
                  rows={2}
                  disabled={isHealthSelfDisabled}
                  value={currentHealth.routineMedication || currentHealth.surgeryHistory || ''}
                  onChange={(e) => {
                    handleHealthFieldChange('routineMedication', e.target.value);
                    handleHealthFieldChange('surgeryHistory', e.target.value);
                  }}
                  placeholder="Catatan operasi terdahulu atau obat rutin (atau 'Tidak ada')..."
                  className="w-full p-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Row 4: Hasil Cek Lab & Catatan Tambahan - Full Width */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Hasil Cek Laboratorium / Catatan Tambahan
                </label>
                <textarea
                  rows={2}
                  disabled={isHealthSelfDisabled}
                  value={currentHealth.labTestResults || currentHealth.notes || ''}
                  onChange={(e) => {
                    handleHealthFieldChange('labTestResults', e.target.value);
                    handleHealthFieldChange('notes', e.target.value);
                  }}
                  placeholder="Hepatitis B, thalassemia, gula darah (bila sudah ada hasil tes)..."
                  className="w-full p-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Card: Riwayat Keluarga & Wali Nasab */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <h4 className="text-sm font-black text-ink flex items-center gap-2">
              <Users className="w-4 h-4 text-ink" /> Data Keluarga & Wali Nasab (
              {personTab === 'self' ? 'Saya' : 'Calon'})
            </h4>

            <div className={`space-y-3.5 ${blurSensitive ? 'blur-xs select-none' : ''}`}>
              {/* Row 1: Orang Tua Kandung - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Nama & Pekerjaan Ayah
                  </label>
                  <input
                    type="text"
                    disabled={isHealthSelfDisabled}
                    value={currentFamily.fatherName ? `${currentFamily.fatherName}${currentFamily.fatherOccupation ? ` (${currentFamily.fatherOccupation})` : ''}` : ''}
                    onChange={(e) => {
                      handleFamilyFieldChange('fatherName', e.target.value);
                    }}
                    placeholder="Nama ayah kandung"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Nama & Pekerjaan Ibu
                  </label>
                  <input
                    type="text"
                    disabled={isHealthSelfDisabled}
                    value={currentFamily.motherName ? `${currentFamily.motherName}${currentFamily.motherOccupation ? ` (${currentFamily.motherOccupation})` : ''}` : ''}
                    onChange={(e) => {
                      handleFamilyFieldChange('motherName', e.target.value);
                    }}
                    placeholder="Nama ibu kandung"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Wali Nasab Pernikahan - Full Width */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-ink">
                    Wali Nasab Pernikahan
                  </label>
                  <span className="text-[10px] text-ink/60">Khusus Calon Wanita</span>
                </div>
                <input
                  type="text"
                  disabled={isHealthSelfDisabled}
                  value={currentFamily.waliNasab || ''}
                  onChange={(e) => handleFamilyFieldChange('waliNasab', e.target.value)}
                  placeholder="Contoh: Ayah Kandung / Kakak Laki-laki Seayah"
                  className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                />
              </div>

              {/* Row 3: Urutan dalam Keluarga - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Anak ke-
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={isHealthSelfDisabled}
                    value={currentFamily.childOrder || currentFamily.siblingOrder || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleFamilyFieldChange('childOrder', val);
                      handleFamilyFieldChange('siblingOrder', val);
                    }}
                    placeholder="Contoh: 1"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Dari Berapa Bersaudara
                  </label>
                  <input
                    type="number"
                    min={1}
                    disabled={isHealthSelfDisabled}
                    value={currentFamily.siblingCount || currentFamily.siblingsCount || 1}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      handleFamilyFieldChange('siblingCount', val);
                      handleFamilyFieldChange('siblingsCount', val);
                    }}
                    placeholder="Contoh: 3"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Konfirmasi Saling Bertukar Data (Syarat Wajib) */}
          <div className="bg-blush border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-ink shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-ink">Konfirmasi Pertukaran Informasi</h4>
                <p className="text-xs text-ink/80 mt-0.5">
                  Sebagai syarat penyelesaian Tahap 1, kedua belah pihak wajib saling bertukar dan membahas data kesehatan serta latar belakang keluarga secara transparan.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-ink cursor-pointer hover:bg-sky/20 transition-colors">
                <input
                  type="checkbox"
                  disabled={isHealthSelfDisabled}
                  checked={Boolean(taarufData?.healthExchanged)}
                  onChange={(e) => saveTaaruf({ ...taarufData, healthExchanged: e.target.checked }, true)}
                  className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                />
                <span className="text-xs font-black text-ink">
                  Riwayat kesehatan kedua belah pihak telah saling ditukar dan dibahas
                </span>
              </label>

              <label className="flex items-center gap-3 p-3 bg-white rounded-2xl border-2 border-ink cursor-pointer hover:bg-sky/20 transition-colors">
                <input
                  type="checkbox"
                  disabled={isHealthSelfDisabled}
                  checked={Boolean(taarufData?.familyExchanged)}
                  onChange={(e) => saveTaaruf({ ...taarufData, familyExchanged: e.target.checked }, true)}
                  className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                />
                <span className="text-xs font-black text-ink">
                  Data keluarga & wali nasab kedua belah pihak telah saling ditukar dan dibahas
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NADZOR & ISTIKHARAH */}
      {activeTab === 'nadzor' && (
        <div className="space-y-4">
          {/* Card: Perantara / Murabbi / Pendamping */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div className="flex items-start gap-2.5">
              <Users className="w-5 h-5 text-ink shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-black text-ink">Data Perantara / Pendamping Ta’aruf</h4>
                <p className="text-xs text-ink/70">
                  Ustadz, murabbi, atau kerabat terpercaya yang mendampingi proses ta’aruf ini.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Row 1: Nama & Peran - 2 Kolom Sejajar Simetris */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Nama Perantara <span className="text-ink font-black">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={taarufData?.mediator?.name || ''}
                    onChange={(e) =>
                      saveTaaruf({
                        ...taarufData,
                        mediator: { ...taarufData?.mediator, name: e.target.value },
                      })
                    }
                    placeholder="Contoh: Ustadz Abdullah"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink mb-1.5 truncate">
                    Hubungan / Peran <span className="text-ink font-black">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={taarufData?.mediator?.relation || ''}
                    onChange={(e) =>
                      saveTaaruf({
                        ...taarufData,
                        mediator: { ...taarufData?.mediator, relation: e.target.value },
                      })
                    }
                    placeholder="Contoh: Guru ngaji / Kakak"
                    className="w-full h-11 px-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Row 2: No WhatsApp - Full Width Simetris */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Nomor WhatsApp / Telepon <span className="text-ink font-black">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    disabled={isReadOnly}
                    value={taarufData?.mediator?.phone || ''}
                    onChange={(e) =>
                      saveTaaruf({
                        ...taarufData,
                        mediator: { ...taarufData?.mediator, phone: e.target.value },
                      })
                    }
                    placeholder="08xxxxxxxxxx"
                    className="w-full h-11 pl-10 pr-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Checklist Nadzor (Pertemuan Tatap Muka) */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            {/* Header + Toggle Box */}
            <div
              onClick={() => {
                if (isReadOnly) return;
                saveTaaruf({
                  ...taarufData,
                  nadzor: { ...taarufData?.nadzor, checked: !taarufData?.nadzor?.checked },
                }, true);
              }}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                taarufData?.nadzor?.checked
                  ? 'bg-sky/30 border-ink shadow-xs'
                  : 'bg-neutral-50/60 border-dashed border-ink/40 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-lg border-2 border-ink flex items-center justify-center shrink-0 transition-all ${
                    taarufData?.nadzor?.checked ? 'bg-ink text-white' : 'bg-white'
                  }`}
                >
                  {taarufData?.nadzor?.checked && <Check size={14} className="stroke-[3.5]" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-ink">
                    Nadzor (Melihat Calon Secara Langsung)
                  </h4>
                  <p className="text-[11px] text-ink/70">
                    Pertemuan resmi didampingi mahram / perantara
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                  taarufData?.nadzor?.checked
                    ? 'bg-sky text-ink border-ink'
                    : 'bg-white text-ink/50 border-ink/30'
                }`}
              >
                {taarufData?.nadzor?.checked ? 'Terlaksana' : 'Belum'}
              </span>
            </div>

            {/* Form Fields: Sejajar & Simetris */}
            <div className="space-y-3.5 pt-1">
              {/* Tanggal Nadzor */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Tanggal Pertemuan Nadzor
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={taarufData?.nadzor?.date || ''}
                    onChange={(e) =>
                      saveTaaruf({
                        ...taarufData,
                        nadzor: { ...taarufData?.nadzor, date: e.target.value },
                      })
                    }
                    className="w-full h-11 pl-10 pr-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan / Kesan Nadzor */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Catatan / Kesan Nadzor
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={taarufData?.nadzor?.notes || ''}
                  onChange={(e) =>
                    saveTaaruf({
                      ...taarufData,
                      nadzor: { ...taarufData?.nadzor, notes: e.target.value },
                    })
                  }
                  placeholder="Kesan pertama, poin yang dibicarakan, dan suasana pertemuan..."
                  className="w-full p-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* Card: Checklist Istikharah */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            {/* Header + Toggle Box */}
            <div
              onClick={() => {
                if (isReadOnly) return;
                saveTaaruf({
                  ...taarufData,
                  istikharah: { ...taarufData?.istikharah, checked: !taarufData?.istikharah?.checked },
                }, true);
              }}
              className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                taarufData?.istikharah?.checked
                  ? 'bg-sky/30 border-ink shadow-xs'
                  : 'bg-neutral-50/60 border-dashed border-ink/40 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-lg border-2 border-ink flex items-center justify-center shrink-0 transition-all ${
                    taarufData?.istikharah?.checked ? 'bg-ink text-white' : 'bg-white'
                  }`}
                >
                  {taarufData?.istikharah?.checked && <Check size={14} className="stroke-[3.5]" />}
                </div>
                <div>
                  <h4 className="text-xs font-black text-ink">Shalat Istikharah</h4>
                  <p className="text-[11px] text-ink/70">
                    Memohon petunjuk & ketetapan hati kepada Allah SWT
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                  taarufData?.istikharah?.checked
                    ? 'bg-sky text-ink border-ink'
                    : 'bg-white text-ink/50 border-ink/30'
                }`}
              >
                {taarufData?.istikharah?.checked ? 'Mantap' : 'Belum'}
              </span>
            </div>

            {/* Form Fields: Sejajar & Simetris */}
            <div className="space-y-3.5 pt-1">
              {/* Tanggal Istikharah */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Tanggal Shalat Istikharah
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-ink/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={taarufData?.istikharah?.date || ''}
                    onChange={(e) =>
                      saveTaaruf({
                        ...taarufData,
                        istikharah: { ...taarufData?.istikharah, date: e.target.value },
                      })
                    }
                    className="w-full h-11 pl-10 pr-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Catatan Kemantapan Hati */}
              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Catatan Kemantapan Hati
                </label>
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  value={taarufData?.istikharah?.notes || ''}
                  onChange={(e) =>
                    saveTaaruf({
                      ...taarufData,
                      istikharah: { ...taarufData?.istikharah, notes: e.target.value },
                    })
                  }
                  placeholder="Ketenangan batin, kemudahan urusan, atau doa yang dipanjatkan..."
                  className="w-full p-3 text-sm bg-white border-2 border-ink rounded-xl font-medium focus:bg-blush/20 focus:outline-none resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KEPUTUSAN */}
      {activeTab === 'keputusan' && (
        <div className="space-y-4">
          <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(240,86,124,0.06)] space-y-5">
            <div>
              <h3 className="text-base font-black text-ink">Keputusan Persetujuan Ta’aruf</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Apakah proses siap dilanjutkan ke tahap berikutnya (Tahap 2: Tanya Jawab Pranikah)? Kedua belah pihak harus sama-sama memilih <strong>“Setuju Lanjut”</strong>.
              </p>
            </div>

            {/* Pilihan Saya */}
            <div className="p-4 rounded-2xl border border-rose-100 bg-[#FFF7F9] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-white px-3 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
                Keputusan Saya
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'setuju', label: 'Setuju Lanjut' },
                  { id: 'belum', label: 'Belum Memutuskan' },
                  { id: 'tidak', label: 'Tidak Lanjut' },
                ].map((opt) => {
                  const isSelected = (taarufData?.decisions?.selfDecision || 'belum') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={false}
                      onClick={() => {
                        saveTaaruf({
                          ...taarufData,
                          decisions: {
                            ...taarufData?.decisions,
                            selfDecision: opt.id,
                          },
                        }, true);
                      }}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? opt.id === 'setuju'
                            ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
                            : opt.id === 'tidak'
                            ? 'bg-slate-700 text-white shadow-xs font-black'
                            : 'bg-amber-100 text-amber-900 border border-amber-200 font-black'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan Pertimbangan Saya</label>
                <input
                  type="text"
                  disabled={false}
                  value={taarufData?.decisions?.selfNotes || ''}
                  onChange={(e) =>
                    saveTaaruf({
                      ...taarufData,
                      decisions: {
                        ...taarufData?.decisions,
                        selfNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Alasan atau catatan untuk perantara/calon..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl font-medium focus:border-rose-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Pilihan Calon */}
            <div className="p-4 rounded-2xl border border-rose-100 bg-[#FFF7F9] space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-white px-3 py-1 rounded-full border border-rose-200 shadow-xs inline-block">
                Keputusan Calon
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'setuju', label: 'Setuju Lanjut' },
                  { id: 'belum', label: 'Belum Memutuskan' },
                  { id: 'tidak', label: 'Tidak Lanjut' },
                ].map((opt) => {
                  const isSelected = (taarufData?.decisions?.partnerDecision || 'belum') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        saveTaaruf({
                          ...taarufData,
                          decisions: {
                            ...taarufData?.decisions,
                            partnerDecision: opt.id,
                          },
                        }, true);
                      }}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-bold transition-all ${
                        isSelected
                          ? opt.id === 'setuju'
                            ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
                            : opt.id === 'tidak'
                            ? 'bg-slate-700 text-white shadow-xs font-black'
                            : 'bg-amber-100 text-amber-900 border border-amber-200 font-black'
                          : 'bg-white text-slate-600 border border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Catatan Pertimbangan Calon</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={taarufData?.decisions?.partnerNotes || ''}
                  onChange={(e) =>
                    saveTaaruf({
                      ...taarufData,
                      decisions: {
                        ...taarufData?.decisions,
                        partnerNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Catatan dari pihak calon..."
                  className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                />
              </div>
            </div>

            {/* Peringatan Persimpangan Rute (PRD 9.0 point 6) */}
            {(taarufData?.decisions?.selfDecision === 'tidak' ||
              taarufData?.decisions?.partnerDecision === 'tidak') && (
              <div className="p-4 rounded-2xl border-2 border-ink bg-white flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-ink shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-ink">
                  <strong>Persimpangan Keputusan:</strong> Salah satu pihak memilih <em>Tidak Lanjut</em>. Status rute ta’aruf berhenti dan aplikasi beralih ke mode hanya-baca. Anda tetap dapat mengunduh / mengekspor data yang sudah dimasukkan.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
