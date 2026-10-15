import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../src/App";

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe("App", () => {
  it("shows the unregistered message when there is no Capture Token", () => {
    render(<App />);
    expect(screen.getByText("この端末はまだ登録されていません。")).toBeInTheDocument();
  });

  it("shows Home once a token exists, and never a login form", () => {
    localStorage.setItem("sage.captureToken", "test-token");
    render(<App />);
    expect(screen.getByRole("button", { name: /メモ/ })).toBeInTheDocument();
    expect(screen.queryByLabelText(/password|パスワード/i)).not.toBeInTheDocument();
  });

  it("shows the confidential-info notice only for work devices", () => {
    localStorage.setItem("sage.captureToken", "test-token");
    localStorage.setItem("sage.source", "work");
    render(<App />);
    expect(screen.getByText(/会社・顧客の機密情報は入力しないでください/)).toBeInTheDocument();
  });

  it("does not show the work notice for mobile devices", () => {
    localStorage.setItem("sage.captureToken", "test-token");
    localStorage.setItem("sage.source", "mobile");
    render(<App />);
    expect(screen.queryByText(/会社・顧客の機密情報/)).not.toBeInTheDocument();
  });

  it("navigates into a form and back without changing the URL path", async () => {
    localStorage.setItem("sage.captureToken", "test-token");
    render(<App />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /メモ/ }));
    expect(screen.getByPlaceholderText(/思ったこと/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /ホーム/ }));
    expect(screen.getByRole("button", { name: /メモ/ })).toBeInTheDocument();
  });
});
