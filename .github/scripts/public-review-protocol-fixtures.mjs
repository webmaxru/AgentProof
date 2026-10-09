// Synthetic fixtures for the public ef04633 protocol-3 schemas, never live runtime proof.
import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { PassThrough, Writable } from "node:stream";
import { setImmediate, setTimeout } from "node:timers";
import { fileURLToPath } from "node:url";
import { ProtocolFrameReader, encodeProtocolMessage } from "./public-review-protocol-transport.mjs";

export function fakeProtocolChild(respond, { closeOnKill = true } = {}) {
  const child = new EventEmitter();
  child.pid = 12345;
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kills = [];
  child.messages = [];
  let completed = false;
  child.complete = (code = 0, signal = null) => {
    if (completed) return;
    completed = true;
    child.emit("exit", code, signal);
    child.stdout.end();
    child.stderr.end();
    child.emit("close", code, signal);
  };
  child.kill = (signal) => {
    child.kills.push(signal);
    if (closeOnKill) setImmediate(() => child.complete(null, signal));
    return true;
  };
  const reader = new ProtocolFrameReader((message) => {
    child.messages.push(message);
    respond?.(message, child);
  });
  child.stdin = new Writable({
    write(chunk, encoding, callback) {
      try {
        reader.push(chunk);
        callback();
      } catch (error) {
        callback(error);
      }
    },
    final(callback) {
      reader.end();
      callback();
      setImmediate(() => child.complete());
    },
  });
  return child;
}

export function protocolStateFixture() {
  return {
    connect: { ok: true, protocolVersion: 3, version: "1.0.92-3", taskKinds: [] },
    "status.get": { protocolVersion: 3, version: "1.0.92-3" },
    "auth.getStatus": {
      isAuthenticated: true,
      login: "fixture-operator",
      host: "https://github.com",
      authType: "env",
    },
    "session.extensions.list": { extensions: [] },
    "session.mcp.list": {
      servers: [
        { name: "github-mcp-server", status: "disabled" },
        { name: "githubiq", status: "disabled" },
      ],
      host: {
        mcp3pEnabled: false,
        disabledServers: ["github-mcp-server", "githubiq"],
        filteredServers: [],
        clients: [],
        pendingConnections: [],
        failedServers: {},
        needsAuthServers: {},
      },
    },
    "session.tools.getCurrentMetadata": { tools: [] },
    "session.tools.initializeAndValidate": {},
    "session.skills.list": { skills: [] },
    "runtime.shutdown": null,
  };
}

export function sessionEvent(sessionId, type, data) {
  return {
    jsonrpc: "2.0",
    method: "session.event",
    params: {
      sessionId,
      event: {
        id: randomUUID(),
        parentId: null,
        timestamp: new Date().toISOString(),
        type,
        data,
      },
    },
  };
}

export function stateFixtureChild(fixture = protocolStateFixture(), mutate) {
  let agent;
  let sessionId;
  return fakeProtocolChild((message, child) => {
    if (message.method === "session.create") {
      sessionId = message.params.sessionId;
      const configured = message.params.customAgents[0];
      agent = {
        id: configured.name,
        name: configured.name,
        displayName: configured.displayName,
        description: configured.description,
        tools: configured.tools,
        prompt: configured.prompt,
      };
      child.stdout.write(
        encodeProtocolMessage(
          sessionEvent(sessionId, "session.start", {
            sessionId,
            version: 1,
            producer: "copilot-agent",
            copilotVersion: "1.0.92-3",
            startTime: new Date().toISOString(),
          }),
        ),
      );
    }
    let result;
    if (message.method === "session.create") result = { sessionId };
    else if (message.method === "session.agent.getCurrent") result = { agent };
    else if (message.method === "session.agent.list") result = { agents: [agent] };
    else {
      if (!Object.hasOwn(fixture, message.method)) {
        throw new Error("Fixture received an unexpected method.");
      }
      result = fixture[message.method];
    }
    result = structuredClone(result);
    if (mutate) result = mutate(message, result, child) ?? result;
    child.stdout.write(encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result }));
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2] === "--stdio-fixture") {
  const reader = new ProtocolFrameReader((message) => {
    process.stdout.write(
      encodeProtocolMessage({
        jsonrpc: "2.0",
        id: message.id,
        result: message.method === "runtime.shutdown" ? null : { syntheticFixture: true },
      }),
    );
  });
  process.stdin.on("data", (chunk) => reader.push(chunk));
  process.stdin.on("end", () => {
    reader.end();
    setTimeout(() => process.stdout.end(), 30);
  });
}
