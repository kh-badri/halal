import { NextRequest, NextResponse } from 'next/server';
import { requireAuthUser } from '@/lib/auth/session';
import { StorageAdapter } from '@/lib/storage/adapter';
import { getDataDir } from '@/lib/storage/json-store';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

function getDirectorySize(dirPath: string): number {
  if (!fs.existsSync(dirPath)) return 0;
  let total = 0;
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const full = path.join(dirPath, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        total += getDirectorySize(full);
      } else {
        total += stat.size;
      }
    }
  } catch {
    // ignore
  }
  return total;
}

export async function GET() {
  try {
    const user = await requireAuthUser();
    if (!user.isAdmin) {
      return NextResponse.json({ error: 'Hanya Admin yang dapat mengakses endpoint ini' }, { status: 403 });
    }

    const users = await StorageAdapter.listAllUsers();
    const dataDir = getDataDir();
    const totalStorageBytes = getDirectorySize(dataDir);
    const uploadsBytes = getDirectorySize(path.join(dataDir, 'uploads'));

    // Check backups folder
    const backupsDir = path.join(dataDir, 'backups');
    const backups: { name: string; size: number; date: string }[] = [];
    if (fs.existsSync(backupsDir)) {
      const bItems = fs.readdirSync(backupsDir);
      for (const item of bItems) {
        try {
          const p = path.join(backupsDir, item);
          const stat = fs.statSync(p);
          backups.push({
            name: item,
            size: stat.size,
            date: stat.mtime.toISOString(),
          });
        } catch {
          // ignore
        }
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.length,
        activeUsers: users.filter((u) => !u.isDisabled).length,
        disabledUsers: users.filter((u) => u.isDisabled).length,
        totalStorageMb: Number((totalStorageBytes / (1024 * 1024)).toFixed(2)),
        uploadsStorageMb: Number((uploadsBytes / (1024 * 1024)).toFixed(2)),
        backupsCount: backups.length,
        backups: backups.reverse(),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Sesi telah berakhir' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Gagal mengambil statistik' }, { status: 500 });
  }
}
