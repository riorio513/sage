import { describe, expect, it } from "vitest";
import { enqueue, listQueue, removeFromQueue, updateItem, type QueueItem } from "../src/lib/db";

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    client_id: "sage-test-1",
    source: "mobile",
    type: "memo",
    content: "hello",
    metadata: {},
    client_created_at: new Date().toISOString(),
    status: "pending",
    attempts: 0,
    last_error: null,
    queued_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("outbox db", () => {
  it("enqueues and lists items", async () => {
    const item = makeItem();
    await enqueue(item);
    const all = await listQueue();
    expect(all.find((i) => i.client_id === item.client_id)).toMatchObject({ content: "hello" });
    await removeFromQueue(item.client_id);
  });

  it("removes items once sent", async () => {
    const item = makeItem({ client_id: "sage-test-2" });
    await enqueue(item);
    await removeFromQueue(item.client_id);
    const all = await listQueue();
    expect(all.find((i) => i.client_id === item.client_id)).toBeUndefined();
  });

  it("updates status without creating a duplicate row", async () => {
    const item = makeItem({ client_id: "sage-test-3" });
    await enqueue(item);
    await updateItem({ ...item, status: "failed", last_error: "boom" });
    const all = await listQueue();
    const matches = all.filter((i) => i.client_id === "sage-test-3");
    expect(matches).toHaveLength(1);
    expect(matches[0].status).toBe("failed");
    await removeFromQueue(item.client_id);
  });
});
