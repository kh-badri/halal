import { NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { getWorkspaceDir, getUploadsDir, WORKSPACE_MODULE_NAMES } from '@/lib/storage/json-store';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await guardApiAccess({});
  if (!guard.ok) {
    return guard.response;
  }

  // PRD 4.1: Export data allowed for Pemilik and Full only, NOT Read
  if (guard.access === 'read') {
    return NextResponse.json(
      { error: 'Anggota Read tidak memiliki hak untuk mengekspor data', code: 'READ_ONLY' },
      { status: 403 }
    );
  }

  const { workspace, user } = guard;

  try {
    const zip = new JSZip();

    // 1. Pack all module JSON files from workspace
    const wsDir = getWorkspaceDir(workspace.id);
    const dataFolder = zip.folder('data');

    for (const mod of WORKSPACE_MODULE_NAMES) {
      const p = path.join(wsDir, `${mod}.json`);
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8');
        dataFolder?.file(`${mod}.json`, content);
      }
    }

    // 2. Pack metadata
    const metaInfo = {
      workspaceId: workspace.id,
      exportedBy: user.name,
      exportedAt: new Date().toISOString(),
      appName: 'Road To Halal: Aplikasi Persiapan Pernikahan (PWA)',
      schemaVersion: 1,
    };
    zip.file('metadata.json', JSON.stringify(metaInfo, null, 2));

    // 3. Pack uploaded files
    const uploadsFolder = zip.folder('uploads');
    const wsUploadsDir = getUploadsDir(workspace.id);
    if (fs.existsSync(wsUploadsDir)) {
      const files = fs.readdirSync(wsUploadsDir);
      for (const f of files) {
        const fullP = path.join(wsUploadsDir, f);
        if (fs.statSync(fullP).isFile()) {
          const buf = fs.readFileSync(fullP);
          uploadsFolder?.file(f, buf);
        }
      }
    }

    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `roadtohalal-export-${dateStr}.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal mengekspor data workspace' }, { status: 500 });
  }
}
