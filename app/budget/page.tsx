'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  DollarSign,
  PieChart,
  Wallet,
  Building,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  FileText,
  Loader2,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { DonutChart, DonutSegment } from '@/components/ui/DonutChart';
import { ProgressBar } from '@/components/ui/ProgressRing';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah, formatShortRupiah, formatDateIndo, daysUntil } from '@/lib/utils/formatters';

function BudgetContent() {
  const searchParams = useSearchParams();
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'pos' | 'mahar' | 'dana' | 'vendor'>('pos');
  const [data, setData] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // BottomSheet Modals
  const [itemSheetOpen, setItemSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [vendorSheetOpen, setVendorSheetOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedVendorForPayment, setSelectedVendorForPayment] = useState<any>(null);
  const [fundingSheetOpen, setFundingSheetOpen] = useState(false);

  // Form States for Item
  const [itemPosId, setItemPosId] = useState('akad_walimah');
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Katering');
  const [itemEstimate, setItemEstimate] = useState(0);
  const [itemActual, setItemActual] = useState(0);
  const [itemStatus, setItemStatus] = useState<'belum' | 'sebagian' | 'lunas'>('belum');
  const [itemNotes, setItemNotes] = useState('');

  // Form States for Vendor
  const [vName, setVName] = useState('');
  const [vCategory, setVCategory] = useState('Katering');
  const [vContact, setVContact] = useState('');
  const [vTotal, setVTotal] = useState(0);
  const [vDueDate, setVDueDate] = useState('');
  const [vNotes, setVNotes] = useState('');

  // Form States for Payment Term
  const [payAmount, setPayAmount] = useState(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payNote, setPayNote] = useState('');
  const [payProofFileId, setPayProofFileId] = useState<string | undefined>(undefined);

  // Form States for Funding Source
  const [fundName, setFundName] = useState('');
  const [fundCategory, setFundCategory] = useState<'tabungan_pria' | 'tabungan_wanita' | 'bantuan_keluarga' | 'hadiah' | 'lainnya'>('tabungan_pria');
  const [fundAmount, setFundAmount] = useState(0);
  const [fundTarget, setFundTarget] = useState(0);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-item') {
      handleOpenNewItem();
    }
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pos' || tabParam === 'mahar' || tabParam === 'dana' || tabParam === 'vendor') {
      setActiveTab(tabParam);
    }

    async function loadData() {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch('/api/m/budget'),
          fetch('/api/m/settings'),
        ]);
        if (bRes.ok) setData((await bRes.json()).data);
        if (sRes.ok) setSettings((await sRes.json()).data);
      } catch (err) {
        console.error('Error loading budget:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [searchParams]);

  const triggerAutoSave = (updated: any) => {
    setData(updated);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/budget', {
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

  // --- Budget Item Handlers ---
  const handleOpenNewItem = () => {
    setEditingItem(null);
    setItemPosId(data?.categories?.[0]?.id || 'akad_walimah');
    setItemName('');
    setItemCategory('Umum');
    setItemEstimate(1000000);
    setItemActual(0);
    setItemStatus('belum');
    setItemNotes('');
    setItemSheetOpen(true);
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItem(item);
    setItemPosId(item.posId || 'akad_walimah');
    setItemName(item.name);
    setItemCategory(item.category || 'Umum');
    setItemEstimate(item.estimate || 0);
    setItemActual(item.actual || 0);
    setItemStatus(item.paymentStatus || 'belum');
    setItemNotes(item.notes || '');
    setItemSheetOpen(true);
  };

  const handleSaveItem = () => {
    if (!itemName.trim()) return;
    const items = data?.items || [];
    let updatedItems: any[];

    if (editingItem) {
      updatedItems = items.map((i: any) =>
        i.id === editingItem.id
          ? {
              ...i,
              posId: itemPosId,
              name: itemName.trim(),
              category: itemCategory,
              estimate: itemEstimate,
              actual: itemActual,
              paymentStatus: itemStatus,
              notes: itemNotes,
              updatedAt: new Date().toISOString(),
            }
          : i
      );
    } else {
      const newItem = {
        id: `b-item-${Date.now()}`,
        posId: itemPosId,
        name: itemName.trim(),
        category: itemCategory,
        estimate: itemEstimate,
        actual: itemActual,
        paymentStatus: itemStatus,
        notes: itemNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedItems = [newItem, ...items];
    }

    triggerAutoSave({ ...data, items: updatedItems });
    setItemSheetOpen(false);
    showToast({
      message: editingItem ? 'Item anggaran diperbarui' : 'Item pengeluaran ditambahkan',
      type: 'success',
    });
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = (data?.items || []).map((i: any) =>
      i.id === id ? { ...i, deletedAt: new Date().toISOString() } : i
    );
    triggerAutoSave({ ...data, items: updatedItems });
    showToast({
      message: 'Item anggaran dihapus',
      type: 'info',
      action: {
        label: 'Urungkan',
        onClick: () => {
          const restored = (data?.items || []).map((i: any) => {
            if (i.id === id) {
              const { deletedAt, ...rest } = i;
              return rest;
            }
            return i;
          });
          triggerAutoSave({ ...data, items: restored });
        },
      },
    });
  };

  // --- Vendor Handlers ---
  const handleOpenNewVendor = () => {
    setEditingVendor(null);
    setVName('');
    setVCategory('Katering');
    setVContact('');
    setVTotal(15000000);
    setVDueDate('');
    setVNotes('');
    setVendorSheetOpen(true);
  };

  const handleSaveVendor = () => {
    if (!vName.trim()) return;
    const vendors = data?.vendors || [];
    let updatedVendors: any[];

    if (editingVendor) {
      updatedVendors = vendors.map((v: any) =>
        v.id === editingVendor.id
          ? {
              ...v,
              name: vName.trim(),
              category: vCategory,
              contact: vContact,
              total: vTotal,
              dueDate: vDueDate || undefined,
              notes: vNotes,
              updatedAt: new Date().toISOString(),
            }
          : v
      );
    } else {
      const newV = {
        id: `v-${Date.now()}`,
        name: vName.trim(),
        category: vCategory,
        contact: vContact,
        total: vTotal,
        downPayment: 0,
        dueDate: vDueDate || undefined,
        notes: vNotes,
        payments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedVendors = [newV, ...vendors];
    }

    triggerAutoSave({ ...data, vendors: updatedVendors });
    setVendorSheetOpen(false);
    showToast({
      message: editingVendor ? 'Data vendor diperbarui' : 'Vendor baru berhasil ditambahkan',
      type: 'success',
    });
  };

  // Handle Payment Term Addition
  const handleAddPaymentTerm = () => {
    if (!selectedVendorForPayment || payAmount <= 0) return;
    const newPayment = {
      id: `p-${Date.now()}`,
      date: payDate,
      amount: payAmount,
      note: payNote,
      proofFileId: payProofFileId,
    };

    const updatedVendors = (data?.vendors || []).map((v: any) => {
      if (v.id === selectedVendorForPayment.id) {
        const payments = [...(v.payments || []), newPayment];
        const isFirstPayment = (v.payments || []).length === 0;
        return {
          ...v,
          downPayment: isFirstPayment ? payAmount : v.downPayment,
          payments,
          updatedAt: new Date().toISOString(),
        };
      }
      return v;
    });

    triggerAutoSave({ ...data, vendors: updatedVendors });
    setPaymentSheetOpen(false);
    showToast({ message: 'Pembayaran termin berhasil dicatat', type: 'success' });
  };

  // Handle Receipt Upload
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      showToast({ message: 'Mengunggah bukti transfer...', type: 'info' });
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/files', { method: 'POST', body: formData });
      const resJson = await res.json();
      if (!res.ok) throw new Error(resJson.error || 'Upload gagal');

      setPayProofFileId(resJson.fileId);
      showToast({ message: 'Bukti transfer terunggah!', type: 'success' });
    } catch (err: any) {
      showToast({ message: err.message || 'Gagal mengunggah bukti', type: 'error' });
    }
  };

  // --- Export CSV ---
  const handleExportCSV = () => {
    const activeVendors = (data?.vendors || []).filter((v: any) => !v.deletedAt);
    let csv = 'Nama Vendor,Kategori,Kontak,Total Biaya,Sudah Dibayar,Sisa Tagihan,Jatuh Tempo,Status\n';

    activeVendors.forEach((v: any) => {
      const paid = v.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;
      const remaining = Math.max(0, (v.total || 0) - paid);
      let status = 'Belum DP';
      if (paid >= (v.total || 0)) status = 'Lunas';
      else if (paid > 0) status = 'DP';

      csv += `"${v.name}","${v.category}","${v.contact || ''}",${v.total || 0},${paid},${remaining},"${v.dueDate || ''}","${status}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap-budget-nikahku-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ message: 'Berkas CSV berhasil diunduh', type: 'success' });
  };

  // --- Calculations ---
  const activeItems = (data?.items || []).filter((i: any) => !i.deletedAt);
  const totalBudgetTarget = (data?.categories || []).reduce((acc: number, c: any) => acc + (c.targetBudget || 0), 0);
  const totalActualSpent = activeItems.reduce((acc: number, i: any) => acc + (i.actual || 0), 0);
  const totalRemainingBudget = Math.max(0, totalBudgetTarget - totalActualSpent);

  // Donut Segments
  const donutSegments: DonutSegment[] = (data?.categories || []).map((cat: any) => {
    const catActual = activeItems
      .filter((i: any) => i.posId === cat.id)
      .reduce((acc: number, i: any) => acc + (i.actual || 0), 0);
    return {
      label: cat.name,
      value: catActual > 0 ? catActual : cat.targetBudget,
      color: cat.color || '#D94F86',
    };
  });

  // Funding calculations
  const activeFunds = (data?.fundingSources || []).filter((f: any) => !f.deletedAt);
  const totalFundsCollected = activeFunds.reduce((acc: number, f: any) => acc + (f.amount || 0), 0);
  const totalFundsTarget = activeFunds.reduce((acc: number, f: any) => acc + (f.targetAmount || 0), 0);
  const fundDeficit = Math.max(0, totalBudgetTarget - totalFundsCollected);

  // Monthly Savings Suggestion
  const daysLeft = settings?.targetDate ? daysUntil(settings.targetDate) : null;
  const monthsLeft = daysLeft ? Math.max(1, Math.ceil(daysLeft / 30)) : 6;
  const monthlySavingsTarget = fundDeficit > 0 ? Math.ceil(fundDeficit / monthsLeft) : 0;

  // Vendors status calculation
  const activeVendors = (data?.vendors || []).filter((v: any) => !v.deletedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrichedVendors = activeVendors.map((v: any) => {
    const paid = (v.payments || []).reduce((acc: number, p: any) => acc + (p.amount || 0), 0);
    const remaining = Math.max(0, (v.total || 0) - paid);
    let status = 'belum';
    if (paid >= (v.total || 0) && (v.total || 0) > 0) {
      status = 'lunas';
    } else if (paid > 0) {
      status = 'dp';
    }

    if (v.dueDate && status !== 'lunas') {
      const due = new Date(v.dueDate);
      if (due < today) {
        status = 'terlambat';
      }
    }

    return {
      ...v,
      paid,
      remaining,
      computedStatus: status,
    };
  }).sort((a: any, b: any) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Budgeting &amp; Cashflow"
        subtitle="Pos anggaran, mahar, vendor &amp; tabungan bulanan"
        backHref="/rute"
      />

      {/* Segmented Top Tabs */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-blush/60 px-4 py-2">
        <div className="flex bg-blush/40 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
          {[
            { key: 'pos', label: 'Pos Anggaran', icon: PieChart },
            { key: 'mahar', label: 'Detail Mahar', icon: DollarSign },
            { key: 'dana', label: 'Sumber Dana', icon: Wallet },
            { key: 'vendor', label: 'Tracker Vendor', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                  active ? 'bg-rose text-white shadow-xs' : 'text-ink/70 hover:text-ink hover:bg-white/50'
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
        {/* ============================================================== */}
        {/* TAB 1: POS ANGGARAN & DONUT CHART (SECTION 9.3 A)              */}
        {/* ============================================================== */}
        {activeTab === 'pos' && (
          <div className="space-y-4">
            {/* Donut Chart Card */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft flex flex-col items-center">
              <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider mb-2">
                Distribusi Anggaran Pernikahan
              </h3>
              <DonutChart segments={donutSegments} totalLabel="Target" size={170} thickness={20} />

              <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-blush/60 text-center">
                <div className="p-2 rounded-2xl bg-blush/30">
                  <p className="text-[10px] text-ink/70">Dianggarkan</p>
                  <p className="text-xs font-extrabold text-ink mt-0.5">{formatShortRupiah(totalBudgetTarget)}</p>
                </div>
                <div className="p-2 rounded-2xl bg-rose/10">
                  <p className="text-[10px] text-rose font-medium">Terpakai</p>
                  <p className="text-xs font-extrabold text-rose mt-0.5">{formatShortRupiah(totalActualSpent)}</p>
                </div>
                <div className="p-2 rounded-2xl bg-sky/30">
                  <p className="text-[10px] text-ink/70">Sisa</p>
                  <p className="text-xs font-extrabold text-ink mt-0.5">{formatShortRupiah(totalRemainingBudget)}</p>
                </div>
              </div>
            </div>

            {/* Pos Anggaran Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink">Daftar Item Pengeluaran</span>
              <button
                onClick={handleOpenNewItem}
                className="px-3.5 py-1.5 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={15} />
                <span>Tambah Item</span>
              </button>
            </div>

            {/* Items grouped or listed */}
            <div className="space-y-3">
              {activeItems.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-blush text-ink/60 text-xs">
                  Belum ada item pengeluaran. Ketuk &quot;+ Tambah Item&quot; untuk mencatat.
                </div>
              ) : (
                activeItems.map((item: any) => {
                  const pos = (data?.categories || []).find((c: any) => c.id === item.posId);
                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-3xl bg-white border border-blush shadow-soft space-y-2 hover:border-rose/30 transition-all text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mb-1"
                            style={{ backgroundColor: pos?.color ? `${pos.color}30` : '#FFE4EE', color: '#5A1633' }}
                          >
                            {pos?.name || 'Umum'} · {item.category}
                          </span>
                          <h4 className="font-bold text-ink text-xs leading-snug">{item.name}</h4>
                        </div>

                        <StatusBadge
                          status={item.paymentStatus === 'lunas' ? 'selesai' : item.paymentStatus === 'sebagian' ? 'proses' : 'belum'}
                          customLabel={item.paymentStatus === 'lunas' ? 'Lunas' : item.paymentStatus === 'sebagian' ? 'Sebagian' : 'Belum'}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-blush/60 text-ink">
                        <div>
                          <span className="text-[10px] text-ink/60 block">Estimasi / Aktual</span>
                          <span className="font-extrabold">
                            {formatRupiah(item.estimate || 0)}
                            {item.actual > 0 ? ` · ${formatRupiah(item.actual)}` : ''}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="px-2.5 py-1 rounded-full bg-blush text-rose font-bold text-[11px] hover:bg-rose hover:text-white transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-ink/40 hover:text-rose transition-colors"
                            aria-label="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: DETAIL MAHAR (SECTION 9.3 A)                            */}
        {/* ============================================================== */}
        {activeTab === 'mahar' && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider">Kesiapan Mahar &amp; Mas Kawin</h3>
                <StatusBadge status={data?.mahar?.status || 'belum'} size="sm" />
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-ink mb-1">Bentuk Mahar Utama:</label>
                  <select
                    value={data?.mahar?.formType || 'emas'}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        mahar: { ...data.mahar, formType: e.target.value },
                      };
                      triggerAutoSave(updated);
                    }}
                    className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
                  >
                    <option value="emas">Logam Mulia / Emas Batangan</option>
                    <option value="uang">Uang Tunai / Mata Uang Khusus</option>
                    <option value="alat_salat">Seperangkat Alat Salat</option>
                    <option value="lainnya">Saham / Hafalan Qur’an / Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Rincian &amp; Nominal / Gram:</label>
                  <input
                    type="text"
                    value={data?.mahar?.description || ''}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        mahar: { ...data.mahar, description: e.target.value },
                      };
                      triggerAutoSave(updated);
                    }}
                    placeholder="misal: 10 Gram Emas Antam + Seperangkat Alat Salat"
                    className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-ink mb-1">Nilai Taksiran (Rp):</label>
                    <input
                      type="number"
                      value={data?.mahar?.value || 0}
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          mahar: { ...data.mahar, value: Number(e.target.value) },
                        };
                        triggerAutoSave(updated);
                      }}
                      className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink mb-1">Status Disiapkan:</label>
                    <select
                      value={data?.mahar?.status || 'belum'}
                      onChange={(e) => {
                        const updated = {
                          ...data,
                          mahar: { ...data.mahar, status: e.target.value },
                        };
                        triggerAutoSave(updated);
                      }}
                      className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
                    >
                      <option value="belum">Belum Dibeli</option>
                      <option value="proses">Proses Beli / Hias</option>
                      <option value="siap">Siap &amp; Dikemas Rapi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1">Catatan Khusus Mahar:</label>
                  <textarea
                    rows={2}
                    value={data?.mahar?.notes || ''}
                    onChange={(e) => {
                      const updated = {
                        ...data,
                        mahar: { ...data.mahar, notes: e.target.value },
                      };
                      triggerAutoSave(updated);
                    }}
                    placeholder="Bingkai mahar custom akrilik dengan ukiran nama pengantin..."
                    className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: SUMBER DANA & SARAN TABUNGAN BULANAN (SECTION 9.3 A)    */}
        {/* ============================================================== */}
        {activeTab === 'dana' && (
          <div className="space-y-4">
            {/* Monthly Savings Suggestion Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-blush via-white to-sky/40 border border-blush shadow-soft space-y-3">
              <div className="flex items-center gap-2 text-rose">
                <Wallet size={18} />
                <h3 className="text-xs font-extrabold uppercase tracking-wider">Kalkulator Tabungan Menuju Akad</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-3 bg-white rounded-2xl border border-blush">
                  <p className="text-[10px] text-ink/70">Total Dana Terkumpul</p>
                  <p className="text-sm font-extrabold text-ink mt-0.5">{formatRupiah(totalFundsCollected)}</p>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-blush">
                  <p className="text-[10px] text-ink/70">Kekurangan Dana</p>
                  <p className={`text-sm font-extrabold mt-0.5 ${fundDeficit > 0 ? 'text-rose' : 'text-ink'}`}>
                    {fundDeficit > 0 ? formatRupiah(fundDeficit) : 'Tercukupi ✅'}
                  </p>
                </div>
              </div>

              {fundDeficit > 0 && (
                <div className="p-3.5 rounded-2xl bg-white border border-rose/30 shadow-xs">
                  <p className="text-[11px] font-bold text-ink flex items-center justify-between">
                    <span>Target Tabungan Per Bulan:</span>
                    <span className="text-rose font-black text-sm">{formatRupiah(monthlySavingsTarget)} / bln</span>
                  </p>
                  <p className="text-[10px] text-ink/65 mt-1">
                    Berdasarkan estimasi sisa waktu {monthsLeft} bulan menuju tanggal target akad pernikahan Anda.
                  </p>
                </div>
              )}
            </div>

            {/* List of Funding Sources */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink">Daftar Sumber Dana</span>
              <button
                onClick={() => {
                  setFundName('');
                  setFundCategory('tabungan_pria');
                  setFundAmount(5000000);
                  setFundTarget(10000000);
                  setFundingSheetOpen(true);
                }}
                className="px-3 py-1.5 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1 shadow-sm hover:scale-105 active:scale-95 transition-all"
              >
                <Plus size={15} />
                <span>Tambah Sumber</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {activeFunds.map((fund: any) => (
                <div
                  key={fund.id}
                  className="p-3.5 rounded-2xl bg-white border border-blush shadow-soft flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-ink">{fund.name}</h4>
                    <p className="text-[10px] text-ink/60 capitalize mt-0.5">
                      Kategori: {fund.category.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-ink">{formatRupiah(fund.amount)}</p>
                    {fund.targetAmount > fund.amount && (
                      <p className="text-[10px] text-ink/60">Target: {formatRupiah(fund.targetAmount)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 4: TRACKER VENDOR & CASHFLOW (SECTION 9.3 B)               */}
        {/* ============================================================== */}
        {activeTab === 'vendor' && (
          <div className="space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-ink">Tagihan Vendor Terjadwal</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="px-3 py-1.5 bg-blush text-rose font-bold text-xs rounded-full flex items-center gap-1.5 hover:bg-rose hover:text-white transition-all shadow-xs"
                >
                  <Download size={13} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={handleOpenNewVendor}
                  className="px-3.5 py-1.5 bg-rose text-white font-bold text-xs rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <Plus size={15} />
                  <span>Tambah Vendor</span>
                </button>
              </div>
            </div>

            {/* Vendor Cards List */}
            <div className="space-y-3">
              {enrichedVendors.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-blush text-ink/60 text-xs">
                  Belum ada vendor terdaftar. Tambahkan vendor katering, dekorasi, atau MUA.
                </div>
              ) : (
                enrichedVendors.map((vendor: any) => (
                  <div
                    key={vendor.id}
                    className="p-4 rounded-3xl bg-white border border-blush shadow-soft space-y-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky text-ink mb-1 inline-block">
                          {vendor.category}
                        </span>
                        <h4 className="font-bold text-ink text-sm leading-snug">{vendor.name}</h4>
                        {vendor.contact && <p className="text-[11px] text-ink/65 mt-0.5">Kontak: {vendor.contact}</p>}
                      </div>

                      <StatusBadge status={vendor.computedStatus} size="sm" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 bg-neutral-50 rounded-2xl text-center">
                      <div>
                        <p className="text-[10px] text-ink/60">Total Biaya</p>
                        <p className="font-extrabold text-ink mt-0.5">{formatShortRupiah(vendor.total)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-ink/60">Terbayar</p>
                        <p className="font-extrabold text-ink mt-0.5">{formatShortRupiah(vendor.paid)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-rose font-medium">Sisa Tagihan</p>
                        <p className="font-extrabold text-rose mt-0.5">{formatShortRupiah(vendor.remaining)}</p>
                      </div>
                    </div>

                    {vendor.dueDate && (
                      <p className="text-[11px] text-ink/75 flex items-center gap-1">
                        <Clock size={13} className="text-rose" />
                        <span>Jatuh Tempo: <strong>{formatDateIndo(vendor.dueDate)}</strong></span>
                      </p>
                    )}

                    {/* Payment History and Action */}
                    <div className="pt-2 border-t border-blush/60 flex items-center justify-between">
                      <span className="text-[11px] text-ink/70">
                        {vendor.payments?.length || 0} termin pembayaran
                      </span>

                      <button
                        onClick={() => {
                          setSelectedVendorForPayment(vendor);
                          setPayAmount(vendor.remaining > 0 ? vendor.remaining : 1000000);
                          setPayDate(new Date().toISOString().split('T')[0]);
                          setPayNote(`Termin ${(vendor.payments?.length || 0) + 1}`);
                          setPayProofFileId(undefined);
                          setPaymentSheetOpen(true);
                        }}
                        className="px-3 py-1 bg-rose text-white font-bold text-xs rounded-full shadow-xs hover:scale-105 active:scale-95 transition-all"
                      >
                        + Catat Bayar / DP
                      </button>
                    </div>

                    {/* Payment history listing if any */}
                    {vendor.payments && vendor.payments.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {vendor.payments.map((p: any) => (
                          <div key={p.id} className="p-2 rounded-xl bg-blush/20 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-semibold text-ink">{p.note || 'Pembayaran'}</span>
                              <span className="text-ink/60 block text-[10px]">{formatDateIndo(p.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-ink">{formatRupiah(p.amount)}</span>
                              {p.proofFileId && (
                                <a
                                  href={`/api/files/${p.proofFileId}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] text-rose font-bold underline"
                                >
                                  Bukti
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sheet: Add / Edit Item Anggaran */}
      <BottomSheet isOpen={itemSheetOpen} onClose={() => setItemSheetOpen(false)} title="Item Anggaran">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Pos Anggaran:</label>
            <select
              value={itemPosId}
              onChange={(e) => setItemPosId(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
            >
              {(data?.categories || []).map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Nama Kebutuhan / Pengeluaran:</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="misal: Sewa Gedung Serbaguna"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Estimasi Biaya (Rp):</label>
              <input
                type="number"
                value={itemEstimate}
                onChange={(e) => setItemEstimate(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Pengeluaran Aktual (Rp):</label>
              <input
                type="number"
                value={itemActual}
                onChange={(e) => setItemActual(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Status Pembayaran:</label>
            <select
              value={itemStatus}
              onChange={(e) => setItemStatus(e.target.value as any)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
            >
              <option value="belum">Belum Dibayar</option>
              <option value="sebagian">Sebagian / DP Terbayar</option>
              <option value="lunas">Lunas Sepenuhnya</option>
            </select>
          </div>

          <button
            onClick={handleSaveItem}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Item Anggaran
          </button>
        </div>
      </BottomSheet>

      {/* Sheet: Add Vendor */}
      <BottomSheet isOpen={vendorSheetOpen} onClose={() => setVendorSheetOpen(false)} title="Data Vendor Baru">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Nama Vendor:</label>
            <input
              type="text"
              required
              value={vName}
              onChange={(e) => setVName(e.target.value)}
              placeholder="misal: Katering Berkah Rasa"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Kategori:</label>
              <select
                value={vCategory}
                onChange={(e) => setVCategory(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="Katering">Katering</option>
                <option value="Dekorasi">Dekorasi</option>
                <option value="MUA & Busana">MUA &amp; Busana</option>
                <option value="Foto & Video">Foto &amp; Video</option>
                <option value="Gedung / Venue">Gedung / Venue</option>
                <option value="Undangan & Souvenir">Undangan &amp; Souvenir</option>
                <option value="Sound & Hiburan">Sound &amp; Musik</option>
                <option value="MC & Penghulu">MC &amp; Acara</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Kontak HP / WA:</label>
              <input
                type="text"
                value={vContact}
                onChange={(e) => setVContact(e.target.value)}
                placeholder="0812xxxx"
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Total Nilai Kontrak (Rp):</label>
              <input
                type="number"
                value={vTotal}
                onChange={(e) => setVTotal(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Jatuh Tempo Pelunasan:</label>
              <input
                type="date"
                value={vDueDate}
                onChange={(e) => setVDueDate(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Catatan Kontrak:</label>
            <textarea
              rows={2}
              value={vNotes}
              onChange={(e) => setVNotes(e.target.value)}
              placeholder="Termin 1 DP 20%, Termin 2 H-30 50%, Pelunasan H-7..."
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink resize-none"
            />
          </div>

          <button
            onClick={handleSaveVendor}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Vendor
          </button>
        </div>
      </BottomSheet>

      {/* Sheet: Add Payment Term with Proof Upload */}
      <BottomSheet isOpen={paymentSheetOpen} onClose={() => setPaymentSheetOpen(false)} title={`Catat Pembayaran: ${selectedVendorForPayment?.name || ''}`}>
        <div className="space-y-3 pb-6 text-xs">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Nominal Bayar (Rp):</label>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Tanggal Transfer:</label>
              <input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Keterangan Termin:</label>
            <input
              type="text"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              placeholder="misal: DP 30% Booking Tanggal Gedung"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Upload Bukti Transfer (Opsional):</label>
            <div className="p-3 border-2 border-dashed border-blush rounded-2xl text-center">
              {payProofFileId ? (
                <p className="text-rose font-bold text-xs">✅ Bukti Transfer Terlampir</p>
              ) : (
                <label className="cursor-pointer block text-ink/70">
                  <Upload size={20} className="mx-auto text-rose mb-1" />
                  <span>Pilih foto resi / tangkapan layar m-Banking</span>
                  <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleProofUpload} />
                </label>
              )}
            </div>
          </div>

          <button
            onClick={handleAddPaymentTerm}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Pembayaran
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function BudgetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-rose" /></div>}>
      <BudgetContent />
    </Suspense>
  );
}
