export function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return "sage-" + crypto.randomUUID();
  }
  // Fallback for very old WebViews without crypto.randomUUID.
  return "sage-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}
