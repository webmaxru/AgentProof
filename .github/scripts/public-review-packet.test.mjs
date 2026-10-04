import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  assembleEvidence,
  canonicalSha256,
  createReviewFragment,
  sha256,
  withArtifactDigest,
} from "@agentproof/evidence-core";
import {
  FIXTURE_TIME,
  nativeEvents,
  nativeJsonl,
  publicSourceFixture,
  reviewInput,
  reviewResponse,
  SESSION_ID,
} from "./public-review-fixtures.mjs";
import {
  resolvePublicReviewSource,
  reviewPublicPacket,
  validatePublicReviewResponse,
} from "./public-review-packet.mjs";
import { SUPPORTED_COPILOT_VERSION } from "./public-review-runtime.mjs";

function nativeReader(fixture, paths = []) {
  return async (path, options) => {
    assert.deepEqual(options, { method: "GET" });
    assert.ok(path === fixture.prefix || path.startsWith(`${fixture.prefix}/`));
    paths.push(path);
    assert.ok(fixture.routes.has(path), `Unexpected fixture read: ${path}`);
    return structuredClone(fixture.routes.get(path));
  };
}

const now = () => new Date(FIXTURE_TIME);

function refreshSyntheticEvidence(fixture) {
  const evidence = fixture.sourceOptions.evidenceInput;
  const previousDigest = evidence.artifact.sha256;
  Object.assign(evidence, withArtifactDigest(evidence));
  fixture.gate.output.summary = fixture.gate.output.summary.replace(
    previousDigest,
    evidence.artifact.sha256,
  );
}

test("host resolves native public identity, old PR base, current workflow, policy and canonical bytes", async () => {
  const fixture = await publicSourceFixture();
  const paths = [];
  const source = await resolvePublicReviewSource(fixture.sourceOptions, {
    request: nativeReader(fixture, paths),
    now,
  });
  assert.deepEqual(source.publicContent, fixture.publicContent);
  assert.notEqual(source.freshness.workflowSha, source.freshness.baseSha);
  assert.equal(source.publicContentSha256, canonicalSha256(fixture.publicContent));
  assert.ok(
    paths.includes(
      `${fixture.prefix}/contents/policy/release-policy.yml?ref=${fixture.pr.base.sha}`,
    ),
  );
  assert.ok(
    !paths.some((path) =>
      path.includes("contents/policy/release-policy.yml?ref=" + fixture.pr.head.sha),
    ),
  );
  assert.deepEqual(source.publicContent.finalEvidence.gate.counts, {
    pass: 1,
    fail: 1,
    unknown: 1,
    exception: 1,
  });
});

for (const [label, mutate] of [
  [
    "private repository",
    (f) => {
      f.repo.private = true;
    },
  ],
  [
    "foreign base repository",
    (f) => {
      f.pr.base.repo.id = 999;
    },
  ],
  [
    "forked head",
    (f) => {
      f.pr.head.repo.id = 999;
    },
  ],
  [
    "closed PR",
    (f) => {
      f.pr.state = "closed";
    },
  ],
  [
    "changed head",
    (f) => {
      f.pr.head.sha = "4".repeat(40);
    },
  ],
  [
    "changed base",
    (f) => {
      f.pr.base.sha = "4".repeat(40);
    },
  ],
  [
    "abbreviated head",
    (f) => {
      f.pr.head.sha = "deadbeef";
    },
  ],
  [
    "edited origin body",
    (f) => {
      f.pr.body = "Changed before review.";
    },
  ],
  [
    "missing body binding",
    (f) => {
      f.sourceOptions.evidenceInput.findings.at(-1).evidenceRefs = [];
    },
  ],
  [
    "unprotected branch",
    (f) => {
      f.routes.get(`${f.prefix}/branches/main`).protected = false;
    },
  ],
  [
    "changed default ref",
    (f) => {
      f.routes.get(`${f.prefix}/git/ref/heads/main`).object.sha = "4".repeat(40);
    },
  ],
  [
    "non-Actions check",
    (f) => {
      f.gate.app.id = 99;
    },
  ],
  [
    "pending gate",
    (f) => {
      f.gate.status = "in_progress";
    },
  ],
  [
    "wrong gate head",
    (f) => {
      f.gate.head_sha = "4".repeat(40);
    },
  ],
  [
    "wrong gate conclusion",
    (f) => {
      f.gate.conclusion = "success";
    },
  ],
  [
    "wrong native digest",
    (f) => {
      f.gate.output.summary = f.gate.output.summary.replace(
        f.sourceOptions.evidenceInput.artifact.sha256,
        "f".repeat(64),
      );
    },
  ],
  [
    "ambiguous footer",
    (f) => {
      f.gate.output.summary += `\n[Workflow run](${f.run.html_url})`;
    },
  ],
  [
    "foreign publisher URL",
    (f) => {
      f.gate.output.summary = f.gate.output.summary.replace(
        f.run.html_url,
        "https://github.com/another/repo/actions/runs/300",
      );
    },
  ],
  [
    "unexpected workflow",
    (f) => {
      f.workflow.path = ".github/workflows/untrusted.yml";
    },
  ],
  [
    "foreign native run",
    (f) => {
      f.run.repository = { id: 999, full_name: "another/repo" };
    },
  ],
  [
    "publisher wrong revision",
    (f) => {
      f.run.head_sha = f.pr.head.sha;
    },
  ],
  [
    "publisher incomplete",
    (f) => {
      f.run.status = "in_progress";
    },
  ],
  [
    "expired artifact",
    (f) => {
      f.artifact.expired = true;
    },
  ],
  [
    "artifact wrong native run",
    (f) => {
      f.artifact.workflow_run.id = 301;
    },
  ],
  [
    "artifact wrong repository",
    (f) => {
      f.artifact.workflow_run.repository_id = 999;
    },
  ],
  [
    "artifact predates attempt",
    (f) => {
      f.artifact.created_at = "2026-09-02T08:00:00.000Z";
    },
  ],
  [
    "artifact renamed",
    (f) => {
      f.artifact.name += "-rebound";
    },
  ],
  [
    "missing archive digest",
    (f) => {
      delete f.artifact.digest;
    },
  ],
  [
    "ambiguous artifact",
    (f) => {
      const collection = f.routes.get(`${f.prefix}/actions/runs/300/artifacts?per_page=100`);
      collection.artifacts.push({ ...f.artifact, id: 501 });
      collection.total_count++;
    },
  ],
  [
    "truncated artifact collection",
    (f) => {
      f.routes.get(`${f.prefix}/actions/runs/300/artifacts?per_page=100`).total_count = 101;
    },
  ],
  [
    "wrong policy path",
    (f) => {
      f.policyFile.path = "other-policy.yml";
    },
  ],
  [
    "tampered native policy bytes",
    (f) => {
      f.policyFile.content = Buffer.from("invalid policy").toString("base64");
    },
  ],
  [
    "candidate digest tampering",
    (f) => {
      f.sourceOptions.evidenceInput.findings[0].state = "fail";
    },
  ],
  [
    "new disposition",
    (f) => {
      f.routes
        .get(`${f.prefix}/issues/7/comments?per_page=100&page=1`)
        .push({ id: 800, body: "/agentproof accept-exception AP-POL-RETENTION-001" });
    },
  ],
]) {
  test(`source resolver rejects ${label}`, async () => {
    const fixture = await publicSourceFixture();
    mutate(fixture);
    await assert.rejects(
      resolvePublicReviewSource(fixture.sourceOptions, { request: nativeReader(fixture), now }),
    );
  });
}

test("native API failure is blocking rather than a success-shaped packet", async () => {
  const fixture = await publicSourceFixture();
  await assert.rejects(
    resolvePublicReviewSource(fixture.sourceOptions, {
      request: async () => {
        throw new Error("Synthetic native read outage");
      },
      now,
    }),
    /Synthetic native read outage/u,
  );
});

test("a disposition introduced during source resolution blocks the final freshness check", async () => {
  const fixture = await publicSourceFixture();
  const read = nativeReader(fixture);
  let commentReads = 0;
  await assert.rejects(
    resolvePublicReviewSource(fixture.sourceOptions, {
      now,
      request: async (path, options) => {
        const result = await read(path, options);
        if (path.endsWith("/comments?per_page=100&page=1") && ++commentReads === 2) {
          result.push({ id: 800, body: "/agentproof accept-exception AP-POL-RETENTION-001" });
        }
        return result;
      },
    }),
    /disposition appeared/u,
  );
  assert.equal(commentReads, 2);
});

for (const specialist of ["test", "security", "policy"]) {
  test(`${specialist} output preserves all scoped states and only returns fragment input`, async () => {
    const fixture = await publicSourceFixture();
    fixture.request.specialist = specialist;
    const input = reviewInput(fixture.request);
    assert.deepEqual(
      validatePublicReviewResponse({ response: reviewResponse(input), request: fixture.request }),
      input,
    );
    assert.equal(input.artifact, undefined);
    const assembled = assembleEvidence(fixture.publicContent.finalEvidence, [
      createReviewFragment(input),
    ]);
    assert.deepEqual(assembled.findings, fixture.publicContent.finalEvidence.findings);
    assert.deepEqual(assembled.gate, fixture.publicContent.finalEvidence.gate);
    assert.deepEqual(assembled.dispositions, fixture.publicContent.finalEvidence.dispositions);
  });
}

test("public JSON preserves approved values while escaping native file-mention markers", async (t) => {
  const { fixture, options, calls, execute } = await runFixture(t);
  fixture.sourceOptions.evidenceInput.findings[0].summary += " Package @fixture/example.";
  refreshSyntheticEvidence(fixture);
  options.approvedPublicContentSha256 = canonicalSha256(fixture.publicContent);
  const result = await reviewPublicPacket(options, {
    request: nativeReader(fixture),
    now,
    execute,
  });
  const prompt = calls.at(-1).at(-1);
  assert.ok(!prompt.includes("@"));
  assert.ok(prompt.includes("\\u0040fixture/example"));
  assert.deepEqual(JSON.parse(prompt).publicContent, fixture.publicContent);
  assert.deepEqual(result.request.publicContent, fixture.publicContent);
});

test("a scope too large for the bounded note blocks before launching a reviewer", async (t) => {
  const { fixture, options, calls, execute } = await runFixture(t);
  const evidence = fixture.sourceOptions.evidenceInput;
  const extraFindings = Array.from({ length: 24 }, (_, index) => ({
    ...evidence.findings[0],
    id: `AP-TEST-SYNTHETIC-LONG-FINDING-FOR-NOTE-BOUND-${index}`,
  }));
  evidence.findings.push(...extraFindings);
  evidence.gate.counts.pass += extraFindings.length;
  refreshSyntheticEvidence(fixture);
  options.approvedPublicContentSha256 = canonicalSha256(fixture.publicContent);
  await assert.rejects(
    reviewPublicPacket(options, {
      request: nativeReader(fixture),
      now,
      execute,
    }),
    /cannot fit the bounded advisory note/u,
  );
  assert.equal(calls.length, 0);
});

for (const [label, mutate] of [
  [
    "wrapper fields",
    (input) => {
      input.documentType = "review-fragment";
    },
  ],
  [
    "gate override",
    (input) => {
      input.gate = { conclusion: "success" };
    },
  ],
  [
    "wrong repository",
    (input) => {
      input.repository = "another/repo";
    },
  ],
  [
    "wrong PR",
    (input) => {
      input.pullRequestNumber = 8;
    },
  ],
  [
    "old full head",
    (input) => {
      input.headSha = "4".repeat(40);
      input.reviewerNote.sourceSha = input.headSha;
    },
  ],
  [
    "short head",
    (input) => {
      input.headSha = "deadbeef";
    },
  ],
  [
    "wrong policy digest",
    (input) => {
      input.policySha256 = "f".repeat(64);
    },
  ],
  [
    "wrong evidence digest",
    (input) => {
      input.evidenceArtifactSha256 = "f".repeat(64);
    },
  ],
  [
    "wrong specialist",
    (input) => {
      input.reviewerNote.specialist = "security";
    },
  ],
  [
    "invented session link",
    (input) => {
      input.reviewerNote.sessionUrl = "https://example.invalid";
    },
  ],
  [
    "invented timestamp",
    (input) => {
      input.reviewerNote.createdAt = "2026-09-01T09:00:00.000Z";
    },
  ],
  [
    "unknown finding",
    (input) => {
      input.reviewerNote.findingIds = ["AP-TEST-INVENTED-001"];
    },
  ],
  [
    "missing finding",
    (input) => {
      input.reviewerNote.findingIds = [];
    },
  ],
  [
    "duplicate finding",
    (input) => {
      input.reviewerNote.findingIds.push(input.reviewerNote.findingIds[0]);
    },
  ],
  [
    "changed state",
    (input) => {
      input.reviewerNote.summary = "AP-TEST-SUITE-001: fail";
    },
  ],
  [
    "conflicting states",
    (input) => {
      input.reviewerNote.summary += "; AP-TEST-SUITE-001: fail";
    },
  ],
  [
    "fabricated workflow",
    (input) => {
      input.workflowRunUrl = "https://example.invalid";
    },
  ],
]) {
  test(`advisory output rejects ${label}`, async () => {
    const fixture = await publicSourceFixture();
    const input = reviewInput(fixture.request);
    mutate(input);
    assert.throws(() =>
      validatePublicReviewResponse({ response: reviewResponse(input), request: fixture.request }),
    );
  });
}

test("packet rejection, safe self-report, extra prose and malformed JSON never become a fragment", async () => {
  const fixture = await publicSourceFixture();
  for (const response of [
    "UNSAFE_TOOL_BOUNDARY",
    "PUBLIC_PACKET_REJECTED",
    '{"effectiveTools":[],"toolCalls":0}',
    `${reviewResponse(reviewInput(fixture.request))}\nExtra unbounded section`,
    "```json\n{bad}\n```\nSummary: Invalid.",
  ]) {
    assert.throws(() => validatePublicReviewResponse({ response, request: fixture.request }));
  }
});

async function runFixture(t, specialist = "test") {
  const priorToken = process.env.COPILOT_GITHUB_TOKEN;
  process.env.COPILOT_GITHUB_TOKEN = "synthetic-native-auth";
  t.after(() => {
    if (priorToken === undefined) delete process.env.COPILOT_GITHUB_TOKEN;
    else process.env.COPILOT_GITHUB_TOKEN = priorToken;
  });
  const fixture = await publicSourceFixture();
  const root = await mkdtemp(join(tmpdir(), "agentproof-packet-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const executable = join(root, "synthetic-executable");
  await writeFile(executable, "SYNTHETIC EXECUTABLE FIXTURE, NEVER EXECUTED");
  const options = {
    ...fixture.sourceOptions,
    dataClassification: "public-synthetic",
    approvedPublicContentSha256: canonicalSha256(fixture.publicContent),
    specialist,
    sessionId: SESSION_ID,
    sessionUrl: fixture.request.sessionUrl,
    transcriptAuthor: "fixture-operator",
    executable,
    executableSha256: sha256(await readFile(executable)),
    captureDirectory: join(root, "capture"),
  };
  const calls = [];
  const execute = async (_executable, args) => {
    calls.push(args);
    if (args.includes("--version")) {
      return { exitCode: 0, stdout: `GitHub Copilot CLI ${SUPPORTED_COPILOT_VERSION}.\n` };
    }
    const serialized = args.at(-1);
    const response = reviewResponse(reviewInput(JSON.parse(serialized)));
    return {
      exitCode: 0,
      stdout: nativeJsonl(nativeEvents(serialized, response, new Date().toISOString())),
    };
  };
  return { fixture, options, calls, execute };
}

for (const specialist of ["test", "security", "policy"]) {
  test(`host ${specialist} path enforces launch, native evidence, output and current source checks`, async (t) => {
    const { fixture, options, calls, execute } = await runFixture(t, specialist);
    const paths = [];
    const result = await reviewPublicPacket(options, {
      request: nativeReader(fixture, paths),
      now,
      execute,
    });
    assert.equal(result.status, "advisory-input-verified-not-published");
    assert.equal(result.input.reviewerNote.specialist, specialist);
    assert.equal(result.native.toolCalls, 0);
    assert.equal(calls.length, 2);
    assert.equal(paths.filter((path) => path === `${fixture.prefix}/pulls/7`).length, 4);
    assert.deepEqual(result.request.publicContent, fixture.publicContent);
    assert.equal(result.fragment, undefined);
  });
}

test("changed native source after the model answer preserves the capture but blocks output", async (t) => {
  const { fixture, options, execute } = await runFixture(t);
  await assert.rejects(
    reviewPublicPacket(options, {
      request: nativeReader(fixture),
      now,
      execute: async (executable, args, processOptions) => {
        const output = await execute(executable, args, processOptions);
        if (!args.includes("--version")) fixture.pr.head.sha = "4".repeat(40);
        return output;
      },
    }),
    /head changed/u,
  );
  const receipt = JSON.parse(
    await readFile(join(options.captureDirectory, "review-verification.json"), "utf8"),
  );
  assert.equal(receipt.status, "blocked");
  assert.ok((await readFile(join(options.captureDirectory, "native.jsonl"), "utf8")).length > 0);
});

test("unapproved data, missing export and unsupported versions never start a model review", async (t) => {
  const { fixture, options, calls, execute } = await runFixture(t);
  const dependencies = { request: nativeReader(fixture), now, execute };
  for (const changed of [
    { dataClassification: "private" },
    { approvedPublicContentSha256: "0".repeat(64) },
    { sessionUrl: "https://github.com/copilot/agents/invented" },
    { transcriptAuthor: "another-operator" },
  ]) {
    await assert.rejects(reviewPublicPacket({ ...options, ...changed }, dependencies));
  }
  assert.equal(calls.length, 0);
  await assert.rejects(
    reviewPublicPacket(options, {
      ...dependencies,
      execute: async (_executable, args) => {
        assert.ok(args.includes("--version"));
        return { exitCode: 0, stdout: "GitHub Copilot CLI unsupported.\n" };
      },
    }),
    { code: "AP_REVIEW_RUNTIME_UNSUPPORTED" },
  );
  const receipt = JSON.parse(
    await readFile(join(options.captureDirectory, "runtime-receipt.json"), "utf8"),
  );
  assert.equal(receipt.cliVersion, null);
  assert.equal(receipt.expectedCliVersion, SUPPORTED_COPILOT_VERSION);
});
