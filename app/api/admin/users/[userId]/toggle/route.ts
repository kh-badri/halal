import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';

interface Params {
  params: {
    userId: string;
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const adminUser = await requireAuthUser();
    if (!adminUser.isAdmin) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const targetUser = await StorageAdapter.getUserAccount(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    if (targetUser.id === adminUser.id) {
      return NextResponse.json({ error: 'Tidak dapat menonaktifkan akun sendiri' }, { status: 400 });
    }

    const updated = await StorageAdapter.updateUserAccount(targetUser.id, {
      isDisabled: !targetUser.isDisabled,
    });

    return NextResponse.json({
      success: true,
      message: updated.isDisabled ? 'Pengguna dinonaktifkan' : 'Pengguna diaktifkan kembali',
      user: updated,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal mengubah status pengguna' }, { status: 500 });
  }
}
