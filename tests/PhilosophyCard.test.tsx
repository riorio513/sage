import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PhilosophyCard from "../src/components/PhilosophyCard";

beforeEach(() => {
  localStorage.setItem("sage.captureToken", "test-token");
  localStorage.setItem("sage.source", "mobile");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PhilosophyCard", () => {
  it("shows today's question and submits an answer", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("get-daily-question")) {
        return new Response(
          JSON.stringify({
            date: "2026-10-15",
            question: { id: "q-pride-01", text: "他人から一切評価されなくても続けたいことは何ですか？", category: "誇り" },
            answered: false,
            answer: null,
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PhilosophyCard />);
    await waitFor(() => expect(screen.getByText(/他人から一切評価されなくても/)).toBeInTheDocument());

    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("今の考えをそのまま書いてください"), "書くこと");
    await user.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => expect(screen.getByText("保存しました")).toBeInTheDocument());
    const captureCall = fetchMock.mock.calls.find((c) => (c[0] as string).includes("capture-item"));
    const body = JSON.parse((captureCall![1] as RequestInit).body as string);
    expect(body.metadata.question_id).toBe("q-pride-01");
    expect(body.metadata.question_date).toBe("2026-10-15");
    expect(body.metadata.question_text).toBe("他人から一切評価されなくても続けたいことは何ですか？");
  });

  it("shows 'already answered' and does not offer the form again", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              date: "2026-10-15",
              question: { id: "q-pride-01", text: "質問", category: "誇り" },
              answered: true,
              answer: "前の回答",
            }),
            { status: 200 },
          ),
      ),
    );
    render(<PhilosophyCard />);
    await waitFor(() => expect(screen.getByText(/回答済みです/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "送信" })).not.toBeInTheDocument();
  });
});
