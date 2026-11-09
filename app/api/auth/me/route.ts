import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';
import { getMemberAccessLevel } from '@/lib/access/guard';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  let workspace = null;
  let access = null;

  if (user.workspaceId) {
    workspace = await StorageAdapter.getWorkspace(user.workspaceId);
    if (workspace) {
      access = getMemberAccessLevel(workspace, user.id);
    }
  }

  const { passwordHash, resetToken, resetTokenExpires, ...safeUser } = user;
  return NextResponse.json({
    user: safeUser,
    workspace,
    access,
  });
}
