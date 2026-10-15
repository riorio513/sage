import { enqueue, listQueue, removeFromQueue, updateItem, type QueueItem, type QueueStatus } from "./db";
import { submitItem } from "./api";
import { newClientId } from "./id";
import { getSource } from "./token";

export interface NewItemInput {
  type: string;
  content: string | null;
  metadata: Record<string, unknown>;
}

type Listener = (queue: QueueItem[]) => void;
const listeners = new Set<Listener>();

export function subscribeQueue(listener: Listener): () => void {
  listeners.add(listener);
  listQueue().then((q) => listener(q));
  return () => listeners.delete(listener);
}

async function notify(): Promise<void> {
  const queue = await listQueue();
  for (const l of listeners) l(queue);
}

/**
 * Always durable-first: the item is written to IndexedDB before any network
 * attempt, so closing the tab mid-request can never lose the content. The
 * immediate send attempt is just a best-effort shortcut to clear it fast.
 */
export async function captureAndSend(input: NewItemInput): Promise<"sent" | "queued"> {
  const item: QueueItem = {
    client_id: newClientId(),
    source: getSource(),
    type: input.type,
    content: input.content,
    metadata: input.metadata,
    client_created_at: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    last_error: null,
    queued_at: new Date().toISOString(),
  };
  await enqueue(item);
  await notify();

  const result = await attemptSend(item);
  await notify();
  return result === "ok" ? "sent" : "queued";
}

async function attemptSend(item: QueueItem): Promise<"ok" | "kept"> {
  const outcome = await submitItem(item);
  if (outcome.kind === "ok") {
    await removeFromQueue(item.client_id);
    return "ok";
  }
  if (outcome.kind === "rejected") {
    await updateItem({ ...item, status: "failed" as QueueStatus, last_error: outcome.message, attempts: item.attempts + 1 });
    return "kept";
  }
  await updateItem({ ...item, status: "pending" as QueueStatus, last_error: null, attempts: item.attempts + 1 });
  return "kept";
}

let flushing = false;

export async function flushQueue(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    const queue = await listQueue();
    for (const item of queue) {
      if (item.status === "failed") continue; // Needs the user or a token fix, not a blind retry.
      await attemptSend(item);
    }
  } finally {
    flushing = false;
    await notify();
  }
}

export function retryItem(clientId: string): void {
  listQueue().then(async (queue) => {
    const item = queue.find((q) => q.client_id === clientId);
    if (!item) return;
    await updateItem({ ...item, status: "pending", last_error: null });
    await flushQueue();
  });
}

let started = false;

export function startBackgroundSync(): void {
  if (started) return;
  started = true;
  flushQueue();
  window.addEventListener("online", () => flushQueue());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") flushQueue();
  });
  setInterval(() => flushQueue(), 20_000);
}
