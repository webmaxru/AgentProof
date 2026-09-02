import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { EMPTY_BOARD_STATE, restoreBoardState } from "./reducer.js";
import type { BoardState } from "./reducer.js";

function hasErrorCode(error: unknown, code: string): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === code
  );
}

export class BoardStore {
  readonly #root: string | undefined;

  constructor(workspacePath: string | undefined) {
    this.#root =
      workspacePath === undefined
        ? undefined
        : join(workspacePath, ".agentproof", "evidence-board");
  }

  #pathFor(key: string): string | undefined {
    if (this.#root === undefined) {
      return undefined;
    }
    const digest = createHash("sha256").update(key).digest("hex");
    return join(this.#root, `${digest}.json`);
  }

  async load(key: string, now = new Date()): Promise<BoardState> {
    const path = this.#pathFor(key);
    if (path === undefined) {
      return EMPTY_BOARD_STATE;
    }
    try {
      const serialized = await readFile(path, "utf8");
      return restoreBoardState(JSON.parse(serialized) as unknown, now);
    } catch (error) {
      if (hasErrorCode(error, "ENOENT")) {
        return EMPTY_BOARD_STATE;
      }
      throw error;
    }
  }

  async save(key: string, state: BoardState): Promise<void> {
    const path = this.#pathFor(key);
    if (path === undefined) {
      return;
    }
    await mkdir(dirname(path), { recursive: true });
    const pendingPath = `${path}.${randomUUID()}.writing`;
    await writeFile(pendingPath, `${JSON.stringify(state, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(pendingPath, path);
  }

  async clear(key: string): Promise<void> {
    const path = this.#pathFor(key);
    if (path === undefined) {
      return;
    }
    await rm(path, { force: true });
  }
}
