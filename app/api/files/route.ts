import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { getUploadsDir } from '@/lib/storage/json-store';
import fs from 'fs';
import path from 'path';

function getWorkspaceUploadsSize(workspaceId: string): number {
  const wsDir = getUploadsDir(workspaceId);
  if (!fs.existsSync(wsDir)) return 0;
  const files = fs.readdirSync(wsDir);
  let totalBytes = 0;
  for (const f of files) {
    try {
      const stat = fs.statSync(path.join(wsDir, f));
      totalBytes += stat.size;
    } catch {
      // ignore
    }
  }
  return totalBytes;
}

export async function POST(req: NextRequest) {
  const guard = await guardApiAccess({ requireWrite: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace } = guard;

  try {
    // Check storage quota
    const usedBytes = getWorkspaceUploadsSize(workspace.id);
    const maxBytes = (workspace.quotaMB || 50) * 1024 * 1024;
    if (usedBytes >= maxBytes) {
      return NextResponse.json(
        { error: 'Kuota penyimpanan workspace telah penuh (50 MB). Hapus berkas lama terlebih dahulu.' },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Berkas tidak ditemukan dalam permintaan' }, { status: 400 });
    }

    // Limit single file size to 2MB as per PRD
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran berkas maksimal 2 MB' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type.toLowerCase();

    let ext = '.webp';
    if (mime === 'application/pdf') {
      ext = '.pdf';
    } else if (mime === 'image/jpeg' || mime === 'image/jpg') {
      ext = '.jpg';
    } else if (mime === 'image/png') {
      ext = '.png';
    } else if (mime === 'image/webp') {
      ext = '.webp';
    } else {
      return NextResponse.json(
        { error: 'Format berkas tidak didukung. Harap unggah format WebP, JPEG, PNG, atau PDF.' },
        { status: 400 }
      );
    }

    const fileId = `f_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    const wsUploadsDir = getUploadsDir(workspace.id);
    const filePath = path.join(wsUploadsDir, fileId);

    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      fileId,
      url: `/api/files/${fileId}`,
      size: file.size,
      mimeType: mime,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Gagal mengunggah berkas' }, { status: 500 });
  }
}
