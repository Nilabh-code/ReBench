export function fmtNum(n: number, digits = 1): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function fmtMs(n: number): string {
  if (n >= 1000) return `${fmtNum(n / 1000, 2)} s`;
  return `${fmtInt(n)} ms`;
}

export function shortHash(s: string, len = 7): string {
  return s.slice(0, len);
}

/** 2026-08-24T09:14:03Z -> 2026-08-24 09:14:03 UTC */
export function fmtStamp(iso: string): string {
  return iso.replace("T", " ").replace("Z", "") + " UTC";
}

/** 2026-08-24T09:14:03Z -> 2026-08-24 */
export function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

/** ascii bar of fixed width, 0..value/max */
export function asciiBar(value: number, max: number, width = 24): string {
  if (max <= 0) return "░".repeat(width);
  const filled = Math.max(0, Math.round((value / max) * width));
  return "█".repeat(Math.min(filled, width)) + "░".repeat(Math.max(width - filled, 0));
}
