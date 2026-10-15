import { describe, expect, it } from "vitest";
import { validateCaptureBody, ValidationError } from "../supabase/functions/_shared/validate";

describe("validateCaptureBody", () => {
  it("accepts a well-formed memo", () => {
    const item = validateCaptureBody({
      client_id: "sage-1",
      source: "mobile",
      type: "memo",
      content: "気づいたこと",
      metadata: {},
      client_created_at: new Date().toISOString(),
    });
    expect(item.type).toBe("memo");
  });

  it("rejects an empty memo", () => {
    expect(() =>
      validateCaptureBody({ client_id: "sage-2", source: "mobile", type: "memo", content: "   ", metadata: {} }),
    ).toThrow(ValidationError);
  });

  it("rejects caffeine without a consumption time", () => {
    expect(() =>
      validateCaptureBody({
        client_id: "sage-3",
        source: "mobile",
        type: "caffeine",
        content: null,
        metadata: { amount_mg: 100 },
      }),
    ).toThrow(ValidationError);
  });

  it("accepts caffeine with an unknown amount left as null, never guessed", () => {
    const item = validateCaptureBody({
      client_id: "sage-4",
      source: "mobile",
      type: "caffeine",
      content: null,
      metadata: { amount_mg: null, consumed_at: new Date().toISOString(), drink_name: "coffee" },
    });
    expect((item.metadata as { amount_mg: unknown }).amount_mg).toBeNull();
  });

  it("rejects an out-of-range caffeine amount", () => {
    expect(() =>
      validateCaptureBody({
        client_id: "sage-5",
        source: "mobile",
        type: "caffeine",
        content: null,
        metadata: { amount_mg: 999999, consumed_at: new Date().toISOString() },
      }),
    ).toThrow(ValidationError);
  });

  it("rejects a mood score of 0 — unset is never 0", () => {
    expect(() =>
      validateCaptureBody({ client_id: "sage-6", source: "mobile", type: "mood", content: null, metadata: { score: 0 } }),
    ).toThrow(ValidationError);
  });

  it("rejects a missing mood score entirely", () => {
    expect(() =>
      validateCaptureBody({ client_id: "sage-7", source: "mobile", type: "mood", content: null, metadata: {} }),
    ).toThrow(ValidationError);
  });

  it("accepts a valid mood score", () => {
    const item = validateCaptureBody({
      client_id: "sage-8",
      source: "mobile",
      type: "mood",
      content: "note",
      metadata: { score: 4 },
    });
    expect((item.metadata as { score: number }).score).toBe(4);
  });

  it("rejects an unknown source", () => {
    expect(() =>
      validateCaptureBody({ client_id: "sage-9", source: "space", type: "memo", content: "x", metadata: {} }),
    ).toThrow(ValidationError);
  });

  it("rejects an unknown type", () => {
    expect(() =>
      validateCaptureBody({ client_id: "sage-10", source: "mobile", type: "nonsense", content: "x", metadata: {} }),
    ).toThrow(ValidationError);
  });

  it("rejects a philosophy answer without question metadata", () => {
    expect(() =>
      validateCaptureBody({
        client_id: "sage-11",
        source: "mobile",
        type: "philosophy_answer",
        content: "answer",
        metadata: {},
      }),
    ).toThrow(ValidationError);
  });

  it("rejects a philosophy answer missing question_text even if question_id/date are present", () => {
    expect(() =>
      validateCaptureBody({
        client_id: "sage-11b",
        source: "mobile",
        type: "philosophy_answer",
        content: "answer",
        metadata: { question_id: "q-1", question_date: "2026-10-15" },
      }),
    ).toThrow(ValidationError);
  });

  it("accepts a well-formed philosophy answer, carrying the question text verbatim", () => {
    const item = validateCaptureBody({
      client_id: "sage-11c",
      source: "mobile",
      type: "philosophy_answer",
      content: "書くこと",
      metadata: { question_id: "q-pride-01", question_date: "2026-10-15", question_text: "他人から一切評価されなくても続けたいことは何ですか？" },
    });
    expect((item.metadata as { question_text: string }).question_text).toBe("他人から一切評価されなくても続けたいことは何ですか？");
  });

  it("rejects an overly long memo", () => {
    expect(() =>
      validateCaptureBody({
        client_id: "sage-12",
        source: "mobile",
        type: "memo",
        content: "a".repeat(20001),
        metadata: {},
      }),
    ).toThrow(ValidationError);
  });

  it("rejects XSS-looking content as a plain string without executing it (stored as-is, never evaluated)", () => {
    const item = validateCaptureBody({
      client_id: "sage-13",
      source: "mobile",
      type: "memo",
      content: "<script>alert(1)</script>",
      metadata: {},
    });
    expect(item.content).toBe("<script>alert(1)</script>");
  });

  it("accepts unicode and Japanese content unchanged", () => {
    const text = "新人への説明では、最初に完成例を見せた方が理解が早かった気がする 🌱";
    const item = validateCaptureBody({ client_id: "sage-14", source: "mobile", type: "memo", content: text, metadata: {} });
    expect(item.content).toBe(text);
  });

  it("rejects a missing client_id", () => {
    expect(() => validateCaptureBody({ source: "mobile", type: "memo", content: "x", metadata: {} })).toThrow(
      ValidationError,
    );
  });

  it("rejects a non-object body", () => {
    expect(() => validateCaptureBody("not an object")).toThrow(ValidationError);
  });
});
