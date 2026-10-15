import { json, preflight } from "../_shared/cors.ts";
import { requireSyncToken } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/db.ts";

const MAX_IDS = 500;

// Called only after the home PC has durably written an item to its local
// Inbox (temp file -> fsync -> atomic rename -> ledger row). Marking an item
// synced before that local write is confirmed would risk silent data loss
// if the PC crashes in between.
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!(await requireSyncToken(req))) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const ids = (body as { ids?: unknown })?.ids;
  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
    return json({ error: "ids must be a non-empty string array" }, 400);
  }
  if (ids.length > MAX_IDS) {
    return json({ error: "too_many_ids" }, 400);
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .update({ sync_status: "synced", synced_at: new Date().toISOString() })
    .in("id", ids)
    .eq("sync_status", "new")
    .select("id");

  if (error) {
    console.error("ack-items: update failed", error);
    return json({ error: "update_failed" }, 500);
  }

  return json({ acknowledged: data?.map((r) => r.id) ?? [] });
});
