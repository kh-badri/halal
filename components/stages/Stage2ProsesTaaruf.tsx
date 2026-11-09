'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles,
  Shuffle,
  Filter,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Shield,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Trash2,
  Loader2,
} from 'lucide-react';
import { QA_CATEGORIES, DEFAULT_QA_CARDS } from '@/lib/constants/qa-data';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';

interface Stage2Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage2ProsesTaaruf({ workspaceId, isReadOnly, onDataChanged }: Stage2Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [taarufData, setTaarufData] = useState<any>(null);

  // View & Filter States
  const [viewMode, setViewMode] = useState<'list' | 'single'>('list');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unagreed' | 'principle'>('all');

  // Single card mode state
  const [singleCardIndex, setSingleCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Active expanded card in list view
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Modals
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newCategory, setNewCategory] = useState<string>(QA_CATEGORIES[0]);
  const [newPrinciple, setNewPrinciple] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/m/taaruf');
        if (res.ok) {
          const json = await res.json();
          setTaarufData(json.data);
        }
      } catch (err) {
        console.error('Error loading taaruf Q&A:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveTaaruf = (newTaaruf: any) => {
    setTaarufData(newTaaruf);
    if (isReadOnly) return;

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
      } catch (err) {
        console.error('Failed to save taaruf Q&A:', err);
      }
    }, 600);
  };

  const cards: any[] = useMemo(() => {
    return (taarufData?.qaCards || []).filter((c: any) => !c.deletedAt);
  }, [taarufData]);

  // Statistics
  const totalCount = cards.length;
  const agreedCount = cards.filter((c) => c.status === 'sepakat').length;
  const discussedCount = cards.filter((c) => c.status === 'dibahas').length;
  const rediscussCount = cards.filter((c) => c.status === 'ulang').length;
  const unhandledCount = cards.filter((c) => c.status === 'belum').length;
  const principleCards = cards.filter((c) => c.principle);
  const principleAgreedCount = principleCards.filter((c) => c.status === 'sepakat').length;

  const progressPercent = totalCount > 0 ? Math.round((agreedCount / totalCount) * 100) : 0;

  // Filtered Cards
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      if (categoryFilter !== 'Semua' && c.category !== categoryFilter) return false;
      if (statusFilter === 'unagreed' && c.status === 'sepakat') return false;
      if (statusFilter === 'principle' && !c.principle) return false;
      return true;
    });
  }, [cards, categoryFilter, statusFilter]);

  const updateCard = (cardId: string, patch: any) => {
    if (isReadOnly) return;
    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === cardId) {
        return { ...c, ...patch, updatedAt: new Date().toISOString() };
      }
      return c;
    });
    saveTaaruf({ ...taarufData, qaCards: updatedCards });
  };

  const deleteCard = (cardId: string) => {
    if (isReadOnly) return;
    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === cardId) {
        return { ...c, deletedAt: new Date().toISOString() };
      }
      return c;
    });
    saveTaaruf({ ...taarufData, qaCards: updatedCards });
    showToast('Kartu dihapus', 'info');
  };

  const handleAddCustomCard = () => {
    if (isReadOnly || !newQuestion.trim()) return;
    const newId = `custom-qa-${Date.now()}`;
    const now = new Date().toISOString();
    const newCard = {
      id: newId,
      createdAt: now,
      updatedAt: now,
      category: newCategory,
      questionNumber: totalCount + 1,
      question: newQuestion.trim(),
      custom: true,
      answerSelf: '',
      answerPartner: '',
      note: '',
      principle: newPrinciple,
      status: 'belum',
    };

    const updatedCards = [...(taarufData?.qaCards || []), newCard];
    saveTaaruf({ ...taarufData, qaCards: updatedCards });
    setNewQuestion('');
    setNewPrinciple(false);
    setIsAddCardOpen(false);
    showToast('Kartu pertanyaan kustom berhasil ditambahkan', 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
        <p className="text-xs text-ink/70">Memuat 57 Kartu Tanya Jawab Pranikah...</p>
      </div>
    );
  }

  const currentSingleCard = filteredCards[singleCardIndex] || filteredCards[0];

  return (
    <div className="space-y-4">
      {/* Progress & Summary Bar */}
      <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(240,86,124,0.06)] space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
              Progres Tanya Jawab Pranikah
            </span>
            <h3 className="text-lg font-black text-ink">
              {agreedCount} dari {totalCount} Sepakat ({progressPercent}%)
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full text-xs font-bold text-rose-600 transition-all shadow-xs"
          >
            <FileText className="w-4 h-4" /> Ringkasan
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-rose-100/50 h-2.5 rounded-full overflow-hidden p-0.5 border border-rose-100">
          <div
            className="h-full bg-gradient-to-r from-[#FF7597] to-[#F0567C] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stats Pills */}
        <div className="grid grid-cols-4 gap-2 pt-1 text-center">
          <div className="p-2 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
            <span className="text-xs font-black text-emerald-800 block">{agreedCount}</span>
            <span className="text-[10px] font-bold text-emerald-600">Sepakat</span>
          </div>
          <div className="p-2 bg-rose-50/80 border border-rose-200/80 rounded-2xl">
            <span className="text-xs font-black text-rose-700 block">{discussedCount}</span>
            <span className="text-[10px] font-bold text-rose-500">Dibahas</span>
          </div>
          <div className="p-2 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
            <span className="text-xs font-black text-amber-800 block">{rediscussCount}</span>
            <span className="text-[10px] font-bold text-amber-600">Bahas Ulang</span>
          </div>
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-xs font-black text-slate-700 block">{unhandledCount}</span>
            <span className="text-[10px] font-bold text-slate-400">Belum</span>
          </div>
        </div>

        {principleAgreedCount < principleCards.length && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 font-bold">
            <Shield className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              {principleCards.length - principleAgreedCount} kartu berlabel <strong>Prinsip (Dealbreaker)</strong> belum berstatus Sepakat.
            </span>
          </div>
        )}
      </div>

      {/* Control Bar: Mode, Filter, and Add Custom Card */}
      <div className="bg-white border border-rose-100 rounded-2xl p-2.5 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* View Mode Toggle: Daftar vs Acak (Swipe) */}
          <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-100 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Daftar
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('single');
                setIsFlipped(false);
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'single'
                  ? 'bg-white text-rose-600 shadow-xs border border-rose-100 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" /> Mode Acak
            </button>
          </div>

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => setIsAddCardOpen(true)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white rounded-full text-xs font-bold shadow-rose-sm active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          )}
        </div>

        {/* Filter Row */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setSingleCardIndex(0);
            }}
            className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none shrink-0"
          >
            <option value="Semua">Semua Kategori (9)</option>
            {QA_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setStatusFilter((prev) => (prev === 'all' ? 'unagreed' : 'all'));
              setSingleCardIndex(0);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-ink shrink-0 transition-all ${
              statusFilter === 'unagreed'
                ? 'bg-blush text-ink shadow-xs'
                : 'bg-white text-ink/70'
            }`}
          >
            Belum Sepakat ({cards.filter((c) => c.status !== 'sepakat').length})
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter((prev) => (prev === 'principle' ? 'all' : 'principle'));
              setSingleCardIndex(0);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-ink shrink-0 transition-all ${
              statusFilter === 'principle'
                ? 'bg-blush text-ink shadow-xs'
                : 'bg-white text-ink/70'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Prinsip ({principleCards.length})
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: SINGLE CARD / FLIP CARD */}
      {viewMode === 'single' && currentSingleCard && (
        <div className="space-y-4">
          <div className="relative bg-white border border-rose-100 rounded-3xl p-6 shadow-[0_10px_30px_-5px_rgba(240,86,124,0.12)] min-h-[360px] flex flex-col justify-between transition-all">
            {/* Top Bar of Card */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                  {currentSingleCard.category}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-2">
                  Q{currentSingleCard.questionNumber || singleCardIndex + 1}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {currentSingleCard.principle && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-rose-500 px-2.5 py-0.5 rounded-full shadow-xs">
                    <Shield className="w-3 h-3" /> Prinsip
                  </span>
                )}
                <span
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                    currentSingleCard.status === 'sepakat'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : currentSingleCard.status === 'dibahas'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : currentSingleCard.status === 'ulang'
                      ? 'bg-amber-100 text-amber-900 border border-amber-200'
                      : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}
                >
                  {currentSingleCard.status === 'sepakat'
                    ? 'Sepakat'
                    : currentSingleCard.status === 'dibahas'
                    ? 'Dibahas'
                    : currentSingleCard.status === 'ulang'
                    ? 'Perlu Bahas Lagi'
                    : 'Belum Dibahas'}
                </span>
              </div>
            </div>

            {/* Front side: The Question */}
            {!isFlipped ? (
              <div className="my-auto py-8 text-center space-y-4">
                <h3 className="text-xl font-black text-ink leading-relaxed px-2 font-sans">
                  “{currentSingleCard.question}”
                </h3>
                <p className="text-xs text-slate-400">
                  Ketuk tombol di bawah untuk melihat dan mengisi jawaban Saya &amp; Calon
                </p>
              </div>
            ) : (
              /* Back side: The Answers & Discussion */
              <div className="my-4 space-y-3">
                <div className="p-3 bg-rose-50/50 rounded-2xl border border-rose-100 space-y-1">
                  <label className="block text-[11px] font-bold text-rose-600">Jawaban Saya</label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    value={currentSingleCard.answerSelf || ''}
                    onChange={(e) => updateCard(currentSingleCard.id, { answerSelf: e.target.value })}
                    placeholder="Pandangan dan harapan pribadi Anda..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-sky-50/50 rounded-2xl border border-sky-100 space-y-1">
                  <label className="block text-[11px] font-bold text-sky-800">Jawaban Calon Pasangan</label>
                  <textarea
                    rows={2}
                    disabled={isReadOnly}
                    value={currentSingleCard.answerPartner || ''}
                    onChange={(e) => updateCard(currentSingleCard.id, { answerPartner: e.target.value })}
                    placeholder="Pandangan dan tanggapan dari calon..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">Catatan Kesepakatan / Poin Diskusi</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={currentSingleCard.note || ''}
                    onChange={(e) => updateCard(currentSingleCard.id, { note: e.target.value })}
                    placeholder="Contoh: Sepakat istri tetap bekerja 2 tahun pertama..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
                  />
                </div>

                {/* Status selector */}
                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700">Status Pembahasan:</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-rose-600">
                      <input
                        type="checkbox"
                        disabled={isReadOnly}
                        checked={Boolean(currentSingleCard.principle)}
                        onChange={(e) => updateCard(currentSingleCard.id, { principle: e.target.checked })}
                        className="w-4 h-4 rounded border-rose-300 text-rose-500 accent-rose-500"
                      />
                      <span>Tandai sebagai Prinsip (Dealbreaker)</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'belum', label: 'Belum' },
                      { id: 'dibahas', label: 'Dibahas' },
                      { id: 'sepakat', label: 'Sepakat' },
                      { id: 'ulang', label: 'Bahas Ulang' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => updateCard(currentSingleCard.id, { status: st.id })}
                        className={`py-2 rounded-xl text-xs font-black transition-all ${
                          currentSingleCard.status === st.id
                            ? 'bg-ink text-white shadow-xs'
                            : 'bg-white text-ink border border-ink/30 hover:border-ink'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Controls of Single Card */}
            <div className="flex items-center justify-between pt-4 border-t border-rose-100">
              <button
                type="button"
                onClick={() => {
                  setSingleCardIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50/70 border border-rose-200 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-100/80 active:scale-95 transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>

              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="px-4 py-2 bg-gradient-to-r from-[#FF6584] to-[#F0567C] hover:from-[#F0567C] hover:to-[#E03E67] text-white rounded-full text-xs font-bold shadow-rose-sm active:scale-95 transition-all"
              >
                {isFlipped ? 'Lihat Pertanyaan' : 'Buka Jawaban & Status'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setSingleCardIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
                  setIsFlipped(false);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50/70 border border-rose-200 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-100/80 active:scale-95 transition-all"
              >
                Selanjutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {filteredCards.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-ink/40 rounded-3xl p-8 text-center space-y-2">
              <p className="text-sm font-bold text-ink">Tidak ada kartu yang sesuai filter.</p>
              <button
                type="button"
                onClick={() => {
                  setCategoryFilter('Semua');
                  setStatusFilter('all');
                }}
                className="text-xs font-bold text-ink underline"
              >
                Reset filter
              </button>
            </div>
          ) : (
            filteredCards.map((card, idx) => {
              const isExpanded = expandedCardId === card.id;

              return (
                <div
                  key={card.id}
                  className={`bg-white border-2 border-ink rounded-3xl p-4 shadow-subtle transition-all ${
                    card.status === 'sepakat'
                      ? 'border-l-8 border-l-sky'
                      : card.status === 'dibahas'
                      ? 'border-l-8 border-l-blush'
                      : card.status === 'ulang'
                      ? 'border-l-8 border-l-ink'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedCardId(isExpanded ? null : card.id)}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase text-ink/60 bg-blush/40 px-2 py-0.5 rounded-full border border-ink/20">
                          {card.category}
                        </span>
                        <span className="text-xs font-bold text-ink/50">Q{card.questionNumber || idx + 1}</span>
                        {card.principle && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-ink bg-blush px-2 py-0.5 rounded-full border border-ink">
                            <Shield className="w-3 h-3" /> Prinsip
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-black text-ink leading-snug">{card.question}</h4>

                      {card.note && !isExpanded && (
                        <p className="text-xs text-ink/70 mt-1 italic line-clamp-1">
                          Catatan: {card.note}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-ink ${
                          card.status === 'sepakat'
                            ? 'bg-sky text-ink'
                            : card.status === 'dibahas'
                            ? 'bg-blush text-ink'
                            : card.status === 'ulang'
                            ? 'bg-white text-ink border-2'
                            : 'bg-white text-ink/40 border-dashed'
                        }`}
                      >
                        {card.status === 'sepakat'
                          ? 'Sepakat'
                          : card.status === 'dibahas'
                          ? 'Dibahas'
                          : card.status === 'ulang'
                          ? 'Bahas Ulang'
                          : 'Belum'}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                        className="text-[11px] font-bold text-ink underline"
                      >
                        {isExpanded ? 'Tutup' : 'Buka'}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Edit Form */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-ink/10 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-sky/20 rounded-2xl border border-ink/30 space-y-1">
                          <label className="block text-[11px] font-black text-ink">Jawaban Saya</label>
                          <textarea
                            rows={2}
                            disabled={isReadOnly}
                            value={card.answerSelf || ''}
                            onChange={(e) => updateCard(card.id, { answerSelf: e.target.value })}
                            placeholder="Jawaban dan sudut pandang saya..."
                            className="w-full px-3 py-2 text-xs bg-white border border-ink/30 rounded-xl focus:border-ink focus:outline-none"
                          />
                        </div>

                        <div className="p-3 bg-blush/20 rounded-2xl border border-ink/30 space-y-1">
                          <label className="block text-[11px] font-black text-ink">Jawaban Calon</label>
                          <textarea
                            rows={2}
                            disabled={isReadOnly}
                            value={card.answerPartner || ''}
                            onChange={(e) => updateCard(card.id, { answerPartner: e.target.value })}
                            placeholder="Jawaban dan sudut pandang calon..."
                            className="w-full px-3 py-2 text-xs bg-white border border-ink/30 rounded-xl focus:border-ink focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink mb-1">Catatan Kesepakatan</label>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          value={card.note || ''}
                          onChange={(e) => updateCard(card.id, { note: e.target.value })}
                          placeholder="Poin penting yang disepakati..."
                          className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-ink self-start sm:self-auto">
                          <input
                            type="checkbox"
                            disabled={isReadOnly}
                            checked={Boolean(card.principle)}
                            onChange={(e) => updateCard(card.id, { principle: e.target.checked })}
                            className="w-4 h-4 rounded border border-ink text-ink accent-ink"
                          />
                          <span>Prinsip (Dealbreaker)</span>
                        </label>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                          {[
                            { id: 'belum', label: 'Belum' },
                            { id: 'dibahas', label: 'Dibahas' },
                            { id: 'sepakat', label: 'Sepakat' },
                            { id: 'ulang', label: 'Bahas Ulang' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => updateCard(card.id, { status: st.id })}
                              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                card.status === st.id
                                  ? 'bg-ink text-white shadow-xs'
                                  : 'bg-white text-ink border border-ink/30 hover:border-ink'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {card.custom && !isReadOnly && (
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => deleteCard(card.id)}
                            className="flex items-center gap-1 text-xs font-bold text-ink/70 hover:text-ink underline"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus kartu kustom ini
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* BOTTOM SHEET: RINGKASAN KESEPAKATAN */}
      <BottomSheet
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Ringkasan Kesepakatan Ta’aruf"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-ink/80 leading-relaxed">
            Ringkasan ini merangkum poin-poin yang sudah Anda berdua sepakati dan yang masih perlu dibahas. Ringkasan ini otomatis tersambung ke <strong>Tahap 3 (Kesepakatan Khitbah)</strong>.
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-ink tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-ink" /> Poin Sepakat ({agreedCount})
            </h4>
            {agreedCount === 0 ? (
              <p className="text-xs text-ink/60 italic pl-5">Belum ada pertanyaan yang berstatus Sepakat.</p>
            ) : (
              <div className="space-y-2">
                {cards
                  .filter((c) => c.status === 'sepakat')
                  .map((c) => (
                    <div key={c.id} className="p-3 bg-sky/20 border border-ink/20 rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-ink bg-white px-2 py-0.5 rounded-md border border-ink/30">
                          {c.category}
                        </span>
                        {c.principle && (
                          <span className="text-[10px] font-black text-ink bg-blush px-1.5 py-0.5 rounded-md border border-ink">
                            Prinsip
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-ink">{c.question}</p>
                      {c.note && (
                        <p className="text-xs text-ink/80 pl-2 border-l-2 border-ink">
                          Kesepakatan: {c.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase text-ink tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-ink" /> Perlu Dibahas Lagi ({rediscussCount})
            </h4>
            {rediscussCount === 0 ? (
              <p className="text-xs text-ink/60 italic pl-5">Tidak ada poin yang perlu dibahas ulang.</p>
            ) : (
              <div className="space-y-2">
                {cards
                  .filter((c) => c.status === 'ulang')
                  .map((c) => (
                    <div key={c.id} className="p-3 bg-white border border-ink rounded-2xl space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-ink bg-blush/40 px-2 py-0.5 rounded-md border border-ink/30">
                          {c.category}
                        </span>
                      </div>
                      <p className="text-xs font-black text-ink">{c.question}</p>
                      {c.note && (
                        <p className="text-xs text-ink/70 pl-2 border-l-2 border-ink">
                          Alasan: {c.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: TAMBAH KARTU KUSTOM */}
      <BottomSheet
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        title="Tambah Kartu Pertanyaan Kustom"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">Kategori Pertanyaan</label>
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
            >
              {QA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Teks Pertanyaan</label>
            <textarea
              rows={3}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Tuliskan pertanyaan penting yang ingin Anda diskusikan..."
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-blush/30 rounded-2xl border border-ink/30">
            <input
              type="checkbox"
              checked={newPrinciple}
              onChange={(e) => setNewPrinciple(e.target.checked)}
              className="w-4 h-4 rounded border border-ink text-ink accent-ink"
            />
            <span className="text-xs font-black text-ink">
              Tandai sebagai Prinsip (Dealbreaker / Tidak dapat ditawar)
            </span>
          </label>

          <button
            type="button"
            onClick={handleAddCustomCard}
            disabled={!newQuestion.trim()}
            className="w-full py-3 bg-sky text-ink border-2 border-ink rounded-full text-sm font-black shadow-subtle hover:bg-sky/80 disabled:opacity-40 transition-all"
          >
            Simpan Kartu Kustom
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
