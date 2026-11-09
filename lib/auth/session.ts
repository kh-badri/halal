import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifySessionToken, SessionPayload } from './jwt';
import { StorageAdapter, UserAccount } from '../storage/adapter';
import { Workspace } from '../schemas/workspace';
import { getMemberAccessLevel, UserAccessLevel } from '../access/guard';

export const SESSION_COOKIE_NAME = 'roadtohalal_session';
export const LEGACY_SESSION_COOKIE_NAME = 'nikahku_session';

export async function getCurrentSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value || cookieStore.get(LEGACY_SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function getCurrentUser(): Promise<UserAccount | null> {
  const session = await getCurrentSession();
  if (!session) return null;
  const user = await StorageAdapter.getUserAccount(session.userId);
  if (!user || user.isDisabled) return null;
  return user;
}

export async function requireAuthUser(): Promise<UserAccount> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  return user;
}

export async function getCurrentWorkspace(): Promise<{
  workspace: Workspace | null;
  access: UserAccessLevel | null;
}> {
  const user = await getCurrentUser();
  if (!user || !user.workspaceId) {
    return { workspace: null, access: null };
  }
  const workspace = await StorageAdapter.getWorkspace(user.workspaceId);
  if (!workspace) {
    return { workspace: null, access: null };
  }
  const access = getMemberAccessLevel(workspace, user.id);
  return { workspace, access };
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  response.cookies.set({
    name: LEGACY_SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
