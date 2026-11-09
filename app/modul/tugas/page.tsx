'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckSquare, Plus, Trash2, CheckCircle2, Circle, AlertCircle, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/ui/AppHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';

function TugasContent() {
  const searchParams = useSearchParams();
  const { showToast, showSaveIndicator } = useToast();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterPhase, setFilterPhase] = useState('semua');
  const [taskSheetOpen, setTaskSheetOpen] = useState(false);

  // Form State
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPhase, setTaskPhase] = useState<any>('awal');
  const [taskPriority, setTaskPriority] = useState<any>('sedang');
  const [taskDueDate, setTaskDueDate] = useState('');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'new-task') {
      setTaskSheetOpen(true);
    }

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
  }, [searchParams]);

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

  const handleToggleTask = (id: string) => {
    const updated = (data?.tasks || []).map((t: any) =>
      t.id === id ? { ...t, completed: !t.completed, updatedAt: new Date().toISOString() } : t
    );
    triggerAutoSave({ ...data, tasks: updated });
  };

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;
    const newTask = {
      id: `task-${Date.now()}`,
      title: taskTitle.trim(),
      phase: taskPhase,
      priority: taskPriority,
      dueDate: taskDueDate || undefined,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTask, ...(data?.tasks || [])];
    triggerAutoSave({ ...data, tasks: updated });
    setTaskTitle('');
    setTaskSheetOpen(false);
    showToast({ message: 'Tugas baru berhasil ditambahkan', type: 'success' });
  };

  const handleDeleteTask = (id: string) => {
    const updated = (data?.tasks || []).map((t: any) =>
      t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t
    );
    triggerAutoSave({ ...data, tasks: updated });
    showToast({ message: 'Tugas dihapus', type: 'info' });
  };

  const activeTasks = (data?.tasks || []).filter((t: any) => !t.deletedAt);
  const filteredTasks = activeTasks.filter((t: any) => {
    if (filterPhase !== 'semua' && t.phase !== filterPhase) return false;
    return true;
  });

  const completedCount = activeTasks.filter((t: any) => t.completed).length;

  return (
    <div className="min-h-screen bg-neutral-50/50 pb-20">
      <AppHeader
        title="Daftar Tugas (To-Do)"
        subtitle="Manajemen tugas persiapan lintas fase pernikahan"
        backHref="/modul"
      />

      <div className="p-4 space-y-4">
        {/* Header Summary */}
        <div className="p-4 rounded-3xl bg-white border border-blush shadow-soft flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-ink">
              {completedCount} dari {activeTasks.length} Tugas Selesai
            </h3>
            <p className="text-[10px] text-ink/65 mt-0.5">Pantau seluruh detail tanpa ada yang terlewat</p>
          </div>

          <button
            onClick={() => setTaskSheetOpen(true)}
            className="px-3.5 py-2 bg-rose text-white text-xs font-bold rounded-full flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={15} />
            <span>Tambah Tugas</span>
          </button>
        </div>

        {/* Phase Filter Bar */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
          {[
            { key: 'semua', label: 'Semua' },
            { key: 'awal', label: 'Awal' },
            { key: 'taaruf', label: 'Ta’aruf' },
            { key: 'khitbah', label: 'Khitbah' },
            { key: 'kua', label: 'KUA' },
            { key: 'budget', label: 'Budget' },
            { key: 'harih', label: 'Hari-H' },
          ].map((ph) => (
            <button
              key={ph.key}
              onClick={() => setFilterPhase(ph.key)}
              className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition-all ${
                filterPhase === ph.key ? 'bg-rose text-white shadow-xs' : 'bg-white border border-blush text-ink/70'
              }`}
            >
              {ph.label}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-blush text-ink/60 text-xs">
              Tidak ada tugas di kategori ini.
            </div>
          ) : (
            filteredTasks.map((t: any) => (
              <div
                key={t.id}
                className={`p-3.5 rounded-2xl bg-white border shadow-soft flex items-center justify-between gap-3 text-xs transition-all ${
                  t.completed ? 'border-rose/30 bg-blush/20 opacity-70' : 'border-blush'
                }`}
              >
                <div
                  onClick={() => handleToggleTask(t.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div className="shrink-0 text-rose">
                    {t.completed ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className={`font-semibold text-ink leading-snug truncate ${t.completed ? 'line-through' : ''}`}>
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-ink/60">
                      <span className="capitalize">Fase: {t.phase}</span>
                      {t.priority === 'tinggi' && <span className="font-bold text-rose">Prioritas Tinggi</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(t.id)}
                  className="p-1.5 text-ink/40 hover:text-rose transition-colors shrink-0"
                  aria-label="Hapus"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Sheet: Add Task */}
      <BottomSheet isOpen={taskSheetOpen} onClose={() => setTaskSheetOpen(false)} title="Tambah Tugas Baru">
        <div className="space-y-3 pb-6 text-xs">
          <div>
            <label className="block font-bold text-ink mb-1">Judul Tugas:</label>
            <input
              type="text"
              required
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="misal: Konfirmasi busana akad dengan penjahit"
              className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-ink mb-1">Fase Persiapan:</label>
              <select
                value={taskPhase}
                onChange={(e) => setTaskPhase(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="awal">Awal / Rencana</option>
                <option value="taaruf">Ta’aruf</option>
                <option value="khitbah">Lamaran / Khitbah</option>
                <option value="kua">Administrasi KUA</option>
                <option value="budget">Budget / Vendor</option>
                <option value="harih">Hari-H Akad</option>
                <option value="pascanikah">Pascanikah</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink mb-1">Tingkat Prioritas:</label>
              <select
                value={taskPriority}
                onChange={(e) => setTaskPriority(e.target.value)}
                className="w-full p-2.5 rounded-2xl bg-neutral-50 border border-blush focus:border-rose outline-none text-ink font-semibold"
              >
                <option value="tinggi">Tinggi (Mendesak)</option>
                <option value="sedang">Sedang</option>
                <option value="rendah">Rendah</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleAddTask}
            className="w-full py-3 bg-rose text-white font-bold rounded-full text-xs shadow-md mt-2"
          >
            Simpan Tugas
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function TugasPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-rose" /></div>}>
      <TugasContent />
    </Suspense>
  );
}
