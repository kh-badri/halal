import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { getDataDir } from './json-store';

/**
 * Creates a daily snapshot backup of all workspaces, users, index, and uploads,
 * saved to roadtohalal-data/backups/backup-YYYY-MM-DD.zip
 * and enforces a 14-day retention policy (deletes older backups).
 */
export async function createSystemBackup(): Promise<{ filename: string; size: number }> {
  const dataDir = getDataDir();
  const backupsDir = path.join(dataDir, 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true, mode: 0o700 });
  }

  const zip = new JSZip();

  function addDirToZip(dirPath: string, zipPrefix: string) {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        addDirToZip(fullPath, `${zipPrefix}/${entry.name}`);
      } else if (entry.isFile() && !entry.name.endsWith('.bak')) {
        zip.file(`${zipPrefix}/${entry.name}`, fs.readFileSync(fullPath));
      }
    }
  }

  // 1. Pack index
  addDirToZip(path.join(dataDir, 'index'), 'index');

  // 2. Pack users
  addDirToZip(path.join(dataDir, 'users'), 'users');

  // 3. Pack workspaces
  addDirToZip(path.join(dataDir, 'workspaces'), 'workspaces');

  // 4. Pack uploads
  addDirToZip(path.join(dataDir, 'uploads'), 'uploads');

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `backup-${dateStr}.zip`;
  const destPath = path.join(backupsDir, filename);

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  fs.writeFileSync(destPath, zipBuffer);

  // 5. Enforce 14-day retention policy
  cleanOldBackups(backupsDir, 14);

  return { filename, size: zipBuffer.length };
}

function cleanOldBackups(backupsDir: string, retentionDays = 14): void {
  try {
    const files = fs.readdirSync(backupsDir);
    const now = Date.now();
    const maxAgeMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const f of files) {
      if (!f.endsWith('.zip')) continue;
      const full = path.join(backupsDir, f);
      const stat = fs.statSync(full);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(full);
        console.log(`[Backup] Removed old backup file: ${f}`);
      }
    }
  } catch (err) {
    console.warn('[Backup] Error cleaning old backups:', err);
  }
}
