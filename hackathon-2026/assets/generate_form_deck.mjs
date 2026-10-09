import path from "node:path";
import { fileURLToPath } from "node:url";
import PptxGenJS from "pptxgenjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const stills = path.join(here, "form-deck-stills");
const output = path.join(here, "agentproof-form-submission-deck.pptx");

const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "AgentProof";
pptx.company = "Microsoft";
pptx.subject = "FY27 Q1 GitHub Copilot App Challenge";
pptx.title = "AgentProof: Evidence Before Approval";
pptx.lang = "en-US";

for (let index = 1; index <= 3; index += 1) {
  const slide = pptx.addSlide();
  slide.background = { color: "07101F" };
  slide.addImage({
    path: path.join(stills, `${String(index).padStart(2, "0")}.png`),
    x: 0,
    y: 0,
    w: 13.333,
    h: 7.5,
    altText: `AgentProof submission architecture slide ${index}`,
  });
}

await pptx.writeFile({ fileName: output });

console.log(`Wrote ${output}`);
