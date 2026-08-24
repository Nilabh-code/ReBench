// Deterministic demo-data generator for ReBench.
//
// This script produces data/benchmarks.json. The output is committed so the
// website can be built without running the generator. The same script (with
// real inputs) is the shape of what CI will run once results/ starts filling
// up: read raw run files, validate against schema/, emit the index.
//
//   node scripts/generate-data.mjs
//
// Every number here is SYNTHETIC. Physics are loosely modeled
// (memory-bandwidth-bound generation, compute-bound prompt processing) so the
// demo data is internally plausible, but none of it was measured.

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { runId } from "./run-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// ---------------------------------------------------------------- seeded rng
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(0x5eb3e61); // seed: "REBENCH"
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (lo, hi) => lo + rand() * (hi - lo);
const rint = (lo, hi) => Math.floor(between(lo, hi + 1));

function hex(len) {
  let s = "";
  while (s.length < len) s += Math.floor(rand() * 16).toString(16);
  return s.slice(0, len);
}

// ------------------------------------------------------------------ hardware
// bw GB/s (effective), tf16 TFLOPS fp16, vram GB, vendor
const GPUS = [
  { name: "RTX 5090", vram: 32, bw: 1790, tf16: 209, vendor: "NVIDIA", cpus: ["Ryzen 9 9950X", "Core i9-14900K"], ram: [64, 96] },
  { name: "RTX 5080", vram: 16, bw: 960, tf16: 112, vendor: "NVIDIA", cpus: ["Ryzen 7 9800X3D", "Core i7-14700K"], ram: [32, 64] },
  { name: "RTX 4090", vram: 24, bw: 1008, tf16: 165, vendor: "NVIDIA", cpus: ["Ryzen 9 7950X", "Core i9-13900K"], ram: [64, 128] },
  { name: "RTX 3090", vram: 24, bw: 936, tf16: 71, vendor: "NVIDIA", cpus: ["Ryzen 9 5950X", "Core i9-12900K"], ram: [64, 128] },
  { name: "RTX 4060 Ti 16GB", vram: 16, bw: 288, tf16: 44, vendor: "NVIDIA", cpus: ["Ryzen 5 7600", "Core i5-13600K"], ram: [32, 64] },
  { name: "RTX A6000", vram: 48, bw: 768, tf16: 77, vendor: "NVIDIA", cpus: ["Threadripper 3970X", "Xeon w-2295"], ram: [128, 256] },
  { name: "L40S", vram: 48, bw: 864, tf16: 91, vendor: "NVIDIA", cpus: ["Xeon Gold 6430", "Xeon Silver 4414Y"], ram: [128, 256] },
  { name: "A100 80GB SXM", vram: 80, bw: 2039, tf16: 312, vendor: "NVIDIA", cpus: ["EPYC 7763", "EPYC 9354"], ram: [256, 512] },
  { name: "H100 SXM", vram: 80, bw: 3350, tf16: 989, vendor: "NVIDIA", cpus: ["Xeon Platinum 8480+", "EPYC 9654"], ram: [512, 1024] },
  { name: "RX 7900 XTX", vram: 24, bw: 960, tf16: 123, vendor: "AMD", cpus: ["Ryzen 9 7900X", "Ryzen 7 7700X"], ram: [64] },
  { name: "M3 Ultra", vram: 192, bw: 819, tf16: 32, vendor: "APPLE", cpus: ["M3 Ultra"], ram: [192] },
  { name: "M2 Ultra", vram: 192, bw: 800, tf16: 27, vendor: "APPLE", cpus: ["M2 Ultra"], ram: [192] },
];

// engine: efficiency factor on bandwidth, compute factor, version pool,
// prompt/gen batching strength (prompt TPS multiplier relative to gen TPS)
const ENGINES = {
  "llama.cpp": { bwEff: [0.62, 0.74], ver: ["b5117", "b5203", "b5240"], promptMul: [9, 15], quants: ["Q4_K_M", "Q5_K_M", "Q6_K", "Q8_0", "Q3_K_L"] },
  "vLLM": { bwEff: [0.55, 0.68], ver: ["0.8.5", "0.9.2"], promptMul: [14, 24], quants: ["FP16", "FP8", "Q8_0"] },
  "exllamav2": { bwEff: [0.68, 0.8], ver: ["0.3.4", "0.3.6"], promptMul: [10, 16], quants: ["Q4_K_M", "Q5_K_M", "Q6_K", "Q8_0"] },
  "ollama": { bwEff: [0.52, 0.66], ver: ["0.9.3", "0.10.1"], promptMul: [8, 13], quants: ["Q4_K_M", "Q5_K_M", "Q8_0"] },
  "tensorrt-llm": { bwEff: [0.6, 0.74], ver: ["0.19.0", "0.21.1"], promptMul: [16, 28], quants: ["FP16", "FP8", "INT4"] },
};
const ENGINE_NAMES = Object.keys(ENGINES);

// bytes per weight for a quantization
const BYTES = { Q3_K_L: 3.5, Q4_K_M: 4.5, Q5_K_M: 5.6, Q6_K: 6.6, Q8_0: 8.5, FP16: 16, FP8: 8, INT4: 4.5 };

// -------------------------------------------------------------------- models
const MODELS = [
  { family: "qwen", name: "Qwen3 27B", params: 27 },
  { family: "qwen", name: "Qwen3 8B", params: 8 },
  { family: "llama", name: "Llama 3.1 70B", params: 70 },
  { family: "llama", name: "Llama 3.1 8B", params: 8 },
  { family: "deepseek", name: "DeepSeek R1 Distill 32B", params: 32 },
  { family: "mistral", name: "Mistral Small 24B", params: 24 },
  { family: "gemma", name: "Gemma 3 12B", params: 12 },
  { family: "phi", name: "Phi 4 14B", params: 14 },
];

const CONTRIBUTORS = [
  "nilabhz", "kernelpanda", "vrampilot", "quietlatency", "bitflipdot",
  "olliestacks", "fp16faith", "ggml-grace", "epoch-elise", "coldcache",
  "sgemma", "mrehn-42", "tensoranne", "pagedout",
];

const WORKLOADS = [
  { prompt: 4096, gen: 2048 },
  { prompt: 4096, gen: 1024 },
  { prompt: 2048, gen: 1024 },
  { prompt: 8192, gen: 2048 },
];

// ----------------------------------------------------------------- generate
function makeRun(dateISO) {
  const model = pick(MODELS);
  const engineName = pick(ENGINE_NAMES);
  const engine = ENGINES[engineName];
  const quant = pick(engine.quants);

  // hardware whose VRAM fits the quantized model with headroom
  const modelGB = (model.params * (BYTES[quant] ?? 8)) / 8; // params_B * bytes/weight => GB
  const fits = GPUS.filter((g) => g.vram >= modelGB + (quant === "FP16" ? 6 : 3));
  const gpu = fits.length ? pick(fits) : GPUS[GPUS.indexOf(GPUS.find((g) => g.vram >= 48))];

  const genTPS = Math.min(
    (gpu.bw * between(engine.bwEff[0], engine.bwEff[1])) / modelGB,
    gpu.tf16 * 1000 / (2 * model.params) // roofline: never compute-bound beyond this
  );
  const promptTPS = genTPS * between(engine.promptMul[0], engine.promptMul[1]) *
    (quant === "FP16" || quant === "FP8" || quant === "INT4" ? 1.15 : 1);
  const workload = pick(WORKLOADS);
  const ttft = (workload.prompt / promptTPS) * 1000 + between(28, 95);

  return {
    model, engineName, engineVer: pick(engine.ver), quant, gpu,
    modelRevision: hex(40),
    cpu: pick(gpu.cpus),
    ram: pick(gpu.ram),
    workload,
    genTPS: Math.max(1.2, genTPS * between(0.96, 1.04)),
    promptTPS: promptTPS * between(0.96, 1.04),
    ttft,
    contributor: pick(CONTRIBUTORS),
    dateISO,
    gitCommit: hex(40),
    status: "PENDING", // assigned later
  };
}

function scoreOf(r, refGen) {
  // methodology 07: 55% generation vs reference curve, 30% prompt, 15% ttft
  const g = Math.min(1.6, r.genTPS / refGen) / 1.6;
  const p = Math.min(1.6, r.promptTPS / (refGen * 12)) / 1.6;
  const t = Math.max(0, 1 - r.ttft / 2500);
  return Math.round((0.55 * g + 0.3 * p + 0.15 * t) * 1000) / 10;
}

// Spread runs over ~45 days ending 2026-08-24. The most recent run is the
// reference record shown in the hero panel.
const COUNT = 28;
const runs = [];
for (let i = 0; i < COUNT; i++) {
  const dayOffset = Math.floor(((COUNT - 1 - i) / (COUNT - 1)) * 44);
  const d = new Date(Date.UTC(2026, 7, 24) - dayOffset * 86400000);
  const iso = d.toISOString().slice(0, 10);
  const hour = rint(0, 23);
  const min = rint(0, 59);
  const sec = rint(0, 59);
  const stamp = `${iso}T${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}Z`;
  runs.push(makeRun(stamp));
}

// Pin the reference record: the hero run. Last seq, dated today, Qwen 27B
// Q4_K_M on an RTX 5090 via llama.cpp, values close to the published panel.
const ref = runs[COUNT - 1];
{
  const g5090 = GPUS[0];
  ref.model = MODELS[0]; // Qwen3 27B
  ref.engineName = "llama.cpp";
  ref.engineVer = "b5240";
  ref.quant = "Q4_K_M";
  ref.gpu = g5090;
  ref.cpu = "Ryzen 9 9950X";
  ref.ram = 96;
  ref.workload = { prompt: 4096, gen: 2048 };
  ref.genTPS = 72.8;
  ref.promptTPS = 1842.3;
  // 4096 prompt tokens at 1842.3 tok/s is 2223 ms of prefill; TTFT is that
  // plus a small launch overhead. Anything lower contradicts promptTPS.
  ref.ttft = 2280;
  ref.contributor = "nilabhz";
  ref.gitCommit = "a1f3c9e7d24b8f60c3e5a9b1d7f2c4a6e8b0d1f3";
}

// Statuses: ~60% verified, ~25% reproduced, rest pending (never the reference)
for (const r of runs) {
  const x = rand();
  r.status = x < 0.58 ? "VERIFIED" : x < 0.83 ? "REPRODUCED" : "PENDING";
}
ref.status = "VERIFIED";

// Reference throughput curve per (family size): RTX 4090 Q4_K_M llama.cpp
function refGen(model) {
  const gb = (model.params * BYTES.Q4_K_M) / 8;
  return (1008 * 0.68) / gb;
}

const records = runs.map((r) => ({
  model: r.model.name,
  family: r.model.family,
  modelRevision: r.modelRevision,
  quantization: r.quant,
  hardware: r.gpu.name,
  gpuVendor: r.gpu.vendor,
  vram: r.gpu.vram,
  ram: r.ram,
  cpu: r.cpu,
  engine: r.engineName,
  engineVersion: r.engineVer,
  benchmarkVersion: "1.2.0",
  promptTokens: r.workload.prompt,
  generatedTokens: r.workload.gen,
  promptTPS: Math.round(r.promptTPS * 10) / 10,
  generationTPS: Math.round(r.genTPS * 10) / 10,
  ttft: Math.round(r.ttft),
  score: Math.min(100, scoreOf(r, refGen(r.model))),
  contributor: r.contributor,
  timestamp: r.dateISO,
  gitCommit: r.gitCommit,
  status: r.status,
})).map((rec) => ({ id: runId(rec), ...rec }));

records.sort((a, b) => a.id.localeCompare(b.id));

const ids = new Set(records.map((r) => r.id));
if (ids.size !== records.length) {
  throw new Error(`id collision: ${records.length} records, ${ids.size} distinct ids`);
}

// ------------------------------------------------------------------- output
const out = {
  $schema: "./schema/index.schema.json",
  generated: "2026-08-24T23:59:59Z",
  generator: "scripts/generate-data.mjs",
  demo: true,
  note: "DEMO DATA. Synthetic records for development. Replace with CI-generated index from results/.",
  benchmarkVersion: "1.2.0",
  records,
};

mkdirSync(join(ROOT, "data"), { recursive: true });
writeFileSync(join(ROOT, "data", "benchmarks.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`wrote data/benchmarks.json (${records.length} records)`);
