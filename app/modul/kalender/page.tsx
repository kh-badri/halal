'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, Bookmark } from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDateIndo, daysUntil } from '@/lib/utils/formatters';

export default function KalenderPage() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<any>(null);
  const [khitbah, setKhitbah] = useState<any>(null);
  const [budget, setBudget] = useState<any>(null);
  const [kua, setKua] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [sRes, kRes, bRes, kuaRes] = await Promise.all([
          fetch('/api/m/settings'),
          fetch('/api/m/khitbah'),
          fetch('/api/m/budget'),
          fetch('/api/m/kua'),
        ]);

        if (sRes.ok) setSettings((await sRes.json()).data);
        if (kRes.ok) setKhitbah((await kRes.json()).data);
        if (bRes.ok) setBudget((await bRes.json()).data);
        if (kuaRes.ok) setKua((await kuaRes.json()).data);
      } catch (err) {
        console.error('Error loading calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const targetDateStr = settings?.targetDate;
  const daysLeft = targetDateStr ? daysUntil(targetDateStr) : null;

  // Aggregate all milestones
  const milestones: any[] = [];

  if (targetDateStr) {
    milestones.push({
      title: 'Hari-H Akad & Walimah',
      date: targetDateStr,
      category: 'Hari-H',
      color: 'bg-rose text-white',
      badge: 'Utama',
    });
  }

  if (khitbah?.eventDate) {
    milestones.push({
      title: 'Acara Lamaran / Khitbah Resmi',
      date: khitbah.eventDate,
      category: 'Khitbah',
      color: 'bg-blush text-rose',
      badge: 'Lamaran',
    });
  }

  if (kua?.bimwin?.date) {
    milestones.push({
      title: `Bimbingan Perkawinan (Bimwin) - ${kua.bimwin.method}`,
      date: kua.bimwin.date,
      category: 'KUA',
      color: 'bg-sky text-ink',
      badge: 'Bimwin',
    });
  }

  (budget?.vendors || []).forEach((v: any) => {
    if (v.dueDate && !v.deletedAt) {
      milestones.push({
        title: `Jatuh Tempo: ${v.name} (${v.category})`,
        date: v.dueDate,
        category: 'Vendor',
        color: 'bg-white border border-rose/30 text-rose',
        badge: 'Vendor',
      });
    }
  });

  // Sort milestones by date
  milestones.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Preparation Countdown Phases (PRD Section 9.6)
  const phases = [
    { label: 'H-180 (6 Bulan)', desc: 'Penentuan tanggal, komitmen awal & budgeting dasar', targetDays: 180 },
    { label: 'H-90 (3 Bulan)', desc: 'Booking vendor gedung/katering, pembahasan 57 kartu Q&A', targetDays: 90 },
    { label: 'H-60 (2 Bulan)', desc: 'Pengurusan berkas kelurahan N1-N4 & cek lab pranikah', targetDays: 60 },
    { label: 'H-30 (1 Bulan)', desc: 'Pendaftaran KUA resmi, suntik TT & fitting busana', targetDays: 30 },
    { label: 'H-14 (2 Minggu)', desc: 'Bimwin KUA, pelunasan termin vendor & sebar undangan', targetDays: 14 },
    { label: 'H-7 (1 Minggu)', desc: 'Gladi bersih panitia keluarga, konfirmasi katering & mas kawin', targetDays: 7 },
    { label: 'H-1 (Sehari Sebelumnya)', desc: 'Pengecekan perlengkapan bawaan asli, cincin & istirahat cukup', targetDays: 1 },
    { label: 'Hari-H', desc: 'Bismillah, Ijab Qabul & Walimatul ‘Ursy', targetDays: 0 },
  ];

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Kalender &amp; Timeline"
        subtitle="Jadwal mundur terpadu persiapan menuju akad"
        backHref="/modul"
      />

      <div className="p-4 space-y-5">
        {/* Countdown Header */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-blush via-white to-sky/50 border border-blush shadow-soft flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-rose uppercase tracking-wider">Target Tanggal Akad</p>
            <h3 className="text-base font-extrabold text-ink mt-0.5">
              {targetDateStr ? formatDateIndo(targetDateStr) : 'Belum ditentukan'}
            </h3>
          </div>
          <div className="text-right">
            {daysLeft !== null && daysLeft >= 0 ? (
              <span className="text-lg font-black text-rose bg-white px-3 py-1.5 rounded-2xl shadow-xs border border-blush inline-block">
                {daysLeft} Hari Lagi
              </span>
            ) : null}
          </div>
        </div>

        {/* Unified Milestones Agenda */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-ink flex items-center gap-1.5">
            <Calendar size={16} className="text-rose" />
            <span>Agenda &amp; Tenggat Waktu Terjadwal</span>
          </h3>

          {milestones.length === 0 ? (
            <div className="p-6 text-center bg-white rounded-3xl border border-blush text-ink/60 text-xs">
              Belum ada tanggal agenda yang dimasukkan di modul Khitbah, KUA, atau Budget.
            </div>
          ) : (
            milestones.map((m, idx) => {
              const diff = daysUntil(m.date);
              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white border border-blush shadow-soft flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blush text-rose flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-xs">{new Date(m.date).getDate()}</span>
                      <span className="text-[9px] uppercase">{new Date(m.date).toLocaleString('id-ID', { month: 'short' })}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-ink">{m.title}</h4>
                      <p className="text-[10px] text-ink/65 mt-0.5">{formatDateIndo(m.date)}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-sky text-ink">
                      {diff !== null ? (diff > 0 ? `H-${diff}` : diff === 0 ? 'Hari Ini' : 'Lewat') : '-'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Phase Timeline Countdown Guide (H-180 down to Hari-H) */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold text-ink flex items-center gap-1.5">
            <Clock size={16} className="text-rose" />
            <span>Panduan Fase Waktu Mundur</span>
          </h3>

          <div className="space-y-2.5">
            {phases.map((ph, idx) => {
              const isPast = daysLeft !== null && daysLeft < ph.targetDays;
              const isCurrent = daysLeft !== null && daysLeft <= ph.targetDays && (idx === phases.length - 1 || daysLeft > phases[idx + 1]?.targetDays);

              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border text-xs transition-all ${
                    isCurrent
                      ? 'bg-rose text-white border-rose shadow-md'
                      : isPast
                      ? 'bg-neutral-50 border-blush/60 text-ink/60'
                      : 'bg-white border-blush text-ink'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold">{ph.label}</span>
                    {isPast && <CheckCircle2 size={16} className="text-rose" />}
                    {isCurrent && <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">Fase Anda Sekarang</span>}
                  </div>
                  <p className={`text-[11px] mt-1 ${isCurrent ? 'text-white/85' : 'text-ink/70'}`}>
                    {ph.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
