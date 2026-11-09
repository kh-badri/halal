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

export async function PATCH(req: NextRequest, { params }: Params) {
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
    const { collection, patch } = body;

    if (!collection || !patch) {
      return NextResponse.json(
        { error: 'Properti "collection" dan "patch" wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedModule = await StorageAdapter.updateItem(
      guard.workspace.id,
      modName,
      collection,
      itemId,
      patch
    );
    return NextResponse.json({ success: true, data: updatedModule });
  } catch (error: any) {
    console.error(`Error updating item ${params.id}:`, error);
    return NextResponse.json({ error: 'Gagal memperbarui item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
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
    const url = new URL(req.url);
    const collection = url.searchParams.get('collection');
    const permanent = url.searchParams.get('permanent') === 'true';

    if (!collection) {
      return NextResponse.json(
        { error: 'Query parameter "collection" wajib disertakan' },
        { status: 400 }
      );
    }

    const updatedModule = await StorageAdapter.deleteItem(
      guard.workspace.id,
      modName,
      collection,
      itemId,
      permanent
    );
    return NextResponse.json({
      success: true,
      message: permanent ? 'Item dihapus permanen' : 'Item berhasil dihapus',
      data: updatedModule,
    });
  } catch (error: any) {
    console.error(`Error deleting item ${params.id}:`, error);
    return NextResponse.json({ error: 'Gagal menghapus item' }, { status: 500 });
  }
}
