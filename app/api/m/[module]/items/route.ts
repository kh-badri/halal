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
    const { collection, item } = body;

    if (!collection || !item) {
      return NextResponse.json(
        { error: 'Properti "collection" dan "item" wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedModule = await StorageAdapter.addItem(
      guard.workspace.id,
      modName,
      collection,
      item
    );
    return NextResponse.json({ success: true, data: updatedModule });
  } catch (error: any) {
    console.error(`Error adding item to ${params.module}:`, error);
    return NextResponse.json({ error: 'Gagal menambahkan item' }, { status: 500 });
  }
}
