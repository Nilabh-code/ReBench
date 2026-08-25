// Pipeline tests: results/ -> generate-data -> validate. Node: node --test scripts/
//
// Before this suite existed, the record->generate->validate chain had only
// ever run on an empty results/ directory. These drive it with a real
// (content-addressed) fixture record in a temp tree.

import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { buildIndex, collectRecords, generateData } from "./generate-data.mjs";
import { validateIndex } from "./validate-data.mjs";
import { runId } from "./run-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FIXTURES = join(ROOT, "tests", "fixtures");

function fixtureRecord() {
  const file = readFileSync(join(FIXTURES, "RUN-2026-01-05-18a59d.json"), "utf8");
  return JSON.parse(file);
}

function treeWith(record) {
  const results = mkdtempSync(join(tmpdir(), "rebench-results-"));
  const dir = join(results, record.family);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${record.id}.json`), JSON.stringify(record, null, 2));
  return results;
}

test("the fixture id is its own content hash", () => {
  const record = fixtureRecord();
  assert.equal(record.id, runId(record));
});

test("collectRecords finds json files and ignores the rest", () => {
  const record = fixtureRecord();
  const results = treeWith(record);
  writeFileSync(join(results, record.family, "README.md"), "not a record");
  writeFileSync(join(results, record.family, "index.json"), "{}");
  const records = collectRecords(results);
  assert.equal(records.length, 1);
  assert.equal(records[0].id, record.id);
  rmSync(results, { recursive: true, force: true });
});

test("collectRecords sorts by id", () => {
  const a = fixtureRecord();
  const b = { ...a, model: "fixture-model-b" };
  b.id = runId(b);
  const results = treeWith(a);
  writeFileSync(join(results, a.family, `${b.id}.json`), JSON.stringify(b, null, 2));
  const ids = collectRecords(results).map((r) => r.id);
  assert.deepEqual(ids, [...ids].sort());
  rmSync(results, { recursive: true, force: true });
});

test("generateData produces an index that validates", () => {
  const record = fixtureRecord();
  const results = treeWith(record);
  const out = join(results, "index-out.json");
  const index = generateData(results, out);

  assert.equal(index.records.length, 1);
  assert.equal(index.generated, record.timestamp, "generated stamp = newest record");
  assert.equal(index.demo, false);
  assert.deepEqual(validateIndex(index), []);
  assert.deepEqual(JSON.parse(readFileSync(out, "utf8")), index);
  rmSync(results, { recursive: true, force: true });
});

test("generateData rejects nothing but validate catches a tampered record", () => {
  const record = fixtureRecord();
  record.generatedTokens = 13; // edited after the fact, id not recomputed
  const results = treeWith(record);
  const index = generateData(results, join(results, "index-out.json"));
  const errors = validateIndex(index);
  assert.ok(errors.some((e) => /content hash/.test(e)), errors.join(" | "));
  rmSync(results, { recursive: true, force: true });
});

test("an empty results tree yields the honest empty index", () => {
  const results = mkdtempSync(join(tmpdir(), "rebench-empty-"));
  const index = buildIndex(collectRecords(results));
  assert.equal(index.records.length, 0);
  assert.equal(index.generated, "1970-01-01T00:00:00Z");
  assert.match(index.note, /No measured benchmark records/);
  assert.deepEqual(validateIndex(index), []);
  rmSync(results, { recursive: true, force: true });
});

test("duplicate ids across families are rejected", () => {
  const a = fixtureRecord();
  const results = treeWith(a);
  const dupDir = join(results, "other-family");
  mkdirSync(dupDir, { recursive: true });
  writeFileSync(join(dupDir, `${a.id}.json`), JSON.stringify(a, null, 2));
  const index = generateData(results, join(results, "index-out.json"));
  const errors = validateIndex(index);
  assert.ok(errors.some((e) => /duplicate id/.test(e)), errors.join(" | "));
  rmSync(results, { recursive: true, force: true });
});
