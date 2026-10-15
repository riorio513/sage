export class ValidationError extends Error {}

const SOURCES = new Set(["mobile", "work", "home"]);
const TYPES = new Set(["memo", "caffeine", "mood", "consult_later", "philosophy_answer"]);
const MAX_CONTENT_LENGTH = 20000;
const MAX_CLIENT_ID_LENGTH = 200;

export interface CaptureItem {
  client_id: string;
  source: string;
  type: string;
  content: string | null;
  metadata: Record<string, unknown>;
  client_created_at: string | null;
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Mirrors Life Agent's own stance: unset is unset, never a guessed default. */
export function validateCaptureBody(body: unknown): CaptureItem {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("リクエストの形式が不正です");
  }
  const b = body as Record<string, unknown>;

  const clientId = b.client_id;
  if (typeof clientId !== "string" || !clientId.trim() || clientId.length > MAX_CLIENT_ID_LENGTH) {
    throw new ValidationError("client_id が必要です");
  }

  const source = b.source;
  if (typeof source !== "string" || !SOURCES.has(source)) {
    throw new ValidationError("source は mobile / work / home のいずれかです");
  }

  const type = b.type;
  if (typeof type !== "string" || !TYPES.has(type)) {
    throw new ValidationError("type が不正です");
  }

  const content = b.content;
  if (content !== null && content !== undefined && typeof content !== "string") {
    throw new ValidationError("content は文字列です");
  }
  if (typeof content === "string" && content.length > MAX_CONTENT_LENGTH) {
    throw new ValidationError("content が長すぎます");
  }

  const metadataRaw = b.metadata ?? {};
  if (typeof metadataRaw !== "object" || metadataRaw === null || Array.isArray(metadataRaw)) {
    throw new ValidationError("metadata はオブジェクトです");
  }
  const metadata = metadataRaw as Record<string, unknown>;

  const clientCreatedAt = b.client_created_at;
  if (clientCreatedAt !== null && clientCreatedAt !== undefined && !isIsoDateTime(clientCreatedAt)) {
    throw new ValidationError("client_created_at の形式が不正です");
  }

  const trimmedContent = typeof content === "string" ? content : null;

  switch (type) {
    case "memo":
      if (!trimmedContent || !trimmedContent.trim()) {
        throw new ValidationError("メモの本文が空です");
      }
      break;
    case "consult_later":
      if (!trimmedContent || !trimmedContent.trim()) {
        throw new ValidationError("あとで相談の本文が空です");
      }
      break;
    case "caffeine": {
      if (!isIsoDateTime(metadata.consumed_at)) {
        throw new ValidationError("カフェインの摂取時刻が必要です");
      }
      const mg = metadata.amount_mg;
      if (mg !== null && mg !== undefined) {
        if (typeof mg !== "number" || !Number.isFinite(mg) || mg < 0 || mg > 5000) {
          throw new ValidationError("カフェイン量は0〜5000mgの数値、または不明として空にしてください");
        }
      }
      if (metadata.drink_name !== undefined && metadata.drink_name !== null && typeof metadata.drink_name !== "string") {
        throw new ValidationError("drink_name は文字列です");
      }
      break;
    }
    case "mood": {
      const score = metadata.score;
      if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5) {
        throw new ValidationError("気分は1〜5の整数で必須です。未入力を0にしません");
      }
      break;
    }
    case "philosophy_answer": {
      if (!trimmedContent || !trimmedContent.trim()) {
        throw new ValidationError("回答が空です");
      }
      if (!isIsoDate(metadata.question_date)) {
        throw new ValidationError("question_date (YYYY-MM-DD) が必要です");
      }
      if (typeof metadata.question_id !== "string" || !metadata.question_id) {
        throw new ValidationError("question_id が必要です");
      }
      if (typeof metadata.question_text !== "string" || !metadata.question_text.trim()) {
        throw new ValidationError("question_text が必要です");
      }
      break;
    }
  }

  return {
    client_id: clientId,
    source,
    type,
    content: trimmedContent,
    metadata,
    client_created_at: (clientCreatedAt as string | undefined) ?? null,
  };
}
