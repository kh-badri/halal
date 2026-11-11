'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Check,
  Star,
  Flag,
  ArrowRight,
  Sparkles,
  Users,
  Calendar,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { StageKey, STAGE_ORDER } from '@/lib/schemas/workspace';
import { STAGE_DEFINITIONS, getStageIndex } from '@/lib/route/stages';
import { RouteLockedModal } from './RouteLockedModal';

export interface StageDataSummary {
  key: StageKey;
  stepNumber: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  path: string;
  status: 'completed' | 'active' | 'locked';
  isUnlocked: boolean;
  requirements?: {
    canComplete: boolean;
    totalRequirements: number;
    metRequirements: number;
    items: { id: string; label: string; isMet: boolean }[];
  } | null;
}

interface RouteMapProps {
  currentStage: StageKey;
  routeStatus: 'berjalan' | 'berhenti' | 'selesai';
  stages: StageDataSummary[];
  targetDate?: string;
  partnerName?: string;
  userAccess?: 'owner' | 'full' | 'read';
}

// Coordinate grid: 360px wide, 1360px tall
const ROUTE_POINTS = [
  { id: 'halal', step: 9, x: 180, y: 70 },               // 0: HALAL (puncak)
  { id: 'hari-h', step: 8, x: 260, y: 200 },             // 1: Hari-H
  { id: 'persiapan-walimah', step: 7, x: 100, y: 340 },  // 2: Persiapan Walimah
  { id: 'administrasi-kua', step: 6, x: 260, y: 480 },   // 3: Administrasi KUA
  { id: 'kesepakatan-akad', step: 5, x: 100, y: 620 },   // 4: Kesepakatan Akad & Anggaran
  { id: 'proses-khitbah', step: 4, x: 260, y: 760 },     // 5: Proses Khitbah
  { id: 'kesepakatan-khitbah', step: 3, x: 100, y: 900 },// 6: Kesepakatan Khitbah
  { id: 'proses-taaruf', step: 2, x: 260, y: 1040 },     // 7: Proses Ta'aruf
  { id: 'persetujuan-taaruf', step: 1, x: 100, y: 1180 },// 8: Persetujuan Ta'aruf
  { id: 'mulai', step: 0, x: 180, y: 1290 },             // 9: MULAI (bawah)
];

export const RouteMap: React.FC<RouteMapProps> = ({
  currentStage,
  routeStatus,
  stages,
  targetDate,
  partnerName,
  userAccess = 'owner',
}) => {
  const router = useRouter();
  const activeNodeRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedLockedStage, setSelectedLockedStage] = useState<StageKey | null>(null);
  const [shakingStage, setShakingStage] = useState<string | null>(null);
  const [countdownDays, setCountdownDays] = useState<number | null>(null);

  const currentIdx = getStageIndex(currentStage || 'persetujuan-taaruf');
  const currentDef = STAGE_DEFINITIONS[currentStage] || STAGE_DEFINITIONS['persetujuan-taaruf'];

  const completedCount = useMemo(() => {
    return (stages || []).filter((s) => s?.status === 'completed').length;
  }, [stages]);

  const currentStageData = useMemo(() => {
    return (stages || []).find((s) => s?.key === currentStage);
  }, [stages, currentStage]);

  useEffect(() => {
    if (targetDate) {
      const target = new Date(targetDate).getTime();
      const now = new Date().setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      setCountdownDays(diffDays > 0 ? diffDays : 0);
    }
  }, [targetDate]);

  // Auto-scroll smooth to active node on mount (PRD 8.7 Rule 6)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNodeRef.current) {
        activeNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [currentStage]);

  const handleNodeClick = (stageKey: StageKey, status: 'completed' | 'active' | 'locked') => {
    if (status === 'locked') {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (_) {}
      }
      setShakingStage(stageKey);
      setTimeout(() => setShakingStage(null), 500);
      setSelectedLockedStage(stageKey);
    } else {
      router.push(`/tahap/${stageKey}`);
    }
  };

  const getStageData = (key: StageKey) => {
    return (stages || []).find((s) => s?.key === key);
  };

  return (
    <div className="relative min-h-screen bg-mist text-navy-900 pb-28 select-none">
      {/* 1. Floating Capsule Sticky Navigation */}
      <div className="sticky top-3 z-40 px-3 max-w-md mx-auto pointer-events-none">
        <div className="glass-header rounded-full px-4 py-2 shadow-subtle border border-line flex items-center justify-between gap-2 pointer-events-auto transition-all">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-azure text-white flex items-center justify-center font-extrabold text-xs shrink-0 shadow-xs">
              {currentDef?.stepNumber <= 8 ? currentDef.stepNumber : '★'}
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold tracking-wider text-azure-600 block leading-none">
                Tahap {currentDef?.stepNumber} dari 8
              </span>
              <span className="text-xs font-extrabold text-navy-900 truncate block mt-0.5">
                {currentDef?.shortTitle}
              </span>
            </div>
          </div>

          <Link
            href={currentDef?.path || '/tahap/persetujuan-taaruf'}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-azure hover:bg-azure-700 text-white font-extrabold text-xs shadow-subtle active:scale-95 transition-all shrink-0"
          >
            <span>Lanjutkan</span>
            <ArrowRight size={13} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 2. Aurora Sky Hero Header */}
      <div className="px-5 pt-5 pb-7 bg-aurora border-b border-line rounded-b-[32px] shadow-card">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-azure-700 bg-white/95 px-3 py-1 rounded-full border border-sky-200 shadow-xs">
                <Sparkles size={13} className="text-azure-600" />
                <span>Road To Halal</span>
              </span>
              {userAccess === 'read' && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
                  Hanya Baca
                </span>
              )}
            </div>

            <Link
              href="/anggota"
              className="flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-white/95 px-3.5 py-1 rounded-full border border-line shadow-xs hover:border-azure hover:text-azure-600 active:scale-95 transition-all"
            >
              <Users size={13} />
              <span>Anggota</span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight leading-tight font-display">
              {partnerName ? `Bersama ${partnerName}` : 'Bismillah, Menuju Halal'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Panduan ikhtiar 8 tahap terarah menuju pernikahan yang sakinah dan berkah.
            </p>
          </div>

          {/* Active Stage Progress Card */}
          <div className="p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-line shadow-subtle space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-azure animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-azure-700">
                  Tahap Saat Ini: Tahap {currentDef?.stepNumber} dari 8
                </span>
              </div>
              <span className="text-xs font-extrabold text-mint-700 bg-mint-100 px-2.5 py-0.5 rounded-full border border-mint-300">
                {completedCount}/8 Selesai
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-navy-900 truncate">{currentDef?.title}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {currentStageData?.requirements
                    ? `${currentStageData.requirements.metRequirements} dari ${currentStageData.requirements.totalRequirements} syarat terpenuhi`
                    : currentDef?.subtitle}
                </p>
              </div>

              <Link
                href={currentDef?.path || '/tahap/persetujuan-taaruf'}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-azure hover:bg-azure-700 text-white font-extrabold text-xs shadow-subtle active:scale-95 transition-all shrink-0"
              >
                <span>Buka</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </Link>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-sky-100 h-2 rounded-full overflow-hidden p-0.5 border border-sky-200">
              <div
                className="h-full bg-azure rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completedCount / 8) * 100)}%` }}
              />
            </div>
          </div>

          {/* Countdown Card (Display Font, PRD Section 8.7 & 8.9) */}
          {countdownDays !== null && (
            <div className="p-4 rounded-2xl bg-white border border-line flex items-center justify-between shadow-subtle">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-azure-700 shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-azure-600">
                    Menuju Akad Pernikahan
                  </p>
                  <p className="text-xs sm:text-sm font-extrabold text-navy-900">
                    {targetDate ? new Date(targetDate).toLocaleDateString('id-ID', { dateStyle: 'full' }) : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-3xl font-extrabold text-azure-700 block leading-none font-display">
                  {countdownDays}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">hari lagi</span>
              </div>
            </div>
          )}

          {/* Halt notification if decision was "tidak lanjut" */}
          {routeStatus === 'berhenti' && (
            <div className="p-4 rounded-2xl bg-coral-100 border border-coral-500 text-xs text-coral-700 flex items-start gap-3 shadow-xs">
              <AlertCircle size={20} className="text-coral-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-sm">Rute Berhenti</p>
                <p className="text-xs text-coral-700/90 mt-0.5 leading-relaxed">
                  Salah satu pihak memutuskan tidak lanjut. Data saat ini bersifat hanya-baca. Anda dapat mengubah keputusan di form Tahap 1 atau Tahap 3 untuk melanjutkan kembali.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. The Vertical Winding S-Curve Route Map */}
      <div ref={containerRef} className="relative w-full max-w-[380px] mx-auto py-10 px-3 overflow-visible">
        {/* SVG Bezier Path Lines */}
        <svg
          viewBox="0 0 360 1360"
          className="w-full h-auto pointer-events-none absolute inset-0 z-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ambient Glowing Path Ribbon */}
          {[
            { from: 9, to: 8 },
            { from: 8, to: 7 },
            { from: 7, to: 6 },
            { from: 6, to: 5 },
            { from: 5, to: 4 },
            { from: 4, to: 3 },
            { from: 3, to: 2 },
            { from: 2, to: 1 },
            { from: 1, to: 0 },
          ].map((seg, idx) => {
            const p1 = ROUTE_POINTS[seg.from];
            const p2 = ROUTE_POINTS[seg.to];
            const midY = (p1.y + p2.y) / 2;
            const pathData = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;

            return (
              <path
                key={`ambient-${idx}`}
                d={pathData}
                stroke="#E6F3FF"
                strokeWidth="12"
                strokeOpacity="0.8"
                strokeLinecap="round"
              />
            );
          })}

          {/* Crisp Path: Azure 600 solid 5px for passed/active; Slate 400 dashed (4px dash, 8px gap) for locked */}
          {[
            { from: 9, to: 8, targetStageIdx: 0 },
            { from: 8, to: 7, targetStageIdx: 1 },
            { from: 7, to: 6, targetStageIdx: 2 },
            { from: 6, to: 5, targetStageIdx: 3 },
            { from: 5, to: 4, targetStageIdx: 4 },
            { from: 4, to: 3, targetStageIdx: 5 },
            { from: 3, to: 2, targetStageIdx: 6 },
            { from: 2, to: 1, targetStageIdx: 7 },
            { from: 1, to: 0, targetStageIdx: 8 },
          ].map((seg, idx) => {
            const p1 = ROUTE_POINTS[seg.from];
            const p2 = ROUTE_POINTS[seg.to];
            const midY = (p1.y + p2.y) / 2;
            const pathData = `M ${p1.x} ${p1.y} C ${p1.x} ${midY}, ${p2.x} ${midY}, ${p2.x} ${p2.y}`;

            const isPassed = seg.targetStageIdx <= currentIdx;

            return (
              <path
                key={`path-seg-${idx}`}
                d={pathData}
                stroke={isPassed ? '#1F6FDB' : '#7589A1'}
                strokeWidth={isPassed ? '5' : '3'}
                strokeDasharray={isPassed ? undefined : '4 8'}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* 4. Interactive Nodes and Stage Labels */}
        <div className="relative z-10 w-full" style={{ height: '1360px' }}>
          {/* NODE 9: MULAI (at Y=1290) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${ROUTE_POINTS[9].x}px`, top: `${ROUTE_POINTS[9].y}px` }}
          >
            <div className="w-11 h-11 rounded-full bg-sky-300 border-2 border-azure flex items-center justify-center text-azure-700 shadow-subtle p-2">
              <Flag size={18} className="fill-azure text-azure stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-azure-700 mt-1.5 bg-white px-2.5 py-0.5 rounded-full border border-sky-200 shadow-xs">
              Mulai
            </span>
          </div>

          {/* STAGE NODES 1 TO 8 */}
          {STAGE_ORDER.slice(0, 8).map((key, stageIndex) => {
            const pointIndex = 8 - stageIndex;
            const point = ROUTE_POINTS[pointIndex];
            const stageData = getStageData(key);
            const status = stageData
              ? stageData.status
              : stageIndex < currentIdx
              ? 'completed'
              : stageIndex === currentIdx
              ? 'active'
              : 'locked';
            const def = STAGE_DEFINITIONS[key];
            const isLeft = point.x < 180;
            const isActive = status === 'active';
            const isShaking = shakingStage === key;

            const reqTotal = stageData?.requirements?.totalRequirements || 0;
            const reqMet = stageData?.requirements?.metRequirements || 0;

            return (
              <div
                key={key}
                ref={isActive ? activeNodeRef : null}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 z-10 ${
                  isShaking ? 'animate-shake' : ''
                }`}
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                }}
              >
                {/* Node Label on LEFT (if node is on right) */}
                {!isLeft && (
                  <div
                    onClick={() => handleNodeClick(key, status)}
                    className={`absolute right-[66px] top-1/2 -translate-y-1/2 w-[155px] xs:w-[165px] text-right cursor-pointer rounded-2xl p-2.5 transition-all ${
                      isActive
                        ? 'bg-white border-2 border-azure shadow-raised scale-[1.02]'
                        : status === 'completed'
                        ? 'bg-white border border-mint-300 shadow-xs hover:bg-mint-50/50'
                        : 'bg-white/80 border border-dashed border-slate-300 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-azure text-white'
                            : status === 'completed'
                            ? 'bg-mint-100 text-mint-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Tahap {def?.stepNumber}
                      </span>
                    </div>
                    <h3
                      className={`text-xs font-extrabold leading-tight line-clamp-2 ${
                        status === 'locked' ? 'text-slate-400' : 'text-navy-900'
                      }`}
                    >
                      {def?.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {status === 'completed' ? (
                        <span className="text-[10px] font-bold text-mint-700 flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" /> Selesai
                        </span>
                      ) : reqTotal > 0 ? (
                        <span className="text-[10px] font-bold text-azure-700">
                          {reqMet}/{reqTotal} syarat
                        </span>
                      ) : status === 'locked' ? (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                          <Lock size={10} /> Terkunci
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* The 56px Node Circle */}
                <button
                  onClick={() => handleNodeClick(key, status)}
                  aria-label={`${def?.title} - Status: ${status}`}
                  aria-disabled={status === 'locked'}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 transition-all select-none relative z-10 ${
                    status === 'active'
                      ? 'bg-sky-300 border-2 border-azure text-navy-900 shadow-raised animate-pulse-ring scale-105'
                      : status === 'completed'
                      ? 'bg-mint-300 border border-mint-400 text-mint-700 shadow-xs hover:scale-105 active:scale-95'
                      : 'bg-[#EAF1F8] border border-dashed border-slate-400 text-slate-500 hover:bg-white active:scale-95 shadow-xs'
                  }`}
                >
                  {status === 'completed' && <Check size={22} className="stroke-[3.5] text-mint-700" />}
                  {status === 'active' && (
                    <>
                      <span className="text-base font-extrabold text-navy-900 font-display">
                        {def?.stepNumber}
                      </span>
                      {/* Active "Kamu di sini" chip */}
                      <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-peach-100 text-navy-900 border border-peach-300 text-[9px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs animate-float-badge pointer-events-none">
                        Kamu di sini
                      </span>
                    </>
                  )}
                  {status === 'locked' && <Lock size={18} className="text-slate-500 stroke-[2.2]" />}
                </button>

                {/* Node Label on RIGHT (if node is on left) */}
                {isLeft && (
                  <div
                    onClick={() => handleNodeClick(key, status)}
                    className={`absolute left-[66px] top-1/2 -translate-y-1/2 w-[155px] xs:w-[165px] text-left cursor-pointer rounded-2xl p-2.5 transition-all ${
                      isActive
                        ? 'bg-white border-2 border-azure shadow-raised scale-[1.02]'
                        : status === 'completed'
                        ? 'bg-white border border-mint-300 shadow-xs hover:bg-mint-50/50'
                        : 'bg-white/80 border border-dashed border-slate-300 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-start gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-azure text-white'
                            : status === 'completed'
                            ? 'bg-mint-100 text-mint-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Tahap {def?.stepNumber}
                      </span>
                    </div>
                    <h3
                      className={`text-xs font-extrabold leading-tight line-clamp-2 ${
                        status === 'locked' ? 'text-slate-400' : 'text-navy-900'
                      }`}
                    >
                      {def?.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-start gap-1">
                      {status === 'completed' ? (
                        <span className="text-[10px] font-bold text-mint-700 flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" /> Selesai
                        </span>
                      ) : reqTotal > 0 ? (
                        <span className="text-[10px] font-bold text-azure-700">
                          {reqMet}/{reqTotal} syarat
                        </span>
                      ) : status === 'locked' ? (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5">
                          <Lock size={10} /> Terkunci
                        </span>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* NODE 0: HALAL (at Y=70, peak) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            style={{ left: `${ROUTE_POINTS[0].x}px`, top: `${ROUTE_POINTS[0].y}px` }}
          >
            <button
              onClick={() => {
                if (completedCount >= 8) {
                  router.push('/tahap/halal');
                } else {
                  handleNodeClick('halal' as StageKey, 'locked');
                }
              }}
              className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all ${
                completedCount >= 8
                  ? 'bg-gradient-to-tr from-peach-300 via-sky-300 to-azure text-navy-900 shadow-raised ring-4 ring-peach-100 animate-pulse scale-110'
                  : 'bg-[#EAF1F8] border border-dashed border-slate-400 text-slate-400 shadow-xs'
              }`}
              aria-label="Tujuan Halal"
            >
              <Star
                size={26}
                className={completedCount >= 8 ? 'text-navy-900 fill-peach-300' : 'text-slate-400'}
              />
            </button>
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider mt-1.5 px-3 py-0.5 rounded-full border shadow-xs ${
                completedCount >= 8
                  ? 'bg-peach-100 border-peach-300 text-navy-900'
                  : 'bg-white border-line text-slate-500'
              }`}
            >
              ★ Halal (Tujuan)
            </span>
          </div>
        </div>
      </div>

      {/* 5. Bottom Sheet for Locked Stage (PRD Section 8.7 & 8.9) */}
      <RouteLockedModal
        targetStage={selectedLockedStage}
        currentActiveStage={currentStage}
        isOpen={Boolean(selectedLockedStage)}
        onClose={() => setSelectedLockedStage(null)}
      />
    </div>
  );
};
