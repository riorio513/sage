import { json, preflight } from "../_shared/cors.ts";
import { requireCaptureToken } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/db.ts";
import { validateCaptureBody, ValidationError } from "../_shared/validate.ts";

const MAX_BODY_BYTES = 100_000;

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!(await requireCaptureToken(req))) {
    return json({ error: "unauthorized" }, 401);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json({ error: "payload_too_large" }, 413);
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  let item;
  try {
    item = validateCaptureBody(parsedBody);
  } catch (err) {
    if (err instanceof ValidationError) {
      return json({ error: "invalid_item", message: err.message }, 400);
    }
    throw err;
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("inbox_items")
    .upsert(
      {
        client_id: item.client_id,
        source: item.source,
        type: item.type,
        content: item.content,
        metadata: item.metadata,
        client_created_at: item.client_created_at,
      },
      { onConflict: "client_id", ignoreDuplicates: true },
    )
    .select("id");

  if (error) {
    console.error("capture-item insert failed", error);
    return json({ error: "save_failed" }, 500);
  }

  // ignoreDuplicates means a resubmission of the same client_id returns no
  // row here; that is success too (idempotent retry from the offline queue).
  return json({ ok: true, duplicate: (data?.length ?? 0) === 0 }, 200);
});
