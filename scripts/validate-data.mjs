// Validates data/benchmarks.json against schema/. Runs in CI and locally:
//
//   node scripts/validate-data.mjs
//
// Two layers, deliberately separate:
//   1. JSON Schema (ajv, draft-07) — shape, types, patterns, bounds, unknown
//      fields, array size. The schemas are the contract; none of it is
//      restated here, so the two cannot drift.
//   2. Cross-field invariants — coherence no schema can express. These are the
//      checks that catch a record which is plausible field by field and
//      impossible as a whole.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import Ajv from "ajv";

import { runId } from "./run-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => JSON.parse(readFileSync(join(ROOT, ...p), "utf8"));

const ajv = new Ajv({ allErrors: true, strict: true });
ajv.addSchema(read("schema", "benchmark.schema.json"));
const validateSchema = ajv.compile(read("schema", "index.schema.json"));

/**
 * Returns the validation errors for an index object; empty means valid.
 * Exported so scripts/validate-data.test.mjs can exercise it on crafted input
 * without touching data/benchmarks.json.
 */
export function validateIndex(data) {
  const errors = [];

  // ---------------------------------------------------------- layer 1: schema
  if (!validateSchema(data)) {
    for (const e of validateSchema.errors) {
      const extra = e.params?.additionalProperty ? ` ("${e.params.additionalProperty}")` : "";
      errors.push(`${e.instancePath || "<root>"} ${e.message}${extra}`);
    }
  }

  // --------------------------------------------- layer 2: cross-field checks
  // Only meaningful once the shape is known good: on a schema failure the
  // fields these read may not exist.
  if (errors.length) return errors;

  const seen = new Map();

  for (const [i, r] of data.records.entries()) {
    const at = `records[${i}] (${r.id})`;

    // The id is content-addressed: derived, never chosen. This also catches a
    // record edited after the fact without its id being recomputed.
    const expected = runId(r);
    if (r.id !== expected) {
      errors.push(`${at}: id is not the content hash of the record (expected ${expected})`);
    }

    // The id doubles as the results/ filename, so a collision is a silent
    // overwrite rather than a merge conflict.
    if (seen.has(r.id)) {
      errors.push(`${at}: duplicate id, already at records[${seen.get(r.id)}]`);
    }
    seen.set(r.id, i);

    // A prompt of N tokens evaluated at P tok/s cannot yield a first token
    // before N/P seconds — nor much after that plus launch overhead.
    // Skipped when prompt TPS was *derived from* ttft (estimated_from_ttft):
    // the two quantities are equal by construction then, and only rounding
    // could separate them — the check would needlessly reject sub-2ms runs.
    const prefillMs = (r.promptTokens / r.promptTPS) * 1000;
    const prefillIndependent = r.timingSource !== "estimated_from_ttft";
    if (prefillIndependent && r.ttft < prefillMs * 0.9) {
      errors.push(
        `${at}: ttft ${r.ttft} ms is below the ${Math.round(prefillMs)} ms of prefill implied ` +
          `by promptTokens/promptTPS (${r.promptTokens} / ${r.promptTPS})`
      );
    }
    if (prefillIndependent && r.ttft > prefillMs * 1.1 + 150) {
      errors.push(
        `${at}: ttft ${r.ttft} ms far exceeds the ${Math.round(prefillMs)} ms of prefill ` +
          `implied by promptTokens/promptTPS — one of the three is wrong`
      );
    }

    // A run cannot postdate the index that indexes it.
    if (r.timestamp > data.generated) {
      errors.push(`${at}: timestamp is after the index's generated stamp (${data.generated})`);
    }
  }

  return errors;
}

// ------------------------------------------------------------------------ cli
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const data = read("data", "benchmarks.json");
  const errors = validateIndex(data);

  if (errors.length) {
    console.error(`✗ ${errors.length} validation error(s) in data/benchmarks.json:`);
    for (const e of errors) console.error("  - " + e);
    process.exit(1);
  }

  console.log(
    `✓ ${data.records.length} records valid: schema/index.schema.json + ` +
      `schema/benchmark.schema.json, ids content-addressed, prefill/ttft coherent`
  );
}
