# AgentProof two-minute recording runbook

## Scope and truth rule

This runbook prepares the source records for the
[1:56 film](../video-script.md). It does not authorize exception acceptance,
approval, merge, release, or permission changes by an agent.

Use actual GitHub records from one synthetic scenario. A completed check
remains genuine evidence when recorded after it ran, but do not call the
edited film a continuous live execution. Any substituted earlier run or
fixture follows [the fallback rules](../fallback/README.md).

Keep all event preparation here, not in the product README.

## Evidence prerequisites

Record non-sensitive references in the
[shot-log template](../assets/agentproof-shot-log.template.md). Keep private
source records in approved storage, not in prompts, fixtures, or this log.

| Item           | Required fact                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Scenario       | One disposable synthetic PR; no customer data or tenant links.                                                               |
| Head A         | Real full 40-character PR head SHA before remediation.                                                                       |
| A evidence     | Actual intended test/dependency failures and raw retention unknown; protected base-policy identity.                          |
| A disposition  | Genuine authorized human exception, eligible under that base policy, with A SHA, rationale, and permitted expiry.            |
| Head B         | Real different full SHA after the relevant fixes; same PR.                                                                   |
| B stale case   | Fresh B evidence contains the old A disposition as `stale`, not expired; retention unresolved.                               |
| B final case   | Separate genuine authorized human B decision if justified; final retention state `exception`; current evidence gate success. |
| Human boundary | Actual configured GitHub independent-review requirement, still pending for the default script.                               |

The policy from the **protected base revision** is authoritative. Do not
change it in the demo branch to permit a more convenient exception.
The base policy used during preparation makes test and dependency failures
non-exceptionable; reverify the selected protected base before capture.

The exception fields to inspect, **not an instruction for an agent to submit**:

```text
/agentproof accept-exception AP-POL-RETENTION-001
sha: <ACTUAL_FULL_HEAD_SHA>
reason: <THE_AUTHORIZED_HUMAN'S_SPECIFIC_JUSTIFICATION>
expires: <ELIGIBLE_DATE_WITHIN_PROTECTED_POLICY>
```

Never use an expired record to claim the opening proves SHA mismatch. Never
copy the A command to B as though the original human decision automatically
applies.

## Preparation: before the recording day

1. Run the existing `npm run check`. Restore declared dependencies only if
   missing or required by a manifest/lockfile change.
2. Reproduce the intended real collectors and remediation in a disposable
   synthetic branch. Advisory databases can change; fix the demonstration
   rather than relabeling a fixture as a live audit.
3. Read the selected protected base policy and actual live repository rules.
   The checked-in ruleset template is not proof of deployment.
4. Obtain any legitimate human decisions needed for the synthetic exercise.
   Each human decides independently; the agent never acts in their place.
5. Preserve capture-ready A and B records. Verify their full SHAs, raw/final
   distinction, policy identity, and artifact identity.
6. Check that the old A exception is still within its expiry at the planned
   capture time. Verify it is `stale` for B.
7. Verify the green-B/pending-review state. If review has already happened,
   adapt the script to the genuine approval record rather than fabricating a
   pending state.
8. Keep the automated-reviewer permission canary disabled. The prior
   `UNSAFE_TOOL_BOUNDARY` result remains a product limitation, not a successful
   automation demonstration.

## Reviewer and board preparation

The default film does not need three separate reviewer-result tours.
If advisory material is shown:

- Finish the deterministic check before manually launching specialists.
- Confirm each actual tool grant is read-only and appropriately scoped.
- Stop on unexpected mutation capabilities. Do not work around the boundary
  or re-enable the canary.
- Manually assemble only matching repository/PR/base/policy/head fragments.
- Show the board's mutable-coordination warning and GitHub authority.
- Do not mix A notes with B evidence or imply that prose overrides the gate.

If the safe runtime is unavailable, omit session footage and disclose that
limitation; the deterministic stale-disposition proof can still be recorded.

## Capture day

1. Prepare a clean application region and notification-free browser profile.
2. Confirm no tokens, authentication dialogs, personal UI, customer data,
   tenant links, or unrelated repository content can enter the capture.
3. Open the six logical surfaces in
   [the recording guide](../video-recording-guide.md).
4. Record H1 (hook), P1 (product proof), H2 (human boundary), F1 (feasibility),
   and V1 (value/end) with handles. Do not try to fit real CI waits into a
   116-second take.
5. Log actual capture time, A expiry, full synthetic SHAs, source references,
   and any editorial/fallback material.
6. Build the first ten seconds and check that an unfamiliar viewer can
   explain the mismatch.
7. Assemble the remainder to [the storyboard](storyboard.md), add the
   presenter's narration, and retime captions.

## Stop conditions

Stop or rewrite the affected claim if:

- a shown record is for another PR, head, base policy, or artifact;
- the old exception expired before capture;
- a source shows `unknown`/`exception` differently from the narration;
- the rules allow a merge the film claims is blocked;
- a human action is missing, unauthorized, or manufactured for the camera;
- the reviewer host exposes mutation tools;
- the authoritative gate behaves incorrectly;
- prohibited information appears.

A network failure is not a pass. A synthetic fixture is not a real check.
An accepted exception is not a passing test or an approval. A green check
alone is not permission to merge.

## After editing

Verify the **actual exported master**, not just the timeline: at most 120
seconds, with voice/caption synchronization, legible evidence, truthful
source labels, and no private information. Complete
[the checklist](../recording-checklist.md). Preserve required GitHub records
under approved retention and follow [cleanup](../../docs/cleanup.md) when
appropriate; do not delete evidence needed for review.
