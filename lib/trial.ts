export const ANON_PREVIEW_LIMIT = 3;

// Anonymous preview usage is device-local (localStorage).
// This is intentionally separate from account trial usage in Supabase.
const ANON_KEY = "pmrprep_anon_preview_used_v1";

export function getAnonUsed(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(ANON_KEY);
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function setAnonUsed(n: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ANON_KEY, String(Math.max(0, Math.floor(n))));
}

export function incrementAnonUsed(delta: number = 1): number {
  const next = getAnonUsed() + delta;
  setAnonUsed(next);
  return next;
}

export function resetAnonUsed() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ANON_KEY);
}
