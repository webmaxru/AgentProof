import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  EvidenceValidationError,
  computeArtifactDigest,
  parseEvidenceDocument,
  projectDispositions,
} from "../dist/model.js";

const sample = JSON.parse(
  await readFile(new URL("../artifacts/sample-evidence.json", import.meta.url), "utf8"),
);

function copy(value) {
  return structuredClone(value);
}

test("accepts the schema-valid sample and preserves all four states", () => {
  const document = parseEvidenceDocument(sample);
  assert.equal(document.schemaVersion, "1.0.0");
  assert.deepEqual(document.gate.counts, {
    pass: 1,
    fail: 1,
    unknown: 1,
    exception: 1,
  });
});

test("rejects a finding produced for another head SHA", () => {
  const mixed = copy(sample);
  mixed.findings[0].sourceSha = "9999999999999999999999999999999999999999";
  assert.throws(
    () => parseEvidenceDocument(mixed),
    (error) => error instanceof EvidenceValidationError && error.code === "mixed_head_sha",
  );
});

test("rejects a reviewer note produced for another head SHA", () => {
  const mixed = copy(sample);
  mixed.reviewerNotes[0].sourceSha = "9999999999999999999999999999999999999999";
  assert.throws(
    () => parseEvidenceDocument(mixed),
    (error) => error instanceof EvidenceValidationError && error.code === "mixed_head_sha",
  );
});

test("rejects policy from a different protected base SHA", () => {
  const mixed = copy(sample);
  mixed.policy.baseSha = "9999999999999999999999999999999999999999";
  assert.throws(
    () => parseEvidenceDocument(mixed),
    (error) => error instanceof EvidenceValidationError && error.code === "mixed_base_sha",
  );
});

test("rejects gate counts that do not match findings", () => {
  const inconsistent = copy(sample);
  inconsistent.gate.counts.pass = 2;
  assert.throws(
    () => parseEvidenceDocument(inconsistent),
    (error) => error instanceof EvidenceValidationError && error.code === "gate_count_mismatch",
  );
});

test("rejects an unexpected property rather than silently accepting input drift", () => {
  const drifted = copy(sample);
  drifted.silentApproval = true;
  assert.throws(
    () => parseEvidenceDocument(drifted),
    (error) => error instanceof EvidenceValidationError && error.code === "schema_invalid",
  );
});

test("rejects evidence whose canonical artifact digest no longer matches", () => {
  const tampered = copy(sample);
  tampered.findings[0].summary = "Tampered after publication.";
  assert.throws(
    () => parseEvidenceDocument(tampered),
    (error) =>
      error instanceof EvidenceValidationError && error.code === "artifact_digest_mismatch",
  );
  tampered.artifact.sha256 = computeArtifactDigest(tampered);
  assert.equal(parseEvidenceDocument(tampered).findings[0].summary, "Tampered after publication.");
});

test("projects stale and expired disposition history without making either effective", () => {
  const document = parseEvidenceDocument(sample);
  const projected = projectDispositions(document, new Date("2026-09-02T12:00:00.000Z"));
  assert.equal(
    projected.some((entry) => entry.badge === "stale"),
    true,
  );
  assert.equal(
    projected.some((entry) => entry.badge === "expired"),
    true,
  );
  assert.equal(
    projected.some((entry) => entry.effective),
    false,
  );
});

test("accepts and displays the edited-away disposition status", () => {
  const edited = copy(sample);
  edited.dispositions[2].status = "edited-away";
  edited.dispositions[2].effective = false;
  edited.artifact.sha256 = computeArtifactDigest(edited);
  const document = parseEvidenceDocument(edited);
  const projected = projectDispositions(document, new Date("2026-09-02T12:00:00.000Z"));
  assert.equal(
    projected.some((entry) => entry.badge === "edited-away"),
    true,
  );
});
