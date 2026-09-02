import { cp, lstat, mkdir, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";

import { AgentProofError } from "@agentproof/evidence-core";

import { readWorkspaceSource, type WorkspaceDirectory } from "./io.js";

const EXCLUDED_DIRECTORY_NAMES = new Set([
  ".agentproof",
  ".git",
  "coverage",
  "dist",
  "node_modules",
]);

export interface CollectorWorkspace {
  readonly root: string;
  readonly samplePath: string;
  readonly configPath: string;
  readonly testReportPath: string;
  readonly coverageReportPath: string;
}

function generatedVitestConfig(coverageDirectory: string): string {
  return `export default ${JSON.stringify(
    {
      test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        passWithNoTests: false,
        coverage: {
          provider: "v8",
          include: ["src/**/*.ts"],
          exclude: ["src/server.ts"],
          reporter: ["json-summary"],
          reportsDirectory: coverageDirectory,
        },
      },
    },
    null,
    2,
  )};\n`;
}

export async function prepareCollectorWorkspace(
  source: WorkspaceDirectory,
  collectorDirectoryPath: string,
  trustedNodeModulesPath: string,
): Promise<CollectorWorkspace> {
  const collectorRoot = resolve(collectorDirectoryPath);
  const stagedRoot = join(collectorRoot, "repository");
  const stagedSample =
    source.logicalPath === "" ? stagedRoot : join(stagedRoot, ...source.logicalPath.split("/"));
  try {
    await rm(collectorRoot, { recursive: true, force: true });
    await mkdir(dirname(stagedSample), { recursive: true });
    await cp(source.absolutePath, stagedSample, {
      dereference: false,
      errorOnExist: true,
      filter: async (candidate) => {
        const difference = relative(source.absolutePath, candidate);
        if (
          difference !== "" &&
          difference.split(sep).some((part) => EXCLUDED_DIRECTORY_NAMES.has(part.toLowerCase()))
        ) {
          return false;
        }
        return !(await lstat(candidate)).isSymbolicLink();
      },
      force: false,
      recursive: true,
    });

    const baseConfig = await readWorkspaceSource(source.root, "tsconfig.base.json", 256 * 1024);
    if (baseConfig.content !== null) {
      await writeFile(join(stagedRoot, "tsconfig.base.json"), baseConfig.content, "utf8");
    }

    await symlink(
      trustedNodeModulesPath,
      join(stagedRoot, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
    const configPath = join(collectorRoot, "vitest.agentproof.config.mjs");
    const testReportPath = join(collectorRoot, "vitest.json");
    const coverageDirectory = join(collectorRoot, "coverage");
    await writeFile(configPath, generatedVitestConfig(coverageDirectory), "utf8");
    return {
      root: collectorRoot,
      samplePath: stagedSample,
      configPath,
      testReportPath,
      coverageReportPath: join(coverageDirectory, "coverage-summary.json"),
    };
  } catch {
    await rm(collectorRoot, { recursive: true, force: true });
    throw new AgentProofError(
      "AP_COLLECTOR_WORKSPACE_ERROR",
      "Isolated collector workspace could not be prepared.",
    );
  }
}

export async function removeCollectorWorkspace(path: string): Promise<void> {
  await rm(resolve(path), { recursive: true, force: true });
}
