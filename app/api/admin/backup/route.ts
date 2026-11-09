import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { createSystemBackup } from '@/lib/storage/backup-service';

export async function POST() {
  try {
    const adminUser = await requireAuthUser();
    if (!adminUser.isAdmin) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const result = await createSystemBackup();
    return NextResponse.json({
      success: true,
      message: 'Snapshot cadangan sistem berhasil dibuat.',
      backup: result,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    console.error('Manual backup error:', error);
    return NextResponse.json({ error: 'Gagal membuat cadangan' }, { status: 500 });
  }
}
