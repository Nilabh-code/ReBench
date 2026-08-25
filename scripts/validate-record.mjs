// Validate a single run record before you open the pull request:
//
//   node scripts/validate-record.mjs path/to/run.json
//
// Runs the exact same checks CI applies to the whole index: the JSON Schema
// plus the cross-field invariants (content-addressed id, prefill/ttft
// coherence). Exits non-zero with a readable list when the record fails.

import { readFileSync } from "node:fs";
import { basename } from "node:path";

import { validateIndex } from "./validate-data.mjs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/validate-record.mjs path/to/run.json");
  process.exit(2);
}

let record;
try {
  record = JSON.parse(readFileSync(path, "utf8"));
} catch (err) {
  console.error(`cannot read ${path} as JSON: ${err.message}`);
  process.exit(2);
}

// Wrap the record in a minimal valid envelope so validateIndex can apply the
// identical schema + cross-field layers CI uses on data/benchmarks.json.
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
const envelope = {
  $schema: "./schema/index.schema.json",
  generated: record.timestamp > now ? record.timestamp : now,
  generator: "scripts/validate-record.mjs",
  demo: false,
  benchmarkVersion: record.benchmarkVersion ?? "0.0.0",
  records: [record],
};

const errors = validateIndex(envelope);

if (errors.length) {
  console.error(`✗ ${path} has ${errors.length} problem(s):`);
  for (const e of errors) console.error("  - " + e.replace(/^records\[0\] /, ""));
  process.exit(1);
}

const expectedFile = `${record.id}.json`;
if (basename(path) !== expectedFile) {
  console.error(`✗ file must be named ${expectedFile} (the id doubles as the filename)`);
  process.exit(1);
}

console.log(`✓ ${record.id} is valid — commit it to results/${record.family}/${expectedFile} and open your PR`);
