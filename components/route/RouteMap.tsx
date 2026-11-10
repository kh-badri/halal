'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Check,
  MapPin,
  Star,
  Flag,
  ArrowRight,
  Sparkles,
  Users,
  Calendar,
  AlertCircle,
  Heart,
  ChevronRight,
  Zap,
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

// Fixed S-curve geometry points on a 360-pixel coordinate grid (from top to bottom)
// Total height = 1360px
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
  const [countdownDays, setCountdownDays] = useState<number | null>(null);

  const currentIdx = getStageIndex(currentStage || 'persetujuan-taaruf');
  const currentDef = STAGE_DEFINITIONS[currentStage] || STAGE_DEFINITIONS['persetujuan-taaruf'];

  const completedCount = useMemo(() => {
    return (stages || []).filter((s) => s?.status === 'completed').length;
  }, [stages]);

  const currentStageData = useMemo(() => {
    return (stages || []).find((s) => s?.key === currentStage);
  }, [stages, currentStage]);

  // Calculate days to akad if targetDate is set
  useEffect(() => {
    if (targetDate) {
      const target = new Date(targetDate).getTime();
      const now = new Date().setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
      setCountdownDays(diffDays > 0 ? diffDays : 0);
    }
  }, [targetDate]);

  // Auto-scroll smooth to active node on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeNodeRef.current) {
        activeNodeRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentStage]);

  const handleNodeClick = (stageKey: StageKey, status: 'completed' | 'active' | 'locked') => {
    if (status === 'locked') {
      setSelectedLockedStage(stageKey);
    } else {
      router.push(`/tahap/${stageKey}`);
    }
  };

  const getStageData = (key: StageKey) => {
    return (stages || []).find((s) => s?.key === key);
  };

  return (
    <div className="relative min-h-screen bg-[#FAF7F8] text-ink pb-24 select-none">
      {/* 1. Floating Capsule Sticky Navigation */}
      <div className="sticky top-3 z-40 px-3 max-w-md mx-auto pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xl border border-rose-200/70 rounded-full px-4 py-2 shadow-[0_6px_20px_-3px_rgba(240,86,124,0.15)] flex items-center justify-between gap-2 pointer-events-auto transition-all">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-rose-500 to-rose-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
              {currentDef.stepNumber <= 8 ? currentDef.stepNumber : '★'}
            </div>
            <div className="truncate">
              <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500 block leading-none">
                Tahap {currentDef.stepNumber} dari 8
              </span>
              <span className="text-xs font-black text-ink truncate block mt-0.5">
                {currentDef.shortTitle}
              </span>
            </div>
          </div>

          <Link
            href={currentDef.path}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#FF6584] to-[#F0567C] hover:from-[#F0567C] hover:to-[#E03E67] text-white font-bold text-xs shadow-rose-sm active:scale-95 transition-all shrink-0"
          >
            <span>Lanjutkan</span>
            <ArrowRight size={13} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* 2. Modern Hero & Countdown Header (Gelato Pink Aesthetic) */}
      <div className="px-5 pt-6 pb-7 bg-gradient-to-b from-[#FFF0F4] via-[#FFF7F9] to-[#FAF7F8] border-b border-rose-100 rounded-b-[40px] shadow-[0_10px_30px_-10px_rgba(240,86,124,0.08)]">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-white/95 px-3.5 py-1 rounded-full border border-rose-200/80 shadow-xs">
                <Sparkles size={13} className="text-rose-500 fill-rose-100" />
                <span>Menuju Halal</span>
              </span>
              {userAccess === 'read' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Hanya Baca
                </span>
              )}
            </div>

            <Link
              href="/anggota"
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white/95 px-3.5 py-1 rounded-full border border-rose-200/70 shadow-xs hover:border-rose-300 hover:text-rose-600 active:scale-95 transition-all"
            >
              <Users size={13} />
              <span>Anggota</span>
            </Link>
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-ink tracking-tight leading-tight">
              Bismillah, Perjalanan Menuju Halal
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
              Panduan ikhtiar terarah menuju pernikahan yang sakinah dan berkah
            </p>
          </div>

          {/* Modern Hero Journey Card */}
          <div className="p-4 bg-white/95 backdrop-blur-md rounded-3xl border border-rose-100 shadow-[0_8px_30px_-4px_rgba(240,86,124,0.12)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                  Tahap Saat Ini: Tahap {currentDef.stepNumber} dari 8
                </span>
              </div>
              <span className="text-xs font-bold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                {completedCount} Selesai
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-black text-ink truncate">{currentDef.title}</h3>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {currentStageData?.requirements
                    ? `${currentStageData.requirements.metRequirements} dari ${currentStageData.requirements.totalRequirements} syarat terpenuhi`
                    : currentDef.subtitle}
                </p>
              </div>

              <Link
                href={currentDef.path}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#FF6584] to-[#F0567C] hover:from-[#F0567C] hover:to-[#E03E67] text-white font-bold text-xs shadow-rose-sm active:scale-95 transition-all shrink-0"
              >
                <span>Buka</span>
                <ArrowRight size={14} className="stroke-[2.5]" />
              </Link>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full bg-rose-100/50 h-2.5 rounded-full overflow-hidden p-0.5 border border-rose-100">
              <div
                className="h-full bg-gradient-to-r from-[#FF7597] to-[#F0567C] rounded-full transition-all duration-500"
                style={{ width: `${Math.round((completedCount / 8) * 100)}%` }}
              />
            </div>
          </div>

          {/* Countdown Card (Shown when Akad date is set) */}
          {countdownDays !== null && (
            <div className="p-4 rounded-3xl bg-white border border-rose-100 flex items-center justify-between shadow-[0_4px_20px_rgba(240,86,124,0.08)]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-50 to-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
                    Menuju Akad Pernikahan
                  </p>
                  <p className="text-xs sm:text-sm font-black text-ink">
                    {targetDate ? new Date(targetDate).toLocaleDateString('id-ID', { dateStyle: 'full' }) : ''}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0 pl-2">
                <span className="text-2xl font-black text-rose-600 block leading-none">{countdownDays}</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">hari lagi</span>
              </div>
            </div>
          )}

          {/* Halt notification if decision was "tidak lanjut" */}
          {routeStatus === 'berhenti' && (
            <div className="p-4 rounded-3xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 flex items-start gap-3 shadow-xs">
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-sm">Rute Berhenti</p>
                <p className="text-xs text-rose-800/80 mt-0.5 leading-relaxed">
                  Salah satu pihak memutuskan tidak lanjut. Data saat ini bersifat hanya-baca. Anda dapat mengubah keputusan di form Tahap 1 atau Tahap 3 untuk melanjutkan kembali.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. The Vertical Winding S-Curve Route Map */}
      <div ref={containerRef} className="relative w-full max-w-[380px] mx-auto py-10 px-3 overflow-visible">
        {/* SVG Bezier Path Lines with Glowing Ambient Background Ribbon */}
        <svg
          viewBox="0 0 360 1360"
          className="w-full h-auto pointer-events-none absolute inset-0 z-0"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ambient Glowing Path Ribbon (Luscious Strawberry Tint) */}
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
                stroke="#FFE0E8"
                strokeWidth="14"
                strokeOpacity="0.85"
                strokeLinecap="round"
              />
            );
          })}

          {/* Top Layer Crisp Path (Rose for passed/active, soft slate for locked) */}
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
                stroke={isPassed ? '#F0567C' : '#CBD5E1'}
                strokeWidth={isPassed ? '4' : '3'}
                strokeDasharray={isPassed ? undefined : '6 6'}
                strokeOpacity={isPassed ? '1' : '0.55'}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* 4. Interactive Nodes and Modern Stage Cards */}
        <div className="relative z-10 w-full" style={{ height: '1360px' }}>
          {/* NODE 9: MULAI (at Y=1290) */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${ROUTE_POINTS[9].x}px`, top: `${ROUTE_POINTS[9].y}px` }}
          >
            <div className="w-13 h-13 rounded-2xl bg-white border border-rose-200/80 flex items-center justify-center text-rose-500 shadow-sm p-2">
              <Flag size={20} className="fill-rose-100 text-rose-500 stroke-[2.5]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 mt-1.5 bg-white px-3 py-0.5 rounded-full border border-rose-200 shadow-xs">
              Mulai
            </span>
            <span className="text-[9px] font-bold text-slate-400">Bismillah</span>
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

            const reqTotal = stageData?.requirements?.totalRequirements || 0;
            const reqMet = stageData?.requirements?.metRequirements || 0;

            return (
              <div
                key={key}
                ref={isActive ? activeNodeRef : null}
                className="absolute -translate-x-1/2 -translate-y-1/2 w-14 h-14 z-10"
                style={{
                  left: `${point.x}px`,
                  top: `${point.y}px`,
                }}
              >
                {/* A. If node is on the right, place card on LEFT */}
                {!isLeft && (
                  <div
                    onClick={() => handleNodeClick(key, status)}
                    className={`absolute right-[66px] top-1/2 -translate-y-1/2 w-[155px] xs:w-[165px] text-right cursor-pointer rounded-2xl p-2.5 transition-all ${
                      isActive
                        ? 'bg-white/95 border-2 border-rose-400 shadow-[0_8px_25px_-4px_rgba(240,86,124,0.2)] scale-[1.03]'
                        : status === 'completed'
                        ? 'bg-white/90 border border-sky-200 hover:border-sky-300 shadow-xs hover:bg-sky-50/40'
                        : 'bg-white/70 border border-dashed border-slate-200 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-end gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs'
                            : status === 'completed'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Tahap {def.stepNumber}
                      </span>
                    </div>
                    <h3
                      className={`text-xs font-black leading-tight line-clamp-2 ${
                        status === 'locked' ? 'text-slate-400' : 'text-ink'
                      }`}
                    >
                      {def.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-end gap-1">
                      {status === 'completed' ? (
                        <span className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" /> Selesai
                        </span>
                      ) : reqTotal > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600">
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

                {/* B. The Node Circle (Centered at point.x, point.y) */}
                <button
                  onClick={() => handleNodeClick(key, status)}
                  aria-label={`${def.title} - Status: ${status}`}
                  aria-disabled={status === 'locked'}
                  className={`w-14 h-14 rounded-full flex flex-col items-center justify-center shrink-0 transition-all select-none relative z-10 ${
                    status === 'active'
                      ? 'bg-gradient-to-tr from-[#FF6584] to-[#F0567C] text-white shadow-rose ring-4 ring-rose-300/40 ring-offset-2 animate-pulse scale-105'
                      : status === 'completed'
                      ? 'bg-gradient-to-tr from-sky-100 to-sky-200 border-2 border-sky-300 text-sky-800 shadow-xs hover:scale-105 active:scale-95'
                      : 'bg-white border border-dashed border-slate-300 text-slate-400 hover:bg-neutral-50 active:scale-95 shadow-xs'
                  }`}
                >
                  {status === 'completed' && <Check size={22} className="stroke-[3.5] text-sky-800" />}
                  {status === 'active' && (
                    <div className="flex flex-col items-center justify-center">
                      <MapPin size={18} className="fill-white text-rose-500" />
                      <span className="text-[9px] font-black text-white">{def.stepNumber}</span>
                    </div>
                  )}
                  {status === 'locked' && <Lock size={16} className="text-slate-400" />}

                  {/* "✨ Kamu di sini" chip for active node - Perfectly centered */}
                  {isActive && (
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gradient-to-r from-[#FF6584] to-[#F0567C] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-rose-sm animate-bounce flex items-center gap-1 z-30">
                      <Sparkles size={9} className="fill-white" /> Kamu di sini
                    </span>
                  )}
                </button>

                {/* C. If node is on the left (isLeft), place card on RIGHT */}
                {isLeft && (
                  <div
                    onClick={() => handleNodeClick(key, status)}
                    className={`absolute left-[66px] top-1/2 -translate-y-1/2 w-[155px] xs:w-[165px] text-left cursor-pointer rounded-2xl p-2.5 transition-all ${
                      isActive
                        ? 'bg-white/95 border-2 border-rose-400 shadow-[0_8px_25px_-4px_rgba(240,86,124,0.2)] scale-[1.03]'
                        : status === 'completed'
                        ? 'bg-white/90 border border-sky-200 hover:border-sky-300 shadow-xs hover:bg-sky-50/40'
                        : 'bg-white/70 border border-dashed border-slate-200 text-slate-400 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-start gap-1.5 mb-1">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-xs'
                            : status === 'completed'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Tahap {def.stepNumber}
                      </span>
                    </div>
                    <h3
                      className={`text-xs font-black leading-tight line-clamp-2 ${
                        status === 'locked' ? 'text-slate-400' : 'text-ink'
                      }`}
                    >
                      {def.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-start gap-1">
                      {status === 'completed' ? (
                        <span className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" /> Selesai
                        </span>
                      ) : reqTotal > 0 ? (
                        <span className="text-[10px] font-bold text-rose-600">
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

          {/* NODE 0: HALAL (at Y=70) */}
          {(() => {
            const halalStatus =
              currentStage === 'halal'
                ? 'active'
                : routeStatus === 'selesai'
                ? 'completed'
                : 'locked';
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${ROUTE_POINTS[0].x}px`, top: `${ROUTE_POINTS[0].y}px` }}
              >
                <button
                  onClick={() => handleNodeClick('halal', halalStatus)}
                  aria-label="Tujuan: Halal"
                  aria-disabled={halalStatus === 'locked'}
                  className={`w-16 h-16 rounded-full flex flex-col items-center justify-center transition-all shadow-md ${
                    halalStatus === 'completed'
                      ? 'bg-gradient-to-tr from-sky-300 to-sky-400 text-white ring-4 ring-sky-200 animate-pulse scale-110 shadow-lg'
                      : halalStatus === 'active'
                      ? 'bg-gradient-to-tr from-[#FF6584] to-[#F0567C] text-white ring-4 ring-rose-200 scale-105 shadow-rose'
                      : 'bg-white border border-dashed border-slate-300 text-slate-400'
                  }`}
                >
                  <Star
                    size={24}
                    className={halalStatus !== 'locked' ? 'fill-white text-white' : 'text-slate-300'}
                  />
                </button>
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 mt-2 bg-white px-3.5 py-1 rounded-full border border-rose-200 shadow-xs">
                  ★ HALAL
                </span>
                <p className="text-[10px] text-slate-500 font-bold tracking-tight mt-0.5">
                  Puncak Tujuan Akad
                </p>
              </div>
            );
          })()}
        </div>

        {/* Accessible Ordered List for Screen Readers */}
        <ol className="sr-only">
          {STAGE_ORDER.map((sKey) => {
            const d = STAGE_DEFINITIONS[sKey];
            const st = getStageData(sKey)?.status || 'locked';
            return (
              <li key={`sr-${sKey}`}>
                {d.title} - Status: {st}
              </li>
            );
          })}
        </ol>
      </div>

      {/* 5. Floating Quick Action Button */}
      <div className="fixed bottom-6 right-5 z-40">
        <Link
          href={currentDef.path}
          className="flex items-center gap-2 bg-gradient-to-r from-[#FF6584] to-[#F0567C] hover:from-[#F0567C] hover:to-[#E03E67] text-white font-bold text-xs px-4 py-2.5 rounded-full shadow-rose border border-white/40 hover:scale-105 active:scale-95 transition-all"
        >
          <Zap size={14} className="fill-white text-white" />
          <span>Lanjutkan Tahap {currentDef.stepNumber}</span>
        </Link>
      </div>

      {/* Locked Stage Bottom Sheet Modal */}
      <RouteLockedModal
        isOpen={Boolean(selectedLockedStage)}
        targetStage={selectedLockedStage}
        currentActiveStage={currentStage}
        onClose={() => setSelectedLockedStage(null)}
      />
    </div>
  );
};
