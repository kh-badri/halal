import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser, clearSessionCookie } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';

export async function DELETE() {
  try {
    const user = await requireAuthUser();
    await StorageAdapter.deleteUserCompletely(user.id);

    const res = NextResponse.json({
      success: true,
      message: 'Akun dan seluruh data Anda telah dihapus secara permanen dari server.',
    });
    clearSessionCookie(res);
    return res;
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    console.error('Delete account error:', error);
    return NextResponse.json({ error: 'Gagal menghapus akun.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const { name } = body;

    if (name && typeof name === 'string' && name.trim().length >= 2) {
      const updated = await StorageAdapter.updateUserAccount(user.id, { name: name.trim() });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Nama tidak valid' }, { status: 400 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui profil akun' }, { status: 500 });
  }
}
