import { json, preflight } from "../_shared/cors.ts";
import { requireSyncToken } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/db.ts";

const BATCH_LIMIT = 500;

// Sync Token only: the home PC's sync script uses this, never the frontend.
// It can only read unsynced items, never the full history.
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!(await requireSyncToken(req))) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .select("id, client_id, created_at, client_created_at, source, type, content, metadata, schema_version")
    .eq("sync_status", "new")
    .order("created_at", { ascending: true })
    .limit(BATCH_LIMIT);

  if (error) {
    console.error("sync-items: query failed", error);
    return json({ error: "query_failed" }, 500);
  }

  return json({ items: data ?? [] });
});
