import fs from 'fs';
import path from 'path';

/**
 * Writes data to a file atomically:
 * 1. Writes to a temporary file in the same directory.
 * 2. Flushes to disk via fsync.
 * 3. Backs up existing file to .bak.
 * 4. Atomically renames temporary file to target file.
 */
export async function writeAtomic(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  const tmpPath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`;
  const bakPath = `${filePath}.bak`;

  let fd: number | null = null;
  try {
    // 1. Write to temp file
    fd = fs.openSync(tmpPath, 'w', 0o600);
    const buffer = Buffer.from(content, 'utf8');
    fs.writeSync(fd, buffer, 0, buffer.length, 0);

    // 2. Fsync to ensure write is flushed to disk
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = null;

    // 3. Backup existing file to .bak if it exists
    if (fs.existsSync(filePath)) {
      try {
        fs.copyFileSync(filePath, bakPath);
      } catch (bakErr) {
        console.warn(`[Storage] Warning: Failed to create backup at ${bakPath}:`, bakErr);
      }
    }

    // 4. Atomic rename
    fs.renameSync(tmpPath, filePath);
  } catch (error) {
    if (fd !== null) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
    if (fs.existsSync(tmpPath)) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
    }
    throw error;
  }
}
