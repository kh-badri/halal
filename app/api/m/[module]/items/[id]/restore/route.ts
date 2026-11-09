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
    id: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const modName = params.module as WorkspaceModuleName;
  if (!WORKSPACE_MODULE_NAMES.includes(modName)) {
    return NextResponse.json({ error: 'Modul tidak ditemukan' }, { status: 404 });
  }

  const minStage = MODULE_MIN_STAGE[modName];
  const guard = await guardApiAccess({ targetStage: minStage, requireWrite: true });
  if (!guard.ok) {
    return guard.response;
  }

  try {
    const itemId = params.id;
    const body = await req.json();
    const { collection } = body;

    if (!collection) {
      return NextResponse.json(
        { error: 'Properti "collection" wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedModule = await StorageAdapter.restoreItem(
      guard.workspace.id,
      modName,
      collection,
      itemId
    );
    return NextResponse.json({
      success: true,
      message: 'Item berhasil dipulihkan',
      data: updatedModule,
    });
  } catch (error: any) {
    console.error(`Error restoring item ${params.id}:`, error);
    return NextResponse.json({ error: 'Gagal memulihkan item' }, { status: 500 });
  }
}
