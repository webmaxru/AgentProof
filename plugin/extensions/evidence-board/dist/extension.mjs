import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { CanvasError, createCanvas, joinSession } from "@github/copilot-sdk/extension";
import { DRAFT_DISPOSITION_SCHEMA, EVIDENCE_DOCUMENT_SCHEMA, EvidenceValidationError, OPEN_EVIDENCE_BOARD_SCHEMA, SELECT_FINDING_SCHEMA, boardKey, documentBoardKey, parseEvidenceDocument } from "./model.js";
import { renderHtml } from "./renderer.js";
import { BoardStateError, EMPTY_BOARD_STATE, createBoardView, reduceBoard } from "./reducer.js";
import { BoardStore } from "./store.js";
const CANVAS_ID = "agentproof-evidence-board";
const MAX_REQUEST_BYTES = 32_768;
const BLANK_KEY_PREFIX = "blank:";
const states = new Map();
const instanceKeys = new Map();
const servers = new Map();
const mutationQueues = new Map();
let store = new BoardStore(undefined);
let sampleDocument;
function canvasError(error) {
    if (error instanceof CanvasError) {
        return error;
    }
    if (error instanceof BoardStateError || error instanceof EvidenceValidationError) {
        return new CanvasError(error.code, error.message);
    }
    const message = error instanceof Error ? error.message : "Unexpected Evidence Board failure.";
    return new CanvasError("evidence_board_error", message);
}
function assertNoActionInput(value) {
    if (value === undefined || value === null) {
        return;
    }
    if (typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === 0) {
        return;
    }
    throw new EvidenceValidationError("schema_invalid", "$", "this action accepts no input");
}
function parseOpenInput(value) {
    if (value === undefined) {
        return {
            useSample: false
        };
    }
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new EvidenceValidationError("schema_invalid", "$", "must be an object");
    }
    const object = value;
    const allowed = new Set([
        "document",
        "repository",
        "pullRequestNumber",
        "expectedHeadSha",
        "useSample"
    ]);
    const unexpected = Object.keys(object).find((key)=>!allowed.has(key));
    if (unexpected !== undefined) {
        throw new EvidenceValidationError("schema_invalid", `$.${unexpected}`, "is not an allowed property");
    }
    const document = object.document === undefined ? undefined : parseEvidenceDocument(object.document);
    const repository = object.repository === undefined ? undefined : typeof object.repository === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(object.repository) && object.repository.length <= 200 ? object.repository : undefined;
    if (object.repository !== undefined && repository === undefined) {
        throw new EvidenceValidationError("schema_invalid", "$.repository", "must use OWNER/REPOSITORY form");
    }
    const pullRequestNumber = object.pullRequestNumber === undefined ? undefined : typeof object.pullRequestNumber === "number" && Number.isInteger(object.pullRequestNumber) && object.pullRequestNumber >= 1 ? object.pullRequestNumber : undefined;
    if (object.pullRequestNumber !== undefined && pullRequestNumber === undefined) {
        throw new EvidenceValidationError("schema_invalid", "$.pullRequestNumber", "must be a positive integer");
    }
    if (repository === undefined !== (pullRequestNumber === undefined)) {
        throw new EvidenceValidationError("incomplete_evidence_scope", "$", "repository and pullRequestNumber must be supplied together");
    }
    const expectedHeadSha = object.expectedHeadSha === undefined ? undefined : typeof object.expectedHeadSha === "string" && /^[0-9a-f]{40}$/u.test(object.expectedHeadSha) ? object.expectedHeadSha : undefined;
    if (object.expectedHeadSha !== undefined && expectedHeadSha === undefined) {
        throw new EvidenceValidationError("schema_invalid", "$.expectedHeadSha", "must be a lowercase 40-character Git SHA");
    }
    if (object.useSample !== undefined && typeof object.useSample !== "boolean") {
        throw new EvidenceValidationError("schema_invalid", "$.useSample", "must be a boolean");
    }
    const useSample = object.useSample === true;
    if (useSample && document !== undefined) {
        throw new EvidenceValidationError("ambiguous_open_input", "$", "document and useSample cannot be combined");
    }
    if (document !== undefined && repository !== undefined && (document.repository !== repository || document.pullRequestNumber !== pullRequestNumber)) {
        throw new EvidenceValidationError("mixed_evidence_scope", "$.document", "does not match the requested repository and pull request");
    }
    if (document !== undefined && expectedHeadSha !== undefined && document.headSha !== expectedHeadSha) {
        throw new EvidenceValidationError("stale_head_sha", "$.expectedHeadSha", "does not match document.headSha");
    }
    return {
        ...document === undefined ? {} : {
            document
        },
        ...repository === undefined ? {} : {
            repository
        },
        ...pullRequestNumber === undefined ? {} : {
            pullRequestNumber
        },
        ...expectedHeadSha === undefined ? {} : {
            expectedHeadSha
        },
        useSample
    };
}
async function loadSampleDocument() {
    if (sampleDocument !== undefined) {
        return sampleDocument;
    }
    const sampleArtifact = process.env.AGENTPROOF_SAMPLE_EVIDENCE ?? "sample-evidence.json";
    const serialized = await readFile(new URL(`../artifacts/${sampleArtifact}`, import.meta.url), "utf8");
    sampleDocument = parseEvidenceDocument(JSON.parse(serialized));
    return sampleDocument;
}
function isPersistentKey(key) {
    return !key.startsWith(BLANK_KEY_PREFIX);
}
async function withKeyLock(key, operation) {
    const previous = mutationQueues.get(key) ?? Promise.resolve();
    let release = ()=>{};
    const completion = new Promise((resolve)=>{
        release = resolve;
    });
    const queued = previous.then(()=>completion);
    mutationQueues.set(key, queued);
    await previous;
    try {
        return await operation();
    } finally{
        release();
        if (mutationQueues.get(key) === queued) {
            mutationQueues.delete(key);
        }
    }
}
async function stateForKey(key) {
    const cached = states.get(key);
    if (cached !== undefined) {
        return cached;
    }
    const loaded = isPersistentKey(key) ? await store.load(key) : EMPTY_BOARD_STATE;
    states.set(key, loaded);
    return loaded;
}
async function persist(key, state) {
    states.set(key, state);
    if (isPersistentKey(key)) {
        await store.save(key, state);
    }
}
function keyForInstance(instanceId) {
    const key = instanceKeys.get(instanceId);
    if (key === undefined) {
        throw new BoardStateError("canvas_instance_not_open", `Canvas instance ${instanceId} is not open.`);
    }
    return key;
}
async function viewForInstance(instanceId) {
    const key = keyForInstance(instanceId);
    return createBoardView(await stateForKey(key));
}
function pushView(instanceId, view) {
    const entry = servers.get(instanceId);
    if (entry === undefined) {
        return;
    }
    const event = `data: ${JSON.stringify(view)}\n\n`;
    for (const client of entry.clients){
        client.write(event);
    }
}
async function broadcastKey(key) {
    const state = await stateForKey(key);
    const view = createBoardView(state);
    for (const [instanceId, instanceKey] of instanceKeys){
        if (instanceKey === key) {
            pushView(instanceId, view);
        }
    }
}
async function setEvidence(instanceId, value, sample = false) {
    const document = parseEvidenceDocument(value);
    const targetKey = documentBoardKey(document);
    return withKeyLock(targetKey, async ()=>{
        const currentKey = instanceKeys.get(instanceId) ?? `${BLANK_KEY_PREFIX}${instanceId}`;
        const currentState = await stateForKey(currentKey);
        const baseState = currentState.document !== null ? currentState : await stateForKey(targetKey);
        const nextState = reduceBoard(baseState, {
            type: "set_evidence",
            document,
            sample
        });
        await persist(targetKey, nextState);
        instanceKeys.set(instanceId, targetKey);
        if (currentKey !== targetKey && !isPersistentKey(currentKey)) {
            states.delete(currentKey);
        }
        if (currentKey !== targetKey) {
            await broadcastKey(currentKey);
        }
        await broadcastKey(targetKey);
        return createBoardView(nextState);
    });
}
async function mutateInstance(instanceId, action) {
    const key = keyForInstance(instanceId);
    return withKeyLock(key, async ()=>{
        const nextState = reduceBoard(await stateForKey(key), action);
        if (action.type === "clear_evidence") {
            states.set(key, nextState);
            if (isPersistentKey(key)) {
                await store.clear(key);
            }
        } else {
            await persist(key, nextState);
        }
        await broadcastKey(key);
        return createBoardView(nextState);
    });
}
function setSecurityHeaders(response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader("Referrer-Policy", "no-referrer");
    response.setHeader("X-Content-Type-Options", "nosniff");
    response.setHeader("Content-Security-Policy", "default-src 'none'; connect-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'");
}
function sendJson(response, status, value) {
    setSecurityHeaders(response);
    response.statusCode = status;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify(value));
}
function sendError(response, error) {
    const normalized = canvasError(error);
    sendJson(response, 400, {
        code: normalized.code,
        message: normalized.message
    });
}
async function readJsonBody(request) {
    const contentType = request.headers["content-type"] ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
        throw new BoardStateError("invalid_content_type", "Use application/json.");
    }
    const chunks = [];
    let size = 0;
    for await (const rawChunk of request){
        const chunk = rawChunk;
        const bytes = typeof chunk === "string" ? Buffer.from(chunk) : chunk instanceof Uint8Array ? chunk : (()=>{
            throw new BoardStateError("invalid_request_chunk", "Request body is not binary data.");
        })();
        size += bytes.byteLength;
        if (size > MAX_REQUEST_BYTES) {
            throw new BoardStateError("request_too_large", "Request body exceeds 32 KiB.");
        }
        chunks.push(bytes);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch  {
        throw new BoardStateError("invalid_json", "Request body must contain valid JSON.");
    }
}
async function handleRequest(instanceId, token, clients, request, response) {
    const host = request.headers.host ?? "";
    if (!host.startsWith("127.0.0.1:")) {
        sendJson(response, 403, {
            code: "invalid_host",
            message: "Loopback host required."
        });
        return;
    }
    const requestUrl = new URL(request.url ?? "/", "http://127.0.0.1");
    const rootPath = `/${token}`;
    if (request.method === "GET" && (requestUrl.pathname === rootPath || requestUrl.pathname === `${rootPath}/`)) {
        setSecurityHeaders(response);
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(renderHtml(token));
        return;
    }
    if (request.method === "GET" && requestUrl.pathname === `${rootPath}/api/state`) {
        sendJson(response, 200, await viewForInstance(instanceId));
        return;
    }
    if (request.method === "GET" && requestUrl.pathname === `${rootPath}/events`) {
        setSecurityHeaders(response);
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        response.setHeader("Connection", "keep-alive");
        response.write(`retry: 2000\ndata: ${JSON.stringify(await viewForInstance(instanceId))}\n\n`);
        clients.add(response);
        request.once("close", ()=>{
            clients.delete(response);
        });
        return;
    }
    if (request.method === "POST" && requestUrl.pathname === `${rootPath}/api/select`) {
        sendJson(response, 200, await mutateInstance(instanceId, {
            type: "select_finding",
            input: await readJsonBody(request)
        }));
        return;
    }
    if (request.method === "POST" && requestUrl.pathname === `${rootPath}/api/draft`) {
        sendJson(response, 200, await mutateInstance(instanceId, {
            type: "draft_disposition",
            input: await readJsonBody(request)
        }));
        return;
    }
    if (request.method === "POST" && requestUrl.pathname === `${rootPath}/api/clear`) {
        assertNoActionInput(await readJsonBody(request));
        sendJson(response, 200, await mutateInstance(instanceId, {
            type: "clear_evidence"
        }));
        return;
    }
    sendJson(response, 404, {
        code: "not_found",
        message: "Evidence Board route not found."
    });
}
async function startServer(instanceId) {
    const existing = servers.get(instanceId);
    if (existing !== undefined) {
        return existing;
    }
    const token = randomBytes(24).toString("hex");
    const clients = new Set();
    const server = createServer((request, response)=>{
        void handleRequest(instanceId, token, clients, request, response).catch((error)=>{
            if (!response.headersSent) {
                sendError(response, error);
            } else {
                response.destroy();
            }
        });
    });
    await new Promise((resolve, reject)=>{
        server.once("error", reject);
        server.listen(0, "127.0.0.1", ()=>{
            server.off("error", reject);
            resolve();
        });
    });
    const address = server.address();
    if (address === null || typeof address === "string") {
        await new Promise((resolve)=>server.close(()=>resolve()));
        throw new BoardStateError("server_start_failed", "Could not allocate a loopback port.");
    }
    const entry = {
        server,
        token,
        url: `http://127.0.0.1:${address.port}/${token}/`,
        clients
    };
    servers.set(instanceId, entry);
    return entry;
}
async function stopServer(instanceId) {
    const entry = servers.get(instanceId);
    if (entry === undefined) {
        return;
    }
    servers.delete(instanceId);
    for (const client of entry.clients){
        client.end();
    }
    entry.clients.clear();
    await new Promise((resolve)=>entry.server.close(()=>resolve()));
}
const canvas = createCanvas({
    id: CANVAS_ID,
    displayName: "AgentProof Evidence Board",
    description: "Inspect commit-bound release findings and draft explicit human disposition commands without approving them.",
    inputSchema: OPEN_EVIDENCE_BOARD_SCHEMA,
    actions: [
        {
            name: "set_evidence",
            description: "Validate and load one complete evidence document; rejects mixed scopes, SHAs, and stale updates.",
            inputSchema: EVIDENCE_DOCUMENT_SCHEMA,
            handler: async (context)=>{
                try {
                    return await setEvidence(context.instanceId, context.input);
                } catch (error) {
                    throw canvasError(error);
                }
            }
        },
        {
            name: "get_evidence",
            description: "Return the loaded evidence document and current mutable board state.",
            handler: async (context)=>{
                try {
                    assertNoActionInput(context.input);
                    return await viewForInstance(context.instanceId);
                } catch (error) {
                    throw canvasError(error);
                }
            }
        },
        {
            name: "select_finding",
            description: "Select an existing finding by stable finding ID.",
            inputSchema: SELECT_FINDING_SCHEMA,
            handler: async (context)=>{
                try {
                    return await mutateInstance(context.instanceId, {
                        type: "select_finding",
                        input: context.input
                    });
                } catch (error) {
                    throw canvasError(error);
                }
            }
        },
        {
            name: "draft_disposition",
            description: "Draft an exact SHA-bound PR comment command; never posts, approves, merges, or changes the gate.",
            inputSchema: DRAFT_DISPOSITION_SCHEMA,
            handler: async (context)=>{
                try {
                    return await mutateInstance(context.instanceId, {
                        type: "draft_disposition",
                        input: context.input
                    });
                } catch (error) {
                    throw canvasError(error);
                }
            }
        },
        {
            name: "clear_evidence",
            description: "Clear only this mutable Evidence Board; authoritative GitHub records are unchanged.",
            handler: async (context)=>{
                try {
                    assertNoActionInput(context.input);
                    return await mutateInstance(context.instanceId, {
                        type: "clear_evidence"
                    });
                } catch (error) {
                    throw canvasError(error);
                }
            }
        }
    ],
    open: async (context)=>{
        try {
            const input = parseOpenInput(context.input);
            const existingKey = instanceKeys.get(context.instanceId);
            let document = input.document;
            let sample = false;
            if (input.useSample) {
                document = await loadSampleDocument();
                sample = true;
            }
            if (document !== undefined && input.repository !== undefined && (document.repository !== input.repository || document.pullRequestNumber !== input.pullRequestNumber)) {
                throw new EvidenceValidationError("mixed_evidence_scope", "$.repository", "does not match the selected evidence document");
            }
            let key = existingKey ?? (document !== undefined ? documentBoardKey(document) : input.repository !== undefined && input.pullRequestNumber !== undefined ? boardKey(input.repository, input.pullRequestNumber) : `${BLANK_KEY_PREFIX}${context.instanceId}`);
            const current = await stateForKey(key);
            if (existingKey !== undefined && document !== undefined && current.document !== null && documentBoardKey(document) !== existingKey) {
                throw new BoardStateError("mixed_evidence_scope", "Clear the board before opening a different repository or pull request in this panel.");
            }
            instanceKeys.set(context.instanceId, key);
            if (document !== undefined) {
                const view = await setEvidence(context.instanceId, document, sample);
                key = keyForInstance(context.instanceId);
                if (input.expectedHeadSha !== undefined && view.document?.headSha !== input.expectedHeadSha) {
                    throw new BoardStateError("stale_head_sha", "Loaded evidence does not match expectedHeadSha.");
                }
            } else if (input.expectedHeadSha !== undefined) {
                const loaded = await stateForKey(key);
                if (loaded.document?.headSha !== input.expectedHeadSha) {
                    throw new BoardStateError("stale_head_sha", "Persisted evidence does not match expectedHeadSha.");
                }
            }
            const entry = await startServer(context.instanceId);
            const state = await stateForKey(key);
            const suffix = state.document === null ? "No evidence loaded" : `#${state.document.pullRequestNumber} · ${state.document.headSha.slice(0, 12)} · ${state.document.gate.conclusion}`;
            return {
                url: entry.url,
                title: "AgentProof Evidence Board",
                status: suffix
            };
        } catch (error) {
            throw canvasError(error);
        }
    },
    onClose: async (context)=>{
        instanceKeys.delete(context.instanceId);
        await stopServer(context.instanceId);
    }
});
const session = await joinSession({
    canvases: [
        canvas
    ]
});
store = new BoardStore(session.workspacePath);


//# sourceURL=agentproof://extension.ts