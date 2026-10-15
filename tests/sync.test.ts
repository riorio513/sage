import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { captureAndSend, flushQueue } from "../src/lib/sync";
import { listQueue } from "../src/lib/db";

beforeEach(() => {
  localStorage.setItem("sage.captureToken", "test-token");
  localStorage.setItem("sage.source", "mobile");
});

afterEach(async () => {
  vi.unstubAllGlobals();
  const remaining = await listQueue();
  // Tests close over whichever client_ids they created; this just keeps the
  // fake IndexedDB clean between tests without needing a global reset hook.
  await Promise.all(remaining.map((i) => import("../src/lib/db").then((db) => db.removeFromQueue(i.client_id))));
});

describe("captureAndSend", () => {
  it("sends immediately and clears the outbox on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 })),
    );
    const result = await captureAndSend({ type: "memo", content: "test memo", metadata: {} });
    expect(result).toBe("sent");
    expect(await listQueue()).toHaveLength(0);
  });

  it("keeps the item queued when the network is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("network error");
      }),
    );
    const result = await captureAndSend({ type: "memo", content: "offline memo", metadata: {} });
    expect(result).toBe("queued");
    const queue = await listQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0].status).toBe("pending");
  });

  it("marks a server-rejected item as failed, not a silent retry loop", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "invalid_item", message: "bad" }), { status: 400 })),
    );
    const result = await captureAndSend({ type: "memo", content: "bad memo", metadata: {} });
    expect(result).toBe("queued");
    const queue = await listQueue();
    expect(queue[0].status).toBe("failed");
  });
});

describe("flushQueue", () => {
  it("sends pending items once connectivity returns, without resending failed ones", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    await captureAndSend({ type: "memo", content: "queued while offline", metadata: {} });
    expect(await listQueue()).toHaveLength(1);

    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        calls.push(url);
        return new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 });
      }),
    );
    await flushQueue();
    expect(calls).toHaveLength(1);
    expect(await listQueue()).toHaveLength(0);
  });
});
