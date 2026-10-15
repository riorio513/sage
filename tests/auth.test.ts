import { afterEach, describe, expect, it } from "vitest";
import { requireCaptureToken, requireSyncToken } from "../supabase/functions/_shared/auth";

function withEnv(vars: Record<string, string>) {
  (globalThis as unknown as { Deno: { env: { get: (k: string) => string | undefined } } }).Deno = {
    env: { get: (k: string) => vars[k] },
  };
}

function request(headers: Record<string, string> = {}): Request {
  return new Request("https://example.com/f", { headers });
}

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

describe("requireCaptureToken", () => {
  it("accepts the exact configured token", async () => {
    withEnv({ SAGE_CAPTURE_TOKEN: "correct-token" });
    expect(await requireCaptureToken(request({ "x-sage-token": "correct-token" }))).toBe(true);
  });

  it("rejects a wrong token", async () => {
    withEnv({ SAGE_CAPTURE_TOKEN: "correct-token" });
    expect(await requireCaptureToken(request({ "x-sage-token": "wrong-token" }))).toBe(false);
  });

  it("rejects a missing header", async () => {
    withEnv({ SAGE_CAPTURE_TOKEN: "correct-token" });
    expect(await requireCaptureToken(request())).toBe(false);
  });

  it("fails closed when the secret itself is not configured", async () => {
    withEnv({});
    expect(await requireCaptureToken(request({ "x-sage-token": "anything" }))).toBe(false);
  });

  it("a valid Sync Token does not also work as a Capture Token", async () => {
    withEnv({ SAGE_CAPTURE_TOKEN: "capture-secret", SAGE_SYNC_TOKEN: "sync-secret" });
    expect(await requireCaptureToken(request({ "x-sage-token": "sync-secret" }))).toBe(false);
  });
});

describe("requireSyncToken", () => {
  it("accepts the exact configured sync token", async () => {
    withEnv({ SAGE_SYNC_TOKEN: "sync-secret" });
    expect(await requireSyncToken(request({ "x-sage-token": "sync-secret" }))).toBe(true);
  });

  it("a Capture Token does not also work as a Sync Token", async () => {
    withEnv({ SAGE_CAPTURE_TOKEN: "capture-secret", SAGE_SYNC_TOKEN: "sync-secret" });
    expect(await requireSyncToken(request({ "x-sage-token": "capture-secret" }))).toBe(false);
  });
});
