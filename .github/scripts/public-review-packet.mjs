import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AgentProofError,
  assembleEvidence,
  canonicalSha256,
  createReviewFragment,
  loadReleasePolicyYaml,
  parseFinalEvidence,
  sha256,
  timestampSchema,
  verifyArtifactDigest,
} from "@agentproof/evidence-core";
import { assertPositiveInteger, assertRepositoryFullName, githubRequest } from "./github-api.mjs";
import {
  CHECK_NAME,
  isAgentProofCommandCandidate,
  isGitHubActionsCheckRun,
  resolveTrustedWorkflowRevision,
  validateLivePullRequest,
  validateNativePublisherRun,
  validateUnchangedPullRequest,
} from "./workflow-helpers.mjs";
import {
  MAX_REVIEW_REQUEST_BYTES,
  PUBLIC_REVIEW_MODE,
  PUBLIC_REVIEW_PROFILE_VERSION,
  publicReviewerName,
  runCopilotPublicPacket,
} from "./public-review-runtime.mjs";

const POLICY_PATH = "policy/release-policy.yml";
const MAX_PUBLIC_SOURCE_BYTES = 64 * 1024;
const REVIEW_REFUSAL_MARKERS = ["UNSAFE_TOOL_BOUNDARY", "PUBLIC_PACKET_REJECTED"];
const INPUT_KEYS = [
  "baseSha",
  "evidenceArtifactSha256",
  "headSha",
  "policySha256",
  "pullRequestNumber",
  "repository",
  "reviewerNote",
  "workflowRunUrl",
];

function requireCondition(condition, message, code = "AP_REVIEW_SOURCE_REJECTED") {
  if (!condition) throw new AgentProofError(code, message);
}

function boundedJson(value, maximumBytes = MAX_PUBLIC_SOURCE_BYTES) {
  const source = JSON.stringify(value);
  requireCondition(
    typeof source === "string" && Buffer.byteLength(source, "utf8") <= maximumBytes,
    "Public review data exceeds its byte limit.",
  );
  return source;
}

function singleMatch(source, pattern, label) {
  requireCondition(typeof source === "string", `${label} is missing.`);
  const matches = [...source.matchAll(pattern)];
  requireCondition(matches.length === 1, `${label} is missing or ambiguous.`);
  return matches[0][1];
}

function completeCollection(value, key) {
  requireCondition(
    Number.isSafeInteger(value?.total_count) &&
      value.total_count > 0 &&
      value.total_count <= 100 &&
      Array.isArray(value[key]) &&
      value[key].length === value.total_count,
    "Native collection is absent, truncated, or exceeds the supported bound.",
  );
  return value[key];
}

function scopedGet(repository, request) {
  const prefix = `/repos/${repository}`;
  return async (path) => {
    requireCondition(
      path === prefix || path.startsWith(`${prefix}/`),
      "Public review reads must remain in the selected repository.",
    );
    return request(path, { method: "GET" });
  };
}

async function currentDispositions({ get, prefix, evidence }) {
  const comments = [];
  for (let page = 1; ; page += 1) {
    const batch = await get(
      `${prefix}/issues/${evidence.pullRequestNumber}/comments?per_page=100&page=${page}`,
    );
    requireCondition(Array.isArray(batch), "Native disposition comments are unavailable.");
    comments.push(...batch);
    requireCondition(comments.length <= 1000, "Native comment collection exceeds its bound.");
    if (batch.length < 100) break;
  }
  requireCondition(
    new Set(comments.map((comment) => comment.id)).size === comments.length,
    "Native comment collection contains duplicate identities.",
  );
  const records = new Map(evidence.dispositions.map((record) => [record.commentId, record]));
  for (const comment of comments.filter((item) => isAgentProofCommandCandidate(item.body))) {
    requireCondition(records.has(String(comment.id)), "A disposition appeared after evaluation.");
  }
  const state = [];
  for (const record of evidence.dispositions) {
    const comment = comments.find((item) => String(item.id) === record.commentId);
    if (!comment) {
      requireCondition(
        record.status === "deleted" && record.effective === false,
        "A recorded disposition is missing; obtain re-evaluated evidence.",
      );
      state.push({ commentId: record.commentId, deleted: true });
      continue;
    }
    requireCondition(
      comment.user?.login === record.actor &&
        comment.html_url === record.commentUrl &&
        sha256(comment.body) === record.bodySha256 &&
        timestampSchema.parse(comment.updated_at) === record.recordedAt,
      "A native disposition differs from the evaluated record.",
    );
    let permission = "none";
    if (comment.user.type === "User") {
      const native = await get(
        `${prefix}/collaborators/${encodeURIComponent(record.actor)}/permission`,
      );
      permission = native?.permission;
    }
    requireCondition(
      permission === record.actorPermission,
      "Disposition actor permission changed.",
    );
    state.push({ commentId: record.commentId, bodySha256: record.bodySha256, permission });
  }
  return state;
}

export async function resolvePublicReviewSource(
  { repository, pullRequestNumber, evidenceInput },
  { request = githubRequest, now = () => new Date() } = {},
) {
  assertRepositoryFullName(repository);
  assertPositiveInteger(pullRequestNumber, "PR number");
  boundedJson(evidenceInput);
  const evidence = parseFinalEvidence(evidenceInput);
  verifyArtifactDigest(evidence);
  requireCondition(
    evidence.repository === repository && evidence.pullRequestNumber === pullRequestNumber,
    "Candidate evidence does not describe the selected repository and PR.",
  );
  const prefix = `/repos/${repository}`;
  const get = scopedGet(repository, request);
  const [repo, pr] = await Promise.all([get(prefix), get(`${prefix}/pulls/${pullRequestNumber}`)]);
  requireCondition(
    repo?.full_name === repository && repo.private === false && Number.isSafeInteger(repo.id),
    "Only an independently resolved public repository is supported.",
  );
  validateLivePullRequest({
    repository: repo,
    pullRequest: pr,
    expectedPullRequestNumber: pullRequestNumber,
    expectedHeadSha: evidence.headSha,
    expectedBaseSha: evidence.baseSha,
  });
  requireCondition(
    pr.base.repo.id === repo.id &&
      pr.head?.repo?.id === repo.id &&
      pr.html_url === `https://github.com/${repository}/pull/${pullRequestNumber}`,
    "Forks and cross-repository packet inputs are unsupported.",
  );
  const originReferences = evidence.findings
    .filter((finding) => finding.category === "provenance")
    .flatMap((finding) => finding.evidenceRefs)
    .filter((reference) => reference.kind === "pull-request");
  requireCondition(
    originReferences.length === 1 && originReferences[0].sha256 === sha256(pr.body ?? ""),
    "Evidence must bind the current native PR body, not an earlier origin declaration.",
  );
  const [workflowSha, branch, checks] = await Promise.all([
    resolveTrustedWorkflowRevision({ repository: repo }, get),
    get(`${prefix}/branches/${encodeURIComponent(repo.default_branch)}`),
    get(
      `${prefix}/commits/${evidence.headSha}/check-runs?check_name=${encodeURIComponent(CHECK_NAME)}&filter=latest&per_page=100`,
    ),
  ]);
  requireCondition(
    branch?.protected === true &&
      branch.name === repo.default_branch &&
      branch.commit?.sha === workflowSha,
    "Native protected default-branch identity is unavailable or changed.",
  );
  const gate = completeCollection(checks, "check_runs")
    .filter(isGitHubActionsCheckRun)
    .sort((left, right) => right.id - left.id)[0];
  requireCondition(
    gate?.head_sha === evidence.headSha &&
      gate.status === "completed" &&
      gate.conclusion === evidence.gate.conclusion,
    "A genuine completed current-head gate matching the evidence is required.",
  );
  assertPositiveInteger(gate.id, "gate check id");
  const summary = gate.output?.summary;
  requireCondition(
    singleMatch(summary, /^- \*\*Head SHA:\*\* `([0-9a-f]{40})`$/gmu, "Native gate head") ===
      evidence.headSha &&
      singleMatch(
        summary,
        /^- \*\*Policy digest:\*\* `([0-9a-f]{64})`$/gmu,
        "Native policy digest",
      ) === evidence.policy.sha256 &&
      singleMatch(
        summary,
        /^- \*\*Evidence digest:\*\* `([0-9a-f]{64})`$/gmu,
        "Native evidence digest",
      ) === evidence.artifact.sha256,
    "Native gate identity or canonical digests do not match candidate bytes.",
  );
  const runUrl = singleMatch(
    summary,
    /^\[Workflow run\]\((https:\/\/github\.com\/[^)\s]+)\)$/gmu,
    "Native publisher footer",
  );
  const runPrefix = `https://github.com/${repository}/actions/runs/`;
  requireCondition(runUrl.startsWith(runPrefix), "Publisher link leaves the selected repository.");
  const runId = assertPositiveInteger(runUrl.slice(runPrefix.length), "publisher run id");
  requireCondition(evidence.artifact.workflowRunUrl === runUrl, "Evidence publisher link differs.");
  const [run, workflow, artifacts, policyFile] = await Promise.all([
    get(`${prefix}/actions/runs/${runId}`),
    get(`${prefix}/actions/workflows/agentproof-publish.yml`),
    get(`${prefix}/actions/runs/${runId}/artifacts?per_page=100`),
    get(`${prefix}/contents/${POLICY_PATH}?ref=${evidence.baseSha}`),
  ]);
  validateNativePublisherRun({
    run,
    workflow,
    repository: repo,
    expectedRunId: runId,
    expectedRunAttempt: run?.run_attempt,
    expectedHeadSha: workflowSha,
  });
  requireCondition(
    run.html_url === runUrl && run.status === "completed" && run.conclusion === gate.conclusion,
    "Publisher did not finish with the recorded gate outcome.",
  );
  const artifactName = `agentproof-evidence-pr-${pullRequestNumber}-${evidence.headSha}`;
  const matches = completeCollection(artifacts, "artifacts").filter(
    (item) => item.name === artifactName,
  );
  requireCondition(matches.length === 1, "Current final artifact is missing or ambiguous.");
  const artifact = matches[0];
  assertPositiveInteger(artifact.id, "artifact id");
  requireCondition(
    artifact.expired === false &&
      Number.isSafeInteger(artifact.size_in_bytes) &&
      artifact.size_in_bytes > 0 &&
      artifact.size_in_bytes <= 25 * 1024 * 1024 &&
      /^sha256:[0-9a-f]{64}$/u.test(artifact.digest) &&
      artifact.workflow_run?.id === runId &&
      artifact.workflow_run.repository_id === repo.id &&
      artifact.workflow_run.head_branch === repo.default_branch &&
      artifact.workflow_run.head_sha === workflowSha &&
      Date.parse(artifact.created_at) >= Date.parse(run.run_started_at),
    "Native artifact is expired, incomplete, or not bound to this publisher attempt.",
  );
  requireCondition(
    policyFile?.type === "file" &&
      policyFile.path === POLICY_PATH &&
      policyFile.encoding === "base64" &&
      Number.isSafeInteger(policyFile.size) &&
      policyFile.size > 0 &&
      policyFile.size <= 64 * 1024 &&
      typeof policyFile.content === "string",
    "Protected-base policy bytes are unavailable or oversized.",
  );
  const policyBytes = Buffer.from(policyFile.content, "base64");
  const blobSha = createHash("sha1")
    .update(`blob ${policyBytes.length}\0`)
    .update(policyBytes)
    .digest("hex");
  requireCondition(
    policyBytes.length === policyFile.size && blobSha === policyFile.sha,
    "Native policy blob integrity differs.",
  );
  const protectedPolicy = loadReleasePolicyYaml(policyBytes.toString("utf8"));
  requireCondition(
    evidence.policy.path === POLICY_PATH &&
      protectedPolicy.path === POLICY_PATH &&
      evidence.policy.version === protectedPolicy.version &&
      canonicalSha256(protectedPolicy) === evidence.policy.sha256,
    "Candidate policy does not match independently read protected-base policy.",
  );
  const dispositions = await currentDispositions({ get, prefix, evidence });
  const publicContent = { protectedPolicy, finalEvidence: evidence };
  boundedJson(publicContent);
  const [latestRepo, latestBranch, latestChecks, latestRun, latestArtifacts] = await Promise.all([
    get(prefix),
    get(`${prefix}/branches/${encodeURIComponent(repo.default_branch)}`),
    get(
      `${prefix}/commits/${evidence.headSha}/check-runs?check_name=${encodeURIComponent(CHECK_NAME)}&filter=latest&per_page=100`,
    ),
    get(`${prefix}/actions/runs/${runId}`),
    get(`${prefix}/actions/runs/${runId}/artifacts?per_page=100`),
  ]);
  requireCondition(
    latestRepo?.id === repo.id &&
      latestRepo.full_name === repository &&
      latestRepo.private === false &&
      latestRepo.default_branch === repo.default_branch &&
      canonicalSha256(latestBranch) === canonicalSha256(branch) &&
      canonicalSha256(latestChecks) === canonicalSha256(checks) &&
      canonicalSha256(latestRun) === canonicalSha256(run) &&
      canonicalSha256(latestArtifacts) === canonicalSha256(artifacts),
    "Native repository, protection, gate, publisher attempt, or artifact changed during resolution.",
  );
  await resolveTrustedWorkflowRevision({ repository: latestRepo, expectedSha: workflowSha }, get);
  requireCondition(
    canonicalSha256(await currentDispositions({ get, prefix, evidence })) ===
      canonicalSha256(dispositions),
    "Native dispositions changed during resolution.",
  );
  validateUnchangedPullRequest({
    repository: latestRepo,
    pullRequest: await get(`${prefix}/pulls/${pullRequestNumber}`),
    previous: pr,
  });
  const observedAt = now().toISOString();
  requireCondition(
    evidence.generatedAt <= observedAt &&
      evidence.gate.evaluatedAt <= observedAt &&
      (evidence.gate.validUntil === null || evidence.gate.validUntil >= observedAt),
    "Evidence is future-dated or outside its validity horizon.",
  );
  return {
    publicContent,
    publicContentSha256: canonicalSha256(publicContent),
    observedAt,
    freshness: {
      repositoryId: repo.id,
      repository,
      defaultBranch: repo.default_branch,
      workflowSha,
      pullRequestNumber,
      baseSha: pr.base.sha,
      headSha: pr.head.sha,
      headRef: pr.head.ref,
      baseRef: pr.base.ref,
      author: pr.user?.login,
      authorAssociation: pr.author_association,
      pullRequestBodySha256: sha256(pr.body ?? ""),
      checkId: gate.id,
      checkSummarySha256: sha256(summary),
      publisherRunId: runId,
      publisherAttempt: run.run_attempt,
      artifactId: artifact.id,
      nativeArchiveDigest: artifact.digest,
      evidenceArtifactSha256: evidence.artifact.sha256,
      dispositions,
    },
  };
}

async function verifySessionReference(
  { repository, pullRequestNumber, sessionId, sessionUrl, transcriptAuthor },
  request,
) {
  const prefix = `https://github.com/${repository}/pull/${pullRequestNumber}#issuecomment-`;
  requireCondition(
    typeof sessionUrl === "string" && sessionUrl.startsWith(prefix),
    "Use an existing public operator-export comment for this PR, not an invented App session link.",
  );
  const id = assertPositiveInteger(sessionUrl.slice(prefix.length), "session export comment id");
  const comment = await scopedGet(
    repository,
    request,
  )(`/repos/${repository}/issues/comments/${id}`);
  requireCondition(
    comment?.html_url === sessionUrl &&
      comment.user?.type === "User" &&
      comment.user.login === transcriptAuthor &&
      typeof comment.body === "string" &&
      comment.body.includes(`<!-- agentproof-public-session:${sessionId} -->`),
    "The independently resolved session export does not identify this operator and session.",
  );
}

function scopedFindings(evidence, specialist) {
  return evidence.findings.filter((finding) =>
    specialist === "policy"
      ? ["policy", "provenance"].includes(finding.category)
      : finding.category === specialist,
  );
}

export function validatePublicReviewResponse({ response, request }) {
  requireCondition(
    typeof response === "string" &&
      Buffer.byteLength(response, "utf8") <= 8 * 1024 &&
      !REVIEW_REFUSAL_MARKERS.some((marker) => response.includes(marker)),
    "Reviewer refused or exceeded the advisory output bound.",
    "AP_REVIEW_OUTPUT_REJECTED",
  );
  const match = /^\s*```json\r?\n([\s\S]*?)\r?\n```\r?\nSummary: ([^\r\n]{1,1000})\s*$/u.exec(
    response,
  );
  requireCondition(
    match,
    "Expected exactly one JSON input block and Summary sentence.",
    "AP_REVIEW_OUTPUT_REJECTED",
  );
  let input;
  try {
    input = JSON.parse(match[1]);
  } catch {
    throw new AgentProofError("AP_REVIEW_OUTPUT_REJECTED", "Reviewer JSON is malformed.");
  }
  const decodedInput = JSON.stringify(input);
  requireCondition(
    !REVIEW_REFUSAL_MARKERS.some((marker) => decodedInput.includes(marker)),
    "Reviewer JSON contains a decoded refusal marker.",
    "AP_REVIEW_OUTPUT_REJECTED",
  );
  requireCondition(
    input &&
      JSON.stringify(Object.keys(input).sort()) === JSON.stringify(INPUT_KEYS) &&
      input.workflowRunUrl === null,
    "Reviewer must emit only the closed fragment INPUT shape; no wrapper, digest, or gate fields.",
    "AP_REVIEW_OUTPUT_REJECTED",
  );
  const evidence = request.publicContent.finalEvidence;
  const fragment = createReviewFragment(input);
  assembleEvidence(evidence, [fragment]);
  requireCondition(
    fragment.reviewerNote.specialist === request.specialist &&
      fragment.reviewerNote.sessionUrl === request.sessionUrl &&
      fragment.reviewerNote.createdAt === request.noteCreatedAt,
    "Reviewer changed its specialist, native export link, or host-supplied timestamp.",
    "AP_REVIEW_OUTPUT_REJECTED",
  );
  const findings = scopedFindings(evidence, request.specialist);
  requireCondition(
    findings.length > 0 &&
      JSON.stringify([...fragment.reviewerNote.findingIds].sort()) ===
        JSON.stringify(findings.map((finding) => finding.id).sort()),
    "Cite every deterministic finding in the specialist scope exactly once.",
    "AP_REVIEW_OUTPUT_REJECTED",
  );
  for (const finding of findings) {
    const states = [
      ...fragment.reviewerNote.summary.matchAll(
        new RegExp(`\\b${finding.id}: (pass|fail|unknown|exception)\\b`, "gu"),
      ),
    ];
    requireCondition(
      states.length === 1 && states[0][1] === finding.state,
      "Reviewer summary must preserve each cited finding's exact deterministic state.",
      "AP_REVIEW_OUTPUT_REJECTED",
    );
  }
  return input;
}

export async function reviewPublicPacket(
  options,
  { request = githubRequest, now = () => new Date(), execute } = {},
) {
  const {
    repository,
    pullRequestNumber,
    evidenceInput,
    specialist,
    sessionId,
    sessionUrl,
    transcriptAuthor,
  } = options;
  publicReviewerName(specialist);
  const sourceOptions = { repository, pullRequestNumber, evidenceInput };
  const source = await resolvePublicReviewSource(sourceOptions, { request, now });
  const findings = scopedFindings(source.publicContent.finalEvidence, specialist);
  requireCondition(
    findings.length > 0 &&
      findings.length <= 50 &&
      findings.map((finding) => `${finding.id}: ${finding.state}`).join("; ").length <= 1000,
    "The specialist scope cannot fit the bounded advisory note; do not launch or truncate it.",
  );
  requireCondition(
    options.dataClassification === "public-synthetic" &&
      options.approvedPublicContentSha256 === source.publicContentSha256,
    "The trusted operator must approve this exact bounded public/synthetic content, not a model assertion.",
  );
  await verifySessionReference(
    { repository, pullRequestNumber, sessionId, sessionUrl, transcriptAuthor },
    request,
  );
  const reviewRequest = {
    mode: PUBLIC_REVIEW_MODE,
    profileVersion: PUBLIC_REVIEW_PROFILE_VERSION,
    specialist,
    sessionId,
    sessionUrl,
    sessionUrlMeaning:
      "Operator-published local CLI export, not an App/cloud session or approval. The operator must append this actual review before assembly.",
    noteCreatedAt: now().toISOString(),
    verifiedAt: source.observedAt,
    publicContent: source.publicContent,
    scope:
      "Advisory normalized evidence only. No source checkout, arbitrary fetches, scanners, mutations, or human decisions. The host, not the model, verifies native tools and freshness.",
  };
  // JSON escapes preserve approved values without triggering native @file preprocessing.
  const serialized = boundedJson(reviewRequest, MAX_REVIEW_REQUEST_BYTES).replaceAll(
    "@",
    "\\u0040",
  );
  const native = await runCopilotPublicPacket(
    {
      executable: options.executable,
      executableSha256: options.executableSha256,
      captureDirectory: options.captureDirectory,
      specialist,
      sessionId,
      request: serialized,
    },
    execute,
  );
  const verification = { status: "blocked", mode: PUBLIC_REVIEW_MODE, sessionId };
  try {
    const input = validatePublicReviewResponse({
      response: native.response,
      request: reviewRequest,
    });
    await verifySessionReference(
      { repository, pullRequestNumber, sessionId, sessionUrl, transcriptAuthor },
      request,
    );
    const current = await resolvePublicReviewSource(sourceOptions, { request, now });
    requireCondition(
      canonicalSha256(current.freshness) === canonicalSha256(source.freshness) &&
        current.publicContentSha256 === source.publicContentSha256,
      "Native identity, policy, gate, disposition, or artifact changed during review.",
    );
    Object.assign(verification, {
      status: "advisory-input-verified-not-published",
      headSha: input.headSha,
      evidenceArtifactSha256: input.evidenceArtifactSha256,
      requestSha256: native.requestSha256,
      stdoutSha256: native.stdoutSha256,
    });
    return { ...verification, input, request: reviewRequest, response: native.response, native };
  } catch (error) {
    verification.errorCode =
      error instanceof AgentProofError ? error.code : "AP_REVIEW_VERIFICATION_ERROR";
    throw error;
  } finally {
    await writeFile(
      join(options.captureDirectory, "review-verification.json"),
      `${JSON.stringify(verification, null, 2)}\n`,
      {
        flag: "wx",
        mode: 0o600,
      },
    );
  }
}
