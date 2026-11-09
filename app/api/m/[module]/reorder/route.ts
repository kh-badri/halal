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
    const body = await req.json();
    const { collection, orderedIds } = body;

    if (!collection || !Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: 'Properti "collection" dan array "orderedIds" wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedModule = await StorageAdapter.reorderItems(
      guard.workspace.id,
      modName,
      collection,
      orderedIds
    );
    return NextResponse.json({ success: true, data: updatedModule });
  } catch (error: any) {
    console.error(`Error reordering items in ${params.module}:`, error);
    return NextResponse.json({ error: 'Gagal mengubah urutan item' }, { status: 500 });
  }
}
