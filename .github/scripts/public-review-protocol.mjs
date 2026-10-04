import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { AgentProofError, sha256 } from "@agentproof/evidence-core";
import {
  MAX_REVIEW_REQUEST_BYTES,
  PUBLIC_REVIEW_PROFILE_VERSION,
  SUPPORTED_COPILOT_VERSION,
  publicReviewerName,
  requireNoGitAncestor,
  validatePublicReviewerProfile,
  zeroToolEnvironment,
} from "./public-review-runtime.mjs";
import { MAX_PROTOCOL_BYTES, openProtocolTransport } from "./public-review-protocol-transport.mjs";

export const PROTOCOL_STATE_ADAPTER = "experimental-protocol-3-state-only-v1";
export const PROTOCOL_CONNECT_ADAPTER = "experimental-protocol-3-connect-diagnostics-v1";
export const MAX_CONNECT_DIAGNOSTICS_BYTES = 4096;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const DIGEST = /^[0-9a-f]{64}$/u;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})$/u;
const MCP_NAMES = ["github-mcp-server", "githubiq"];
const RUNTIME_ARGUMENTS = [
  "--headless",
  "--stdio",
  "--no-auto-update",
  "--no-auto-login",
  "--log-level",
  "none",
  "--disable-builtin-mcps",
  "--no-custom-instructions",
  "--disallow-temp-dir",
  "--no-ask-user",
  "--no-remote",
  "--no-remote-export",
  "--available-tools",
  "view",
  "--excluded-tools",
  "view",
  "--deny-tool",
  "shell",
  "write",
  "--secret-env-vars",
  "COPILOT_GITHUB_TOKEN",
  "--auth-token-env",
  "COPILOT_GITHUB_TOKEN",
];

function requireState(condition, message) {
  if (!condition) throw new AgentProofError("AP_REVIEW_PROTOCOL_STATE_REJECTED", message);
}

function object(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, required, optional = []) {
  return (
    object(value) &&
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => required.includes(key) || optional.includes(key))
  );
}

function empty(value) {
  return Array.isArray(value) && value.length === 0;
}

function diagnosticType(value) {
  return value === null ? "null" : Array.isArray(value) ? "array" : typeof value;
}

function projectedKeys(value, allowed) {
  if (!object(value)) return { type: diagnosticType(value), keys: [], redactedKeyCount: 0 };
  return {
    type: "object",
    keys: allowed
      .filter((key) => Object.hasOwn(value, key))
      .map((key) => ({ key, type: diagnosticType(value[key]) })),
    redactedKeyCount: Object.keys(value).filter((key) => !allowed.includes(key)).length,
  };
}

export function projectConnectResponse(message, fingerprint, expectedId) {
  requireState(
    exactKeys(fingerprint, ["rawResponseBytes", "rawResponseSha256"]) &&
      Number.isSafeInteger(fingerprint.rawResponseBytes) &&
      fingerprint.rawResponseBytes > 0 &&
      fingerprint.rawResponseBytes <= MAX_PROTOCOL_BYTES &&
      DIGEST.test(fingerprint.rawResponseSha256),
    "Native connect response fingerprint is invalid.",
  );
  const resultPresent = object(message) && Object.hasOwn(message, "result");
  const errorPresent = object(message) && Object.hasOwn(message, "error");
  const result = resultPresent ? message.result : undefined;
  const resultObject = object(result);
  const taskKindsPresent = resultObject && Object.hasOwn(result, "taskKinds");
  const predicates = {
    envelope_object: object(message),
    jsonrpc_2: object(message) && message.jsonrpc === "2.0",
    matching_numeric_id:
      object(message) && Number.isInteger(message.id) && message.id === expectedId,
    response_keys: exactKeys(message, ["jsonrpc", "id"], ["result", "error"]),
    result_without_error: resultPresent && !errorPresent,
    result_shape: exactKeys(result, ["ok", "protocolVersion", "version"], ["taskKinds"]),
    ok_true: resultObject && result.ok === true,
    protocol_version_3: resultObject && result.protocolVersion === 3,
    pinned_cli_version: resultObject && result.version === SUPPORTED_COPILOT_VERSION,
    task_kinds_absent_or_empty: resultObject && (!taskKindsPresent || empty(result.taskKinds)),
  };
  const projection = {
    ...fingerprint,
    resultPresent,
    errorPresent,
    envelope: projectedKeys(message, ["jsonrpc", "id", "result", "error"]),
    result: projectedKeys(result, ["ok", "protocolVersion", "version", "taskKinds"]),
    error: projectedKeys(errorPresent ? message.error : undefined, ["code", "message", "data"]),
    predicates,
    failedPredicates: Object.keys(predicates).filter((key) => !predicates[key]),
    missingResultKeys: ["ok", "protocolVersion", "version"].filter(
      (key) => !resultObject || !Object.hasOwn(result, key),
    ),
    pinnedVersionMatches: predicates.pinned_cli_version,
    taskKinds: {
      present: taskKindsPresent,
      type: taskKindsPresent ? diagnosticType(result.taskKinds) : "missing",
    },
  };
  if (
    resultObject &&
    typeof result.protocolVersion === "number" &&
    Number.isFinite(result.protocolVersion) &&
    Math.abs(result.protocolVersion) <= 2147483647
  ) {
    projection.protocolVersion = result.protocolVersion;
  }
  // Numeric CLI versions only: arbitrary prerelease/build strings may contain private data.
  if (
    resultObject &&
    typeof result.version === "string" &&
    /^(0|[1-9][0-9]{0,3})\.(0|[1-9][0-9]{0,3})\.(0|[1-9][0-9]{0,5})(?:-(0|[1-9][0-9]{0,3}))?$/u.test(
      result.version,
    )
  ) {
    projection.version = result.version;
  }
  if (taskKindsPresent && Array.isArray(result.taskKinds))
    projection.taskKinds.count = result.taskKinds.length;
  if (
    errorPresent &&
    Number.isSafeInteger(message.error?.code) &&
    Math.abs(message.error.code) <= 2147483647
  )
    projection.errorCode = message.error.code;
  requireState(
    Buffer.byteLength(JSON.stringify(projection)) <= MAX_CONNECT_DIAGNOSTICS_BYTES,
    "Native connect diagnostics exceed their fixed safe bound.",
  );
  return projection;
}

function verifyAuth(value, expectedLogin) {
  requireState(
    exactKeys(value, ["isAuthenticated", "login", "host", "authType"], ["statusMessage"]) &&
      value.isAuthenticated === true &&
      value.login === expectedLogin &&
      ["github.com", "https://github.com"].includes(value.host) &&
      ["env", "token"].includes(value.authType),
    "Native authentication must explicitly match the expected GitHub identity and explicit credential source.",
  );
  return { login: value.login, host: value.host, authType: value.authType };
}

function disabledExtensions(value) {
  requireState(
    exactKeys(value, ["extensions"]) && Array.isArray(value.extensions),
    "Native extension discovery response is missing or unsupported.",
  );
  return value.extensions.map((extension) => {
    requireState(
      exactKeys(extension, ["id", "name", "source", "status"], ["pid"]) &&
        typeof extension.id === "string" &&
        typeof extension.name === "string" &&
        ["project", "user", "plugin", "session"].includes(extension.source) &&
        extension.status === "disabled" &&
        !Object.hasOwn(extension, "pid"),
      "Every discovered extension must be explicitly disabled, without a running process.",
    );
    return { idSha256: sha256(extension.id), status: extension.status, source: extension.source };
  });
}

function disabledServers(servers, event = false) {
  requireState(Array.isArray(servers), "Native MCP server status entries are missing.");
  const names = new Set();
  return servers
    .map((server) => {
      requireState(
        exactKeys(
          server,
          ["name", "status"],
          event
            ? [
                "source",
                "displayName",
                "pluginName",
                "pluginVersion",
                "serverMetadata",
                "transport",
              ]
            : [
                "source",
                "displayName",
                "sourcePlugin",
                "sourcePluginVersion",
                "serverMetadata",
                "owned",
              ],
        ) &&
          MCP_NAMES.includes(server.name) &&
          !names.has(server.name) &&
          server.status === "disabled" &&
          !Object.hasOwn(server, "error"),
        "Native MCP entries must be known, distinct, and explicitly disabled.",
      );
      names.add(server.name);
      return { name: server.name, status: server.status };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function verifyMcp(value) {
  requireState(
    exactKeys(value, ["servers", "host"]),
    "Native initialized MCP host state is missing.",
  );
  const servers = disabledServers(value.servers);
  const host = value.host;
  requireState(
    exactKeys(host, [
      "mcp3pEnabled",
      "disabledServers",
      "filteredServers",
      "clients",
      "pendingConnections",
      "failedServers",
      "needsAuthServers",
    ]) &&
      typeof host.mcp3pEnabled === "boolean" &&
      Array.isArray(host.disabledServers) &&
      JSON.stringify([...host.disabledServers].sort()) ===
        JSON.stringify(servers.map((server) => server.name).sort()) &&
      empty(host.filteredServers) &&
      empty(host.clients) &&
      empty(host.pendingConnections) &&
      exactKeys(host.failedServers, []) &&
      exactKeys(host.needsAuthServers, []),
    "Native MCP host is incomplete, active, pending, failed, or awaiting authentication.",
  );
  return servers;
}

function publicAgentIdentity(agent, profile) {
  requireState(
    exactKeys(
      agent,
      ["id", "name", "displayName", "description", "tools"],
      [
        "path",
        "source",
        "userInvocable",
        "disableModelInvocation",
        "model",
        "models",
        "modelPolicy",
        "reasoningEffort",
        "mcpServers",
        "skills",
        "prompt",
      ],
    ) &&
      agent.id === profile.name &&
      agent.name === profile.name &&
      agent.displayName === profile.name &&
      agent.description === profile.description &&
      empty(agent.tools) &&
      (!Object.hasOwn(agent, "disableModelInvocation") || agent.disableModelInvocation === true) &&
      (!Object.hasOwn(agent, "userInvocable") || agent.userInvocable === true) &&
      (!Object.hasOwn(agent, "skills") || empty(agent.skills)) &&
      (!Object.hasOwn(agent, "mcpServers") || exactKeys(agent.mcpServers, [])) &&
      !["model", "models", "reasoningEffort", "modelPolicy"].some((key) =>
        Object.hasOwn(agent, key),
      ),
    "Native selected profile identity or its explicit authored tool list differs.",
  );
}

function observeNotifications(sessionId, expectedName) {
  const seen = new Set();
  const earliest = Date.now();
  const counts = {
    sessionStarts: 0,
    selectedEvents: 0,
    userMessages: 0,
    modelEvents: 0,
    toolOrPermissionEvents: 0,
  };
  return {
    counts,
    receive(method, params) {
      requireState(
        params.sessionId === sessionId,
        "Native notification belongs to another session.",
      );
      if (method === "session.lifecycle") {
        requireState(
          exactKeys(params, ["sessionId", "type"], ["metadata"]) &&
            ["session.created", "session.updated", "session.deleted"].includes(params.type),
          "Native lifecycle notification is unsupported or describes a resumed session.",
        );
        if (params.type !== "session.deleted") {
          requireState(
            exactKeys(params.metadata, ["startTime", "modifiedTime"], ["summary"]) &&
              TIMESTAMP.test(params.metadata.startTime) &&
              TIMESTAMP.test(params.metadata.modifiedTime),
            "Native lifecycle metadata is missing or malformed.",
          );
        } else {
          requireState(
            !Object.hasOwn(params, "metadata"),
            "Deleted native session has unexpected lifecycle metadata.",
          );
        }
        return;
      }
      const event = params.event;
      requireState(
        exactKeys(params, ["sessionId", "event"]) &&
          exactKeys(
            event,
            ["id", "parentId", "timestamp", "type", "data"],
            ["ephemeral", "agentId"],
          ) &&
          UUID.test(event.id) &&
          !seen.has(event.id) &&
          TIMESTAMP.test(event.timestamp) &&
          Date.parse(event.timestamp) >= earliest &&
          Date.parse(event.timestamp) <= Date.now() &&
          (event.parentId === null || UUID.test(event.parentId)) &&
          (!Object.hasOwn(event, "ephemeral") || typeof event.ephemeral === "boolean") &&
          !Object.hasOwn(event, "agentId") &&
          object(event.data),
        "Native session event identity, timestamp, ownership, or envelope is invalid.",
      );
      seen.add(event.id);
      const { type, data } = event;
      if (type === "user.message") counts.userMessages++;
      if (/^(assistant|model)\./u.test(type)) counts.modelEvents++;
      if (/^(tool|permission|hook|elicitation)\./u.test(type)) counts.toolOrPermissionEvents++;
      requireState(
        counts.userMessages === 0 &&
          counts.modelEvents === 0 &&
          counts.toolOrPermissionEvents === 0,
        "State-only observation forbids every user message, model response, refusal, tool, permission, or hook event.",
      );
      switch (type) {
        case "session.start":
          requireState(
            ++counts.sessionStarts === 1 &&
              data.sessionId === sessionId &&
              event.parentId === null &&
              data.copilotVersion === SUPPORTED_COPILOT_VERSION &&
              typeof data.producer === "string" &&
              Number.isInteger(data.version) &&
              TIMESTAMP.test(data.startTime) &&
              Date.parse(data.startTime) >= earliest &&
              Date.parse(data.startTime) <= Date.now() &&
              (!Object.hasOwn(data, "alreadyInUse") || data.alreadyInUse === false) &&
              (!Object.hasOwn(data, "remoteSteerable") || data.remoteSteerable === false) &&
              !Object.hasOwn(data, "detachedFromSpawningParentSessionId"),
            "Native session start differs or is not a fresh local session.",
          );
          counts.sessionStartedAt = data.startTime;
          counts.sessionStartEventAt = event.timestamp;
          break;
        case "subagent.selected":
          requireState(
            exactKeys(data, ["agentName", "agentDisplayName", "tools"]) &&
              data.agentName === expectedName &&
              data.agentDisplayName === expectedName &&
              empty(data.tools),
            "Native selection event differs from the pinned public profile.",
          );
          counts.selectedEvents++;
          break;
        case "session.extensions_loaded":
          requireState(event.ephemeral === true, "Native extension event must be ephemeral.");
          disabledExtensions(data);
          break;
        case "session.mcp_servers_loaded":
          requireState(
            event.ephemeral === true && exactKeys(data, ["servers"]),
            "Native MCP initialization event is malformed.",
          );
          disabledServers(data.servers, true);
          break;
        case "session.skills_loaded":
          requireState(
            event.ephemeral === true && exactKeys(data, ["skills"]) && empty(data.skills),
            "Native runtime loaded skills in state-only mode.",
          );
          break;
        case "session.tools_updated":
          requireState(
            exactKeys(data, ["model"]) && typeof data.model === "string",
            "Native tool-update schema is unsupported.",
          );
          break;
        case "session.info":
          requireState(
            exactKeys(data, ["infoType", "message"], ["tip", "url"]) &&
              typeof data.infoType === "string" &&
              typeof data.message === "string",
            "Native informational event is malformed.",
          );
          break;
        case "session.usage_checkpoint":
          // Internal cache baselines are not a public model-inventory contract.
          requireState(
            exactKeys(
              data,
              ["totalNanoAiu"],
              ["modelCacheState", "promptCacheBreakState", "totalPremiumRequests"],
            ) &&
              data.totalNanoAiu === 0 &&
              (!Object.hasOwn(data, "totalPremiumRequests") || data.totalPremiumRequests === 0) &&
              (!Object.hasOwn(data, "modelCacheState") || empty(data.modelCacheState)) &&
              (!Object.hasOwn(data, "promptCacheBreakState") || empty(data.promptCacheBreakState)),
            "State-only usage must be zero with no populated or unsupported internal cache baseline.",
          );
          break;
        default:
          requireState(false, "Native event type is unsupported in state-only observation.");
      }
    },
  };
}

function sessionConfiguration(sessionId, profile, body, workspace, home) {
  return {
    sessionId,
    clientName: "AgentProof protocol-3 state-only",
    isExperimentalMode: false,
    tools: [],
    availableTools: [],
    excludedTools: ["builtin:*", "mcp:*", "custom:*"],
    toolFilterPrecedence: "excluded",
    systemMessage: { mode: "customize", sections: { environment_context: { action: "remove" } } },
    requestPermission: true,
    requestUserInput: false,
    requestElicitation: false,
    requestExitPlanMode: false,
    requestAutoModeSwitch: false,
    requestExtensions: false,
    hooks: false,
    workingDirectory: workspace,
    additionalDirectories: [],
    streaming: false,
    includeSubAgentStreamingEvents: true,
    mcpServers: {},
    disabledMcpServers: [...MCP_NAMES],
    mcpOAuthTokenStorage: "in-memory",
    envValueMode: "direct",
    customAgents: [
      {
        name: profile.name,
        displayName: profile.name,
        description: profile.description,
        prompt: body,
        tools: [],
        infer: false,
        skills: [],
        mcpServers: {},
      },
    ],
    customAgentsLocalOnly: true,
    agent: profile.name,
    configDir: home,
    enableConfigDiscovery: false,
    refreshCustomInstructions: false,
    skipEmbeddingRetrieval: true,
    embeddingCacheStorage: "in-memory",
    enableOnDemandInstructionDiscovery: false,
    enableFileHooks: false,
    enableHostGitOperations: false,
    enableSessionStore: false,
    enableSkills: false,
    enableSessionTelemetry: false,
    skillDirectories: [],
    pluginDirectories: [],
    instructionDirectories: [],
    infiniteSessions: { enabled: false },
    memory: { enabled: false },
    remoteSession: "off",
  };
}

async function readState(transport, sessionId, profile, body, receipt) {
  const name = profile.name;
  const call = (method, params = {}) => transport.request(method, { sessionId, ...params });
  const current = await call("session.agent.getCurrent");
  requireState(exactKeys(current, ["agent"]), "Native selected-agent response is missing.");
  publicAgentIdentity(current.agent, profile);
  const listed = await call("session.agent.list", {
    includeBuiltInAgents: false,
    includePrompt: true,
  });
  requireState(
    exactKeys(listed, ["agents"]) && Array.isArray(listed.agents) && listed.agents.length === 1,
    "Native authored-agent listing must identify exactly the staged public profile.",
  );
  publicAgentIdentity(listed.agents[0], profile);
  requireState(
    typeof listed.agents[0].prompt === "string" && sha256(listed.agents[0].prompt) === sha256(body),
    "Native public authored-profile bytes are missing or differ from the pinned profile.",
  );
  if (Object.hasOwn(current.agent, "prompt")) {
    requireState(
      typeof current.agent.prompt === "string" && sha256(current.agent.prompt) === sha256(body),
      "Native selected-profile authored bytes differ.",
    );
  }
  const extensions = disabledExtensions(await call("session.extensions.list"));
  const mcp = await call("session.mcp.list");
  if (object(mcp) && Array.isArray(mcp.servers)) {
    receipt.observedDisabledMcpServers = disabledServers(mcp.servers);
  }
  const mcpServers = verifyMcp(mcp);
  const catalog = await call("session.tools.getCurrentMetadata");
  requireState(
    exactKeys(catalog, ["tools"]) && empty(catalog.tools),
    "Native tool catalog must be explicitly initialized and empty; null or missing is not zero.",
  );
  const skills = await call("session.skills.list");
  requireState(
    exactKeys(skills, ["skills"]) && empty(skills.skills),
    "Native skill state is missing or nonempty.",
  );
  return {
    selectedProfile: {
      id: current.agent.id,
      name,
      authoredTools: [],
      authoredPromptSha256: sha256(body),
    },
    extensions,
    mcpServers,
    initializedToolCatalog: [],
    skills: [],
  };
}

export function observeCopilotProtocol3State(options, dependencies) {
  return observeCopilotProtocol3(options, dependencies, false);
}

export function observeCopilotProtocol3Connect(options, dependencies) {
  return observeCopilotProtocol3(options, dependencies, true);
}

async function observeCopilotProtocol3(
  options,
  { spawnNative, temporaryParent = tmpdir(), inheritedEnvironment = process.env, timeoutMs } = {},
  connectOnly,
) {
  requireState(
    exactKeys(options, [
      "executable",
      "executableSha256",
      "profileSha256",
      "captureDirectory",
      "specialist",
      "sessionId",
      "expectedLogin",
    ]) &&
      isAbsolute(options.executable) &&
      isAbsolute(options.captureDirectory) &&
      DIGEST.test(options.executableSha256) &&
      DIGEST.test(options.profileSha256) &&
      UUID.test(options.sessionId) &&
      /^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/u.test(options.expectedLogin),
    "State-only options must pin the runtime/profile/identity and contain no review input or overrides.",
  );
  const name = publicReviewerName(options.specialist);
  const executable = await realpath(options.executable);
  const source = await readFile(
    fileURLToPath(
      new URL(`../agents/agentproof-${options.specialist}-reviewer.agent.md`, import.meta.url),
    ),
    "utf8",
  );
  requireState(
    Buffer.byteLength(source) <= MAX_REVIEW_REQUEST_BYTES &&
      sha256(source) === options.profileSha256 &&
      sha256(await readFile(executable)) === options.executableSha256,
    "Pinned public profile or native executable bytes differ.",
  );
  const profile = validatePublicReviewerProfile(source, options.specialist);
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/u, "");
  const captureDirectory = join(
    await requireNoGitAncestor(dirname(options.captureDirectory)),
    basename(options.captureDirectory),
  );
  await mkdir(captureDirectory, { mode: 0o700 });
  const receipt = {
    adapter: connectOnly ? PROTOCOL_CONNECT_ADAPTER : PROTOCOL_STATE_ADAPTER,
    profileVersion: PUBLIC_REVIEW_PROFILE_VERSION,
    profileSha256: options.profileSha256,
    executableSha256: options.executableSha256,
    ...(connectOnly
      ? { attemptId: options.sessionId, connectOnly: true }
      : { requestedSessionId: options.sessionId }),
    status: "blocked",
    stateOnly: true,
    modelInventoryStatus: "unknown",
    reviewStatus: "blocked",
  };
  let runtimeRoot;
  let transport;
  let failure;
  try {
    runtimeRoot = await mkdtemp(
      join(await requireNoGitAncestor(temporaryParent), "agentproof-protocol-state-"),
    );
    const home = join(runtimeRoot, "home");
    const workspace = join(runtimeRoot, "workspace");
    await mkdir(home, { mode: 0o700 });
    await mkdir(join(workspace, ".github", "agents"), { recursive: true });
    const physicalWorkspace = await requireNoGitAncestor(workspace);
    const localProfile = join(physicalWorkspace, ".github", "agents", "public-reviewer.agent.md");
    await writeFile(localProfile, source, { flag: "wx", mode: 0o600 });
    const env = { ...zeroToolEnvironment(home, inheritedEnvironment), COPILOT_DISABLE_KEYTAR: "1" };
    requireState(
      typeof env.COPILOT_GITHUB_TOKEN === "string" && env.COPILOT_GITHUB_TOKEN.trim().length > 0,
      "Trusted launcher must supply explicit native authentication; no login fallback is permitted.",
    );
    const observer = observeNotifications(options.sessionId, name);
    receipt.events = observer.counts;
    transport = openProtocolTransport(
      {
        executable,
        args: [...RUNTIME_ARGUMENTS],
        cwd: physicalWorkspace,
        env,
        onNotification: observer.receive,
        onConnectResponse: (message, fingerprint, expectedId) => {
          receipt.connect = projectConnectResponse(message, fingerprint, expectedId);
        },
        connectOnly,
        timeoutMs,
      },
      spawnNative,
    );
    const connected = await transport.request("connect", {
      enableGitHubTelemetryForwarding: false,
      supportedTaskKinds: [],
    });
    requireState(
      exactKeys(connected, ["ok", "protocolVersion", "version"], ["taskKinds"]) &&
        connected.ok === true &&
        connected.protocolVersion === 3 &&
        connected.version === SUPPORTED_COPILOT_VERSION &&
        (!Object.hasOwn(connected, "taskKinds") || empty(connected.taskKinds)),
      "Native connect must confirm protocol 3 and the exact pinned version; no downgrade is permitted.",
    );
    let observedState;
    if (!connectOnly) {
      const status = await transport.request("status.get", {});
      requireState(
        exactKeys(status, ["version", "protocolVersion"]) &&
          status.version === SUPPORTED_COPILOT_VERSION &&
          status.protocolVersion === 3,
        "Native status differs from the pinned protocol/version.",
      );
      receipt.cliVersion = status.version;
      receipt.auth = verifyAuth(
        await transport.request("auth.getStatus", {}),
        options.expectedLogin,
      );
      const created = await transport.request(
        "session.create",
        sessionConfiguration(options.sessionId, profile, body, physicalWorkspace, home),
      );
      requireState(
        exactKeys(created, ["sessionId"], ["workspacePath", "capabilities"]) &&
          created.sessionId === options.sessionId,
        "Native session creation returned another identity.",
      );
      receipt.nativeSessionId = created.sessionId;
      const initialized = await transport.request("session.tools.initializeAndValidate", {
        sessionId: options.sessionId,
      });
      requireState(exactKeys(initialized, []), "Native initialization response is unsupported.");
      const before = await readState(transport, options.sessionId, profile, body, receipt);
      const after = await readState(transport, options.sessionId, profile, body, receipt);
      requireState(
        JSON.stringify(before) === JSON.stringify(after),
        "Native profile or initialization state changed during observation.",
      );
      verifyAuth(await transport.request("auth.getStatus", {}), options.expectedLogin);
      requireState(
        observer.counts.sessionStarts === 1,
        "Native session-start proof was not observed.",
      );
      observedState = after;
    }
    requireState(
      sha256(await readFile(localProfile)) === options.profileSha256 &&
        sha256(await readFile(executable)) === options.executableSha256,
      "Native executable or staged profile changed during observation.",
    );
    if (connectOnly) {
      receipt.status = "connect-only-observed-review-blocked";
    } else {
      receipt.state = observedState;
      await transport.request("runtime.shutdown", {});
      receipt.status = "state-only-observed-review-blocked";
    }
  } catch (error) {
    failure =
      error instanceof AgentProofError
        ? error
        : new AgentProofError(
            "AP_REVIEW_PROTOCOL_HOST_ERROR",
            "Trusted native state observation failed.",
          );
    receipt.errorCode = failure.code;
    transport?.abort();
  } finally {
    const exited = transport ? await transport.finish() : true;
    if (transport) {
      receipt.native = transport.metadata();
      failure ??= transport.error;
    }
    if (!exited) {
      failure ??= new AgentProofError(
        "AP_REVIEW_PROTOCOL_EXIT_UNCONFIRMED",
        "Native exit and stream closure are not both confirmed; owned runtime paths were retained.",
      );
      receipt.cleanup = {
        status: "retained-unconfirmed-exit",
        directoryName: basename(runtimeRoot),
      };
    } else if (runtimeRoot) {
      try {
        await rm(runtimeRoot, { recursive: true });
        receipt.cleanup = {
          status: receipt.native?.exitObserved ? "removed-after-exit" : "removed-without-launch",
        };
      } catch {
        failure ??= new AgentProofError(
          "AP_REVIEW_PROTOCOL_CLEANUP_FAILED",
          "Owned runtime cleanup failed after native exit.",
        );
        receipt.cleanup = { status: "failed", directoryName: basename(runtimeRoot) };
      }
    }
    if (failure) {
      receipt.status = "blocked";
      receipt.errorCode = failure.code;
      receipt.blockedReason = failure.message;
    }
    await writeFile(
      join(
        captureDirectory,
        connectOnly ? "protocol-connect-receipt.json" : "protocol-state-receipt.json",
      ),
      `${JSON.stringify(receipt, null, 2)}\n`,
      { flag: "wx", mode: 0o600 },
    );
  }
  if (failure) throw failure;
  return receipt;
}
