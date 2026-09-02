import { mkdir, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prepareCollectorWorkspace, removeCollectorWorkspace } from "../src/collector-workspace.js";
import { resolveWorkspaceDirectory } from "../src/io.js";
import { resolveTrustedNpm, resolveTrustedVitest } from "../src/trusted-tools.js";

const workRoot = fileURLToPath(new URL("../.collector-test-work/", import.meta.url));
const sourceRoot = join(workRoot, "source");
const collectorRoot = join(workRoot, "collector");

describe.sequential("trusted collector runtime", () => {
  beforeAll(async () => {
    await rm(workRoot, { recursive: true, force: true });
    await mkdir(join(sourceRoot, "sample-repo", "src"), { recursive: true });
    await mkdir(join(sourceRoot, "sample-repo", "Node_Modules"), { recursive: true });
    await writeFile(
      join(sourceRoot, "tsconfig.base.json"),
      '{"compilerOptions":{"strict":true}}\n',
      "utf8",
    );
    await writeFile(
      join(sourceRoot, "sample-repo", "src", "value.ts"),
      "export const value = 1;\n",
      "utf8",
    );
    await writeFile(
      join(sourceRoot, "sample-repo", "Node_Modules", "untrusted.txt"),
      "must not be copied\n",
      "utf8",
    );
  });

  afterAll(async () => {
    await rm(workRoot, { recursive: true, force: true });
  });

  it("resolves Vitest and npm independently of the subject workspace", async () => {
    const [vitest, npm] = await Promise.all([resolveTrustedVitest(), resolveTrustedNpm()]);
    expect(vitest.command).toBe(process.execPath);
    expect(vitest.argsPrefix).toHaveLength(1);
    await expect(realpath(vitest.argsPrefix[0]!)).resolves.toBe(vitest.argsPrefix[0]);
    await expect(realpath(npm.command)).resolves.toBe(npm.command);
  });

  it("stages source without copying subject dependencies or mutating it", async () => {
    const vitest = await resolveTrustedVitest();
    const source = await resolveWorkspaceDirectory(sourceRoot, "sample-repo");
    const staged = await prepareCollectorWorkspace(source, collectorRoot, vitest.nodeModulesPath);

    expect(await readFile(join(staged.samplePath, "src", "value.ts"), "utf8")).toContain(
      "value = 1",
    );
    await expect(
      readFile(join(staged.samplePath, "node_modules", "untrusted.txt"), "utf8"),
    ).rejects.toThrow();
    expect(await realpath(join(staged.root, "repository", "node_modules"))).toBe(
      await realpath(vitest.nodeModulesPath),
    );
    expect(await readFile(staged.configPath, "utf8")).toContain(
      '"include": [\n      "tests/**/*.test.ts"',
    );
    expect(
      await readFile(join(sourceRoot, "sample-repo", "Node_Modules", "untrusted.txt"), "utf8"),
    ).toBe("must not be copied\n");

    await removeCollectorWorkspace(collectorRoot);
  });
});
