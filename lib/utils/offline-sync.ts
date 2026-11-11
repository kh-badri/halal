/**
 * IndexedDB Offline Sync Queue
 * Automatically saves mutations when offline, and replays them when internet connection resumes.
 */

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
}

const DB_NAME = 'roadtohalal_offline_store';
const STORE_NAME = 'mutation_queue';

function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported in this environment'));
    }

    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function queueOfflineMutation(url: string, method: string, body: any): Promise<void> {
  try {
    const db = await openOfflineDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const item: QueuedMutation = {
      id: `mut_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url,
      method,
      body,
      timestamp: Date.now(),
    };

    store.add(item);
  } catch (err) {
    console.warn('[OfflineQueue] Failed to queue offline mutation:', err);
  }
}

export async function flushOfflineQueue(onStatusChange?: (count: number) => void): Promise<void> {
  if (typeof window === 'undefined' || !navigator.onLine) return;

  try {
    const db = await openOfflineDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getAllReq = store.getAll();
    getAllReq.onsuccess = async () => {
      const queue: QueuedMutation[] = getAllReq.result || [];
      if (queue.length === 0) return;

      if (onStatusChange) onStatusChange(queue.length);
      console.log(`[OfflineQueue] Syncing ${queue.length} offline mutations...`);

      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method,
            headers: { 'Content-Type': 'application/json' },
            body: item.body ? JSON.stringify(item.body) : undefined,
          });

          if (res.ok) {
            const delTx = db.transaction(STORE_NAME, 'readwrite');
            delTx.objectStore(STORE_NAME).delete(item.id);
          }
        } catch (postErr) {
          console.warn('[OfflineQueue] Sync error on item:', postErr);
          break; // Stop and retry later on next reconnect
        }
      }

      if (onStatusChange) onStatusChange(0);
    };
  } catch (err) {
    console.warn('[OfflineQueue] Flush error:', err);
  }
}

// Auto-register listener in browser
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[Road To Halal] Connection restored. Flushing offline queue...');
    flushOfflineQueue();
  });
}
