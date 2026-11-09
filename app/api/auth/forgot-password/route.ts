import { NextRequest, NextResponse } from 'next/server';
import { ForgotPasswordSchema } from '@/lib/schemas/auth';
import { StorageAdapter } from '@/lib/storage/adapter';
import { sendPasswordResetEmail } from '@/lib/email/mailer';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ForgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email tidak valid.' },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const user = await StorageAdapter.findUserByIdentifier(email);

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes

      await StorageAdapter.updateUserAccount(user.id, {
        resetToken,
        resetTokenExpires,
      });

      const appUrl = process.env.APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
      await sendPasswordResetEmail(email, resetToken, appUrl);
    }

    // Always respond with success to avoid email enumeration
    return NextResponse.json({
      success: true,
      message: 'Jika email terdaftar, petunjuk reset password telah dikirim ke email Anda.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memproses permintaan reset password.' },
      { status: 500 }
    );
  }
}
