import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';
import { getMemberAccessLevel } from '@/lib/access/guard';
import {
  StageKey,
  STAGE_ORDER,
} from '@/lib/schemas/workspace';
import {
  STAGE_DEFINITIONS,
  getStageStatus,
  isStageUnlocked,
} from '@/lib/route/stages';
import { evaluateStageRequirements } from '@/lib/route/requirements';
import { AppHeader } from '@/components/ui/AppHeader';
import { MiniRoute } from '@/components/stages/MiniRoute';
import { CompleteStageButton } from '@/components/route/CompleteStageButton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Stage1PersetujuanTaaruf } from '@/components/stages/Stage1PersetujuanTaaruf';
import { Stage2ProsesTaaruf } from '@/components/stages/Stage2ProsesTaaruf';
import { Stage3KesepakatanKhitbah } from '@/components/stages/Stage3KesepakatanKhitbah';
import { Stage4ProsesKhitbah } from '@/components/stages/Stage4ProsesKhitbah';
import {
  CheckCircle2,
  Circle,
  ShieldAlert,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface StagePageProps {
  params: {
    stage: string;
  };
}

export default async function StagePage({ params }: StagePageProps) {
  const stageKey = params.stage as StageKey;

  if (!STAGE_ORDER.includes(stageKey)) {
    notFound();
  }

  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    redirect('/login');
  }

  const workspace = await StorageAdapter.getWorkspace(user.workspaceId);
  if (!workspace) {
    redirect('/rute');
  }

  const userAccess = getMemberAccessLevel(workspace, user.id);
  if (!userAccess) {
    redirect('/rute');
  }

  const route = await StorageAdapter.getWorkspaceRoute(workspace.id);

  // Enforcement: Stage Lock Guard (PRD 8.3 & 16)
  // Direct URL access to a locked stage immediately redirects to /rute
  if (!isStageUnlocked(route, stageKey)) {
    redirect('/rute');
  }

  const def = STAGE_DEFINITIONS[stageKey];
  const stageStatus = getStageStatus(route, stageKey);
  const isCompleted = stageStatus === 'completed';
  const isReadOnly = userAccess === 'read';

  // Evaluate requirements on the server
  const evaluation = await evaluateStageRequirements(workspace.id, stageKey);
  const unmetItems = evaluation.items.filter((i) => !i.isMet).map((i) => i.label);

  // Legacy fallback links for Stages 5–8 (to be fully replaced in Fase 3)
  const legacyStageModuleLinks: Partial<Record<StageKey, { href: string; label: string }[]>> = {
    'kesepakatan-akad': [
      { href: '/budget', label: 'Buka Pengaturan Mahar & Anggaran' },
    ],
    'administrasi-kua': [
      { href: '/kua', label: 'Buka Checklist Berkas KUA & Bimwin' },
    ],
    'persiapan-walimah': [
      { href: '/hari-h', label: 'Buka Daftar Tamu & Panitia Keluarga' },
      { href: '/budget', label: 'Buka Tracker Pembayaran Vendor' },
    ],
    'hari-h': [
      { href: '/hari-h', label: 'Buka Checklist H-1 & Rundown Hari-H' },
    ],
  };

  const legacyLinks = legacyStageModuleLinks[stageKey] || [];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Stage Header */}
      <AppHeader
        title={def.title}
        subtitle={`Tahap ${def.stepNumber} dari 8`}
        backHref="/rute"
        isReadOnly={isReadOnly}
      />

      {/* Mini Route 8 Dots (PRD 8.3) */}
      <MiniRoute currentStageKey={stageKey} routeData={route} />

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Stage Status Hero Banner */}
        <div
          className={`p-6 rounded-4xl border-2 border-ink shadow-soft relative overflow-hidden ${
            isCompleted
              ? 'bg-gradient-to-br from-sky via-sky/60 to-white'
              : 'bg-gradient-to-br from-blush via-blush/60 to-white'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/40 blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-ink bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-ink shadow-xs">
                Tahap {def.stepNumber} dari 8
              </span>
              <StatusBadge status={stageStatus} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-ink tracking-tight">{def.title}</h2>
              <p className="text-xs sm:text-sm text-ink/80 mt-1 leading-relaxed">{def.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Read-only notification if user has Read access */}
        {isReadOnly && (
          <div className="p-3.5 rounded-2xl bg-sky/40 border-2 border-ink text-xs text-ink flex items-start gap-2.5">
            <ShieldAlert size={16} className="text-ink shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Akses Hanya Baca (Read Only)</p>
              <p className="text-[11px] text-ink/75 mt-0.5">
                Anda hanya dapat melihat data tahap ini. Kontrol tambah, ubah, hapus, dan selesaikan tahap dinonaktifkan.
              </p>
            </div>
          </div>
        )}

        {/* Requirements Checklist Card */}
        {stageKey !== 'halal' && (
          <details className="group bg-white border-2 border-ink rounded-3xl p-4 shadow-subtle open:pb-4 transition-all">
            <summary className="flex items-center justify-between cursor-pointer list-none">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-ink" />
                <span className="text-xs font-black uppercase tracking-wider text-ink">
                  Syarat Selesai ({evaluation.metRequirements}/{evaluation.totalRequirements})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-ink">
                  {evaluation.totalRequirements > 0
                    ? Math.round((evaluation.metRequirements / evaluation.totalRequirements) * 100)
                    : 100}
                  %
                </span>
                <span className="text-xs text-ink/60 group-open:rotate-180 transition-transform">
                  ▼
                </span>
              </div>
            </summary>

            <div className="divide-y divide-ink/10 pt-3 mt-3 border-t border-ink/10">
              {evaluation.items.map((item) => (
                <div key={item.id} className="py-2 flex items-start gap-2.5">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      item.isMet
                        ? 'bg-sky border-ink text-ink'
                        : 'bg-white border-ink/40 text-ink/30'
                    }`}
                  >
                    {item.isMet ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  </div>
                  <p
                    className={`text-xs leading-relaxed ${
                      item.isMet ? 'font-bold text-ink' : 'font-medium text-ink/70'
                    }`}
                  >
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* INTERACTIVE STAGE VIEWS */}
        {stageKey === 'persetujuan-taaruf' && (
          <Stage1PersetujuanTaaruf workspaceId={workspace.id} isReadOnly={isReadOnly} />
        )}

        {stageKey === 'proses-taaruf' && (
          <Stage2ProsesTaaruf workspaceId={workspace.id} isReadOnly={isReadOnly} />
        )}

        {stageKey === 'kesepakatan-khitbah' && (
          <Stage3KesepakatanKhitbah workspaceId={workspace.id} isReadOnly={isReadOnly} />
        )}

        {stageKey === 'proses-khitbah' && (
          <Stage4ProsesKhitbah workspaceId={workspace.id} isReadOnly={isReadOnly} />
        )}

        {/* Stages 5–8 Temporary Fallback (Fase 3 target) */}
        {legacyLinks.length > 0 && (
          <div className="bg-white border-2 border-ink rounded-3xl p-5 shadow-subtle space-y-3">
            <h4 className="text-xs font-black uppercase text-ink tracking-wider">Modul Terkait</h4>
            <div className="flex flex-col gap-2">
              {legacyLinks.map((lnk, idx) => (
                <Link
                  key={idx}
                  href={lnk.href}
                  className="w-full py-2.5 px-4 rounded-full bg-white border-2 border-ink text-ink font-bold text-xs flex items-center justify-between hover:bg-neutral-50 active:scale-95 transition-all shadow-sm"
                >
                  <span>{lnk.label}</span>
                  <ArrowRight size={14} />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Halal Destination Special View */}
        {stageKey === 'halal' && (
          <div className="p-6 rounded-3xl bg-white border-2 border-ink text-center space-y-4 shadow-subtle">
            <div className="w-16 h-16 mx-auto rounded-full bg-sky border-2 border-ink flex items-center justify-center text-ink text-2xl font-black">
              ★
            </div>
            <h3 className="text-lg font-black text-ink">Alhamdulillah, Barakallahu Lakum!</h3>
            <p className="text-xs text-ink/80 leading-relaxed max-w-xs mx-auto">
              Seluruh perjalanan 8 tahap telah ditempuh. Semoga Allah memberkahi pernikahan Anda dan pasangan, serta menghimpun kalian berdua dalam kebaikan.
            </p>
            <div className="pt-2">
              <Link
                href="/rute"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-blush border-2 border-ink text-ink font-bold text-xs active:scale-95 transition-all"
              >
                <span>Lihat Peta Rute Lengkap</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Selesaikan Tahap Fixed Bottom Button */}
      {stageKey !== 'halal' && (
        <CompleteStageButton
          stageKey={stageKey}
          canComplete={evaluation.canComplete}
          unmetCount={unmetItems.length}
          unmetItems={unmetItems}
          isCompleted={isCompleted}
          isReadOnly={isReadOnly}
        />
      )}
    </div>
  );
}
