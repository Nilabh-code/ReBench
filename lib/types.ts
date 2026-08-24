// The run record and the index envelope are generated from schema/ by
// scripts/generate-types.mjs. The aggregates below are view models, hand
// written on purpose: they have no schema counterpart.
export type {
  BenchmarkIndex,
  BenchmarkRecord,
  BenchmarkStatus,
  GpuVendor,
  RawBenchmarkRecord,
} from "./schema-types";

import type { BenchmarkRecord } from "./schema-types";

export interface ModelAggregate {
  /** the model itself, e.g. "Qwen3 27B" — aggregates are per model, not per family */
  model: string;
  family: string;
  runs: BenchmarkRecord[];
  bestGenerationTPS: number;
  bestPromptTPS: number;
  bestRun: BenchmarkRecord;
  quants: string[];
  engines: string[];
  hardwareCount: number;
}

export interface ContributorAggregate {
  handle: string;
  name?: string;
  github?: string;
  role?: string;
  runs: number;
  verified: number;
  families: string[];
  hardware: string[];
  lastRun?: BenchmarkRecord;
}

export interface HardwareSlice {
  hardware: string;
  count: number;
}
