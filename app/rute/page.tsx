'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteMap } from '@/components/route/RouteMap';
import { AppHeader } from '@/components/ui/AppHeader';

export default function RutePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [routeData, setRouteData] = useState<any>(null);
  const [partnerName, setPartnerName] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [userAccess, setUserAccess] = useState<'owner' | 'full' | 'read'>('owner');

  useEffect(() => {
    async function load() {
      try {
        const [meRes, routeRes, profRes, setRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/route'),
          fetch('/api/m/profile'),
          fetch('/api/m/settings'),
        ]);

        if (meRes.status === 401 || routeRes.status === 401) {
          router.replace('/login');
          return;
        }

        const rData = await routeRes.json();
        setRouteData(rData);
        setUserAccess(rData.access || 'owner');

        if (profRes.ok) {
          const pData = await profRes.json();
          const prof = pData.data || pData;
          setPartnerName(prof?.partner?.fullName || prof?.partner?.nickname || '');
        }

        if (setRes.ok) {
          const sData = await setRes.json();
          const sett = sData.data || sData;
          setTargetDate(sett?.targetDate || '');
        }
      } catch (err) {
        console.error('Failed to load route data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

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
