const HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentProof Evidence Board</title>
  <style>
    :root { color-scheme: light dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background:
        radial-gradient(circle at top left, rgba(9, 105, 218, 0.12), transparent 28%),
        linear-gradient(180deg, #f6f8fa 0%, #ffffff 26%, #f6f8fa 100%);
      color: var(--text-color-default, #1f2328);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--text-body-medium, 14px);
      line-height: var(--leading-body-medium, 20px);
    }
    button, input, select, textarea { font: inherit; }
    button, select, input, textarea {
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 6px;
      background: var(--background-color-default, #ffffff);
      color: var(--text-color-default, #1f2328);
    }
    button { cursor: pointer; padding: 6px 10px; }
    button:hover { background: color-mix(in srgb, var(--text-color-default, #1f2328) 7%, transparent); }
    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid var(--color-focus-outline, #0969da);
      outline-offset: 2px;
    }
    button:disabled { cursor: not-allowed; opacity: .55; }
    a { color: var(--true-color-blue, #0969da); }
    code, pre {
      font-family: var(--font-mono, "SFMono-Regular", Consolas, monospace);
      font-size: var(--text-code-inline, 12px);
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 {
      margin-bottom: 4px;
      font-size: var(--text-title-large, 26px);
      line-height: var(--leading-title-large, 32px);
      font-weight: var(--font-weight-semibold, 600);
    }
    h2 { margin-bottom: 12px; font-size: 18px; }
    h3 { margin-bottom: 6px; font-size: 15px; }
    .authority {
      position: sticky;
      top: 0;
      z-index: 10;
      padding: 10px 16px;
      border-bottom: 1px solid var(--border-color-default, #d0d7de);
      background: linear-gradient(90deg, rgba(9, 105, 218, 0.15), rgba(31, 35, 40, 0.02));
      font-weight: var(--font-weight-semibold, 600);
    }
    .shell { max-width: 1240px; margin: 0 auto; padding: 20px; }
    .heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
    .hero {
      margin-top: 18px;
      display: grid;
      grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.95fr);
      gap: 16px;
      padding: 18px;
      border: 1px solid rgba(9, 105, 218, 0.2);
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(9, 105, 218, 0.08), rgba(31, 35, 40, 0.02));
      box-shadow: 0 10px 24px rgba(31, 35, 40, 0.05);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      border: 1px solid rgba(9, 105, 218, 0.2);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.7);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--true-color-blue, #0969da);
    }
    .hero-copy h1 {
      margin: 12px 0 10px;
      font-size: clamp(24px, 3vw, 36px);
      line-height: 1.12;
    }
    .hero-copy p {
      max-width: 60ch;
      margin: 0;
      color: var(--text-color-muted, #656d76);
      font-size: 15px;
    }
    .hero-panel {
      display: grid;
      gap: 10px;
      align-content: start;
    }
    .hero-metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--border-color-default, #d0d7de);
      background: rgba(255, 255, 255, 0.82);
    }
    .hero-metric strong { font-size: 18px; }
    .hero-metric .muted { font-size: 12px; }
    .muted { color: var(--text-color-muted, #656d76); }
    .badge, .state, .severity {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 999px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: var(--font-weight-semibold, 600);
      white-space: nowrap;
    }
    .sample { background: color-mix(in srgb, #bf8700 18%, transparent); }
    .pass { color: #1a7f37; border-color: color-mix(in srgb, #1a7f37 45%, transparent); }
    .fail { color: var(--true-color-red, #cf222e); border-color: color-mix(in srgb, var(--true-color-red, #cf222e) 45%, transparent); }
    .success { color: #1a7f37; border-color: color-mix(in srgb, #1a7f37 45%, transparent); }
    .failure { color: var(--true-color-red, #cf222e); border-color: color-mix(in srgb, var(--true-color-red, #cf222e) 45%, transparent); }
    .unknown { color: #9a6700; border-color: color-mix(in srgb, #9a6700 45%, transparent); }
    .exception { color: #8250df; border-color: color-mix(in srgb, #8250df 45%, transparent); }
    .stale, .expired, .superseded, .edited-away { color: var(--text-color-muted, #656d76); }
    .panel {
      margin-top: 16px;
      padding: 16px;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 8px;
    }
    .metadata {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 12px;
    }
    .datum { min-width: 0; }
    .datum span { display: block; color: var(--text-color-muted, #656d76); font-size: 12px; }
    .datum code { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .counts { display: grid; grid-template-columns: repeat(4, minmax(100px, 1fr)); gap: 10px; margin-top: 16px; }
    .count { padding: 12px; text-align: left; }
    .count strong { display: block; font-size: 24px; line-height: 28px; }
    .count.active { box-shadow: inset 0 0 0 2px var(--color-focus-outline, #0969da); }
    .workspace { display: grid; grid-template-columns: minmax(280px, 1fr) minmax(340px, 1.2fr); gap: 16px; }
    .toolbar { display: flex; gap: 8px; margin-bottom: 12px; }
    .toolbar input { flex: 1; min-width: 0; padding: 6px 9px; }
    .toolbar select { padding: 6px 9px; }
    .finding-list { display: grid; gap: 8px; max-height: 620px; overflow: auto; }
    .finding {
      width: 100%;
      padding: 12px;
      text-align: left;
      display: grid;
      gap: 6px;
    }
    .finding.selected { box-shadow: inset 0 0 0 2px var(--color-focus-outline, #0969da); }
    .finding-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .finding-id { color: var(--text-color-muted, #656d76); font-family: var(--font-mono, monospace); font-size: 12px; }
    .detail-grid { display: grid; gap: 14px; }
    .reference-list, .history, .notes { display: grid; gap: 8px; padding: 0; list-style: none; }
    .reference, .history-item, .note {
      padding: 10px;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 6px;
      background: color-mix(in srgb, var(--text-color-default, #1f2328) 4%, transparent);
    }
    .form-grid { display: grid; gap: 10px; }
    label { display: grid; gap: 4px; font-weight: var(--font-weight-semibold, 600); }
    textarea { min-height: 86px; resize: vertical; padding: 8px; }
    select, input { padding: 7px 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .primary { color: var(--color-white, #fff); background: var(--true-color-blue, #0969da); border-color: transparent; }
    .primary:hover { background: color-mix(in srgb, var(--true-color-blue, #0969da) 85%, #000); }
    pre {
      margin: 0;
      padding: 12px;
      overflow: auto;
      white-space: pre-wrap;
      border: 1px solid var(--border-color-default, #d0d7de);
      border-radius: 6px;
      background: color-mix(in srgb, var(--text-color-default, #1f2328) 5%, transparent);
    }
    .danger { color: var(--true-color-red, #cf222e); }
    .empty { padding: 32px 16px; text-align: center; color: var(--text-color-muted, #656d76); }
    .error { color: var(--true-color-red, #cf222e); min-height: 20px; }
    .footer-actions { margin-top: 18px; display: flex; justify-content: flex-end; }
    @media (max-width: 760px) {
      .counts { grid-template-columns: repeat(2, 1fr); }
      .workspace { grid-template-columns: 1fr; }
      .shell { padding: 14px; }
    }
  </style>
</head>
<body>
  <div class="authority" id="authority">GitHub checks, comments, and reviews are authoritative. This mutable board only coordinates evidence and drafts commands; it never approves or merges.</div>
  <main class="shell">
    <div id="app" aria-live="polite"><div class="empty">Loading evidence board…</div></div>
  </main>
  <script>
    "use strict";
    const token = "__AGENTPROOF_TOKEN__";
    const base = "/" + token;
    let board = null;
    let filter = "all";
    let query = "";
    let errorMessage = "";

    function node(tag, options, children) {
      const element = document.createElement(tag);
      const settings = options || {};
      if (settings.className) element.className = settings.className;
      if (settings.text !== undefined) element.textContent = String(settings.text);
      if (settings.title) element.title = settings.title;
      if (settings.type) element.type = settings.type;
      if (settings.href) {
        element.href = settings.href;
        element.target = "_blank";
        element.rel = "noreferrer noopener";
      }
      if (settings.disabled) element.disabled = true;
      if (settings.value !== undefined) element.value = settings.value;
      if (settings.name) element.name = settings.name;
      if (settings.placeholder) element.placeholder = settings.placeholder;
      if (settings.maxLength) element.maxLength = settings.maxLength;
      if (settings.min) element.min = settings.min;
      if (settings.ariaLabel) element.setAttribute("aria-label", settings.ariaLabel);
      for (const child of children || []) {
        if (child !== null && child !== undefined) {
          element.append(child);
        }
      }
      return element;
    }

    function safeHttpsUrl(value) {
      if (typeof value !== "string") return null;
      try {
        const parsed = new URL(value);
        return parsed.protocol === "https:" && !parsed.username && !parsed.password ? value : null;
      } catch {
        return null;
      }
    }

    function datum(label, value, useCode) {
      return node("div", { className: "datum" }, [
        node("span", { text: label }),
        node(useCode ? "code" : "strong", { text: value, title: String(value) })
      ]);
    }

    async function request(path, payload) {
      const response = await fetch(base + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload || {})
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Evidence Board request failed.");
      }
      return result;
    }

    function countButton(state, count) {
      const button = node("button", {
        className: "count " + state + (filter === state ? " active" : ""),
        type: "button"
      }, [
        node("strong", { text: count }),
        node("span", { text: state })
      ]);
      button.addEventListener("click", function () {
        filter = filter === state ? "all" : state;
        render();
      });
      return button;
    }

    function evidenceReference(reference) {
      const location = reference.path
        ? reference.path + (reference.line ? ":" + reference.line : "")
        : reference.url;
      const safeUrl = safeHttpsUrl(reference.url);
      return node("li", { className: "reference" }, [
        node("strong", { text: reference.name }),
        document.createTextNode(" — "),
        safeUrl
          ? node("a", { text: location, href: safeUrl })
          : node("code", { text: location || "No location" })
      ]);
    }

    function findingButton(finding) {
      const selected = board.selectedFindingId === finding.id;
      const button = node("button", {
        className: "finding" + (selected ? " selected" : ""),
        type: "button"
      }, [
        node("div", { className: "finding-top" }, [
          node("div", {}, [
            node("div", { className: "finding-id", text: finding.id }),
            node("strong", { text: finding.title })
          ]),
          node("span", { className: "state " + finding.state, text: finding.state })
        ]),
        node("span", {
          className: "muted",
          text: finding.category + " · " + finding.severity + " · " + finding.collector
        })
      ]);
      button.addEventListener("click", async function () {
        try {
          errorMessage = "";
          board = await request("/api/select", { id: finding.id });
          render();
        } catch (error) {
          errorMessage = error.message;
          render();
        }
      });
      return button;
    }

    function draftPanel(finding) {
      if (finding.state === "pass") {
        return node("div", { className: "muted", text: "Passing findings do not accept dispositions." });
      }
      const eligibleAcceptance =
        (finding.state === "unknown" || finding.state === "exception") &&
        finding.exceptionable &&
        finding.severity !== "critical";
      const decision = node("select", { name: "decision" }, [
        ...(eligibleAcceptance
          ? [node("option", { value: "accept-exception", text: "accept-exception" })]
          : []),
        node("option", { value: "request-remediation", text: "request-remediation" }),
        node("option", { value: "reject", text: "reject" })
      ]);
      if (!eligibleAcceptance) decision.value = "request-remediation";
      const reason = node("textarea", {
        name: "reason",
        maxLength: 500,
        placeholder: "Single-line rationale (20–500 characters)"
      });
      const expiry = node("input", {
        type: "date",
        name: "expires",
        min: new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      });
      const expiryLabel = node("label", {}, [document.createTextNode("Expiry (UTC)"), expiry]);
      expiryLabel.hidden = decision.value !== "accept-exception";
      decision.addEventListener("change", function () {
        expiryLabel.hidden = decision.value !== "accept-exception";
      });
      const generate = node("button", { className: "primary", type: "button", text: "Draft exact PR command" });
      generate.addEventListener("click", async function () {
        try {
          errorMessage = "";
          const payload = {
            findingId: finding.id,
            decision: decision.value,
            headSha: board.document.headSha,
            reason: reason.value
          };
          if (decision.value === "accept-exception") payload.expires = expiry.value;
          board = await request("/api/draft", payload);
          render();
        } catch (error) {
          errorMessage = error.message;
          render();
        }
      });

      return node("div", { className: "form-grid" }, [
        node("h3", { text: "Draft a human disposition" }),
        node("p", {
          className: "muted",
          text: "This produces text only. An authorized human must submit it in GitHub."
        }),
        node("label", {}, [document.createTextNode("Decision"), decision]),
        node("label", {}, [document.createTextNode("Reason"), reason]),
        expiryLabel,
        node("div", { className: "actions" }, [generate])
      ]);
    }

    function draftOutput() {
      if (!board.draft) return null;
      const copy = node("button", { type: "button", text: "Copy command" });
      const status = node("span", { className: "muted" });
      copy.addEventListener("click", async function () {
        try {
          await navigator.clipboard.writeText(board.draft.command);
          status.textContent = "Copied. Submit it in the pull request.";
        } catch {
          status.textContent = "Copy unavailable; select the command text manually.";
        }
      });
      const prUrl = safeHttpsUrl(board.pullRequestUrl);
      return node("div", { className: "detail-grid" }, [
        node("h3", { text: "Draft only — not an approval" }),
        node("pre", { text: board.draft.command }),
        node("div", { className: "actions" }, [
          copy,
          prUrl ? node("a", { text: "Open pull request to submit", href: prUrl }) : null,
          status
        ])
      ]);
    }

    function selectedDetail() {
      const finding = board.selectedFinding;
      if (!finding) {
        return node("div", { className: "empty", text: "Select a finding to inspect its evidence." });
      }
      return node("div", { className: "detail-grid" }, [
        node("div", {}, [
          node("div", { className: "finding-top" }, [
            node("div", {}, [
              node("div", { className: "finding-id", text: finding.id }),
              node("h2", { text: finding.title })
            ]),
            node("span", { className: "state " + finding.state, text: finding.state })
          ]),
          node("p", { text: finding.summary }),
          node("p", {
            className: "muted",
            text:
              finding.category +
              " · " +
              finding.severity +
              " · source " +
              finding.sourceSha.slice(0, 12)
          })
        ]),
        node("div", {}, [
          node("h3", { text: "Evidence" }),
          node("ul", { className: "reference-list" }, finding.evidenceRefs.map(evidenceReference))
        ]),
        node("div", {}, [
          node("h3", { text: "Remediation" }),
          node("p", { text: finding.remediationHint })
        ]),
        draftPanel(finding),
        draftOutput()
      ]);
    }

    function dispositionHistory(documentValue) {
      if (board.dispositions.length === 0) {
        return node("p", { className: "muted", text: "No GitHub disposition history is recorded." });
      }
      return node("ul", { className: "history" }, board.dispositions.map(function (entry) {
        const disposition = entry.disposition;
        const commentUrl = safeHttpsUrl(disposition.commentUrl);
        return node("li", { className: "history-item" }, [
          node("div", { className: "finding-top" }, [
            node("strong", { text: disposition.decision + " · " + disposition.findingId }),
            node("span", { className: "badge " + entry.badge, text: entry.badge })
          ]),
          node("div", {
            className: "muted",
            text:
              "@" +
              disposition.actor +
              " · SHA " +
              (disposition.boundHeadSha ? disposition.boundHeadSha.slice(0, 12) : "unbound") +
              (disposition.expires ? " · expires " + disposition.expires : "")
          }),
          node("p", { text: disposition.rationale || "No valid rationale was parsed." }),
          commentUrl ? node("a", { text: "Authoritative GitHub comment", href: commentUrl }) : null
        ]);
      }));
    }

    function reviewerNotes(documentValue) {
      if (documentValue.reviewerNotes.length === 0) {
        return node("p", { className: "muted", text: "No specialist session notes are attached." });
      }
      return node("ul", { className: "notes" }, documentValue.reviewerNotes.map(function (note) {
        const sessionUrl = safeHttpsUrl(note.sessionUrl);
        return node("li", { className: "note" }, [
          node("strong", { text: note.specialist }),
          document.createTextNode(" — " + note.summary + " "),
          sessionUrl ? node("a", { text: "Session", href: sessionUrl }) : null
        ]);
      }));
    }

    function render() {
      const app = document.getElementById("app");
      app.replaceChildren();
      if (!board || !board.document) {
        app.append(
          node("div", { className: "heading" }, [
            node("div", {}, [
              node("h1", { text: "Evidence Board" }),
              node("p", { className: "muted", text: "No evidence is loaded. Ask the Evidence Assembler to call set_evidence." })
            ])
          ]),
          node("div", { className: "error", text: errorMessage })
        );
        return;
      }

      const documentValue = board.document;
      const visibleFindings = documentValue.findings.filter(function (finding) {
        const matchesFilter = filter === "all" || finding.state === filter;
        const normalizedQuery = query.trim().toLowerCase();
        const matchesQuery =
          normalizedQuery === "" ||
          (finding.id + " " + finding.title + " " + finding.summary)
            .toLowerCase()
            .includes(normalizedQuery);
        return matchesFilter && matchesQuery;
      });
      const search = node("input", { type: "search", placeholder: "Filter findings", value: query });
      search.addEventListener("input", function () {
        query = search.value;
        render();
        const nextSearch = document.querySelector('input[type="search"]');
        if (nextSearch) {
          nextSearch.focus();
          nextSearch.setSelectionRange(query.length, query.length);
        }
      });
      const stateFilter = node("select", { value: filter }, [
        node("option", { value: "all", text: "all states" }),
        node("option", { value: "pass", text: "pass" }),
        node("option", { value: "fail", text: "fail" }),
        node("option", { value: "unknown", text: "unknown" }),
        node("option", { value: "exception", text: "exception" })
      ]);
      stateFilter.value = filter;
      stateFilter.addEventListener("change", function () {
        filter = stateFilter.value;
        render();
      });

      const headingChildren = [
        node("div", {}, [
          node("h1", { text: "Evidence Board" }),
          node("p", {
            className: "muted",
            text: documentValue.repository + " · pull request #" + documentValue.pullRequestNumber
          })
        ]),
        node("div", { className: "actions" }, [
          board.sample ? node("span", { className: "badge sample", text: "SAMPLE EVIDENCE" }) : null,
          node("span", {
            className: "state " + documentValue.gate.conclusion,
            text: "gate: " + documentValue.gate.conclusion
          })
        ])
      ];

      app.append(
        node("div", { className: "heading" }, headingChildren),
        node("section", { className: "hero" }, [
          node("div", { className: "hero-copy" }, [
            node("div", { className: "eyebrow", text: "Release control room" }),
            node("h1", { text: "The exact change is either evidence-backed or it is not." }),
            node("p", {
              text: "This board turns a GitHub pull request into a single decision surface: same-SHA facts, clear blockers, and a human-ready command path without accepting the risk of an unreviewed merge."
            })
          ]),
          node("div", { className: "hero-panel" }, [
            node("div", { className: "hero-metric" }, [
              node("div", {}, [
                node("div", { className: "muted", text: "Gate" }),
                node("strong", { text: documentValue.gate.conclusion.toUpperCase() })
              ]),
              node("span", { className: "state " + documentValue.gate.conclusion, text: documentValue.gate.conclusion })
            ]),
            node("div", { className: "hero-metric" }, [
              node("div", {}, [
                node("div", { className: "muted", text: "Head SHA" }),
                node("strong", { text: documentValue.headSha.slice(0, 12) })
              ]),
              node("span", { className: "badge", text: "Bound" })
            ]),
            node("div", { className: "hero-metric" }, [
              node("div", {}, [
                node("div", { className: "muted", text: "Open findings" }),
                node("strong", { text: String(board.counts.fail + board.counts.unknown + board.counts.exception) })
              ]),
              node("span", { className: "muted", text: "Needs attention" })
            ])
          ])
        ]),
        node("section", { className: "panel metadata", ariaLabel: "Evidence identity" }, [
          datum("Head SHA", documentValue.headSha, true),
          datum("Base SHA", documentValue.baseSha, true),
          datum(
            "Origin",
            documentValue.origin.classification +
              (documentValue.origin.declaredTool ? " · " + documentValue.origin.declaredTool : ""),
            false
          ),
          datum("Policy", documentValue.policy.path + " · " + documentValue.policy.version, false),
          datum("Policy SHA-256", documentValue.policy.sha256, true),
          datum("Generated", documentValue.generatedAt, false)
        ]),
        node("div", { className: "counts" }, [
          countButton("pass", board.counts.pass),
          countButton("fail", board.counts.fail),
          countButton("unknown", board.counts.unknown),
          countButton("exception", board.counts.exception)
        ]),
        node("div", { className: "workspace" }, [
          node("section", { className: "panel" }, [
            node("h2", { text: "Findings" }),
            node("div", { className: "toolbar" }, [search, stateFilter]),
            node(
              "div",
              { className: "finding-list" },
              visibleFindings.length === 0
                ? [node("div", { className: "empty", text: "No findings match this filter." })]
                : visibleFindings.map(findingButton)
            )
          ]),
          node("section", { className: "panel" }, [selectedDetail()])
        ]),
        node("section", { className: "panel" }, [
          node("h2", { text: "Human disposition history" }),
          dispositionHistory(documentValue)
        ]),
        node("section", { className: "panel" }, [
          node("h2", { text: "Specialist notes" }),
          reviewerNotes(documentValue)
        ]),
        node("div", { className: "error", text: errorMessage }),
        node("div", { className: "footer-actions" }, [
          (function () {
            const clear = node("button", { className: "danger", type: "button", text: "Clear mutable board" });
            clear.addEventListener("click", async function () {
              if (!window.confirm("Clear this mutable Evidence Board? GitHub records are unchanged.")) return;
              try {
                errorMessage = "";
                board = await request("/api/clear", {});
                render();
              } catch (error) {
                errorMessage = error.message;
                render();
              }
            });
            return clear;
          })()
        ])
      );
    }

    fetch(base + "/api/state", { cache: "no-store" })
      .then(function (response) { return response.json(); })
      .then(function (state) { board = state; render(); })
      .catch(function (error) { errorMessage = error.message; render(); });

    const events = new EventSource(base + "/events");
    events.onmessage = function (event) {
      try {
        board = JSON.parse(event.data);
        errorMessage = "";
        render();
      } catch {
        errorMessage = "Received an invalid board update.";
        render();
      }
    };
    events.onerror = function () {
      errorMessage = "Live updates are reconnecting. GitHub remains authoritative.";
      render();
    };
  </script>
</body>
</html>`;
export function renderHtml(token) {
    return HTML.replaceAll("__AGENTPROOF_TOKEN__", token);
}


//# sourceURL=agentproof://renderer.ts