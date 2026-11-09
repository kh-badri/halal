/**
 * Road To Halal Daily Snapshot Cron Script
 * Run via cPanel Cron:
 * 0 3 * * * /usr/local/bin/node /home/username/apps/roadtohalal/scripts/backup.js >> /home/username/roadtohalal-backup.log 2>&1
 */
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

// Base data directory
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'roadtohalal-data');
const backupsDir = path.join(dataDir, 'backups');

function addDirToZip(zip, dirPath, zipPrefix) {
  if (!fs.existsSync(dirPath)) return;
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      addDirToZip(zip, fullPath, `${zipPrefix}/${entry.name}`);
    } else if (entry.isFile() && !entry.name.endsWith('.bak')) {
      zip.file(`${zipPrefix}/${entry.name}`, fs.readFileSync(fullPath));
    }
  }
}

async function runBackup() {
  console.log(`[${new Date().toISOString()}] Starting Road To Halal daily backup...`);

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true, mode: 0o700 });
  }

  const zip = new JSZip();

  // 1. Pack index
  addDirToZip(zip, path.join(dataDir, 'index'), 'index');

  // 2. Pack users
  addDirToZip(zip, path.join(dataDir, 'users'), 'users');

  // 3. Pack workspaces
  addDirToZip(zip, path.join(dataDir, 'workspaces'), 'workspaces');

  // 4. Pack uploads
  addDirToZip(zip, path.join(dataDir, 'uploads'), 'uploads');

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
  console.log(`[Backup Success] File saved: ${destPath} (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Enforce 14-day retention
  try {
    const files = fs.readdirSync(backupsDir);
    const maxAgeMs = 14 * 24 * 60 * 60 * 1000;
    for (const f of files) {
      if (!f.endsWith('.zip')) continue;
      const full = path.join(backupsDir, f);
      const stat = fs.statSync(full);
      if (Date.now() - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(full);
        console.log(`[Backup Pruned] Removed backup older than 14 days: ${f}`);
      }
    }
  } catch (cleanErr) {
    console.warn('[Backup] Error cleaning old files:', cleanErr);
  }
}

runBackup()
  .then(() => {
    console.log(`[${new Date().toISOString()}] Backup finished successfully.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error(`[Backup Error] Failed:`, err);
    process.exit(1);
  });
