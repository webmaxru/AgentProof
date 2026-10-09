import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
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

const zip = await JSZip.loadAsync(fs.readFileSync(output));
const presentationPath = "ppt/presentation.xml";
const presentationXml = await zip.file(presentationPath).async("string");
const notesMaster = presentationXml.match(/<p:notesMasterIdLst>.*?<\/p:notesMasterIdLst>/)?.[0];
if (notesMaster) {
  zip.file(
    presentationPath,
    presentationXml.replace(notesMaster, "").replace("<p:sldIdLst>", `${notesMaster}<p:sldIdLst>`),
  );
  fs.writeFileSync(output, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
}

console.log(`Wrote ${output}`);
