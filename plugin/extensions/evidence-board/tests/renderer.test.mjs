import assert from "node:assert/strict";
import test from "node:test";

import { renderHtml } from "../dist/renderer.js";

test("renders the authoritative-record warning and draft-only language", () => {
  const html = renderHtml("a".repeat(48));
  assert.match(html, /GitHub checks, comments, and reviews are authoritative/);
  assert.match(html, /Draft only — not an approval/);
  assert.match(html, /never approves or merges/);
});

test("scopes every iframe request behind the per-instance token", () => {
  const token = "b".repeat(48);
  const html = renderHtml(token);
  assert.equal(html.includes("__AGENTPROOF_TOKEN__"), false);
  assert.match(html, new RegExp(token));
});
