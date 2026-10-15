import { beforeEach, describe, expect, it } from "vitest";
import { consumeSetupFragment, getCaptureToken, getSource, hasToken } from "../src/lib/token";

describe("token", () => {
  beforeEach(() => {
    localStorage.clear();
    history.replaceState(null, "", "/");
  });

  it("stores the token and source from the URL fragment, then strips the fragment", () => {
    history.replaceState(null, "", "/#key=abc123&src=work");
    consumeSetupFragment();
    expect(getCaptureToken()).toBe("abc123");
    expect(getSource()).toBe("work");
    expect(location.hash).toBe("");
  });

  it("never sends the fragment anywhere: it is gone from the URL immediately", () => {
    history.replaceState(null, "", "/#key=secret-token&src=mobile");
    consumeSetupFragment();
    expect(location.href).not.toContain("secret-token");
  });

  it("defaults to mobile when no source is given", () => {
    history.replaceState(null, "", "/#key=abc123");
    consumeSetupFragment();
    expect(getSource()).toBe("mobile");
  });

  it("leaves an already-registered device untouched when there is no fragment", () => {
    localStorage.setItem("sage.captureToken", "existing");
    history.replaceState(null, "", "/");
    consumeSetupFragment();
    expect(getCaptureToken()).toBe("existing");
  });

  it("reports unregistered devices", () => {
    expect(hasToken()).toBe(false);
  });
});
