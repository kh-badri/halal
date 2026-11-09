import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { evaluateStageRequirements } from '@/lib/route/requirements';
import { getNextStage, STAGE_DEFINITIONS } from '@/lib/route/stages';
import { StorageAdapter } from '@/lib/storage/adapter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const guard = await guardApiAccess({ requireWrite: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { user, workspace, route } = guard;

  if (route.status === 'berhenti') {
    return NextResponse.json(
      { error: 'Rute telah berhenti karena keputusan tidak lanjut.', code: 'ROUTE_HALTED' },
      { status: 403 }
    );
  }

  if (route.currentStage === 'halal') {
    return NextResponse.json(
      { error: 'Seluruh tahap telah selesai! Alhamdulillah.', code: 'ALREADY_COMPLETED' },
      { status: 400 }
    );
  }

  // Verify requirements on server
  const evaluation = await evaluateStageRequirements(workspace.id, route.currentStage);
  if (!evaluation.canComplete) {
    const unmetItems = evaluation.items.filter((i) => !i.isMet).map((i) => i.label);
    return NextResponse.json(
      {
        error: 'Syarat selesai belum terpenuhi',
        code: 'REQUIREMENTS_NOT_MET',
        unmet: unmetItems,
        evaluation,
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const completedStage = route.currentStage;
  const nextStage = getNextStage(completedStage);

  if (!nextStage) {
    return NextResponse.json(
      { error: 'Tahap berikutnya tidak ditemukan', code: 'NO_NEXT_STAGE' },
      { status: 400 }
    );
  }

  const updatedCompleted = {
    ...(route.completed || {}),
    [completedStage]: {
      at: now,
      by: user.id,
    },
  };

  const newStatus = nextStage === 'halal' ? 'selesai' : route.status;

  const updatedRoute = await StorageAdapter.updateWorkspaceRoute(workspace.id, {
    currentStage: nextStage,
    completed: updatedCompleted,
    status: newStatus,
  });

  return NextResponse.json({
    success: true,
    previousStage: completedStage,
    nextStage,
    route: updatedRoute,
    message: `Tahap "${STAGE_DEFINITIONS[completedStage].title}" berhasil diselesaikan!`,
  });
}
