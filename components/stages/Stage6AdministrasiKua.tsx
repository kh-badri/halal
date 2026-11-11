'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Building,
  Syringe,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Upload,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Stage6Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage6AdministrasiKua({ workspaceId, isReadOnly, onDataChanged }: Stage6Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [kuaData, setKuaData] = useState<any>(null);
  const [activeSegment, setActiveSegment] = useState<'pria' | 'wanita' | 'numpang' | 'bimwin'>('pria');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/m/kua');
        if (res.ok) {
          const json = await res.json();
          setKuaData(json.data || json);
        }
      } catch (err) {
        console.error('Error loading Stage 6 data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveKUA = (newData: any, immediate = false) => {
    setKuaData(newData);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/kua', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (e) {
        console.error('Failed to save KUA data:', e);
      }
    }, immediate ? 20 : 300);
  };

  const documents = (kuaData?.documents || []).filter((d: any) => !d.deletedAt);
  const priaDocs = documents.filter((d: any) => d.forWho === 'pria');
  const wanitaDocs = documents.filter((d: any) => d.forWho === 'wanita');

  const currentDocs = activeSegment === 'pria' ? priaDocs : wanitaDocs;

  const handleDocStatusCycle = (docId: string, currentStatus: string) => {
    if (isReadOnly) return;
    const cycleMap: Record<string, string> = {
      belum: 'diurus',
      diurus: 'selesai',
      selesai: 'tidak_berlaku',
      tidak_berlaku: 'belum',
    };
    const nextStatus = cycleMap[currentStatus] || 'selesai';
    const newDocs = documents.map((d: any) =>
      d.id === docId ? { ...d, status: nextStatus, updatedAt: new Date().toISOString() } : d
    );
    saveKUA({ ...kuaData, documents: newDocs }, true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-azure/20 border-t-azure animate-spin" />
        <p className="text-xs font-bold text-slate-500">Memuat Administrasi KUA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer Callout Sky 100 (PRD Section 8.9 & 9.6) */}
      <div className="p-4 rounded-3xl bg-sky-100 border border-sky-200 text-azure-700 space-y-1.5 shadow-subtle">
        <div className="flex items-center gap-2">
          <Building size={18} className="text-azure-700 shrink-0" />
          <h4 className="text-xs font-extrabold uppercase tracking-wider">
            Panduan Pendaftaran Nikah KUA &amp; Simkah
          </h4>
        </div>
        <p className="text-xs leading-relaxed text-slate-700">
          Sesuai aturan Kemenag RI, seluruh berkas fisik &amp; pendaftaran ke KUA tempat akad wajib diserahkan selambatnya{' '}
          <strong className="text-navy-900 font-extrabold">10 hari kerja</strong> sebelum tanggal akad nikah berlangsung.
        </p>
      </div>

      {/* Segmented Navigation Tab */}
      <div className="flex items-center gap-1 p-1 bg-mist rounded-2xl border border-line">
        <button
          type="button"
          onClick={() => setActiveSegment('pria')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeSegment === 'pria'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Berkas Pria
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('wanita')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeSegment === 'wanita'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Berkas Wanita
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('numpang')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeSegment === 'numpang'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Numpang Nikah
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('bimwin')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeSegment === 'bimwin'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          TT &amp; Bimwin
        </button>
      </div>

      {/* 1. Berkas Checklist (Pria / Wanita) */}
      {(activeSegment === 'pria' || activeSegment === 'wanita') && (
        <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-navy-900">
                Checklist Berkas Catin {activeSegment === 'pria' ? 'Pria' : 'Wanita'}
              </h4>
              <p className="text-[11px] text-slate-500">
                Ketuk status berkas untuk mengubah (Belum → Diurus → Selesai → Tidak Berlaku)
              </p>
            </div>
          </div>

          <div className="divide-y divide-line/60">
            {currentDocs.map((doc: any) => (
              <div
                key={doc.id}
                className="py-3 flex items-center justify-between gap-3 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-navy-900 truncate">{doc.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    Asal: {doc.agency || 'Kelurahan/Desa'} · {doc.copies || 2} rangkap
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge
                    status={doc.status || 'belum'}
                    size="sm"
                    onClick={() => handleDocStatusCycle(doc.id, doc.status || 'belum')}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Registration target date */}
          <div className="pt-2 border-t border-line space-y-2">
            <label className="block text-xs font-bold text-navy-900">
              Tanggal Terdaftar / Pendaftaran Resmi ke KUA
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                disabled={isReadOnly}
                value={kuaData?.registeredDate || kuaData?.registrationTargetDate || ''}
                onChange={(e) =>
                  saveKUA({
                    ...kuaData,
                    registeredDate: e.target.value,
                    registrationTargetDate: e.target.value,
                  })
                }
                className="w-full h-11 pl-10 pr-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* 2. Surat Rekomendasi (Numpang Nikah) */}
      {activeSegment === 'numpang' && (
        <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-sky-100 border border-sky-200 text-azure-700 flex items-center justify-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-navy-900">Surat Rekomendasi Nikah</h4>
                <p className="text-[11px] text-slate-500">Form numpang nikah luar domisili KUA</p>
              </div>
            </div>

            {/* Switch isRequired */}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                disabled={isReadOnly}
                checked={Boolean(kuaData?.recommendationLetter?.isRequired)}
                onChange={(e) =>
                  saveKUA({
                    ...kuaData,
                    recommendationLetter: {
                      ...kuaData?.recommendationLetter,
                      isRequired: e.target.checked,
                    },
                  }, true)
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-azure" />
            </label>
          </div>

          {!kuaData?.recommendationLetter?.isRequired ? (
            <p className="text-xs text-slate-500 italic p-3 bg-mist rounded-2xl border border-line">
              Aktifkan tombol di atas bila salah satu catin melangsungkan pernikahan di luar wilayah KUA kecamatan domisili KTP.
            </p>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">KUA Asal (KTP)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={kuaData?.recommendationLetter?.originKua || ''}
                    onChange={(e) =>
                      saveKUA({
                        ...kuaData,
                        recommendationLetter: {
                          ...kuaData?.recommendationLetter,
                          originKua: e.target.value,
                        },
                      })
                    }
                    placeholder="misal: KUA Kec. Coblong"
                    className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">KUA Tujuan (Akad)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={kuaData?.recommendationLetter?.destinationKua || ''}
                    onChange={(e) =>
                      saveKUA({
                        ...kuaData,
                        recommendationLetter: {
                          ...kuaData?.recommendationLetter,
                          destinationKua: e.target.value,
                        },
                      })
                    }
                    placeholder="misal: KUA Kec. Sukasari"
                    className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">Status Penyerahan</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'belum', label: 'Belum Diurus' },
                    { id: 'terbit', label: 'Sudah Terbit' },
                    { id: 'diserahkan', label: 'Diserahkan ke KUA Tujuan' },
                  ].map((s) => {
                    const isSelected = (kuaData?.recommendationLetter?.status || 'belum') === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() =>
                          saveKUA({
                            ...kuaData,
                            recommendationLetter: {
                              ...kuaData?.recommendationLetter,
                              status: s.id,
                            },
                          }, true)
                        }
                        className={`py-2 px-2 text-center rounded-xl text-xs font-extrabold transition-all border ${
                          isSelected
                            ? 'bg-azure text-white border-azure shadow-subtle'
                            : 'bg-white text-slate-600 border-line hover:border-azure'
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Suntik TT & Bimwin */}
      {activeSegment === 'bimwin' && (
        <div className="space-y-4">
          {/* Suntik TT Card */}
          <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <Syringe size={18} className="text-azure-600" />
              <h4 className="text-sm font-extrabold text-navy-900">Suntik TT &amp; Cek Kesehatan Catin</h4>
            </div>

            <div className="space-y-2">
              {(kuaData?.ttInjections || []).map((tt: any, idx: number) => (
                <div
                  key={tt.id || idx}
                  className="p-3 rounded-2xl bg-mist border border-line flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-extrabold text-navy-900">{tt.stage}</p>
                    <p className="text-[11px] text-slate-500">{tt.healthFacility || 'Puskesmas'}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => {
                      const next = tt.status === 'selesai' ? 'belum' : 'selesai';
                      const updated = (kuaData?.ttInjections || []).map((item: any) =>
                        item.id === tt.id ? { ...item, status: next } : item
                      );
                      saveKUA({ ...kuaData, ttInjections: updated }, true);
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
                      tt.status === 'selesai'
                        ? 'bg-mint-100 text-mint-700 border-mint-300'
                        : 'bg-white text-slate-500 border-line'
                    }`}
                  >
                    {tt.status === 'selesai' ? '✓ Selesai' : 'Tandai Selesai'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Bimwin Card */}
          <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={18} className="text-azure-600" />
                <h4 className="text-sm font-extrabold text-navy-900">Bimbingan Perkawinan (Bimwin)</h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                  kuaData?.bimwin?.status === 'selesai'
                    ? 'bg-mint-100 text-mint-700 border-mint-300'
                    : 'bg-peach-100 text-navy-900 border-peach-300'
                }`}
              >
                {kuaData?.bimwin?.status === 'selesai' ? 'Selesai' : 'Belum'}
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">Tanggal Bimbingan</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={kuaData?.bimwin?.date || ''}
                    onChange={(e) =>
                      saveKUA({
                        ...kuaData,
                        bimwin: { ...kuaData?.bimwin, date: e.target.value },
                      })
                    }
                    className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-navy-900 mb-1">No. Sertifikat Bimwin</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={kuaData?.bimwin?.certificateNumber || ''}
                    onChange={(e) =>
                      saveKUA({
                        ...kuaData,
                        bimwin: { ...kuaData?.bimwin, certificateNumber: e.target.value },
                      })
                    }
                    placeholder="misal: BMW/2026/088"
                    className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isReadOnly}
                onClick={() => {
                  const nextStatus = kuaData?.bimwin?.status === 'selesai' ? 'belum' : 'selesai';
                  saveKUA({
                    ...kuaData,
                    bimwin: { ...kuaData?.bimwin, status: nextStatus },
                  }, true);
                }}
                className={`w-full py-2.5 rounded-2xl text-xs font-extrabold border transition-all ${
                  kuaData?.bimwin?.status === 'selesai'
                    ? 'bg-mint-300 text-mint-700 border-mint-400'
                    : 'bg-azure text-white border-azure shadow-subtle'
                }`}
              >
                {kuaData?.bimwin?.status === 'selesai' ? '✓ Bimwin Terverifikasi Selesai' : 'Tandai Bimwin Selesai'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
