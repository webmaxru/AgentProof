import { execFile } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";
import { AgentProofError, sha256 } from "@agentproof/evidence-core";

export const PUBLIC_REVIEW_MODE = "public-evidence-packet-v1";
export const PUBLIC_REVIEW_PROFILE_VERSION = "0.3.0";
export const SUPPORTED_COPILOT_VERSION = "1.0.92-3";
export const MAX_REVIEW_REQUEST_BYTES = 24_000;
const MAX_NATIVE_OUTPUT_BYTES = 4 * 1024 * 1024;
const SPECIALISTS = ["test", "security", "policy"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;
const NATIVE_EVENTS = new Set([
  "session.start",
  "session.info",
  "session.extensions_loaded",
  "session.mcp_servers_loaded",
  "session.tools_updated",
  "session.usage_checkpoint",
  "user.message",
  "assistant.message_start",
  "assistant.message_delta",
  "assistant.message",
  "assistant.reasoning",
  "assistant.reasoning_delta",
  "assistant.turn_start",
  "assistant.turn_end",
  "assistant.idle",
  "model.call_start",
  "model.call_finished",
  "model.call_final_result",
  "prompt_cache_break",
  "result",
]);

function requireCondition(condition, code, message) {
  if (!condition) throw new AgentProofError(code, message);
}

export function publicReviewerName(specialist) {
  requireCondition(
    SPECIALISTS.includes(specialist),
    "AP_REVIEW_SPECIALIST_INVALID",
    "A public-packet review requires test, security, or policy.",
  );
  return `AgentProof Public Packet ${specialist[0].toUpperCase()}${specialist.slice(1)} Reviewer`;
}

export function validatePublicReviewerProfile(source, specialist) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/u.exec(source);
  requireCondition(match, "AP_REVIEW_PROFILE_INVALID", "Reviewer front matter is missing.");
  const document = parseDocument(match[1], { strict: true, uniqueKeys: true });
  requireCondition(
    document.errors.length === 0,
    "AP_REVIEW_PROFILE_INVALID",
    "Reviewer front matter is invalid.",
  );
  const profile = document.toJS({ maxAliasCount: 0 });
  requireCondition(
    profile?.name === publicReviewerName(specialist) &&
      JSON.stringify(Object.keys(profile).sort()) ===
        JSON.stringify([
          "description",
          "disable-model-invocation",
          "metadata",
          "name",
          "target",
          "tools",
          "user-invocable",
        ]) &&
      profile.target === "github-copilot" &&
      Array.isArray(profile.tools) &&
      profile.tools.length === 0 &&
      profile["disable-model-invocation"] === true &&
      profile["user-invocable"] === true &&
      JSON.stringify(Object.keys(profile.metadata ?? {}).sort()) ===
        JSON.stringify(["authority", "mode", "version"]) &&
      profile.metadata?.version === PUBLIC_REVIEW_PROFILE_VERSION &&
      profile.metadata?.mode === PUBLIC_REVIEW_MODE &&
      profile.metadata?.authority === "advisory",
    "AP_REVIEW_PROFILE_UNSAFE",
    "Use the exact versioned public-packet profile with an explicit empty tool list.",
  );
  return profile;
}

export function zeroToolArguments({ specialist, sessionId, request }) {
  requireCondition(UUID.test(sessionId), "AP_REVIEW_SESSION_INVALID", "Use a fresh session UUID.");
  requireCondition(
    typeof request === "string" &&
      request.length > 0 &&
      Buffer.byteLength(request, "utf8") <= MAX_REVIEW_REQUEST_BYTES &&
      !request.includes("\0") &&
      !request.includes("@"),
    "AP_REVIEW_REQUEST_INVALID",
    "Public input is absent, oversized, or contains an unescaped native file-mention marker.",
  );
  return [
    "--agent",
    publicReviewerName(specialist),
    "--session-id",
    sessionId,
    // The allow/exclude intersection is empty even if the host adds built-in tools.
    "--available-tools",
    "view",
    "--excluded-tools",
    "view",
    "--deny-tool",
    "shell",
    "write",
    "--secret-env-vars",
    "COPILOT_GITHUB_TOKEN",
    "--disable-builtin-mcps",
    "--no-custom-instructions",
    "--disallow-temp-dir",
    "--no-auto-update",
    "--no-ask-user",
    "--no-remote",
    "--no-remote-export",
    "--log-level",
    "none",
    "--output-format",
    "json",
    "--mode",
    "interactive",
    "-p",
    request,
  ];
}

export function zeroToolEnvironment(home, inherited = process.env) {
  const environment = {};
  for (const key of ["PATH", "Path", "PATHEXT", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC"]) {
    if (typeof inherited[key] === "string") environment[key] = inherited[key];
  }
  for (const key of [
    "HOME",
    "USERPROFILE",
    "APPDATA",
    "LOCALAPPDATA",
    "TEMP",
    "TMP",
    "COPILOT_HOME",
  ]) {
    environment[key] = home;
  }
  if (typeof inherited.COPILOT_GITHUB_TOKEN === "string") {
    environment.COPILOT_GITHUB_TOKEN = inherited.COPILOT_GITHUB_TOKEN;
  }
  return {
    ...environment,
    COPILOT_AUTO_UPDATE: "false",
    COPILOT_DISABLE_TERMINAL_TITLE: "1",
    USE_TGREP: "false",
    NO_COLOR: "1",
  };
}

export function verifyNativeZeroToolRun({
  stdout,
  exitCode,
  sessionId,
  request,
  startedAt,
  completedAt,
}) {
  const reject = (condition, message) =>
    requireCondition(condition, "AP_REVIEW_NATIVE_BOUNDARY_REJECTED", message);
  reject(exitCode === 0, "Native reviewer process did not complete successfully.");
  reject(
    typeof stdout === "string" &&
      Buffer.byteLength(stdout, "utf8") <= MAX_NATIVE_OUTPUT_BYTES &&
      stdout.trim().length > 0,
    "Native reviewer stream is absent or oversized.",
  );
  let events;
  try {
    events = stdout
      .trim()
      .split(/\r?\n/u)
      .map((line) => JSON.parse(line));
  } catch {
    throw new AgentProofError("AP_REVIEW_NATIVE_BOUNDARY_REJECTED", "Native JSONL is malformed.");
  }
  reject(
    events.every((event) => event && NATIVE_EVENTS.has(event.type)),
    "Native stream contains an unsupported event, tool activity, error, or resumed session.",
  );
  const ofType = (type) => events.filter((event) => event.type === type);
  const users = ofType("user.message");
  const answers = ofType("assistant.message");
  const results = ofType("result");
  reject(
    users.length === 1 && users[0].data?.content === request,
    "Native user input is missing, repeated, or differs from the exact public packet.",
  );
  const transformed = users[0].data.transformedContent;
  const clock =
    typeof transformed === "string"
      ? /^<current_datetime>(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2})<\/current_datetime>\n\n/u.exec(
          transformed,
        )
      : null;
  const promptTime = Date.parse(clock?.[1]);
  const startTime = Date.parse(startedAt);
  const endTime = Date.parse(completedAt);
  reject(
    clock !== null &&
      transformed === `${clock[0]}${request}` &&
      typeof users[0].timestamp === "string" &&
      promptTime === Date.parse(users[0].timestamp) &&
      Number.isFinite(startTime) &&
      Number.isFinite(endTime) &&
      startTime <= promptTime &&
      promptTime <= endTime &&
      endTime - startTime <= 180_000,
    "Require the exact native clock envelope and unchanged public request, bound to the captured process window.",
  );
  reject(
    !Object.hasOwn(users[0].data, "attachments") ||
      (Array.isArray(users[0].data.attachments) && users[0].data.attachments.length === 0),
    "Native user input must not attach additional context.",
  );
  reject(
    answers.length === 1 &&
      typeof answers[0].data?.content === "string" &&
      Array.isArray(answers[0].data?.toolRequests) &&
      answers[0].data.toolRequests.length === 0,
    "Require exactly one native assistant answer with explicitly zero tool requests.",
  );
  reject(
    results.length === 1 &&
      events.at(-1) === results[0] &&
      results[0].exitCode === 0 &&
      results[0].sessionId === sessionId,
    "Native completion is absent, partial, unsuccessful, or bound to another session.",
  );
  for (const type of ["model.call_start", "model.call_finished", "model.call_final_result"]) {
    reject(
      ofType(type).length === 1,
      "Only a single, completely observed model call is supported.",
    );
  }
  const modelCall = ofType("model.call_start")[0];
  const activeModel = modelCall.data?.model;
  reject(
    typeof activeModel === "string" &&
      activeModel.length > 0 &&
      answers[0].data.model === activeModel &&
      ofType("model.call_final_result")[0].data?.model === activeModel,
    "Native model-call, answer, and result identities must agree.",
  );
  reject(
    ofType("model.call_finished")[0].data?.outcome === "success" &&
      ofType("model.call_finished")[0].data?.containsBuiltInFileEditRequest === false,
    "Native model completion failed or reported a built-in edit request.",
  );
  const ordered = [
    users[0],
    modelCall,
    ofType("model.call_finished")[0],
    answers[0],
    ofType("model.call_final_result")[0],
  ].map((event) => events.indexOf(event));
  reject(
    ordered.every((index, position) => position === 0 || index > ordered[position - 1]),
    "Native input, model completion, answer, and final-result ordering differs.",
  );
  for (const event of ofType("session.tools_updated")) {
    reject(
      JSON.stringify(Object.keys(event.data ?? {})) === '["model"]' &&
        typeof event.data.model === "string" &&
        event.data.model.length > 0,
      "Native tool-update metadata has an unsupported shape.",
    );
  }
  for (const event of ofType("session.start")) {
    reject(event.data?.sessionId === sessionId, "Native session-start identity differs.");
  }
  reject(ofType("session.start").length <= 1, "Native stream contains multiple session starts.");
  for (const [type, field] of [
    ["session.extensions_loaded", "extensions"],
    ["session.mcp_servers_loaded", "servers"],
  ]) {
    reject(ofType(type).length === 1, "Native extension/MCP initialization metadata is missing.");
    for (const event of ofType(type)) {
      reject(
        Array.isArray(event.data?.[field]) && event.data[field].length === 0,
        "Native runtime loaded an extension or MCP server.",
      );
    }
  }
  const inventories = [];
  let observedCompletedCall = false;
  for (const event of ofType("session.usage_checkpoint")) {
    if (
      events.indexOf(event) > events.indexOf(answers[0]) &&
      events.indexOf(event) > events.indexOf(ofType("model.call_finished")[0]) &&
      events.indexOf(event) > events.indexOf(ofType("model.call_final_result")[0])
    ) {
      observedCompletedCall = true;
    }
    const states = event.data?.promptCacheBreakState;
    reject(Array.isArray(states) && states.length > 0, "Native tool inventory is missing.");
    for (const state of states) {
      reject(
        state?.models !== null &&
          typeof state?.models === "object" &&
          !Array.isArray(state.models) &&
          Object.hasOwn(state.models, activeModel),
        "Native per-model tool inventory is missing.",
      );
      for (const [model, inventory] of Object.entries(state.models)) {
        reject(
          inventory?.tool_count === 0 &&
            Array.isArray(inventory.tools) &&
            inventory.tools.length === 0 &&
            inventory.tools_truncated === 0,
          "Every native model inventory must explicitly report zero tools without truncation.",
        );
        inventories.push({ model, tool_count: 0, tools: [], tools_truncated: 0 });
      }
    }
  }
  reject(
    inventories.length > 0 && observedCompletedCall,
    "No native zero-tool inventory for the completed model call was observed.",
  );
  reject(
    !answers[0].data.content.includes("UNSAFE_TOOL_BOUNDARY"),
    "Reviewer refused the boundary; preserve this refusal, even with zero native tools.",
  );
  return {
    sessionId,
    requestSha256: sha256(request),
    transformedRequestSha256: sha256(transformed),
    nativeInputEnvelope: "current_datetime",
    startedAt,
    completedAt,
    model: activeModel,
    stdoutSha256: sha256(stdout),
    nativeToolInventories: inventories,
    modelCalls: 1,
    toolCalls: 0,
    response: answers[0].data.content,
  };
}

async function requireNoGitAncestor(workspace) {
  const physicalWorkspace = await realpath(workspace);
  for (let path = physicalWorkspace; ; path = dirname(path)) {
    let hasGit = false;
    try {
      await lstat(join(path, ".git"));
      hasGit = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    requireCondition(
      !hasGit,
      "AP_REVIEW_WORKSPACE_UNSAFE",
      "The native working directory must not inherit a repository checkout.",
    );
    if (dirname(path) === path) break;
  }
  return physicalWorkspace;
}

export { requireNoGitAncestor };

function executeNative(executable, args, options) {
  return new Promise((resolve) => {
    execFile(
      executable,
      args,
      {
        ...options,
        encoding: "utf8",
        shell: false,
        windowsHide: true,
        timeout: 180_000,
        maxBuffer: MAX_NATIVE_OUTPUT_BYTES,
      },
      (error, stdout) => {
        resolve({
          exitCode: error === null ? 0 : Number.isInteger(error.code) ? error.code : null,
          stdout,
        });
      },
    );
  });
}

export async function runCopilotPublicPacket(options, execute = executeNative) {
  const { executable, executableSha256, captureDirectory, specialist, sessionId, request } =
    options;
  const args = zeroToolArguments({ specialist, sessionId, request });
  requireCondition(
    isAbsolute(executable) && /^[0-9a-f]{64}$/u.test(executableSha256),
    "AP_REVIEW_RUNTIME_UNPINNED",
    "The trusted host must pin an absolute native executable and its reviewed SHA-256.",
  );
  const commandLineBound = [executable, ...args].reduce(
    (length, argument) => length + argument.length + (argument.match(/[\\"]/gu)?.length ?? 0) + 3,
    0,
  );
  requireCondition(
    commandLineBound <= 30_000,
    "AP_REVIEW_REQUEST_INVALID",
    "Native command line exceeds the conservative Windows quoting bound.",
  );
  requireCondition(
    isAbsolute(captureDirectory),
    "AP_REVIEW_CAPTURE_INVALID",
    "Use a new absolute host-owned capture directory, outside the subject checkout.",
  );
  requireCondition(
    sha256(await readFile(executable)) === executableSha256,
    "AP_REVIEW_RUNTIME_UNPINNED",
    "Native executable differs from the reviewed binary.",
  );
  const profilePath = fileURLToPath(
    new URL(`../agents/agentproof-${specialist}-reviewer.agent.md`, import.meta.url),
  );
  const profile = await readFile(profilePath, "utf8");
  validatePublicReviewerProfile(profile, specialist);
  // No recursive creation or reuse: an existing capture, including a failure, is immutable.
  await mkdir(captureDirectory, { mode: 0o700 });
  const runtimeRoot = await mkdtemp(join(tmpdir(), "agentproof-public-review-"));
  const home = join(runtimeRoot, "home");
  const workspace = join(runtimeRoot, "workspace");
  const agentDirectory = join(workspace, ".github", "agents");
  const localProfile = join(agentDirectory, `agentproof-${specialist}-reviewer.agent.md`);
  const receipt = {
    mode: PUBLIC_REVIEW_MODE,
    profileVersion: PUBLIC_REVIEW_PROFILE_VERSION,
    profileSha256: sha256(profile),
    executableSha256,
    expectedCliVersion: SUPPORTED_COPILOT_VERSION,
    cliVersion: null,
    sessionId,
    requestSha256: sha256(request),
    status: "blocked",
  };
  try {
    await mkdir(home, { recursive: true, mode: 0o700 });
    await mkdir(agentDirectory, { recursive: true });
    const physicalWorkspace = await requireNoGitAncestor(workspace);
    await writeFile(localProfile, profile, { flag: "wx" });
    await writeFile(join(captureDirectory, "request.json"), request, { flag: "wx" });
    const processOptions = { cwd: physicalWorkspace, env: zeroToolEnvironment(home) };
    requireCondition(
      typeof processOptions.env.COPILOT_GITHUB_TOKEN === "string" &&
        processOptions.env.COPILOT_GITHUB_TOKEN.trim().length > 0,
      "AP_REVIEW_RUNTIME_AUTH_MISSING",
      "The trusted host must provision inference authentication; no interactive login is attempted.",
    );
    const version = await execute(executable, ["--no-auto-update", "--version"], processOptions);
    receipt.versionOutputSha256 = sha256(version.stdout);
    requireCondition(
      version.exitCode === 0 &&
        version.stdout.split(/\r?\n/u)[0] === `GitHub Copilot CLI ${SUPPORTED_COPILOT_VERSION}.`,
      "AP_REVIEW_RUNTIME_UNSUPPORTED",
      "Native CLI version is unsupported; revalidate the adapter rather than relaxing its checks.",
    );
    receipt.cliVersion = SUPPORTED_COPILOT_VERSION;
    receipt.startedAt = new Date().toISOString();
    const native = await execute(executable, args, processOptions);
    receipt.completedAt = new Date().toISOString();
    receipt.processExitCode = native.exitCode;
    receipt.stdoutSha256 = sha256(native.stdout);
    await writeFile(join(captureDirectory, "native.jsonl"), native.stdout, {
      flag: "wx",
      mode: 0o600,
    });
    requireCondition(
      sha256(await readFile(localProfile)) === receipt.profileSha256 &&
        sha256(await readFile(executable)) === executableSha256,
      "AP_REVIEW_RUNTIME_CHANGED",
      "The native executable or staged profile changed during review.",
    );
    const verified = verifyNativeZeroToolRun({
      ...native,
      sessionId,
      request,
      startedAt: receipt.startedAt,
      completedAt: receipt.completedAt,
    });
    Object.assign(receipt, verified, { status: "native-zero-tools-verified-advisory-output-only" });
    return receipt;
  } catch (error) {
    receipt.errorCode = error instanceof AgentProofError ? error.code : "AP_REVIEW_RUNTIME_ERROR";
    throw error;
  } finally {
    try {
      await writeFile(
        join(captureDirectory, "runtime-receipt.json"),
        `${JSON.stringify(receipt, null, 2)}\n`,
        {
          flag: "wx",
          mode: 0o600,
        },
      );
    } finally {
      await rm(runtimeRoot, { recursive: true, force: true });
    }
  }
}
