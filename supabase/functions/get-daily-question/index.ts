import { json, preflight } from "../_shared/cors.ts";
import { requireCaptureToken } from "../_shared/auth.ts";
import { serviceClient } from "../_shared/db.ts";

function todayInTokyo(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Deterministic, non-cryptographic: same calendar date always picks the same index. */
function fnv1aIndex(date: string, count: number): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < date.length; i++) {
    hash ^= date.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash) % count;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "GET") {
    return json({ error: "method_not_allowed" }, 405);
  }

  if (!(await requireCaptureToken(req))) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = serviceClient();
  const date = todayInTokyo();

  const { data: questions, error: qErr } = await supabase
    .from("philosophy_questions")
    .select("id, text, category")
    .eq("active", true)
    .order("id", { ascending: true });

  if (qErr || !questions || questions.length === 0) {
    console.error("get-daily-question: question bank unavailable", qErr);
    return json({ error: "no_questions" }, 500);
  }

  const question = questions[fnv1aIndex(date, questions.length)];

  const { data: existing, error: aErr } = await supabase
    .from("inbox_items")
    .select("content")
    .eq("type", "philosophy_answer")
    .eq("metadata->>question_date", date)
    .limit(1)
    .maybeSingle();

  if (aErr) {
    console.error("get-daily-question: answer lookup failed", aErr);
    return json({ error: "lookup_failed" }, 500);
  }

  return json({
    date,
    question: { id: question.id, text: question.text, category: question.category },
    answered: !!existing,
    answer: existing?.content ?? null,
  });
});
