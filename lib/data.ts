import raw from "../data/benchmarks.json";
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

export function referenceRecord(): BenchmarkRecord {
  return recordById("RUN-2026-08-24-000184") ?? index.records[index.records.length - 1];
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
  const out: ContributorAggregate[] = [];
  for (const [handle, runs] of map) {
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
  return out.sort((a, b) => b.runs - a.runs);
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
