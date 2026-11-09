import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';
import { hashPassword } from '@/lib/auth/password';

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

    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password baru minimal 8 karakter' }, { status: 400 });
    }

    const targetUser = await StorageAdapter.getUserAccount(params.userId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const newHash = await hashPassword(newPassword);
    await StorageAdapter.updateUserAccount(targetUser.id, {
      passwordHash: newHash,
      resetToken: undefined,
      resetTokenExpires: undefined,
    });

    return NextResponse.json({
      success: true,
      message: `Password pengguna ${targetUser.name} berhasil direset.`,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal mereset password pengguna' }, { status: 500 });
  }
}
