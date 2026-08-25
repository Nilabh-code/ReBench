// Generate the website index from measured result records.
// Usage: node scripts/generate-data.mjs
//
// Environment overrides (used by tests and CI smoke jobs so they never touch
// the committed index):
//   REBENCH_RESULTS_DIR   directory to walk (default: <repo>/results)
//   REBENCH_OUTPUT        index file to write (default: <repo>/data/benchmarks.json)
//   REBENCH_GENERATED_AT  generated stamp for empty indexes (default: epoch)

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(fileURLToPath(new URL("..", import.meta.url)));

export function collectRecords(resultsDir) {
  function filesUnder(dir) {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? filesUnder(path) : entry.name.endsWith(".json") ? [path] : [];
    });
  }
  return filesUnder(resultsDir)
    .filter((path) => !path.endsWith("/index.json"))
    .map((path) => JSON.parse(readFileSync(path, "utf8")))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

export function buildIndex(records, generatorName = "scripts/generate-data.mjs") {
  return {
    $schema: "./schema/index.schema.json",
    generated: process.env.REBENCH_GENERATED_AT ?? (records.length ? records.reduce((latest, record) => record.timestamp > latest ? record.timestamp : latest, records[0].timestamp) : "1970-01-01T00:00:00Z"),
    generator: generatorName,
    demo: false,
    note: records.length ? "Measured records generated from results/." : "No measured benchmark records have been submitted yet.",
    benchmarkVersion: records[0]?.benchmarkVersion ?? "1.2.0",
    records,
  };
}

export function generateData(resultsDir, outputPath) {
  const records = collectRecords(resultsDir);
  const output = buildIndex(records);
  writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
  return output;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const resultsDir = process.env.REBENCH_RESULTS_DIR ?? join(ROOT, "results");
  const outputPath = process.env.REBENCH_OUTPUT ?? join(ROOT, "data", "benchmarks.json");
  const output = generateData(resultsDir, outputPath);
  console.log(`wrote ${outputPath} (${output.records.length} measured records)`);
}
