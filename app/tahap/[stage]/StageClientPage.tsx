'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  STAGE_DEFINITIONS,
  STAGE_ORDER,
  StageKey,
  getStageStatus,
  isStageUnlocked,
} from '@/lib/route/stages';
import { AppHeader } from '@/components/ui/AppHeader';
import { MiniRoute } from '@/components/stages/MiniRoute';
import { CompleteStageButton } from '@/components/route/CompleteStageButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Stage1PersetujuanTaaruf } from '@/components/stages/Stage1PersetujuanTaaruf';
import { Stage2ProsesTaaruf } from '@/components/stages/Stage2ProsesTaaruf';
import { Stage3KesepakatanKhitbah } from '@/components/stages/Stage3KesepakatanKhitbah';
import { Stage4ProsesKhitbah } from '@/components/stages/Stage4ProsesKhitbah';
import { Stage5KesepakatanAkad } from '@/components/stages/Stage5KesepakatanAkad';
import { Stage6AdministrasiKua } from '@/components/stages/Stage6AdministrasiKua';
import { Stage7PersiapanWalimah } from '@/components/stages/Stage7PersiapanWalimah';
import { Stage8HariH } from '@/components/stages/Stage8HariH';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  ListChecks,
  AlertCircle,
  RefreshCw,
  Star,
  Check,
} from 'lucide-react';

interface StageClientPageProps {
  stage: string;
}

export default function StageClientPage({ stage }: StageClientPageProps) {
  const stageKey = stage as StageKey;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [userAccess, setUserAccess] = useState<'owner' | 'full' | 'read'>('owner');

  const fetchRouteAndAuth = useCallback(async () => {
    try {
      setLoadError(null);
      const [authRes, routeRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/route'),
      ]);

      if (authRes.status === 401 || routeRes.status === 401) {
        window.location.href = '/login';
        return;
      }

      if (!authRes.ok || !routeRes.ok) {
        throw new Error(`Gagal memuat rute (HTTP ${routeRes.status})`);
      }

      const authData = await authRes.json();
      const rData = await routeRes.json();

      if (!rData || !rData.currentStage) {
        window.location.href = '/login';
        return;
      }

      setWorkspaceId(rData.workspaceId || authData.user?.workspaceId || 'default');
      setRouteData(rData);
      setUserAccess(rData.access || 'owner');

      const stageInfo = (rData.stages || []).find((s: any) => s.key === stageKey);
      if (stageInfo && !stageInfo.isUnlocked) {
        router.replace('/rute');
        return;
      }
    } catch (err: any) {
      console.error('Failed to load stage data:', err);
      setLoadError(err?.message || 'Gagal terhubung ke server');
    } finally {
      setLoading(false);
    }
  }, [router, stageKey]);

  useEffect(() => {
    fetchRouteAndAuth();
  }, [fetchRouteAndAuth]);

  // Live Refresh callback when data changes in any child component
  const handleDataChanged = useCallback(async () => {
    try {
      const res = await fetch('/api/route');
      if (res.ok) {
        const data = await res.json();
        setRouteData(data);
        if (data.access) setUserAccess(data.access);
      }
    } catch (err) {
      console.error('Failed to refresh route data:', err);
    }
  }, []);

  // Background Live Sync: Poll route progress every 3s so checklist updates live
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        handleDataChanged();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [handleDataChanged]);

  if (loadError && !routeData) {
    return (
      <div className="min-h-screen bg-mist flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-coral-100 border border-coral-200 flex items-center justify-center text-coral-700 mb-4 shadow-subtle">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-navy-900 mb-1">Gagal Memuat Data Tahap</h3>
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Terjadi kendala saat menyambung ke server ({loadError}). Silakan coba muat ulang halaman atau kembali ke rute.
        </p>
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-full bg-azure hover:bg-azure-700 text-white text-xs font-bold shadow-subtle active:scale-95 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang</span>
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/rute'; }}
            className="flex-1 py-2.5 px-4 rounded-full border border-line text-navy-900 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
          >
            Kembali ke Rute
          </button>
        </div>
      </div>
    );
  }

  // Skeleton loader matching PRD 8.9
  if (loading || !routeData) {
    return (
      <div className="min-h-screen bg-mist flex flex-col">
        <div className="glass-header border-b border-line px-4 py-3 flex items-center justify-between">
          <div className="w-20 h-6 bg-slate-200 rounded-full skeleton-shimmer" />
          <div className="w-24 h-4 bg-slate-200 rounded skeleton-shimmer" />
          <div className="w-8 h-8 rounded-full bg-slate-200 skeleton-shimmer" />
        </div>
        <div className="p-4 space-y-4 max-w-lg mx-auto w-full flex-1">
          <div className="h-28 bg-white rounded-3xl border border-line p-5 skeleton-shimmer" />
          <div className="h-48 bg-white rounded-3xl border border-line p-5 skeleton-shimmer" />
          <p className="text-xs font-bold text-slate-500 text-center pt-4">Memuat data tahap...</p>
        </div>
      </div>
    );
  }

  const def = STAGE_DEFINITIONS[stageKey];
  if (!def) return null;

  const currentStageInfo = (routeData?.stages || []).find((s: any) => s.key === stageKey);
  const stageStatus = currentStageInfo?.status || 'in_progress';
  const isCompleted = stageStatus === 'completed';
  const isReadOnly = userAccess === 'read';

  const requirements = currentStageInfo?.requirements || {
    canComplete: false,
    totalRequirements: 0,
    metRequirements: 0,
    items: [],
  };

  const unmetItems = (requirements.items || []).filter((i: any) => !i.isMet).map((i: any) => i.label);
  const percent = requirements.totalRequirements > 0
    ? Math.round((requirements.metRequirements / requirements.totalRequirements) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-mist pb-36">
      {/* Stage Header */}
      <AppHeader
        title={def.title}
        subtitle={`Tahap ${def.stepNumber} dari 8`}
        backHref="/rute"
        isReadOnly={isReadOnly}
      />

      {/* Mini Route 8 Dots */}
      <MiniRoute currentStageKey={stageKey} routeData={routeData} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Stage Status Hero Banner */}
        <div
          className={`p-6 rounded-3xl border shadow-subtle relative overflow-hidden ${
            isCompleted
              ? 'bg-gradient-to-br from-mint-100 via-sky-100 to-white border-mint-300'
              : 'bg-gradient-to-br from-sky-100 via-white to-mist border-sky-200'
          }`}
        >
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-azure-700 bg-white/95 backdrop-blur-sm px-3 py-1 rounded-full border border-sky-200 shadow-xs">
                Tahap {def.stepNumber} dari 8
              </span>
              <StatusBadge status={stageStatus} />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight font-display">{def.title}</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{def.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Read-only notification if user has Read access */}
        {isReadOnly && (
          <div className="p-3.5 rounded-2xl bg-slate-100 border border-slate-300 text-xs text-slate-700 font-bold">
            Mode Hanya Baca: Anda hanya dapat melihat data tahap ini tanpa melakukan perubahan.
          </div>
        )}

        {/* Stage Requirements Checklist Card (Live Real-Time Progress) */}
        {requirements.totalRequirements > 0 && (
          <details className="group bg-white border border-line rounded-3xl p-4 shadow-subtle open:pb-4 transition-all" open>
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-azure-700" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-navy-900">
                  Syarat Selesai ({requirements.metRequirements}/{requirements.totalRequirements})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-azure-700 font-display">
                  {percent}%
                </span>
                <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </div>
            </summary>

            <div className="divide-y divide-line/60 pt-3 mt-3 border-t border-line">
              {requirements.items.map((item: any) => (
                <div key={item.id} className="py-2 flex items-start gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      item.isMet
                        ? 'bg-mint-300 border-mint-400 text-mint-700'
                        : 'bg-white border-slate-300 text-slate-300'
                    }`}
                  >
                    {item.isMet ? <Check size={11} className="stroke-[3]" /> : <Circle size={10} />}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      item.isMet ? 'font-bold text-navy-900' : 'font-medium text-slate-500'
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* INTERACTIVE STAGE VIEWS (All 8 Stages fully implemented per PRD!) */}
        {stageKey === 'persetujuan-taaruf' && (
          <Stage1PersetujuanTaaruf
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'proses-taaruf' && (
          <Stage2ProsesTaaruf
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            userAccess={userAccess}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'kesepakatan-khitbah' && (
          <Stage3KesepakatanKhitbah
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'proses-khitbah' && (
          <Stage4ProsesKhitbah
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'kesepakatan-akad' && (
          <Stage5KesepakatanAkad
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'administrasi-kua' && (
          <Stage6AdministrasiKua
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'persiapan-walimah' && (
          <Stage7PersiapanWalimah
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {stageKey === 'hari-h' && (
          <Stage8HariH
            workspaceId={workspaceId}
            isReadOnly={isReadOnly}
            onDataChanged={handleDataChanged}
          />
        )}

        {/* Halal Destination Special View */}
        {stageKey === 'halal' && (
          <div className="p-6 rounded-3xl bg-white border border-line text-center space-y-4 shadow-subtle">
            <div className="w-16 h-16 mx-auto rounded-full bg-peach-100 border border-peach-300 text-navy-900 flex items-center justify-center text-3xl font-black">
              ★
            </div>
            <h3 className="text-xl font-extrabold text-navy-900 font-display">
              Alhamdulillah, Barakallahu Lakum!
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              Seluruh perjalanan 8 tahap telah ditempuh. Semoga Allah memberkahi pernikahan Anda dan pasangan, serta menghimpun kalian berdua dalam kebaikan.
            </p>
            <div className="pt-2">
              <Link
                href="/rute"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-azure text-white font-extrabold text-xs shadow-subtle active:scale-95 transition-all"
              >
                <span>Lihat Peta Rute Lengkap</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Selesaikan Tahap Fixed Bottom Button with LIVE updates */}
      {stageKey !== 'halal' && (
        <CompleteStageButton
          stageKey={stageKey}
          canComplete={requirements.canComplete}
          unmetCount={unmetItems.length}
          unmetItems={unmetItems}
          isCompleted={isCompleted}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
