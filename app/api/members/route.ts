import { NextRequest, NextResponse } from 'next/server';
import { guardApiAccess } from '@/lib/access/guard';
import { StorageAdapter } from '@/lib/storage/adapter';
import { CreateInviteSchema } from '@/lib/schemas/workspace';

export const dynamic = 'force-dynamic';

/**
 * GET /api/members: List members and invites of the current workspace
 */
export async function GET() {
  const guard = await guardApiAccess({});
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace, access } = guard;

  return NextResponse.json({
    workspaceId: workspace.id,
    ownerId: workspace.ownerId,
    userAccess: access,
    members: workspace.members || [],
    invites: access === 'owner' ? workspace.invites || [] : [],
  });
}

/**
 * POST /api/members: Create an invitation code (Owner only)
 */
export async function POST(req: NextRequest) {
  const guard = await guardApiAccess({ requireOwner: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace } = guard;

  try {
    const body = await req.json();
    const parsed = CreateInviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { access, relation } = parsed.data;
    const invite = await StorageAdapter.createInvite(workspace.id, access, relation);

    return NextResponse.json({
      success: true,
      invite,
      message: `Undangan dengan akses ${access.toUpperCase()} berhasil dibuat.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal membuat undangan.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/members: Change member access level (Read <-> Full, Owner only)
 */
export async function PATCH(req: NextRequest) {
  const guard = await guardApiAccess({ requireOwner: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace } = guard;

  try {
    const body = await req.json();
    const { userId, access } = body;

    if (!userId || !['read', 'full'].includes(access)) {
      return NextResponse.json(
        { error: 'userId dan access (read/full) wajib diisi' },
        { status: 400 }
      );
    }

    const updatedWorkspace = await StorageAdapter.updateMemberAccess(
      workspace.id,
      userId,
      access
    );

    return NextResponse.json({
      success: true,
      members: updatedWorkspace.members,
      message: `Hak akses berhasil diubah menjadi ${access.toUpperCase()}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal mengubah hak akses.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/members: Remove a member or revoke an invite (Owner only)
 */
export async function DELETE(req: NextRequest) {
  const guard = await guardApiAccess({ requireOwner: true });
  if (!guard.ok) {
    return guard.response;
  }

  const { workspace } = guard;

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const inviteCode = searchParams.get('code');

    if (userId) {
      const updated = await StorageAdapter.removeMember(workspace.id, userId);
      return NextResponse.json({
        success: true,
        members: updated.members,
        message: 'Anggota berhasil dikeluarkan dari workspace.',
      });
    }

    if (inviteCode) {
      const remainingInvites = (workspace.invites || []).filter(
        (inv) => inv.code !== inviteCode.toUpperCase()
      );
      await StorageAdapter.updateWorkspace(workspace.id, {
        invites: remainingInvites,
      });
      return NextResponse.json({
        success: true,
        message: 'Kode undangan berhasil dicabut.',
      });
    }

    return NextResponse.json(
      { error: 'Tentukan userId atau code yang ingin dihapus' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal menghapus anggota/undangan.' },
      { status: 500 }
    );
  }
}
