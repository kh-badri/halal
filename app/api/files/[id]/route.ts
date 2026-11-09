import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { getUploadsDir } from '@/lib/storage/json-store';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await guardApiAccess({});
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace, user } = guard;
  const fileId = path.basename(params.id); // Prevent path traversal attack

  // Check workspace upload directory
  const wsDir = getUploadsDir(workspace.id);
  let filePath = path.join(wsDir, fileId);

  // Fallback to legacy user directory if migrated
  if (!fs.existsSync(filePath)) {
    const legacyUserDir = getUploadsDir(user.id);
    const legacyPath = path.join(legacyUserDir, fileId);
    if (fs.existsSync(legacyPath)) {
      filePath = legacyPath;
    }
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Berkas tidak ditemukan' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let contentType = 'application/octet-stream';
  if (ext === '.webp') contentType = 'image/webp';
  else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
  else if (ext === '.png') contentType = 'image/png';
  else if (ext === '.pdf') contentType = 'application/pdf';

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=86400, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
