import { NextRequest, NextResponse } from 'next/server';
import { ResetPasswordSchema } from '@/lib/schemas/auth';
import { StorageAdapter } from '@/lib/storage/adapter';
import { hashPassword } from '@/lib/auth/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, newPassword } = parsed.data;
    const users = await StorageAdapter.listAllUsers();
    
    // Find user with matching active token
    let targetUserId: string | null = null;
    const now = new Date();

    for (const u of users) {
      const fullUser = await StorageAdapter.getUserAccount(u.id);
      if (
        fullUser?.resetToken === token &&
        fullUser?.resetTokenExpires &&
        new Date(fullUser.resetTokenExpires) > now
      ) {
        targetUserId = fullUser.id;
        break;
      }
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Token reset tidak valid atau sudah kadaluarsa (kedaluwarsa 30 menit).' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);
    await StorageAdapter.updateUserAccount(targetUserId, {
      passwordHash: newHash,
      resetToken: undefined,
      resetTokenExpires: undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah. Silakan login kembali dengan password baru.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mereset password.' },
      { status: 500 }
    );
  }
}
