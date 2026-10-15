import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MoodForm from "../src/components/MoodForm";

beforeEach(() => {
  localStorage.setItem("sage.captureToken", "test-token");
  localStorage.setItem("sage.source", "mobile");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MoodForm", () => {
  it("keeps the submit button disabled until a score is picked", () => {
    render(<MoodForm />);
    expect(screen.getByRole("button", { name: "記録する" })).toBeDisabled();
  });

  it("submits the picked score", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<MoodForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "3" }));
    await user.click(screen.getByRole("button", { name: "記録する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.metadata.score).toBe(3);
    expect(body.type).toBe("mood");
  });
});
