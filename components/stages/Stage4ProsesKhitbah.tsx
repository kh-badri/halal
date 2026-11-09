'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Gift,
  Clock,
  DollarSign,
  Calendar,
  Plus,
  ExternalLink,
  Share2,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Loader2,
  Upload,
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatRupiah, formatShortRupiah } from '@/lib/utils/formatters';
import { useToast } from '@/components/ui/Toast';

interface Stage4Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage4ProsesKhitbah({ workspaceId, isReadOnly, onDataChanged }: Stage4Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'seserahan' | 'rundown' | 'biaya' | 'pelaksanaan'>('seserahan');
  const [loading, setLoading] = useState(true);

  const [khitbahData, setKhitbahData] = useState<any>(null);
  const [budgetData, setBudgetData] = useState<any>(null);

  // Filters for Seserahan
  const [forWhoFilter, setForWhoFilter] = useState<'semua' | 'wanita' | 'pria'>('semua');
  const [statusFilter, setStatusFilter] = useState<string>('semua');

  // Modals
  const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<any>(null);

  const [isRundownSheetOpen, setIsRundownSheetOpen] = useState(false);
  const [editingRundown, setEditingRundown] = useState<any>(null);

  const [isPrepSheetOpen, setIsPrepSheetOpen] = useState(false);
  const [editingPrep, setEditingPrep] = useState<any>(null);

  const [isBudgetItemSheetOpen, setIsBudgetItemSheetOpen] = useState(false);

  // Form states for Gift
  const [giftName, setGiftName] = useState('');
  const [giftCategory, setGiftCategory] = useState('pakaian');
  const [giftForWho, setGiftForWho] = useState<'wanita' | 'pria'>('wanita');
  const [giftQty, setGiftQty] = useState(1);
  const [giftSizeColor, setGiftSizeColor] = useState('');
  const [giftEstimate, setGiftEstimate] = useState(0);
  const [giftActual, setGiftActual] = useState(0);
  const [giftStoreUrl, setGiftStoreUrl] = useState('');
  const [giftStatus, setGiftStatus] = useState<any>('ingin');
  const [giftNotes, setGiftNotes] = useState('');
  const [giftSyncBudget, setGiftSyncBudget] = useState(true);

  // Form states for Rundown Item
  const [runTitle, setRunTitle] = useState('');
  const [runDuration, setRunDuration] = useState(15);
  const [runPic, setRunPic] = useState('');
  const [runNotes, setRunNotes] = useState('');

  // Form states for Prep Checklist Item
  const [prepItemText, setPrepItemText] = useState('');
  const [prepPic, setPrepPic] = useState('');
  const [prepNotes, setPrepNotes] = useState('');

  // Form states for Budget Item
  const [budgetItemName, setBudgetItemName] = useState('');
  const [budgetItemCategory, setBudgetItemCategory] = useState('Konsumsi');
  const [budgetItemEstimate, setBudgetItemEstimate] = useState(0);
  const [budgetItemActual, setBudgetItemActual] = useState(0);
  const [budgetItemStatus, setBudgetItemStatus] = useState<'belum' | 'sebagian' | 'lunas'>('belum');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [kRes, bRes] = await Promise.all([
          fetch('/api/m/khitbah'),
          fetch('/api/m/budget'),
        ]);

        if (kRes.ok) setKhitbahData((await kRes.json()).data);
        if (bRes.ok) setBudgetData((await bRes.json()).data);
      } catch (err) {
        console.error('Error loading Stage 4 data:', err);
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
        console.error('Failed to save khitbah:', err);
      }
    }, 600);
  };

  const saveBudget = (newBudget: any) => {
    setBudgetData(newBudget);
    if (isReadOnly) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/budget', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newBudget),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (err) {
        console.error('Failed to save budget:', err);
      }
    }, 600);
  };

  // Seserahan Items & Calculations
  const gifts: any[] = useMemo(() => {
    return (khitbahData?.gifts || []).filter((g: any) => !g.deletedAt);
  }, [khitbahData]);

  const filteredGifts = useMemo(() => {
    return gifts.filter((g) => {
      if (forWhoFilter !== 'semua' && g.forWho !== forWhoFilter) return false;
      if (statusFilter !== 'semua' && g.status !== statusFilter) return false;
      return true;
    });
  }, [gifts, forWhoFilter, statusFilter]);

  const totalGiftsCount = gifts.length;
  const packedGiftsCount = gifts.filter((g) => g.status === 'dikemas').length;
  const totalGiftEstimate = gifts.reduce((acc, g) => acc + (g.estimate || 0), 0);
  const totalGiftActual = gifts.reduce((acc, g) => acc + (g.actual || 0), 0);

  // Prep Checklist & Calculations
  const prepList: any[] = useMemo(() => {
    return (khitbahData?.prepChecklist || []).filter((p: any) => !p.deletedAt);
  }, [khitbahData]);
  const completedPrepCount = prepList.filter((p) => p.completed).length;

  // Rundown Items with Calculated Cumulative Times
  const rundownList: any[] = useMemo(() => {
    return (khitbahData?.rundown || []).filter((r: any) => !r.deletedAt);
  }, [khitbahData]);

  const calculatedRundown = useMemo(() => {
    const startTimeStr = khitbahData?.eventStartTime || '09:00';
    const [hStr, mStr] = startTimeStr.split(':');
    let currentMinutes = (parseInt(hStr, 10) || 9) * 60 + (parseInt(mStr, 10) || 0);

    return rundownList.map((item, idx) => {
      const startH = Math.floor(currentMinutes / 60);
      const startM = currentMinutes % 60;
      const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;

      currentMinutes += item.durationMinutes || 15;

      const endH = Math.floor(currentMinutes / 60);
      const endM = currentMinutes % 60;
      const endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

      return {
        ...item,
        startTime,
        endTime,
      };
    });
  }, [rundownList, khitbahData?.eventStartTime]);

  // Biaya Khitbah Budget Pos
  const khitbahBudgetPos = useMemo(() => {
    return (budgetData?.categories || []).find((c: any) => c.id === 'khitbah') || {
      id: 'khitbah',
      name: 'Biaya Khitbah / Lamaran',
      targetBudget: 5000000,
    };
  }, [budgetData]);

  const khitbahBudgetItems = useMemo(() => {
    return (budgetData?.items || []).filter((i: any) => i.posId === 'khitbah' && !i.deletedAt);
  }, [budgetData]);

  const totalKhitbahActualCost = khitbahBudgetItems.reduce((acc: number, it: any) => acc + (it.actual || it.estimate || 0), 0);
  const remainingKhitbahBudget = (khitbahBudgetPos.targetBudget || 0) - totalKhitbahActualCost;

  // Gift Handlers
  const openNewGiftModal = () => {
    setEditingGift(null);
    setGiftName('');
    setGiftCategory('pakaian');
    setGiftForWho('wanita');
    setGiftQty(1);
    setGiftSizeColor('');
    setGiftEstimate(0);
    setGiftActual(0);
    setGiftStoreUrl('');
    setGiftStatus('ingin');
    setGiftNotes('');
    setGiftSyncBudget(true);
    setIsGiftSheetOpen(true);
  };

  const openEditGiftModal = (gift: any) => {
    setEditingGift(gift);
    setGiftName(gift.name || '');
    setGiftCategory(gift.category || 'pakaian');
    setGiftForWho(gift.forWho || 'wanita');
    setGiftQty(gift.qty || 1);
    setGiftSizeColor(gift.sizeColor || '');
    setGiftEstimate(gift.estimate || 0);
    setGiftActual(gift.actual || 0);
    setGiftStoreUrl(gift.storeUrl || '');
    setGiftStatus(gift.status || 'ingin');
    setGiftNotes(gift.notes || '');
    setGiftSyncBudget(gift.syncToBudget ?? true);
    setIsGiftSheetOpen(true);
  };

  const handleSaveGift = () => {
    if (isReadOnly || !giftName.trim()) return;
    const now = new Date().toISOString();

    let updatedGifts: any[];
    if (editingGift) {
      updatedGifts = (khitbahData?.gifts || []).map((g: any) => {
        if (g.id === editingGift.id) {
          return {
            ...g,
            name: giftName.trim(),
            category: giftCategory,
            forWho: giftForWho,
            qty: giftQty,
            sizeColor: giftSizeColor,
            estimate: giftEstimate,
            actual: giftActual,
            storeUrl: giftStoreUrl,
            status: giftStatus,
            notes: giftNotes,
            syncToBudget: giftSyncBudget,
            updatedAt: now,
          };
        }
        return g;
      });
    } else {
      const newGift = {
        id: `gift-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        name: giftName.trim(),
        category: giftCategory,
        forWho: giftForWho,
        qty: giftQty,
        sizeColor: giftSizeColor,
        estimate: giftEstimate,
        actual: giftActual,
        storeUrl: giftStoreUrl,
        status: giftStatus,
        notes: giftNotes,
        syncToBudget: giftSyncBudget,
      };
      updatedGifts = [...(khitbahData?.gifts || []), newGift];
    }

    saveKhitbah({ ...khitbahData, gifts: updatedGifts });
    setIsGiftSheetOpen(false);
    showToast(editingGift ? 'Item seserahan diperbarui' : 'Seserahan berhasil ditambahkan', 'success');
  };

  const handleDeleteGift = (id: string) => {
    if (isReadOnly) return;
    const updatedGifts = (khitbahData?.gifts || []).map((g: any) => {
      if (g.id === id) return { ...g, deletedAt: new Date().toISOString() };
      return g;
    });
    saveKhitbah({ ...khitbahData, gifts: updatedGifts });
    showToast('Item seserahan dihapus', 'info');
  };

  const handleGiftStatusChange = (id: string, newStatus: string) => {
    if (isReadOnly) return;
    const updatedGifts = (khitbahData?.gifts || []).map((g: any) => {
      if (g.id === id) return { ...g, status: newStatus, updatedAt: new Date().toISOString() };
      return g;
    });
    saveKhitbah({ ...khitbahData, gifts: updatedGifts });
  };

  // Rundown Handlers
  const handleMoveRundown = (index: number, direction: 'up' | 'down') => {
    if (isReadOnly) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= rundownList.length) return;

    const listCopy = [...rundownList];
    const temp = listCopy[index];
    listCopy[index] = listCopy[targetIdx];
    listCopy[targetIdx] = temp;

    const reordered = listCopy.map((item, idx) => ({
      ...item,
      step: idx + 1,
      updatedAt: new Date().toISOString(),
    }));

    saveKhitbah({ ...khitbahData, rundown: reordered });
  };

  const handleSaveRundown = () => {
    if (isReadOnly || !runTitle.trim()) return;
    const now = new Date().toISOString();

    let updatedList: any[];
    if (editingRundown) {
      updatedList = (khitbahData?.rundown || []).map((r: any) => {
        if (r.id === editingRundown.id) {
          return {
            ...r,
            title: runTitle.trim(),
            durationMinutes: runDuration,
            pic: runPic,
            notes: runNotes,
            updatedAt: now,
          };
        }
        return r;
      });
    } else {
      const newItem = {
        id: `khitbah-run-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        step: rundownList.length + 1,
        title: runTitle.trim(),
        durationMinutes: runDuration,
        pic: runPic,
        notes: runNotes,
      };
      updatedList = [...(khitbahData?.rundown || []), newItem];
    }

    saveKhitbah({ ...khitbahData, rundown: updatedList });
    setIsRundownSheetOpen(false);
    showToast('Susunan acara diperbarui', 'success');
  };

  const handleDeleteRundown = (id: string) => {
    if (isReadOnly) return;
    const updatedList = (khitbahData?.rundown || []).map((r: any) => {
      if (r.id === id) return { ...r, deletedAt: new Date().toISOString() };
      return r;
    });
    saveKhitbah({ ...khitbahData, rundown: updatedList });
    showToast('Item acara dihapus', 'info');
  };

  // Prep Checklist Handlers
  const handleTogglePrep = (id: string, completed: boolean) => {
    if (isReadOnly) return;
    const updated = (khitbahData?.prepChecklist || []).map((p: any) => {
      if (p.id === id) return { ...p, completed, updatedAt: new Date().toISOString() };
      return p;
    });
    saveKhitbah({ ...khitbahData, prepChecklist: updated });
  };

  const handleSavePrep = () => {
    if (isReadOnly || !prepItemText.trim()) return;
    const now = new Date().toISOString();
    const newItem = {
      id: `prep-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      item: prepItemText.trim(),
      pic: prepPic.trim(),
      completed: false,
      notes: prepNotes.trim(),
    };

    saveKhitbah({
      ...khitbahData,
      prepChecklist: [...(khitbahData?.prepChecklist || []), newItem],
    });
    setIsPrepSheetOpen(false);
    setPrepItemText('');
    setPrepPic('');
    setPrepNotes('');
    showToast('Checklist persiapan ditambahkan', 'success');
  };

  // Budget Item Handler for Khitbah
  const handleSaveBudgetItem = () => {
    if (isReadOnly || !budgetItemName.trim()) return;
    const now = new Date().toISOString();
    const newItem = {
      id: `b-item-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      posId: 'khitbah',
      name: budgetItemName.trim(),
      category: budgetItemCategory,
      estimate: budgetItemEstimate,
      actual: budgetItemActual,
      paymentStatus: budgetItemStatus,
      notes: '',
    };

    saveBudget({
      ...budgetData,
      items: [...(budgetData?.items || []), newItem],
    });
    setIsBudgetItemSheetOpen(false);
    setBudgetItemName('');
    setBudgetItemEstimate(0);
    setBudgetItemActual(0);
    showToast('Pos biaya khitbah ditambahkan', 'success');
  };

  const handleShareRundownToWhatsApp = () => {
    const lines = [
      '*SUSUNAN ACARA KHITBAH & LAMARAN RESMI*',
      `Acara: Pertemuan Khitbah`,
      `Hari/Tanggal: ${khitbahData?.eventDate || 'Belum diisi'}`,
      `Waktu Mulai: ${khitbahData?.eventStartTime || '09:00'} WIB`,
      `Lokasi: ${khitbahData?.locationName || 'Kediaman'} (${khitbahData?.locationAddress || '-'})`,
      `Juru Bicara: ${khitbahData?.spokesperson || 'Keluarga'}\n`,
      `*Rundown Acara:*`,
      ...calculatedRundown.map(
        (r, i) => `${i + 1}. [${r.startTime} - ${r.endTime}] ${r.title}${r.pic ? ` (PIC: ${r.pic})` : ''}`
      ),
      `\n*Checklist Perlengkapan Utama:*`,
      ...prepList.map((p) => `• [${p.completed ? '✓' : ' '}] ${p.item} (${p.pic || 'Umum'})`),
      `\nMohon doa restu dari segenap keluarga besar.`,
    ];

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-ink" />
        <p className="text-xs text-ink/70">Memuat data Proses Khitbah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/70 rounded-2xl overflow-x-auto shadow-inner no-scrollbar border border-slate-200/60">
        <button
          type="button"
          onClick={() => setActiveTab('seserahan')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'seserahan'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Seserahan ({packedGiftsCount}/{totalGiftsCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rundown')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'rundown'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Rundown & Acara
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('biaya')}
          className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'biaya'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Biaya Khitbah
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pelaksanaan')}
          className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'pelaksanaan'
              ? 'bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white shadow-rose-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Pelaksanaan & Akad
        </button>
      </div>

      {/* TAB 1: SESERAHAN & HANTARAN */}
      {activeTab === 'seserahan' && (
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                  Kesiapan Kotak Hantaran
                </span>
                <h3 className="text-lg font-black text-ink">
                  {packedGiftsCount} dari {totalGiftsCount} Kotak Sudah Dikemas
                </h3>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={openNewGiftModal}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blush border-2 border-ink rounded-xl text-xs font-black text-ink shadow-xs hover:bg-blush/80 transition-all"
                >
                  <Plus className="w-4 h-4" /> Tambah Item
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blush/30 h-3 rounded-full border border-ink/40 overflow-hidden">
              <div
                className="h-full bg-sky transition-all duration-300 border-r border-ink"
                style={{
                  width: `${totalGiftsCount > 0 ? (packedGiftsCount / totalGiftsCount) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Price Estimasi vs Aktual */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-center">
              <div className="p-2.5 bg-sky/20 border border-ink/30 rounded-2xl">
                <span className="text-[10px] font-bold text-ink/70 block">Total Estimasi</span>
                <span className="text-sm font-black text-ink">{formatRupiah(totalGiftEstimate)}</span>
              </div>
              <div className="p-2.5 bg-blush/20 border border-ink/30 rounded-2xl">
                <span className="text-[10px] font-bold text-ink/70 block">Total Aktual</span>
                <span className="text-sm font-black text-ink">{formatRupiah(totalGiftActual)}</span>
              </div>
            </div>

            {packedGiftsCount < totalGiftsCount && (
              <p className="text-xs text-ink/70 text-center font-bold">
                ⚠️ Syarat Selesai: Semua item seserahan wajib berstatus <strong>“Sudah Dikemas”</strong>. Item yang batal dibeli dapat dihapus.
              </p>
            )}
          </div>

          {/* Filter Bar */}
          <div className="bg-white border-2 border-ink rounded-2xl p-2.5 shadow-subtle flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
            <div className="flex gap-1 shrink-0">
              {(['semua', 'wanita', 'pria'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForWhoFilter(t)}
                  className={`px-3 py-1 rounded-xl text-xs font-black capitalize transition-all ${
                    forWhoFilter === t
                      ? 'bg-sky text-ink border-2 border-ink shadow-xs'
                      : 'bg-white text-ink/60 border border-ink/30'
                  }`}
                >
                  {t === 'semua' ? 'Semua Penerima' : `Untuk ${t}`}
                </button>
              ))}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold bg-white border-2 border-ink rounded-xl focus:outline-none shrink-0"
            >
              <option value="semua">Semua Status</option>
              <option value="ingin">Ingin</option>
              <option value="dibeli">Dibeli</option>
              <option value="dikirim">Dikirim</option>
              <option value="diterima">Diterima</option>
              <option value="dikemas">Sudah Dikemas</option>
            </select>
          </div>

          {/* Gifts List */}
          <div className="space-y-3">
            {filteredGifts.length === 0 ? (
              <div className="p-8 bg-white border-2 border-dashed border-ink/40 rounded-3xl text-center space-y-2">
                <Gift className="w-8 h-8 text-ink/40 mx-auto" />
                <p className="text-xs font-bold text-ink">Belum ada item seserahan pada filter ini.</p>
              </div>
            ) : (
              filteredGifts.map((item) => {
                const isPacked = item.status === 'dikemas';

                return (
                  <div
                    key={item.id}
                    className={`bg-white border-2 border-ink rounded-3xl p-4 shadow-subtle space-y-3 transition-all ${
                      isPacked ? 'border-l-8 border-l-sky' : 'border-l-8 border-l-blush'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase text-ink/70 bg-blush/40 px-2 py-0.5 rounded-full border border-ink/20">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] font-bold text-ink/60 bg-sky/30 px-2 py-0.5 rounded-full border border-ink/20">
                            Untuk {item.forWho}
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-ink">{item.name}</h4>

                        {item.sizeColor && (
                          <p className="text-xs text-ink/70 mt-0.5">Spesifikasi: {item.sizeColor}</p>
                        )}
                        {item.notes && (
                          <p className="text-xs text-ink/60 italic mt-0.5">Catatan: {item.notes}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-ink ${
                            item.status === 'dikemas'
                              ? 'bg-sky text-ink'
                              : item.status === 'diterima'
                              ? 'bg-blush text-ink'
                              : 'bg-white text-ink/60 border-dashed'
                          }`}
                        >
                          {item.status === 'dikemas'
                            ? 'Sudah Dikemas'
                            : item.status === 'diterima'
                            ? 'Diterima'
                            : item.status === 'dikirim'
                            ? 'Dikirim'
                            : item.status === 'dibeli'
                            ? 'Dibeli'
                            : 'Ingin'}
                        </span>

                        <div className="flex items-center gap-1">
                          {!isReadOnly && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditGiftModal(item)}
                                className="p-1 text-ink/70 hover:text-ink"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGift(item.id)}
                                className="p-1 text-ink/50 hover:text-ink"
                                title="Hapus"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Price and Store Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-ink/10 text-xs">
                      <div className="space-x-2">
                        <span className="text-ink/60">Est: {formatRupiah(item.estimate || 0)}</span>
                        {item.actual > 0 && (
                          <span className="font-bold text-ink">Aktual: {formatRupiah(item.actual)}</span>
                        )}
                      </div>

                      {item.storeUrl && (
                        <a
                          href={item.storeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[11px] font-bold text-ink bg-sky/40 px-2.5 py-1 rounded-lg border border-ink/30 hover:bg-sky"
                        >
                          <ExternalLink className="w-3 h-3" /> Buka Toko
                        </a>
                      )}
                    </div>

                    {/* Quick Status Selector */}
                    {!isReadOnly && (
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[
                          { id: 'ingin', label: 'Ingin' },
                          { id: 'dibeli', label: 'Dibeli' },
                          { id: 'dikirim', label: 'Dikirim' },
                          { id: 'diterima', label: 'Diterima' },
                          { id: 'dikemas', label: 'Dikemas' },
                        ].map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => handleGiftStatusChange(item.id, st.id)}
                            className={`py-1 rounded-lg text-[10px] font-black transition-all ${
                              item.status === st.id
                                ? 'bg-ink text-white shadow-xs'
                                : 'bg-white text-ink/60 border border-ink/20 hover:border-ink'
                            }`}
                          >
                            {st.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RUNDOWN & ACARA */}
      {activeTab === 'rundown' && (
        <div className="space-y-4">
          {/* Rundown Event Info Header */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                  Susunan Acara Pertemuan Khitbah
                </span>
                <h3 className="text-base font-black text-ink">
                  {khitbahData?.eventDate ? `Pelaksanaan: ${khitbahData.eventDate}` : 'Tanggal Khitbah Belum Diatur'}
                </h3>
                <p className="text-xs text-ink/70">
                  Mulai pukul {khitbahData?.eventStartTime || '09:00'} WIB · {khitbahData?.locationName || 'Kediaman'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleShareRundownToWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky border-2 border-ink rounded-xl text-xs font-black text-ink shadow-xs hover:bg-sky/80 transition-all shrink-0"
              >
                <Share2 className="w-4 h-4" /> Share WA
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-ink">
                Total {calculatedRundown.length} Sesi Acara
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingRundown(null);
                    setRunTitle('');
                    setRunDuration(15);
                    setRunPic('');
                    setRunNotes('');
                    setIsRundownSheetOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-ink underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Sesi Acara
                </button>
              )}
            </div>
          </div>

          {/* Timeline of Rundown Items */}
          <div className="space-y-2">
            {calculatedRundown.map((item, idx) => (
              <div
                key={item.id}
                className="bg-white border-2 border-ink rounded-2xl p-3.5 shadow-subtle flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-16 text-center py-1 bg-sky/30 border border-ink/30 rounded-xl shrink-0">
                    <span className="text-xs font-black text-ink block">{item.startTime}</span>
                    <span className="text-[9px] font-bold text-ink/60 block">{item.durationMinutes} mnt</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-ink">{item.title}</h4>
                    <p className="text-[11px] text-ink/70">
                      PIC: <strong>{item.pic || 'Keluarga'}</strong>
                      {item.notes ? ` · ${item.notes}` : ''}
                    </p>
                  </div>
                </div>

                {!isReadOnly && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveRundown(idx, 'up')}
                      className="p-1 text-ink/60 hover:text-ink disabled:opacity-20"
                      title="Geser naik"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === calculatedRundown.length - 1}
                      onClick={() => handleMoveRundown(idx, 'down')}
                      className="p-1 text-ink/60 hover:text-ink disabled:opacity-20"
                      title="Geser turun"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRundown(item.id)}
                      className="p-1 text-ink/40 hover:text-ink"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Checklist Persiapan Hari Khitbah (PRD 9.4 B - Syarat Selesai) */}
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-ink">Checklist Persiapan Hari Khitbah</h4>
                <p className="text-xs text-ink/70">
                  {completedPrepCount} dari {prepList.length} tugas selesai
                </p>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsPrepSheetOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blush border-2 border-ink rounded-xl text-xs font-black text-ink shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah
                </button>
              )}
            </div>

            <div className="space-y-2">
              {prepList.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 border-ink cursor-pointer transition-colors ${
                    p.completed ? 'bg-sky/20' : 'bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      disabled={isReadOnly}
                      checked={Boolean(p.completed)}
                      onChange={(e) => handleTogglePrep(p.id, e.target.checked)}
                      className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                    />
                    <div>
                      <span className={`text-xs font-bold text-ink block ${p.completed ? 'line-through text-ink/60' : ''}`}>
                        {p.item}
                      </span>
                      {p.pic && <span className="text-[10px] text-ink/60">PIC: {p.pic}</span>}
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-ink ${
                      p.completed ? 'bg-sky text-ink' : 'bg-white text-ink/40'
                    }`}
                  >
                    {p.completed ? 'Selesai' : 'Belum'}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BIAYA KHITBAH */}
      {activeTab === 'biaya' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                  Pos Anggaran Khitbah / Lamaran
                </span>
                <h3 className="text-base font-black text-ink">Ringkasan Biaya Khitbah</h3>
                <p className="text-xs text-ink/70">Tersimpan di budget.json dan terhubung ke Tahap 5</p>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => setIsBudgetItemSheetOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-sky border-2 border-ink rounded-xl text-xs font-black text-ink shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Tambah Pos
                </button>
              )}
            </div>

            {/* Target vs Actual Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-blush/20 border-2 border-ink rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-ink/70">Target Anggaran</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={khitbahBudgetPos.targetBudget || 0}
                    onChange={(e) => {
                      const newTarget = Number(e.target.value);
                      const updatedCats = (budgetData?.categories || []).map((c: any) =>
                        c.id === 'khitbah' ? { ...c, targetBudget: newTarget } : c
                      );
                      saveBudget({ ...budgetData, categories: updatedCats });
                    }}
                    className="w-full text-base font-black text-ink bg-transparent border-b border-ink focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-sky/20 border-2 border-ink rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-ink/70">Total Terpakai / Aktual</span>
                <p className="text-base font-black text-ink">{formatRupiah(totalKhitbahActualCost)}</p>
              </div>

              <div className="p-3.5 bg-white border-2 border-ink rounded-2xl space-y-1">
                <span className="text-[10px] font-bold text-ink/70">Sisa Anggaran</span>
                <p
                  className={`text-base font-black ${
                    remainingKhitbahBudget < 0 ? 'text-ink underline' : 'text-ink'
                  }`}
                >
                  {formatRupiah(remainingKhitbahBudget)}
                </p>
              </div>
            </div>

            {/* Khitbah Cost Items List */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-black text-ink uppercase tracking-wider">
                Daftar Pengeluaran Khitbah ({khitbahBudgetItems.length})
              </h4>

              {khitbahBudgetItems.length === 0 ? (
                <p className="text-xs text-ink/60 italic p-3 bg-blush/20 rounded-2xl">
                  Belum ada item pengeluaran khitbah.
                </p>
              ) : (
                khitbahBudgetItems.map((it: any) => (
                  <div
                    key={it.id}
                    className="p-3 bg-white border border-ink/40 rounded-2xl flex items-center justify-between gap-2 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-ink bg-blush/40 px-2 py-0.5 rounded-full border border-ink/20">
                          {it.category}
                        </span>
                        <h5 className="text-xs font-black text-ink">{it.name}</h5>
                      </div>
                      <span className="text-[11px] text-ink/70 mt-0.5 block">
                        Est: {formatRupiah(it.estimate)} · Akt: {formatRupiah(it.actual || 0)}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-ink ${
                        it.paymentStatus === 'lunas'
                          ? 'bg-sky text-ink'
                          : it.paymentStatus === 'sebagian'
                          ? 'bg-blush text-ink'
                          : 'bg-white text-ink/50'
                      }`}
                    >
                      {it.paymentStatus}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PELAKSANAAN & TANGGAL AKAD */}
      {activeTab === 'pelaksanaan' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-5">
            <div>
              <h3 className="text-base font-black text-ink">Pelaksanaan Khitbah & Penetapan Tanggal Akad</h3>
              <p className="text-xs text-ink/70 mt-1 leading-relaxed">
                Tandai bahwa prosesi lamaran resmi telah terlaksana dan tetapkan tanggal akad pernikahan yang disepakati kedua keluarga.
              </p>
            </div>

            {/* Checklist Khitbah Terlaksana (PRD 9.4 D - Syarat Selesai) */}
            <div className="p-4 rounded-2xl border-2 border-ink bg-sky/20 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={Boolean(khitbahData?.execution?.completed)}
                  onChange={(e) =>
                    saveKhitbah({
                      ...khitbahData,
                      execution: {
                        ...khitbahData?.execution,
                        completed: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 rounded-lg border-2 border-ink accent-ink text-ink focus:ring-0"
                />
                <div>
                  <h4 className="text-sm font-black text-ink">Khitbah Resmi Terlaksana</h4>
                  <p className="text-xs text-ink/70">Lamaran telah diterima dengan baik oleh keluarga wanita</p>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">
                    Tanggal Terlaksana <span className="text-ink font-black">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnly}
                    value={khitbahData?.execution?.executionDate || ''}
                    onChange={(e) =>
                      saveKhitbah({
                        ...khitbahData,
                        execution: {
                          ...khitbahData?.execution,
                          executionDate: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink mb-1">Catatan Hasil & Doa</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={khitbahData?.execution?.notes || ''}
                    onChange={(e) =>
                      saveKhitbah({
                        ...khitbahData,
                        execution: {
                          ...khitbahData?.execution,
                          notes: e.target.value,
                        },
                      })
                    }
                    placeholder="Suasana pertemuan dan kesepakatan umum..."
                    className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Penetapan Tanggal Akad (PRD 9.4 D - Syarat Selesai) */}
            <div className="p-4 rounded-2xl border-2 border-ink bg-blush/30 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-ink" />
                <h4 className="text-sm font-black text-ink">
                  Penetapan Tanggal Akad Pernikahan <span className="text-ink font-black">*</span>
                </h4>
              </div>

              <p className="text-xs text-ink/80 leading-relaxed">
                Tanggal akad yang ditetapkan di sini akan otomatis mengaktifkan <strong>Hitung Mundur (Countdown Hari-H)</strong> di Peta Rute Beranda.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-ink mb-1">Tanggal Akad yang Disepakati</label>
                <input
                  type="date"
                  disabled={isReadOnly}
                  value={khitbahData?.execution?.weddingTargetDate || ''}
                  onChange={(e) =>
                    saveKhitbah({
                      ...khitbahData,
                      execution: {
                        ...khitbahData?.execution,
                        weddingTargetDate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 text-sm font-black bg-white border-2 border-ink rounded-xl focus:bg-sky/20 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET: FORM SESERAHAN */}
      <BottomSheet
        isOpen={isGiftSheetOpen}
        onClose={() => setIsGiftSheetOpen(false)}
        title={editingGift ? 'Ubah Item Seserahan' : 'Tambah Item Seserahan'}
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">Nama Item Seserahan *</label>
            <input
              type="text"
              value={giftName}
              onChange={(e) => setGiftName(e.target.value)}
              placeholder="Contoh: Set Mukena Sutra & Sajadah"
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:bg-blush/20 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Kategori</label>
              <select
                value={giftCategory}
                onChange={(e) => setGiftCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              >
                <option value="pakaian">Pakaian / Busana</option>
                <option value="alat_ibadah">Alat Ibadah</option>
                <option value="kosmetik">Kosmetik / Skincare</option>
                <option value="tas_sepatu">Tas & Sepatu</option>
                <option value="makanan">Makanan / Buah</option>
                <option value="perhiasan">Perhiasan</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Untuk Siapa</label>
              <select
                value={giftForWho}
                onChange={(e) => setGiftForWho(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              >
                <option value="wanita">Calon Mempelai Wanita</option>
                <option value="pria">Calon Mempelai Pria</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Ukuran / Warna</label>
              <input
                type="text"
                value={giftSizeColor}
                onChange={(e) => setGiftSizeColor(e.target.value)}
                placeholder="Contoh: Size M / Dust Pink"
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Jumlah (Qty)</label>
              <input
                type="number"
                value={giftQty}
                onChange={(e) => setGiftQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Estimasi Harga (Rp)</label>
              <input
                type="number"
                value={giftEstimate}
                onChange={(e) => setGiftEstimate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Harga Aktual (Rp)</label>
              <input
                type="number"
                value={giftActual}
                onChange={(e) => setGiftActual(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Link Toko (Shopee/Tokopedia/dll)</label>
            <input
              type="url"
              value={giftStoreUrl}
              onChange={(e) => setGiftStoreUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Status Pembelian</label>
            <select
              value={giftStatus}
              onChange={(e) => setGiftStatus(e.target.value as any)}
              className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none font-bold"
            >
              <option value="ingin">Ingin</option>
              <option value="dibeli">Dibeli</option>
              <option value="dikirim">Dikirim</option>
              <option value="diterima">Diterima</option>
              <option value="dikemas">Sudah Dikemas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Catatan Tambahan</label>
            <input
              type="text"
              value={giftNotes}
              onChange={(e) => setGiftNotes(e.target.value)}
              placeholder="Catatan kemasan, toko offline, dll."
              className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveGift}
            disabled={!giftName.trim()}
            className="w-full py-3 bg-sky text-ink border-2 border-ink rounded-full text-sm font-black shadow-subtle hover:bg-sky/80 disabled:opacity-40 transition-all"
          >
            Simpan Item Seserahan
          </button>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: FORM RUNDOWN ITEM */}
      <BottomSheet
        isOpen={isRundownSheetOpen}
        onClose={() => setIsRundownSheetOpen(false)}
        title="Tambah Sesi Susunan Acara"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">Nama Sesi Acara *</label>
            <input
              type="text"
              value={runTitle}
              onChange={(e) => setRunTitle(e.target.value)}
              placeholder="Contoh: Sambutan Keluarga Mempelai Pria"
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Durasi (Menit)</label>
              <input
                type="number"
                value={runDuration}
                onChange={(e) => setRunDuration(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Penanggung Jawab (PIC)</label>
              <input
                type="text"
                value={runPic}
                onChange={(e) => setRunPic(e.target.value)}
                placeholder="Contoh: Pak De Hendra"
                className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Catatan Tambahan</label>
            <input
              type="text"
              value={runNotes}
              onChange={(e) => setRunNotes(e.target.value)}
              placeholder="Catatan teks sambutan atau perlengkapan"
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSaveRundown}
            disabled={!runTitle.trim()}
            className="w-full py-3 bg-sky text-ink border-2 border-ink rounded-full text-sm font-black shadow-subtle hover:bg-sky/80 disabled:opacity-40 transition-all"
          >
            Simpan Sesi Acara
          </button>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: FORM CHECKLIST PERSIAPAN */}
      <BottomSheet
        isOpen={isPrepSheetOpen}
        onClose={() => setIsPrepSheetOpen(false)}
        title="Tambah Checklist Persiapan Hari Khitbah"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">Item Persiapan *</label>
            <input
              type="text"
              value={prepItemText}
              onChange={(e) => setPrepItemText(e.target.value)}
              placeholder="Contoh: Tes Sound System & Mic Wireless H-1"
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-ink mb-1">Penanggung Jawab (PIC)</label>
            <input
              type="text"
              value={prepPic}
              onChange={(e) => setPrepPic(e.target.value)}
              placeholder="Contoh: Tim Perlengkapan"
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePrep}
            disabled={!prepItemText.trim()}
            className="w-full py-3 bg-sky text-ink border-2 border-ink rounded-full text-sm font-black shadow-subtle hover:bg-sky/80 disabled:opacity-40 transition-all"
          >
            Simpan Checklist
          </button>
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET: FORM BIAYA KHITBAH ITEM */}
      <BottomSheet
        isOpen={isBudgetItemSheetOpen}
        onClose={() => setIsBudgetItemSheetOpen(false)}
        title="Tambah Pengeluaran Khitbah"
      >
        <div className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-ink mb-1">Nama Pengeluaran *</label>
            <input
              type="text"
              value={budgetItemName}
              onChange={(e) => setBudgetItemName(e.target.value)}
              placeholder="Contoh: Konsumsi Prasmanan 50 Pax"
              className="w-full px-3 py-2 text-sm bg-white border-2 border-ink rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Kategori</label>
              <select
                value={budgetItemCategory}
                onChange={(e) => setBudgetItemCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              >
                <option value="Konsumsi">Konsumsi / Snack</option>
                <option value="Dekorasi">Dekorasi Backdrop</option>
                <option value="Busana">Busana & MUA Lamaran</option>
                <option value="Dokumentasi">Foto / Video</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Status Pembayaran</label>
              <select
                value={budgetItemStatus}
                onChange={(e) => setBudgetItemStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              >
                <option value="belum">Belum Bayar</option>
                <option value="sebagian">DP / Sebagian</option>
                <option value="lunas">Lunas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Estimasi (Rp)</label>
              <input
                type="number"
                value={budgetItemEstimate}
                onChange={(e) => setBudgetItemEstimate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Aktual (Rp)</label>
              <input
                type="number"
                value={budgetItemActual}
                onChange={(e) => setBudgetItemActual(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-white border-2 border-ink rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveBudgetItem}
            disabled={!budgetItemName.trim()}
            className="w-full py-3 bg-sky text-ink border-2 border-ink rounded-full text-sm font-black shadow-subtle hover:bg-sky/80 disabled:opacity-40 transition-all"
          >
            Simpan Pengeluaran
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
