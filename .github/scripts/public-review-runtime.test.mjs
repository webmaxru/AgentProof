import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { sha256 } from "@agentproof/evidence-core";
import { FIXTURE_TIME, nativeEvents, nativeJsonl, SESSION_ID } from "./public-review-fixtures.mjs";
import {
  MAX_REVIEW_REQUEST_BYTES,
  PUBLIC_REVIEW_PROFILE_VERSION,
  SUPPORTED_COPILOT_VERSION,
  runCopilotPublicPacket,
  validatePublicReviewerProfile,
  verifyNativeZeroToolRun,
  zeroToolArguments,
  zeroToolEnvironment,
} from "./public-review-runtime.mjs";

test("all specialist copies and distribution versions describe the same explicit tool-free mode", async () => {
  for (const specialist of ["test", "security", "policy"]) {
    const [repository, plugin] = await Promise.all([
      readFile(
        new URL(`../agents/agentproof-${specialist}-reviewer.agent.md`, import.meta.url),
        "utf8",
      ),
      readFile(
        new URL(`../../plugin/agents/${specialist}-reviewer.agent.md`, import.meta.url),
        "utf8",
      ),
    ]);
    assert.equal(repository, plugin);
    validatePublicReviewerProfile(repository, specialist);
    assert.match(repository, /UNSAFE_TOOL_BOUNDARY/u);
    assert.match(repository, /No model self-report replaces native evidence/u);
    for (const source of [
      repository.replace("tools: []", 'tools: ["github/*"]'),
      repository.replace(/^tools: \[\]\r?\n/mu, ""),
      repository.replace("tools: []", "tools: []\nmcp-servers: {}"),
      repository.replace('version: "0.3.0"', 'version: "0.2.1"'),
    ]) {
      assert.throws(() => validatePublicReviewerProfile(source, specialist));
    }
  }
  const plugin = JSON.parse(
    await readFile(new URL("../../plugin/plugin.json", import.meta.url), "utf8"),
  );
  const marketplace = JSON.parse(
    await readFile(new URL("../plugin/marketplace.json", import.meta.url), "utf8"),
  );
  assert.equal(plugin.version, PUBLIC_REVIEW_PROFILE_VERSION);
  assert.equal(marketplace.metadata.version, plugin.version);
  assert.equal(marketplace.plugins[0].version, plugin.version);
});

test("native launch fixes the empty include/exclude intersection without inherited integrations", () => {
  const args = zeroToolArguments({
    specialist: "test",
    sessionId: SESSION_ID,
    request: "public fixture",
  });
  assert.deepEqual(args.slice(args.indexOf("--available-tools"), args.indexOf("--deny-tool")), [
    "--available-tools",
    "view",
    "--excluded-tools",
    "view",
  ]);
  for (const flag of [
    "--disable-builtin-mcps",
    "--no-custom-instructions",
    "--no-remote",
    "--no-remote-export",
    "--no-ask-user",
    "--no-auto-update",
  ]) {
    assert.ok(args.includes(flag));
  }
  assert.ok(
    !args.includes("--allow-all") && !args.includes("--plugin-dir") && !args.includes("--continue"),
  );
  const environment = zeroToolEnvironment("isolated-home", {
    PATH: "approved-path",
    GH_TOKEN: "synthetic-omitted-host-credential",
    GITHUB_TOKEN: "synthetic-omitted-host-credential",
    COPILOT_GITHUB_TOKEN: "synthetic-native-auth",
    COPILOT_HOME: "untrusted-home",
    COPILOT_ALLOW_ALL: "true",
    COPILOT_PROVIDER_BASE_URL: "https://example.invalid",
    COPILOT_PROVIDER_API_KEY_COMMAND: "must-not-execute",
    COPILOT_CUSTOM_INSTRUCTIONS_DIRS: "must-not-load",
    OTEL_EXPORTER_OTLP_ENDPOINT: "https://example.invalid",
  });
  assert.equal(environment.PATH, "approved-path");
  assert.equal(environment.COPILOT_HOME, "isolated-home");
  assert.equal(environment.USERPROFILE, "isolated-home");
  assert.equal(environment.COPILOT_GITHUB_TOKEN, "synthetic-native-auth");
  for (const key of [
    "GH_TOKEN",
    "GITHUB_TOKEN",
    "COPILOT_ALLOW_ALL",
    "COPILOT_PROVIDER_BASE_URL",
    "COPILOT_PROVIDER_API_KEY_COMMAND",
    "COPILOT_CUSTOM_INSTRUCTIONS_DIRS",
    "OTEL_EXPORTER_OTLP_ENDPOINT",
  ]) {
    assert.equal(environment[key], undefined);
  }
  assert.throws(() =>
    zeroToolArguments({
      specialist: "test",
      sessionId: SESSION_ID,
      request: "x".repeat(MAX_REVIEW_REQUEST_BYTES + 1),
    }),
  );
  assert.throws(() =>
    zeroToolArguments({ specialist: "test", sessionId: "old-session", request: "x" }),
  );
  assert.throws(() =>
    zeroToolArguments({ specialist: "test", sessionId: SESSION_ID, request: "@private-file" }),
  );
  for (const value of [
    "x".repeat(MAX_REVIEW_REQUEST_BYTES),
    "\u00e9".repeat(MAX_REVIEW_REQUEST_BYTES / 2),
  ]) {
    assert.equal(
      zeroToolArguments({ specialist: "test", sessionId: SESSION_ID, request: value }).at(-1),
      value,
    );
  }
  assert.throws(() =>
    zeroToolArguments({
      specialist: "test",
      sessionId: SESSION_ID,
      request: "\u00e9".repeat(MAX_REVIEW_REQUEST_BYTES / 2 + 1),
    }),
  );
});

const request = "synthetic public request";
function verify(events, fields = {}) {
  return verifyNativeZeroToolRun({
    stdout: nativeJsonl(events),
    exitCode: 0,
    sessionId: SESSION_ID,
    request,
    startedAt: FIXTURE_TIME,
    completedAt: FIXTURE_TIME,
    ...fields,
  });
}

test("native verifier binds zero tools and calls to one complete session and exact request", () => {
  const events = nativeEvents();
  const result = verify(events);
  assert.equal(result.toolCalls, 0);
  assert.equal(result.modelCalls, 1);
  assert.equal(result.requestSha256, sha256(request));
  assert.equal(result.stdoutSha256, sha256(nativeJsonl(events)));
  assert.deepEqual(result.nativeToolInventories, [
    { model: "synthetic-model", tool_count: 0, tools: [], tools_truncated: 0 },
  ]);
  assert.equal(result.nativeInputEnvelope, "current_datetime");
  assert.equal(result.transformedRequestSha256, sha256(events[3].data.transformedContent));
});

test("native clock offsets and the recognized model-only tool update remain observable", () => {
  const events = nativeEvents(
    request,
    "synthetic advisory response",
    "2026-09-02T11:00:00.000+02:00",
  );
  events.splice(3, 0, { type: "session.tools_updated", data: { model: "synthetic-model" } });
  assert.equal(verify(events).toolCalls, 0);
});

for (const [label, mutate] of [
  ["tool execution", (events) => events.splice(4, 0, { type: "tool.execution_start", data: {} })],
  [
    "orphan tool completion",
    (events) => events.splice(4, 0, { type: "tool.execution_complete", data: {} }),
  ],
  [
    "tool request without execution",
    (events) => {
      events[6].data.toolRequests = [{ name: "write" }];
    },
  ],
  [
    "missing tool requests",
    (events) => {
      delete events[6].data.toolRequests;
    },
  ],
  [
    "nonzero tool count",
    (events) => {
      events[8].data.promptCacheBreakState[0].models["synthetic-model"].tool_count = 1;
    },
  ],
  [
    "nonempty tools despite zero count",
    (events) => {
      events[8].data.promptCacheBreakState[0].models["synthetic-model"].tools = ["read"];
    },
  ],
  [
    "truncated inventory",
    (events) => {
      events[8].data.promptCacheBreakState[0].models["synthetic-model"].tools_truncated = 1;
    },
  ],
  [
    "missing count",
    (events) => {
      delete events[8].data.promptCacheBreakState[0].models["synthetic-model"].tool_count;
    },
  ],
  [
    "missing tools",
    (events) => {
      delete events[8].data.promptCacheBreakState[0].models["synthetic-model"].tools;
    },
  ],
  [
    "missing truncation metadata",
    (events) => {
      delete events[8].data.promptCacheBreakState[0].models["synthetic-model"].tools_truncated;
    },
  ],
  [
    "coerced count",
    (events) => {
      events[8].data.promptCacheBreakState[0].models["synthetic-model"].tool_count = "0";
    },
  ],
  [
    "empty checkpoint",
    (events) => {
      events[8].data.promptCacheBreakState = [];
    },
  ],
  [
    "unsupported dictionary checkpoint",
    (events) => {
      events[8].data.promptCacheBreakState = events[8].data.promptCacheBreakState[0];
    },
  ],
  ["missing checkpoint", (events) => events.splice(8, 1)],
  [
    "empty models",
    (events) => {
      events[8].data.promptCacheBreakState[0].models = {};
    },
  ],
  [
    "second unsafe model",
    (events) => {
      events[8].data.promptCacheBreakState[0].models.other = {
        tool_count: 1,
        tools: ["write"],
        tools_truncated: 0,
      };
    },
  ],
  ["second model call", (events) => events.splice(5, 0, { type: "model.call_start", data: {} })],
  ["missing model completion", (events) => events.splice(5, 1)],
  [
    "failed model completion",
    (events) => {
      events[5].data.outcome = "error";
    },
  ],
  [
    "unmatched answer model",
    (events) => {
      events[6].data.model = "unobserved-model";
    },
  ],
  [
    "unmatched result model",
    (events) => {
      events[7].data.model = "unobserved-model";
    },
  ],
  [
    "out-of-order completion",
    (events) => {
      const [completed] = events.splice(5, 1);
      events.splice(4, 0, completed);
    },
  ],
  [
    "unknown tool update",
    (events) => {
      events.splice(2, 0, {
        type: "session.tools_updated",
        data: { model: "synthetic-model", tools: ["write"] },
      });
    },
  ],
  [
    "inventory for a different model",
    (events) => {
      events[8].data.promptCacheBreakState[0].models = {
        other: { tool_count: 0, tools: [], tools_truncated: 0 },
      };
    },
  ],
  [
    "inventory only before the call",
    (events) => {
      const [checkpoint] = events.splice(8, 1);
      events.splice(3, 0, checkpoint);
    },
  ],
  [
    "built-in edit classifier",
    (events) => {
      events[5].data.containsBuiltInFileEditRequest = true;
    },
  ],
  [
    "loaded MCP",
    (events) => {
      events[2].data.servers = ["synthetic-server"];
    },
  ],
  [
    "loaded extension",
    (events) => {
      events[1].data.extensions = ["synthetic-extension"];
    },
  ],
  ["missing MCP metadata", (events) => events.splice(2, 1)],
  [
    "changed request",
    (events) => {
      events[3].data.content = "different packet";
    },
  ],
  [
    "missing transformed input",
    (events) => {
      delete events[3].data.transformedContent;
    },
  ],
  [
    "untransformed-content fallback",
    (events) => {
      events[3].data.transformedContent = request;
    },
  ],
  [
    "unrecognized input prefix",
    (events) => {
      events[3].data.transformedContent = `unrecognized synthetic context\n${events[3].data.transformedContent}`;
    },
  ],
  [
    "unrecognized input suffix",
    (events) => {
      events[3].data.transformedContent += "\nadditional synthetic context";
    },
  ],
  [
    "changed transformed request",
    (events) => {
      events[3].data.transformedContent = events[3].data.transformedContent.replace(
        request,
        "different synthetic input",
      );
    },
  ],
  [
    "missing native input timestamp",
    (events) => {
      delete events[3].timestamp;
    },
  ],
  [
    "different native input timestamp",
    (events) => {
      events[3].timestamp = "2026-09-02T09:00:01.000Z";
    },
  ],
  [
    "invalid clock envelope",
    (events) => {
      events[3].data.transformedContent = events[3].data.transformedContent.replace(
        "2026-09-02",
        "2026-99-02",
      );
    },
  ],
  [
    "additional input attachments",
    (events) => {
      events[3].data.attachments = [{ type: "file", name: "synthetic-unapproved-context" }];
    },
  ],
  [
    "multiple user turns",
    (events) => events.splice(4, 0, { type: "user.message", data: { content: request } }),
  ],
  [
    "wrong session",
    (events) => {
      events.at(-1).sessionId = "00000000-0000-4000-8000-000000000002";
    },
  ],
  ["partial stream", (events) => events.pop()],
  [
    "unsuccessful native result",
    (events) => {
      events.at(-1).exitCode = 1;
    },
  ],
  ["events after result", (events) => events.push({ type: "assistant.idle", data: {} })],
  ["resumed session", (events) => events.splice(1, 0, { type: "session.resume", data: {} })],
  [
    "new unsupported event",
    (events) => events.splice(1, 0, { type: "future.unrecognized", data: {} }),
  ],
  [
    "zero-tool refusal remains failure",
    (events) => {
      events[6].data.content = "UNSAFE_TOOL_BOUNDARY";
    },
  ],
]) {
  test(`native verifier rejects ${label}`, () => {
    const events = nativeEvents();
    mutate(events);
    assert.throws(() => verify(events), { code: "AP_REVIEW_NATIVE_BOUNDARY_REJECTED" });
  });
}

test("model self-report, malformed JSON, and failed process cannot substitute for native evidence", () => {
  assert.throws(() => verify([], { stdout: '{"effectiveTools":[],"toolCalls":0}\n' }));
  assert.throws(() => verify([], { stdout: "not JSON" }));
  assert.throws(() => verify(nativeEvents(), { exitCode: 1 }));
  assert.throws(() => verify(nativeEvents(), { startedAt: undefined }));
  assert.throws(() => verify(nativeEvents(), { completedAt: "2026-09-02T08:59:59.000Z" }));
  assert.throws(() => verify(nativeEvents(), { startedAt: "2026-09-02T09:00:01.000Z" }));
  assert.throws(() => verify(nativeEvents(), { startedAt: "2026-09-02T08:00:00.000Z" }));
});

test("fixed native runner preserves a refused capture and cannot reuse it", async (t) => {
  const priorToken = process.env.COPILOT_GITHUB_TOKEN;
  process.env.COPILOT_GITHUB_TOKEN = "synthetic-native-auth";
  t.after(() => {
    if (priorToken === undefined) delete process.env.COPILOT_GITHUB_TOKEN;
    else process.env.COPILOT_GITHUB_TOKEN = priorToken;
  });
  const root = await mkdtemp(join(tmpdir(), "agentproof-runtime-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const executable = join(root, "synthetic-executable");
  await writeFile(executable, "SYNTHETIC EXECUTABLE FIXTURE, NEVER EXECUTED");
  const options = {
    executable,
    executableSha256: sha256(await readFile(executable)),
    captureDirectory: join(root, "refused"),
    specialist: "test",
    sessionId: SESSION_ID,
    request,
  };
  const calls = [];
  const execute = async (command, args, processOptions) => {
    calls.push(args);
    assert.equal(command, executable);
    assert.notEqual(processOptions.cwd, root);
    assert.equal(processOptions.env.COPILOT_HOME, processOptions.env.USERPROFILE);
    return args.includes("--version")
      ? { exitCode: 0, stdout: `GitHub Copilot CLI ${SUPPORTED_COPILOT_VERSION}.\n` }
      : {
          exitCode: 0,
          stdout: nativeJsonl(
            nativeEvents(request, "UNSAFE_TOOL_BOUNDARY", new Date().toISOString()),
          ),
        };
  };
  await assert.rejects(runCopilotPublicPacket(options, execute), {
    code: "AP_REVIEW_NATIVE_BOUNDARY_REJECTED",
  });
  const receipt = JSON.parse(
    await readFile(join(options.captureDirectory, "runtime-receipt.json"), "utf8"),
  );
  assert.equal(receipt.status, "blocked");
  assert.equal(receipt.cliVersion, SUPPORTED_COPILOT_VERSION);
  assert.equal(receipt.processExitCode, 0);
  assert.match(receipt.stdoutSha256, /^[0-9a-f]{64}$/u);
  assert.match(
    await readFile(join(options.captureDirectory, "native.jsonl"), "utf8"),
    /UNSAFE_TOOL_BOUNDARY/u,
  );
  assert.equal(calls.length, 2);
  await assert.rejects(
    runCopilotPublicPacket(
      {
        ...options,
        request: "\\".repeat(MAX_REVIEW_REQUEST_BYTES),
      },
      execute,
    ),
    { code: "AP_REVIEW_REQUEST_INVALID" },
  );
  await assert.rejects(runCopilotPublicPacket(options, execute), { code: "EEXIST" });
  assert.equal(calls.length, 2);
  await assert.rejects(
    runCopilotPublicPacket({ ...options, executableSha256: "0".repeat(64) }, execute),
    { code: "AP_REVIEW_RUNTIME_UNPINNED" },
  );
  delete process.env.COPILOT_GITHUB_TOKEN;
  const noAuth = { ...options, captureDirectory: join(root, "no-auth") };
  await assert.rejects(runCopilotPublicPacket(noAuth, execute), {
    code: "AP_REVIEW_RUNTIME_AUTH_MISSING",
  });
  const blocked = JSON.parse(
    await readFile(join(noAuth.captureDirectory, "runtime-receipt.json"), "utf8"),
  );
  assert.equal(blocked.cliVersion, null);
  assert.equal(blocked.expectedCliVersion, SUPPORTED_COPILOT_VERSION);
  assert.equal(calls.length, 2);
});

test("a temporary workspace inside any checkout blocks before native execution", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "agentproof-ancestor-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const checkout = join(root, "synthetic-checkout");
  await mkdir(checkout);
  await writeFile(join(checkout, ".git"), "SYNTHETIC CHECKOUT MARKER");
  const executable = join(root, "synthetic-executable");
  await writeFile(executable, "SYNTHETIC EXECUTABLE FIXTURE, NEVER EXECUTED");
  const saved = new Map(["TMPDIR", "TEMP", "TMP"].map((key) => [key, process.env[key]]));
  t.after(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  for (const key of saved.keys()) process.env[key] = checkout;
  await assert.rejects(
    runCopilotPublicPacket(
      {
        executable,
        executableSha256: sha256(await readFile(executable)),
        captureDirectory: join(root, "capture"),
        specialist: "test",
        sessionId: SESSION_ID,
        request,
      },
      async () => assert.fail("An inherited checkout must block before native execution"),
    ),
    {
      code: "AP_REVIEW_WORKSPACE_UNSAFE",
    },
  );
});
