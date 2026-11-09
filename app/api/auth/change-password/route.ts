import { NextRequest, NextResponse } from 'next/server';
import { ChangePasswordSchema } from '@/lib/schemas/auth';
import { requireAuthUser } from '@/lib/auth/session';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { StorageAdapter } from '@/lib/storage/adapter';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;
    const isOldValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isOldValid) {
      return NextResponse.json(
        { error: 'Password lama tidak cocok.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await StorageAdapter.updateUserAccount(user.id, {
      passwordHash: newHash,
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diperbarui.',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal memperbarui password.' }, { status: 500 });
  }
}
