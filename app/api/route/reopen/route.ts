import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { getPreviousStage, STAGE_DEFINITIONS } from '@/lib/route/stages';
import { StorageAdapter } from '@/lib/storage/adapter';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const guard = await guardApiAccess({ requireOwner: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { user, workspace, route } = guard;

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    // Empty body
  }

  const reason = (body?.reason || '').trim();
  if (reason.length < 3) {
    return NextResponse.json(
      { error: 'Alasan membuka kembali tahap wajib diisi (minimal 3 karakter)', code: 'REASON_REQUIRED' },
      { status: 400 }
    );
  }

  const previousStage = getPreviousStage(route.currentStage);
  if (!previousStage) {
    return NextResponse.json(
      { error: 'Tidak ada tahap selesai yang dapat dibuka kembali', code: 'CANNOT_REOPEN' },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const updatedCompleted = { ...(route.completed || {}) };
  delete updatedCompleted[previousStage];

  const logEntry = {
    stage: previousStage,
    at: now,
    by: user.id,
    reason,
  };

  const updatedReopenLog = [...(route.reopenLog || []), logEntry];

  const updatedRoute = await StorageAdapter.updateWorkspaceRoute(workspace.id, {
    currentStage: previousStage,
    completed: updatedCompleted,
    reopenLog: updatedReopenLog,
    status: 'berjalan',
  });

  return NextResponse.json({
    success: true,
    reopenedStage: previousStage,
    route: updatedRoute,
    message: `Tahap "${STAGE_DEFINITIONS[previousStage].title}" berhasil dibuka kembali.`,
  });
}
