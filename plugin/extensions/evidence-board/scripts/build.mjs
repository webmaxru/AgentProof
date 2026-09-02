import { mkdir, readFile, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(packageRoot, "src");
const outputRoots = [packageRoot, join(packageRoot, "dist")];
const files = [
  ["model.ts", "model.js"],
  ["reducer.ts", "reducer.js"],
  ["renderer.ts", "renderer.js"],
  ["store.ts", "store.js"],
  ["extension.ts", "extension.mjs"],
];

await Promise.all(outputRoots.map((outputRoot) => mkdir(outputRoot, { recursive: true })));

for (const [sourceName, outputName] of files) {
  const source = await readFile(join(sourceRoot, sourceName), "utf8");
  const output = stripTypeScriptTypes(source, {
    mode: "transform",
    sourceMap: false,
    sourceUrl: `agentproof://${sourceName}`,
  });
  await Promise.all(
    outputRoots.map((outputRoot) => writeFile(join(outputRoot, outputName), output, "utf8")),
  );
}
