import fs from 'fs';
import path from 'path';
import {
  getDataDir,
  getUserDir,
  getWorkspaceDir,
  getWorkspaceModuleFilePath,
  readWorkspaceModule,
  writeWorkspaceModule,
  addItemToWorkspaceModule,
  updateItemInWorkspaceModule,
  deleteItemFromWorkspaceModule,
  restoreItemInWorkspaceModule,
  reorderItemsInWorkspaceModule,
  getDefaultWorkspaceModuleData,
  WorkspaceModuleName,
  ModuleName,
} from './json-store';
import { withLock } from './lock';
import { writeAtomic } from './atomic-write';
import { Workspace, RouteState, Invite, Member, AccessLevel } from '../schemas/workspace';

export interface UserAccount {
  id: string;
  name: string;
  identifier: string;
  email?: string;
  username?: string;
  passwordHash: string;
  role: 'pria' | 'wanita';
  isAdmin: boolean;
  isDisabled: boolean;
  workspaceId: string;
  storageQuotaMb: number;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  resetToken?: string;
  resetTokenExpires?: string;
}

export interface UserIndex {
  [identifierLower: string]: string; // identifier -> userId
}

export interface InviteIndex {
  [codeUpper: string]: {
    workspaceId: string;
    access: AccessLevel;
    relation: string;
    expiresAt: string;
    usedBy?: string;
    createdAt: string;
  };
}

function getUsersIndexPath(): string {
  const indexDir = path.join(getDataDir(), 'index');
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true, mode: 0o700 });
  }
  return path.join(indexDir, 'users.json');
}

function getInvitesIndexPath(): string {
  const indexDir = path.join(getDataDir(), 'index');
  if (!fs.existsSync(indexDir)) {
    fs.mkdirSync(indexDir, { recursive: true, mode: 0o700 });
  }
  return path.join(indexDir, 'invites.json');
}

export function getUserAccountPath(userId: string): string {
  return path.join(getUserDir(userId), 'account.json');
}

export class StorageAdapter {
  // -------------------- USER OPERATIONS --------------------

  static async getUserIndex(): Promise<UserIndex> {
    const indexPath = getUsersIndexPath();
    if (!fs.existsSync(indexPath)) return {};
    try {
      const raw = fs.readFileSync(indexPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  static async findUserByIdentifier(identifier: string): Promise<UserAccount | null> {
    const key = identifier.toLowerCase().trim();
    const index = await this.getUserIndex();
    const userId = index[key];
    if (!userId) return null;
    return await this.getUserAccount(userId);
  }

  static async getUserAccount(userId: string): Promise<UserAccount | null> {
    const accountPath = getUserAccountPath(userId);
    if (!fs.existsSync(accountPath)) return null;
    try {
      const raw = fs.readFileSync(accountPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static async createUser(
    account: Omit<UserAccount, 'id' | 'createdAt' | 'updatedAt' | 'workspaceId'>,
    customWorkspaceId?: string
  ): Promise<{ user: UserAccount; workspace: Workspace }> {
    const indexPath = getUsersIndexPath();
    return await withLock(indexPath, async () => {
      const key = account.identifier.toLowerCase().trim();
      const index = await this.getUserIndex();
      if (index[key]) {
        throw new Error('Email atau username sudah terdaftar.');
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const now = new Date().toISOString();

      let workspace: Workspace;
      let workspaceId = customWorkspaceId;

      if (!workspaceId) {
        // Create new workspace owned by this user
        workspace = await this.createWorkspace(userId, account.name);
        workspaceId = workspace.id;
      } else {
        const existingWs = await this.getWorkspace(workspaceId);
        if (!existingWs) {
          throw new Error('Workspace tidak ditemukan.');
        }
        workspace = existingWs;
      }

      const userAccount: UserAccount = {
        id: userId,
        ...account,
        workspaceId,
        createdAt: now,
        updatedAt: now,
      };

      // Write account.json
      const accountPath = getUserAccountPath(userId);
      await writeAtomic(accountPath, JSON.stringify(userAccount, null, 2));

      // Update user index
      index[key] = userId;
      await writeAtomic(indexPath, JSON.stringify(index, null, 2));

      return { user: userAccount, workspace };
    });
  }

  static async updateUserAccount(userId: string, patch: Partial<UserAccount>): Promise<UserAccount> {
    const accountPath = getUserAccountPath(userId);
    return await withLock(accountPath, async () => {
      const existing = await this.getUserAccount(userId);
      if (!existing) {
        throw new Error('User tidak ditemukan.');
      }

      const updated: UserAccount = {
        ...existing,
        ...patch,
        id: userId,
        updatedAt: new Date().toISOString(),
      };

      await writeAtomic(accountPath, JSON.stringify(updated, null, 2));
      return updated;
    });
  }

  static async listAllUsers(): Promise<UserAccount[]> {
    const index = await this.getUserIndex();
    const userIds = Object.values(index);
    const users: UserAccount[] = [];

    for (const uid of Array.from(new Set(userIds))) {
      const acc = await this.getUserAccount(uid);
      if (acc) {
        const { passwordHash, ...safe } = acc;
        users.push(safe as any);
      }
    }

    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // -------------------- WORKSPACE OPERATIONS --------------------

  static async createWorkspace(ownerId: string, ownerName: string, targetDate?: string): Promise<Workspace> {
    const workspaceId = `ws_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const wsDir = getWorkspaceDir(workspaceId);
    const now = new Date().toISOString();

    const workspace: Workspace = {
      id: workspaceId,
      ownerId,
      members: [
        {
          userId: ownerId,
          name: ownerName,
          relation: 'Pemilik',
          access: 'full',
          joinedAt: now,
        },
      ],
      invites: [],
      quotaMB: 50,
      createdAt: now,
      updatedAt: now,
    };

    // Initialize workspace.json
    await writeAtomic(path.join(wsDir, 'workspace.json'), JSON.stringify(workspace, null, 2));

    // Initialize route.json
    const initialRoute: RouteState = {
      schemaVersion: 1,
      rev: 1,
      currentStage: 'persetujuan-taaruf',
      status: 'berjalan',
      completed: {},
      reopenLog: [],
      updatedAt: now,
    };
    await writeAtomic(path.join(wsDir, 'route.json'), JSON.stringify(initialRoute, null, 2));

    // Initialize settings.json
    const initialSettings = getDefaultWorkspaceModuleData('settings', { targetDate });
    await writeAtomic(path.join(wsDir, 'settings.json'), JSON.stringify(initialSettings, null, 2));

    // Initialize profile.json
    const initialProfile = getDefaultWorkspaceModuleData('profile', { ownerName });
    await writeAtomic(path.join(wsDir, 'profile.json'), JSON.stringify(initialProfile, null, 2));

    // Initialize other modules
    const modulesToInit: WorkspaceModuleName[] = ['taaruf', 'khitbah', 'budget', 'kua', 'harih', 'extra'];
    for (const mod of modulesToInit) {
      const def = getDefaultWorkspaceModuleData(mod);
      await writeAtomic(path.join(wsDir, `${mod}.json`), JSON.stringify(def, null, 2));
    }

    return workspace;
  }

  static async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    try {
      return await readWorkspaceModule<Workspace>(workspaceId, 'workspace');
    } catch {
      return null;
    }
  }

  static async updateWorkspace(workspaceId: string, patch: Partial<Workspace>): Promise<Workspace> {
    return await writeWorkspaceModule<Workspace>(workspaceId, 'workspace', patch);
  }

  static async getWorkspaceRoute(workspaceId: string): Promise<RouteState> {
    return await readWorkspaceModule<RouteState>(workspaceId, 'route');
  }

  static async updateWorkspaceRoute(workspaceId: string, patch: Partial<RouteState>): Promise<RouteState> {
    return await writeWorkspaceModule<RouteState>(workspaceId, 'route', patch);
  }

  // -------------------- INVITES & MEMBERS --------------------

  static async getInvitesIndex(): Promise<InviteIndex> {
    const indexPath = getInvitesIndexPath();
    if (!fs.existsSync(indexPath)) return {};
    try {
      const raw = fs.readFileSync(indexPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  static async createInvite(
    workspaceId: string,
    access: AccessLevel,
    relation: string
  ): Promise<Invite> {
    const invitesPath = getInvitesIndexPath();
    return await withLock(invitesPath, async () => {
      const index = await this.getInvitesIndex();

      // Generate 8-character uppercase alphanumeric code
      let code = '';
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      const invite: Invite = {
        code,
        access,
        relation,
        expiresAt,
        createdAt: now.toISOString(),
      };

      // Add to workspace.json
      const ws = await this.getWorkspace(workspaceId);
      if (!ws) throw new Error('Workspace tidak ditemukan.');
      const updatedInvites = [...(ws.invites || []), invite];
      await this.updateWorkspace(workspaceId, { invites: updatedInvites });

      // Add to index
      index[code] = {
        workspaceId,
        access,
        relation,
        expiresAt,
        createdAt: now.toISOString(),
      };
      await writeAtomic(invitesPath, JSON.stringify(index, null, 2));

      return invite;
    });
  }

  static async findInvite(code: string): Promise<{ code: string; workspaceId: string; access: AccessLevel; relation: string; expiresAt: string; usedBy?: string } | null> {
    const formatted = code.toUpperCase().trim();
    const index = await this.getInvitesIndex();
    const record = index[formatted];
    if (!record) return null;

    if (new Date(record.expiresAt).getTime() < Date.now()) {
      return null; // Expired
    }

    return {
      code: formatted,
      ...record,
    };
  }

  static async joinWorkspaceWithInvite(
    code: string,
    user: UserAccount
  ): Promise<Workspace> {
    const invitesPath = getInvitesIndexPath();
    return await withLock(invitesPath, async () => {
      const inviteData = await this.findInvite(code);
      if (!inviteData) {
        throw new Error('Kode undangan tidak valid atau sudah kedaluwarsa.');
      }

      const workspace = await this.getWorkspace(inviteData.workspaceId);
      if (!workspace) {
        throw new Error('Workspace tujuan tidak ditemukan.');
      }

      // Check if user is already a member
      const existingMember = (workspace.members || []).find((m) => m.userId === user.id);
      if (existingMember) {
        return workspace;
      }

      const newMember: Member = {
        userId: user.id,
        name: user.name,
        relation: inviteData.relation,
        access: inviteData.access,
        joinedAt: new Date().toISOString(),
      };

      const updatedMembers = [...(workspace.members || []), newMember];

      // Mark invite as used
      const updatedInvites = (workspace.invites || []).map((inv) =>
        inv.code === inviteData.code ? { ...inv, usedBy: user.id } : inv
      );

      await this.updateWorkspace(workspace.id, {
        members: updatedMembers,
        invites: updatedInvites,
      });

      // Update index
      const index = await this.getInvitesIndex();
      if (index[inviteData.code]) {
        index[inviteData.code].usedBy = user.id;
        await writeAtomic(invitesPath, JSON.stringify(index, null, 2));
      }

      // Update user account workspaceId
      await this.updateUserAccount(user.id, { workspaceId: workspace.id });

      return (await this.getWorkspace(workspace.id))!;
    });
  }

  static async updateMemberAccess(
    workspaceId: string,
    targetUserId: string,
    access: AccessLevel
  ): Promise<Workspace> {
    const ws = await this.getWorkspace(workspaceId);
    if (!ws) throw new Error('Workspace tidak ditemukan.');

    if (ws.ownerId === targetUserId) {
      throw new Error('Hak akses Pemilik tidak dapat diubah.');
    }

    const members = (ws.members || []).map((m) =>
      m.userId === targetUserId ? { ...m, access } : m
    );

    return await this.updateWorkspace(workspaceId, { members });
  }

  static async removeMember(
    workspaceId: string,
    targetUserId: string
  ): Promise<Workspace> {
    const ws = await this.getWorkspace(workspaceId);
    if (!ws) throw new Error('Workspace tidak ditemukan.');

    if (ws.ownerId === targetUserId) {
      throw new Error('Pemilik tidak dapat dikeluarkan dari workspace.');
    }

    const members = (ws.members || []).filter((m) => m.userId !== targetUserId);
    return await this.updateWorkspace(workspaceId, { members });
  }

  static async deleteUserCompletely(userId: string): Promise<void> {
    const indexPath = getUsersIndexPath();
    await withLock(indexPath, async () => {
      const index = await this.getUserIndex();
      const user = await this.getUserAccount(userId);
      if (user) {
        delete index[user.identifier.toLowerCase().trim()];
        await writeAtomic(indexPath, JSON.stringify(index, null, 2));

        // If user was owner of workspace, delete workspace
        if (user.workspaceId) {
          const ws = await this.getWorkspace(user.workspaceId);
          if (ws && ws.ownerId === userId) {
            await this.deleteWorkspaceCompletely(user.workspaceId);
          } else if (ws) {
            await this.removeMember(user.workspaceId, userId).catch(() => {});
          }
        }
      }

      // Remove user data directory
      const userDir = getUserDir(userId);
      if (fs.existsSync(userDir)) {
        fs.rmSync(userDir, { recursive: true, force: true });
      }
    });
  }

  static async deleteWorkspaceCompletely(workspaceId: string): Promise<void> {
    const wsDir = getWorkspaceDir(workspaceId);
    if (fs.existsSync(wsDir)) {
      fs.rmSync(wsDir, { recursive: true, force: true });
    }
    const uploadsDir = path.join(getDataDir(), 'uploads', workspaceId);
    if (fs.existsSync(uploadsDir)) {
      fs.rmSync(uploadsDir, { recursive: true, force: true });
    }
  }

  // -------------------- MODULE OPERATIONS --------------------

  static async getModule<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName): Promise<T> {
    return await readWorkspaceModule<T>(workspaceOrUserId, moduleName);
  }

  static async saveModule<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName, data: Partial<T>): Promise<T> {
    return await writeWorkspaceModule<T>(workspaceOrUserId, moduleName, data);
  }

  static async addItem<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName, collectionKey: string, item: any): Promise<T> {
    return await addItemToWorkspaceModule<T>(workspaceOrUserId, moduleName, collectionKey, item);
  }

  static async updateItem<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName, collectionKey: string, itemId: string, patch: any): Promise<T> {
    return await updateItemInWorkspaceModule<T>(workspaceOrUserId, moduleName, collectionKey, itemId, patch);
  }

  static async deleteItem<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName, collectionKey: string, itemId: string, permanent: boolean = false): Promise<T> {
    return await deleteItemFromWorkspaceModule<T>(workspaceOrUserId, moduleName, collectionKey, itemId, permanent);
  }

  static async restoreItem<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName, collectionKey: string, itemId: string): Promise<T> {
    return await restoreItemInWorkspaceModule<T>(workspaceOrUserId, moduleName, collectionKey, itemId);
  }

  static async reorderItems<T = any>(workspaceOrUserId: string, moduleName: WorkspaceModuleName, collectionKey: string, orderedIds: string[]): Promise<T> {
    return await reorderItemsInWorkspaceModule<T>(workspaceOrUserId, moduleName, collectionKey, orderedIds);
  }
}
