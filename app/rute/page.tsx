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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-500 mb-4 shadow-xs">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-black text-slate-800 mb-1">Gagal Memuat Peta Rute</h3>
        <p className="text-xs text-slate-500 mb-5 leading-relaxed">
          Terjadi kendala saat menyambung ke server ({loadError}). Silakan coba muat ulang halaman atau login kembali.
        </p>
        <div className="flex gap-2 w-full">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white text-xs font-bold shadow-rose-sm hover:opacity-90"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang</span>
          </button>
          <button
            type="button"
            onClick={() => { window.location.href = '/login'; }}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            Halaman Login
          </button>
        </div>
      </div>
    );
  }

  if (loading || !routeData) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-ink/70">Memuat peta rute halal...</p>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    owner: 'Pemilik',
    full: 'Full Akses',
    read: 'Hanya Baca',
  };

  return (
    <div className="min-h-screen bg-white">
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
