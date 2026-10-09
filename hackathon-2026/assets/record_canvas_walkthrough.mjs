/* global document, window */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(here, "canvas-live-recording");
const output = path.join(here, "agentproof-canvas-live.webm");
const url =
  process.env.AGENTPROOF_CANVAS_URL ??
  "http://127.0.0.1:51038/46e2823c47043a217177faa480d052018946a0a7f8a0a40a/";

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: outputDir,
    size: { width: 1920, height: 1080 },
  },
});
const page = await context.newPage();
const video = page.video();

const pause = (milliseconds) => page.waitForTimeout(milliseconds);

async function pointAt(locator) {
  const box = await locator.boundingBox();
  if (!box) return;
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.querySelector("#agentproof-demo-cursor");
      if (cursor) {
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;
      }
    },
    { x: box.x + box.width / 2, y: box.y + box.height / 2 },
  );
  await pause(650);
}

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
await page.waitForSelector("text=RELEASE CONTROL ROOM", { timeout: 15_000 });
await page.addStyleTag({
  content: `
    html { scroll-behavior: smooth !important; }
    #agentproof-demo-label {
      position: fixed; z-index: 2147483647; right: 28px; bottom: 22px;
      padding: 12px 18px; border-radius: 999px;
      color: #07101f; background: #fbbf24;
      font: 800 18px/1.1 "Segoe UI", sans-serif;
      box-shadow: 0 8px 30px rgba(0,0,0,.35);
    }
    #agentproof-demo-cursor {
      position: fixed; z-index: 2147483647; left: 50%; top: 50%;
      width: 24px; height: 24px; margin: -12px 0 0 -12px;
      border: 4px solid #fbbf24; border-radius: 50%;
      background: rgba(251,191,36,.22); pointer-events: none;
      transition: left .55s ease, top .55s ease;
      box-shadow: 0 0 0 5px rgba(7,16,31,.55);
    }
  `,
});
await page.evaluate(() => {
  const label = document.createElement("div");
  label.id = "agentproof-demo-label";
  label.textContent = "LIVE CANVAS WALKTHROUGH • SYNTHETIC DATA";
  document.body.append(label);
  const cursor = document.createElement("div");
  cursor.id = "agentproof-demo-cursor";
  document.body.append(cursor);
});

await pause(6500);

const unknownCount = page.getByRole("button", { name: /1\s+unknown/i }).first();
await pointAt(unknownCount);
await unknownCount.click();
await pause(5500);

const retentionFinding = page
  .getByRole("button", { name: /AP-POL-RETENTION-001[\s\S]*unknown/i })
  .first();
await retentionFinding.scrollIntoViewIfNeeded();
await pointAt(retentionFinding);
await retentionFinding.click();
await pause(7500);

const reason = page.getByRole("textbox", { name: "Reason" });
await reason.scrollIntoViewIfNeeded();
await pointAt(reason);
await reason.fill(
  "Temporary synthetic-data exception while the deletion declaration is corrected and independently reviewed.",
);
await pause(3500);

const expiry = page.getByRole("textbox", { name: "Expiry (UTC)" });
await pointAt(expiry);
await expiry.fill("2026-10-31");
await pause(2500);

const draft = page.getByRole("button", { name: "Draft exact PR command" });
await pointAt(draft);
await draft.click();
await pause(8500);

const history = page.getByText("Human disposition history", { exact: true });
await history.scrollIntoViewIfNeeded();
await pointAt(history);
await pause(8500);

await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
await pause(15_000);

await context.close();
await browser.close();
const recorded = await video.path();
fs.copyFileSync(recorded, output);
console.log(`Recorded live Canvas walkthrough to ${output}`);
