import lockfile from 'proper-lockfile';
import fs from 'fs';
import path from 'path';

// In-memory mutex map for fast per-file concurrency control within the same process
const inMemoryLocks = new Map<string, Promise<void>>();

async function acquireMemoryLock(filePath: string): Promise<() => void> {
  while (inMemoryLocks.has(filePath)) {
    await inMemoryLocks.get(filePath);
  }

  let releaseMemLock: () => void;
  const promise = new Promise<void>((resolve) => {
    releaseMemLock = resolve;
  });
  inMemoryLocks.set(filePath, promise);

  return () => {
    inMemoryLocks.delete(filePath);
    releaseMemLock();
  };
}

/**
 * Executes a callback within a proper file lock + in-memory mutex.
 * This guarantees safe concurrent access across Passenger workers.
 */
export async function withLock<T>(filePath: string, fn: () => Promise<T>): Promise<T> {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  // Ensure file exists before locking with proper-lockfile
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, '{}', { flag: 'wx', mode: 0o600 });
  }

  const releaseMem = await acquireMemoryLock(filePath);

  let releaseFileLock: (() => Promise<void>) | null = null;
  try {
    releaseFileLock = await lockfile.lock(filePath, {
      retries: {
        retries: 15,
        factor: 2,
        minTimeout: 50,
        maxTimeout: 800,
        randomize: true,
      },
      stale: 10000,
      realpath: false,
    });
  } catch (lockErr) {
    console.warn(`[Lock] proper-lockfile warning for ${filePath}, proceeding with memory lock:`, lockErr);
  }

  try {
    return await fn();
  } finally {
    if (releaseFileLock) {
      try {
        await releaseFileLock();
      } catch (unlockErr) {
        console.warn(`[Lock] Failed to release lock on ${filePath}:`, unlockErr);
      }
    }
    releaseMem();
  }
}
