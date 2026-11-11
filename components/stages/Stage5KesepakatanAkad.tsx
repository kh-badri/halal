'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Coins,
  Gem,
  Plus,
  Trash2,
  Calendar,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  PiggyBank,
  ChevronDown,
  ChevronUp,
  Edit2,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/formatters';

interface Stage5Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage5KesepakatanAkad({ workspaceId, isReadOnly, onDataChanged }: Stage5Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<any>(null);
  const [targetDate, setTargetDate] = useState<string>('');
  const [expandedPos, setExpandedPos] = useState<Record<string, boolean>>({
    mahar: true,
    akad_walimah: true,
  });

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch('/api/m/budget'),
          fetch('/api/m/settings'),
        ]);

        if (bRes.ok) {
          const bJson = await bRes.json();
          setBudgetData(bJson.data || bJson);
        }
        if (sRes.ok) {
          const sJson = await sRes.json();
          const sData = sJson.data || sJson;
          if (sData?.targetDate) {
            setTargetDate(sData.targetDate);
          }
        }
      } catch (err) {
        console.error('Error loading Stage 5 data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveBudget = (newData: any, immediate = false) => {
    setBudgetData(newData);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/budget', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (e) {
        console.error('Failed to save budget:', e);
      }
    }, immediate ? 20 : 300);
  };

  // Calculations
  const categories = budgetData?.categories || [];
  const items = (budgetData?.items || []).filter((i: any) => !i.deletedAt);
  const fundingSources = (budgetData?.fundingSources || []).filter((f: any) => !f.deletedAt);

  const totalTargetBudget = useMemo(() => {
    return categories.reduce((sum: number, c: any) => sum + (c.targetBudget || 0), 0);
  }, [categories]);

  const totalActual = useMemo(() => {
    return items.reduce((sum: number, i: any) => sum + (i.actual || 0), 0);
  }, [items]);

  const totalFundingSaved = useMemo(() => {
    return fundingSources.reduce((sum: number, f: any) => sum + (f.amount || 0), 0);
  }, [fundingSources]);

  const totalFundingTarget = useMemo(() => {
    return fundingSources.reduce((sum: number, f: any) => sum + (f.targetAmount || f.amount || 0), 0);
  }, [fundingSources]);

  // Months to akad calculator
  const monthsUntilAkad = useMemo(() => {
    const akad = budgetData?.agreement?.akadDate || targetDate;
    if (!akad) return null;
    const now = new Date();
    const target = new Date(akad);
    const diffMonths = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
    return diffMonths > 0 ? diffMonths : 1;
  }, [budgetData?.agreement?.akadDate, targetDate]);

  const monthlySavingsNeeded = useMemo(() => {
    if (!monthsUntilAkad) return null;
    const remaining = Math.max(0, totalTargetBudget - totalFundingSaved);
    return Math.round(remaining / monthsUntilAkad);
  }, [totalTargetBudget, totalFundingSaved, monthsUntilAkad]);

  // Donut chart segments
  const colors = ['#1F6FDB', '#9FD3FF', '#9BE7CC', '#FFC8A2', '#CBE6FF', '#7589A1'];
  let cumulativeAngle = 0;
  const donutSegments = categories.map((cat: any, idx: number) => {
    const value = cat.targetBudget || 1;
    const share = totalTargetBudget > 0 ? value / totalTargetBudget : 1 / categories.length;
    const strokeDasharray = `${share * 282.7} 282.7`;
    const strokeDashoffset = -cumulativeAngle * 2.827;
    cumulativeAngle += share * 100;
    return {
      id: cat.id,
      name: cat.name,
      value,
      color: colors[idx % colors.length],
      strokeDasharray,
      strokeDashoffset,
    };
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-azure/20 border-t-azure animate-spin" />
        <p className="text-xs font-bold text-slate-500">Memuat Kesepakatan Akad &amp; Anggaran...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Donut Chart & Budget Overview Card */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
              Ringkasan Anggaran
            </span>
            <h3 className="text-base font-extrabold text-navy-900 mt-1">Alokasi Pos &amp; Target</h3>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {categories.length} Pos Terdaftar
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 pt-2">
          {/* Donut Chart SVG (PRD 8.9 C11) */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#E6F3FF"
                strokeWidth="10"
              />
              {donutSegments.map((seg: any) => (
                <circle
                  key={seg.id}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="10"
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  className="transition-all duration-700"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Target</span>
              <span className="text-xs font-extrabold text-navy-900 font-display">
                {formatCurrency(totalTargetBudget)}
              </span>
            </div>
          </div>

          {/* Pos Legend List */}
          <div className="flex-1 w-full space-y-2">
            {donutSegments.map((seg: any) => (
              <div key={seg.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                  <span className="font-bold text-navy-900 truncate max-w-[140px]">{seg.name}</span>
                </div>
                <span className="font-extrabold text-slate-700">{formatCurrency(seg.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Kartu Mahar Khusus (PRD 8.9 & 9.5) */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-peach-100 border border-peach-300 text-navy-900 flex items-center justify-center shrink-0">
              <Gem size={18} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-navy-900">Mahar &amp; Mas Kawin</h4>
              <p className="text-[11px] text-slate-500">Bentuk dan kesepakatan mahar pernikahan</p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              budgetData?.mahar?.status === 'siap'
                ? 'bg-mint-100 text-mint-700 border-mint-300'
                : 'bg-peach-100 text-navy-900 border-peach-300'
            }`}
          >
            {budgetData?.mahar?.status === 'siap' ? 'Sudah Siap' : 'Dalam Persiapan'}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Bentuk Mahar <span className="text-coral-500">*</span>
              </label>
              <select
                disabled={isReadOnly}
                value={budgetData?.mahar?.formType || 'uang'}
                onChange={(e) =>
                  saveBudget({
                    ...budgetData,
                    mahar: { ...budgetData?.mahar, formType: e.target.value },
                  })
                }
                className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
              >
                <option value="uang">Uang Tunai</option>
                <option value="emas">Logam Mulia / Emas</option>
                <option value="alat_salat">Seperangkat Alat Salat</option>
                <option value="lainnya">Bentuk Lainnya</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy-900 mb-1">
                Estimasi Nilai / Gram <span className="text-coral-500">*</span>
              </label>
              <input
                type="number"
                disabled={isReadOnly}
                value={budgetData?.mahar?.value || ''}
                onChange={(e) =>
                  saveBudget({
                    ...budgetData,
                    mahar: { ...budgetData?.mahar, value: Number(e.target.value) },
                  })
                }
                placeholder="misal: 10000000"
                className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">
              Rincian / Deskripsi Mahar <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={budgetData?.mahar?.description || ''}
              onChange={(e) =>
                saveBudget({
                  ...budgetData,
                  mahar: { ...budgetData?.mahar, description: e.target.value },
                })
              }
              placeholder="Contoh: Logam mulia 10 gram dan seperangkat alat salat"
              className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-navy-900">Status Kesiapan Fisik Mahar</span>
            <button
              type="button"
              disabled={isReadOnly}
              onClick={() => {
                const nextStatus = budgetData?.mahar?.status === 'siap' ? 'belum' : 'siap';
                saveBudget({
                  ...budgetData,
                  mahar: { ...budgetData?.mahar, status: nextStatus },
                }, true);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold transition-all border ${
                budgetData?.mahar?.status === 'siap'
                  ? 'bg-mint-300 text-mint-700 border-mint-400'
                  : 'bg-white text-slate-600 border-line hover:border-azure'
              }`}
            >
              {budgetData?.mahar?.status === 'siap' ? '✓ Mahar Siap' : 'Tandai Siap'}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Pos Anggaran Detail & Target Pos */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins size={18} className="text-azure-600" />
            <h4 className="text-sm font-extrabold text-navy-900">Target Anggaran per Pos</h4>
          </div>
          <span className="text-xs text-slate-500 font-bold">Wajib diisi</span>
        </div>

        <div className="space-y-3">
          {categories.map((cat: any) => (
            <div key={cat.id} className="p-3.5 rounded-2xl bg-mist border border-line space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-navy-900">{cat.name}</span>
                <span className="text-xs font-extrabold text-azure-700">
                  {formatCurrency(cat.targetBudget || 0)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500 shrink-0">Ubah Target:</span>
                <input
                  type="number"
                  disabled={isReadOnly}
                  value={cat.targetBudget || ''}
                  onChange={(e) => {
                    const newCategories = categories.map((c: any) =>
                      c.id === cat.id ? { ...c, targetBudget: Number(e.target.value) } : c
                    );
                    saveBudget({ ...budgetData, categories: newCategories });
                  }}
                  className="flex-1 h-9 px-3 text-xs bg-white border border-line rounded-xl font-bold focus:border-azure outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Sumber Dana & Kalkulator Tabungan Bulanan (Callout Peach 100 per PRD 8.9) */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-100 border border-sky-200 text-azure-700 flex items-center justify-center shrink-0">
              <PiggyBank size={18} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-navy-900">Sumber Dana &amp; Tabungan</h4>
              <p className="text-[11px] text-slate-500">
                Terkumpul: {formatCurrency(totalFundingSaved)} / Target: {formatCurrency(totalTargetBudget)}
              </p>
            </div>
          </div>
        </div>

        {/* Callout Peach 100: Saran Tabungan per Bulan (PRD Section 8.9) */}
        {monthlySavingsNeeded !== null && monthlySavingsNeeded > 0 && (
          <div className="p-4 rounded-2xl bg-peach-100 border border-peach-300 text-navy-900 space-y-1 shadow-xs">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-navy-900" />
              <span className="text-xs font-extrabold uppercase tracking-wider">
                Saran Tabungan Bersama
              </span>
            </div>
            <p className="text-xs leading-relaxed">
              Dengan sisa waktu <strong>{monthsUntilAkad} bulan</strong> menuju akad, disarankan menabung{' '}
              <strong className="text-sm font-extrabold underline font-display">
                {formatCurrency(monthlySavingsNeeded)} / bulan
              </strong>{' '}
              agar target anggaran pernikahan tercapai tanpa beban mendadak di akhir.
            </p>
          </div>
        )}

        {/* Funding sources list */}
        <div className="space-y-2 pt-1">
          {fundingSources.map((source: any) => (
            <div
              key={source.id}
              className="p-3 rounded-2xl bg-mist border border-line flex items-center justify-between text-xs"
            >
              <div>
                <p className="font-extrabold text-navy-900">{source.name}</p>
                <p className="text-[11px] text-slate-500 capitalize">
                  {source.category.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-mint-700">{formatCurrency(source.amount || 0)}</span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = fundingSources.filter((s: any) => s.id !== source.id);
                      saveBudget({ ...budgetData, fundingSources: updated }, true);
                    }}
                    className="w-7 h-7 rounded-lg bg-white border border-line text-slate-400 hover:text-coral-500 flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                const name = prompt('Nama sumber dana (misal: Tabungan Bersama):');
                if (!name) return;
                const amount = Number(prompt('Nominal saat ini (angka saja):') || '0');
                const newSource = {
                  id: `fund_${Date.now()}`,
                  name,
                  category: 'tabungan_pria',
                  amount,
                  targetAmount: amount,
                  createdAt: new Date().toISOString(),
                };
                saveBudget({
                  ...budgetData,
                  fundingSources: [...fundingSources, newSource],
                }, true);
              }}
              className="w-full py-2.5 rounded-2xl border border-dashed border-azure/40 text-azure-700 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-sky-50 active:scale-95 transition-all"
            >
              <Plus size={14} />
              <span>Tambah Sumber Dana</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Kesepakatan Tanggal Akad & Wali Nasab (PRD Section 9.5) */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-mint-100 border border-mint-300 text-mint-700 flex items-center justify-center shrink-0">
            <UserCheck size={18} />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-navy-900">Kesepakatan Akad &amp; Wali Nasab</h4>
            <p className="text-[11px] text-slate-500">Persetujuan prinsip tanggal dan perwalian</p>
          </div>
        </div>

        <div className="space-y-3.5 pt-1">
          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">
              Tanggal Akad Nikah <span className="text-coral-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="date"
                disabled={isReadOnly}
                value={budgetData?.agreement?.akadDate || targetDate || ''}
                onChange={(e) =>
                  saveBudget({
                    ...budgetData,
                    agreement: { ...budgetData?.agreement, akadDate: e.target.value },
                  })
                }
                className="w-full h-11 pl-10 pr-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-navy-900 mb-1">
              Nama Lengkap Wali Nasab <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              disabled={isReadOnly}
              value={budgetData?.agreement?.waliNasab || ''}
              onChange={(e) =>
                saveBudget({
                  ...budgetData,
                  agreement: { ...budgetData?.agreement, waliNasab: e.target.value },
                })
              }
              placeholder="Contoh: H. Ahmad Subarjo (Ayah Kandung)"
              className="w-full h-11 px-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
            />
          </div>

          {/* Persetujuan kedua keluarga checkbox */}
          <label className="flex items-start gap-3 p-3.5 bg-sky-50 rounded-2xl border border-sky-200 cursor-pointer">
            <input
              type="checkbox"
              disabled={isReadOnly}
              checked={Boolean(budgetData?.agreement?.familyConsent)}
              onChange={(e) =>
                saveBudget({
                  ...budgetData,
                  agreement: { ...budgetData?.agreement, familyConsent: e.target.checked },
                }, true)
              }
              className="w-5 h-5 rounded-lg border-2 border-azure accent-azure text-azure mt-0.5"
            />
            <div>
              <span className="text-xs font-extrabold text-navy-900 block">
                Persetujuan Kedua Keluarga
              </span>
              <span className="text-[11px] text-slate-600 leading-tight block mt-0.5">
                Kedua belah pihak dan keluarga telah merestui tanggal akad nikah, alokasi anggaran, dan susunan mahar di atas.
              </span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
