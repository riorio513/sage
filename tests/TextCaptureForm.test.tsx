import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TextCaptureForm from "../src/components/TextCaptureForm";

beforeEach(() => {
  localStorage.setItem("sage.captureToken", "test-token");
  localStorage.setItem("sage.source", "mobile");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TextCaptureForm (memo / consult_later)", () => {
  it("submits a memo and shows the saved toast, then clears the textarea", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<TextCaptureForm type="memo" title="メモ" placeholder="書く" />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("書く"), "新しい気づき");
    await user.click(screen.getByRole("button", { name: "送信" }));

    await waitFor(() => expect(screen.getByText("保存しました")).toBeInTheDocument());
    expect(screen.getByPlaceholderText("書く")).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.type).toBe("memo");
    expect(body.content).toBe("新しい気づき");
  });

  it("rejects an empty submission: the button stays disabled", async () => {
    render(<TextCaptureForm type="consult_later" title="あとで相談" placeholder="相談したいこと" />);
    expect(screen.getByRole("button", { name: "送信" })).toBeDisabled();
  });

  it("shows the queued message when offline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("offline");
      }),
    );
    render(<TextCaptureForm type="consult_later" title="あとで相談" placeholder="相談したいこと" />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText("相談したいこと"), "今日の会議の違和感について");
    await user.click(screen.getByRole("button", { name: "送信" }));
    await waitFor(() => expect(screen.getByText("端末に保存済み。通信回復後に送信します")).toBeInTheDocument());
  });
});
