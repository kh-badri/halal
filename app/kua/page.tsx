'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileCheck,
  Building2,
  Syringe,
  AlertCircle,
  Plus,
  Trash2,
  Upload,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProgressBar } from '@/components/ui/ProgressRing';
import { useToast } from '@/components/ui/Toast';
import { formatDateIndo, daysUntil } from '@/lib/utils/formatters';

export default function KUAPage() {
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'checklist' | 'rekomendasi' | 'kesehatan'>('checklist');
  const [docSide, setDocSide] = useState<'pria' | 'wanita'>('pria');
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // BottomSheet Modals
  const [docSheetOpen, setDocSheetOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);

  // Form States for Custom Doc
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('identitas');
  const [docCopies, setDocCopies] = useState(2);
  const [docAgency, setDocAgency] = useState('Kelurahan / Desa');
  const [docStatus, setDocStatus] = useState<any>('belum');
  const [docNotes, setDocNotes] = useState('');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [kRes, sRes] = await Promise.all([
          fetch('/api/m/kua'),
          fetch('/api/m/settings'),
        ]);
        if (kRes.ok) setData((await kRes.json()).data);
        if (sRes.ok) setSettings((await sRes.json()).data);
      } catch (err) {
        console.error('Error loading KUA data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const triggerAutoSave = (updated: any) => {
    setData(updated);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/kua', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        });
        showSaveIndicator();
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }, 800);
  };

  // --- Document CRUD Handlers ---
  const handleOpenNewDoc = () => {
    setEditingDoc(null);
    setDocTitle('');
    setDocCategory('identitas');
    setDocCopies(2);
    setDocAgency('Kelurahan / Desa');
    setDocStatus('belum');
    setDocNotes('');
    setDocSheetOpen(true);
  };

  const handleOpenEditDoc = (doc: any) => {
    setEditingDoc(doc);
    setDocTitle(doc.title);
    setDocCategory(doc.category || 'identitas');
    setDocCopies(doc.copies || 2);
    setDocAgency(doc.agency || 'Kelurahan');
    setDocStatus(doc.status || 'belum');
    setDocNotes(doc.notes || '');
    setDocSheetOpen(true);
  };

  const handleSaveDoc = () => {
    if (!docTitle.trim()) return;
    const docs = data?.documents || [];
    let updatedDocs: any[];

    if (editingDoc) {
      updatedDocs = docs.map((d: any) =>
        d.id === editingDoc.id
          ? {
              ...d,
              title: docTitle.trim(),
              category: docCategory,
              copies: docCopies,
              agency: docAgency,
              status: docStatus,
              notes: docNotes,
              updatedAt: new Date().toISOString(),
            }
          : d
      );
    } else {
      const newD = {
        id: `kua-custom-${Date.now()}`,
        title: docTitle.trim(),
        forWho: docSide,
        category: docCategory,
        copies: docCopies,
        agency: docAgency,
        status: docStatus,
        notes: docNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedDocs = [newD, ...docs];
    }

    triggerAutoSave({ ...data, documents: updatedDocs });
    setDocSheetOpen(false);
    showToast({
      message: editingDoc ? 'Dokumen diperbarui' : 'Dokumen baru ditambahkan ke checklist',
      type: 'success',
    });
  };

  const handleDeleteDoc = (id: string) => {
    const updatedDocs = (data?.documents || []).map((d: any) =>
      d.id === id ? { ...d, deletedAt: new Date().toISOString() } : d
    );
    triggerAutoSave({ ...data, documents: updatedDocs });
    showToast({
      message: 'Dokumen dihapus dari checklist',
      type: 'info',
      action: {
        label: 'Urungkan',
        onClick: () => {
          const restored = (data?.documents || []).map((d: any) => {
            if (d.id === id) {
              const { deletedAt, ...rest } = d;
              return rest;
            }
            return d;
          });
          triggerAutoSave({ ...data, documents: restored });
        },
      },
    });
  };

  const handleUploadScan = async (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast({ message: 'Mengunggah scan berkas...', type: 'info' });
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Upload gagal');

      const updatedDocs = (data?.documents || []).map((d: any) =>
        d.id === docId ? { ...d, scanFileId: resJson.fileId, status: 'selesai', updatedAt: new Date().toISOString() } : d
      );
      triggerAutoSave({ ...data, documents: updatedDocs });
      showToast({ message: 'Berkas scan berhasil disimpan!', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Gagal mengunggah berkas', type: 'error' });
    }
  };

  // Calculations for KUA Registration Deadline (H-10 working days = ~14 calendar days)
  const targetDateStr = settings?.targetDate;
  const daysUntilAkad = targetDateStr ? daysUntil(targetDateStr) : null;
  const daysUntilKuaRegistrationDeadline = daysUntilAkad !== null ? daysUntilAkad - 14 : null;

  const activeDocs = (data?.documents || []).filter((d: any) => !d.deletedAt && d.forWho === docSide);
  const doneDocsCount = activeDocs.filter((d: any) => d.status === 'selesai').length;
  const checklistProgress = activeDocs.length > 0 ? Math.round((doneDocsCount / activeDocs.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Administrasi KUA"
        subtitle="Checklist berkas N1-N6, numpang nikah, TT &amp; Bimwin"
        backHref="/rute"
      />

      {/* Segmented Top Tabs */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-blush/60 px-4 py-2">
        <div className="flex bg-blush/40 p-1 rounded-2xl gap-1">
          {[
            { key: 'checklist', label: 'Checklist Berkas', icon: FileCheck },
            { key: 'rekomendasi', label: 'Numpang Nikah', icon: Building2 },
            { key: 'kesehatan', label: 'TT & Bimwin', icon: Syringe },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active ? 'bg-rose text-white shadow-xs' : 'text-ink/70 hover:text-ink'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Official Disclaimer (Section 9.4 C) */}
        <div className="p-3.5 rounded-2xl bg-sky/30 border border-sky/50 flex items-start gap-2.5 text-xs text-ink/80">
          <Info size={16} className="text-ink shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Panduan Umum KUA:</strong> Daftar persyaratan berikut bersifat panduan umum nasional. Pastikan untuk selalu memverifikasi kelengkapan dokumen langsung ke KUA domisili Anda.
          </p>
        </div>

        {/* H-10 Deadline Reminder Card */}
        {daysUntilKuaRegistrationDeadline !== null && (
          <div className="p-4 rounded-3xl bg-white border border-blush shadow-soft flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blush text-rose flex items-center justify-center shrink-0">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose uppercase tracking-wider">Batas Pendaftaran KUA</p>
                <h4 className="font-extrabold text-ink">Minimal H-10 Hari Kerja</h4>
              </div>
            </div>

            <div className="text-right">
              {daysUntilKuaRegistrationDeadline > 0 ? (
                <span className="font-bold text-ink bg-sky/50 px-2.5 py-1 rounded-full text-xs">
                  Sisa {daysUntilKuaRegistrationDeadline} Hari
                </span>
              ) : (
                <span className="font-bold text-white bg-rose px-2.5 py-1 rounded-full text-xs animate-pulse">
                  Wajib Segera Daftar!
                </span>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 1: CHECKLIST BERKAS DOKUMEN (SECTION 9.4 A)                */}
        {/* ============================================================== */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Progress & Side Selector */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-rose uppercase tracking-wider">Kelengkapan Dokumen</p>
                  <h3 className="text-base font-extrabold text-ink mt-0.5">
                    {doneDocsCount} dari {activeDocs.length} Berkas Siap
                  </h3>
                </div>

                <button
                  onClick={handleOpenNewDoc}
                  className="px-3.5 py-2 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={15} />
                  <span>Tambah Berkas</span>
                </button>
              </div>

              <ProgressBar progress={checklistProgress} />

              <div className="flex bg-blush/40 p-1 rounded-2xl gap-1 pt-1">
                <button
                  onClick={() => setDocSide('pria')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    docSide === 'pria' ? 'bg-sky text-ink border border-sky font-extrabold shadow-xs' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  🤵 Berkas Catin Pria ({data?.documents?.filter((d: any) => !d.deletedAt && d.forWho === 'pria').length || 0})
                </button>
                <button
                  onClick={() => setDocSide('wanita')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    docSide === 'wanita' ? 'bg-rose text-white shadow-xs' : 'text-ink/70 hover:text-ink'
                  }`}
                >
                  👰 Berkas Catin Wanita ({data?.documents?.filter((d: any) => !d.deletedAt && d.forWho === 'wanita').length || 0})
                </button>
              </div>
            </div>

            {/* Documents List */}
            <div className="space-y-2.5">
              {activeDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className="p-4 rounded-3xl bg-white border border-blush shadow-soft space-y-2 hover:border-rose/30 transition-all text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h4 className="font-bold text-ink leading-snug">{doc.title}</h4>
                      <p className="text-[11px] text-ink/65 mt-0.5">
                        Instansi: {doc.agency} · {doc.copies} Lembar Fotokopi
                      </p>
                      {doc.notes && <p className="text-[10px] text-ink/75 mt-0.5">{doc.notes}</p>}
                    </div>

                    <StatusBadge
                      status={doc.status}
                      size="sm"
                      onClick={() => {
                        const next = doc.status === 'belum' ? 'diurus' : doc.status === 'diurus' ? 'selesai' : 'belum';
                        const updatedDocs = (data?.documents || []).map((d: any) =>
                          d.id === doc.id ? { ...d, status: next, updatedAt: new Date().toISOString() } : d
                        );
                        triggerAutoSave({ ...data, documents: updatedDocs });
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-blush/60">
                    <div className="flex items-center gap-2">
                      {doc.scanFileId ? (
                        <a
                          href={`/api/files/${doc.scanFileId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-sky text-ink font-bold text-[10px] rounded-full flex items-center gap-1 hover:bg-rose hover:text-white transition-all shadow-xs"
                        >
                          <FileCheck size={12} />
                          <span>Lihat Scan</span>
                        </a>
                      ) : (
                        <label className="px-2.5 py-1 bg-blush text-rose font-bold text-[10px] rounded-full flex items-center gap-1 cursor-pointer hover:bg-rose hover:text-white transition-all shadow-xs">
                          <Upload size={12} />
                          <span>Upload Scan</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="hidden"
                            onChange={(e) => handleUploadScan(e, doc.id)}
                          />
                        </label>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditDoc(doc)}
                        className="text-[11px] text-rose font-bold hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1 text-ink/40 hover:text-rose transition-colors"
                        aria-label="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SURAT REKOMENDASI NIKAH (NUMPANG NIKAH) (SECTION 9.4 B) */}
        {/* ============================================================== */}
        {activeTab === 'rekomendasi' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blush/30 border border-blush">
                <div>
                  <h4 className="font-bold text-ink">Menikah di Luar KUA Domisili?</h4>
                  <p className="text-[11px] text-ink/70">Wajib mengurus Surat Rekomendasi Nikah (Numpang Nikah)</p>
                </div>
                <input
                  type="checkbox"
                  checked={data?.recommendationLetter?.isRequired || false}
                  onChange={(e) => {
                    const updated = {
                      ...data,
                      recommendationLetter: {
                        ...data.recommendationLetter,
                        isRequired: e.target.checked,
                      },
                    };
                    triggerAutoSave(updated);
                  }}
                  className="w-5 h-5 accent-rose"
                />
              </div>

              {data?.recommendationLetter?.isRequired && (
                <div className="space-y-3 pt-2 animate-in fade-in duration-200">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-ink mb-1">KUA Asal Domisili:</label>
                      <input
                        type="text"
                        placeholder="KUA Kec. Sukajadi"
                        value={data?.recommendationLetter?.originKua || ''}
                        onChange={(e) => {
                          const updated = {
                            ...data,
                            recommendationLetter: { ...data.recommendationLetter, originKua: e.target.value },
                          };
                          triggerAutoSave(updated);
                        }}
                        className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">KUA Tujuan (Tempat Akad):</label>
                      <input
                        type="text"
                        placeholder="KUA Kec. Coblong"
                        value={data?.recommendationLetter?.destinationKua || ''}
                        onChange={(e) => {
                          const updated = {
                            ...data,
                            recommendationLetter: { ...data.recommendationLetter, destinationKua: e.target.value },
                          };
                          triggerAutoSave(updated);
                        }}
                        className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-ink mb-1">Nomor Surat Rekomendasi:</label>
                      <input
                        type="text"
                        placeholder="B-123/Kua.10/.../2026"
                        value={data?.recommendationLetter?.letterNumber || ''}
                        onChange={(e) => {
                          const updated = {
                            ...data,
                            recommendationLetter: { ...data.recommendationLetter, letterNumber: e.target.value },
                          };
                          triggerAutoSave(updated);
                        }}
                        className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-ink mb-1">Status Pengurusan:</label>
                      <select
                        value={data?.recommendationLetter?.status || 'belum'}
                        onChange={(e) => {
                          const updated = {
                            ...data,
                            recommendationLetter: { ...data.recommendationLetter, status: e.target.value },
                          };
                          triggerAutoSave(updated);
                        }}
                        className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
                      >
                        <option value="belum">Belum Diajukan</option>
                        <option value="diajukan">Sedang Diajukan</option>
                        <option value="terbit">Surat Terbit</option>
                        <option value="diserahkan">Diserahkan ke KUA Tujuan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Catatan Tambahan:</label>
                    <textarea
                      rows={2}
                      value={data?.recommendationLetter?.notes || ''}
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          recommendationLetter: { ...data.recommendationLetter, notes: e.target.value },
                        };
                        triggerAutoSave(updated);
                      }}
                      placeholder="Surat berlaku 3 bulan sejak tanggal terbit..."
                      className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink resize-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: KESEHATAN, SUNTIK TT, & BIMWIN (SECTION 9.4 C)          */}
        {/* ============================================================== */}
        {activeTab === 'kesehatan' && (
          <div className="space-y-4 text-xs">
            {/* Suntik TT Section */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider">
                Jadwal Imunisasi Tetanus Toksoid (TT) Calon Wanita
              </h3>
              <div className="space-y-2">
                {(data?.ttInjections || []).map((tt: any) => (
                  <div
                    key={tt.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 border border-blush flex items-center justify-between gap-3"
                  >
                    <div>
                      <h4 className="font-bold text-ink">{tt.stage}</h4>
                      <p className="text-[10px] text-ink/65 mt-0.5">{tt.healthFacility} · {tt.notes}</p>
                    </div>

                    <StatusBadge
                      status={tt.status}
                      size="sm"
                      onClick={() => {
                        const updated = (data?.ttInjections || []).map((t: any) =>
                          t.id === tt.id
                            ? { ...t, status: t.status === 'selesai' ? 'belum' : 'selesai', updatedAt: new Date().toISOString() }
                            : t
                        );
                        triggerAutoSave({ ...data, ttInjections: updated });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Bimwin Section */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider">
                  Bimbingan Perkawinan (Bimwin KUA)
                </h3>
                <StatusBadge status={data?.bimwin?.status || 'belum'} size="sm" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-ink mb-1">Tanggal &amp; Waktu:</label>
                  <input
                    type="date"
                    value={data?.bimwin?.date || ''}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        bimwin: { ...data.bimwin, date: e.target.value },
                      };
                      triggerAutoSave(updated);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Metode Pelaksanaan:</label>
                  <select
                    value={data?.bimwin?.method || 'tatap_muka'}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        bimwin: { ...data.bimwin, method: e.target.value },
                      };
                      triggerAutoSave(updated);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
                  >
                    <option value="tatap_muka">Tatap Muka di KUA (2 Hari)</option>
                    <option value="online">Daring (Simkah / Zoom)</option>
                    <option value="mandiri">Mandiri / Bimbingan Khusus</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Lokasi KUA / Faskes Bimwin:</label>
                <input
                  type="text"
                  value={data?.bimwin?.location || ''}
                  onChange={(e) => {
                    const updated = {
                      ...data,
                      bimwin: { ...data.bimwin, location: e.target.value },
                    };
                    triggerAutoSave(updated);
                  }}
                  placeholder="KUA Setempat..."
                  className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Status Penyelesaian:</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'belum', label: 'Belum Ikut' },
                    { key: 'terdaftar', label: 'Terdaftar' },
                    { key: 'selesai', label: 'Selesai & Lulus ✅' },
                  ].map((st) => (
                    <button
                      key={st.key}
                      onClick={() => {
                        const updated = {
                          ...data,
                          bimwin: { ...data.bimwin, status: st.key },
                        };
                        triggerAutoSave(updated);
                      }}
                      className={`py-2 text-center rounded-xl font-bold border transition-all ${
                        data?.bimwin?.status === st.key
                          ? 'bg-rose text-white border-rose shadow-xs'
                          : 'bg-white border-blush text-ink/70'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Elsimil (BKKBN) */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider">
                  Skrining Elektronik Siap Nikah (Elsimil BKKBN)
                </h3>
                <StatusBadge status={data?.elsimil?.status || 'belum'} size="sm" />
              </div>

              <div>
                <label className="block font-bold text-ink mb-1">Nomor Sertifikat Elsimil:</label>
                <input
                  type="text"
                  value={data?.elsimil?.certificateNumber || ''}
                  onChange={(e) => {
                    const updated = {
                      ...data,
                      elsimil: { ...data.elsimil, certificateNumber: e.target.value },
                    };
                    triggerAutoSave(updated);
                  }}
                  placeholder="Nomor barcode sertifikat siap nikah..."
                  className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet: Add / Edit Document */}
      <BottomSheet isOpen={docSheetOpen} onClose={() => setDocSheetOpen(false)} title="Dokumen Checklist KUA">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Nama Dokumen / Formulir:</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              placeholder="misal: Formulir N5 (Izin Orang Tua)"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Untuk Siapa:</label>
              <select
                value={docSide}
                onChange={(e) => setDocSide(e.target.value as any)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="pria">Catin Pria</option>
                <option value="wanita">Catin Wanita</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Jumlah Fotokopi:</label>
              <input
                type="number"
                min={1}
                value={docCopies}
                onChange={(e) => setDocCopies(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Instansi Pengurusan:</label>
            <input
              type="text"
              value={docAgency}
              onChange={(e) => setDocAgency(e.target.value)}
              placeholder="Kelurahan / Puskesmas / KUA"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Status Pengurusan:</label>
            <select
              value={docStatus}
              onChange={(e) => setDocStatus(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
            >
              <option value="belum">Belum Diurus</option>
              <option value="diurus">Sedang Diurus</option>
              <option value="selesai">Selesai &amp; Siap</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Catatan Tambahan:</label>
            <textarea
              rows={2}
              value={docNotes}
              onChange={(e) => setDocNotes(e.target.value)}
              placeholder="Syarat pengantar RT/RW..."
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink resize-none"
            />
          </div>

          <button
            onClick={handleSaveDoc}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Dokumen
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
