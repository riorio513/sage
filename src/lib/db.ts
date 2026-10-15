// Minimal IndexedDB-backed outbox. No external dependency: the API surface
// we need (put/getAll/delete on one object store) is a thin wrapper over
// raw IndexedDB, and a dependency isn't worth it for this much surface.

export type QueueStatus = "pending" | "failed";

export interface QueueItem {
  client_id: string;
  source: string;
  type: string;
  content: string | null;
  metadata: Record<string, unknown>;
  client_created_at: string;
  status: QueueStatus;
  attempts: number;
  last_error: string | null;
  queued_at: string;
}

const DB_NAME = "sage-outbox";
const DB_VERSION = 1;
const STORE = "queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "client_id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(item: QueueItem): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function listQueue(): Promise<QueueItem[]> {
  const db = await openDb();
  return new Promise<QueueItem[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function updateItem(item: QueueItem): Promise<void> {
  await enqueue(item);
}

export async function removeFromQueue(clientId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(clientId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
