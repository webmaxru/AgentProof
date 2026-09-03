import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

register(new URL("./sdk-loader.mjs", import.meta.url));
await import("../extension.mjs?runtime-test");

const canvas = globalThis.__agentproofTestCanvas;

test("registers the Evidence Board and all five least-privilege actions", () => {
  assert.equal(canvas.id, "agentproof-evidence-board");
  assert.deepEqual(
    canvas.actions.map((action) => action.name),
    ["set_evidence", "get_evidence", "select_finding", "draft_disposition", "clear_evidence"],
  );
  assert.equal(globalThis.__agentproofTestJoin.canvases[0], canvas);
});

test("opens sample evidence, serves the banner, routes actions, and closes cleanly", async () => {
  const context = {
    sessionId: "session-test",
    extensionId: "test:agentproof",
    canvasId: canvas.id,
    instanceId: "runtime-test",
    input: { useSample: true },
  };
  const opened = await canvas.open(context);
  assert.match(opened.url, /^http:\/\/127\.0\.0\.1:\d+\/[0-9a-f]{48}\/$/);

  const htmlResponse = await fetch(opened.url);
  assert.equal(htmlResponse.status, 200);
  assert.match(await htmlResponse.text(), /GitHub checks, comments, and reviews are authoritative/);

  const byName = new Map(canvas.actions.map((action) => [action.name, action]));
  const state = await byName.get("get_evidence").handler({
    ...context,
    actionName: "get_evidence",
    input: undefined,
  });
  assert.equal(state.document.headSha, "b".repeat(40));
  assert.equal(state.sample, true);

  const reset = await byName.get("set_evidence").handler({
    ...context,
    actionName: "set_evidence",
    input: state.document,
  });
  assert.equal(reset.document.artifact.sha256, state.document.artifact.sha256);
  assert.equal(reset.sample, false);

  await byName.get("select_finding").handler({
    ...context,
    actionName: "select_finding",
    input: { id: "AP-POL-RETENTION-001" },
  });
  const drafted = await byName.get("draft_disposition").handler({
    ...context,
    actionName: "draft_disposition",
    input: {
      findingId: "AP-POL-RETENTION-001",
      decision: "accept-exception",
      headSha: "b".repeat(40),
      reason: "Synthetic evidence is bounded while the declaration is corrected.",
      expires: "2099-10-31",
    },
  });
  assert.match(drafted.draft.command, /^\/agentproof accept-exception/m);
  assert.equal(drafted.document.dispositions.length, 3);

  const cleared = await byName.get("clear_evidence").handler({
    ...context,
    actionName: "clear_evidence",
    input: undefined,
  });
  assert.equal(cleared.document, null);

  await canvas.onClose(context);
  await assert.rejects(fetch(opened.url));
});
