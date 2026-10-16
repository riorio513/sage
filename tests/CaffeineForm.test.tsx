import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CaffeineForm from "../src/components/CaffeineForm";

beforeEach(() => {
  localStorage.setItem("sage.captureToken", "test-token");
  localStorage.setItem("sage.source", "mobile");
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("CaffeineForm", () => {
  it("submits with an explicit amount", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CaffeineForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/量 \(mg\)/), "120");
    await user.type(screen.getByLabelText("飲み物名(任意)"), "coffee");
    await user.click(screen.getByRole("button", { name: "記録する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.metadata.amount_mg).toBe(120);
    expect(body.metadata.drink_name).toBe("coffee");
  });

  it("fills amount and drink name from a preset", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CaffeineForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "モンエナ 355ml" }));
    expect(screen.getByLabelText(/量 \(mg\)/)).toHaveValue(142);
    await user.click(screen.getByRole("button", { name: "記録する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.metadata.amount_mg).toBe(142);
    expect(body.metadata.drink_name).toBe("モンスターエナジー 355ml");
  });

  it("never guesses a default amount: leaving it blank sends null, not 0", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, duplicate: false }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    render(<CaffeineForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "記録する" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const body = JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string);
    expect(body.metadata.amount_mg).toBeNull();
    expect(body.metadata.drink_name).toBeNull();
  });
});
