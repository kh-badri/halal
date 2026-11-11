'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteMap } from '@/components/route/RouteMap';
import { AppHeader } from '@/components/ui/AppHeader';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function RutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [userAccess, setUserAccess] = useState<'owner' | 'full' | 'read'>('owner');

  useEffect(() => {
    async function load() {
      try {
        setLoadError(null);
        const [meRes, routeRes, profRes, setRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/route'),
          fetch('/api/m/profile'),
          fetch('/api/m/settings'),
        ]);

        if (routeRes.status === 401 || meRes.status === 401) {
          window.location.href = '/login';
          return;
        }

        if (!routeRes.ok) {
          throw new Error(`Gagal memuat rute (HTTP ${routeRes.status})`);
        }

        const rData = await routeRes.json();
        if (!rData || !rData.currentStage) {
          window.location.href = '/login';
          return;
        }
        setRouteData(rData);
        setUserAccess(rData.access || 'owner');

        if (profRes.ok) {
          try {
            const pData = await profRes.json();
            const prof = pData.data || pData;
            setPartnerName(prof?.partner?.fullName || prof?.partner?.nickname || '');
          } catch (_) {}
        }

        if (setRes.ok) {
          try {
            const sData = await setRes.json();
            const sett = sData.data || sData;
            setTargetDate(sett?.targetDate || '');
          } catch (_) {}
        }
      } catch (err: any) {
        console.error('Failed to load route data:', err);
        setLoadError(err?.message || 'Gagal terhubung ke server');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  if (loadError && !routeData) {
    return (
      <div className="min-h-screen bg-mist flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-coral-100 border border-coral-200 flex items-center justify-center text-coral-700 mb-4 shadow-subtle">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-extrabold text-navy-900 mb-1">Gagal Memuat Peta Rute</h3>
        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Terjadi kendala saat menyambung ke server ({loadError}). Silakan coba muat ulang halaman atau login kembali.
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
            onClick={() => { window.location.href = '/login'; }}
            className="flex-1 py-2.5 px-4 rounded-full border border-line text-navy-900 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all"
          >
            Halaman Login
          </button>
        </div>
      </div>
    );
  }

  // Skeleton loader matching PRD 8.9 (grey path with shiny round nodes)
  if (loading || !routeData) {
    return (
      <div className="min-h-screen bg-mist flex flex-col">
        {/* Skeleton Top Bar */}
        <div className="glass-header border-b border-line px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-sky-200 skeleton-shimmer" />
            <div className="space-y-1">
              <div className="w-20 h-2.5 bg-slate-200 rounded skeleton-shimmer" />
              <div className="w-28 h-3 bg-slate-300 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-2xl bg-slate-200 skeleton-shimmer" />
        </div>

        {/* Skeleton Hero Banner */}
        <div className="p-5 bg-sky-100/60 border-b border-line space-y-3">
          <div className="w-32 h-5 bg-sky-200 rounded-full skeleton-shimmer" />
          <div className="w-3/4 h-7 bg-slate-300 rounded skeleton-shimmer" />
          <div className="p-4 bg-white rounded-2xl border border-line space-y-2">
            <div className="w-1/2 h-3.5 bg-slate-200 rounded skeleton-shimmer" />
            <div className="w-full h-2 bg-slate-200 rounded-full skeleton-shimmer" />
          </div>
        </div>

        {/* Skeleton Route Path Nodes */}
        <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-200 border-2 border-slate-300 skeleton-shimmer" />
              <div className="space-y-1.5 w-36">
                <div className="w-16 h-2.5 bg-slate-200 rounded skeleton-shimmer" />
                <div className="w-32 h-3.5 bg-slate-300 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
          <p className="text-xs font-bold text-slate-500 pt-2">Memuat peta rute halal...</p>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    owner: 'Pemilik',
    full: 'Full Akses',
    read: 'Hanya Baca',
  };

  return (
    <div className="min-h-screen bg-mist">
      <AppHeader
        title="Road To Halal"
        subtitle={partnerName ? `Bersama ${partnerName}` : 'Peta Perjalanan Pranikah'}
        userRoleBadge={roleLabels[userAccess]}
        isReadOnly={userAccess === 'read'}
      />
      <RouteMap
        currentStage={routeData.currentStage}
        routeStatus={routeData.status}
        stages={routeData.stages}
        targetDate={targetDate}
        partnerName={partnerName}
        userAccess={userAccess}
      />
    </div>
  );
}
