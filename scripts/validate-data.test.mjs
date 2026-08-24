// Tests for the index validator: node --test scripts/
//
// Each case is a mutation the previous hand-rolled validator accepted
// silently. They are here so the guarantees cannot quietly regress.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { validateIndex } from "./validate-data.mjs";
import { runId } from "./run-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const pristine = () => {
  const data = JSON.parse(readFileSync(join(ROOT, "data", "benchmarks.json"), "utf8"));
  if (data.records.length) return data;
  const record = {
    model: "fixture-model",
    family: "fixture",
    modelRevision: "0000000",
    quantization: "Q4_K_M",
    hardware: "fixture-hardware",
    gpuVendor: "CPU",
    vram: 0,
    ram: 16,
    cpu: "fixture-cpu",
    engine: "fixture-engine",
    engineVersion: "0.0.0",
    benchmarkVersion: "1.2.0",
    suite: "performance",
    promptTokens: 100,
    generatedTokens: 20,
    promptTPS: 100,
    generationTPS: 20,
    ttft: 1000,
    score: 0,
    contributor: "fixture-user",
    timestamp: "2026-01-01T00:00:00Z",
    gitCommit: "0000000",
    status: "PENDING",
  };
  return { ...data, generated: "2026-01-01T00:00:00Z", records: [{ id: runId(record), ...record }] };
};

test("the committed index is valid", () => {
  assert.deepEqual(validateIndex(pristine()), []);
});

const CASES = [
  // --- gaps the previous validator did not cover -----------------------
  ["unknown field on a record", (d) => { d.records[0].sponsoredBy = "ACME"; }, /additional/i],
  ["unknown field on the envelope", (d) => { d.trustMe = true; }, /additional/i],
  ["empty model string", (d) => { d.records[0].model = ""; }, /fewer than 1 char/i],
  ["overlong model string", (d) => { d.records[0].model = "x".repeat(200); }, /more than 120 char/i],
  ["garbage timestamp", (d) => { d.records[0].timestamp = "yesterday-ish"; }, /pattern/i],
  ["non-UTC timestamp", (d) => { d.records[0].timestamp = "2026-08-24T12:00:00+02:00"; }, /pattern/i],
  ["null record", (d) => { d.records[0] = null; }, /must be object/i],
  ["envelope missing demo flag", (d) => { delete d.demo; }, /demo/],
  ["contributor that is not a github handle", (d) => { d.records[0].contributor = "not a handle!"; }, /pattern/i],
  ["hand-picked id", (d) => { d.records[0].id = "RUN-2026-08-24-aaaaaa"; }, /content hash/],
  ["duplicated record", (d) => { d.records.push({ ...d.records[0] }); }, /duplicate id/],
  ["ttft contradicting promptTPS", (d) => { d.records[0].ttft = 1; }, /below the/],
  ["ttft far above the implied prefill", (d) => { d.records[0].ttft = 900000; }, /far exceeds/],
  ["run postdating the index", (d) => { d.generated = "2020-01-01T00:00:00Z"; }, /after the index/],

  // --- regressions on what it already covered --------------------------
  ["unknown status", (d) => { d.records[0].status = "DISPUTED"; }, /equal to one of/i],
  ["negative throughput", (d) => { d.records[0].generationTPS = -5; }, />= 0/],
  ["score out of range", (d) => { d.records[0].score = 4200; }, /<= 100/],
  ["non-integer token count", (d) => { d.records[0].promptTokens = 12.5; }, /integer/i],
  ["number as string", (d) => { d.records[0].generationTPS = "72.8"; }, /must be number/i],
];

for (const [name, mutate, expected] of CASES) {
  test(`rejects: ${name}`, () => {
    const data = pristine();
    mutate(data);
    const errors = validateIndex(data);
    assert.ok(errors.length > 0, "expected at least one error");
    assert.ok(
      errors.some((e) => expected.test(e)),
      `no error matched ${expected}\n  got: ${errors.join("\n       ")}`
    );
  });
}
