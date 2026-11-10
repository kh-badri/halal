'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Shield,
  Trash2,
  Loader2,
  HelpCircle,
  Edit3,
  Lightbulb,
  Check,
  FileText,
  User,
  Users,
  ChevronRight,
  Search,
} from 'lucide-react';
import { QA_CATEGORIES, DEFAULT_QA_CARDS } from '@/lib/constants/qa-data';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';

interface Stage2Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

interface QuestionItem {
  id: string;
  asker: 'pria' | 'wanita';
  question: string;
  answerPria: string;
  answerWanita: string;
  note: string;
  status: 'belum' | 'dibahas' | 'sepakat' | 'ulang';
  principle: boolean;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
  custom?: boolean;
}

export function Stage2ProsesTaaruf({ workspaceId, isReadOnly, onDataChanged }: Stage2Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [taarufData, setTaarufData] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [userRole, setUserRole] = useState<'pria' | 'wanita'>('pria');

  // Navigation tab: 'pria' = Pertanyaan Catin Pria, 'wanita' = Pertanyaan Catin Perempuan, 'all' = Semua
  const [activeTab, setActiveTab] = useState<'pria' | 'wanita' | 'all'>('pria');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unagreed' | 'principle'>('all');

  // Modals & Sheets
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isIdeaSheetOpen, setIsIdeaSheetOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingQuestionText, setEditingQuestionText] = useState('');

  // Form tambah pertanyaan
  const [formAsker, setFormAsker] = useState<'pria' | 'wanita'>('pria');
  const [formQuestion, setFormQuestion] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Visi, Agama & Ibadah');
  const [formPrinciple, setFormPrinciple] = useState(false);
  const [formAnswerSelf, setFormAnswerSelf] = useState('');

  // Search in Idea Sheet
  const [ideaSearch, setIdeaSearch] = useState('');
  const [ideaCategory, setIdeaCategory] = useState<string>('Semua');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [taarufRes, profileRes, authRes] = await Promise.all([
          fetch('/api/m/taaruf'),
          fetch('/api/m/profile'),
          fetch('/api/auth/me'),
        ]);

        if (taarufRes.ok) {
          const tJson = await taarufRes.json();
          setTaarufData(tJson.data || tJson);
        }
        if (profileRes.ok) {
          const pJson = await profileRes.json();
          setProfileData(pJson.data || pJson);
        }
        if (authRes.ok) {
          const aJson = await authRes.json();
          if (aJson.user?.role) {
            const role = aJson.user.role === 'wanita' ? 'wanita' : 'pria';
            setUserRole(role);
            setActiveTab(role);
            setFormAsker(role);
          }
        }
      } catch (err) {
        console.error('Error loading taaruf Q&A:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Nama Catin Pria & Perempuan
  const priaName = useMemo(() => {
    if (userRole === 'pria') {
      return profileData?.self?.fullName || profileData?.self?.nickname || 'Catin Pria';
    }
    return profileData?.partner?.fullName || profileData?.partner?.nickname || 'Catin Pria';
  }, [userRole, profileData]);

  const wanitaName = useMemo(() => {
    if (userRole === 'wanita') {
      return profileData?.self?.fullName || profileData?.self?.nickname || 'Catin Perempuan';
    }
    return profileData?.partner?.fullName || profileData?.partner?.nickname || 'Catin Perempuan';
  }, [userRole, profileData]);

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

  // Filter out legacy unedited 57-card template items so the page remains clean and focused
  const questions: QuestionItem[] = useMemo(() => {
    const rawCards = taarufData?.qaCards || [];
    return rawCards
      .filter((c: any) => {
        if (c.deletedAt) return false;
        // Check if it's an untouched legacy template card
        const isLegacyTemplate = !c.custom && typeof c.id === 'string' && /^qa-\d+$/.test(c.id);
        const hasBeenEdited =
          Boolean(c.answerPria?.trim()) ||
          Boolean(c.answerWanita?.trim()) ||
          Boolean(c.answerSelf?.trim()) ||
          Boolean(c.answerPartner?.trim()) ||
          Boolean(c.note?.trim()) ||
          c.status !== 'belum';

        if (isLegacyTemplate && !hasBeenEdited) {
          return false;
        }
        return true;
      })
      .map((c: any) => {
        // Map answer fields
        const answerPria = c.answerPria ?? (userRole === 'pria' ? c.answerSelf : c.answerPartner) ?? '';
        const answerWanita = c.answerWanita ?? (userRole === 'wanita' ? c.answerSelf : c.answerPartner) ?? '';
        const asker = c.asker || (c.id?.includes('wanita') ? 'wanita' : 'pria');

        return {
          ...c,
          asker,
          answerPria,
          answerWanita,
          status: c.status || 'belum',
          principle: Boolean(c.principle),
          note: c.note || '',
        };
      });
  }, [taarufData, userRole]);

  // Statistics
  const totalCount = questions.length;
  const agreedCount = questions.filter((q) => q.status === 'sepakat').length;
  const discussedCount = questions.filter((q) => q.status === 'dibahas').length;
  const rediscussCount = questions.filter((q) => q.status === 'ulang').length;
  const unhandledCount = questions.filter((q) => q.status === 'belum').length;
  const principleQuestions = questions.filter((q) => q.principle);
  const principleAgreedCount = principleQuestions.filter((q) => q.status === 'sepakat').length;

  const progressPercent = totalCount > 0 ? Math.round((agreedCount / totalCount) * 100) : 0;

  // Questions count by asker
  const priaQuestions = useMemo(() => questions.filter((q) => q.asker === 'pria'), [questions]);
  const wanitaQuestions = useMemo(() => questions.filter((q) => q.asker === 'wanita'), [questions]);

  // Filtered by active tab and status
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (activeTab === 'pria' && q.asker !== 'pria') return false;
      if (activeTab === 'wanita' && q.asker !== 'wanita') return false;
      if (statusFilter === 'unagreed' && q.status === 'sepakat') return false;
      if (statusFilter === 'principle' && !q.principle) return false;
      return true;
    });
  }, [questions, activeTab, statusFilter]);

  const updateQuestion = (questionId: string, patch: Partial<QuestionItem>) => {
    if (isReadOnly) return;
    const now = new Date().toISOString();
    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === questionId) {
        const merged = { ...c, ...patch, updatedAt: now };
        // Sync backward-compatible fields
        if ('answerPria' in patch || 'answerWanita' in patch) {
          merged.answerSelf = userRole === 'wanita' ? merged.answerWanita : merged.answerPria;
          merged.answerPartner = userRole === 'wanita' ? merged.answerPria : merged.answerWanita;
        }
        return merged;
      }
      return c;
    });
    saveTaaruf({ ...taarufData, qaCards: updatedCards });
  };

  const deleteQuestion = (questionId: string) => {
    if (isReadOnly) return;
    const updatedCards = (taarufData?.qaCards || []).map((c: any) => {
      if (c.id === questionId) {
        return { ...c, deletedAt: new Date().toISOString() };
      }
      return c;
    });
    saveTaaruf({ ...taarufData, qaCards: updatedCards });
    showToast('Pertanyaan berhasil dihapus', 'info');
  };

  const handleOpenAddModal = (targetAsker?: 'pria' | 'wanita') => {
    setFormAsker(targetAsker || (activeTab === 'wanita' ? 'wanita' : 'pria'));
    setFormQuestion('');
    setFormAnswerSelf('');
    setFormPrinciple(false);
    setIsAddOpen(true);
  };

  const handleSaveNewQuestion = () => {
    if (isReadOnly || !formQuestion.trim()) return;
    const now = new Date().toISOString();
    const newId = `qa_${formAsker}_${Date.now()}`;

    const newCard: any = {
      id: newId,
      createdAt: now,
      updatedAt: now,
      category: formCategory || 'Umum',
      asker: formAsker,
      question: formQuestion.trim(),
      custom: true,
      answerPria: formAsker === 'pria' ? formAnswerSelf.trim() : '',
      answerWanita: formAsker === 'wanita' ? formAnswerSelf.trim() : '',
      answerSelf: userRole === formAsker ? formAnswerSelf.trim() : '',
      answerPartner: '',
      note: '',
      principle: formPrinciple,
      status: 'belum',
    };

    const existingCards = taarufData?.qaCards || [];
    saveTaaruf({ ...taarufData, qaCards: [...existingCards, newCard] });

    setFormQuestion('');
    setFormAnswerSelf('');
    setFormPrinciple(false);
    setIsAddOpen(false);
    showToast(`Pertanyaan untuk ${formAsker === 'pria' ? 'Catin Pria' : 'Catin Perempuan'} berhasil ditambahkan`, 'success');
  };

  const handleAddFromIdea = (card: typeof DEFAULT_QA_CARDS[0], targetAsker: 'pria' | 'wanita') => {
    if (isReadOnly) return;
    const now = new Date().toISOString();
    const newId = `qa_${targetAsker}_idea_${Date.now()}`;

    const newCard: any = {
      id: newId,
      createdAt: now,
      updatedAt: now,
      category: card.category,
      asker: targetAsker,
      question: card.question,
      custom: true,
      answerPria: '',
      answerWanita: '',
      answerSelf: '',
      answerPartner: '',
      note: '',
      principle: Boolean(card.principle),
      status: 'belum',
    };

    const existingCards = taarufData?.qaCards || [];
    saveTaaruf({ ...taarufData, qaCards: [...existingCards, newCard] });
    showToast(`Pertanyaan ditambahkan ke kolom ${targetAsker === 'pria' ? 'Catin Pria' : 'Catin Perempuan'}`, 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        <p className="text-xs font-bold text-slate-600">Memuat Tanya Jawab Pranikah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress & Summary Bar */}
      <div className="bg-white border border-rose-100 rounded-3xl p-5 shadow-[0_4px_20px_rgba(240,86,124,0.06)] space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block">
              Progres Tanya Jawab Pranikah
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {totalCount === 0 ? 'Belum Ada Pertanyaan' : `${agreedCount} dari ${totalCount} Sepakat (${progressPercent}%)`}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full text-xs font-bold text-rose-600 transition-all shadow-xs shrink-0"
          >
            <FileText className="w-3.5 h-3.5" /> Ringkasan
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
        <div className="grid grid-cols-4 gap-2 pt-0.5 text-center">
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

        {principleQuestions.length > 0 && principleAgreedCount < principleQuestions.length && (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-800 font-bold">
            <Shield className="w-4 h-4 shrink-0 text-rose-600" />
            <span>
              {principleQuestions.length - principleAgreedCount} pertanyaan berlabel <strong>Prinsip (Dealbreaker)</strong> belum berstatus Sepakat.
            </span>
          </div>
        )}
      </div>

      {/* Main Tab Switcher: Pria vs Wanita vs Semua */}
      <div className="bg-white border border-rose-100 rounded-2xl p-2 shadow-xs space-y-2">
        <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pria')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pria'
                ? 'bg-white text-blue-700 shadow-xs border border-blue-100 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👨</span>
            <span className="truncate">Catin Pria</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'pria' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
              {priaQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('wanita')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'wanita'
                ? 'bg-white text-rose-700 shadow-xs border border-rose-100 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👩</span>
            <span className="truncate">Catin Wanita</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'wanita' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
              {wanitaQuestions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📋</span>
            <span>Semua</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'all' ? 'bg-slate-200 text-slate-800' : 'bg-slate-200 text-slate-600'}`}>
              {totalCount}
            </span>
          </button>
        </div>

        {/* Action & Filter Bar */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {/* Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === 'all' ? 'unagreed' : 'all'))}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all ${
                statusFilter === 'unagreed'
                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              Belum Sepakat ({questions.filter((q) => q.status !== 'sepakat').length})
            </button>

            {principleQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === 'principle' ? 'all' : 'principle'))}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold border shrink-0 transition-all ${
                  statusFilter === 'principle'
                    ? 'bg-rose-50 border-rose-300 text-rose-700 font-black'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Shield className="w-3 h-3" /> Prinsip ({principleQuestions.length})
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsIdeaSheetOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-full text-xs font-bold transition-all shadow-xs"
              title="Lihat ide pertanyaan pranikah"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Ide Topik</span>
            </button>

            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleOpenAddModal()}
                className="flex items-center gap-1 px-3.5 py-1.5 bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white rounded-full text-xs font-bold shadow-rose-sm active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info Context Bar */}
      <div className="px-1 text-xs text-slate-500 flex items-center justify-between">
        <p>
          {activeTab === 'pria' && (
            <span>Menampilkan pertanyaan yang diajukan oleh <strong>👨 {priaName}</strong></span>
          )}
          {activeTab === 'wanita' && (
            <span>Menampilkan pertanyaan yang diajukan oleh <strong>👩 {wanitaName}</strong></span>
          )}
          {activeTab === 'all' && (
            <span>Menampilkan semua pertanyaan dari kedua calon pengantin</span>
          )}
        </p>
      </div>

      {/* List of Questions with Two Dedicated Columns (Mobile Responsive) */}
      {visibleQuestions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-rose-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-rose-500">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-black text-slate-800">
              Belum Ada Pertanyaan {activeTab === 'pria' ? 'dari Catin Pria' : activeTab === 'wanita' ? 'dari Catin Perempuan' : ''}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Tuliskan pertanyaan penting yang ingin Anda diskusikan bersama pasangan untuk menyatukan visi pranikah.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            {!isReadOnly && (
              <button
                type="button"
                onClick={() => handleOpenAddModal(activeTab === 'wanita' ? 'wanita' : 'pria')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white rounded-full text-xs font-bold shadow-rose-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Tulis Pertanyaan Baru
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsIdeaSheetOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-full text-xs font-bold hover:bg-rose-100 active:scale-95 transition-all"
            >
              <Lightbulb className="w-4 h-4" /> Buka Ide Pertanyaan
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleQuestions.map((q, idx) => {
            const isEditingText = editingQuestionId === q.id;

            return (
              <div
                key={q.id}
                className={`bg-white border rounded-3xl p-4 sm:p-5 shadow-sm transition-all space-y-4 ${
                  q.status === 'sepakat'
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : q.status === 'dibahas'
                    ? 'border-rose-200 ring-1 ring-rose-100'
                    : q.status === 'ulang'
                    ? 'border-amber-200 ring-1 ring-amber-100'
                    : 'border-slate-200'
                }`}
              >
                {/* Header Pertanyaan */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Penanya Badge */}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                        q.asker === 'pria'
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      <span>{q.asker === 'pria' ? '👨' : '👩'}</span>
                      <span>Dari {q.asker === 'pria' ? (priaName || 'Catin Pria') : (wanitaName || 'Catin Perempuan')}</span>
                    </span>

                    {/* Category Badge */}
                    {q.category && (
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {q.category}
                      </span>
                    )}

                    {/* Principle Badge */}
                    {q.principle && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                        <Shield className="w-3 h-3" /> Prinsip
                      </span>
                    )}
                  </div>

                  {/* Status Indicator & Delete */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                        q.status === 'sepakat'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : q.status === 'dibahas'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : q.status === 'ulang'
                          ? 'bg-amber-50 text-amber-800 border-amber-300'
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {q.status === 'sepakat'
                        ? 'Sepakat'
                        : q.status === 'dibahas'
                        ? 'Dibahas'
                        : q.status === 'ulang'
                        ? 'Bahas Ulang'
                        : 'Belum'}
                    </span>

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => deleteQuestion(q.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Hapus pertanyaan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Teks Pertanyaan */}
                <div className="space-y-1">
                  {isEditingText ? (
                    <div className="space-y-2">
                      <textarea
                        rows={2}
                        value={editingQuestionText}
                        onChange={(e) => setEditingQuestionText(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white border-2 border-rose-300 rounded-xl focus:border-rose-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (editingQuestionText.trim()) {
                              updateQuestion(q.id, { question: editingQuestionText.trim() });
                            }
                            setEditingQuestionId(null);
                          }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                        >
                          Simpan
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingQuestionId(null)}
                          className="px-3 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2 group">
                      <h4 className="text-base font-black text-slate-900 leading-snug">
                        “{q.question}”
                      </h4>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestionId(q.id);
                            setEditingQuestionText(q.question);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit teks pertanyaan"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* DUA KOLOM JAWABAN (RESPONSIF: 1 KOLOM DI MOBILE, 2 KOLOM DI TABLET/DESKTOP) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Kolom Jawaban Catin Pria */}
                  <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <span className="text-sm">👨</span>
                        <span>Jawaban {priaName ? priaName : 'Catin Pria'}</span>
                      </label>
                      {userRole === 'pria' && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                          Jawaban Anda
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={q.answerPria || ''}
                      onChange={(e) => updateQuestion(q.id, { answerPria: e.target.value })}
                      placeholder={`Tuliskan pandangan atau jawaban dari ${priaName ? priaName : 'catin pria'}...`}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-200 transition-all leading-relaxed"
                    />
                  </div>

                  {/* Kolom Jawaban Catin Perempuan */}
                  <div className="bg-rose-50/50 border border-rose-200/70 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                        <span className="text-sm">👩</span>
                        <span>Jawaban {wanitaName ? wanitaName : 'Catin Perempuan'}</span>
                      </label>
                      {userRole === 'wanita' && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded-full">
                          Jawaban Anda
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={3}
                      disabled={isReadOnly}
                      value={q.answerWanita || ''}
                      onChange={(e) => updateQuestion(q.id, { answerWanita: e.target.value })}
                      placeholder={`Tuliskan pandangan atau tanggapan dari ${wanitaName ? wanitaName : 'catin perempuan'}...`}
                      className="w-full px-3 py-2 text-xs bg-white border border-rose-200/80 rounded-xl focus:border-rose-400 focus:outline-none focus:ring-1 focus:ring-rose-200 transition-all leading-relaxed"
                    />
                  </div>
                </div>

                {/* Kolom Kesimpulan / Catatan Kesepakatan Bersama */}
                <div className="bg-amber-50/40 border border-amber-200/60 rounded-2xl p-3 space-y-1.5">
                  <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <span>📝</span>
                    <span>Kesimpulan / Poin Kesepakatan Bersama</span>
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={q.note || ''}
                    onChange={(e) => updateQuestion(q.id, { note: e.target.value })}
                    placeholder="Contoh: Disepakati bersama bahwa keuangan dikelola transparan dengan rekening bersama..."
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-200/80 rounded-xl focus:border-rose-400 focus:outline-none"
                  />
                </div>

                {/* Baris Status & Prinsip Dealbreaker */}
                <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-slate-100">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={Boolean(q.principle)}
                      onChange={(e) => updateQuestion(q.id, { principle: e.target.checked })}
                      className="w-4 h-4 rounded border-rose-300 text-rose-600 accent-rose-500"
                    />
                    <span>Tandai sebagai Prinsip (Dealbreaker)</span>
                  </label>

                  <div className="grid grid-cols-4 gap-1.5 w-full sm:w-auto">
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
                        onClick={() => updateQuestion(q.id, { status: st.id as any })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          q.status === st.id
                            ? st.id === 'sepakat'
                              ? 'bg-emerald-600 text-white shadow-xs font-black'
                              : st.id === 'dibahas'
                              ? 'bg-rose-500 text-white shadow-xs font-black'
                              : st.id === 'ulang'
                              ? 'bg-amber-500 text-white shadow-xs font-black'
                              : 'bg-slate-700 text-white shadow-xs font-black'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOTTOM SHEET: FORM TAMBAH PERTANYAAN */}
      <BottomSheet
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Tulis Pertanyaan Pranikah Baru"
      >
        <div className="space-y-4">
          {/* Penanya Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Pertanyaan dari Siapa?</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormAsker('pria')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all ${
                  formAsker === 'pria'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>👨</span>
                <span>Catin Pria ({priaName})</span>
              </button>

              <button
                type="button"
                onClick={() => setFormAsker('wanita')}
                className={`flex items-center justify-center gap-2 p-3 rounded-2xl border text-xs font-black transition-all ${
                  formAsker === 'wanita'
                    ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <span>👩</span>
                <span>Catin Perempuan ({wanitaName})</span>
              </button>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Kategori / Topik</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            >
              {QA_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Pertanyaan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Teks Pertanyaan <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formQuestion}
              onChange={(e) => setFormQuestion(e.target.value)}
              placeholder="Tuliskan pertanyaan penting yang ingin diajukan kepada pasangan..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Jawaban Awal Penanya (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jawaban / Harapan Awal Penanya (Opsional)
            </label>
            <textarea
              rows={2}
              value={formAnswerSelf}
              onChange={(e) => setFormAnswerSelf(e.target.value)}
              placeholder="Bagikan pandangan atau ekspektasi Anda terlebih dahulu terkait pertanyaan ini..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
            />
          </div>

          {/* Tandai sebagai Prinsip */}
          <label className="flex items-center gap-2 cursor-pointer p-3 bg-rose-50/70 rounded-2xl border border-rose-200">
            <input
              type="checkbox"
              checked={formPrinciple}
              onChange={(e) => setFormPrinciple(e.target.checked)}
              className="w-4 h-4 rounded border-rose-300 text-rose-600 accent-rose-500"
            />
            <span className="text-xs font-bold text-rose-900">
              Tandai sebagai <strong>Prinsip (Dealbreaker / Tidak dapat ditawar)</strong>
            </span>
          </label>

          <button
            type="button"
            onClick={handleSaveNewQuestion}
            disabled={!formQuestion.trim()}
            className="w-full py-3 bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white rounded-full text-xs font-black shadow-rose-sm disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
          >
            Simpan Pertanyaan
          </button>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: IDE PERTANYAAN PRANIKAH */}
      <BottomSheet
        isOpen={isIdeaSheetOpen}
        onClose={() => setIsIdeaSheetOpen(false)}
        title="Ide Pertanyaan Pranikah"
      >
        <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-500 leading-relaxed">
            Pilih pertanyaan pranikah islami di bawah ini untuk langsung dimasukkan ke kolom Catin Pria atau Catin Perempuan.
          </p>

          {/* Search & Category Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={ideaSearch}
                onChange={(e) => setIdeaSearch(e.target.value)}
                placeholder="Cari ide pertanyaan (misal: nafkah, mertua, anak)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setIdeaCategory('Semua')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                  ideaCategory === 'Semua'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua
              </button>
              {QA_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setIdeaCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 transition-all ${
                    ideaCategory === cat
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* List of Ideas */}
          <div className="space-y-2.5 pt-1">
            {DEFAULT_QA_CARDS.filter((item) => {
              if (ideaCategory !== 'Semua' && item.category !== ideaCategory) return false;
              if (ideaSearch.trim() && !item.question.toLowerCase().includes(ideaSearch.toLowerCase())) {
                return false;
              }
              return true;
            }).map((item) => {
              const alreadyAdded = questions.some((q) => q.question === item.question);

              return (
                <div
                  key={item.id}
                  className="p-3 bg-white border border-slate-200 rounded-2xl hover:border-rose-200 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {item.category}
                    </span>
                    {item.principle && (
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        Prinsip
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-bold text-slate-800 leading-snug">{item.question}</p>

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    {alreadyAdded ? (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Sudah Ada di Daftar
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          type="button"
                          onClick={() => handleAddFromIdea(item, 'pria')}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          + Catin Pria
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAddFromIdea(item, 'wanita')}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-[11px] font-bold transition-all"
                        >
                          + Catin Perempuan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: RINGKASAN KESEPAKATAN */}
      <BottomSheet
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        title="Ringkasan Kesepakatan Ta’aruf"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            Ringkasan ini merangkum poin-poin yang sudah Anda berdua sepakati dan yang masih perlu dibahas. Ringkasan ini otomatis tersambung ke <strong>Tahap 3 (Kesepakatan Khitbah)</strong>.
          </p>

          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Poin Sepakat ({agreedCount})
            </h4>
            {agreedCount === 0 ? (
              <p className="text-xs text-slate-400 italic pl-5">Belum ada pertanyaan yang berstatus Sepakat.</p>
            ) : (
              <div className="space-y-2">
                {questions
                  .filter((q) => q.status === 'sepakat')
                  .map((q) => (
                    <div key={q.id} className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {q.asker === 'pria' ? '👨 Catin Pria' : '👩 Catin Perempuan'}
                        </span>
                        {q.principle && (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md">
                            Prinsip
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-black text-slate-900">{q.question}</p>
                      {q.note && (
                        <p className="text-xs text-emerald-900 font-medium pl-2 border-l-2 border-emerald-500">
                          Kesepakatan: {q.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-amber-600" /> Perlu Dibahas Lagi ({rediscussCount})
            </h4>
            {rediscussCount === 0 ? (
              <p className="text-xs text-slate-400 italic pl-5">Tidak ada poin yang perlu dibahas ulang.</p>
            ) : (
              <div className="space-y-2">
                {questions
                  .filter((q) => q.status === 'ulang')
                  .map((q) => (
                    <div key={q.id} className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {q.asker === 'pria' ? '👨 Catin Pria' : '👩 Catin Perempuan'}
                        </span>
                      </div>
                      <p className="text-xs font-black text-slate-900">{q.question}</p>
                      {q.note && (
                        <p className="text-xs text-amber-900 font-medium pl-2 border-l-2 border-amber-500">
                          Catatan: {q.note}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
