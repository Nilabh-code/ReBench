import raw from "../data/benchmarks.json";
import contributorRoster from "../data/contributors.json";
import { BENCHMARK_STATUS_VALUES, GPU_VENDOR_VALUES, TIMING_SOURCE_VALUES } from "./schema-types";
import type {
  BenchmarkIndex,
  BenchmarkRecord,
  ContributorAggregate,
  HardwareSlice,
  ModelAggregate,
  RawBenchmarkRecord,
} from "./types";

export interface ActivityDay {
  date: string;
  count: number;
}

/**
 * Narrows the two enum-valued fields that TypeScript widens to `string` when
 * importing JSON. Everything else is checked by the assignments below, so a
 * field missing from the index is a compile error and not an `undefined` in
 * the UI.
 */
function toRecord(r: RawBenchmarkRecord): BenchmarkRecord {
  const status = BENCHMARK_STATUS_VALUES.find((s) => s === r.status);
  const gpuVendor = GPU_VENDOR_VALUES.find((v) => v === r.gpuVendor);
  const timingSource = r.timingSource === undefined ? undefined : TIMING_SOURCE_VALUES.find((v) => v === r.timingSource);
  if (!status) throw new Error(`benchmarks.json: ${r.id} has unknown status "${r.status}"`);
  if (!gpuVendor) throw new Error(`benchmarks.json: ${r.id} has unknown gpuVendor "${r.gpuVendor}"`);
  if (r.timingSource !== undefined && !timingSource) throw new Error(`benchmarks.json: ${r.id} has unknown timingSource "${r.timingSource}"`);
  const { timingSource: _rawTimingSource, ...rest } = r;
  return { ...rest, status, gpuVendor, ...(timingSource ? { timingSource } : {}) };
}

// Typed assignments, not casts: BenchmarkIndex and RawBenchmarkRecord are
// generated from the same schema ajv validates the file against, so this is
// where a drift between data/benchmarks.json and the site's view of it shows up.
const rawRecords: RawBenchmarkRecord[] = raw.records;
const index: BenchmarkIndex = { ...raw, records: rawRecords.map(toRecord) };

export function isDemoData(): boolean {
  return index.demo === true;
}

export function allRecords(): BenchmarkRecord[] {
  // newest first for display; id is the tiebreaker so the order is stable.
  // Sorting on the id alone no longer works: its suffix is a content hash.
  return [...index.records].sort(
    (a, b) => b.timestamp.localeCompare(a.timestamp) || b.id.localeCompare(a.id)
  );
}

export function recordById(id: string): BenchmarkRecord | undefined {
  return index.records.find((r) => r.id === id);
}

/** The run shown in the hero instrument panel: the most recent one. */
export function referenceRecord(): BenchmarkRecord | undefined {
  return allRecords()[0];
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

/**
 * One aggregate per *model*, not per family: tokens/s is not comparable across
 * parameter counts, so a family-wide max ranks every family by its smallest
 * member.
 */
export function aggregateModels(): ModelAggregate[] {
  const map = new Map<string, BenchmarkRecord[]>();
  for (const r of index.records) {
    const list = map.get(r.model) ?? [];
    list.push(r);
    map.set(r.model, list);
  }
  const out: ModelAggregate[] = [];
  for (const [model, runs] of map) {
    const sorted = [...runs].sort((a, b) => b.generationTPS - a.generationTPS);
    out.push({
      model,
      family: runs[0].family,
      runs: sorted,
      bestGenerationTPS: sorted[0].generationTPS,
      bestPromptTPS: Math.max(...runs.map((r) => r.promptTPS)),
      bestRun: sorted[0],
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
