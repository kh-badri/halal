'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Home, Plus, Trash2, CheckCircle2, ShoppingBag } from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { formatRupiah, formatShortRupiah } from '@/lib/utils/formatters';

export default function RumahTanggaPage() {
  const { showToast, showSaveIndicator } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);

  // Form State
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Kamar Tidur');
  const [itemEstimate, setItemEstimate] = useState(500000);
  const [itemStatus, setItemStatus] = useState<any>('direncanakan');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/m/extra');
        if (res.ok) setData((await res.json()).data);
      } catch (err) {
        console.error('Error loading extra:', err);
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

  const handleAddItem = () => {
    if (!itemName.trim()) return;
    const newItem = {
      id: `h-${Date.now()}`,
      category: itemCategory,
      item: itemName.trim(),
      estimate: itemEstimate,
      status: itemStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newItem, ...(data?.household || [])];
    triggerAutoSave({ ...data, household: updated });
    setItemName('');
    setItemSheetOpen(false);
    showToast({ message: 'Item perabot berhasil ditambahkan', type: 'success' });
  };

  const handleDeleteItem = (id: string) => {
    const updated = (data?.household || []).map((h: any) =>
      h.id === id ? { ...h, deletedAt: new Date().toISOString() } : h
    );
    triggerAutoSave({ ...data, household: updated });
    showToast({ message: 'Item dihapus', type: 'info' });
  };

  const activeItems = (data?.household || []).filter((h: any) => !h.deletedAt);
  const totalEstimate = activeItems.reduce((acc: number, h: any) => acc + (h.estimate || 0), 0);
  const boughtItems = activeItems.filter((h: any) => h.status === 'dibeli');

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Persiapan Rumah Tangga"
        subtitle="Rencana tempat tinggal, perabot esensial &amp; bulan pertama"
        backHref="/modul"
      />

      <div className="p-4 space-y-4">
        {/* Total Estimate Card */}
        <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-rose uppercase tracking-wider">Estimasi Perlengkapan Awal</p>
              <h3 className="text-base font-extrabold text-ink mt-0.5">
                {formatRupiah(totalEstimate)}
              </h3>
              <p className="text-[10px] text-ink/65 mt-0.5">
                {boughtItems.length} dari {activeItems.length} barang telah dibeli
              </p>
            </div>

            <button
              onClick={() => setItemSheetOpen(true)}
              className="px-3.5 py-2 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
            >
              <Plus size={15} />
              <span>Tambah Item</span>
            </button>
          </div>
        </div>

        {/* List of Items */}
        <div className="space-y-2.5">
          {activeItems.map((item: any) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-white border border-blush shadow-soft flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky text-ink inline-block mb-1">
                  {item.category}
                </span>
                <h4 className="font-bold text-ink text-sm leading-snug">{item.item}</h4>
                <p className="text-[11px] font-semibold text-rose mt-0.5">{formatRupiah(item.estimate)}</p>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge
                  status={item.status === 'dibeli' ? 'selesai' : item.status === 'proses' ? 'proses' : 'belum'}
                  customLabel={item.status === 'dibeli' ? 'Dibeli' : item.status === 'proses' ? 'Proses' : 'Rencana'}
                  size="sm"
                  onClick={() => {
                    const order = ['direncanakan', 'proses', 'dibeli'];
                    const nextIdx = (order.indexOf(item.status) + 1) % order.length;
                    const updated = (data?.household || []).map((h: any) =>
                      h.id === item.id ? { ...h, status: order[nextIdx] } : h
                    );
                    triggerAutoSave({ ...data, household: updated });
                  }}
                />

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 text-ink/40 hover:text-rose transition-colors"
                  aria-label="Hapus"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sheet: Add Household Item */}
      <BottomSheet isOpen={itemSheetOpen} onClose={() => setItemSheetOpen(false)} title="Tambah Perabot / Biaya Rumah Tangga">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Nama Barang / Pengeluaran:</label>
            <input
              type="text"
              required
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="misal: Set Sprei &amp; Bedcover Katun"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Kategori:</label>
              <select
                value={itemCategory}
                onChange={(e) => setItemCategory(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="Kamar Tidur">Kamar Tidur</option>
                <option value="Dapur">Dapur</option>
                <option value="Kebersihan">Kebersihan / Cuci</option>
                <option value="Ruang Tamu">Ruang Tamu</option>
                <option value="Operasional">Sewa / Operasional</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Estimasi Harga (Rp):</label>
              <input
                type="number"
                value={itemEstimate}
                onChange={(e) => setItemEstimate(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Status Kesiapan:</label>
            <select
              value={itemStatus}
              onChange={(e) => setItemStatus(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
            >
              <option value="direncanakan">Direncanakan</option>
              <option value="proses">Sedang Memilih / Proses</option>
              <option value="dibeli">Sudah Dibeli</option>
            </select>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Item
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
