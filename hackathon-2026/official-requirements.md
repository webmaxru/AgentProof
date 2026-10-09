# Official FY27 GitHub Copilot App Enterprise Challenge requirements

Source reviewed while authenticated:
<https://microsoft.sharepoint.com/teams/GithubSales/SitePages/GitHub-Copilot-App-Enterprise-Challenge.aspx>

Review date: **2026-10-08**.

## Challenge goal

Identify and showcase repeatable, enterprise-ready workflows that use the
GitHub Copilot App to improve how customers, including developers and
non-developers, plan, execute, validate, and scale their work.

The challenge is open to MCAPS FTEs and GitHub-aligned field roles.

## What entrants must build

Submit a repeatable workflow that helps a customer plan, delegate, validate,
review, or ship work using the GitHub Copilot App. The workflow does not have
to be limited to software development.

Entries should explain:

- the customer scenario;
- the business value;
- the adoption path; and
- how field teams can reuse the pattern.

## Required submission assets

1. **Short project summary, 150 words maximum**, explaining the business
   problem, customer/user persona, GitHub Copilot App workflow pattern, and why
   the workflow matters.
2. **Demo video, 3 minutes maximum**, showing the workflow in action.
3. **Repository** containing code, prompts, instructions, configuration,
   connected tools, templates, or other workflow assets. The repository does
   not need to be production-ready.
4. **README** covering roles, prerequisites, governance considerations,
   human-in-the-loop design, and success measures where applicable.

## Scoring

| Criterion                                                                                                                                           | Points |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | -----: |
| Enterprise relevance, applicability, and customer value                                                                                             |     35 |
| Repeatability and field usability: clear setup, reusable instructions, customer-ready narrative, and adoption path                                  |     20 |
| Governance, security, Responsible AI, and human-in-the-loop design: data boundaries, permissions, policy, review model, and enterprise controls     |     20 |
| Clear competitive positioning against Claude Code, including how the design demonstrates GitHub/Azure/MCP/multi-agent/repository-context advantages |     15 |
| Storytelling and demo clarity                                                                                                                       |     10 |
| **Bonus:** product feedback on the GitHub Copilot App                                                                                               |  **5** |

Maximum available score including bonus: **105 points**.

## Design principles

The official page emphasizes:

- competitive differentiation through real-world use cases;
- GitHub integration, multi-agent collaboration, connected enterprise
  context, governance, and human review;
- workflow transformation rather than inventing a net-new product;
- customer repeatability rather than a one-off demo; and
- delegation with review gates at the moments that matter.

## Dates

| Milestone           | Date                             |
| ------------------- | -------------------------------- |
| Kickoff             | September 14, 2026               |
| Submission deadline | **October 9, 2026, 11:59 PM PT** |
| Screening           | October 12-16, 2026              |
| Final presentations | October 19, 2026                 |
| Winners announced   | October 20, 2026                 |

## Submission compliance map

| Requirement                 | AgentProof asset                                                         |
| --------------------------- | ------------------------------------------------------------------------ |
| Summary <=150 words         | `hackathon-2026/README.md`                                               |
| Demo <=3 minutes            | `hackathon-2026/assets/agentproof-submission-master.mp4`                 |
| Reusable repository assets  | root repository, `plugin/`, `templates/`, `policy/`, `docs/`             |
| Roles and prerequisites     | root `README.md`                                                         |
| Governance and human review | `docs/governance-and-threat-model.md`, root `README.md`                  |
| Success measures            | `hackathon-2026/winning-criteria-matrix.md`                              |
| Competitive positioning     | `CLAUDE-COMPARISON.md`, submission deck/video                            |
| Product feedback bonus      | `hackathon-2026/product-feedback-summary.md`, `docs/product-feedback.md` |

This document records challenge requirements. It is not a legal, compliance,
security, or eligibility determination.
