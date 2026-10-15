import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";

// VITE_SUPABASE_URL comes from .env.test (loaded by Vite before any module
// transform runs) — import.meta.env.X is statically inlined at transform
// time, so mutating it here at runtime would have no effect on code that
// was already transformed.
