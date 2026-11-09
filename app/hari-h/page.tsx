'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  ShieldCheck,
  Clock,
  Plus,
  Trash2,
  Phone,
  MessageCircle,
  AlertTriangle,
  Download,
  Upload,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  Share2,
  Loader2,
} from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ProgressBar } from '@/components/ui/ProgressRing';
import { useToast } from '@/components/ui/Toast';

function HariHContent() {
  const searchParams = useSearchParams();
  const { showToast, showSaveIndicator } = useToast();

  const [activeTab, setActiveTab] = useState<'tamu' | 'panitia' | 'rundown'>('tamu');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter for Guests
  const [searchGuest, setSearchGuest] = useState('');
  const [filterGroup, setFilterGroup] = useState('Semua');
  const [filterSide, setFilterSide] = useState<'semua' | 'pria' | 'wanita'>('semua');
  const [checkInMode, setCheckInMode] = useState(false);

  // BottomSheet Modals
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [editingGuest, setEditingGuest] = useState<any>(null);
  const [cateringSheetOpen, setCateringSheetOpen] = useState(false);
  const [committeeSheetOpen, setCommitteeSheetOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<any>(null);

  // Form States for Guest
  const [gName, setGName] = useState('');
  const [gGroup, setGGroup] = useState('Keluarga');
  const [gSide, setGSide] = useState<'pria' | 'wanita'>('pria');
  const [gPax, setGPax] = useState(1);
  const [gPhone, setGPhone] = useState('');
  const [gSession, setGSession] = useState<'akad' | 'walimah' | 'keduanya'>('keduanya');
  const [gStatus, setGStatus] = useState<any>('belum');
  const [gTable, setGTable] = useState('');
  const [gNotes, setGNotes] = useState('');

  // Form States for Committee
  const [cPersonName, setCPersonName] = useState('');
  const [cRelationship, setCRelationship] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [cTask, setCTask] = useState('');
  const [cKtpChecked, setCKtpChecked] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new-guest') {
      handleOpenNewGuest();
    }

    async function loadData() {
      try {
        const res = await fetch('/api/m/harih');
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error('Error loading hari-h data:', err);
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
        await fetch('/api/m/harih', {
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

  // --- Guest CRUD Handlers ---
  const handleOpenNewGuest = () => {
    setEditingGuest(null);
    setGName('');
    setGGroup('Keluarga');
    setGSide('pria');
    setGPax(2);
    setGPhone('');
    setGSession('keduanya');
    setGStatus('belum');
    setGTable('');
    setGNotes('');
    setGuestSheetOpen(true);
  };

  const handleOpenEditGuest = (guest: any) => {
    setEditingGuest(guest);
    setGName(guest.name);
    setGGroup(guest.group || 'Keluarga');
    setGSide(guest.side || 'pria');
    setGPax(guest.pax || 1);
    setGPhone(guest.phone || '');
    setGSession(guest.session || 'keduanya');
    setGStatus(guest.status || 'belum');
    setGTable(guest.tableNumber || '');
    setGNotes(guest.notes || '');
    setGuestSheetOpen(true);
  };

  const handleSaveGuest = () => {
    if (!gName.trim()) return;
    const guests = data?.guests || [];
    let updatedGuests: any[];

    if (editingGuest) {
      updatedGuests = guests.map((g: any) =>
        g.id === editingGuest.id
          ? {
              ...g,
              name: gName.trim(),
              group: gGroup,
              side: gSide,
              pax: gPax,
              phone: gPhone,
              session: gSession,
              status: gStatus,
              tableNumber: gTable,
              notes: gNotes,
              updatedAt: new Date().toISOString(),
            }
          : g
      );
    } else {
      const newGuest = {
        id: `g-${Date.now()}`,
        name: gName.trim(),
        group: gGroup,
        side: gSide,
        pax: gPax,
        phone: gPhone,
        session: gSession,
        status: gStatus,
        tableNumber: gTable,
        notes: gNotes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedGuests = [newGuest, ...guests];
    }

    triggerAutoSave({ ...data, guests: updatedGuests });
    setGuestSheetOpen(false);
    showToast({
      message: editingGuest ? 'Data tamu diperbarui' : 'Tamu undangan ditambahkan',
      type: 'success',
    });
  };

  const handleDeleteGuest = (id: string) => {
    const updatedGuests = (data?.guests || []).map((g: any) =>
      g.id === id ? { ...g, deletedAt: new Date().toISOString() } : g
    );
    triggerAutoSave({ ...data, guests: updatedGuests });
    showToast({
      message: 'Tamu dihapus dari daftar',
      type: 'info',
      action: {
        label: 'Urungkan',
        onClick: () => {
          const restored = (data?.guests || []).map((g: any) => {
            if (g.id === id) {
              const { deletedAt, ...rest } = g;
              return rest;
            }
            return g;
          });
          triggerAutoSave({ ...data, guests: restored });
        },
      },
    });
  };

  // WhatsApp Invite Sender
  const sendWhatsAppInvite = (guest: any) => {
    const text =
      `Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n` +
      `Yth. *${guest.name}*,\n\n` +
      `Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan kami.\n\n` +
      `Sesi: ${guest.session === 'keduanya' ? 'Akad & Walimah' : guest.session === 'akad' ? 'Akad Nikah' : 'Resepsi Walimah'}\n` +
      `Jumlah Reservasi: ${guest.pax} Pax\n\n` +
      `Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila berkenan hadir dan memberikan doa restu.\n\n` +
      `Wassalamu'alaikum Warahmatullahi Wabarakatuh.`;

    const cleanPhone = guest.phone.replace(/[^0-9]/g, '');
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;

    window.open(waUrl, '_blank');

    // Update guest status to 'diundang'
    const updatedGuests = (data?.guests || []).map((g: any) =>
      g.id === guest.id ? { ...g, status: 'diundang', updatedAt: new Date().toISOString() } : g
    );
    triggerAutoSave({ ...data, guests: updatedGuests });
  };

  // CSV Export for Guests
  const handleExportGuestsCSV = () => {
    const guests = (data?.guests || []).filter((g: any) => !g.deletedAt);
    let csv = 'Nama Tamu,Grup,Pihak,Jumlah Pax,Kontak,Sesi,Status,Meja,Catatan\n';
    guests.forEach((g: any) => {
      csv += `"${g.name}","${g.group}","${g.side}",${g.pax},"${g.phone || ''}","${g.session}","${g.status}","${g.tableNumber || ''}","${g.notes || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `daftar-tamu-nikahku-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast({ message: 'Daftar tamu berhasil diunduh dalam format CSV', type: 'success' });
  };

  // CSV Import for Guests
  const handleImportGuestsCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n');
      const imported: any[] = [];
      const now = new Date().toISOString();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts[0]) {
          imported.push({
            id: `g-import-${Date.now()}-${i}`,
            name: parts[0],
            group: parts[1] || 'Keluarga',
            side: (parts[2]?.toLowerCase() === 'wanita' ? 'wanita' : 'pria') as any,
            pax: Number(parts[3]) || 1,
            phone: parts[4] || '',
            session: 'keduanya',
            status: 'belum',
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (imported.length > 0) {
        const existing = data?.guests || [];
        triggerAutoSave({ ...data, guests: [...imported, ...existing] });
        showToast({ message: `Berhasil mengimpor ${imported.length} tamu undangan!`, type: 'success' });
      }
    };
    reader.readAsText(file);
  };

  // --- Catering Quota Calculations ---
  const activeGuests = (data?.guests || []).filter((g: any) => !g.deletedAt);
  const totalPaxOrdered = data?.catering?.vendorTotalPax || 500;
  const totalGuestPax = activeGuests.reduce((acc: number, g: any) => acc + (g.pax || 1), 0);
  const maleSidePax = activeGuests.filter((g: any) => g.side === 'pria').reduce((acc: number, g: any) => acc + (g.pax || 1), 0);
  const femaleSidePax = activeGuests.filter((g: any) => g.side === 'wanita').reduce((acc: number, g: any) => acc + (g.pax || 1), 0);
  const isCateringExceeded = totalGuestPax > totalPaxOrdered;
  const cateringRemaining = totalPaxOrdered - totalGuestPax;

  // Filtered Guests
  const filteredGuests = activeGuests.filter((g: any) => {
    if (filterSide !== 'semua' && g.side !== filterSide) return false;
    if (filterGroup !== 'Semua' && g.group !== filterGroup) return false;
    if (searchGuest.trim() && !g.name.toLowerCase().includes(searchGuest.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Hari-H Akad &amp; Walimah"
        subtitle="Daftar tamu, katering, panitia &amp; saksi nikah"
        backHref="/rute"
      />

      {/* Segmented Top Tabs */}
      <div className="sticky top-[57px] z-20 bg-white border-b border-blush/60 px-4 py-2">
        <div className="flex bg-blush/40 p-1 rounded-2xl gap-1">
          {[
            { key: 'tamu', label: 'Tamu & Katering', icon: Users },
            { key: 'panitia', label: 'Panitia & Saksi', icon: ShieldCheck },
            { key: 'rundown', label: 'Rundown Hari-H', icon: Clock },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  active ? 'bg-rose text-white shadow-xs' : 'text-ink/70 hover:text-ink'
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
        {/* TAB 1: DAFTAR TAMU & KUOTA KATERING (SECTION 9.5 A)            */}
        {/* ============================================================== */}
        {activeTab === 'tamu' && (
          <div className="space-y-4">
            {/* Catering Quota Calculator Card */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold text-rose uppercase tracking-wider">Kalkulator Kuota Katering</p>
                  <h3 className="text-base font-extrabold text-ink mt-0.5">
                    {totalGuestPax} Pax / {totalPaxOrdered} Porsi Pesanan
                  </h3>
                </div>

                <button
                  onClick={() => setCateringSheetOpen(true)}
                  className="px-3 py-1 bg-blush text-rose font-bold text-xs rounded-full hover:bg-rose hover:text-white transition-all shadow-xs"
                >
                  Ubah Kuota
                </button>
              </div>

              {/* Automatic Warning Alert when pax exceeds catering quota! */}
              {isCateringExceeded && (
                <div className="p-3.5 rounded-2xl bg-rose/10 border-2 border-rose flex items-start gap-2.5 text-xs text-rose animate-in fade-in">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold">Peringatan: Jumlah Pax Melebihi Kuota Katering!</h4>
                    <p className="text-[11px] mt-0.5">
                      Total tamu terdaftar ({totalGuestPax} pax) melebihi kuota vendor katering ({totalPaxOrdered} porsi) sebanyak {Math.abs(cateringRemaining)} porsi. Harap tambah kuota ke vendor katering!
                    </p>
                  </div>
                </div>
              )}

              <ProgressBar
                progress={Math.min(100, Math.round((totalGuestPax / totalPaxOrdered) * 100))}
                color={isCateringExceeded ? 'bg-rose' : 'bg-sky'}
              />

              <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1 border-t border-blush/60">
                <div className="p-2 rounded-2xl bg-sky/30">
                  <p className="text-[10px] text-ink/70">Pihak Pria</p>
                  <p className="font-extrabold text-ink mt-0.5">{maleSidePax} Pax</p>
                </div>
                <div className="p-2 rounded-2xl bg-blush/40">
                  <p className="text-[10px] text-rose">Pihak Wanita</p>
                  <p className="font-extrabold text-rose mt-0.5">{femaleSidePax} Pax</p>
                </div>
              </div>
            </div>

            {/* Action Bar & Search */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40" size={16} />
                  <input
                    type="text"
                    value={searchGuest}
                    onChange={(e) => setSearchGuest(e.target.value)}
                    placeholder="Cari nama tamu undangan..."
                    className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white border border-blush text-xs text-ink focus:border-rose outline-none"
                  />
                </div>

                <button
                  onClick={handleOpenNewGuest}
                  className="px-3.5 py-2 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <Plus size={15} />
                  <span>Tambah Tamu</span>
                </button>
              </div>

              {/* Import / Export & Check-In Toggle */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleExportGuestsCSV}
                    className="px-2.5 py-1 bg-white border border-blush text-ink/80 text-[11px] font-bold rounded-full flex items-center gap-1 shadow-xs hover:border-rose"
                  >
                    <Download size={12} />
                    <span>CSV</span>
                  </button>

                  <label className="px-2.5 py-1 bg-white border border-blush text-ink/80 text-[11px] font-bold rounded-full flex items-center gap-1 shadow-xs hover:border-rose cursor-pointer">
                    <Upload size={12} />
                    <span>Import CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleImportGuestsCSV} />
                  </label>
                </div>

                <button
                  onClick={() => setCheckInMode(!checkInMode)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    checkInMode ? 'bg-rose text-white shadow-sm' : 'bg-blush text-rose'
                  }`}
                >
                  {checkInMode ? 'Keluar Mode Check-In' : 'Mode Check-In Resepsi'}
                </button>
              </div>
            </div>

            {/* Guest List */}
            <div className="space-y-2.5">
              {filteredGuests.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-blush text-ink/60 text-xs">
                  Tidak ada tamu undangan yang cocok.
                </div>
              ) : (
                filteredGuests.map((guest: any) => (
                  <div
                    key={guest.id}
                    className={`p-4 rounded-3xl bg-white border shadow-soft space-y-2 text-xs transition-all ${
                      guest.status === 'hadir' ? 'border-rose bg-blush/10' : 'border-blush'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            guest.side === 'wanita' ? 'bg-blush text-rose' : 'bg-sky text-ink'
                          }`}>
                            {guest.side === 'wanita' ? 'Pihak Wanita' : 'Pihak Pria'}
                          </span>
                          <span className="text-[10px] text-ink/60 font-semibold">{guest.group}</span>
                          <span className="text-[10px] font-extrabold text-ink bg-neutral-100 px-2 py-0.5 rounded-full">
                            {guest.pax} Pax
                          </span>
                        </div>
                        <h4 className="font-extrabold text-ink text-sm leading-snug">{guest.name}</h4>
                        {guest.tableNumber && (
                          <p className="text-[11px] text-rose font-semibold mt-0.5">{guest.tableNumber}</p>
                        )}
                      </div>

                      {checkInMode ? (
                        <button
                          onClick={() => {
                            const next = guest.status === 'hadir' ? 'konfirmasi' : 'hadir';
                            const updated = (data?.guests || []).map((g: any) =>
                              g.id === guest.id ? { ...g, status: next, checkInAt: new Date().toISOString() } : g
                            );
                            triggerAutoSave({ ...data, guests: updated });
                          }}
                          className={`px-3 py-1.5 rounded-full font-black text-xs transition-all ${
                            guest.status === 'hadir' ? 'bg-rose text-white shadow-xs' : 'bg-blush text-rose'
                          }`}
                        >
                          {guest.status === 'hadir' ? 'Hadir ✅' : 'Tandai Hadir'}
                        </button>
                      ) : (
                        <StatusBadge
                          status={guest.status}
                          size="sm"
                          onClick={() => {
                            const order = ['belum', 'diundang', 'konfirmasi', 'hadir'];
                            const nextIdx = (order.indexOf(guest.status) + 1) % order.length;
                            const updated = (data?.guests || []).map((g: any) =>
                              g.id === guest.id ? { ...g, status: order[nextIdx] } : g
                            );
                            triggerAutoSave({ ...data, guests: updated });
                          }}
                        />
                      )}
                    </div>

                    {!checkInMode && (
                      <div className="flex items-center justify-between pt-2 border-t border-blush/60">
                        <span className="text-[11px] text-ink/70 capitalize">
                          Sesi: {guest.session}
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sendWhatsAppInvite(guest)}
                            className="px-2.5 py-1 bg-rose text-white text-[11px] font-bold rounded-full flex items-center gap-1 shadow-xs hover:scale-105 active:scale-95 transition-all"
                          >
                            <MessageCircle size={12} />
                            <span>Kirim Undangan</span>
                          </button>

                          <button
                            onClick={() => handleOpenEditGuest(guest)}
                            className="text-[11px] text-ink/70 hover:text-rose font-bold"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() => handleDeleteGuest(guest.id)}
                            className="p-1 text-ink/40 hover:text-rose transition-colors"
                            aria-label="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: PANITIA KELUARGA & SAKSI NIKAH (SECTION 9.5 B)          */}
        {/* ============================================================== */}
        {activeTab === 'panitia' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-white border border-blush shadow-soft">
              <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider mb-1">
                Panitia Keluarga &amp; Saksi Nikah
              </h3>
              <p className="text-[11px] text-ink/70">
                Pastikan seluruh posisi krusial (Wali Nasab, Saksi Pria &amp; Wanita, PIC Mahar) telah memiliki PIC dan KTP terkonfirmasi.
              </p>
            </div>

            <div className="space-y-2.5">
              {(data?.committee || []).map((comm: any) => (
                <div
                  key={comm.id}
                  className="p-4 rounded-3xl bg-white border border-blush shadow-soft space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-extrabold text-rose text-xs">{comm.role}</span>
                        {comm.isVital && (
                          <span className="text-[9px] font-black uppercase tracking-wider bg-rose/10 text-rose px-2 py-0.5 rounded-full">
                            Wajib KUA
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-ink text-sm">
                        {comm.personName || 'Belum Ditentukan'}
                      </h4>
                      {comm.relationship && (
                        <p className="text-[11px] text-ink/65 mt-0.5">Hubungan: {comm.relationship}</p>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const updated = (data?.committee || []).map((c: any) =>
                          c.id === comm.id ? { ...c, isConfirmed: !c.isConfirmed } : c
                        );
                        triggerAutoSave({ ...data, committee: updated });
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        comm.isConfirmed ? 'bg-rose text-white border-rose' : 'bg-blush text-ink border-blush'
                      }`}
                    >
                      {comm.isConfirmed ? 'Siap ✅' : 'Konfirmasi'}
                    </button>
                  </div>

                  <p className="text-[11px] text-ink/75 leading-relaxed bg-neutral-50 p-2.5 rounded-xl border border-blush/50">
                    Tugas: {comm.taskDescription}
                  </p>

                  {/* KTP Checklist for vital roles like Saksi & Wali */}
                  {comm.isVital && (
                    <div
                      onClick={() => {
                        const updated = (data?.committee || []).map((c: any) =>
                          c.id === comm.id ? { ...c, ktpChecked: !c.ktpChecked } : c
                        );
                        triggerAutoSave({ ...data, committee: updated });
                      }}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer text-[11px] transition-all ${
                        comm.ktpChecked ? 'bg-sky/40 border-sky text-ink font-bold' : 'bg-blush/30 border-blush text-ink/70'
                      }`}
                    >
                      <span>Checklist Identitas (KTP Asli &amp; Fotokopi Siap):</span>
                      <div className="w-4 h-4 rounded border flex items-center justify-center shrink-0">
                        {comm.ktpChecked && <CheckCircle2 size={14} className="text-rose" />}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-blush/60">
                    <div className="flex items-center gap-2">
                      {comm.phone && (
                        <>
                          <a
                            href={`https://wa.me/${comm.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-rose text-white rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs"
                          >
                            <MessageCircle size={12} />
                            <span>WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${comm.phone}`}
                            className="p-1.5 rounded-full bg-blush text-rose hover:bg-rose hover:text-white transition-colors"
                          >
                            <Phone size={13} />
                          </a>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        setEditingCommittee(comm);
                        setCPersonName(comm.personName || '');
                        setCRelationship(comm.relationship || '');
                        setCPhone(comm.phone || '');
                        setCTask(comm.taskDescription || '');
                        setCKtpChecked(comm.ktpChecked || false);
                        setCommitteeSheetOpen(true);
                      }}
                      className="text-xs text-rose font-bold hover:underline"
                    >
                      Atur Petugas &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 3: RUNDOWN HARI-H & CHECKLIST H-1 (SECTION 9.5 C)          */}
        {/* ============================================================== */}
        {activeTab === 'rundown' && (
          <div className="space-y-4">
            {/* Checklist H-1 */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider">
                Checklist Perlengkapan H-1 (Wajib Dibawa)
              </h3>
              <div className="space-y-2">
                {(data?.hMin1Checklist || []).map((item: any) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      const updated = (data?.hMin1Checklist || []).map((c: any) =>
                        c.id === item.id
                          ? { ...c, status: c.status === 'selesai' ? 'belum' : 'selesai', updatedAt: new Date().toISOString() }
                          : c
                      );
                      triggerAutoSave({ ...data, hMin1Checklist: updated });
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs cursor-pointer transition-all ${
                      item.status === 'selesai' ? 'bg-blush/30 border-rose/30 text-ink line-through' : 'bg-neutral-50 border-blush text-ink'
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{item.task}</p>
                      {item.pic && <p className="text-[10px] text-ink/60 mt-0.5">PIC: {item.pic}</p>}
                    </div>

                    <div className="w-5 h-5 rounded-lg border flex items-center justify-center shrink-0">
                      {item.status === 'selesai' && <CheckCircle2 size={16} className="text-rose" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Rundown Hari-H */}
            <div className="p-5 rounded-3xl bg-white border border-blush shadow-soft space-y-3">
              <h3 className="text-xs font-extrabold text-rose uppercase tracking-wider">
                Susunan Acara Hari-H Akad &amp; Walimah
              </h3>
              <div className="space-y-2.5">
                {(data?.rundown || []).map((run: any, idx: number) => (
                  <div
                    key={run.id}
                    className="p-3.5 rounded-2xl bg-neutral-50 border border-blush/70 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-rose">{run.time}</span>
                      <span className="text-[10px] text-ink/60">PIC: {run.pic || '-'}</span>
                    </div>
                    <h4 className="font-bold text-ink leading-snug">{run.title}</h4>
                    {run.notes && <p className="text-[10px] text-ink/70 leading-relaxed">{run.notes}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet: Add / Edit Guest */}
      <BottomSheet isOpen={guestSheetOpen} onClose={() => setGuestSheetOpen(false)} title="Data Tamu Undangan">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Nama Tamu / Keluarga:</label>
            <input
              type="text"
              required
              value={gName}
              onChange={(e) => setGName(e.target.value)}
              placeholder="misal: Bapak Budi Santoso &amp; Keluarga"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Pihak:</label>
              <select
                value={gSide}
                onChange={(e) => setGSide(e.target.value as any)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="pria">Keluarga/Teman Pria</option>
                <option value="wanita">Keluarga/Teman Wanita</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Jumlah Pax (Orang):</label>
              <input
                type="number"
                min={1}
                value={gPax}
                onChange={(e) => setGPax(Number(e.target.value))}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Kategori Grup:</label>
              <select
                value={gGroup}
                onChange={(e) => setGGroup(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="Keluarga Inti">Keluarga Inti</option>
                <option value="Keluarga Besar">Keluarga Besar</option>
                <option value="Teman">Teman / Sahabat</option>
                <option value="Rekan Kerja">Rekan Kerja / Kolega</option>
                <option value="Tetangga">Tetangga Lingkungan</option>
                <option value="VIP">Tamu VIP</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Nomor WhatsApp:</label>
              <input
                type="text"
                value={gPhone}
                onChange={(e) => setGPhone(e.target.value)}
                placeholder="0812xxxx"
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Sesi Undangan:</label>
              <select
                value={gSession}
                onChange={(e) => setGSession(e.target.value as any)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="keduanya">Akad &amp; Walimah</option>
                <option value="akad">Akad Saja</option>
                <option value="walimah">Walimah Resepsi Saja</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Status Undangan:</label>
              <select
                value={gStatus}
                onChange={(e) => setGStatus(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="belum">Belum Diundang</option>
                <option value="diundang">Sudah Diundang</option>
                <option value="konfirmasi">Konfirmasi Hadir</option>
                <option value="hadir">Telah Hadir di Acara</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Meja VIP / Catatan:</label>
            <input
              type="text"
              value={gTable}
              onChange={(e) => setGTable(e.target.value)}
              placeholder="Meja VIP 1 / Khusus Kursi Roda"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <button
            onClick={handleSaveGuest}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Tamu Undangan
          </button>
        </div>
      </BottomSheet>

      {/* Sheet: Edit Catering Quota */}
      <BottomSheet isOpen={cateringSheetOpen} onClose={() => setCateringSheetOpen(false)} title="Atur Kuota Katering">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Nama Vendor Katering:</label>
            <input
              type="text"
              value={data?.catering?.vendorName || ''}
              onChange={(e) => {
                const updated = {
                  ...data,
                  catering: { ...data?.catering, vendorName: e.target.value },
                };
                triggerAutoSave(updated);
              }}
              placeholder="Katering Berkah"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Total Porsi Pesanan (Pax):</label>
            <input
              type="number"
              min={50}
              step={50}
              value={data?.catering?.vendorTotalPax || 500}
              onChange={(e) => {
                const updated = {
                  ...data,
                  catering: { ...data?.catering, vendorTotalPax: Number(e.target.value) },
                };
                triggerAutoSave(updated);
              }}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-bold text-sm"
            />
          </div>

          <button
            onClick={() => setCateringSheetOpen(false)}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Selesai
          </button>
        </div>
      </BottomSheet>

      {/* Sheet: Edit Committee Role */}
      <BottomSheet isOpen={committeeSheetOpen} onClose={() => setCommitteeSheetOpen(false)} title={`Atur Petugas: ${editingCommittee?.role || ''}`}>
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Nama Petugas / Keluarga:</label>
            <input
              type="text"
              value={cPersonName}
              onChange={(e) => setCPersonName(e.target.value)}
              placeholder="misal: Paman H. Ahmad Dahlan"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Hubungan Keluarga:</label>
              <input
                type="text"
                value={cRelationship}
                onChange={(e) => setCRelationship(e.target.value)}
                placeholder="Paman / Kakak Kandung"
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Kontak WhatsApp:</label>
              <input
                type="text"
                value={cPhone}
                onChange={(e) => setCPhone(e.target.value)}
                placeholder="0812xxxx"
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-ink mb-1">Deskripsi Tugas Khusus:</label>
            <textarea
              rows={2}
              value={cTask}
              onChange={(e) => setCTask(e.target.value)}
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink resize-none"
            />
          </div>

          <button
            onClick={() => {
              if (editingCommittee) {
                const updated = (data?.committee || []).map((c: any) =>
                  c.id === editingCommittee.id
                    ? {
                        ...c,
                        personName: cPersonName.trim(),
                        relationship: cRelationship.trim(),
                        phone: cPhone.trim(),
                        taskDescription: cTask.trim(),
                        updatedAt: new Date().toISOString(),
                      }
                    : c
                );
                triggerAutoSave({ ...data, committee: updated });
              }
              setCommitteeSheetOpen(false);
              showToast({ message: 'Petugas panitia berhasil disimpan', type: 'success' });
            }}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Petugas
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function HariHPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-rose" /></div>}>
      <HariHContent />
    </Suspense>
  );
}
