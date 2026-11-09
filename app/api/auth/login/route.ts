import { NextRequest, NextResponse } from 'next/server';
import { LoginSchema } from '@/lib/schemas/auth';
import { StorageAdapter } from '@/lib/storage/adapter';
import { verifyPassword } from '@/lib/auth/password';
import { signSessionToken } from '@/lib/auth/jwt';
import { setSessionCookie } from '@/lib/auth/session';
import { checkRateLimit, resetRateLimit } from '@/lib/auth/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const rate = checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Silakan tunggu 1 menit lagi.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { identifier, password } = parsed.data;
    const user = await StorageAdapter.findUserByIdentifier(identifier);

    if (!user) {
      return NextResponse.json(
        { error: 'Email/username atau password salah.' },
        { status: 401 }
      );
    }

    if (user.isDisabled) {
      return NextResponse.json(
        { error: 'Akun Anda telah dinonaktifkan oleh Administrator.' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email/username atau password salah.' },
        { status: 401 }
      );
    }

    // Reset rate limiter on successful login
    resetRateLimit(ip);

    // Auto-create workspace for legacy accounts if missing
    if (!user.workspaceId) {
      const newWs = await StorageAdapter.createWorkspace(user.id, user.name);
      user.workspaceId = newWs.id;
      await StorageAdapter.updateUserAccount(user.id, { workspaceId: newWs.id });
    }

    // Update lastLoginAt
    await StorageAdapter.updateUserAccount(user.id, {
      lastLoginAt: new Date().toISOString(),
    });

    const token = await signSessionToken({
      userId: user.id,
      identifier: user.identifier,
      role: user.role,
      isAdmin: user.isAdmin,
      workspaceId: user.workspaceId,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        identifier: user.identifier,
        role: user.role,
        isAdmin: user.isAdmin,
        workspaceId: user.workspaceId,
      },
    });

    setSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server saat login.' },
      { status: 500 }
    );
  }
}
