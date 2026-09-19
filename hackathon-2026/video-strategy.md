# Why this two-minute story

## Editorial decision

Lead with **"The code changed. Should the old exception still count?"**
Show an unexpired exception becoming stale before ten seconds. Then answer
four questions: who needs this, what actually works, why it matters to
Microsoft, and what a credible next implementation step would be.

The previous sequence reserved the most distinctive behavior for late in the
film and ended on the disabled permission canary. This cut puts the
demonstrable surprise first and ends on customer value and human
accountability. The canary limitation remains explicit in the packet and the
script; it is not represented as a working automation.

**Interpretation of "NLP":** ethical, plain-language persuasion: a concrete
question, contrast, a promptly resolved curiosity gap, audience relevance,
and rhythmic phrasing. This plan does not rely on neurolinguistic-programming
claims, subliminal cues, fear tactics, or a supposed universal eight-second
attention span.

## The audience's sequence of questions

| Time      | Question in the viewer's mind                         | How the film earns the answer                                                                        |
| --------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 0:00-0:10 | "Why is an unexpired exception no longer applicable?" | Two real head SHAs and the actual `stale` disposition.                                               |
| 0:10-0:23 | "Whose problem is this?"                              | Name a release lead on a team using Copilot; ask whether evidence matches the code being reviewed.   |
| 0:23-0:52 | "Is this working software or a concept?"              | Actual synthetic-app check, findings, protected policy, and an explicit SHA-bound human disposition. |
| 0:52-1:09 | "Does green mean an agent can ship it?"               | Show a green evidence gate with independent human approval still required.                           |
| 1:09-1:25 | "Could a team implement this honestly?"               | Existing GitHub integration, manual advisory workflow, and clear authority boundaries.               |
| 1:25-1:43 | "Why should Microsoft care?"                          | A named Copilot-adoption hypothesis and a measurable proposed pilot.                                 |
| 1:43-1:56 | "What should I remember?"                             | Current evidence; accountable humans; a decision cannot silently follow different code.              |

The hook resolves quickly; it is not stretched into clickbait. A second
contrast, "green evidence is not permission to merge," sustains interest by
adding a real control rather than repeating the first surprise.

## Sources and what they do, and do not, support

These are communication and product-context sources, not proof that this
script will win. The judging categories come from the project owner's exact
rubric, not from these sources. No weights were supplied.

| Source                                                                                                                                                                                     | Supported principle                                                                               | Application here                                                                                    | Limitation                                                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Jakob Nielsen, "How Long Do Users Stay on Web Pages?" (2011)](https://www.nngroup.com/articles/how-long-do-users-stay-on-web-pages/)                                                      | Make relevance and value apparent early.                                                          | A real problem and payoff replace an introductory title slate.                                      | Website dwell time is not a universal video attention-span law; it does not establish a magic ten-second cutoff.                                                                                   |
| [Mayer and Moreno, "Nine Ways to Reduce Cognitive Load in Multimedia Learning" (2003)](https://www.uky.edu/~gmswan3/544/9_ways_to_reduce_CL.pdf)                                           | Coherence, signaling, and coordinated words/pictures can reduce unnecessary processing.           | Highlight one field at a time; show the `stale` result as it is spoken; remove dense feature tours. | Instructional-learning research is not a hackathon conversion study. Do not use it to justify removing accessible captions.                                                                        |
| [Kevin Hale, YC, "How to Design a Better Pitch Deck"](https://www.ycombinator.com/library/4T-how-to-design-a-better-pitch-deck)                                                            | Legibility, simplicity, and obviousness matter in a short pitch.                                  | Crop and magnify genuine UI evidence instead of showing an unreadable whole desktop.                | Practitioner advice, not controlled evidence. Editorial crops must not change the meaning of the source.                                                                                           |
| [Paul Graham, "How to Present to Investors"](https://paulgraham.com/investors.html)                                                                                                        | Explain the concrete product early; give the presentation a purposeful sequence.                  | Customer, proof, implementation path, value; not a chronological tour of everything built.          | Investor talks differ from judging videos. The author's original demo advice was later qualified for shorter pitches; the user's "Make Something" criterion independently requires tangible proof. |
| [Sequoia, "Writing a Business Plan"](https://sequoiacap.com/article/writing-a-business-plan/)                                                                                              | State the purpose, customer problem, and solution clearly.                                        | One primary user and one review problem, followed by an explicit business hypothesis.               | This is a framing aid, not evidence of AgentProof demand or Microsoft's realized value.                                                                                                            |
| [GitHub Docs, "About protected branches"](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches) | GitHub already supports required checks, stale-approval dismissal, and review of the latest push. | Say AgentProof builds on GitHub, while demonstrating its evidence/policy/disposition integration.   | Documentation does not prove those settings are enabled in the recording repository. Inspect the actual configuration.                                                                             |

## Claim-to-proof ledger

| Claim used in the film                                                          | Repository support                                                                                                                  | What still needs recording                                                                                             |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Old-SHA dispositions do not satisfy the current gate.                           | `packages/evidence-core/tests/gate.test.ts`: stale-SHA disposition test.                                                            | A genuine unexpired A disposition evaluated as stale on actual head B.                                                 |
| Missing retention evidence is not silently passed.                              | Same test file: unknown retention blocks; current eligible acceptance yields `exception`, not `pass`.                               | Correct raw/final evidence snapshots, labeled so their projection states are not confused.                             |
| Protected non-exceptionable failures cannot be accepted.                        | Same test file: protected non-exceptionable failure test; authoritative base policy.                                                | Real test/dependency failure, then actual remediation and fresh evidence.                                              |
| The board cannot make an authoritative decision.                                | `plugin/extensions/evidence-board/tests/reducer.test.mjs` and `model.test.mjs`: draft-only behavior and stale/policy/head handling. | Actual warning or an explicitly editorial boundary card.                                                               |
| GitHub can require human review independently of the gate.                      | `.github/rulesets/agentproof.json` is the intended template; GitHub documentation describes the mechanism.                          | Live repository rule configuration and the actual PR's remaining review requirement. A template alone is insufficient. |
| Reviewer workflow remains manual and advisory.                                  | Existing reviewer/assembler design and documented disabled permission canary.                                                       | Show only a tool boundary that is actually read-only; otherwise omit session footage.                                  |
| Microsoft could gain more confident Copilot adoption and less evidence chasing. | A reasoned product hypothesis, not a measured result.                                                                               | Pilot observations and customer validation, neither of which is claimed to exist.                                      |

The video demonstrates **configured, commit-bound evidence**, not universal
security, compliance, provenance, or production suitability. "Trust must be
earned again" is a memorable summary, not a scanner's certification.

## Hook selection and rejected alternatives

| Candidate                                                    | Decision                                                                                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| "The code changed. Should the old exception still count?"    | Chosen: a concrete curiosity gap with a visible answer, and the mechanism is specific to the product story. |
| "Does this evidence match the code you're about to release?" | Good customer framing, retained in scene 2; less surprising as the first line.                              |
| "AI writes code faster than people can trust it."            | Rejected: broad, unmeasured, familiar, and difficult to prove in this film.                                 |
| "One click could cost Microsoft millions."                   | Rejected: invented stakes and fear without supporting evidence.                                             |
| "AgentProof makes AI code safe."                             | Rejected: an unsupported universal assurance.                                                               |

## What would most improve the submission now

The highest-value remaining work is **source footage and customer evidence**,
not more visual effects or extra Azure services. Capture the genuine stale
case, the current-SHA gate with its distinct exception, and the human-review
boundary. Ask representative release leads to explain the film back in their
own words; use misunderstandings to simplify it, not to infer a success rate.

For the proposed pilot, collect actual reviewer minutes and control outcomes.
Do not replace missing results with targets, fabricated customer counts,
testimonials, logos, or projected revenue. Event rules and repository-sharing
policy still require confirmation through the authorized event/internal
channels; this communication research does not settle them.
