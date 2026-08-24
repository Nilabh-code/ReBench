import raw from "../data/benchmarks.json";
import contributorRoster from "../data/contributors.json";
import type {
  BenchmarkRecord,
  BenchmarkStatus,
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

const STATUSES: readonly BenchmarkStatus[] = ["VERIFIED", "REPRODUCED", "PENDING"];

/**
 * Narrows one raw JSON record to BenchmarkRecord. Every field except `status`
 * is checked structurally by the compiler: drop a field from the index and
 * `npm run typecheck` fails here rather than rendering `undefined`.
 */
function toRecord(r: (typeof raw)["records"][number]): BenchmarkRecord {
  const status = STATUSES.find((s) => s === r.status);
  if (!status) {
    throw new Error(`benchmarks.json: record ${r.id} has unknown status "${r.status}"`);
  }
  return { ...r, status };
}

const index: BenchmarkIndex = {
  demo: raw.demo,
  generated: raw.generated,
  benchmarkVersion: raw.benchmarkVersion,
  records: raw.records.map(toRecord),
};

export function isDemoData(): boolean {
  return index.demo === true;
}

export function allRecords(): BenchmarkRecord[] {
  // newest first for display; id is the tiebreaker so the order is stable
  return [...index.records].sort(
    (a, b) => b.timestamp.localeCompare(a.timestamp) || b.id.localeCompare(a.id)
  );
}

export function recordById(id: string): BenchmarkRecord | undefined {
  return index.records.find((r) => r.id === id);
}

/** The run shown in the hero instrument panel: the most recent one. */
export function referenceRecord(): BenchmarkRecord {
  const [newest] = allRecords();
  if (!newest) throw new Error("benchmarks.json contains no records");
  return newest;
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
 * parameter counts, so a family-wide max would rank every family by its
 * smallest member.
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

export function statusCounts(): Record<BenchmarkStatus, number> {
  const out: Record<BenchmarkStatus, number> = { VERIFIED: 0, REPRODUCED: 0, PENDING: 0 };
  for (const r of index.records) out[r.status] += 1;
  return out;
}

export const REPO_URL = "https://github.com/Nilabh-code/ReBench";
export const BUILD_HASH = "a1f3c9e";

export function resultFileUrl(r: BenchmarkRecord): string {
  return `${REPO_URL}/blob/main/results/${r.family}/${r.id}.json`;
}
