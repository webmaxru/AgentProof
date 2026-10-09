import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const timeline = JSON.parse(fs.readFileSync(path.join(here, "submission-timeline.json"), "utf8"));
const stills = path.join(here, "stills-final");
const output = path.join(here, "agentproof-submission-deck.pptx");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "AgentProof";
pptx.company = "Microsoft";
pptx.subject = "FY27 GitHub Copilot App Enterprise Challenge";
pptx.title = "AgentProof: Evidence Before Approval";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Segoe UI",
  bodyFontFace: "Segoe UI",
  lang: "en-US",
};

for (const [index, scene] of timeline.scenes.entries()) {
  const slide = pptx.addSlide();
  slide.background = { color: "07101F" };
  slide.addImage({
    path: path.join(stills, `${String(index).padStart(2, "0")}-${scene.id}.png`),
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    altText: `${scene.eyebrow}: ${scene.title.replaceAll("\n", " ")}`,
  });
}

await pptx.writeFile({ fileName: output });

console.log(`Wrote ${output}`);
