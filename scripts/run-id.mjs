// Run id derivation, shared by the generator and the validator so the two can
// never drift. The id is content-addressed: the suffix is a hash of the fields
// that identify a run, which makes concurrent submissions collision-free and
// makes a hand-picked id detectable.

import { createHash } from "node:crypto";

/** Fields that identify a run. Order is part of the contract. */
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

export function runId(rec) {
  const key = KEY_FIELDS.map((f) => rec[f]).join("|");
  const digest = createHash("sha256").update(key).digest("hex").slice(0, 6);
  return `RUN-${String(rec.timestamp).slice(0, 10)}-${digest}`;
}
