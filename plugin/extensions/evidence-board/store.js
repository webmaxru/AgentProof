import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { EMPTY_BOARD_STATE, restoreBoardState } from "./reducer.js";
function hasErrorCode(error, code) {
    return typeof error === "object" && error !== null && "code" in error && error.code === code;
}
export class BoardStore {
    #root;
    constructor(workspacePath){
        this.#root = workspacePath === undefined ? undefined : join(workspacePath, ".agentproof", "evidence-board");
    }
    #pathFor(key) {
        if (this.#root === undefined) {
            return undefined;
        }
        const digest = createHash("sha256").update(key).digest("hex");
        return join(this.#root, `${digest}.json`);
    }
    async load(key, now = new Date()) {
        const path = this.#pathFor(key);
        if (path === undefined) {
            return EMPTY_BOARD_STATE;
        }
        try {
            const serialized = await readFile(path, "utf8");
            return restoreBoardState(JSON.parse(serialized), now);
        } catch (error) {
            if (hasErrorCode(error, "ENOENT")) {
                return EMPTY_BOARD_STATE;
            }
            throw error;
        }
    }
    async save(key, state) {
        const path = this.#pathFor(key);
        if (path === undefined) {
            return;
        }
        await mkdir(dirname(path), {
            recursive: true
        });
        const pendingPath = `${path}.${randomUUID()}.writing`;
        await writeFile(pendingPath, `${JSON.stringify(state, null, 2)}\n`, {
            encoding: "utf8",
            mode: 0o600
        });
        await rename(pendingPath, path);
    }
    async clear(key) {
        const path = this.#pathFor(key);
        if (path === undefined) {
            return;
        }
        await rm(path, {
            force: true
        });
    }
}


//# sourceURL=agentproof://store.ts