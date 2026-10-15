// Capture Token and Sync Token are two independent secrets stored only as
// Supabase Function secrets (never written to the database, never shipped
// in frontend source). Capture Token can submit new items and read today's
// philosophy question; it cannot list or read back any stored item. Sync
// Token can list unsynced items and acknowledge them; it is used only by
// the home PC and is never sent to the frontend.

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function checkToken(req: Request, envName: string): Promise<boolean> {
  const expected = Deno.env.get(envName);
  if (!expected) return false; // Secret not configured: fail closed.
  const provided = req.headers.get("x-sage-token") ?? "";
  if (!provided) return false;
  const [expectedHash, providedHash] = await Promise.all([sha256Hex(expected), sha256Hex(provided)]);
  return timingSafeEqual(expectedHash, providedHash);
}

export function requireCaptureToken(req: Request): Promise<boolean> {
  return checkToken(req, "SAGE_CAPTURE_TOKEN");
}

export function requireSyncToken(req: Request): Promise<boolean> {
  return checkToken(req, "SAGE_SYNC_TOKEN");
}
