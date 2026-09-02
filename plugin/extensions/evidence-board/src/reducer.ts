import {
  EvidenceValidationError,
  countFindings,
  documentBoardKey,
  parseDraftDispositionInput,
  parseEvidenceDocument,
  parseFindingSelection,
  projectDispositions,
} from "./model.js";
import type {
  DispositionDecision,
  DraftDispositionInput,
  EvidenceDocument,
  Finding,
  FindingCounts,
} from "./model.js";

export const AUTHORITATIVE_RECORD_MESSAGE =
  "GitHub checks, comments, and reviews are authoritative. This mutable board only coordinates evidence and drafts commands; it never approves or merges.";

export interface DraftDisposition {
  findingId: string;
  decision: DispositionDecision;
  headSha: string;
  reason: string;
  expires?: string;
  command: string;
  createdAt: string;
}

export interface BoardState {
  document: EvidenceDocument | null;
  selectedFindingId: string | null;
  draft: DraftDisposition | null;
  sample: boolean;
  revision: number;
}

export type BoardAction =
  | { type: "set_evidence"; document: unknown; sample?: boolean }
  | { type: "select_finding"; input: unknown }
  | { type: "draft_disposition"; input: unknown }
  | { type: "clear_evidence" };

export interface BoardView {
  document: EvidenceDocument | null;
  selectedFindingId: string | null;
  selectedFinding: Finding | null;
  draft: DraftDisposition | null;
  sample: boolean;
  revision: number;
  counts: FindingCounts;
  dispositions: ReturnType<typeof projectDispositions>;
  authoritativeRecordMessage: string;
  pullRequestUrl: string | null;
}

export class BoardStateError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "BoardStateError";
    this.code = code;
  }
}

export const EMPTY_BOARD_STATE: BoardState = Object.freeze({
  document: null,
  selectedFindingId: null,
  draft: null,
  sample: false,
  revision: 0,
});

function stateError(code: string, message: string): never {
  throw new BoardStateError(code, message);
}

function compareEvidenceFreshness(current: EvidenceDocument, incoming: EvidenceDocument): void {
  if (documentBoardKey(current) !== documentBoardKey(incoming)) {
    stateError(
      "mixed_evidence_scope",
      "Clear the board before loading evidence for a different repository or pull request.",
    );
  }

  if (
    current.headSha === incoming.headSha &&
    (current.baseSha !== incoming.baseSha ||
      current.policy.baseSha !== incoming.policy.baseSha ||
      current.policy.sha256 !== incoming.policy.sha256)
  ) {
    stateError(
      "mixed_policy_state",
      "Evidence for the same head SHA cannot change its protected base or policy digest.",
    );
  }
  const currentGeneratedAt = Date.parse(current.generatedAt);
  const incomingGeneratedAt = Date.parse(incoming.generatedAt);
  const staleSameHead =
    current.headSha === incoming.headSha && incomingGeneratedAt < currentGeneratedAt;
  const staleDifferentHead =
    current.headSha !== incoming.headSha && incomingGeneratedAt <= currentGeneratedAt;
  if (staleSameHead || staleDifferentHead) {
    stateError(
      "stale_evidence",
      `Incoming evidence generated at ${incoming.generatedAt} is older than the loaded ${current.headSha} state.`,
    );
  }
}

function assertDispositionAllowed(finding: Finding, input: DraftDispositionInput, now: Date): void {
  if (finding.state === "pass") {
    stateError(
      "finding_already_passes",
      `${finding.id} is pass and does not accept a disposition.`,
    );
  }

  if (input.decision !== "accept-exception") {
    return;
  }
  if (finding.state !== "unknown" && finding.state !== "exception") {
    stateError(
      "finding_requires_remediation",
      `${finding.id} is ${finding.state}; AgentProof drafts acceptance only for unknown or exception findings.`,
    );
  }
  if (!finding.exceptionable || finding.severity === "critical") {
    stateError(
      "finding_not_exceptionable",
      `${finding.id} is not eligible for exception acceptance.`,
    );
  }
  if (input.expires === undefined || input.expires <= now.toISOString().slice(0, 10)) {
    stateError("invalid_expiry", "An accepted exception must expire on a future UTC date.");
  }
}

function dispositionCommand(input: DraftDispositionInput): string {
  return [
    `/agentproof ${input.decision} ${input.findingId}`,
    `sha: ${input.headSha}`,
    `reason: ${input.reason}`,
    ...(input.expires === undefined ? [] : [`expires: ${input.expires}`]),
  ].join("\n");
}

export function reduceBoard(
  state: BoardState,
  action: BoardAction,
  now: Date = new Date(),
): BoardState {
  switch (action.type) {
    case "set_evidence": {
      const document = parseEvidenceDocument(action.document);
      if (state.document !== null) {
        compareEvidenceFreshness(state.document, document);
      }
      const selectedFindingId =
        state.document?.headSha === document.headSha &&
        state.selectedFindingId !== null &&
        document.findings.some((finding) => finding.id === state.selectedFindingId)
          ? state.selectedFindingId
          : null;
      return {
        document,
        selectedFindingId,
        draft: null,
        sample: action.sample ?? false,
        revision: state.revision + 1,
      };
    }

    case "select_finding": {
      if (state.document === null) {
        return stateError("evidence_not_loaded", "Load evidence before selecting a finding.");
      }
      const id = parseFindingSelection(action.input);
      if (!state.document.findings.some((finding) => finding.id === id)) {
        return stateError(
          "finding_not_found",
          `Finding ${id} is not present in the loaded evidence.`,
        );
      }
      return {
        ...state,
        selectedFindingId: id,
        draft: state.draft?.findingId === id ? state.draft : null,
        revision: state.revision + 1,
      };
    }

    case "draft_disposition": {
      if (state.document === null) {
        return stateError("evidence_not_loaded", "Load evidence before drafting a disposition.");
      }
      const input = parseDraftDispositionInput(action.input);
      if (input.headSha !== state.document.headSha) {
        return stateError(
          "stale_head_sha",
          `Draft SHA ${input.headSha} does not match loaded head ${state.document.headSha}.`,
        );
      }
      const finding = state.document.findings.find((candidate) => candidate.id === input.findingId);
      if (finding === undefined) {
        return stateError(
          "finding_not_found",
          `Finding ${input.findingId} is not present in the loaded evidence.`,
        );
      }
      assertDispositionAllowed(finding, input, now);
      return {
        ...state,
        selectedFindingId: finding.id,
        draft: {
          findingId: input.findingId,
          decision: input.decision,
          headSha: input.headSha,
          reason: input.reason,
          ...(input.expires === undefined ? {} : { expires: input.expires }),
          command: dispositionCommand(input),
          createdAt: now.toISOString(),
        },
        revision: state.revision + 1,
      };
    }

    case "clear_evidence":
      return {
        ...EMPTY_BOARD_STATE,
        revision: state.revision + 1,
      };
  }
}

export function createBoardView(state: BoardState, now = new Date()): BoardView {
  const document = state.document;
  const selectedFinding =
    document?.findings.find((finding) => finding.id === state.selectedFindingId) ?? null;
  return {
    document,
    selectedFindingId: state.selectedFindingId,
    selectedFinding,
    draft: state.draft,
    sample: state.sample,
    revision: state.revision,
    counts:
      document === null
        ? { pass: 0, fail: 0, unknown: 0, exception: 0 }
        : countFindings(document.findings),
    dispositions: document === null ? [] : projectDispositions(document, now),
    authoritativeRecordMessage: AUTHORITATIVE_RECORD_MESSAGE,
    pullRequestUrl:
      document === null
        ? null
        : `https://github.com/${document.repository}/pull/${document.pullRequestNumber}`,
  };
}

export function restoreBoardState(value: unknown, now = new Date()): BoardState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new EvidenceValidationError("stored_state_invalid", "$", "must be an object");
  }
  const stored = value as Record<string, unknown>;
  const allowed = new Set(["document", "selectedFindingId", "draft", "sample", "revision"]);
  const unknown = Object.keys(stored).find((key) => !allowed.has(key));
  if (unknown !== undefined) {
    throw new EvidenceValidationError(
      "stored_state_invalid",
      `$.${unknown}`,
      "is not an allowed property",
    );
  }
  if (stored.document === null || stored.document === undefined) {
    return EMPTY_BOARD_STATE;
  }

  let state = reduceBoard(
    EMPTY_BOARD_STATE,
    {
      type: "set_evidence",
      document: stored.document,
      sample: stored.sample === true,
    },
    now,
  );

  if (typeof stored.selectedFindingId === "string") {
    state = reduceBoard(
      state,
      {
        type: "select_finding",
        input: { id: stored.selectedFindingId },
      },
      now,
    );
  }

  if (typeof stored.draft === "object" && stored.draft !== null && !Array.isArray(stored.draft)) {
    const draft = stored.draft as Record<string, unknown>;
    try {
      state = reduceBoard(
        state,
        {
          type: "draft_disposition",
          input: {
            findingId: draft.findingId,
            decision: draft.decision,
            headSha: draft.headSha,
            reason: draft.reason,
            ...("expires" in draft ? { expires: draft.expires } : {}),
          },
        },
        now,
      );
    } catch (error) {
      if (!(error instanceof BoardStateError) && !(error instanceof EvidenceValidationError)) {
        throw error;
      }
    }
  }

  return state;
}
