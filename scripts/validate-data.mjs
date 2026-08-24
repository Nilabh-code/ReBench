// Minimal dependency-free validator for data/benchmarks.json against
// schema/benchmark.schema.json (subset of JSON Schema we actually use).
// Runs in CI and locally:  node scripts/validate-data.mjs

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(join(ROOT, "schema", "benchmark.schema.json"), "utf8"));
const data = JSON.parse(readFileSync(join(ROOT, "data", "benchmarks.json"), "utf8"));

const errors = [];
const required = schema.required ?? [];
const props = schema.properties ?? {};

const checkString = (v) => typeof v === "string";
const checkNumber = (v) => typeof v === "number" && Number.isFinite(v);
const checkInteger = (v) => Number.isInteger(v);

function matchPattern(v, pattern) {
  return new RegExp(pattern).test(v);
}

if (!Array.isArray(data.records)) {
  errors.push("records must be an array");
} else {
  const seen = new Set();
  data.records.forEach((r, i) => {
    const at = `records[${i}] (${r?.id ?? "?"})`;
    for (const key of required) {
      if (!(key in r)) errors.push(`${at}: missing field "${key}"`);
    }
    for (const [key, spec] of Object.entries(props)) {
      if (!(key in r)) continue;
      const v = r[key];
      if (spec.type === "string" && !checkString(v)) errors.push(`${at}: "${key}" must be a string`);
      if (spec.type === "number" && !checkNumber(v)) errors.push(`${at}: "${key}" must be a number`);
      if (spec.type === "integer" && !checkInteger(v)) errors.push(`${at}: "${key}" must be an integer`);
      if (typeof v === "string" && spec.pattern && !matchPattern(v, spec.pattern)) {
        errors.push(`${at}: "${key}" fails pattern ${spec.pattern}`);
      }
      if (spec.enum && !spec.enum.includes(v)) errors.push(`${at}: "${key}" must be one of ${spec.enum.join("|")}`);
      if (typeof v === "number" && spec.minimum !== undefined && v < spec.minimum) {
        errors.push(`${at}: "${key}" below minimum ${spec.minimum}`);
      }
      if (typeof v === "number" && spec.maximum !== undefined && v > spec.maximum) {
        errors.push(`${at}: "${key}" above maximum ${spec.maximum}`);
      }
    }
    if (seen.has(r.id)) errors.push(`${at}: duplicate id`);
    seen.add(r.id);
  });
}

if (errors.length) {
  console.error(`✗ ${errors.length} validation error(s):`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(`✓ ${data.records.length} records valid against schema/benchmark.schema.json`);
