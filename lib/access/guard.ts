import { Workspace, RouteState, StageKey } from '../schemas/workspace';
import { isStageUnlocked, getStageIndex } from '../route/stages';
import { StorageAdapter, UserAccount } from '../storage/adapter';
import { getCurrentSession } from '../auth/session';
import { NextResponse } from 'next/server';

export type UserAccessLevel = 'owner' | 'full' | 'read';

export function getMemberAccessLevel(workspace: Workspace, userId: string): UserAccessLevel | null {
  if (workspace.ownerId === userId) {
    return 'owner';
  }
  const member = (workspace.members || []).find((m) => m.userId === userId);
  if (!member) return null;
  return member.access;
}

export function canReadStage(route: RouteState, stageKey: StageKey): boolean {
  return isStageUnlocked(route, stageKey);
}

export function canWriteStage(
  access: UserAccessLevel,
  route: RouteState,
  stageKey: StageKey
): boolean {
  if (access === 'read') return false;
  if (route.status === 'berhenti') return false;
  return isStageUnlocked(route, stageKey);
}

export interface GuardSuccess {
  ok: true;
  user: UserAccount;
  workspace: Workspace;
  route: RouteState;
  access: UserAccessLevel;
}

export interface GuardError {
  ok: false;
  response: NextResponse;
}

export type GuardResult = GuardSuccess | GuardError;

/**
 * Server-side guard for API routes to enforce:
 * 1. Authentication
 * 2. Workspace membership
 * 3. Dynamic access level (Read vs Full vs Owner) from workspace.json
 * 4. Stage unlocking (STAGE_LOCKED 403)
 * 5. Read-only rejection (READ_ONLY 403)
 * 6. Owner-only rejection (OWNER_ONLY 403)
 */
export async function guardApiAccess(options: {
  targetStage?: StageKey;
  requireWrite?: boolean;
  requireOwner?: boolean;
  allowHalted?: boolean;
}): Promise<GuardResult> {
  const session = await getCurrentSession();
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Belum terautentikasi', code: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }

  const user = await StorageAdapter.getUserAccount(session.userId);
  if (!user || user.isDisabled) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Akun tidak aktif atau tidak ditemukan', code: 'UNAUTHORIZED' }, { status: 401 }),
    };
  }

  if (!user.workspaceId) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Workspace tidak ditemukan untuk akun ini', code: 'NO_WORKSPACE' }, { status: 404 }),
    };
  }

  const workspace = await StorageAdapter.getWorkspace(user.workspaceId);
  if (!workspace) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Data workspace tidak ditemukan', code: 'WORKSPACE_NOT_FOUND' }, { status: 404 }),
    };
  }

  const access = getMemberAccessLevel(workspace, user.id);
  if (!access) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Anda bukan anggota workspace ini', code: 'NOT_MEMBER' }, { status: 403 }),
    };
  }

  const route = await StorageAdapter.getWorkspaceRoute(workspace.id);

  // Check stage lock
  if (options.targetStage) {
    if (!isStageUnlocked(route, options.targetStage)) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Tahap ini masih terkunci. Selesaikan tahap sebelumnya terlebih dahulu.',
            code: 'STAGE_LOCKED',
            currentStage: route.currentStage,
          },
          { status: 403 }
        ),
      };
    }
  }

  // Check owner requirement
  if (options.requireOwner && access !== 'owner') {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'Aksi ini hanya dapat dilakukan oleh Pemilik workspace', code: 'OWNER_ONLY' },
        { status: 403 }
      ),
    };
  }

  // Check write requirement
  if (options.requireWrite) {
    if (access === 'read') {
      return {
        ok: false,
        response: NextResponse.json(
          { error: 'Anggota Read hanya memiliki hak akses melihat data', code: 'READ_ONLY' },
          { status: 403 }
        ),
      };
    }
    if (route.status === 'berhenti' && !options.allowHalted) {
      return {
        ok: false,
        response: NextResponse.json(
          {
            error: 'Rute telah berhenti karena keputusan tidak lanjut. Data bersifat hanya-baca.',
            code: 'ROUTE_HALTED',
          },
          { status: 403 }
        ),
      };
    }
  }

  return {
    ok: true,
    user,
    workspace,
    route,
    access,
  };
}
