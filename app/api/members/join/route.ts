import { NextRequest, NextResponse } from 'next/server';
import { StorageAdapter } from '@/lib/storage/adapter';
import { getCurrentUser, setSessionCookie } from '@/lib/auth/session';
import { hashPassword } from '@/lib/auth/password';
import { signSessionToken } from '@/lib/auth/jwt';
import { JoinInviteSchema } from '@/lib/schemas/workspace';

export const dynamic = 'force-dynamic';

/**
 * GET /api/members/join?code=XXXX: Preview invite details before joining
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Kode undangan wajib disertakan' }, { status: 400 });
  }

  const invite = await StorageAdapter.findInvite(code);
  if (!invite) {
    return NextResponse.json(
      { error: 'Kode undangan tidak valid atau sudah kedaluwarsa' },
      { status: 404 }
    );
  }

  const workspace = await StorageAdapter.getWorkspace(invite.workspaceId);
  if (!workspace) {
    return NextResponse.json(
      { error: 'Workspace tujuan tidak ditemukan' },
      { status: 404 }
    );
  }

  const owner = await StorageAdapter.getUserAccount(workspace.ownerId);

  return NextResponse.json({
    valid: true,
    code: invite.code,
    access: invite.access,
    relation: invite.relation,
    expiresAt: invite.expiresAt,
    workspaceOwnerName: owner?.name || 'Calon Pengantin',
  });
}

/**
 * POST /api/members/join: Join a workspace using an invite code
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = JoinInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { code, name, password, identifier, role } = parsed.data;

    const invite = await StorageAdapter.findInvite(code);
    if (!invite) {
      return NextResponse.json(
        { error: 'Kode undangan tidak valid atau sudah kedaluwarsa' },
        { status: 404 }
      );
    }

    let user = await getCurrentUser();

    // If user is not currently logged in, register them now attached to this workspace
    if (!user) {
      if (!name || !password || !identifier) {
        return NextResponse.json(
          { error: 'Nama, email/username, dan password wajib diisi untuk mendaftar akun baru' },
          { status: 400 }
        );
      }

      const existing = await StorageAdapter.findUserByIdentifier(identifier);
      if (existing) {
        return NextResponse.json(
          { error: 'Email atau username sudah terdaftar. Silakan login terlebih dahulu lalu masukkan kode.' },
          { status: 409 }
        );
      }

      const passwordHash = await hashPassword(password);
      const { user: newUser } = await StorageAdapter.createUser(
        {
          name,
          identifier,
          email: identifier.includes('@') ? identifier : undefined,
          username: !identifier.includes('@') ? identifier : undefined,
          passwordHash,
          role: role || 'wanita',
          isAdmin: false,
          isDisabled: false,
          storageQuotaMb: 50,
        },
        invite.workspaceId // Connect directly to this workspace
      );

      user = newUser;
    }

    // Add user as member to the workspace
    const workspace = await StorageAdapter.joinWorkspaceWithInvite(invite.code, user);

    // Issue session token
    const token = await signSessionToken({
      userId: user.id,
      identifier: user.identifier,
      role: user.role,
      isAdmin: user.isAdmin,
      workspaceId: workspace.id,
    });

    const res = NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke ruang persiapan! Hak akses: ${invite.access.toUpperCase()}.`,
      workspace: {
        id: workspace.id,
        access: invite.access,
      },
    });

    setSessionCookie(res, token);
    return res;
  } catch (error: any) {
    console.error('Join error:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal bergabung ke workspace.' },
      { status: 500 }
    );
  }
}
