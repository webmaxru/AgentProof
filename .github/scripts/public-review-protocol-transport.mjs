import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { performance } from "node:perf_hooks";
import { clearTimeout, setTimeout } from "node:timers";
import { TextDecoder } from "node:util";
import { AgentProofError } from "@agentproof/evidence-core";

export const MAX_PROTOCOL_BYTES = 4 * 1024 * 1024;
export const MAX_PROTOCOL_HEADER_BYTES = 8192;
export const MAX_PROTOCOL_REQUESTS = 32;
export const PROTOCOL_DEADLINE_MS = 180_000;
export const MAX_PROTOCOL_REQUEST_BYTES = 24_000;
export const MAX_PROTOCOL_NOTIFICATIONS = 128;
const METHODS = new Set([
  "connect",
  "status.get",
  "auth.getStatus",
  "session.create",
  "session.agent.getCurrent",
  "session.agent.list",
  "session.extensions.list",
  "session.mcp.list",
  "session.skills.list",
  "session.tools.initializeAndValidate",
  "session.tools.getCurrentMetadata",
  "runtime.shutdown",
]);
const AUTH_DIAGNOSTIC_PREFIX = ["connect", "status.get", "auth.getStatus"];

function rejected(code, message) {
  return new AgentProofError(`AP_REVIEW_PROTOCOL_${code}`, message);
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function authDiagnosticParams(method, params) {
  if (!object(params) || ![Object.prototype, null].includes(Object.getPrototypeOf(params)))
    return false;
  if (method !== "connect") return Object.keys(params).length === 0;
  return (
    Object.keys(params).length === 2 &&
    Object.hasOwn(params, "enableGitHubTelemetryForwarding") &&
    Object.hasOwn(params, "supportedTaskKinds") &&
    params.enableGitHubTelemetryForwarding === false &&
    Array.isArray(params.supportedTaskKinds) &&
    params.supportedTaskKinds.length === 0
  );
}

export function encodeProtocolMessage(message) {
  const body = Buffer.from(JSON.stringify(message), "utf8");
  const header = Buffer.from(`Content-Length: ${body.length}\r\n\r\n`);
  if (header.length + body.length > MAX_PROTOCOL_BYTES) {
    throw rejected("BYTES_EXCEEDED", "Protocol frame exceeds the native byte ceiling.");
  }
  return Buffer.concat([header, body]);
}

export class ProtocolFrameReader {
  #pending = Buffer.alloc(0);
  #length = null;
  #header = null;
  #onMessage;

  constructor(onMessage) {
    this.#onMessage = onMessage;
  }

  push(chunk) {
    if (this.#pending.length + chunk.length > MAX_PROTOCOL_BYTES) {
      throw rejected("BYTES_EXCEEDED", "Buffered native bytes exceed the frame ceiling.");
    }
    this.#pending = Buffer.concat([this.#pending, chunk]);
    for (;;) {
      if (this.#length === null) {
        const end = this.#pending.indexOf("\r\n\r\n");
        if (end < 0) {
          if (this.#pending.length > MAX_PROTOCOL_HEADER_BYTES) {
            throw rejected("HEADER_INVALID", "Native protocol header exceeds its byte ceiling.");
          }
          return;
        }
        if (end + 4 > MAX_PROTOCOL_HEADER_BYTES) {
          throw rejected("HEADER_INVALID", "Native protocol header exceeds its byte ceiling.");
        }
        const header = this.#pending.subarray(0, end).toString("latin1");
        const match = /^Content-Length: ([1-9][0-9]*)$/iu.exec(header);
        const length = Number(match?.[1]);
        if (!match || !Number.isSafeInteger(length) || length + end + 4 > MAX_PROTOCOL_BYTES) {
          throw rejected("HEADER_INVALID", "Native Content-Length header is invalid or excessive.");
        }
        this.#length = length;
        this.#header = this.#pending.subarray(0, end + 4);
        this.#pending = this.#pending.subarray(end + 4);
      }
      if (this.#pending.length < this.#length) return;
      const body = this.#pending.subarray(0, this.#length);
      const fingerprint = {
        rawResponseBytes: this.#header.length + body.length,
        rawResponseSha256: createHash("sha256").update(this.#header).update(body).digest("hex"),
      };
      this.#pending = this.#pending.subarray(this.#length);
      this.#length = null;
      this.#header = null;
      let message;
      try {
        message = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
      } catch {
        throw rejected("JSON_INVALID", "Native protocol JSON or UTF-8 is malformed.");
      }
      this.#onMessage(message, fingerprint);
    }
  }

  end() {
    if (this.#pending.length !== 0 || this.#length !== null) {
      throw rejected("TRUNCATED", "Native protocol stream ended with an incomplete frame.");
    }
  }
}

export function openProtocolTransport(
  {
    executable,
    args,
    cwd,
    env,
    onNotification,
    onConnectResponse,
    onAuthResponse,
    onSessionCreateResponse,
    connectOnly = false,
    authOnly = false,
    timeoutMs = PROTOCOL_DEADLINE_MS,
  },
  spawnNative = spawn,
) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > PROTOCOL_DEADLINE_MS) {
    throw rejected("DEADLINE_INVALID", "The native deadline must not exceed 180 seconds.");
  }
  if (
    typeof connectOnly !== "boolean" ||
    typeof authOnly !== "boolean" ||
    (connectOnly && authOnly)
  ) {
    throw rejected("REQUEST_INVALID", "Diagnostic transport modes must be explicit and exclusive.");
  }
  const startedAt = Date.now();
  const deadlineAt = performance.now() + timeoutMs;
  const stats = {
    startedAt: new Date(startedAt).toISOString(),
    stdoutBytes: 0,
    stderrBytes: 0,
    stdoutHashedBytes: 0,
    stderrHashedBytes: 0,
    outboundBytes: 0,
    requestCount: 0,
    responseCount: 0,
    notificationCount: 0,
    reverseRequestCount: 0,
    requestMethods: [],
    exitObserved: false,
    streamsClosed: false,
    spawnFailed: false,
    shutdownAcknowledged: false,
    exitCode: null,
    signal: null,
  };
  const hashes = { stdout: createHash("sha256"), stderr: createHash("sha256") };
  const pending = new Map();
  let failure;
  let closing = false;
  let killRequested = false;
  let child;
  let timer;
  let resolveClosed;
  let resolveDeadline;
  const closed = new Promise((resolve) => (resolveClosed = resolve));
  const deadline = new Promise((resolve) => (resolveDeadline = resolve));

  function fail(error, origin = "transport", fingerprint) {
    if (!failure) {
      stats.firstFailure = {
        origin,
        ...(fingerprint ? { ...fingerprint } : {}),
      };
    }
    failure ??=
      error instanceof AgentProofError
        ? error
        : rejected("INVALID", "Native protocol observation failed.");
    stats.errorCode = failure.code;
    for (const request of pending.values()) request.reject(failure);
    pending.clear();
    if (child && !stats.exitObserved && !stats.spawnFailed && !killRequested) {
      killRequested = true;
      try {
        stats.killAccepted = child.kill("SIGKILL");
      } catch {
        stats.killAccepted = false;
      }
    }
  }

  function requireTime() {
    if (performance.now() >= deadlineAt) {
      fail(rejected("DEADLINE", "The single native protocol deadline expired."));
      resolveDeadline(false);
      return false;
    }
    return true;
  }

  const reader = new ProtocolFrameReader((message, fingerprint) => {
    if (!requireTime()) throw failure;
    const [outstandingId, outstanding] = pending.entries().next().value ?? [];
    if (
      outstanding?.method === "connect" &&
      (!object(message) || !Object.hasOwn(message, "method"))
    ) {
      onConnectResponse?.(message, fingerprint, outstandingId);
    }
    if (
      outstanding?.method === "auth.getStatus" &&
      (!object(message) || !Object.hasOwn(message, "method"))
    ) {
      onAuthResponse?.(message, fingerprint, outstandingId);
    }
    if (
      outstanding?.method === "session.create" &&
      (!object(message) || !Object.hasOwn(message, "method"))
    ) {
      try {
        onSessionCreateResponse?.(message, fingerprint, outstandingId);
      } catch (error) {
        fail(error, "session-create-diagnostics", fingerprint);
        throw error;
      }
    }
    if (!object(message) || message.jsonrpc !== "2.0") {
      throw rejected("ENVELOPE_INVALID", "Native JSON-RPC envelope is unsupported.");
    }
    if (Object.hasOwn(message, "method")) {
      if (Object.hasOwn(message, "id")) {
        stats.reverseRequestCount++;
        throw rejected(
          "REVERSE_REQUEST",
          "Native reverse requests are forbidden in state-only mode.",
        );
      }
      if (
        !["session.event", "session.lifecycle"].includes(message.method) ||
        Object.keys(message).some((key) => !["jsonrpc", "method", "params"].includes(key)) ||
        !object(message.params) ||
        ++stats.notificationCount > MAX_PROTOCOL_NOTIFICATIONS ||
        connectOnly ||
        authOnly
      ) {
        throw rejected(
          "NOTIFICATION_INVALID",
          "Native notification is unknown or exceeds its bound.",
        );
      }
      try {
        onNotification(message.method, message.params, fingerprint);
      } catch (error) {
        fail(
          error,
          message.method === "session.event" &&
            object(message.params.event) &&
            message.params.event.type === "session.start"
            ? "session-start-notification"
            : "session-notification",
          fingerprint,
        );
        throw error;
      }
      return;
    }
    if (
      !Number.isInteger(message.id) ||
      !pending.has(message.id) ||
      Object.keys(message).some((key) => !["jsonrpc", "id", "result", "error"].includes(key)) ||
      Object.hasOwn(message, "result") === Object.hasOwn(message, "error")
    ) {
      throw rejected("RESPONSE_INVALID", "Native response identity or shape is invalid.");
    }
    stats.responseCount++;
    if (Object.hasOwn(message, "error")) {
      if (Number.isSafeInteger(message.error?.code) && Math.abs(message.error.code) <= 2147483647)
        stats.nativeRpcErrorCode = message.error.code;
      throw rejected("RPC_ERROR", "Native RPC failed; no fallback or retry is permitted.");
    }
    const request = pending.get(message.id);
    if (request.method === "runtime.shutdown") {
      if (message.result !== null) {
        throw rejected(
          "RESPONSE_INVALID",
          "Native shutdown must return its documented void result.",
        );
      }
      stats.shutdownAcknowledged = true;
    }
    pending.delete(message.id);
    request.resolve(message.result);
  });

  function receive(kind, chunk) {
    const remaining = Math.max(
      0,
      MAX_PROTOCOL_BYTES - stats.stdoutHashedBytes - stats.stderrHashedBytes,
    );
    stats[`${kind}Bytes`] += chunk.length;
    hashes[kind].update(chunk.subarray(0, remaining));
    stats[`${kind}HashedBytes`] += Math.min(chunk.length, remaining);
    if (stats.stdoutBytes + stats.stderrBytes > MAX_PROTOCOL_BYTES) {
      fail(rejected("BYTES_EXCEEDED", "Cumulative native stdout and stderr exceed 4 MiB."));
      child.stdout.destroy();
      child.stderr.destroy();
      return;
    }
    if (failure || !requireTime()) return;
    if (kind === "stderr") {
      if (chunk.length > 0) fail(rejected("STDERR", "Native stderr is not empty."));
      return;
    }
    try {
      reader.push(chunk);
    } catch (error) {
      fail(error);
    }
  }

  try {
    child = spawnNative(executable, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      shell: false,
      windowsHide: true,
    });
  } catch {
    throw rejected("SPAWN_FAILED", "Native process could not be started.");
  }
  if (Number.isInteger(child.pid)) stats.processId = child.pid;
  child.stdout.on("data", (chunk) => receive("stdout", chunk));
  child.stderr.on("data", (chunk) => receive("stderr", chunk));
  child.stdin.on("error", () => fail(rejected("STREAM_ERROR", "Native stdin failed.")));
  child.stdout.on("error", () => fail(rejected("STREAM_ERROR", "Native stdout failed.")));
  child.stderr.on("error", () => fail(rejected("STREAM_ERROR", "Native stderr failed.")));
  child.once("error", () => {
    stats.spawnFailed = !Number.isInteger(child.pid);
    fail(rejected("SPAWN_FAILED", "Native process reported a launch error."));
  });
  child.once("exit", (code, signal) => {
    stats.exitObserved = true;
    stats.exitCode = code;
    stats.signal = signal;
  });
  child.once("close", () => {
    stats.streamsClosed = true;
    stats.completedAt = new Date().toISOString();
    clearTimeout(timer);
    try {
      if (!requireTime()) throw failure;
      reader.end();
      if (
        !closing ||
        pending.size ||
        (!stats.spawnFailed &&
          (!stats.exitObserved || stats.exitCode !== 0 || stats.signal !== null))
      ) {
        throw rejected("EXIT_INVALID", "Native process exited early or unsuccessfully.");
      }
    } catch (error) {
      fail(error);
    }
    resolveClosed(stats.exitObserved || stats.spawnFailed);
  });
  timer = setTimeout(
    () => {
      fail(rejected("DEADLINE", "The single native protocol deadline expired."));
      resolveDeadline(false);
    },
    Math.max(0, deadlineAt - performance.now()),
  );

  return {
    async request(method, params) {
      if (failure || !requireTime()) throw failure;
      if (
        closing ||
        !METHODS.has(method) ||
        (connectOnly && (method !== "connect" || stats.requestCount !== 0)) ||
        (authOnly &&
          (method !== AUTH_DIAGNOSTIC_PREFIX[stats.requestCount] ||
            !authDiagnosticParams(method, params))) ||
        pending.size !== 0 ||
        stats.requestCount >= MAX_PROTOCOL_REQUESTS ||
        !object(params)
      ) {
        fail(
          rejected(
            "REQUEST_INVALID",
            "State-only RPC method, concurrency, or request bound rejected.",
          ),
        );
        throw failure;
      }
      const id = stats.requestCount + 1;
      let frame;
      try {
        frame = encodeProtocolMessage({ jsonrpc: "2.0", id, method, params });
        if (
          frame.length > MAX_PROTOCOL_REQUEST_BYTES ||
          stats.outboundBytes + frame.length > MAX_PROTOCOL_BYTES
        ) {
          throw rejected("BYTES_EXCEEDED", "Native request exceeds its fixed byte bound.");
        }
      } catch (error) {
        fail(error);
        throw failure;
      }
      stats.requestCount++;
      stats.outboundBytes += frame.length;
      stats.requestMethods.push(method);
      if (method === "runtime.shutdown") closing = true;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, method });
        try {
          child.stdin.write(frame);
        } catch {
          fail(rejected("STREAM_ERROR", "Native stdin write failed."));
        }
      });
    },
    abort() {
      fail(rejected("ABORTED", "Trusted host blocked the native state observation."), "host-abort");
    },
    async finish() {
      if (authOnly && !failure && stats.requestCount !== AUTH_DIAGNOSTIC_PREFIX.length) {
        fail(
          rejected(
            "REQUEST_INVALID",
            "Auth-only observation ended before its fixed request prefix completed.",
          ),
        );
      }
      closing = true;
      if (!failure && !stats.streamsClosed && requireTime() && !stats.exitObserved) {
        try {
          child.stdin.end();
        } catch {
          fail(rejected("STREAM_ERROR", "Native stdin close failed."));
        }
      }
      return Promise.race([closed, deadline]);
    },
    metadata() {
      return {
        ...stats,
        stdoutSha256: hashes.stdout.copy().digest("hex"),
        stderrSha256: hashes.stderr.copy().digest("hex"),
      };
    },
    remainingMilliseconds() {
      return Math.max(0, Math.floor(deadlineAt - performance.now()));
    },
    get error() {
      return failure;
    },
  };
}
