'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Heart,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Stage8Props {
  workspaceId: string;
  isReadOnly: boolean;
  onDataChanged?: () => void;
}

export function Stage8HariH({ workspaceId, isReadOnly, onDataChanged }: Stage8Props) {
  const { showToast, showSaveIndicator } = useToast();

  const [loading, setLoading] = useState(true);
  const [harihData, setHarihData] = useState<any>(null);
  const [celebrating, setCelebrating] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/m/harih');
        if (res.ok) {
          const json = await res.json();
          setHarihData(json.data || json);
        }
      } catch (err) {
        console.error('Error loading Stage 8 data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const saveHariH = (newData: any, immediate = false) => {
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
    }, immediate ? 20 : 300);
  };

  const checklistHMin1 = (harihData?.hMin1Checklist || []);
  const rundown = (harihData?.rundown || []);
  const isAkadDone = Boolean(harihData?.akadCompleted);

  const handleToggleHMin1 = (id: string, currentStatus: string) => {
    if (isReadOnly) return;
    const nextStatus = currentStatus === 'selesai' ? 'belum' : 'selesai';
    const updated = checklistHMin1.map((item: any) =>
      item.id === id ? { ...item, status: nextStatus, completed: nextStatus === 'selesai' } : item
    );
    saveHariH({ ...harihData, hMin1Checklist: updated }, true);
  };

  const handleMarkAkadDone = () => {
    if (isReadOnly) return;
    setCelebrating(true);
    setTimeout(() => setCelebrating(false), 2000);
    const nextDone = !isAkadDone;
    const today = new Date().toISOString().split('T')[0];
    saveHariH({
      ...harihData,
      akadCompleted: nextDone,
      akadDate: nextDone ? today : '',
    }, true);
    showToast(
      nextDone
        ? 'Alhamdulillah, Akad Nikah Terlaksana! Barakallahu Lakum.'
        : 'Status akad diubah.',
      'success'
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-3">
        <div className="w-10 h-10 rounded-full border-4 border-azure/20 border-t-azure animate-spin" />
        <p className="text-xs font-bold text-slate-500">Memuat Data Hari-H...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. Milestone Card: Penanda Akad Nikah Terlaksana (PRD 8.9 & 9.8) */}
      <div
        className={`p-6 rounded-3xl border text-center space-y-3 transition-all ${
          isAkadDone
            ? 'bg-aurora border-azure shadow-raised'
            : 'bg-white border-line shadow-subtle'
        }`}
      >
        <div className="w-14 h-14 mx-auto rounded-full bg-mint-100 border border-mint-300 text-mint-700 flex items-center justify-center shadow-subtle">
          <Heart size={26} className="fill-mint-300 text-mint-700 stroke-[2.5]" />
        </div>

        <div>
          <h3 className="text-lg font-extrabold text-navy-900 font-display">
            {isAkadDone ? 'Alhamdulillah, Akad Telah Terlaksana!' : 'Penanda Pelaksanaan Akad Nikah'}
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto leading-relaxed">
            {isAkadDone
              ? `Tercatat terlaksana pada ${harihData?.akadDate ? new Date(harihData.akadDate).toLocaleDateString('id-ID', { dateStyle: 'full' }) : 'Hari-H'}. Bismillah menuju keluarga sakinah mawaddah warahmah.`
              : 'Setelah ijab kabul dan doa selesai dipanjatkan, tandai akad nikah telah terlaksana untuk menyelesaikan tahap 8.'}
          </p>
        </div>

        {!isReadOnly && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleMarkAkadDone}
              className={`px-6 py-3 rounded-full text-xs font-extrabold shadow-subtle active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto ${
                isAkadDone
                  ? 'bg-mint-300 text-mint-700 border border-mint-400'
                  : 'bg-azure hover:bg-azure-700 text-white'
              }`}
            >
              <Check size={16} className="stroke-[3]" />
              <span>{isAkadDone ? 'Akad Terlaksana (Ketuk untuk batalkan)' : 'Tandai Akad Terlaksana'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Checklist H-1 (Kartu Centang Besar per PRD 8.9) */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-azure-700 bg-sky-100 px-2.5 py-0.5 rounded-full">
              Pengecekan Akhir
            </span>
            <h4 className="text-sm font-extrabold text-navy-900 mt-1">Checklist H-1 Pernikahan</h4>
          </div>
          <span className="text-xs font-bold text-mint-700">
            {checklistHMin1.filter((c: any) => c.status === 'selesai' || c.completed).length}/{checklistHMin1.length} Selesai
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {checklistHMin1.map((item: any) => {
            const isDone = item.status === 'selesai' || item.completed;
            return (
              <div
                key={item.id}
                onClick={() => handleToggleHMin1(item.id, item.status || 'belum')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isDone
                    ? 'bg-mint-50/70 border-mint-300'
                    : 'bg-mist border-line hover:border-azure/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                      isDone
                        ? 'bg-mint-300 border-mint-400 text-mint-700'
                        : 'bg-white border-line text-slate-400'
                    }`}
                  >
                    {isDone && <Check size={14} className="stroke-[3.5]" />}
                  </div>
                  <div>
                    <p
                      className={`text-xs ${
                        isDone ? 'font-bold text-navy-900 line-through opacity-80' : 'font-extrabold text-navy-900'
                      }`}
                    >
                      {item.task}
                    </p>
                    {item.pic && <p className="text-[10px] text-slate-500">PIC: {item.pic}</p>}
                  </div>
                </div>

                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                    isDone
                      ? 'bg-mint-100 text-mint-700 border-mint-300'
                      : 'bg-white text-slate-500 border-line'
                  }`}
                >
                  {isDone ? 'Selesai' : 'Belum'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Rundown Acara Hari-H Timeline */}
      <div className="bg-white border border-line rounded-3xl p-5 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-azure-600" />
            <h4 className="text-sm font-extrabold text-navy-900">Rundown Acara Hari-H</h4>
          </div>
          {!isReadOnly && (
            <button
              type="button"
              onClick={() => {
                const time = prompt('Jam Acara (misal: 08.00):') || '08:00';
                const title = prompt('Nama Agenda (misal: Akad Nikah & Ijab Kabul):');
                if (!title) return;
                const pic = prompt('Penanggung Jawab (PIC):') || '';

                const newItem = {
                  id: `r_${Date.now()}`,
                  time,
                  title,
                  pic,
                  createdAt: new Date().toISOString(),
                };
                saveHariH({ ...harihData, rundown: [...rundown, newItem] });
              }}
              className="px-3 py-1 rounded-full bg-azure text-white text-xs font-extrabold flex items-center gap-1 shadow-subtle active:scale-95 transition-all"
            >
              <Plus size={13} />
              <span>Tambah Jam</span>
            </button>
          )}
        </div>

        <div className="relative pl-6 space-y-4 pt-2">
          {/* Vertical timeline line */}
          <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-line" />

          {rundown.map((item: any, idx: number) => (
            <div key={item.id || idx} className="relative flex items-start gap-3 text-xs">
              {/* Dot */}
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-azure border-2 border-white ring-2 ring-azure/20" />
              <div className="flex-1 p-3 rounded-2xl bg-mist border border-line flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-azure-700 bg-sky-100 px-2 py-0.5 rounded-full inline-block mb-1">
                    {item.time} WIB
                  </span>
                  <p className="font-extrabold text-navy-900">{item.title}</p>
                  {item.pic && <p className="text-[11px] text-slate-500 mt-0.5">PIC: {item.pic}</p>}
                </div>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = rundown.filter((r: any) => r.id !== item.id);
                      saveHariH({ ...harihData, rundown: updated });
                    }}
                    className="w-7 h-7 rounded-lg bg-white border border-line text-slate-400 hover:text-coral-500 flex items-center justify-center"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
