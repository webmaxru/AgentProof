# Cleanup

Cleanup must cover the App and GitHub; deleting local files does not remove
personal automations or remote evidence.

## Copilot App

1. Disable and then delete the personal Test, Security, and Policy automations.
2. Confirm no scheduled/manual automation remains for `<OWNER>/<REPO>`.
3. Close disposable specialist, assembler, and remediation sessions according
   to the organization's retention policy.
4. Clear Evidence Board state. Remember that clearing a mutable canvas does not
   delete GitHub records.
5. Uninstall the development/marketplace AgentProof plugin if it is no longer
   approved or needed.
6. Remove any saved deep-link bookmarks and manual automation inventory entry.

Automations are personal and stored outside Git, so repeat these steps for each
owner who created one.

## GitHub

1. Close the synthetic demo PR without merging, or preserve the merged record
   only if the approved demonstration-retention policy requires it.
2. Delete disposable demo branches after recording any authorized evidence.
3. Disable/remove the AgentProof ruleset and optional environment only when the
   repository is being retired; do not leave a protected production branch
   weaker than its approved baseline.
4. Delete Actions artifacts/logs using GitHub's supported UI/API if immediate
   removal is required; otherwise verify configured expiry. Artifact retention
   is finite but not instantaneous.
5. Remove repository variables/secrets accidentally created for testing. The
   MVP requires none; investigate any that exist rather than exposing values.
6. Remove collaborators/teams granted only for the demo.
7. Archive or delete `<OWNER>/<REPO>` under the owner's approved process.
8. If screenshots/video remain, retain only redacted, synthetic, clearly
   labeled assets and delete superseded captures.

## Local machine

From outside the clone, delete the local `AgentProof` directory using the
operating system's normal deletion process after preserving authorized work.
Also remove any separately downloaded evidence artifacts or recordings. Do not
delete shared Node/npm caches as part of this project cleanup.

## Verify

- No personal automation targets the retired repository.
- No plugin development install remains.
- No open PR, branch, ruleset bypass, environment, or temporary collaborator
  remains unintentionally.
- Evidence/media retention matches the approved policy.
- No customer data, token, tenant URL, or secret was introduced.

Cleanup removes the prototype; it does not retroactively revoke copies already
downloaded by authorized repository readers.
