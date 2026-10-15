// Capture Token handling (spec §5). The token travels only in the URL
// fragment (never sent to any server as part of the URL — fragments are not
// included in HTTP requests), is read once, stored in localStorage, and
// stripped from the address bar immediately.

const TOKEN_KEY = "sage.captureToken";
const SOURCE_KEY = "sage.source";

export type SageSource = "mobile" | "work" | "home";

function isSource(value: string | null): value is SageSource {
  return value === "mobile" || value === "work" || value === "home";
}

/** Call once on app start, before anything else reads the token. */
export function consumeSetupFragment(): void {
  if (!location.hash || location.hash.length < 2) return;
  const params = new URLSearchParams(location.hash.slice(1));
  const key = params.get("key");
  const src = params.get("src");
  if (key) {
    try {
      localStorage.setItem(TOKEN_KEY, key);
      if (isSource(src)) localStorage.setItem(SOURCE_KEY, src);
    } catch {
      // Storage unavailable (private mode / quota); the URL is still cleaned below.
    }
  }
  // Always strip the fragment, even if storage failed, so the token never
  // lingers in browser history or gets shared via "copy link".
  history.replaceState(null, "", location.pathname + location.search);
}

export function getCaptureToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getSource(): SageSource {
  try {
    const value = localStorage.getItem(SOURCE_KEY);
    return isSource(value) ? value : "mobile";
  } catch {
    return "mobile";
  }
}

export function hasToken(): boolean {
  return !!getCaptureToken();
}
