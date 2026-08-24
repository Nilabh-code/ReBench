// Deterministic demo activity for the community pages.
// All of this is synthetic; labeled DEMO DATA on the pages that use it.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface ActivityWeek {
  /** start date of the week, ISO */
  start: string;
  /** 7 days, runs per day 0..10 */
  days: number[];
  total: number;
}

/** 52 weeks x 7 days ending on 2026-08-24, seeded */
export function contributionWeeks(seed = 0x5eb3e61): ActivityWeek[] {
  const rand = mulberry32(seed);
  const end = new Date(Date.UTC(2026, 7, 24));
  const weeks: ActivityWeek[] = [];
  for (let w = 51; w >= 0; w--) {
    const start = new Date(end.getTime() - (w * 7 + end.getUTCDay()) * 86400000);
    const energy = 0.25 + 0.75 * Math.sin((51 - w) / 8) ** 2 + rand() * 0.35;
    const days = Array.from({ length: 7 }, (_, d) => {
      const weekend = d === 0 || d === 6 ? 0.45 : 1;
      const x = rand() * energy * weekend;
      if (x < 0.18) return 0;
      return Math.min(10, Math.ceil(x * 9));
    });
    weeks.push({
      start: start.toISOString().slice(0, 10),
      days,
      total: days.reduce((s, d) => s + d, 0),
    });
  }
  return weeks;
}

/** 3 rows of ascii blocks, derived from the same seed */
export function asciiActivity(): string[] {
  const weeks = contributionWeeks();
  const rows = [0, 1, 2].map((r) =>
    weeks
      .slice(r * 17, r * 17 + 17)
      .flatMap((w) => w.days.slice(0, 3))
      .map((d) => (d === 0 ? "░" : d < 4 ? "▒" : d < 7 ? "▓" : "█"))
      .join("")
  );
  return rows;
}
