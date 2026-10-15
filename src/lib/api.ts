import { getCaptureToken } from "./token";
import type { QueueItem } from "./db";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const TIMEOUT_MS = 8000;

function functionsUrl(name: string): string {
  if (!SUPABASE_URL) throw new Error("VITE_SUPABASE_URL が設定されていません");
  return `${SUPABASE_URL.replace(/\/$/, "")}/functions/v1/${name}`;
}

async function withTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

export type SubmitOutcome =
  | { kind: "ok"; duplicate: boolean }
  | { kind: "rejected"; message: string }
  | { kind: "network_error" };

export async function submitItem(item: QueueItem): Promise<SubmitOutcome> {
  const token = getCaptureToken();
  if (!token) return { kind: "rejected", message: "端末が未登録です" };
  try {
    const res = await withTimeout((signal) =>
      fetch(functionsUrl("capture-item"), {
        method: "POST",
        signal,
        headers: { "content-type": "application/json", "x-sage-token": token },
        body: JSON.stringify({
          client_id: item.client_id,
          source: item.source,
          type: item.type,
          content: item.content,
          metadata: item.metadata,
          client_created_at: item.client_created_at,
        }),
      }),
    );
    if (res.ok) {
      const data = await res.json();
      return { kind: "ok", duplicate: !!data.duplicate };
    }
    if (res.status >= 400 && res.status < 500) {
      const data = await res.json().catch(() => ({}));
      return { kind: "rejected", message: data.message ?? `送信を拒否されました (${res.status})` };
    }
    return { kind: "network_error" };
  } catch {
    return { kind: "network_error" };
  }
}

export interface DailyQuestion {
  date: string;
  question: { id: string; text: string; category: string };
  answered: boolean;
  answer: string | null;
}

export async function fetchDailyQuestion(): Promise<DailyQuestion | null> {
  const token = getCaptureToken();
  if (!token) return null;
  try {
    const res = await withTimeout((signal) =>
      fetch(functionsUrl("get-daily-question"), {
        method: "GET",
        signal,
        headers: { "x-sage-token": token },
      }),
    );
    if (!res.ok) return null;
    return (await res.json()) as DailyQuestion;
  } catch {
    return null;
  }
}
