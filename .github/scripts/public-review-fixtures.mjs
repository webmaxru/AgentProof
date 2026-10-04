// Synthetic unit fixtures only. These are not captured runs or live isolation proof.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import {
  canonicalSha256,
  loadReleasePolicyYaml,
  sha256,
  withArtifactDigest,
} from "@agentproof/evidence-core";

export const SESSION_ID = "00000000-0000-4000-8000-000000000001";
export const FIXTURE_TIME = "2026-09-02T09:00:00.000Z";

export function nativeEvents(
  request = "synthetic public request",
  response = "synthetic advisory response",
  timestamp = FIXTURE_TIME,
) {
  return [
    { type: "session.start", data: { sessionId: SESSION_ID } },
    { type: "session.extensions_loaded", data: { extensions: [] } },
    { type: "session.mcp_servers_loaded", data: { servers: [] } },
    {
      type: "user.message",
      timestamp,
      data: {
        content: request,
        transformedContent: `<current_datetime>${timestamp.replace("Z", "+00:00")}</current_datetime>\n\n${request}`,
        attachments: [],
      },
    },
    { type: "model.call_start", data: { model: "synthetic-model" } },
    {
      type: "model.call_finished",
      data: { outcome: "success", containsBuiltInFileEditRequest: false },
    },
    {
      type: "assistant.message",
      data: { content: response, model: "synthetic-model", toolRequests: [] },
    },
    { type: "model.call_final_result", data: { model: "synthetic-model", result: "success" } },
    {
      type: "session.usage_checkpoint",
      data: {
        promptCacheBreakState: [
          {
            models: { "synthetic-model": { tool_count: 0, tools: [], tools_truncated: 0 } },
          },
        ],
      },
    },
    { type: "result", sessionId: SESSION_ID, exitCode: 0 },
  ];
}

export function nativeJsonl(events) {
  return `${events.map((event) => JSON.stringify(event)).join("\n")}\n`;
}

export function reviewInput(request) {
  const evidence = request.publicContent.finalEvidence;
  const findings = evidence.findings.filter((finding) =>
    request.specialist === "policy"
      ? ["policy", "provenance"].includes(finding.category)
      : finding.category === request.specialist,
  );
  return {
    repository: evidence.repository,
    pullRequestNumber: evidence.pullRequestNumber,
    baseSha: evidence.baseSha,
    headSha: evidence.headSha,
    policySha256: evidence.policy.sha256,
    evidenceArtifactSha256: evidence.artifact.sha256,
    reviewerNote: {
      specialist: request.specialist,
      sessionUrl: request.sessionUrl,
      sourceSha: evidence.headSha,
      summary: findings.map((finding) => `${finding.id}: ${finding.state}`).join("; "),
      findingIds: findings.map((finding) => finding.id),
      createdAt: request.noteCreatedAt,
    },
    workflowRunUrl: null,
  };
}

export function reviewResponse(input) {
  return `\`\`\`json\n${JSON.stringify(input)}\n\`\`\`\nSummary: Synthetic advisory fixture only.`;
}

export async function publicSourceFixture() {
  const policySource = await readFile(
    new URL("../../policy/release-policy.yml", import.meta.url),
    "utf8",
  );
  const protectedPolicy = loadReleasePolicyYaml(policySource);
  const seed = JSON.parse(
    await readFile(
      new URL("../../packages/evidence-cli/tests/fixtures/artifacts/final.json", import.meta.url),
      "utf8",
    ),
  );
  const body = "Synthetic public unit fixture only.";
  const repository = seed.repository;
  const prefix = `/repos/${repository}`;
  const workflowSha = "3".repeat(40);
  const runUrl = `https://github.com/${repository}/actions/runs/300`;
  const findings = [
    ["AP-TEST-SUITE-001", "test", "pass"],
    ["AP-SEC-NPM-AUDIT-001", "security", "fail"],
    ["AP-POL-RETENTION-001", "policy", "unknown"],
    ["AP-PROV-ORIGIN-001", "provenance", "exception"],
  ].map(([id, category, state]) => ({
    ...seed.findings[0],
    id,
    category,
    state,
    exceptionable: category === "policy" || category === "provenance",
    evidenceRefs:
      category === "provenance"
        ? [{ kind: "pull-request", name: "Synthetic PR body", sha256: sha256(body) }]
        : [],
  }));
  const evidence = withArtifactDigest({
    ...seed,
    policy: { ...seed.policy, sha256: canonicalSha256(protectedPolicy) },
    findings,
    gate: {
      ...seed.gate,
      conclusion: "failure",
      counts: { pass: 1, fail: 1, unknown: 1, exception: 1 },
      unresolvedFindingIds: findings
        .filter((finding) => finding.state !== "pass")
        .map((finding) => finding.id)
        .sort(),
    },
    artifact: { ...seed.artifact, workflowRunUrl: runUrl },
  });
  const repo = { id: 100, full_name: repository, private: false, default_branch: "main" };
  const pr = {
    number: evidence.pullRequestNumber,
    state: "open",
    body,
    html_url: `https://github.com/${repository}/pull/${evidence.pullRequestNumber}`,
    base: { sha: evidence.baseSha, ref: "main", repo: { id: 100, full_name: repository } },
    head: { sha: evidence.headSha, ref: "synthetic", repo: { id: 100, full_name: repository } },
    user: { login: "fixture-author" },
    author_association: "OWNER",
  };
  const gate = {
    id: 400,
    name: "AgentProof / gate",
    head_sha: evidence.headSha,
    app: { id: 15368 },
    status: "completed",
    conclusion: "failure",
    output: {
      summary: [
        `- **Head SHA:** \`${evidence.headSha}\``,
        `- **Policy digest:** \`${evidence.policy.sha256}\``,
        `- **Evidence digest:** \`${evidence.artifact.sha256}\``,
        `[Workflow run](${runUrl})`,
      ].join("\n"),
    },
  };
  const workflow = {
    id: 200,
    name: "AgentProof Publish",
    path: ".github/workflows/agentproof-publish.yml",
    state: "active",
  };
  const run = {
    id: 300,
    run_attempt: 1,
    workflow_id: 200,
    name: workflow.name,
    path: workflow.path,
    event: "workflow_dispatch",
    repository: repo,
    head_repository: repo,
    head_branch: "main",
    head_sha: workflowSha,
    status: "completed",
    conclusion: "failure",
    html_url: runUrl,
    run_started_at: "2026-09-02T08:35:00.000Z",
  };
  const artifact = {
    id: 500,
    name: `agentproof-evidence-pr-${pr.number}-${evidence.headSha}`,
    expired: false,
    size_in_bytes: 4000,
    digest: `sha256:${"a".repeat(64)}`,
    created_at: "2026-09-02T08:36:00.000Z",
    workflow_run: { id: 300, repository_id: 100, head_branch: "main", head_sha: workflowSha },
  };
  const policyBytes = Buffer.from(policySource);
  const policyFile = {
    type: "file",
    path: "policy/release-policy.yml",
    encoding: "base64",
    size: policyBytes.length,
    content: policyBytes.toString("base64"),
    sha: createHash("sha1")
      .update(`blob ${policyBytes.length}\0`)
      .update(policyBytes)
      .digest("hex"),
  };
  const sessionUrl = `${pr.html_url}#issuecomment-701`;
  const transcript = {
    id: 701,
    html_url: sessionUrl,
    user: { type: "User", login: "fixture-operator" },
    body: `<!-- agentproof-public-session:${SESSION_ID} -->\nSynthetic export seed, not live evidence.`,
  };
  const routes = new Map([
    [prefix, repo],
    [`${prefix}/pulls/${pr.number}`, pr],
    [
      `${prefix}/git/ref/heads/main`,
      {
        ref: "refs/heads/main",
        url: `https://api.github.com${prefix}/git/refs/heads/main`,
        object: { type: "commit", sha: workflowSha },
      },
    ],
    [`${prefix}/branches/main`, { name: "main", protected: true, commit: { sha: workflowSha } }],
    [
      `${prefix}/commits/${evidence.headSha}/check-runs?check_name=AgentProof%20%2F%20gate&filter=latest&per_page=100`,
      { total_count: 1, check_runs: [gate] },
    ],
    [`${prefix}/actions/runs/300`, run],
    [`${prefix}/actions/workflows/agentproof-publish.yml`, workflow],
    [
      `${prefix}/actions/runs/300/artifacts?per_page=100`,
      { total_count: 1, artifacts: [artifact] },
    ],
    [`${prefix}/contents/policy/release-policy.yml?ref=${evidence.baseSha}`, policyFile],
    [`${prefix}/issues/${pr.number}/comments?per_page=100&page=1`, []],
    [`${prefix}/issues/comments/701`, transcript],
  ]);
  return {
    sourceOptions: { repository, pullRequestNumber: pr.number, evidenceInput: evidence },
    publicContent: { protectedPolicy, finalEvidence: evidence },
    repo,
    pr,
    gate,
    run,
    workflow,
    artifact,
    policyFile,
    transcript,
    routes,
    prefix,
    request: {
      specialist: "test",
      sessionId: SESSION_ID,
      sessionUrl,
      noteCreatedAt: FIXTURE_TIME,
      publicContent: { protectedPolicy, finalEvidence: evidence },
    },
  };
}
