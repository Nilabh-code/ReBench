import raw from "../data/benchmarks.json";
import contributorRoster from "../data/contributors.json";
import type {
  BenchmarkRecord,
  ContributorAggregate,
  HardwareSlice,
  ModelAggregate,
} from "./types";

export interface BenchmarkIndex {
  demo: boolean;
  generated: string;
  benchmarkVersion: string;
  records: BenchmarkRecord[];
}

export interface ActivityDay {
  date: string;
  count: number;
}

const index = raw as unknown as BenchmarkIndex;

export function isDemoData(): boolean {
  return index.demo === true;
}

export function allRecords(): BenchmarkRecord[] {
  // newest first for display
  return [...index.records].sort((a, b) => b.id.localeCompare(a.id));
}

export function recordById(id: string): BenchmarkRecord | undefined {
  return index.records.find((r) => r.id === id);
}

export function referenceRecord(): BenchmarkRecord | undefined {
  return recordById("RUN-2026-08-24-000184") ?? allRecords()[0];
}

export function runActivity(days = 84): ActivityDay[] {
  const counts = new Map<string, number>();
  for (const record of index.records) {
    const day = record.timestamp.slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const end = new Date();
  return Array.from({ length: days }, (_, offset) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (days - 1 - offset));
    const key = date.toISOString().slice(0, 10);
    return { date: key, count: counts.get(key) ?? 0 };
  });
}

export function latestRecords(n: number): BenchmarkRecord[] {
  return allRecords().slice(0, n);
}

export function uniqueValues<K extends keyof BenchmarkRecord>(key: K): string[] {
  const set = new Set<string>();
  for (const r of index.records) set.add(String(r[key]));
  return [...set].sort();
}

export function aggregateModels(): ModelAggregate[] {
  const map = new Map<string, BenchmarkRecord[]>();
  for (const r of index.records) {
    const list = map.get(r.family) ?? [];
    list.push(r);
    map.set(r.family, list);
  }
  const out: ModelAggregate[] = [];
  for (const [family, runs] of map) {
    const best = [...runs].sort((a, b) => b.generationTPS - a.generationTPS)[0];
    out.push({
      model: runs[0].model.replace(/ \d+[Bb]$/, ""), // family display name
      family,
      runs: runs.sort((a, b) => b.generationTPS - a.generationTPS),
      bestGenerationTPS: best.generationTPS,
      bestPromptTPS: Math.max(...runs.map((r) => r.promptTPS)),
      bestRun: best,
      quants: [...new Set(runs.map((r) => r.quantization))].sort(),
      engines: [...new Set(runs.map((r) => r.engine))].sort(),
      hardwareCount: new Set(runs.map((r) => r.hardware)).size,
    });
  }
  return out.sort((a, b) => b.bestGenerationTPS - a.bestGenerationTPS);
}

export function aggregateContributors(): ContributorAggregate[] {
  const map = new Map<string, BenchmarkRecord[]>();
  for (const r of index.records) {
    const list = map.get(r.contributor) ?? [];
    list.push(r);
    map.set(r.contributor, list);
  }

  const out: ContributorAggregate[] = contributorRoster.map((person) => {
    const runs = map.get(person.handle) ?? [];
    const sorted = [...runs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    return {
      handle: person.handle,
      name: person.name,
      github: person.github,
      role: person.role,
      runs: runs.length,
      verified: runs.filter((r) => r.status === "VERIFIED").length,
      families: [...new Set(runs.map((r) => r.family))].sort(),
      hardware: [...new Set(runs.map((r) => r.hardware))].sort(),
      lastRun: sorted[0],
    };
  });

  for (const [handle, runs] of map) {
    if (out.some((person) => person.handle === handle)) continue;
    const sorted = [...runs].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    out.push({
      handle,
      runs: runs.length,
      verified: runs.filter((r) => r.status === "VERIFIED").length,
      families: [...new Set(runs.map((r) => r.family))].sort(),
      hardware: [...new Set(runs.map((r) => r.hardware))].sort(),
      lastRun: sorted[0],
    });
  }

  return out.sort((a, b) => b.runs - a.runs || a.handle.localeCompare(b.handle));
}

export function hardwareSlices(): HardwareSlice[] {
  const map = new Map<string, number>();
  for (const r of index.records) map.set(r.hardware, (map.get(r.hardware) ?? 0) + 1);
  return [...map.entries()]
    .map(([hardware, count]) => ({ hardware, count }))
    .sort((a, b) => b.count - a.count);
}

export function statusCounts(): Record<string, number> {
  const out: Record<string, number> = { VERIFIED: 0, REPRODUCED: 0, PENDING: 0 };
  for (const r of index.records) out[r.status] += 1;
  return out;
}

export const REPO_URL = "https://github.com/Nilabh-code/ReBench";
export const BUILD_HASH = "a1f3c9e";

export function resultFileUrl(r: BenchmarkRecord): string {
  return `${REPO_URL}/blob/main/results/${r.family}/${r.id}.json`;
}
