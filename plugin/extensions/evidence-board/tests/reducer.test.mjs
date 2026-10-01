import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { computeArtifactDigest } from "../dist/model.js";
import {
  BoardStateError,
  EMPTY_BOARD_STATE,
  createBoardView,
  reduceBoard,
  restoreBoardState,
} from "../dist/reducer.js";

const sample = JSON.parse(
  await readFile(new URL("../artifacts/contract-fixture.json", import.meta.url), "utf8"),
);
const now = new Date("2026-09-02T12:00:00.000Z");

function copy(value) {
  return structuredClone(value);
}

function resign(document) {
  document.artifact.sha256 = "0".repeat(64);
  document.artifact.sha256 = computeArtifactDigest(document);
  return document;
}

function loadedState() {
  return reduceBoard(
    EMPTY_BOARD_STATE,
    { type: "set_evidence", document: copy(sample), sample: true },
    now,
  );
}

test("selects a finding and drafts an exact command without changing evidence", () => {
  let state = loadedState();
  state = reduceBoard(
    state,
    { type: "select_finding", input: { id: "AP-POL-RETENTION-001" } },
    now,
  );
  const dispositionCount = state.document.dispositions.length;
  state = reduceBoard(
    state,
    {
      type: "draft_disposition",
      input: {
        findingId: "AP-POL-RETENTION-001",
        decision: "accept-exception",
        headSha: sample.headSha,
        reason: "Synthetic data remains bounded while the declaration is corrected.",
        expires: "2026-10-31",
      },
    },
    now,
  );
  assert.equal(
    state.draft.command,
    [
      "/agentproof accept-exception AP-POL-RETENTION-001",
      "sha: bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      "reason: Synthetic data remains bounded while the declaration is corrected.",
      "expires: 2026-10-31",
    ].join("\n"),
  );
  assert.equal(state.document.dispositions.length, dispositionCount);
  assert.equal(state.document.gate.conclusion, "failure");
});

test("refuses to accept a fail finding", () => {
  const state = loadedState();
  assert.throws(
    () =>
      reduceBoard(
        state,
        {
          type: "draft_disposition",
          input: {
            findingId: "AP-SEC-NPM-AUDIT-001",
            decision: "accept-exception",
            headSha: sample.headSha,
            reason: "This reason is long enough but must still be rejected.",
            expires: "2026-10-31",
          },
        },
        now,
      ),
    (error) => error instanceof BoardStateError && error.code === "finding_requires_remediation",
  );
});

test("refuses a draft bound to a stale head SHA", () => {
  const state = loadedState();
  assert.throws(
    () =>
      reduceBoard(
        state,
        {
          type: "draft_disposition",
          input: {
            findingId: "AP-POL-RETENTION-001",
            decision: "request-remediation",
            headSha: "9999999999999999999999999999999999999999",
            reason: "Correct the retention declaration and collect evidence again.",
          },
        },
        now,
      ),
    (error) => error instanceof BoardStateError && error.code === "stale_head_sha",
  );
});

test("rejects an older evidence update for the same pull request", () => {
  const state = loadedState();
  const stale = copy(sample);
  stale.generatedAt = "2026-09-01T08:00:00.000Z";
  resign(stale);
  assert.throws(
    () => reduceBoard(state, { type: "set_evidence", document: stale }, now),
    (error) => error instanceof BoardStateError && error.code === "stale_evidence",
  );
});

test("rejects a changed protected policy for the same head SHA", () => {
  const state = loadedState();
  const mixed = copy(sample);
  mixed.policy.sha256 = "9".repeat(64);
  resign(mixed);
  assert.throws(
    () => reduceBoard(state, { type: "set_evidence", document: mixed }, now),
    (error) => error instanceof BoardStateError && error.code === "mixed_policy_state",
  );
});

test("accepts a newer head and clears SHA-bound selection and draft", () => {
  let state = loadedState();
  state = reduceBoard(
    state,
    { type: "select_finding", input: { id: "AP-POL-RETENTION-001" } },
    now,
  );
  state = reduceBoard(
    state,
    {
      type: "draft_disposition",
      input: {
        findingId: "AP-POL-RETENTION-001",
        decision: "request-remediation",
        headSha: sample.headSha,
        reason: "Complete the retention declaration and collect evidence again.",
      },
    },
    now,
  );

  const next = copy(sample);
  next.headSha = "4444444444444444444444444444444444444444";
  next.generatedAt = "2026-09-03T08:00:00.000Z";
  for (const finding of next.findings) finding.sourceSha = next.headSha;
  for (const note of next.reviewerNotes) note.sourceSha = next.headSha;
  resign(next);
  state = reduceBoard(state, { type: "set_evidence", document: next }, now);
  assert.equal(state.document.headSha, next.headSha);
  assert.equal(state.selectedFindingId, null);
  assert.equal(state.draft, null);
});

test("rejects a different repository until the board is cleared", () => {
  const state = loadedState();
  const other = copy(sample);
  other.repository = "octo-org/another-repository";
  other.generatedAt = "2026-09-03T08:00:00.000Z";
  resign(other);
  assert.throws(
    () => reduceBoard(state, { type: "set_evidence", document: other }, now),
    (error) => error instanceof BoardStateError && error.code === "mixed_evidence_scope",
  );
});

test("clear removes local evidence while retaining the authority banner", () => {
  const cleared = reduceBoard(loadedState(), { type: "clear_evidence" }, now);
  const view = createBoardView(cleared, now);
  assert.equal(view.document, null);
  assert.match(view.authoritativeRecordMessage, /GitHub checks, comments, and reviews/);
});

test("restores persisted evidence through the same validator", () => {
  const restored = restoreBoardState(JSON.parse(JSON.stringify(loadedState())), now);
  assert.equal(restored.document.headSha, sample.headSha);
  assert.equal(restored.sample, true);
});
