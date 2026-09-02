# AgentProof demo runbook

## Truth rule

Show live GitHub/App state whenever available. A completed real check may be
opened after it ran; that is still a real record. If any screenshot, clip, or
fixture substitutes for live state, display **PRECOMPUTED / NOT LIVE** for its
entire use and say so. Never present `demo/synthetic-findings.json` as scanner
output.

## Required placeholders

- Repository: `<OWNER>/<REPO>`
- Unsafe PR: `<PR_URL>`
- Unsafe head: `<UNSAFE_40_CHAR_SHA>`
- Remediated head: `<REMEDIATED_40_CHAR_SHA>`
- Release manager: `<RELEASE_MANAGER_LOGIN>`
- Independent reviewer: `<INDEPENDENT_REVIEWER_LOGIN>`
- Expiry (within base-policy maximum): `<YYYY-MM-DD>`
- Session/deep links: `<TEST>`, `<SECURITY>`, `<POLICY>`, `<ASSEMBLER>`,
  `<REMEDIATION>`

Deep links require the presenter to review and confirm; open all needed tabs in
advance rather than implying a link silently creates a session or automation.

## T-24 hours

1. Run `npm ci` and `npm run check`.
2. Verify the selected vulnerable dependency still produces the expected real
   normalized advisory; if advisory service behavior changed, repair the demo
   before recording rather than relabel a fixture as live.
3. Validate unsafe patch on a disposable branch and confirm exactly the
   intended dependency fail, missing-authorization-test fail, and retention
   unknown.
4. Validate the real remediation commit upgrades the dependency and restores
   the stable marker on the existing authorization test without completing the
   retention declaration.
5. Exercise unauthorized, stale-SHA, edit/delete, expiry, red-with-approval, and
   green-without-approval acceptance tests.
6. Confirm action pins, workflow permissions, personal automation tools, and
   ruleset. Confirm no secret/customer data exists.
7. Cold-review the 2:54 storyboard with one technical and one non-technical
   viewer.

## T-30 minutes

1. Use a clean browser profile; hide bookmarks, notifications, tenant/account
   details, and unrelated repositories.
2. Sign in presenter/release manager in the main profile and independent
   reviewer in an isolated profile.
3. Set zoom so SHA, check name, finding states, and captions are readable.
4. Open tabs in storyboard order:
   - unsafe PR body and red `AgentProof / gate`;
   - three specialist session results;
   - Evidence Board loaded with unsafe-head evidence;
   - release-manager PR comment box;
   - remediation session with the real diff ready to push;
   - Actions/PR view ready to show stale and then fresh evidence;
   - independent-review profile;
   - README/templates and three-slide outline.
5. Copy the exact unsafe and expected remediated SHAs into presenter-only notes.
6. Pre-type only the allowed exception skeleton; verify finding ID, full live
   SHA, rationale, and expiry immediately before submission.
7. Start recording at the PR, not a title slide.

## Exact live sequence

Follow `demo/storyboard.md` without adding time:

1. **0:00:** show unsafe SHA/origin and red gate.
2. **0:14:** show check evidence and all three same-SHA sessions.
3. **0:31:** show three findings and mutable-canvas authority banner.
4. **0:51:** submit the retention exception:

   ```text
   /agentproof accept-exception AP-POL-RETENTION-001
   sha: <UNSAFE_40_CHAR_SHA>
   reason: Synthetic demo data remains bounded while the retention declaration is corrected.
   expires: <YYYY-MM-DD>
   ```

   Use the actual stable finding ID emitted by the check if it differs.

5. **1:09:** show and push real dependency/test remediation.
6. **1:33:** match the live new SHA and show the previous exception is stale.
7. **1:51:** open fresh same-SHA evidence and submit a newly generated retention
   exception using `<REMEDIATED_40_CHAR_SHA>`.
8. **2:12:** show green gate and match final evidence SHA/digest.
9. **2:32:** approve from the distinct reviewer profile; show merge available,
   but do not merge.
10. **2:43:** show the kit and four explicit boundaries; stop by **2:54**.

## Go/no-go checks while recording

- Stop if a displayed evidence/check/comment SHA differs from the live PR head.
- Stop if any specialist fragment is for another SHA.
- Stop if an account, notification, secret, customer/tenant identifier, or
  unrelated content appears.
- Stop if ruleset or check behavior differs from the narration.
- Do not call a network/tool failure a pass.
- Do not say “compliant,” “secure,” “verified author,” “immutable canvas,”
  “automation-as-code,” or “automatic approval.”

## Continuity fallback

If a live App surface fails or a workflow exceeds the segment budget, follow
`demo/fallback/README.md`. Use only a previously captured real run or the
synthetic fixture with the required persistent label. State what is simulated,
return to live GitHub authority as soon as possible, and never splice a
different SHA into the same claimed evidence chain.

## After the take

1. Verify runtime is at most 2:54 and captions are readable.
2. Frame-check every second for private data.
3. Confirm every SHA and claim against GitHub/repository evidence.
4. Confirm any fallback is continuously labeled and mentioned.
5. Preserve the chosen real check/artifact URLs under approved retention.
6. Perform [cleanup](../docs/cleanup.md) after submission.
