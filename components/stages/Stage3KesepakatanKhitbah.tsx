'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Users,
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Share2,
  FileText,
  Shield,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Stage3Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage3KesepakatanKhitbah({ workspaceId, isReadOnly, onDataChanged }: Stage3Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'restu' | 'acara' | 'keputusan'>('ringkasan');
  const [loading, setLoading] = useState(true);

  const [khitbahData, setKhitbahData] = useState<any>(null);
  const [taarufData, setTaarufData] = useState<any>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [kRes, tRes] = await Promise.all([
          fetch('/api/m/khitbah'),
          fetch('/api/m/taaruf'),
        ]);

        if (kRes.ok) {
          const kJson = await kRes.json();
          setKhitbahData(kJson.data || kJson);
        }
        if (tRes.ok) {
          const tJson = await tRes.json();
          setTaarufData(tJson.data || tJson);
        }
      } catch (err) {
        console.error('Error loading Stage 3 data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveKhitbah = (newKhitbah: any) => {
    setKhitbahData(newKhitbah);
    if (isReadOnly) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/khitbah', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newKhitbah),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (err) {
        console.error('Failed to save khitbah data:', err);
      }
    }, 600);
  };

  const qaCards: any[] = (taarufData?.qaCards || []).filter((c: any) => !c.deletedAt);
  const agreedCards = qaCards.filter((c) => c.status === 'sepakat');
  const pendingCards = qaCards.filter((c) => c.status !== 'sepakat');

  const handleShareToWhatsApp = () => {
    const lines = [
      '*RINGKASAN KESEPAKATAN TA’ARUF & KHITBAH*',
      `Aplikasi: Road To Halal\n`,
      `*Poin-Poin Utama yang Telah Disepakati (${agreedCards.length} Poin):*`,
      ...agreedCards.slice(0, 15).map((c, i) => `${i + 1}. ${c.question}\n   👉 _Kesepakatan: ${c.note || 'Telah disetujui bersama'}_`),
      agreedCards.length > 15 ? `\n... dan ${agreedCards.length - 15} poin lainnya.` : '',
      `\n*Rencana Acara Khitbah / Lamaran Resmi:*`,
      `Tanggal: ${khitbahData?.eventDate || 'Belum ditetapkan'}`,
      `Waktu: ${khitbahData?.eventStartTime || '09:00'} WIB`,
      `Lokasi: ${khitbahData?.locationName || 'Belum diisi'} (${khitbahData?.locationAddress || '-'})`,
      `Juru Bicara: ${khitbahData?.spokesperson || 'Keluarga'}`,
      `\nSemoga Allah memudahkan langkah menuju akad yang berkah. Aamiin.`,
    ];

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
        <p className="text-xs text-ink/70">Memuat data Kesepakatan Khitbah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/70 rounded-2xl overflow-x-auto shadow-inner no-scrollbar border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('ringkasan')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ringkasan'
              ? 'bg-azure text-white shadow-subtle font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Ringkasan Ta’aruf
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('restu')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'restu'
              ? 'bg-azure text-white shadow-subtle font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Restu Keluarga
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('acara')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'acara'
              ? 'bg-azure text-white shadow-subtle font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Kesepakatan Acara
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('keputusan')}
          className={`flex-1 min-w-[90px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'keputusan'
              ? 'bg-azure text-white shadow-subtle font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Keputusan
        </button>
      </div>

      {/* TAB 1: RINGKASAN KESEPAKATAN TA'ARUF */}
      {activeTab === 'ringkasan' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                  Hasil Tanya Jawab Pranikah (Tahap 2)
                </span>
                <h3 className="text-base font-black text-ink">Ringkasan Poin Kesepakatan</h3>
                <p className="text-xs text-ink/70 mt-0.5">
                  Tinjau kembali poin-poin yang telah disepakati sebelum melangkah ke lamaran resmi.
                </p>
              </div>

              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky border-2 border-ink rounded-xl text-xs font-black text-ink shadow-xs hover:bg-sky/80 transition-all shrink-0"
              >
                <Share2 className="w-4 h-4" /> Bagikan WA
              </button>
            </div>

            {/* List of Agreed Points */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-ink uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-ink" /> Poin Telah Disepakati ({agreedCards.length})
              </h4>
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                {agreedCards.length === 0 ? (
                  <p className="text-xs text-ink/60 italic p-3 bg-sky-50 rounded-xl">
                    Belum ada kartu berstatus Sepakat di Tahap 2.
                  </p>
                ) : (
                  agreedCards.map((c) => (
                    <div key={c.id} className="p-3 bg-sky/20 border border-ink/20 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-ink bg-white px-2 py-0.5 rounded-md border border-ink/30">
                          {c.category}
                        </span>
                        {c.principle && (
                          <span className="text-[10px] font-black text-ink bg-sky-100 px-2 py-0.5 rounded-md border border-ink flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Prinsip
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-ink">{c.question}</p>
                      {c.note ? (
                        <p className="text-xs text-ink/80 italic pl-2 border-l-2 border-ink">
                          “{c.note}”
                        </p>
                      ) : (
                        <p className="text-[11px] text-ink/60 italic pl-2 border-l-2 border-ink">
                          Disepakati sesuai harapan kedua pihak
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Review Confirmation Button (PRD 9.3 A - Syarat Selesai) */}
            <div className="pt-2 border-t border-ink/10">
              <label className="flex items-center gap-3 p-3.5 bg-sky-50 rounded-2xl border-2 border-ink cursor-pointer hover:bg-sky-100 transition-colors">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(khitbahData?.summaryReviewed)}
                  onChange={(e) => {
                    const now = new Date().toISOString();
                    saveKhitbah({
                      ...khitbahData,
                      summaryReviewed: e.target.checked,
                      summaryReviewedDate: e.target.checked ? now : '',
                    });
                  }}
                  className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                />
                <div>
                  <span className="text-xs font-black text-ink block">
                    Sudah Saya Tinjau & Tidak Ada Keberatan
                  </span>
                  <span className="text-[11px] text-ink/70">
                    Menandai bahwa ringkasan hasil kesepakatan telah dibaca dan disetujui bersama.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RESTU KELUARGA & WALI */}
      {activeTab === 'restu' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div>
              <h3 className="text-base font-black text-ink">Restu Orang Tua & Wali Nasab</h3>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                Kedua belah pihak keluarga besar wajib memberikan restu sebelum menetapkan tanggal dan pelaksanaan khitbah secara resmi.
              </p>
            </div>

            {/* Restu Pihak Saya */}
            <div className="p-4 rounded-2xl border-2 border-ink bg-sky/20 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(khitbahData?.familyConsent?.selfFamilyAgreed)}
                  onChange={(e) =>
                    saveKhitbah({
                      ...khitbahData,
                      familyConsent: {
                        ...khitbahData?.familyConsent,
                        selfFamilyAgreed: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                />
                <div>
                  <h4 className="text-sm font-black text-ink">Orang Tua / Wali Pihak Saya Memberi Restu</h4>
                  <span className="text-xs text-ink/70">Pihak keluarga telah diajak berdiskusi dan menyetujui</span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Tanggal Restu Diberikan</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={khitbahData?.familyConsent?.selfFamilyDate || ''}
                    onChange={(e) =>
                      saveKhitbah({
                        ...khitbahData,
                        familyConsent: {
                          ...khitbahData?.familyConsent,
                          selfFamilyDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Pesan & Nasihat Orang Tua</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={khitbahData?.familyConsent?.selfFamilyNotes || ''}
                    onChange={(e) =>
                      saveKhitbah({
                        ...khitbahData,
                        familyConsent: {
                          ...khitbahData?.familyConsent,
                          selfFamilyNotes: e.target.value,
                        },
                      })
                    }
                    placeholder="Wejangan orang tua pihak saya..."
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Restu Pihak Calon */}
            <div className="p-4 rounded-2xl border-2 border-ink bg-sky-50 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(khitbahData?.familyConsent?.partnerFamilyAgreed)}
                  onChange={(e) =>
                    saveKhitbah({
                      ...khitbahData,
                      familyConsent: {
                        ...khitbahData?.familyConsent,
                        partnerFamilyAgreed: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                />
                <div>
                  <h4 className="text-sm font-black text-ink">Orang Tua / Wali Pihak Calon Memberi Restu</h4>
                  <span className="text-xs text-ink/70">Pihak calon telah mendapatkan izin dan restu keluarga</span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Tanggal Restu Diberikan</label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={khitbahData?.familyConsent?.partnerFamilyDate || ''}
                    onChange={(e) =>
                      saveKhitbah({
                        ...khitbahData,
                        familyConsent: {
                          ...khitbahData?.familyConsent,
                          partnerFamilyDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Pesan & Nasihat Orang Tua Calon</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={khitbahData?.familyConsent?.partnerFamilyNotes || ''}
                    onChange={(e) =>
                      saveKhitbah({
                        ...khitbahData,
                        familyConsent: {
                          ...khitbahData?.familyConsent,
                          partnerFamilyNotes: e.target.value,
                        },
                      })
                    }
                    placeholder="Wejangan orang tua pihak calon..."
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KESEPAKATAN ACARA KHITBAH */}
      {activeTab === 'acara' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div>
              <h3 className="text-base font-black text-ink">Detail Acara Pertemuan Khitbah</h3>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                Kesepakatan teknis waktu, tempat, dan adab pertemuan lamaran antara kedua keluarga besar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Tanggal Acara Khitbah <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={khitbahData?.eventDate || ''}
                  onChange={(e) => saveKhitbah({ ...khitbahData, eventDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Jam Mulai <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="time"
                  disabled={isReadOnly}
                  value={khitbahData?.eventStartTime || '09:00'}
                  onChange={(e) => saveKhitbah({ ...khitbahData, eventStartTime: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">
                  Nama Tempat / Kediaman <span className="text-ink font-black">*</span>
                </label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={khitbahData?.locationName || ''}
                  onChange={(e) => saveKhitbah({ ...khitbahData, locationName: e.target.value })}
                  placeholder="Contoh: Rumah Kediaman Mempelai Wanita"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={khitbahData?.locationAddress || ''}
                  onChange={(e) => saveKhitbah({ ...khitbahData, locationAddress: e.target.value })}
                  placeholder="Jl. Mawar No. 12, Kel. Sukamaju..."
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-ink mb-1">Link Google Maps</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    disabled={isReadOnly}
                    value={khitbahData?.gmapsUrl || ''}
                    onChange={(e) => saveKhitbah({ ...khitbahData, gmapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/..."
                    className="flex-1 px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                  />
                  {khitbahData?.gmapsUrl && (
                    <a
                      href={khitbahData.gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-sky border-2 border-ink rounded-xl text-xs font-bold text-ink flex items-center gap-1 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Buka
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-ink mb-1">Keluarga Pria Hadir</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={khitbahData?.maleFamilyCount || 0}
                  onChange={(e) => saveKhitbah({ ...khitbahData, maleFamilyCount: Number(e.target.value) })}
                  placeholder="Estimasi orang"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Keluarga Wanita Hadir</label>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={khitbahData?.femaleFamilyCount || 0}
                  onChange={(e) => saveKhitbah({ ...khitbahData, femaleFamilyCount: Number(e.target.value) })}
                  placeholder="Estimasi orang"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Juru Bicara Keluarga</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={khitbahData?.spokesperson || ''}
                  onChange={(e) => saveKhitbah({ ...khitbahData, spokesperson: e.target.value })}
                  placeholder="Nama perwakilan juru bicara"
                  className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Adab & Aturan yang Disepakati</label>
              <textarea
                rows={2}
                disabled={isReadOnly}
                value={khitbahData?.agreedRulesNotes || ''}
                onChange={(e) => saveKhitbah({ ...khitbahData, agreedRulesNotes: e.target.value })}
                placeholder="Contoh: Busana sopan bernuansa pastel, tanpa musik keras, acara khidmat dan sederhana..."
                className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KEPUTUSAN */}
      {activeTab === 'keputusan' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-5">
            <div>
              <h3 className="text-base font-black text-ink">Keputusan Lanjut Khitbah</h3>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                Kedua belah pihak harus sama-sama memilih <strong>“Lanjut Khitbah”</strong> untuk dapat menyelesaikan tahap ini dan membuka <strong>Tahap 4 (Proses Khitbah: Seserahan, Rundown & Pelaksanaan)</strong>.
              </p>
            </div>

            {/* Pilihan Saya */}
            <div className="p-4 rounded-2xl border-2 border-ink bg-sky/20 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink bg-white px-2.5 py-0.5 rounded-full border border-ink">
                Keputusan Saya
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lanjut', label: 'Lanjut Khitbah' },
                  { id: 'belum', label: 'Belum Memutuskan' },
                  { id: 'tidak', label: 'Tidak Lanjut' },
                ].map((opt) => {
                  const isSelected = (khitbahData?.decisions?.selfDecision || 'belum') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() =>
                        saveKhitbah({
                          ...khitbahData,
                          decisions: {
                            ...khitbahData?.decisions,
                            selfDecision: opt.id,
                          },
                        })
                      }
                      className={`py-2 px-2 text-center rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? opt.id === 'lanjut'
                            ? 'bg-sky text-ink border-2 border-ink shadow-xs'
                            : opt.id === 'tidak'
                            ? 'bg-white text-ink border-2 border-ink shadow-xs'
                            : 'bg-sky-100 text-ink border-2 border-ink shadow-xs'
                          : 'bg-white text-ink/60 border border-ink/30 hover:border-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Catatan Saya</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={khitbahData?.decisions?.selfNotes || ''}
                  onChange={(e) =>
                    saveKhitbah({
                      ...khitbahData,
                      decisions: {
                        ...khitbahData?.decisions,
                        selfNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Catatan persiapan atau doa..."
                  className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Pilihan Calon */}
            <div className="p-4 rounded-2xl border-2 border-ink bg-sky-50 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-ink bg-white px-2.5 py-0.5 rounded-full border border-ink">
                Keputusan Calon
              </span>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'lanjut', label: 'Lanjut Khitbah' },
                  { id: 'belum', label: 'Belum Memutuskan' },
                  { id: 'tidak', label: 'Tidak Lanjut' },
                ].map((opt) => {
                  const isSelected = (khitbahData?.decisions?.partnerDecision || 'belum') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() =>
                        saveKhitbah({
                          ...khitbahData,
                          decisions: {
                            ...khitbahData?.decisions,
                            partnerDecision: opt.id,
                          },
                        })
                      }
                      className={`py-2 px-2 text-center rounded-xl text-xs font-black transition-all ${
                        isSelected
                          ? opt.id === 'lanjut'
                            ? 'bg-sky text-ink border-2 border-ink shadow-xs'
                            : opt.id === 'tidak'
                            ? 'bg-white text-ink border-2 border-ink shadow-xs'
                            : 'bg-sky-100 text-ink border-2 border-ink shadow-xs'
                          : 'bg-white text-ink/60 border border-ink/30 hover:border-ink'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Catatan Calon</label>
                <input
                  type="text"
                  disabled={isReadOnly}
                  value={khitbahData?.decisions?.partnerNotes || ''}
                  onChange={(e) =>
                    saveKhitbah({
                      ...khitbahData,
                      decisions: {
                        ...khitbahData?.decisions,
                        partnerNotes: e.target.value,
                      },
                    })
                  }
                  placeholder="Catatan dari calon pasangan..."
                  className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-sky-50 focus:outline-none"
                />
              </div>
            </div>

            {/* Peringatan Persimpangan Rute (PRD 9.0 point 6) */}
            {(khitbahData?.decisions?.selfDecision === 'tidak' ||
              khitbahData?.decisions?.partnerDecision === 'tidak') && (
              <div className="p-4 rounded-2xl border-2 border-ink bg-white flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-ink shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed text-ink">
                  <strong>Persimpangan Keputusan:</strong> Salah satu pihak memilih <em>Tidak Lanjut</em>. Status rute ta’aruf/khitbah berhenti dan beralih ke mode hanya-baca.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
