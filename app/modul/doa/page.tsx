'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookOpen, Heart, Plus, Trash2, Pin, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { DEFAULT_DOA_LIST } from '@/lib/constants/default-data';

function DoaContent() {
  const searchParams = useSearchParams();
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'doa' | 'jurnal'>('doa');
  const [data, setData] = useState<any>(null);
  const [noteSheetOpen, setNoteSheetOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form State
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState('Refleksi & Nasihat');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new-note') {
      setActiveTab('jurnal');
      setNoteSheetOpen(true);
    }

    async function loadData() {
      try {
        const res = await fetch('/api/m/extra');
        if (res.ok) setData((await res.json()).data);
      } catch (err) {
        console.error('Error loading extra:', err);
      }
    }
    loadData();
  }, [searchParams]);

  const triggerAutoSave = (updated: any) => {
    setData(updated);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/extra', {
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

  const handleAddNote = () => {
    if (!noteTitle.trim()) return;
    const newNote = {
      id: `note-${Date.now()}`,
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newNote, ...(data?.notes || [])];
    triggerAutoSave({ ...data, notes: updated });
    setNoteTitle('');
    setNoteContent('');
    setNoteSheetOpen(false);
    showToast({ message: 'Catatan jurnal disimpan', type: 'success' });
  };

  const handleDeleteNote = (id: string) => {
    const updated = (data?.notes || []).map((n: any) =>
      n.id === id ? { ...n, deletedAt: new Date().toISOString() } : n
    );
    triggerAutoSave({ ...data, notes: updated });
    showToast({ message: 'Catatan dihapus', type: 'info' });
  };

  const copyDoaText = (doa: any) => {
    const full = `${doa.title}\n${doa.arabic}\n${doa.latin}\n"${doa.translation}" (${doa.source})`;
    navigator.clipboard.writeText(full);
    setCopiedId(doa.id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast({ message: 'Teks doa disalin ke clipboard!', type: 'success' });
  };

  const activeNotes = (data?.notes || []).filter((n: any) => !n.deletedAt);

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Catatan &amp; Doa Pernikahan"
        subtitle="Kumpulan doa pilihan &amp; jurnal refleksi berdua"
        backHref="/modul"
      />

      {/* Segmented Top Tabs */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-blush/60 px-4 py-2">
        <div className="flex bg-blush/40 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('doa')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'doa' ? 'bg-rose text-white shadow-xs' : 'text-ink/70 hover:text-ink'
            }`}
          >
            Doa-Doa Pilihan (Sunnah)
          </button>
          <button
            onClick={() => setActiveTab('jurnal')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'jurnal' ? 'bg-rose text-white shadow-xs' : 'text-ink/70 hover:text-ink'
            }`}
          >
            Jurnal &amp; Catatan Berdua
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* TAB 1: DOA PILIHAN */}
        {activeTab === 'doa' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-white border border-blush shadow-soft">
              <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider mb-1">
                Doa-Doa Keberkahan Menuju Akad &amp; Rumah Tangga
              </h3>
              <p className="text-[11px] text-ink/70">
                Lafalkan bersama pasangan untuk memohon keridhaan dan penjagaan Allah Azza wa Jalla.
              </p>
            </div>

            <div className="space-y-3">
              {DEFAULT_DOA_LIST.map((doa) => (
                <div
                  key={doa.id}
                  className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-ink text-sm leading-snug">{doa.title}</h4>
                      <p className="text-[10px] text-rose font-semibold mt-0.5">{doa.source}</p>
                    </div>

                    <button
                      onClick={() => copyDoaText(doa)}
                      className="p-1.5 rounded-full bg-blush text-rose hover:bg-rose hover:text-white transition-colors shrink-0"
                      aria-label="Salin Doa"
                    >
                      {copiedId === doa.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  <p className="text-right text-lg font-serif text-ink leading-loose py-2 border-y border-blush/60">
                    {doa.arabic}
                  </p>

                  <p className="font-semibold text-rose text-xs italic leading-relaxed">
                    {doa.latin}
                  </p>

                  <p className="text-[11px] text-ink/80 leading-relaxed bg-neutral-50 p-3 rounded-2xl border border-blush/60">
                    &ldquo;{doa.translation}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: JURNAL PRIBADI */}
        {activeTab === 'jurnal' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink">Catatan Persiapan &amp; Muhasabah</span>
              <button
                onClick={() => setNoteSheetOpen(true)}
                className="px-3.5 py-1.5 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={15} />
                <span>Tulis Catatan</span>
              </button>
            </div>

            <div className="space-y-3">
              {activeNotes.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-blush text-ink/60 text-xs">
                  Belum ada catatan jurnal. Tuliskan pesan untuk pasangan atau komitmen bersama.
                </div>
              ) : (
                activeNotes.map((note: any) => (
                  <div
                    key={note.id}
                    className="p-4 rounded-3xl bg-white border border-blush shadow-soft space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold text-rose px-2 py-0.5 rounded-full bg-blush inline-block mb-1">
                          {note.category}
                        </span>
                        <h4 className="font-bold text-ink text-sm leading-snug">{note.title}</h4>
                      </div>

                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-ink/40 hover:text-rose transition-colors"
                        aria-label="Hapus"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <p className="text-ink/80 text-xs leading-relaxed whitespace-pre-line">
                      {note.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sheet: Add Note */}
      <BottomSheet isOpen={noteSheetOpen} onClose={() => setNoteSheetOpen(false)} title="Tulis Catatan Jurnal">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Judul Catatan:</label>
            <input
              type="text"
              required
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="misal: Nasihat dari Ayah saat Lamaran"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Kategori:</label>
            <select
              value={noteCategory}
              onChange={(e) => setNoteCategory(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
            >
              <option value="Refleksi & Nasihat">Refleksi &amp; Nasihat</option>
              <option value="Hasil Diskusi Keluarga">Hasil Diskusi Keluarga</option>
              <option value="Rencana Pascanikah">Rencana Pascanikah</option>
              <option value="Pesan untuk Pasangan">Pesan untuk Pasangan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Isi Catatan:</label>
            <textarea
              rows={4}
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              placeholder="Tuliskan pemikiran atau pesan berharga..."
              className="w-full p-3 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink resize-none"
            />
          </div>

          <button
            onClick={handleAddNote}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Catatan
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function DoaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-rose" /></div>}>
      <DoaContent />
    </Suspense>
  );
}
