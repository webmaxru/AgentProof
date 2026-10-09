# FY27 Q1 GHCP App Challenge submission

## 1. Project summary

Enterprise customers want AI speed without losing release accountability.
AgentProof is a repeatable GitHub Copilot App workflow for release leads
reviewing AI-assisted changes. A pull request triggers no-secret collectors
for tests, dependencies, data handling, and origin. Policy is loaded from the
protected base revision, so the proposed change cannot weaken its own rules.
Read-only Copilot specialists explain the same commit-bound evidence; the
Evidence Board Canvas turns pass, fail, unknown, and exception into one
decision surface. GitHub checks, artifacts, comments, reviews, and rules remain
authoritative. If code changes, earlier evidence and human dispositions become
stale. Agents may propose remediation, but only authorized humans can record
bounded exceptions or approve. The reusable field kit includes agents, skills,
schemas, templates, tests, governance guidance, and measurable adoption steps.
It produces traceable evidence, not a legal or compliance determination.

**Word count:** 134

## 2. Demo video URL

<https://github.com/msft-common-demos/AgentProof/raw/masalnik-msdemo-hackathon-submission-7b4/hackathon-2026/assets/agentproof-submission-master.mp4>

The 2:44 master includes a recorded walkthrough of the running Evidence Board
Canvas: filtering to the unresolved finding, inspecting evidence, drafting a
full-SHA human command, and showing stale/expired disposition history. It is
continuously identified as synthetic or staged and never depicts an agent
approving, merging, or releasing.

## 3. Workflow repository URL

<https://github.com/msft-common-demos/AgentProof/tree/masalnik-msdemo-hackathon-submission-7b4>

## 4. Architecture or workflow deck URL

<https://github.com/msft-common-demos/AgentProof/raw/masalnik-msdemo-hackathon-submission-7b4/hackathon-2026/assets/agentproof-form-submission-deck.pptx>

The deck contains exactly three slides: the enterprise problem and live Canvas,
the six-step governed workflow, and the competitive/adoption story.

## 5. Competitive edge against Claude Code

Claude Code and GitHub Copilot can both edit code and invoke connected tools.
AgentProof does not claim model superiority. It demonstrates the advantage of a
GitHub-native control loop: repository context, protected-base policy, checks,
artifacts, comments, reviews, rules, specialist agents, and the Evidence Board
all stay bound to the same full pull-request head SHA. When code changes,
earlier evidence and decisions become stale instead of silently following the
new code. The Canvas makes that governance understandable, while GitHub remains
the authoritative enforcement and audit boundary. Agents explain and draft;
eligible humans approve. That integrated, repeatable handoff is the competitive
edge.

## 6. Product feedback on the GitHub Copilot App

**Strength:** Canvas turns a complex multi-agent workflow into a clear,
interactive decision surface without moving authority out of GitHub.

**Limitation found:** selecting only read-only tools in the automation picker
did not guarantee a read-only effective runtime; mutation-capable tools were
still exposed. Our permission canary failed closed, and we disabled the
automation rather than treating the selection UI as proof.

**Requested improvement:** show the effective runtime tool grant before launch,
highlight differences from the user's selection, provide a machine-readable
grant manifest to the session, and support a policy-enforced read-only mode.
This would make delegated enterprise workflows easier to review, reproduce,
and trust.

## 7. Team members' aliases

masalnik@microsoft.com

## Access check before submission

- Confirm judges can open the private repository branch.
- Open the video and deck URLs in an authenticated browser.
- If repository access cannot be granted broadly enough, upload the same MP4
  and PPTX to Microsoft 365 and replace only the two asset URLs.
- Do not submit the form until all three URLs open from a separate session.
