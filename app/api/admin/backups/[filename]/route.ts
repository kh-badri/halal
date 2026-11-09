import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { getDataDir } from '@/lib/storage/json-store';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Params {
  params: {
    filename: string;
  };
}

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const adminUser = await requireAuthUser();
    if (!adminUser.isAdmin) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const safeFilename = path.basename(params.filename);
    const backupFilePath = path.join(getDataDir(), 'backups', safeFilename);

    if (!fs.existsSync(backupFilePath)) {
      return NextResponse.json({ error: 'Berkas cadangan tidak ditemukan' }, { status: 404 });
    }

    const buffer = fs.readFileSync(backupFilePath);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal mengunduh cadangan' }, { status: 500 });
  }
}
