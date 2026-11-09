import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { StorageAdapter } from '@/lib/storage/adapter';
import { WORKSPACE_MODULE_NAMES, WorkspaceModuleName } from '@/lib/storage/json-store';
import { StageKey } from '@/lib/schemas/workspace';

export const dynamic = 'force-dynamic';

const MODULE_MIN_STAGE: Record<string, StageKey | undefined> = {
  taaruf: 'persetujuan-taaruf',
  khitbah: 'kesepakatan-khitbah',
  budget: 'proses-khitbah',
  kua: 'administrasi-kua',
  harih: 'persiapan-walimah',
};

interface Params {
  params: {
    module: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  const modName = params.module as WorkspaceModuleName;
  if (!WORKSPACE_MODULE_NAMES.includes(modName)) {
    return NextResponse.json({ error: 'Modul tidak ditemukan' }, { status: 404 });
  }

  const minStage = MODULE_MIN_STAGE[modName];
  const guard = await guardApiAccess({ targetStage: minStage, requireWrite: false });
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const data = await StorageAdapter.getModule(guard.workspace.id, modName);
    return NextResponse.json({
      success: true,
      access: guard.access,
      data,
    });
  } catch (error: any) {
    console.error(`Error reading module ${params.module}:`, error);
    return NextResponse.json({ error: 'Gagal membaca data modul' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const modName = params.module as WorkspaceModuleName;
  if (!WORKSPACE_MODULE_NAMES.includes(modName)) {
    return NextResponse.json({ error: 'Modul tidak ditemukan' }, { status: 404 });
  }

  const minStage = MODULE_MIN_STAGE[modName];
  const isDecisionModule = modName === 'taaruf' || modName === 'khitbah';
  const guard = await guardApiAccess({
    targetStage: minStage,
    requireWrite: true,
    allowHalted: isDecisionModule,
  });
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const body = await req.json();
    const updated = await StorageAdapter.saveModule(guard.workspace.id, modName, body);

    // Section 9.0 point 6: Persimpangan keputusan
    // If either side chooses "tidak" (Tidak lanjut), halt the route
    if (modName === 'taaruf' || modName === 'khitbah') {
      const selfDecision = body.decisions?.selfDecision;
      const partnerDecision = body.decisions?.partnerDecision;
      const shouldHalt = selfDecision === 'tidak' || partnerDecision === 'tidak';

      const currentRoute = await StorageAdapter.getWorkspaceRoute(guard.workspace.id);
      if (shouldHalt && currentRoute.status !== 'berhenti') {
        await StorageAdapter.updateWorkspaceRoute(guard.workspace.id, { status: 'berhenti' });
      } else if (!shouldHalt && currentRoute.status === 'berhenti') {
        await StorageAdapter.updateWorkspaceRoute(guard.workspace.id, { status: 'berjalan' });
      }
    }

    // If Khitbah sets weddingTargetDate, sync to settings
    if (modName === 'khitbah' && body.execution?.weddingTargetDate) {
      try {
        const settings = await StorageAdapter.getModule(guard.workspace.id, 'settings');
        if (settings && settings.targetDate !== body.execution.weddingTargetDate) {
          settings.targetDate = body.execution.weddingTargetDate;
          await StorageAdapter.saveModule(guard.workspace.id, 'settings', settings);
        }
      } catch (err) {
        console.warn('Failed to sync weddingTargetDate to settings:', err);
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error(`Error saving module ${params.module}:`, error);
    return NextResponse.json({ error: 'Gagal menyimpan data modul' }, { status: 500 });
  }
}
