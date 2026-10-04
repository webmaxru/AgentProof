import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { sha256 } from "@agentproof/evidence-core";
import { SESSION_ID } from "./public-review-fixtures.mjs";
import {
  fakeProtocolChild,
  protocolStateFixture,
  sessionEvent,
  stateFixtureChild,
} from "./public-review-protocol-fixtures.mjs";
import { encodeProtocolMessage } from "./public-review-protocol-transport.mjs";
import { cleanupOwnedRuntime } from "./public-review-cleanup.mjs";
import {
  MAX_CONNECT_DIAGNOSTICS_BYTES,
  MAX_AUTH_DIAGNOSTICS_BYTES,
  observeCopilotProtocol3Auth,
  observeCopilotProtocol3Connect,
  observeCopilotProtocol3State,
  projectConnectResponse,
  projectAuthResponse,
} from "./public-review-protocol.mjs";

async function setup(t) {
  const root = await mkdtemp(join(tmpdir(), "agentproof-protocol-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const profile = await readFile(
    new URL("../agents/agentproof-test-reviewer.agent.md", import.meta.url),
    "utf8",
  );
  return {
    root,
    profile,
    options: {
      executable: process.execPath,
      executableSha256: sha256(await readFile(process.execPath)),
      profileSha256: sha256(profile),
      captureDirectory: join(root, "capture"),
      specialist: "test",
      sessionId: SESSION_ID,
      expectedLogin: "fixture-operator",
    },
    dependencies: {
      temporaryParent: root,
      inheritedEnvironment: {
        COPILOT_GITHUB_TOKEN: "synthetic-fixture-native-auth",
        GH_TOKEN: "synthetic-omitted",
        GITHUB_TOKEN: "synthetic-omitted",
        COPILOT_PROVIDER_BASE_URL: "https://example.invalid",
        COPILOT_ALLOW_ALL: "true",
      },
    },
  };
}

test("documented initialized state remains state-only and cannot stand in for model inventory", async (t) => {
  const { root, profile, options, dependencies } = await setup(t);
  const child = stateFixtureChild();
  let launch;
  const receipt = await observeCopilotProtocol3State(options, {
    ...dependencies,
    spawnNative: (executable, args, processOptions) => {
      assert.equal(processOptions.cwd, realpathSync(processOptions.cwd));
      launch = { executable, args, processOptions };
      return child;
    },
  });
  assert.equal(receipt.status, "state-only-observed-review-blocked");
  assert.equal(receipt.modelInventoryStatus, "unknown");
  assert.equal(receipt.reviewStatus, "blocked");
  assert.equal(receipt.native.exitObserved, true);
  assert.equal(receipt.cleanup.status, "removed-after-exit");
  assert.equal(receipt.state.selectedProfile.authoredPromptSha256.length, 64);
  assert.deepEqual(receipt.state.mcpServers, [
    { name: "github-mcp-server", status: "disabled" },
    { name: "githubiq", status: "disabled" },
  ]);
  assert.deepEqual(receipt.state.initializedToolCatalog, []);
  assert.equal(receipt.native.requestMethods.includes("session.send"), false);
  assert.equal(receipt.events.userMessages, 0);
  assert.equal(receipt.events.modelEvents, 0);
  assert.equal(receipt.events.toolOrPermissionEvents, 0);
  const create = child.messages.find((message) => message.method === "session.create").params;
  for (const name of [
    "enableConfigDiscovery",
    "enableFileHooks",
    "enableSkills",
    "hooks",
    "requestUserInput",
    "requestElicitation",
    "enableHostGitOperations",
    "enableSessionStore",
  ])
    assert.equal(create[name], false, name);
  assert.deepEqual(create.tools, []);
  assert.deepEqual(create.availableTools, []);
  assert.equal(create.toolFilterPrecedence, "excluded");
  assert.equal(create.remoteSession, "off");
  assert.equal(create.model, undefined);
  assert.equal(create.gitHubToken, undefined);
  assert.deepEqual(create.customAgents[0].tools, []);
  assert.equal(create.customAgents[0].infer, false);
  for (const name of [
    "GH_TOKEN",
    "GITHUB_TOKEN",
    "COPILOT_PROVIDER_BASE_URL",
    "COPILOT_ALLOW_ALL",
  ]) {
    assert.equal(launch.processOptions.env[name], undefined);
  }
  assert.equal(launch.processOptions.env.COPILOT_DISABLE_KEYTAR, "1");
  assert.ok(launch.args.includes("--stdio"));
  assert.ok(launch.args.includes("--disable-builtin-mcps"));
  const files = await readdir(options.captureDirectory);
  assert.deepEqual(files, ["protocol-state-receipt.json"]);
  const saved = await readFile(join(options.captureDirectory, files[0]), "utf8");
  assert.ok(!saved.includes("synthetic-fixture-native-auth"));
  assert.ok(!saved.includes(profile));
  assert.ok(!saved.includes(create.customAgents[0].prompt));
  assert.deepEqual((await readdir(root)).sort(), ["capture"]);
});

for (const [label, mutate] of [
  [
    "uninitialized catalog",
    (fixture) => {
      fixture["session.tools.getCurrentMetadata"].tools = null;
    },
  ],
  [
    "missing catalog",
    (fixture) => {
      delete fixture["session.tools.getCurrentMetadata"].tools;
    },
  ],
  [
    "nonempty actual catalog",
    (fixture) => {
      fixture["session.tools.getCurrentMetadata"].tools = [{ name: "sql" }];
    },
  ],
  [
    "missing MCP host",
    (fixture) => {
      delete fixture["session.mcp.list"].host;
    },
  ],
  [
    "active MCP",
    (fixture) => {
      fixture["session.mcp.list"].servers[0].status = "connected";
    },
  ],
  [
    "unknown MCP",
    (fixture) => {
      fixture["session.mcp.list"].servers[0].status = "unknown";
    },
  ],
  [
    "pending MCP",
    (fixture) => {
      fixture["session.mcp.list"].host.pendingConnections = ["githubiq"];
    },
  ],
  [
    "MCP auth pending",
    (fixture) => {
      fixture["session.mcp.list"].host.needsAuthServers = { githubiq: { timestamp: 1 } };
    },
  ],
  [
    "missing extensions",
    (fixture) => {
      delete fixture["session.extensions.list"].extensions;
    },
  ],
  [
    "active extension",
    (fixture) => {
      fixture["session.extensions.list"].extensions = [
        { id: "session:fixture", name: "fixture", source: "session", status: "running" },
      ];
    },
  ],
  [
    "loaded skill",
    (fixture) => {
      fixture["session.skills.list"].skills = [{ name: "fixture" }];
    },
  ],
  [
    "wrong login",
    (fixture) => {
      fixture["auth.getStatus"].login = "different-fixture";
    },
  ],
  [
    "missing authentication",
    (fixture) => {
      delete fixture["auth.getStatus"].isAuthenticated;
    },
  ],
  [
    "wrong host",
    (fixture) => {
      fixture["auth.getStatus"].host = "https://example.invalid";
    },
  ],
  [
    "inherited authentication",
    (fixture) => {
      fixture["auth.getStatus"].authType = "gh-cli";
    },
  ],
  [
    "protocol downgrade",
    (fixture) => {
      fixture.connect.protocolVersion = 2;
    },
  ],
  [
    "version drift",
    (fixture) => {
      fixture["status.get"].version = "1.0.92-4";
    },
  ],
  [
    "cursor expiry is not an empty catalog",
    (fixture) => {
      fixture["session.tools.getCurrentMetadata"].cursorStatus = "expired";
    },
  ],
  [
    "truncated MCP status",
    (fixture) => {
      fixture["session.mcp.list"].servers[0].truncated = true;
    },
  ],
  [
    "missing explicit MCP disabled list",
    (fixture) => {
      delete fixture["session.mcp.list"].host.disabledServers;
    },
  ],
  [
    "disagreeing MCP inventories",
    (fixture) => {
      fixture["session.mcp.list"].host.disabledServers = [];
    },
  ],
  [
    "failed extension",
    (fixture) => {
      fixture["session.extensions.list"].extensions = [
        { id: "session:fixture", name: "fixture", source: "session", status: "failed" },
      ];
    },
  ],
  [
    "starting extension",
    (fixture) => {
      fixture["session.extensions.list"].extensions = [
        { id: "session:fixture", name: "fixture", source: "session", status: "starting" },
      ];
    },
  ],
]) {
  test(`${label} blocks without a model request and preserves a sanitized failure`, async (t) => {
    const { options, dependencies } = await setup(t);
    const fixture = protocolStateFixture();
    mutate(fixture);
    const child = stateFixtureChild(fixture);
    await assert.rejects(
      observeCopilotProtocol3State(options, {
        ...dependencies,
        spawnNative: () => child,
      }),
    );
    const receipt = JSON.parse(
      await readFile(join(options.captureDirectory, "protocol-state-receipt.json")),
    );
    assert.equal(receipt.status, "blocked");
    assert.equal(receipt.reviewStatus, "blocked");
    assert.equal(receipt.modelInventoryStatus, "unknown");
    assert.ok(receipt.errorCode);
    assert.equal(receipt.native.exitObserved, true);
    assert.equal(
      child.messages.some((message) => message.method === "session.send"),
      false,
    );
  });
}

for (const change of ["selection", "authored bytes", "authored tools", "missing authored prompt"]) {
  test(`${change} cannot satisfy native profile binding`, async (t) => {
    const { options, dependencies } = await setup(t);
    const child = stateFixtureChild(undefined, (message, result) => {
      if (message.method === "session.agent.getCurrent" && change === "selection") {
        result.agent.name = "different";
      }
      if (message.method === "session.agent.list") {
        if (change === "authored bytes") result.agents[0].prompt += "\nchanged";
        if (change === "authored tools") result.agents[0].tools = ["sql"];
        if (change === "missing authored prompt") delete result.agents[0].prompt;
      }
      return result;
    });
    await assert.rejects(
      observeCopilotProtocol3State(options, {
        ...dependencies,
        spawnNative: () => child,
      }),
    );
  });
}

for (const response of [
  "UNSAFE_TOOL_BOUNDARY",
  "PUBLIC_PACKET_REJECTED",
  "```json\n{}\n```\nSummary: PUBLIC_PACKET_REJECTED",
  '```json\n{"note":"PUBLIC_PACKET_\\u0052EJECTED"}\n```\nSummary: Fixture.',
]) {
  test(`any assistant response is blocked in state-only mode, including refusal ${response.slice(0, 28)}`, async (t) => {
    const { options, dependencies } = await setup(t);
    const child = stateFixtureChild(undefined, (message, result, native) => {
      if (message.method === "session.tools.initializeAndValidate") {
        native.stdout.write(
          encodeProtocolMessage(
            sessionEvent(SESSION_ID, "assistant.message", {
              content: response,
              messageId: "fixture-answer",
              toolRequests: [],
            }),
          ),
        );
      }
      return result;
    });
    await assert.rejects(
      observeCopilotProtocol3State(options, {
        ...dependencies,
        spawnNative: () => child,
      }),
    );
    const receipt = JSON.parse(
      await readFile(join(options.captureDirectory, "protocol-state-receipt.json")),
    );
    assert.equal(receipt.events.modelEvents, 1);
    assert.ok(!JSON.stringify(receipt).includes(response));
  });
}

test("public review input, model overrides, and bad pins are rejected before launch", async (t) => {
  for (const extra of [
    { request: "public request still forbidden" },
    { model: "must-not-override" },
    { profileSha256: "0".repeat(64) },
    { executableSha256: "0".repeat(64) },
  ]) {
    const { options, dependencies } = await setup(t);
    await assert.rejects(
      observeCopilotProtocol3State(
        { ...options, ...extra },
        {
          ...dependencies,
          spawnNative: () => assert.fail("must not launch"),
        },
      ),
    );
  }
});

test("the state adapter checks physical ancestors and never reuses an existing capture", async (t) => {
  const { root, options, dependencies } = await setup(t);
  const checkout = join(root, "checkout");
  const nested = join(checkout, "nested");
  const alias = join(root, "alias");
  await mkdir(join(checkout, ".git"), { recursive: true });
  await mkdir(nested);
  await symlink(nested, alias, process.platform === "win32" ? "junction" : "dir");
  try {
    await assert.rejects(
      observeCopilotProtocol3State(options, {
        ...dependencies,
        temporaryParent: alias,
        spawnNative: () => assert.fail("must not launch inside a checkout"),
      }),
    );
  } finally {
    await unlink(alias);
  }
  const preserved = await readFile(join(options.captureDirectory, "protocol-state-receipt.json"));
  await assert.rejects(
    observeCopilotProtocol3State(options, {
      ...dependencies,
      spawnNative: () => assert.fail("must not reuse capture"),
    }),
  );
  assert.deepEqual(
    await readFile(join(options.captureDirectory, "protocol-state-receipt.json")),
    preserved,
  );
});

test("native initialization notifications arrive before create response and retain only allowlisted facts", async (t) => {
  const { options, dependencies } = await setup(t);
  const sentinel = "synthetic-private-info-not-for-receipt";
  const fixture = protocolStateFixture();
  fixture["session.extensions.list"].extensions = [
    {
      id: "session:fixture-disabled",
      name: "fixture-disabled",
      source: "session",
      status: "disabled",
    },
  ];
  const child = stateFixtureChild(fixture, (message, result, native) => {
    if (message.method === "session.create") {
      for (const [type, data] of [
        ["session.extensions_loaded", fixture["session.extensions.list"]],
        ["session.mcp_servers_loaded", { servers: fixture["session.mcp.list"].servers }],
        ["session.skills_loaded", { skills: [] }],
        [
          "subagent.selected",
          { agentName: message.params.agent, agentDisplayName: message.params.agent, tools: [] },
        ],
        [
          "session.usage_checkpoint",
          {
            totalNanoAiu: 0,
            totalPremiumRequests: 0,
            promptCacheBreakState: [],
            modelCacheState: [],
          },
        ],
        ["session.info", { infoType: "fixture", message: sentinel }],
      ]) {
        const event = sessionEvent(SESSION_ID, type, data);
        event.params.event.ephemeral = true;
        native.stdout.write(encodeProtocolMessage(event));
      }
    }
    return result;
  });
  const receipt = await observeCopilotProtocol3State(options, {
    ...dependencies,
    spawnNative: () => child,
  });
  assert.equal(receipt.events.selectedEvents, 1);
  assert.equal(receipt.state.extensions[0].status, "disabled");
  assert.ok(!JSON.stringify(receipt).includes(sentinel));
  assert.ok(!JSON.stringify(receipt).includes("fixture-disabled"));
  assert.equal(receipt.modelInventoryStatus, "unknown");
});

for (const [label, event] of [
  [
    "unsupported usage shape",
    () =>
      sessionEvent(SESSION_ID, "session.usage_checkpoint", {
        totalNanoAiu: 0,
        promptCacheBreakState: {},
      }),
  ],
  [
    "opaque populated cache",
    () =>
      sessionEvent(SESSION_ID, "session.usage_checkpoint", {
        totalNanoAiu: 0,
        promptCacheBreakState: ["synthetic-opaque-value"],
      }),
  ],
  [
    "nonzero usage",
    () => sessionEvent(SESSION_ID, "session.usage_checkpoint", { totalNanoAiu: 1 }),
  ],
  ["permission event", () => sessionEvent(SESSION_ID, "permission.requested", {})],
  ["tool event", () => sessionEvent(SESSION_ID, "tool.execution_start", {})],
  ["elicitation event", () => sessionEvent(SESSION_ID, "elicitation.request", {})],
  [
    "user message",
    () => sessionEvent(SESSION_ID, "user.message", { content: "No user message is authorized." }),
  ],
  [
    "different session",
    () =>
      sessionEvent("22222222-2222-4222-8222-222222222222", "session.info", {
        infoType: "fixture",
        message: "fixture",
      }),
  ],
  [
    "expired event clock",
    () => {
      const value = sessionEvent(SESSION_ID, "session.info", {
        infoType: "fixture",
        message: "fixture",
      });
      value.params.event.timestamp = "2000-01-01T00:00:00.000Z";
      return value;
    },
  ],
]) {
  test(`${label} blocks, without inspecting an internal prompt`, async (t) => {
    const { options, dependencies } = await setup(t);
    const child = stateFixtureChild(undefined, (message, result, native) => {
      if (message.method === "session.create") native.stdout.write(encodeProtocolMessage(event()));
      return result;
    });
    await assert.rejects(
      observeCopilotProtocol3State(options, { ...dependencies, spawnNative: () => child }),
    );
    const saved = await readFile(
      join(options.captureDirectory, "protocol-state-receipt.json"),
      "utf8",
    );
    assert.ok(!saved.includes("synthetic-opaque-value"));
    assert.equal(JSON.parse(saved).status, "blocked");
  });
}

test("unknown profile fields and changed second snapshot cannot pass native binding", async (t) => {
  for (const mode of ["cursor", "changed"]) {
    const { options, dependencies } = await setup(t);
    let reads = 0;
    const child = stateFixtureChild(undefined, (message, result) => {
      if (message.method === "session.agent.getCurrent") {
        reads++;
        if (mode === "cursor") result.agent.cursorExpired = true;
        if (mode === "changed" && reads === 2) result.agent.description += " changed";
      }
      return result;
    });
    await assert.rejects(
      observeCopilotProtocol3State(options, { ...dependencies, spawnNative: () => child }),
    );
  }
});

test("unconfirmed native exit retains only owned runtime paths and reports blocked cleanup", async (t) => {
  const { root, options, dependencies } = await setup(t);
  const child = stateFixtureChild();
  child.complete = () => {};
  await assert.rejects(
    observeCopilotProtocol3State(options, {
      ...dependencies,
      timeoutMs: 30,
      spawnNative: () => child,
    }),
  );
  const receipt = JSON.parse(
    await readFile(join(options.captureDirectory, "protocol-state-receipt.json"), "utf8"),
  );
  assert.equal(receipt.cleanup.status, "retained-unconfirmed-exit");
  assert.equal(receipt.native.exitObserved, false);
  assert.ok((await readdir(root)).includes(receipt.cleanup.directoryName));
  child.emit("exit", null, "SIGKILL");
  child.emit("close");
});

function projectionFor(message) {
  const frame = encodeProtocolMessage(message);
  return projectConnectResponse(
    message,
    {
      rawResponseBytes: frame.length,
      rawResponseSha256: sha256(frame),
    },
    1,
  );
}

test("connect projection preserves only fixed key names/types, numeric fields, and safe version syntax", () => {
  const secret = "synthetic-private-value";
  const result = {
    ok: true,
    protocolVersion: 3,
    version: `1.0.92-${secret}`,
    taskKinds: [secret, { nested: secret }],
    [`Authorization ${secret}`]: secret,
    ["malformed\nprivate-key"]: secret,
    ["__proto__"]: { secret },
  };
  const projection = projectionFor({
    jsonrpc: "2.0",
    id: 1,
    result,
    [`private-envelope-${secret}`]: secret,
  });
  const saved = JSON.stringify(projection);
  assert.ok(Buffer.byteLength(saved) <= MAX_CONNECT_DIAGNOSTICS_BYTES);
  for (const value of [secret, "Authorization", "private-key", "__proto__", "private-envelope"]) {
    assert.ok(!saved.includes(value));
  }
  assert.equal(projection.envelope.redactedKeyCount, 1);
  assert.equal(projection.result.redactedKeyCount, 3);
  assert.equal(projection.resultPresent, true);
  assert.equal(projection.errorPresent, false);
  assert.equal(projection.protocolVersion, 3);
  assert.equal(projection.pinnedVersionMatches, false);
  assert.equal(projection.version, undefined);
  assert.deepEqual(projection.taskKinds, { present: true, type: "array", count: 2 });
  assert.deepEqual(projection.failedPredicates, [
    "response_keys",
    "result_shape",
    "pinned_cli_version",
    "task_kinds_published_type",
  ]);
});

test("connect diagnostics distinguish missing, null, and numeric fields without inventing zero", () => {
  for (const protocolVersion of [undefined, null, "3", 4, 3.5, Infinity]) {
    const result = { ok: true, version: "1.0.92-3" };
    if (protocolVersion !== undefined) result.protocolVersion = protocolVersion;
    const message = { jsonrpc: "2.0", id: 1, result };
    const projection = projectConnectResponse(
      message,
      {
        rawResponseBytes: 50,
        rawResponseSha256: "0".repeat(64),
      },
      1,
    );
    assert.equal(projection.predicates.protocol_version_3, false);
    assert.deepEqual(projection.taskKinds, { present: false, type: "missing" });
    assert.equal(
      projection.protocolVersion,
      [4, 3.5].includes(protocolVersion) ? protocolVersion : undefined,
    );
    assert.equal(projection.version, "1.0.92-3");
    assert.equal(projection.pinnedVersionMatches, true);
  }
  const projection = projectionFor({
    jsonrpc: "2.0",
    id: 1,
    result: { ok: true, protocolVersion: 3, version: "1.0.92-4", taskKinds: null },
  });

  test("large private connect extras cannot expand the bounded persisted projection", () => {
    const result = { ...protocolStateFixture().connect };
    for (let index = 0; index < 2048; index++) {
      result[`synthetic-private-${index}-${"x".repeat(80)}`] = "y".repeat(80);
    }
    const projection = projectionFor({ jsonrpc: "2.0", id: 1, result });
    assert.equal(projection.result.redactedKeyCount, 2048);
    assert.ok(Buffer.byteLength(JSON.stringify(projection)) <= MAX_CONNECT_DIAGNOSTICS_BYTES);
    assert.ok(!JSON.stringify(projection).includes("synthetic-private"));
    assert.deepEqual(projection.failedPredicates, ["result_shape"]);
  });
  assert.equal(projection.version, "1.0.92-4");
  assert.deepEqual(projection.failedPredicates, [
    "pinned_cli_version",
    "task_kinds_published_type",
  ]);
  assert.deepEqual(projection.taskKinds, { present: true, type: "null" });
});

for (const [label, change, failed] of [
  ["unchanged valid result", () => {}, []],
  [
    "optional taskKinds absent",
    (result) => {
      delete result.taskKinds;
    },
    [],
  ],
  [
    "false ok",
    (result) => {
      result.ok = false;
    },
    ["ok_true"],
  ],
  [
    "missing required key",
    (result) => {
      delete result.ok;
    },
    ["result_shape", "ok_true"],
  ],
  [
    "wrong protocol",
    (result) => {
      result.protocolVersion = 2;
    },
    ["protocol_version_3"],
  ],
  [
    "wrong version",
    (result) => {
      result.version = "1.0.92-4";
    },
    ["pinned_cli_version"],
  ],
  [
    "unknown task kind",
    (result) => {
      result.taskKinds = ["synthetic-private-kind"];
    },
    ["task_kinds_published_type"],
  ],
  [
    "unknown private result key",
    (result) => {
      result["synthetic-private-key"] = "synthetic-private-value";
    },
    ["result_shape"],
  ],
  ...[["agent"], ["shell"], ["client"], ["agent", "shell", "client"], ["agent", "agent"]].map(
    (kinds) => [
      `published task kinds ${kinds.join(",")}`,
      (result) => {
        result.taskKinds = kinds;
      },
      [],
    ],
  ),
  ...[
    null,
    "agent",
    {},
    0,
    [null],
    [0],
    [{}],
    [[]],
    ["Agent"],
    ["agent "],
    ["agent", "synthetic-private-kind"],
  ].map((kinds, index) => [
    `malformed task kinds ${index}`,
    (result) => {
      result.taskKinds = kinds;
    },
    ["task_kinds_published_type"],
  ]),
]) {
  test(`connect-only ${label} enforces the public contract and sends exactly one request`, async (t) => {
    const { root, options, dependencies } = await setup(t);
    const fixture = protocolStateFixture();
    change(fixture.connect);
    const child = stateFixtureChild(fixture);
    const operation = observeCopilotProtocol3Connect(options, {
      ...dependencies,
      spawnNative: () => child,
    });
    if (failed.length) await assert.rejects(operation);
    else await operation;
    const saved = await readFile(
      join(options.captureDirectory, "protocol-connect-receipt.json"),
      "utf8",
    );
    const receipt = JSON.parse(saved);
    assert.deepEqual(receipt.connect.failedPredicates, failed);
    assert.equal(
      receipt.status,
      failed.length ? "blocked" : "connect-only-observed-review-blocked",
    );
    assert.equal(receipt.nativeSessionId, undefined);
    assert.equal(receipt.auth, undefined);
    assert.equal(receipt.state, undefined);
    assert.equal(receipt.modelInventoryStatus, "unknown");
    assert.equal(receipt.reviewStatus, "blocked");
    assert.deepEqual(
      child.messages.map((message) => message.method),
      ["connect"],
    );
    assert.deepEqual(child.messages[0].params, {
      enableGitHubTelemetryForwarding: false,
      supportedTaskKinds: [],
    });
    assert.equal(receipt.native.requestCount, 1);
    assert.equal(receipt.native.shutdownAcknowledged, false);
    assert.equal(receipt.native.exitObserved, true);
    assert.equal(receipt.native.streamsClosed, true);
    assert.equal(receipt.cleanup.status, "removed-after-exit");
    assert.deepEqual(await readdir(root), ["capture"]);
    assert.ok(!saved.includes("synthetic-private"));
  });
}

test("native error and malformed-envelope diagnostics never persist error contents or private keys", async (t) => {
  const secret = "synthetic-private-error";
  for (const kind of ["error", "extra-envelope", "ambiguous", "private-id"]) {
    const { options, dependencies } = await setup(t);
    const frame = encodeProtocolMessage(
      kind === "error"
        ? {
            jsonrpc: "2.0",
            id: 1,
            error: { code: -32601, message: secret, data: { secret }, [secret]: secret },
          }
        : kind === "extra-envelope"
          ? { jsonrpc: "2.0", id: 1, result: protocolStateFixture().connect, [secret]: secret }
          : kind === "ambiguous"
            ? { jsonrpc: "2.0", id: 1, result: {}, error: { code: -32602, message: secret } }
            : { jsonrpc: "2.0", id: secret, result: protocolStateFixture().connect },
    );
    const child = fakeProtocolChild((message, native) => native.stdout.write(frame));
    await assert.rejects(
      observeCopilotProtocol3Connect(options, { ...dependencies, spawnNative: () => child }),
    );
    const saved = await readFile(
      join(options.captureDirectory, "protocol-connect-receipt.json"),
      "utf8",
    );
    const receipt = JSON.parse(saved);
    assert.ok(!saved.includes(secret));
    assert.equal(receipt.connect.rawResponseSha256, sha256(frame));
    assert.equal(receipt.connect.rawResponseBytes, frame.length);
    assert.ok(receipt.connect.failedPredicates.length > 0);
    if (kind === "error") {
      assert.equal(receipt.connect.errorCode, -32601);
      assert.equal(receipt.connect.resultPresent, false);
      assert.equal(receipt.connect.errorPresent, true);
      assert.equal(receipt.connect.error.redactedKeyCount, 1);
    }
  }
});

test("connect-only launch uses the same sealed flags and environment policy as state-only", async (t) => {
  const launches = [];
  for (const operation of [
    observeCopilotProtocol3State,
    observeCopilotProtocol3Connect,
    observeCopilotProtocol3Auth,
  ]) {
    const { options, dependencies } = await setup(t);
    await operation(options, {
      ...dependencies,
      spawnNative: (executable, args, processOptions) => {
        launches.push({
          args,
          environmentKeys: Object.keys(processOptions.env).sort(),
          shell: processOptions.shell,
          stdio: processOptions.stdio,
        });
        return stateFixtureChild();
      },
    });
  }
  assert.deepEqual(launches[0], launches[1]);
  assert.deepEqual(launches[0], launches[2]);
});

function authProjectionFor(message) {
  const frame = encodeProtocolMessage(message);
  return projectAuthResponse(
    message,
    {
      rawResponseBytes: frame.length,
      rawResponseSha256: sha256(frame),
    },
    3,
    "fixture-operator",
  );
}

test("auth diagnostics omit private values and sensitive fields while preserving fixed types and predicates", () => {
  const secret = "synthetic-private-auth-value";
  const message = {
    jsonrpc: "2.0",
    id: 3,
    result: {
      isAuthenticated: true,
      login: secret,
      host: `https://${secret}.example.invalid`,
      authType: secret,
      statusMessage: secret,
      [secret]: secret,
      ["malformed\nprivate-key"]: secret,
      ["__proto__"]: { secret },
    },
    [secret]: secret,
  };
  const projection = authProjectionFor(message);
  const saved = JSON.stringify(projection);
  assert.ok(Buffer.byteLength(saved) <= MAX_AUTH_DIAGNOSTICS_BYTES);
  for (const value of [secret, "example.invalid", "private-key", "__proto__", "statusMessage"])
    assert.ok(!saved.includes(value));
  assert.equal(projection.result.redactedKeyCount, 3);
  assert.equal(projection.envelope.redactedKeyCount, 1);
  assert.equal(projection.isAuthenticated, true);
  assert.deepEqual(projection.login, { present: true, type: "string", exactExpectedMatch: false });
  assert.deepEqual(projection.host, {
    present: true,
    type: "string",
    allowedPublicHostMatch: false,
  });
  assert.deepEqual(projection.authType, {
    present: true,
    type: "string",
    allowedSetMatch: false,
    documentedSetAvailable: true,
    documentedSetMatch: false,
  });
  assert.deepEqual(projection.failedPredicates, [
    "response_keys",
    "result_shape",
    "exact_expected_login",
    "allowed_public_host",
    "allowed_credential_source",
  ]);
  assert.equal(projection.rawResponseSha256, sha256(encodeProtocolMessage(message)));
});

test("auth diagnostics distinguish public optional fields, stronger required proof, missing values, and false", () => {
  for (const value of [false, true, undefined, null, "true", 0]) {
    const result = value === undefined ? {} : { isAuthenticated: value };
    const projection = authProjectionFor({ jsonrpc: "2.0", id: 3, result });
    assert.equal(Object.hasOwn(projection, "isAuthenticated"), typeof value === "boolean");
    if (typeof value === "boolean") assert.equal(projection.isAuthenticated, value);
    assert.deepEqual(projection.login, {
      present: false,
      type: "missing",
      exactExpectedMatch: false,
    });
    assert.deepEqual(projection.host, {
      present: false,
      type: "missing",
      allowedPublicHostMatch: false,
    });
    assert.deepEqual(projection.documentedRequiredKeys, ["isAuthenticated"]);
    assert.deepEqual(
      projection.missingDocumentedRequiredKeys,
      value === undefined ? ["isAuthenticated"] : [],
    );
    assert.deepEqual(
      projection.missingResultKeys,
      value === undefined
        ? ["isAuthenticated", "login", "host", "authType"]
        : ["login", "host", "authType"],
    );
    assert.equal(projection.predicates.result_shape, false);
    assert.equal(projection.predicates.authenticated_true, value === true);
  }
});

test("large private auth extras remain redacted within the fixed projection ceiling", () => {
  const result = { ...protocolStateFixture()["auth.getStatus"] };
  for (let index = 0; index < 2048; index++)
    result[`synthetic-private-${index}-${"x".repeat(80)}`] = "y".repeat(80);
  const projection = authProjectionFor({ jsonrpc: "2.0", id: 3, result });
  assert.ok(Buffer.byteLength(JSON.stringify(projection)) <= MAX_AUTH_DIAGNOSTICS_BYTES);
  assert.ok(!JSON.stringify(projection).includes("synthetic-private"));
  assert.equal(projection.result.redactedKeyCount, 2048);
  assert.deepEqual(projection.failedPredicates, ["result_shape"]);
});

for (const [label, change, failed] of [
  ["unchanged allowed env source", () => {}, []],
  [
    "allowed token source",
    (result) => {
      result.authType = "token";
    },
    [],
  ],
  [
    "false authentication",
    (result) => {
      result.isAuthenticated = false;
    },
    ["authenticated_true"],
  ],
  [
    "wrong boolean type",
    (result) => {
      result.isAuthenticated = "true";
    },
    ["authenticated_true"],
  ],
  [
    "missing authenticated field",
    (result) => {
      delete result.isAuthenticated;
    },
    ["result_shape", "authenticated_true"],
  ],
  [
    "missing optional public login",
    (result) => {
      delete result.login;
    },
    ["result_shape", "exact_expected_login"],
  ],
  [
    "missing optional public host",
    (result) => {
      delete result.host;
    },
    ["result_shape", "allowed_public_host"],
  ],
  [
    "missing optional public auth type",
    (result) => {
      delete result.authType;
    },
    ["result_shape", "allowed_credential_source"],
  ],
  [
    "different login",
    (result) => {
      result.login = "synthetic-private-login";
    },
    ["exact_expected_login"],
  ],
  [
    "login case mismatch",
    (result) => {
      result.login = "Fixture-operator";
    },
    ["exact_expected_login"],
  ],
  [
    "private host",
    (result) => {
      result.host = "https://synthetic-private-tenant.example.invalid";
    },
    ["allowed_public_host"],
  ],
  [
    "unknown source",
    (result) => {
      result.authType = "synthetic-private-source";
    },
    ["allowed_credential_source"],
  ],
  [
    "unknown result key",
    (result) => {
      result["synthetic-private-key"] = "synthetic-private-value";
    },
    ["result_shape"],
  ],
  [
    "opaque optional status message",
    (result) => {
      result.statusMessage = { private: "synthetic-private-message" };
    },
    [],
  ],
  ...["user", "gh-cli", "hmac", "api-key"].map((type) => [
    `documented but disallowed ${type} source`,
    (result) => {
      result.authType = type;
    },
    ["allowed_credential_source"],
  ]),
]) {
  test(`auth-only ${label} keeps acceptance unchanged and stops after its three-RPC prefix`, async (t) => {
    const { root, options, dependencies } = await setup(t);
    const fixture = protocolStateFixture();
    change(fixture["auth.getStatus"]);
    const child = stateFixtureChild(fixture);
    const operation = observeCopilotProtocol3Auth(options, {
      ...dependencies,
      spawnNative: () => child,
    });
    if (failed.length) await assert.rejects(operation);
    else await operation;
    const saved = await readFile(
      join(options.captureDirectory, "protocol-auth-receipt.json"),
      "utf8",
    );
    const receipt = JSON.parse(saved);
    assert.equal(receipt.status, failed.length ? "blocked" : "auth-only-observed-review-blocked");
    assert.deepEqual(receipt.authStatus.failedPredicates, failed);
    assert.equal(receipt.modelInventoryStatus, "unknown");
    assert.equal(receipt.reviewStatus, "blocked");
    assert.equal(receipt.nativeSessionId, undefined);
    assert.equal(receipt.requestedSessionId, undefined);
    assert.equal(receipt.auth, undefined);
    assert.equal(receipt.state, undefined);
    assert.equal(receipt.native.requestCount, 3);
    assert.equal(receipt.native.responseCount, 3);
    assert.equal(receipt.native.shutdownAcknowledged, false);
    assert.equal(receipt.native.exitObserved, true);
    assert.equal(receipt.native.streamsClosed, true);
    assert.equal(receipt.events.sessionStarts, 0);
    assert.equal(receipt.events.userMessages, 0);
    assert.equal(receipt.events.modelEvents, 0);
    assert.equal(receipt.events.toolOrPermissionEvents, 0);
    assert.deepEqual(
      child.messages.map(({ method }) => method),
      ["connect", "status.get", "auth.getStatus"],
    );
    assert.deepEqual(
      child.messages.map(({ params }) => params),
      [{ enableGitHubTelemetryForwarding: false, supportedTaskKinds: [] }, {}, {}],
    );
    assert.equal(receipt.authStatus.authType.documentedSetAvailable, true);
    assert.equal(
      receipt.authStatus.authType.documentedSetMatch,
      ["user", "env", "gh-cli", "hmac", "api-key", "token"].includes(
        fixture["auth.getStatus"].authType,
      ),
    );
    assert.deepEqual(await readdir(root), ["capture"]);
    for (const value of [
      "synthetic-private",
      "fixture-operator",
      "Fixture-operator",
      "github.com",
      "statusMessage",
    ])
      assert.ok(!saved.includes(value));
  });
}

test("auth-only earlier guard failures stop the prefix without inventing an auth projection", async (t) => {
  for (const stage of ["connect", "status.get"]) {
    const { options, dependencies } = await setup(t);
    const fixture = protocolStateFixture();
    fixture[stage].protocolVersion = 2;
    const child = stateFixtureChild(fixture);
    await assert.rejects(
      observeCopilotProtocol3Auth(options, { ...dependencies, spawnNative: () => child }),
    );
    const receipt = JSON.parse(
      await readFile(join(options.captureDirectory, "protocol-auth-receipt.json"), "utf8"),
    );
    assert.equal(receipt.authStatus, undefined);
    assert.equal(receipt.status, "blocked");
    assert.deepEqual(
      child.messages.map(({ method }) => method),
      stage === "connect" ? ["connect"] : ["connect", "status.get"],
    );
  }
});

test("auth-only cannot borrow unrelated inherited credentials or skip the unchanged prelaunch guard", async (t) => {
  const { options, dependencies } = await setup(t);
  delete dependencies.inheritedEnvironment.COPILOT_GITHUB_TOKEN;
  await assert.rejects(
    observeCopilotProtocol3Auth(options, {
      ...dependencies,
      spawnNative: () => assert.fail("Missing explicit authentication must not launch the CLI."),
    }),
  );
  const receipt = JSON.parse(
    await readFile(join(options.captureDirectory, "protocol-auth-receipt.json"), "utf8"),
  );
  assert.equal(receipt.native, undefined);
  assert.equal(receipt.authStatus, undefined);
  assert.equal(receipt.status, "blocked");
  assert.equal(receipt.cleanup.status, "removed-without-launch");
});

test("auth-only native error and malformed response diagnostics never persist messages or private fields", async (t) => {
  const secret = "synthetic-private-auth-error";
  for (const kind of [
    "error",
    "extra-envelope",
    "ambiguous",
    "private-id",
    "oversize-error-code",
  ]) {
    const { options, dependencies } = await setup(t);
    const fixture = protocolStateFixture();
    const response =
      kind === "error" || kind === "oversize-error-code"
        ? {
            jsonrpc: "2.0",
            id: 3,
            error: {
              code: kind === "error" ? -32601 : Number.MAX_SAFE_INTEGER,
              message: secret,
              data: { secret },
              [secret]: secret,
            },
          }
        : kind === "extra-envelope"
          ? {
              jsonrpc: "2.0",
              id: 3,
              result: fixture["auth.getStatus"],
              [secret]: secret,
            }
          : kind === "ambiguous"
            ? {
                jsonrpc: "2.0",
                id: 3,
                result: fixture["auth.getStatus"],
                error: { code: -32602, message: secret },
              }
            : { jsonrpc: "2.0", id: secret, result: fixture["auth.getStatus"] };
    const frame = encodeProtocolMessage(response);
    const child = fakeProtocolChild((message, native) => {
      native.stdout.write(
        message.method === "auth.getStatus"
          ? frame
          : encodeProtocolMessage({
              jsonrpc: "2.0",
              id: message.id,
              result: fixture[message.method],
            }),
      );
    });
    await assert.rejects(
      observeCopilotProtocol3Auth(options, { ...dependencies, spawnNative: () => child }),
    );
    const saved = await readFile(
      join(options.captureDirectory, "protocol-auth-receipt.json"),
      "utf8",
    );
    const receipt = JSON.parse(saved);
    assert.ok(!saved.includes(secret));
    assert.ok(!saved.includes("fixture-operator"));
    assert.ok(!saved.includes("github.com"));
    assert.equal(receipt.authStatus.rawResponseBytes, frame.length);
    assert.equal(receipt.authStatus.rawResponseSha256, sha256(frame));
    assert.ok(receipt.authStatus.failedPredicates.length > 0);
    assert.equal(receipt.native.requestCount, 3);
    if (kind === "error") {
      assert.equal(receipt.authStatus.errorCode, -32601);
      assert.equal(receipt.authStatus.error.redactedKeyCount, 1);
      assert.deepEqual(receipt.authStatus.error.keys, [{ key: "code", type: "number" }]);
    } else if (kind === "oversize-error-code") {
      assert.equal(receipt.authStatus.errorCode, undefined);
      assert.equal(receipt.native.nativeRpcErrorCode, undefined);
    }
  }
});

test("published task metadata neither authorizes tasks nor substitutes for initialized tool state", async (t) => {
  for (const tools of [[], null, [{ name: "synthetic-tool" }]]) {
    const { options, dependencies } = await setup(t);
    const fixture = protocolStateFixture();
    fixture.connect.taskKinds = ["agent", "shell", "client"];
    fixture["session.tools.getCurrentMetadata"] = { tools };
    const child = stateFixtureChild(fixture);
    const operation = observeCopilotProtocol3State(options, {
      ...dependencies,
      spawnNative: () => child,
    });
    if (Array.isArray(tools) && tools.length === 0) await operation;
    else await assert.rejects(operation);
    const receipt = JSON.parse(
      await readFile(join(options.captureDirectory, "protocol-state-receipt.json"), "utf8"),
    );
    assert.deepEqual(receipt.connect.failedPredicates, []);
    assert.equal(receipt.connect.taskKinds.count, 3);
    assert.equal(receipt.modelInventoryStatus, "unknown");
    assert.equal(receipt.reviewStatus, "blocked");
    assert.equal(receipt.events.userMessages, 0);
    assert.equal(receipt.events.modelEvents, 0);
    assert.equal(receipt.events.toolOrPermissionEvents, 0);
    assert.ok(!child.messages.some(({ method }) => /task|send|resume/u.test(method)));
    assert.deepEqual(child.messages[0].params.supportedTaskKinds, []);
    assert.equal(
      receipt.status,
      tools?.length === 0 ? "state-only-observed-review-blocked" : "blocked",
    );
  }
});

const removedFixture = {
  removed: true,
  pathVerified: true,
  stage: "verify-removed",
  errorCode: null,
  worker: { exitObserved: true, streamsClosed: true },
};
const cleanupOptions = (remainingMilliseconds = () => 1000) => ({
  identity: { path: join(tmpdir(), "agentproof-protocol-state-Test99"), dev: "1", ino: "2" },
  nativeExitObserved: true,
  nativeStreamsClosed: true,
  noProcessStarted: false,
  remainingMilliseconds,
});
const failedRemovalFixture = (errorCode) => ({
  removed: false,
  pathVerified: true,
  stage: "remove",
  errorCode,
  worker: { exitObserved: true, streamsClosed: true },
});

test("cleanup retains each documented transient Windows failure and retries only once", async () => {
  for (const errorCode of ["EBUSY", "ENOTEMPTY", "EPERM"]) {
    let remaining = 1000;
    const received = [];
    const receipt = await cleanupOwnedRuntime(
      cleanupOptions(() => remaining),
      {
        platform: "win32",
        wait: async (milliseconds) => {
          assert.equal(milliseconds, 100);
          remaining -= milliseconds;
        },
        remove: async (identity, timeout) => {
          received.push({ identity, timeout });
          remaining -= 25;
          return received.length === 1 ? failedRemovalFixture(errorCode) : removedFixture;
        },
      },
    );
    assert.equal(receipt.status, "removed-after-retry");
    assert.equal(receipt.firstErrorCode, errorCode);
    assert.equal(receipt.errorCode, undefined);
    assert.deepEqual(
      receipt.attempts.map((attempt) => attempt.errorCode),
      [errorCode, null],
    );
    assert.deepEqual(
      received.map((call) => call.timeout),
      [1000, 875],
    );
    assert.strictEqual(received[0].identity, received[1].identity);
  }
});

test("non-transient, unknown, non-Windows, repeated, or unverified cleanup failures never loop", async () => {
  for (const [errorCode, platform, maxCalls] of [
    ["EACCES", "win32", 1],
    ["EMFILE", "win32", 1],
    ["ENFILE", "win32", 1],
    ["UNCLASSIFIED_FILESYSTEM_ERROR", "win32", 1],
    ["OWNED_PATH_CHANGED", "win32", 1],
    ["EPERM", "linux", 1],
    ["ENOTEMPTY", "win32", 2],
  ]) {
    let calls = 0;
    const receipt = await cleanupOwnedRuntime(cleanupOptions(), {
      platform,
      wait: async () => {},
      remove: async () => {
        calls++;
        return failedRemovalFixture(errorCode);
      },
    });
    assert.equal(calls, maxCalls);
    assert.equal(receipt.status, "failed");
    assert.equal(receipt.errorCode, errorCode);
    assert.equal(receipt.attempts.length, maxCalls);
  }
  const receipt = await cleanupOwnedRuntime(cleanupOptions(), {
    platform: "win32",
    wait: async () => assert.fail("Unverified removal must not retry."),
    remove: async () => ({ ...failedRemovalFixture("EPERM"), pathVerified: false }),
  });
  assert.equal(receipt.attempts.length, 1);
  assert.equal(receipt.status, "failed");
});

test("cleanup deadline is never reset and no new removal starts after the remaining budget", async () => {
  for (const remaining of [0, -1, NaN, Infinity]) {
    const receipt = await cleanupOwnedRuntime(
      cleanupOptions(() => remaining),
      {
        remove: async () => assert.fail("Expired or invalid budget must not remove."),
      },
    );
    assert.equal(receipt.errorCode, "CLEANUP_DEADLINE");
    assert.equal(receipt.attempts.length, 0);
  }
  let remaining = 150;
  const receipt = await cleanupOwnedRuntime(
    cleanupOptions(() => remaining),
    {
      platform: "win32",
      wait: async () => {
        remaining = 0;
      },
      remove: async () => failedRemovalFixture("EPERM"),
    },
  );
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.firstErrorCode, "EPERM");
  assert.equal(receipt.errorCode, "CLEANUP_DEADLINE");
  assert.equal(receipt.attempts.length, 1);
  const late = await cleanupOwnedRuntime(
    cleanupOptions(() => remaining),
    {
      remove: async () => assert.fail("Expired original deadline must not remove."),
    },
  );
  assert.equal(late.errorCode, "CLEANUP_DEADLINE");
  remaining = 50;
  const lateFailure = await cleanupOwnedRuntime(
    cleanupOptions(() => remaining),
    {
      remove: async () => {
        remaining = 0;
        return failedRemovalFixture("EPERM");
      },
    },
  );
  assert.equal(lateFailure.status, "failed");
  assert.equal(lateFailure.errorCode, "CLEANUP_DEADLINE");
  assert.equal(lateFailure.firstErrorCode, "EPERM");
  assert.equal(lateFailure.attempts[0].errorCode, "EPERM");
});

test("cleanup requires observed exit plus closed streams or an explicit never-started process", async () => {
  for (const facts of [
    { nativeExitObserved: false },
    { nativeStreamsClosed: false },
    { nativeExitObserved: undefined },
    { nativeStreamsClosed: undefined },
  ]) {
    const receipt = await cleanupOwnedRuntime(
      { ...cleanupOptions(), ...facts },
      {
        remove: async () => assert.fail("Unconfirmed native lifecycle must not remove."),
      },
    );
    assert.equal(receipt.errorCode, "CLEANUP_OWNERSHIP_UNVERIFIED");
    assert.equal(receipt.attempts.length, 0);
  }
  const receipt = await cleanupOwnedRuntime(
    {
      ...cleanupOptions(),
      noProcessStarted: true,
      nativeExitObserved: false,
      nativeStreamsClosed: false,
    },
    { remove: async () => removedFixture },
  );
  assert.equal(receipt.status, "removed-without-launch");
});

test("cleanup never persists malformed worker data, private keys, error text, or unknown error codes", async () => {
  for (const result of [
    { ...failedRemovalFixture("EPERM"), message: "synthetic-private-error" },
    { ...failedRemovalFixture("EPERM"), ["private\nkey"]: "synthetic-private-value" },
    failedRemovalFixture("synthetic-private-code"),
    { ...removedFixture, stage: "remove" },
    { ...removedFixture, removed: "synthetic-private-value" },
    { ...removedFixture, worker: { exitObserved: true, streamsClosed: false } },
    {
      ...removedFixture,
      worker: { exitObserved: true, streamsClosed: true, private: "synthetic-private-value" },
    },
    null,
  ]) {
    const receipt = await cleanupOwnedRuntime(cleanupOptions(), { remove: async () => result });
    assert.equal(receipt.status, "failed");
    assert.equal(receipt.errorCode, "CLEANUP_WORKER_FAILED");
    const saved = JSON.stringify(receipt);
    assert.ok(!saved.includes("synthetic-private"));
    assert.ok(!saved.includes("private"));
  }
  const receipt = await cleanupOwnedRuntime(
    {
      ...cleanupOptions(),
      identity: { path: join(tmpdir(), "synthetic-private-path"), dev: "1", ino: "2" },
    },
    { remove: async () => assert.fail("A non-owned path must not be removed.") },
  );
  assert.equal(receipt.errorCode, "CLEANUP_OWNERSHIP_UNVERIFIED");
  assert.ok(!JSON.stringify(receipt).includes("synthetic-private"));
});

test("real credential-free cleanup worker verifies the same physical identity before deleting test-owned paths", async (t) => {
  const root = await mkdtemp(join(await realpath(tmpdir()), "agentproof-cleanup-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = await mkdtemp(join(root, "agentproof-protocol-state-"));
  const stat = await lstat(path, { bigint: true });
  const identity = { path, dev: stat.dev.toString(), ino: stat.ino.toString() };
  await writeFile(join(path, "synthetic-file"), "test-owned");
  const altered = await cleanupOwnedRuntime({
    ...cleanupOptions(() => 10_000),
    identity: { ...identity, ino: `${stat.ino + 1n}` },
  });
  assert.equal(altered.status, "failed");
  assert.equal(altered.errorCode, "OWNED_PATH_CHANGED");
  assert.equal(await readFile(join(path, "synthetic-file"), "utf8"), "test-owned");
  const receipt = await cleanupOwnedRuntime({ ...cleanupOptions(() => 10_000), identity });
  assert.equal(receipt.status, "removed-after-exit");
  assert.equal(receipt.attempts[0].pathVerified, true);
  assert.equal(receipt.attempts[0].worker.exitObserved, true);
  assert.equal(receipt.attempts[0].worker.streamsClosed, true);
  assert.ok(receipt.attempts[0].worker.processId > 0);
  assert.deepEqual(await readdir(root), []);
});

test("real cleanup worker refuses an owned-name junction or symlink rather than deleting its target", async (t) => {
  const root = await mkdtemp(join(await realpath(tmpdir()), "agentproof-cleanup-link-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const target = join(root, "target");
  await mkdir(target);
  await writeFile(join(target, "synthetic-file"), "preserved");
  const path = join(root, "agentproof-protocol-state-Alias1");
  await symlink(target, path, process.platform === "win32" ? "junction" : "dir");
  const stat = await lstat(path, { bigint: true });
  const receipt = await cleanupOwnedRuntime({
    ...cleanupOptions(() => 10_000),
    identity: { path, dev: stat.dev.toString(), ino: stat.ino.toString() },
  });
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.errorCode, "OWNED_PATH_CHANGED");
  assert.equal(await readFile(join(target, "synthetic-file"), "utf8"), "preserved");
  await unlink(path);
});

test("real cleanup worker ignores inherited Node bootstrap settings and preserves missing-path errors", async (t) => {
  const root = await mkdtemp(join(await realpath(tmpdir()), "agentproof-cleanup-env-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = await mkdtemp(join(root, "agentproof-protocol-state-"));
  const stat = await lstat(path, { bigint: true });
  const options = {
    ...cleanupOptions(() => 10_000),
    identity: { path, dev: stat.dev.toString(), ino: stat.ino.toString() },
  };
  const previous = { NODE_OPTIONS: process.env.NODE_OPTIONS, NODE_PATH: process.env.NODE_PATH };
  try {
    process.env.NODE_OPTIONS = "--synthetic-invalid-bootstrap-option";
    process.env.NODE_PATH = "synthetic-unused-module-path";
    const receipt = await cleanupOwnedRuntime(options);
    assert.equal(receipt.status, "removed-after-exit");
    assert.equal(receipt.attempts[0].worker.exitObserved, true);
    assert.equal(receipt.attempts[0].worker.streamsClosed, true);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
  const missing = await cleanupOwnedRuntime(options);
  assert.equal(missing.status, "failed");
  assert.equal(missing.errorCode, "ENOENT");
  assert.equal(missing.firstErrorCode, "ENOENT");
  assert.equal(missing.attempts.length, 1);
  assert.equal(missing.attempts[0].stage, "verify-owned-path");
  assert.equal(missing.attempts[0].worker.exitObserved, true);
  assert.equal(missing.attempts[0].worker.streamsClosed, true);
});

test("a real cleanup worker timeout is failure, never requested-kill-as-cleanup proof", async (t) => {
  const root = await mkdtemp(join(await realpath(tmpdir()), "agentproof-cleanup-timeout-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const path = await mkdtemp(join(root, "agentproof-protocol-state-"));
  const stat = await lstat(path, { bigint: true });
  const receipt = await cleanupOwnedRuntime({
    ...cleanupOptions(() => 1),
    identity: { path, dev: stat.dev.toString(), ino: stat.ino.toString() },
  });
  assert.equal(receipt.status, "failed");
  assert.equal(receipt.errorCode, "CLEANUP_DEADLINE");
  assert.equal(receipt.attempts.length, 1);
  assert.equal(receipt.attempts[0].removed, false);
  assert.equal(receipt.attempts[0].worker.exitObserved, true);
  assert.equal(receipt.attempts[0].worker.streamsClosed, true);
});
