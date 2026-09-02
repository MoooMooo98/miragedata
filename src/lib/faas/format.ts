// Formatting + numeric helpers — ported 1:1 from the FaaS Dashboard v8.3 model.

export function num(v: unknown, d = 0): number {
  const n = parseFloat(String(v));
  return isFinite(n) ? n : d;
}

export function clamp(v: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, v));
}

export function sign(v: number): string {
  return v >= 0 ? "+" : "";
}

export function fmtM(v: number): string {
  return isFinite(v) ? "€" + (v / 1e6).toFixed(2) + "M" : "–";
}

export function fmtEUR(v: number): string {
  if (!isFinite(v)) return "–";
  const a = Math.abs(v);
  return (v < 0 ? "–" : "") + "€" + Math.round(a).toLocaleString("de-DE");
}

export function fmtPct(v: number, d = 1): string {
  return isFinite(v) ? v.toFixed(d) + "%" : "–";
}

export function fmtX(v: number, d = 2): string {
  return isFinite(v) ? v.toFixed(d) + "x" : "–";
}

export function fmtYr(v: number | null | undefined): string {
  return v !== null && v !== undefined && isFinite(v) && v > 0
    ? v.toFixed(1) + " J."
    : "–";
}
