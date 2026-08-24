// Generate the website index from measured result records.
// Usage: node scripts/generate-data.mjs

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));
const RESULTS = join(ROOT, "results");
const OUTPUT = join(ROOT, "data", "benchmarks.json");

function filesUnder(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : entry.name.endsWith(".json") ? [path] : [];
  });
}

const records = filesUnder(RESULTS)
  .filter((path) => !path.endsWith("/index.json"))
  .map((path) => JSON.parse(readFileSync(path, "utf8")))
  .sort((a, b) => String(a.id).localeCompare(String(b.id)));

const output = {
  $schema: "./schema/index.schema.json",
  generated: process.env.REBENCH_GENERATED_AT ?? (records.length ? records.reduce((latest, record) => record.timestamp > latest ? record.timestamp : latest, records[0].timestamp) : "1970-01-01T00:00:00Z"),
  generator: "scripts/generate-data.mjs",
  demo: false,
  note: records.length ? "Measured records generated from results/." : "No measured benchmark records have been submitted yet.",
  benchmarkVersion: records[0]?.benchmarkVersion ?? "1.2.0",
  records,
};

writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + "\n");
console.log(`wrote ${OUTPUT} (${records.length} measured records)`);
