export type BenchmarkStatus = "VERIFIED" | "REPRODUCED" | "PENDING";

export interface BenchmarkRecord {
  /** Run identifier: RUN-YYYY-MM-DD-NNNNNN */
  id: string;
  model: string;
  /** model family slug, matches results/ directory name */
  family: string;
  /** pinned model revision (repository revision the weights were pulled from) */
  modelRevision: string;
  quantization: string;
  /** primary compute device (GPU model, or CPU id for CPU-only runs) */
  hardware: string;
  /** NVIDIA | AMD | APPLE | CPU */
  gpuVendor: string;
  /** GB of VRAM (unified memory for Apple silicon) */
  vram: number;
  /** GB of system RAM */
  ram: number;
  cpu: string;
  engine: string;
  engineVersion: string;
  benchmarkVersion: string;
  promptTokens: number;
  generatedTokens: number;
  /** prompt evaluation throughput, tokens/second */
  promptTPS: number;
  /** generation throughput, tokens/second */
  generationTPS: number;
  /** time to first token, milliseconds */
  ttft: number;
  /** ReBench composite index 0–100, see methodology §07 */
  score: number;
  /** github handle of the contributor who produced the run */
  contributor: string;
  /** ISO-8601 UTC timestamp of the run */
  timestamp: string;
  /** commit hash of the submitted result file in the ReBench repository */
  gitCommit: string;
  status: BenchmarkStatus;
}

export interface ModelAggregate {
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
