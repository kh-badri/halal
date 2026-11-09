'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { BottomSheet } from './BottomSheet';
import { DollarSign, Users, Gift, CheckSquare, BookOpen, PlusCircle } from 'lucide-react';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionKey: 'expense' | 'guest' | 'gift' | 'task' | 'note') => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  const actions = [
    {
      key: 'expense' as const,
      title: 'Tambah Pengeluaran / Tagihan',
      desc: 'Catat pengeluaran baru atau termin vendor',
      icon: DollarSign,
      color: 'bg-blush border border-ink text-ink',
      action: () => {
        onClose();
        router.push('/budget?action=new-item');
      },
    },
    {
      key: 'guest' as const,
      title: 'Tambah Tamu Undangan',
      desc: 'Masukkan daftar undangan dan kuota pax katering',
      icon: Users,
      color: 'bg-sky border border-ink text-ink',
      action: () => {
        onClose();
        router.push('/hari-h?action=new-guest');
      },
    },
    {
      key: 'gift' as const,
      title: 'Tambah Item Seserahan',
      desc: 'Simpan daftar seserahan atau link toko',
      icon: Gift,
      color: 'bg-blush border border-ink text-ink',
      action: () => {
        onClose();
        router.push('/khitbah?action=new-gift');
      },
    },
    {
      key: 'task' as const,
      title: 'Tambah Tugas Baru',
      desc: 'Buat to-do persiapan nikah dengan tenggat waktu',
      icon: CheckSquare,
      color: 'bg-sky border border-ink text-ink',
      action: () => {
        onClose();
        router.push('/modul/tugas?action=new-task');
      },
    },
    {
      key: 'note' as const,
      title: 'Tambah Catatan / Refleksi',
      desc: 'Tuliskan catatan, hasil diskusi, atau doa',
      icon: BookOpen,
      color: 'bg-white border border-ink text-ink',
      action: () => {
        onClose();
        router.push('/modul/doa?action=new-note');
      },
    },
  ];

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Aksi Cepat">
      <div className="space-y-2.5 pb-6">
        <p className="text-xs text-ink/75 mb-2">Pilih data yang ingin Anda tambahkan langsung:</p>
        {actions.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={item.action}
              className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white border-2 border-ink hover:bg-neutral-50 active:scale-[0.98] transition-all text-left shadow-subtle"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-ink truncate">{item.title}</h4>
                <p className="text-[11px] text-ink/70 truncate">{item.desc}</p>
              </div>
              <PlusCircle size={16} className="text-ink/60 shrink-0" />
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
};
