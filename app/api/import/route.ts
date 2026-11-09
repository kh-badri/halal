import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import {
  getWorkspaceDir,
  getUploadsDir,
  invalidateCache,
  WORKSPACE_MODULE_NAMES,
} from '@/lib/storage/json-store';
import { writeAtomic } from '@/lib/storage/atomic-write';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // PRD 4.1: Import data allowed ONLY for Pemilik
  const guard = await guardApiAccess({ requireOwner: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace } = guard;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Berkas cadangan tidak ditemukan' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    const wsDir = getWorkspaceDir(workspace.id);
    const wsUploadsDir = getUploadsDir(workspace.id);

    let restoredModulesCount = 0;
    let restoredUploadsCount = 0;

    // 1. Restore JSON modules from /data/ or root (skip workspace.json so membership is preserved)
    for (const mod of WORKSPACE_MODULE_NAMES) {
      if (mod === 'workspace') continue; // Preserve current workspace ID and members
      const dataFile = zip.file(`data/${mod}.json`) || zip.file(`${mod}.json`);
      if (dataFile) {
        const text = await dataFile.async('text');
        JSON.parse(text); // validate JSON syntax
        const targetPath = path.join(wsDir, `${mod}.json`);
        await writeAtomic(targetPath, text);
        invalidateCache(targetPath);
        restoredModulesCount++;
      }
    }

    // 2. Restore uploads
    const uploadsFolder = zip.folder('uploads');
    if (uploadsFolder) {
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (relativePath.startsWith('uploads/') && !zipEntry.dir) {
          const fileName = path.basename(relativePath);
          const fileBuf = await zipEntry.async('nodebuffer');
          const dest = path.join(wsUploadsDir, fileName);
          fs.writeFileSync(dest, fileBuf);
          restoredUploadsCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Pemulihan berhasil: ${restoredModulesCount} modul dan ${restoredUploadsCount} berkas foto/dokumen dipulihkan.`,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memulihkan data dari berkas ZIP cadangan.' },
      { status: 500 }
    );
  }
}
