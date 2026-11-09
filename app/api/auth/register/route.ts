import { NextRequest, NextResponse } from 'next/server';
import { RegisterSchema } from '@/lib/schemas/auth';
import { StorageAdapter } from '@/lib/storage/adapter';
import { hashPassword } from '@/lib/auth/password';
import { signSessionToken } from '@/lib/auth/jwt';
import { setSessionCookie } from '@/lib/auth/session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, identifier, password, role, targetDate } = parsed.data;

    const existing = await StorageAdapter.findUserByIdentifier(identifier);
    if (existing) {
      return NextResponse.json(
        { error: 'Email atau username sudah terdaftar.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const isAdmin = identifier.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@roadtohalal.id').toLowerCase();

    // Create user and new workspace
    const { user, workspace } = await StorageAdapter.createUser({
      name,
      identifier,
      email: identifier.includes('@') ? identifier : undefined,
      username: !identifier.includes('@') ? identifier : undefined,
      passwordHash,
      role,
      isAdmin,
      isDisabled: false,
      storageQuotaMb: 50,
    });

    // Update settings with targetDate if provided
    if (targetDate) {
      await StorageAdapter.saveModule(workspace.id, 'settings', { targetDate });
    }

    // Initialize self profile
    await StorageAdapter.saveModule(workspace.id, 'profile', {
      self: { fullName: name, nickname: name.split(' ')[0] },
    });

    const token = await signSessionToken({
      userId: user.id,
      identifier: user.identifier,
      role: user.role,
      isAdmin: user.isAdmin,
      workspaceId: workspace.id,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        identifier: user.identifier,
        role: user.role,
        isAdmin: user.isAdmin,
        workspaceId: workspace.id,
      },
      workspace: {
        id: workspace.id,
        ownerId: workspace.ownerId,
      },
    });

    setSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan server saat mendaftar.' },
      { status: 500 }
    );
  }
}
