'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  Store,
  UserCheck,
  Plus,
  Trash2,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Search,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { formatCurrency } from '@/lib/utils/formatters';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface Stage7Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage7PersiapanWalimah({ workspaceId, isReadOnly, onDataChanged }: Stage7Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'vendor' | 'tamu' | 'panitia'>('vendor');
  const [budgetData, setBudgetData] = useState<any>(null);
  const [harihData, setHarihData] = useState<any>(null);

  const [searchGuest, setSearchGuest] = useState('');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [bRes, hRes] = await Promise.all([
          fetch('/api/m/budget'),
          fetch('/api/m/harih'),
        ]);

        if (bRes.ok) {
          const bJson = await bRes.json();
          setBudgetData(bJson.data || bJson);
        }
        if (hRes.ok) {
          const hJson = await hRes.json();
          setHarihData(hJson.data || hJson);
        }
      } catch (err) {
        console.error('Error loading Stage 7 data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveBudget = (newData: any) => {
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
    }, 250);
  };

  const saveHariH = (newData: any) => {
    setHarihData(newData);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/m/harih', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData),
        });
        showSaveIndicator();
        onDataChanged?.();
      } catch (e) {
        console.error('Failed to save harih data:', e);
      }
    }, 250);
  };

  // Vendor data
  const vendors = (budgetData?.vendors || []).filter((v: any) => !v.deletedAt);
  const totalVendorBill = useMemo(() => {
    return vendors.reduce((sum: number, v: any) => sum + (v.total || 0), 0);
  }, [vendors]);

  const totalVendorPaid = useMemo(() => {
    return vendors.reduce((sum: number, v: any) => {
      const paid = (v.payments || []).reduce((pSum: number, p: any) => pSum + (p.amount || 0), 0);
      return sum + paid;
    }, 0);
  }, [vendors]);

  // Guest data & catering gauge
  const guests = (harihData?.guests || []).filter((g: any) => !g.deletedAt);
  const maxCateringPax = harihData?.catering?.vendorTotalPax || 500;
  const currentTotalPax = useMemo(() => {
    return guests.reduce((sum: number, g: any) => sum + (g.pax || 1), 0);
  }, [guests]);

  const isExceededQuota = currentTotalPax > maxCateringPax;
  const quotaPercent = Math.min(Math.round((currentTotalPax / maxCateringPax) * 100), 100);

  // Committee data
  const committee = harihData?.committee || [];
  const waliMember = committee.find((c: any) => c.role?.toLowerCase().includes('wali'));
  const saksiMembers = committee.filter((c: any) => c.role?.toLowerCase().includes('saksi'));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-azure/20 border-t-azure animate-spin" />
        <p className="text-xs font-bold text-slate-500">Memuat Persiapan Walimah...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Segmented Navigation Tab */}
      <div className="flex items-center gap-1 p-1 bg-mist rounded-2xl border border-line">
        <button
          type="button"
          onClick={() => setActiveTab('vendor')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'vendor'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Vendor ({vendors.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tamu')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'tamu'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Tamu ({currentTotalPax} Pax)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('panitia')}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all ${
            activeTab === 'panitia'
              ? 'bg-azure text-white shadow-subtle'
              : 'text-slate-600 hover:text-navy-900'
          }`}
        >
          Panitia &amp; Saksi ({committee.length})
        </button>
      </div>

      {/* 1. TAB VENDOR */}
      {activeTab === 'vendor' && (
        <div className="space-y-4">
          {/* Vendor Cashflow Summary Card */}
          <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                  Cashflow Vendor
                </span>
                <h4 className="text-sm font-extrabold text-navy-900 mt-1">Pembayaran DP &amp; Pelunasan</h4>
              </div>
              <span className="text-xs font-extrabold text-mint-700">
                {totalVendorBill > 0 ? Math.round((totalVendorPaid / totalVendorBill) * 100) : 0}% Terbayar
              </span>
            </div>

            <div className="w-full bg-mist h-3 rounded-full overflow-hidden p-0.5 border border-line">
              <div
                className="h-full bg-azure rounded-full transition-all duration-500"
                style={{
                  width: `${totalVendorBill > 0 ? Math.min(100, Math.round((totalVendorPaid / totalVendorBill) * 100)) : 0}%`,
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Tagihan</span>
                <span className="text-sm font-extrabold text-navy-900 font-display">
                  {formatCurrency(totalVendorBill)}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-mint-100 border border-mint-300">
                <span className="text-[10px] font-bold text-mint-700 block uppercase">Total Terbayar</span>
                <span className="text-sm font-extrabold text-mint-700 font-display">
                  {formatCurrency(totalVendorPaid)}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor List */}
          <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-navy-900">Daftar Vendor Acara</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Nama Vendor (misal: Sakinah Catering):');
                    if (!name) return;
                    const category = prompt('Kategori (Katering / Dekorasi / MUA / Fotografi):') || 'Umum';
                    const total = Number(prompt('Total Biaya / Tagihan (angka saja):') || '0');
                    const dp = Number(prompt('Jumlah DP yang sudah dibayar:') || '0');

                    const newVendor = {
                      id: `v_${Date.now()}`,
                      name,
                      category,
                      total,
                      downPayment: dp,
                      payments: dp > 0 ? [{ id: `p_${Date.now()}`, date: new Date().toISOString(), amount: dp }] : [],
                      createdAt: new Date().toISOString(),
                    };
                    saveBudget({ ...budgetData, vendors: [...vendors, newVendor] });
                  }}
                  className="px-3 py-1.5 rounded-full bg-azure text-white text-xs font-extrabold flex items-center gap-1 shadow-subtle active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>Tambah Vendor</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5 pt-1">
              {vendors.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6 italic">
                  Belum ada vendor terdaftar. Tambahkan vendor katering, dekorasi, busana, atau dokumentasi.
                </p>
              ) : (
                vendors.map((v: any) => {
                  const paid = (v.payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
                  const isLunas = paid >= (v.total || 1);
                  const isDp = paid > 0 && !isLunas;

                  return (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-2xl bg-mist border border-line space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-extrabold text-navy-900 block">{v.name}</span>
                          <span className="text-[10px] text-slate-500">{v.category}</span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            isLunas
                              ? 'bg-mint-100 text-mint-700 border-mint-300'
                              : isDp
                              ? 'bg-sky-100 text-azure-700 border-sky-300'
                              : 'bg-coral-100 text-coral-700 border-coral-200'
                          }`}
                        >
                          {isLunas ? 'Lunas' : isDp ? 'DP Terbayar' : 'Belum DP'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-line">
                        <span className="text-slate-500">
                          Terbayar: <strong className="text-navy-900">{formatCurrency(paid)}</strong> / {formatCurrency(v.total || 0)}
                        </span>
                        {!isReadOnly && !isLunas && (
                          <button
                            type="button"
                            onClick={() => {
                              const payAmount = Number(prompt(`Masukkan nominal pembayaran untuk ${v.name}:`, String(v.total - paid)));
                              if (!payAmount) return;
                              const newPayment = { id: `p_${Date.now()}`, date: new Date().toISOString(), amount: payAmount };
                              const updatedVendors = vendors.map((item: any) =>
                                item.id === v.id ? { ...item, payments: [...(item.payments || []), newPayment] } : item
                              );
                              saveBudget({ ...budgetData, vendors: updatedVendors });
                            }}
                            className="px-2.5 py-1 rounded-xl bg-white border border-line font-extrabold text-azure-700 hover:bg-sky-50"
                          >
                            + Catat Bayar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. TAB TAMU (Gauge Setengah Lingkaran Kuota Katering per PRD 8.9) */}
      {activeTab === 'tamu' && (
        <div className="space-y-4">
          {/* Catering Quota Card with Semi-Circle Gauge */}
          <div
            className={`p-5 rounded-3xl border shadow-subtle transition-all ${
              isExceededQuota
                ? 'bg-coral-100/60 border-coral-500 animate-shake'
                : 'bg-white border-line'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
                  Kapasitas Katering &amp; Kursi
                </span>
                <h4 className="text-sm font-extrabold text-navy-900 mt-1">Kuota Tamu Undangan</h4>
              </div>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${
                  isExceededQuota
                    ? 'bg-coral-100 text-coral-700 border-coral-500'
                    : 'bg-mint-100 text-mint-700 border-mint-300'
                }`}
              >
                {isExceededQuota ? 'Melebihi Kuota!' : 'Aman'}
              </span>
            </div>

            {/* Gauge Display */}
            <div className="flex flex-col items-center justify-center pt-4">
              <div className="relative w-48 h-24 overflow-hidden flex items-end justify-center">
                <svg viewBox="0 0 100 50" className="w-full h-full">
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#E6F3FF"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke={isExceededQuota ? '#E5484D' : '#1F6FDB'}
                    strokeWidth="10"
                    strokeDasharray={`${(quotaPercent / 100) * 125.6} 125.6`}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute bottom-0 flex flex-col items-center">
                  <span
                    className={`text-2xl font-extrabold font-display leading-none ${
                      isExceededQuota ? 'text-coral-700' : 'text-navy-900'
                    }`}
                  >
                    {currentTotalPax}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    dari {maxCateringPax} Pax
                  </span>
                </div>
              </div>

              {isExceededQuota && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-coral-700 font-bold">
                  <AlertTriangle size={15} />
                  <span>Total pax melebihi kuota katering {maxCateringPax} pax!</span>
                </div>
              )}
            </div>

            {/* Ubah kuota max */}
            {!isReadOnly && (
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-line text-xs">
                <span className="text-slate-500 font-bold">Kapasitas Katering Vendor:</span>
                <input
                  type="number"
                  value={maxCateringPax}
                  onChange={(e) =>
                    saveHariH({
                      ...harihData,
                      catering: {
                        ...harihData?.catering,
                        vendorTotalPax: Number(e.target.value),
                      },
                    })
                  }
                  className="w-24 h-8 px-2 text-right bg-mist border border-line rounded-lg font-bold outline-none focus:border-azure"
                />
              </div>
            )}
          </div>

          {/* Guest List Card */}
          <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-navy-900">Daftar Tamu ({guests.length})</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const name = prompt('Nama Tamu / Keluarga:');
                    if (!name) return;
                    const pax = Number(prompt('Jumlah Pax (misal: 2):') || '1');
                    const group = prompt('Kelompok (Keluarga / Teman / Kolega):') || 'Umum';
                    const side = prompt('Pihak (pria / wanita):') || 'pria';

                    const newGuest = {
                      id: `g_${Date.now()}`,
                      name,
                      pax,
                      group,
                      side: side.toLowerCase().includes('wan') ? 'wanita' : 'pria',
                      status: 'diundang',
                      createdAt: new Date().toISOString(),
                    };
                    saveHariH({ ...harihData, guests: [...guests, newGuest] });
                  }}
                  className="px-3 py-1.5 rounded-full bg-azure text-white text-xs font-extrabold flex items-center gap-1 shadow-subtle active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>Tambah Tamu</span>
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                value={searchGuest}
                onChange={(e) => setSearchGuest(e.target.value)}
                placeholder="Cari nama tamu..."
                className="w-full h-10 pl-9 pr-3 text-xs bg-mist border border-line rounded-xl font-bold focus:border-azure focus:bg-white outline-none"
              />
            </div>

            <div className="divide-y divide-line/60">
              {guests
                .filter((g: any) => g.name?.toLowerCase().includes(searchGuest.toLowerCase()))
                .map((guest: any) => (
                  <div key={guest.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold text-navy-900">{guest.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {guest.pax || 1} Pax · {guest.group} · Pihak {guest.side}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={guest.status || 'belum'}
                        size="sm"
                        onClick={() => {
                          if (isReadOnly) return;
                          const nextStatus: Record<string, string> = {
                            belum: 'diundang',
                            diundang: 'konfirmasi',
                            konfirmasi: 'hadir',
                            hadir: 'belum',
                          };
                          const updated = guests.map((item: any) =>
                            item.id === guest.id ? { ...item, status: nextStatus[guest.status || 'belum'] } : item
                          );
                          saveHariH({ ...harihData, guests: updated });
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. TAB PANITIA & SAKSI (Syarat Stage 7) */}
      {activeTab === 'panitia' && (
        <div className="space-y-4">
          {/* Special Card: Wali Nasab & 2 Saksi Nikah (Syarat Selesai) */}
          <div className="bg-sky-50 border border-sky-200 rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck size={18} className="text-azure-700" />
              <div>
                <h4 className="text-sm font-extrabold text-navy-900">Peran Kunci: Wali &amp; Saksi Nikah</h4>
                <p className="text-[11px] text-slate-600">
                  Syarat sah akad nikah: 1 Wali Nasab &amp; minimal 2 Saksi Nikah terkonfirmasi
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="p-3 bg-white rounded-2xl border border-line flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-navy-900 block">Wali Nasab</span>
                  <span className="text-[11px] text-slate-500">
                    {waliMember?.personName || 'Belum ditugaskan'}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    waliMember?.isConfirmed
                      ? 'bg-mint-100 text-mint-700 border-mint-300'
                      : 'bg-peach-100 text-navy-900 border-peach-300'
                  }`}
                >
                  {waliMember?.isConfirmed ? '✓ Terkonfirmasi' : 'Belum Konfirmasi'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-line flex items-center justify-between text-xs">
                <div>
                  <span className="font-extrabold text-navy-900 block">Saksi Nikah (Minimal 2 Orang)</span>
                  <span className="text-[11px] text-slate-500">
                    {saksiMembers.length} Saksi terdaftar ({saksiMembers.filter((s: any) => s.isConfirmed).length} terkonfirmasi)
                  </span>
                </div>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    saksiMembers.length >= 2 && saksiMembers.every((s: any) => s.isConfirmed)
                      ? 'bg-mint-100 text-mint-700 border-mint-300'
                      : 'bg-peach-100 text-navy-900 border-peach-300'
                  }`}
                >
                  {saksiMembers.length >= 2 && saksiMembers.every((s: any) => s.isConfirmed)
                    ? '✓ Lengkap'
                    : 'Belum Lengkap'}
                </span>
              </div>
            </div>
          </div>

          {/* Committee List with Direct Phone / WA */}
          <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-navy-900">Susunan Panitia Keluarga</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const role = prompt('Peran Panitia (misal: Saksi Nikah 1 / Penerima Tamu / MC):');
                    if (!role) return;
                    const personName = prompt('Nama Petugas / Keluarga:') || '';
                    const phone = prompt('Nomor Telepon / WhatsApp:') || '';

                    const newMember = {
                      id: `c_${Date.now()}`,
                      role,
                      personName,
                      phone,
                      isConfirmed: true,
                      createdAt: new Date().toISOString(),
                    };
                    saveHariH({ ...harihData, committee: [...committee, newMember] });
                  }}
                  className="px-3 py-1.5 rounded-full bg-azure text-white text-xs font-extrabold flex items-center gap-1 shadow-subtle active:scale-95 transition-all"
                >
                  <Plus size={14} />
                  <span>Tambah Panitia</span>
                </button>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {committee.map((member: any) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-2xl bg-mist border border-line flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-extrabold text-navy-900 block">{member.role}</span>
                    <span className="text-[11px] text-slate-600">
                      {member.personName || 'Belum ada nama'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {member.phone && (
                      <>
                        <a
                          href={`tel:${member.phone}`}
                          className="w-8 h-8 rounded-xl bg-white border border-line text-azure-700 hover:bg-sky-50 flex items-center justify-center shadow-xs"
                          title="Telepon"
                        >
                          <Phone size={14} />
                        </a>
                        <a
                          href={`https://wa.me/${member.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-xl bg-white border border-line text-mint-700 hover:bg-mint-50 flex items-center justify-center shadow-xs"
                          title="WhatsApp"
                        >
                          <MessageCircle size={14} />
                        </a>
                      </>
                    )}

                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = committee.map((c: any) =>
                            c.id === member.id ? { ...c, isConfirmed: !c.isConfirmed } : c
                          );
                          saveHariH({ ...harihData, committee: updated });
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border transition-all ${
                          member.isConfirmed
                            ? 'bg-mint-100 text-mint-700 border-mint-300'
                            : 'bg-white text-slate-500 border-line'
                        }`}
                      >
                        {member.isConfirmed ? '✓ Siap' : 'Konfirmasi'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
