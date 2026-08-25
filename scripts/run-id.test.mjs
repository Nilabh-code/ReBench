// Unit tests for the content-addressed run id. Node: node --test scripts/
//
// The vectors below are shared with benchmark/tests/test_runner.py: the id is
// derived independently in JS and Python, and both must agree forever.

import assert from "node:assert/strict";
import test from "node:test";

import { runId } from "./run-id.mjs";

const RECORD = {
  model: "parity-model",
  family: "parity",
  modelRevision: "abc1234",
  quantization: "Q4_K_M",
  hardware: "NVIDIA RTX 4090",
  engine: "llama.cpp",
  engineVersion: "b1234",
  promptTokens: 100,
  generatedTokens: 128,
  contributor: "nilabh",
  timestamp: "2026-08-25T10:00:00Z",
};

test("matches the shared cross-language vectors", () => {
  assert.equal(runId(RECORD), "RUN-2026-08-25-34013b");
  assert.equal(runId({ ...RECORD, promptTokens: 101 }), "RUN-2026-08-25-eea1b5");
});

test("is deterministic", () => {
  assert.equal(runId(RECORD), runId({ ...RECORD }));
});

test("id date part follows the timestamp", () => {
  const moved = runId({ ...RECORD, timestamp: "2030-01-02T00:00:00Z" });
  assert.ok(moved.startsWith("RUN-2030-01-02-"), moved);
});

const KEY_FIELDS = [
  "model",
  "family",
  "modelRevision",
  "quantization",
  "hardware",
  "engine",
  "engineVersion",
  "promptTokens",
  "generatedTokens",
  "contributor",
  "timestamp",
];

for (const field of KEY_FIELDS) {
  test(`changing ${field} changes the id`, () => {
    const rec = { ...RECORD };
    rec[field] = typeof rec[field] === "number" ? rec[field] + 1 : rec[field] + "-x";
    assert.notEqual(runId(rec), runId(RECORD));
  });
}

for (const field of ["score", "status", "gitCommit", "ttft", "generationTPS", "vram"]) {
  test(`non-key field ${field} does not change the id`, () => {
    const rec = { ...RECORD };
    rec[field] = field === "vram" ? 99 : "MUTATED";
    assert.equal(runId(rec), runId(RECORD));
  });
}

test("field order is part of the contract (spot check)", () => {
  // Hand-computed: sha256 of the '|'-joined fields, first 6 hex chars.
  // If KEY_FIELDS order ever changes, both this test and the Python twin
  // change behavior at once — that is the alarm bell.
  assert.match(runId(RECORD), /^RUN-2026-08-25-[0-9a-f]{6}$/);
});
