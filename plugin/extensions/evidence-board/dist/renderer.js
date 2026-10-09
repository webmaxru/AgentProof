const HTML = String.raw`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AgentProof Evidence Board</title>
  <!--
    THESIS: A release blotter for one exact SHA, refusing the promotional hero/dashboard-stat pattern.
    OWN-WORLD: Matte operational surfaces, hairline rules, ledger rows, action-blue controls, and status inks.
    STORY: Read gate and scope, triage the blocker queue, inspect evidence, then draft a human disposition.
    FIRST VIEWPORT: Compact command bar and release strip above a three-pane queue, inspector, and context rail.
    FORM: Financial trade blotter, ranked direction 5; ticket-and-blotter staging; seed 3c820c17.
  -->
  <style>
    :root {
      color-scheme: light dark;
      --board-bg: #f3f5f7;
      --surface: #ffffff;
      --surface-subtle: #f7f8fa;
      --surface-selected: #eef5ff;
      --text: #1f2328;
      --muted: #59636e;
      --faint: #77818c;
      --border: #c9d1d9;
      --border-strong: #8c959f;
      --accent: #0969da;
      --accent-strong: #0550ae;
      --pass: #116329;
      --pass-bg: #dafbe1;
      --fail: #b4232d;
      --fail-bg: #ffebe9;
      --unknown: #7d4e00;
      --unknown-bg: #fff8c5;
      --exception: #6639ba;
      --exception-bg: #f4edff;
      --shadow: 0 8px 24px rgba(31, 35, 40, 0.08);
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --board-bg: #0d1117;
        --surface: #161b22;
        --surface-subtle: #1c2128;
        --surface-selected: #14243a;
        --text: #f0f3f6;
        --muted: #b1bac4;
        --faint: #8c959f;
        --border: #30363d;
        --border-strong: #6e7681;
        --accent: #58a6ff;
        --accent-strong: #79c0ff;
        --pass: #56d364;
        --pass-bg: #173923;
        --fail: #ff7b72;
        --fail-bg: #3d1f24;
        --unknown: #e3b341;
        --unknown-bg: #3b2e13;
        --exception: #d2a8ff;
        --exception-bg: #30244f;
        --shadow: 0 12px 32px rgba(0, 0, 0, 0.34);
      }
    }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    body {
      margin: 0;
      min-width: 320px;
      background: var(--board-bg);
      color: var(--text);
      font-family: var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      font-size: var(--text-body-medium, 14px);
      line-height: var(--leading-body-medium, 20px);
    }
    button, input, select, textarea { font: inherit; }
    button, select, input, textarea {
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--surface);
      color: var(--text);
    }
    button {
      min-height: 32px;
      cursor: pointer;
      padding: 5px 10px;
      transition: background-color 120ms ease-out, border-color 120ms ease-out, box-shadow 120ms ease-out;
    }
    button:hover { background: var(--surface-subtle); border-color: var(--border-strong); }
    button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
    button:disabled { cursor: not-allowed; opacity: .55; }
    a { color: var(--accent); }
    code, pre {
      font-family: var(--font-mono, "SFMono-Regular", Consolas, monospace);
      font-size: var(--text-code-inline, 12px);
    }
    h1, h2, h3, p { margin-top: 0; }
    h1 { margin-bottom: 2px; font-size: 18px; line-height: 24px; font-weight: 650; letter-spacing: -0.01em; }
    h2 { margin-bottom: 10px; font-size: 15px; line-height: 20px; }
    h3 { margin-bottom: 6px; font-size: 13px; line-height: 18px; }
    .muted { color: var(--muted); }
    .authority {
      display: flex;
      min-height: 32px;
      align-items: center;
      padding: 5px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-subtle);
      color: var(--muted);
      font-size: 12px;
    }
    .shell { width: 100%; max-width: 1680px; margin: 0 auto; padding: 14px; }
    .command-bar {
      display: flex;
      min-height: 50px;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 12px;
      border: 1px solid var(--border);
      border-radius: 7px 7px 0 0;
      background: var(--surface);
    }
    .command-title { min-width: 0; }
    .command-title p { margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
    .command-actions { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 7px; }
    .badge, .state, .severity {
      display: inline-flex;
      min-height: 22px;
      align-items: center;
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 1px 7px;
      font-size: 11px;
      line-height: 18px;
      font-weight: 650;
      white-space: nowrap;
      text-transform: uppercase;
      letter-spacing: .025em;
    }
    .sample { color: var(--unknown); background: var(--unknown-bg); border-color: color-mix(in srgb, var(--unknown) 45%, var(--border)); }
    .pass, .success { color: var(--pass); background: var(--pass-bg); border-color: color-mix(in srgb, var(--pass) 45%, var(--border)); }
    .fail, .failure { color: var(--fail); background: var(--fail-bg); border-color: color-mix(in srgb, var(--fail) 45%, var(--border)); }
    .unknown { color: var(--unknown); background: var(--unknown-bg); border-color: color-mix(in srgb, var(--unknown) 45%, var(--border)); }
    .exception { color: var(--exception); background: var(--exception-bg); border-color: color-mix(in srgb, var(--exception) 45%, var(--border)); }
    .stale, .expired, .superseded, .edited-away { color: var(--muted); background: var(--surface-subtle); }
    .release-strip {
      display: grid;
      grid-template-columns: minmax(190px, 1.1fr) repeat(4, minmax(112px, .72fr));
      border: 1px solid var(--border);
      border-top: 0;
      background: var(--surface);
    }
    .release-cell {
      min-width: 0;
      padding: 9px 12px;
      border-right: 1px solid var(--border);
    }
    .release-cell:last-child { border-right: 0; }
    .release-cell span { display: block; margin-bottom: 2px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    .release-cell strong, .release-cell code { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .release-gate { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .release-gate strong { font-size: 19px; line-height: 24px; }
    .work-grid {
      display: grid;
      grid-template-columns: minmax(280px, 360px) minmax(420px, 1fr) minmax(250px, 310px);
      height: clamp(520px, calc(100vh - 188px), 760px);
      min-height: 0;
      border: 1px solid var(--border);
      border-top: 0;
      border-radius: 0 0 7px 7px;
      background: var(--surface);
      box-shadow: var(--shadow);
    }
    .pane { min-width: 0; height: 100%; overflow: hidden; background: var(--surface); }
    .queue-pane, .inspector-pane { border-right: 1px solid var(--border); }
    .pane-header {
      display: flex;
      min-height: 43px;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px 11px;
      border-bottom: 1px solid var(--border);
      background: var(--surface-subtle);
    }
    .pane-header h2, .pane-header p { margin: 0; }
    .pane-header p { font-size: 12px; }
    .queue-controls { display: grid; gap: 8px; padding: 10px; border-bottom: 1px solid var(--border); }
    .toolbar { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 7px; }
    .toolbar input, .toolbar select { width: 100%; min-width: 0; padding: 6px 8px; }
    .counts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
    .count {
      display: flex;
      min-width: 0;
      min-height: 34px;
      align-items: center;
      justify-content: space-between;
      gap: 4px;
      padding: 4px 6px;
      text-align: left;
      background: var(--surface);
    }
    .count strong { font-size: 14px; line-height: 18px; }
    .count span { overflow: hidden; text-overflow: ellipsis; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
    .count.active { border-color: var(--accent); box-shadow: inset 0 0 0 1px var(--accent); }
    .finding-list { height: calc(100% - 129px); overflow: auto; }
    .finding {
      position: relative;
      width: 100%;
      min-height: 74px;
      padding: 10px 11px;
      border: 0;
      border-bottom: 1px solid var(--border);
      border-radius: 0;
      text-align: left;
      background: var(--surface);
    }
    .finding:hover { background: var(--surface-subtle); }
    .finding.selected { z-index: 1; background: var(--surface-selected); box-shadow: inset 3px 0 0 var(--accent); }
    .finding-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .finding-title { display: block; margin-top: 2px; line-height: 18px; }
    .finding-id { color: var(--muted); font-family: var(--font-mono, monospace); font-size: 11px; }
    .finding-meta { display: flex; align-items: center; gap: 5px; margin-top: 7px; color: var(--muted); font-size: 11px; }
    .finding-meta span + span::before { content: "·"; margin-right: 5px; color: var(--faint); }
    .inspector-scroll { height: calc(100% - 43px); overflow: auto; padding: 14px 16px 20px; }
    .detail-grid { display: grid; gap: 16px; }
    .detail-lead { padding-bottom: 14px; border-bottom: 1px solid var(--border); }
    .detail-lead h2 { margin: 3px 0 7px; font-size: 19px; line-height: 25px; }
    .detail-summary { max-width: 72ch; margin-bottom: 8px; }
    .section-block { padding-top: 2px; }
    .section-label { margin-bottom: 8px; color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: .055em; }
    .reference-list, .history, .notes { display: grid; gap: 7px; padding: 0; list-style: none; }
    .reference, .history-item, .note {
      padding: 9px 10px;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--surface-subtle);
    }
    .form-grid {
      display: grid;
      gap: 9px;
      padding: 12px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--surface-subtle);
    }
    .form-grid h3, .form-grid p { margin-bottom: 0; }
    label { display: grid; gap: 4px; font-size: 12px; font-weight: 650; }
    textarea { min-height: 82px; resize: vertical; padding: 8px; }
    select, input { padding: 7px 8px; }
    .actions { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }
    .primary { color: #ffffff; background: var(--accent-strong); border-color: var(--accent-strong); }
    .primary:hover { color: #ffffff; background: color-mix(in srgb, var(--accent-strong) 86%, #000); }
    pre {
      margin: 0;
      padding: 11px;
      overflow: auto;
      white-space: pre-wrap;
      border: 1px solid var(--border);
      border-radius: 5px;
      background: var(--board-bg);
    }
    .context-pane { overflow: auto; background: var(--surface-subtle); }
    .context-section { padding: 12px; border-bottom: 1px solid var(--border); }
    .context-section:last-child { border-bottom: 0; }
    .context-section h2 { margin-bottom: 9px; font-size: 13px; }
    .metadata { display: grid; gap: 9px; }
    .datum { min-width: 0; }
    .datum span { display: block; margin-bottom: 1px; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .045em; }
    .datum strong, .datum code { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px; }
    .context-pane .history, .context-pane .notes { gap: 6px; }
    .context-pane .history-item, .context-pane .note { padding: 8px; background: var(--surface); font-size: 12px; }
    .board-controls { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .danger { color: var(--fail); }
    .empty { padding: 36px 16px; text-align: center; color: var(--muted); }
    .error {
      margin: 10px 0 0;
      min-height: 20px;
      color: var(--fail);
      font-size: 12px;
    }
    .error:empty { display: none; }
    @media (max-width: 1120px) {
      .work-grid { grid-template-columns: minmax(260px, 320px) minmax(360px, 1fr) minmax(230px, 280px); }
    }
    @media (max-width: 900px) {
      .work-grid { height: auto; grid-template-columns: minmax(260px, 330px) minmax(360px, 1fr); }
      .pane { height: auto; }
      .finding-list { height: auto; max-height: 440px; }
      .inspector-scroll { height: auto; max-height: 700px; }
      .context-pane { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, 1fr); border-top: 1px solid var(--border); }
      .context-section { border-right: 1px solid var(--border); border-bottom: 0; }
      .context-section:last-child { border-right: 0; }
    }
    @media (max-width: 760px) {
      .shell { padding: 8px; }
      .command-bar { flex-direction: column; align-items: stretch; }
      .command-actions { justify-content: flex-start; }
      .release-strip { grid-template-columns: repeat(2, 1fr); }
      .release-cell { border-bottom: 1px solid var(--border); }
      .release-cell:nth-child(2n) { border-right: 0; }
      .release-cell:last-child { grid-column: 1 / -1; border-right: 0; border-bottom: 0; }
      .work-grid { display: block; min-height: 0; }
      .queue-pane, .inspector-pane { border-right: 0; border-bottom: 1px solid var(--border); }
      .finding-list { max-height: 360px; }
      .inspector-scroll { max-height: none; }
      .context-pane { display: block; }
      .context-section { border-right: 0; border-bottom: 1px solid var(--border); }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: 0.01ms !important; }
    }
  </style>
</head>
<body>
  <div class="authority" id="authority">GitHub checks, comments, and reviews are authoritative. This mutable board coordinates evidence and drafts commands; it never approves or merges.</div>
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
      if (settings.ariaPressed !== undefined) element.setAttribute("aria-pressed", String(settings.ariaPressed));
      if (settings.ariaCurrent) element.setAttribute("aria-current", settings.ariaCurrent);
      if (settings.role) element.setAttribute("role", settings.role);
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
        type: "button",
        ariaPressed: filter === state,
        ariaLabel: "Show " + state + " findings"
      }, [
        node("span", { text: state }),
        node("strong", { text: count })
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
        type: "button",
        ariaPressed: selected,
        ariaCurrent: selected ? "true" : null
      }, [
        node("div", { className: "finding-top" }, [
          node("div", {}, [
            node("div", { className: "finding-id", text: finding.id }),
            node("strong", { className: "finding-title", text: finding.title })
          ]),
          node("span", { className: "state " + finding.state, text: finding.state })
        ]),
        node("div", { className: "finding-meta" }, [
          node("span", { text: finding.severity }),
          node("span", { text: finding.category }),
          node("span", { text: finding.collector })
        ])
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
        node("div", { className: "detail-lead" }, [
          node("div", { className: "finding-top" }, [
            node("div", {}, [
              node("div", { className: "finding-id", text: finding.id }),
              node("h2", { text: finding.title })
            ]),
            node("span", { className: "state " + finding.state, text: finding.state })
          ]),
          node("p", { className: "detail-summary", text: finding.summary }),
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
        node("div", { className: "section-block" }, [
          node("h3", { className: "section-label", text: "Evidence references" }),
          node("ul", { className: "reference-list" }, finding.evidenceRefs.map(evidenceReference))
        ]),
        node("div", { className: "section-block" }, [
          node("h3", { className: "section-label", text: "Recommended remediation" }),
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
      const search = node("input", {
        type: "search",
        placeholder: "Search ID, title, or summary",
        value: query,
        ariaLabel: "Search findings"
      });
      search.addEventListener("input", function () {
        query = search.value;
        render();
        const nextSearch = document.querySelector('input[type="search"]');
        if (nextSearch) {
          nextSearch.focus();
          nextSearch.setSelectionRange(query.length, query.length);
        }
      });
      const stateFilter = node("select", { value: filter, ariaLabel: "Filter findings by state" }, [
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

      const openFindingCount = board.counts.fail + board.counts.unknown + board.counts.exception;
      const selectedLabel = board.selectedFinding
        ? board.selectedFinding.category + " · " + board.selectedFinding.severity
        : "No finding selected";
      const clearButton = (function () {
        const clear = node("button", { className: "danger", type: "button", text: "Clear board" });
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
      })();

      app.append(
        node("header", { className: "command-bar" }, [
          node("div", { className: "command-title" }, [
            node("h1", { text: "Evidence Board" }),
            node("p", {
              className: "muted",
              text: documentValue.repository + " · pull request #" + documentValue.pullRequestNumber
            })
          ]),
          node("div", { className: "command-actions" }, [
            board.sample ? node("span", { className: "badge sample", text: "Synthetic contract fixture" }) : null,
            node("span", { className: "badge", text: "SHA bound" }),
            node("span", {
              className: "state " + documentValue.gate.conclusion,
              text: "Gate " + documentValue.gate.conclusion
            })
          ])
        ]),
        node("section", { className: "release-strip", ariaLabel: "Release status and evidence scope" }, [
          node("div", { className: "release-cell release-gate" }, [
            node("div", {}, [
              node("span", { text: "Gate conclusion" }),
              node("strong", { text: documentValue.gate.conclusion.toUpperCase() })
            ]),
            node("span", { className: "state " + documentValue.gate.conclusion, text: documentValue.gate.conclusion })
          ]),
          node("div", { className: "release-cell" }, [
            node("span", { text: "Head SHA" }),
            node("code", { text: documentValue.headSha, title: documentValue.headSha })
          ]),
          node("div", { className: "release-cell" }, [
            node("span", { text: "Needs attention" }),
            node("strong", { text: String(openFindingCount) + " findings" })
          ]),
          node("div", { className: "release-cell" }, [
            node("span", { text: "Protected policy" }),
            node("strong", { text: documentValue.policy.version, title: documentValue.policy.path })
          ]),
          node("div", { className: "release-cell" }, [
            node("span", { text: "Evidence generated" }),
            node("strong", { text: documentValue.generatedAt })
          ])
        ]),
        node("div", { className: "work-grid" }, [
          node("section", { className: "pane queue-pane", ariaLabel: "Finding queue" }, [
            node("div", { className: "pane-header" }, [
              node("h2", { text: "Finding queue" }),
              node("p", { className: "muted", text: visibleFindings.length + " visible" })
            ]),
            node("div", { className: "queue-controls" }, [
              node("div", { className: "counts", role: "group", ariaLabel: "Finding state filters" }, [
                countButton("pass", board.counts.pass),
                countButton("fail", board.counts.fail),
                countButton("unknown", board.counts.unknown),
                countButton("exception", board.counts.exception)
              ]),
              node("div", { className: "toolbar" }, [search, stateFilter])
            ]),
            node(
              "div",
              { className: "finding-list" },
              visibleFindings.length === 0
                ? [node("div", { className: "empty", text: "No findings match the current search and state filter." })]
                : visibleFindings.map(findingButton)
            )
          ]),
          node("section", { className: "pane inspector-pane", ariaLabel: "Selected finding inspector" }, [
            node("div", { className: "pane-header" }, [
              node("h2", { text: "Finding inspector" }),
              node("p", { className: "muted", text: selectedLabel })
            ]),
            node("div", { className: "inspector-scroll" }, [selectedDetail()])
          ]),
          node("aside", { className: "pane context-pane", ariaLabel: "Evidence context" }, [
            node("section", { className: "context-section" }, [
              node("h2", { text: "Evidence scope" }),
              node("div", { className: "metadata" }, [
                datum("Head SHA", documentValue.headSha, true),
                datum("Base SHA", documentValue.baseSha, true),
                datum(
                  "Origin",
                  documentValue.origin.classification +
                    (documentValue.origin.declaredTool ? " · " + documentValue.origin.declaredTool : ""),
                  false
                ),
                datum("Policy", documentValue.policy.path + " · " + documentValue.policy.version, false),
                datum("Policy SHA-256", documentValue.policy.sha256, true)
              ])
            ]),
            node("section", { className: "context-section" }, [
              node("h2", { text: "Disposition history" }),
              dispositionHistory(documentValue)
            ]),
            node("section", { className: "context-section" }, [
              node("h2", { text: "Specialist notes" }),
              reviewerNotes(documentValue)
            ]),
            node("section", { className: "context-section board-controls" }, [
              node("div", {}, [
                node("h2", { text: "Board controls" }),
                node("p", { className: "muted", text: "Clearing affects only this mutable view." })
              ]),
              clearButton
            ])
          ])
        ]),
        node("div", { className: "error", role: "status", text: errorMessage })
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