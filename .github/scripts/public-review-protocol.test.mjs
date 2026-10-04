import assert from "node:assert/strict";
import { realpathSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { sha256 } from "@agentproof/evidence-core";
import { SESSION_ID } from "./public-review-fixtures.mjs";
import {
  protocolStateFixture,
  sessionEvent,
  stateFixtureChild,
} from "./public-review-protocol-fixtures.mjs";
import { encodeProtocolMessage } from "./public-review-protocol-transport.mjs";
import { observeCopilotProtocol3State } from "./public-review-protocol.mjs";

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
