import { createHash } from "node:crypto";
export const EVIDENCE_STATES = [
    "pass",
    "fail",
    "unknown",
    "exception"
];
export const FINDING_CATEGORIES = [
    "test",
    "security",
    "policy",
    "provenance"
];
export const SEVERITIES = [
    "info",
    "low",
    "moderate",
    "high",
    "critical"
];
export const DISPOSITION_DECISIONS = [
    "accept-exception",
    "request-remediation",
    "reject"
];
export const DISPOSITION_STATUSES = [
    "accepted",
    "remediation-requested",
    "rejected",
    "superseded",
    "malformed",
    "stale",
    "expired",
    "unauthorized",
    "ineligible",
    "edited-away",
    "deleted"
];
const SHA_SCHEMA = {
    type: "string",
    pattern: "^[0-9a-f]{40}$"
};
const DIGEST_SCHEMA = {
    type: "string",
    pattern: "^[0-9a-f]{64}$"
};
const FINDING_ID_SCHEMA = {
    type: "string",
    minLength: 8,
    maxLength: 80,
    pattern: "^AP-[A-Z0-9]+(?:-[A-Z0-9]+)+$"
};
const TIMESTAMP_SCHEMA = {
    type: "string",
    format: "date-time"
};
const DATE_SCHEMA = {
    type: "string",
    format: "date",
    pattern: "^\\d{4}-\\d{2}-\\d{2}$"
};
export const EVIDENCE_DOCUMENT_SCHEMA = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://agentproof.dev/schemas/evidence-board-final-v1.schema.json",
    type: "object",
    additionalProperties: false,
    required: [
        "schemaVersion",
        "documentType",
        "repository",
        "pullRequestNumber",
        "baseSha",
        "headSha",
        "generatedAt",
        "generatorVersion",
        "origin",
        "policy",
        "tools",
        "findings",
        "diagnostics",
        "dispositions",
        "reviewerNotes",
        "gate",
        "artifact"
    ],
    properties: {
        schemaVersion: {
            const: "1.0.0"
        },
        documentType: {
            const: "final"
        },
        repository: {
            type: "string",
            minLength: 3,
            maxLength: 200,
            pattern: "^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$"
        },
        pullRequestNumber: {
            type: "integer",
            minimum: 1
        },
        baseSha: SHA_SCHEMA,
        headSha: SHA_SCHEMA,
        generatedAt: TIMESTAMP_SCHEMA,
        generatorVersion: {
            type: "string",
            minLength: 1,
            maxLength: 80
        },
        origin: {
            type: "object",
            additionalProperties: false,
            required: [
                "classification",
                "declaredTool",
                "source"
            ],
            properties: {
                classification: {
                    enum: [
                        "github-attributed",
                        "self-declared",
                        "unknown"
                    ]
                },
                declaredTool: {
                    anyOf: [
                        {
                            type: "string",
                            minLength: 1,
                            maxLength: 80
                        },
                        {
                            type: "null"
                        }
                    ]
                },
                source: {
                    enum: [
                        "github",
                        "pull-request-body",
                        "none"
                    ]
                }
            }
        },
        policy: {
            type: "object",
            additionalProperties: false,
            required: [
                "path",
                "version",
                "baseSha",
                "sha256"
            ],
            properties: {
                path: {
                    type: "string",
                    minLength: 1,
                    maxLength: 300
                },
                version: {
                    type: "string",
                    minLength: 1,
                    maxLength: 80
                },
                baseSha: SHA_SCHEMA,
                sha256: DIGEST_SCHEMA
            }
        },
        tools: {
            type: "object",
            additionalProperties: false,
            required: [
                "nodeVersion",
                "npmVersion",
                "vitestVersion",
                "auditDatabaseUpdatedAt",
                "agentproofVersion"
            ],
            properties: {
                nodeVersion: {
                    type: "string",
                    minLength: 1,
                    maxLength: 80
                },
                npmVersion: {
                    anyOf: [
                        {
                            type: "string",
                            minLength: 1,
                            maxLength: 80
                        },
                        {
                            type: "null"
                        }
                    ]
                },
                vitestVersion: {
                    anyOf: [
                        {
                            type: "string",
                            minLength: 1,
                            maxLength: 80
                        },
                        {
                            type: "null"
                        }
                    ]
                },
                auditDatabaseUpdatedAt: {
                    anyOf: [
                        TIMESTAMP_SCHEMA,
                        {
                            type: "null"
                        }
                    ]
                },
                agentproofVersion: {
                    type: "string",
                    minLength: 1,
                    maxLength: 80
                }
            }
        },
        findings: {
            type: "array",
            minItems: 1,
            maxItems: 500,
            items: {
                $ref: "#/$defs/finding"
            }
        },
        diagnostics: {
            type: "array",
            maxItems: 100,
            items: {
                $ref: "#/$defs/diagnostic"
            }
        },
        dispositions: {
            type: "array",
            maxItems: 1000,
            items: {
                $ref: "#/$defs/disposition"
            }
        },
        reviewerNotes: {
            type: "array",
            maxItems: 100,
            items: {
                $ref: "#/$defs/reviewerNote"
            }
        },
        gate: {
            type: "object",
            additionalProperties: false,
            required: [
                "conclusion",
                "unresolvedFindingIds",
                "counts",
                "evaluatedAt",
                "validUntil"
            ],
            properties: {
                conclusion: {
                    enum: [
                        "success",
                        "failure"
                    ]
                },
                unresolvedFindingIds: {
                    type: "array",
                    maxItems: 500,
                    uniqueItems: true,
                    items: FINDING_ID_SCHEMA
                },
                counts: {
                    type: "object",
                    additionalProperties: false,
                    required: [
                        "pass",
                        "fail",
                        "unknown",
                        "exception"
                    ],
                    properties: {
                        pass: {
                            type: "integer",
                            minimum: 0
                        },
                        fail: {
                            type: "integer",
                            minimum: 0
                        },
                        unknown: {
                            type: "integer",
                            minimum: 0
                        },
                        exception: {
                            type: "integer",
                            minimum: 0
                        }
                    }
                },
                evaluatedAt: TIMESTAMP_SCHEMA,
                validUntil: {
                    anyOf: [
                        TIMESTAMP_SCHEMA,
                        {
                            type: "null"
                        }
                    ]
                }
            }
        },
        artifact: {
            type: "object",
            additionalProperties: false,
            required: [
                "sha256",
                "workflowRunUrl"
            ],
            properties: {
                sha256: DIGEST_SCHEMA,
                workflowRunUrl: {
                    anyOf: [
                        {
                            type: "string",
                            format: "uri",
                            maxLength: 500
                        },
                        {
                            type: "null"
                        }
                    ]
                }
            }
        }
    },
    $defs: {
        jsonValue: {
            anyOf: [
                {
                    type: "null"
                },
                {
                    type: "boolean"
                },
                {
                    type: "number"
                },
                {
                    type: "string",
                    maxLength: 1000
                },
                {
                    type: "array",
                    maxItems: 100,
                    items: {
                        $ref: "#/$defs/jsonValue"
                    }
                },
                {
                    type: "object",
                    maxProperties: 100,
                    propertyNames: {
                        minLength: 1,
                        maxLength: 80
                    },
                    additionalProperties: {
                        $ref: "#/$defs/jsonValue"
                    }
                }
            ]
        },
        evidenceReference: {
            type: "object",
            additionalProperties: false,
            required: [
                "kind",
                "name"
            ],
            properties: {
                kind: {
                    enum: [
                        "file",
                        "test",
                        "coverage",
                        "advisory",
                        "command",
                        "pull-request",
                        "policy",
                        "workflow"
                    ]
                },
                name: {
                    type: "string",
                    minLength: 1,
                    maxLength: 120
                },
                path: {
                    type: "string",
                    minLength: 1,
                    maxLength: 300
                },
                url: {
                    type: "string",
                    format: "uri",
                    maxLength: 500
                },
                line: {
                    type: "integer",
                    minimum: 1
                },
                sha256: DIGEST_SCHEMA
            }
        },
        finding: {
            type: "object",
            additionalProperties: false,
            required: [
                "id",
                "category",
                "state",
                "severity",
                "title",
                "summary",
                "evidenceRefs",
                "exceptionable",
                "remediationHint",
                "collector",
                "sourceSha",
                "facts"
            ],
            properties: {
                id: FINDING_ID_SCHEMA,
                category: {
                    enum: [
                        "test",
                        "security",
                        "policy",
                        "provenance"
                    ]
                },
                state: {
                    enum: [
                        "pass",
                        "fail",
                        "unknown",
                        "exception"
                    ]
                },
                severity: {
                    enum: [
                        "info",
                        "low",
                        "moderate",
                        "high",
                        "critical"
                    ]
                },
                title: {
                    type: "string",
                    minLength: 1,
                    maxLength: 120
                },
                summary: {
                    type: "string",
                    minLength: 1,
                    maxLength: 1000
                },
                evidenceRefs: {
                    type: "array",
                    maxItems: 50,
                    items: {
                        $ref: "#/$defs/evidenceReference"
                    }
                },
                exceptionable: {
                    type: "boolean"
                },
                remediationHint: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500
                },
                collector: {
                    type: "string",
                    minLength: 1,
                    maxLength: 80,
                    pattern: "^[a-z0-9-]+$"
                },
                sourceSha: SHA_SCHEMA,
                facts: {
                    type: "object",
                    maxProperties: 50,
                    propertyNames: {
                        pattern: "^[A-Za-z][A-Za-z0-9]*$",
                        maxLength: 80
                    },
                    additionalProperties: {
                        $ref: "#/$defs/jsonValue"
                    }
                }
            }
        },
        diagnostic: {
            type: "object",
            additionalProperties: false,
            required: [
                "collector",
                "level",
                "code",
                "message"
            ],
            properties: {
                collector: {
                    type: "string",
                    minLength: 1,
                    maxLength: 80,
                    pattern: "^[a-z0-9-]+$"
                },
                level: {
                    enum: [
                        "warning",
                        "error"
                    ]
                },
                code: {
                    type: "string",
                    minLength: 1,
                    maxLength: 80,
                    pattern: "^AP_[A-Z0-9_]+$"
                },
                message: {
                    type: "string",
                    minLength: 1,
                    maxLength: 500
                }
            }
        },
        disposition: {
            type: "object",
            additionalProperties: false,
            required: [
                "findingId",
                "decision",
                "actor",
                "actorPermission",
                "commentId",
                "commentUrl",
                "bodySha256",
                "rationale",
                "expires",
                "recordedAt",
                "boundHeadSha",
                "status",
                "effective",
                "errors"
            ],
            properties: {
                findingId: {
                    anyOf: [
                        FINDING_ID_SCHEMA,
                        {
                            type: "null"
                        }
                    ]
                },
                decision: {
                    enum: [
                        "accept-exception",
                        "request-remediation",
                        "reject",
                        "invalid"
                    ]
                },
                actor: {
                    type: "string",
                    minLength: 1,
                    maxLength: 100
                },
                actorPermission: {
                    enum: [
                        "none",
                        "read",
                        "triage",
                        "write",
                        "maintain",
                        "admin"
                    ]
                },
                commentId: {
                    type: "string",
                    minLength: 1,
                    maxLength: 40
                },
                commentUrl: {
                    type: "string",
                    format: "uri",
                    maxLength: 500
                },
                bodySha256: DIGEST_SCHEMA,
                rationale: {
                    anyOf: [
                        {
                            type: "string",
                            minLength: 1,
                            maxLength: 1000
                        },
                        {
                            type: "null"
                        }
                    ]
                },
                expires: {
                    anyOf: [
                        DATE_SCHEMA,
                        {
                            type: "null"
                        }
                    ]
                },
                recordedAt: TIMESTAMP_SCHEMA,
                boundHeadSha: {
                    anyOf: [
                        SHA_SCHEMA,
                        {
                            type: "null"
                        }
                    ]
                },
                status: {
                    enum: DISPOSITION_STATUSES
                },
                effective: {
                    type: "boolean"
                },
                errors: {
                    type: "array",
                    maxItems: 20,
                    items: {
                        type: "string",
                        minLength: 1,
                        maxLength: 300
                    }
                }
            }
        },
        reviewerNote: {
            type: "object",
            additionalProperties: false,
            required: [
                "specialist",
                "sessionUrl",
                "sourceSha",
                "summary",
                "findingIds",
                "createdAt",
                "fragmentSha256"
            ],
            properties: {
                specialist: {
                    enum: [
                        "test",
                        "security",
                        "policy",
                        "evidence"
                    ]
                },
                sessionUrl: {
                    type: "string",
                    format: "uri",
                    maxLength: 500
                },
                sourceSha: SHA_SCHEMA,
                summary: {
                    type: "string",
                    minLength: 1,
                    maxLength: 1000
                },
                findingIds: {
                    type: "array",
                    maxItems: 50,
                    items: FINDING_ID_SCHEMA
                },
                createdAt: TIMESTAMP_SCHEMA,
                fragmentSha256: DIGEST_SCHEMA
            }
        }
    }
};
export const SELECT_FINDING_SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: [
        "id"
    ],
    properties: {
        id: FINDING_ID_SCHEMA
    }
};
export const DRAFT_DISPOSITION_SCHEMA = {
    type: "object",
    additionalProperties: false,
    required: [
        "findingId",
        "decision",
        "headSha",
        "reason"
    ],
    properties: {
        findingId: FINDING_ID_SCHEMA,
        decision: {
            enum: [
                "accept-exception",
                "request-remediation",
                "reject"
            ]
        },
        headSha: SHA_SCHEMA,
        reason: {
            type: "string",
            minLength: 20,
            maxLength: 500,
            pattern: "^[^\\r\\n]+$"
        },
        expires: DATE_SCHEMA
    }
};
export const OPEN_EVIDENCE_BOARD_SCHEMA = {
    type: "object",
    additionalProperties: false,
    properties: {
        document: EVIDENCE_DOCUMENT_SCHEMA,
        repository: EVIDENCE_DOCUMENT_SCHEMA.properties.repository,
        pullRequestNumber: EVIDENCE_DOCUMENT_SCHEMA.properties.pullRequestNumber,
        expectedHeadSha: SHA_SCHEMA,
        useSample: {
            type: "boolean"
        }
    }
};
export class EvidenceValidationError extends Error {
    code;
    path;
    constructor(code, path, message){
        super(`${path}: ${message}`);
        this.name = "EvidenceValidationError";
        this.code = code;
        this.path = path;
    }
}
const SHA_PATTERN = /^[0-9a-f]{40}$/u;
const DIGEST_PATTERN = /^[0-9a-f]{64}$/u;
const FINDING_ID_PATTERN = /^AP-[A-Z0-9]+(?:-[A-Z0-9]+)+$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const COLLECTOR_PATTERN = /^[a-z0-9-]+$/u;
function invalid(code, path, message) {
    throw new EvidenceValidationError(code, path, message);
}
function objectAt(value, path) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return invalid("schema_invalid", path, "must be an object");
    }
    return value;
}
function rejectUnknown(object, allowed, path) {
    const allowedSet = new Set(allowed);
    const unknown = Object.keys(object).find((key)=>!allowedSet.has(key));
    if (unknown !== undefined) {
        invalid("schema_invalid", `${path}.${unknown}`, "is not an allowed property");
    }
}
function stringAt(value, path, minimum, maximum) {
    if (typeof value !== "string") {
        return invalid("schema_invalid", path, "must be a string");
    }
    if (value.length < minimum || value.length > maximum) {
        return invalid("schema_invalid", path, `must contain between ${minimum} and ${maximum} characters`);
    }
    return value;
}
function nullableStringAt(value, path, minimum, maximum) {
    return value === null ? null : stringAt(value, path, minimum, maximum);
}
function optionalStringAt(object, key, path, minimum, maximum) {
    return key in object ? stringAt(object[key], `${path}.${key}`, minimum, maximum) : undefined;
}
function integerAt(value, path, minimum = 0) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) {
        return invalid("schema_invalid", path, `must be an integer greater than or equal to ${minimum}`);
    }
    return value;
}
function booleanAt(value, path) {
    if (typeof value !== "boolean") {
        return invalid("schema_invalid", path, "must be a boolean");
    }
    return value;
}
function arrayAt(value, path, maximum, minimum = 0) {
    if (!Array.isArray(value)) {
        return invalid("schema_invalid", path, "must be an array");
    }
    if (value.length < minimum || value.length > maximum) {
        return invalid("schema_invalid", path, `must contain between ${minimum} and ${maximum} entries`);
    }
    return value;
}
function enumAt(value, allowed, path) {
    if (typeof value !== "string" || !allowed.includes(value)) {
        return invalid("schema_invalid", path, `must be one of: ${allowed.join(", ")}`);
    }
    return value;
}
function shaAt(value, path) {
    const sha = stringAt(value, path, 40, 40);
    return SHA_PATTERN.test(sha) ? sha : invalid("schema_invalid", path, "must be a lowercase 40-character Git SHA");
}
function digestAt(value, path) {
    const digest = stringAt(value, path, 64, 64);
    return DIGEST_PATTERN.test(digest) ? digest : invalid("schema_invalid", path, "must be a lowercase SHA-256 digest");
}
function dateTimeAt(value, path) {
    const timestamp = stringAt(value, path, 20, 40);
    const parsed = new Date(timestamp);
    if (!timestamp.includes("T") || Number.isNaN(parsed.valueOf())) {
        return invalid("schema_invalid", path, "must be an RFC 3339 date-time");
    }
    return parsed.toISOString();
}
function nullableDateTimeAt(value, path) {
    return value === null ? null : dateTimeAt(value, path);
}
function dateAt(value, path) {
    const date = stringAt(value, path, 10, 10);
    if (!DATE_PATTERN.test(date)) {
        return invalid("schema_invalid", path, "must use YYYY-MM-DD");
    }
    const normalized = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(normalized.valueOf()) || normalized.toISOString().slice(0, 10) !== date) {
        return invalid("schema_invalid", path, "must be a real calendar date");
    }
    return date;
}
function nullableDateAt(value, path) {
    return value === null ? null : dateAt(value, path);
}
function urlAt(value, path) {
    const url = stringAt(value, path, 1, 500);
    let parsed;
    try {
        parsed = new URL(url);
    } catch  {
        return invalid("schema_invalid", path, "must be an absolute URL");
    }
    if (![
        "https:",
        "http:"
    ].includes(parsed.protocol) || parsed.username !== "" || parsed.password !== "") {
        return invalid("schema_invalid", path, "must be an HTTP(S) URL without credentials");
    }
    return url;
}
function nullableUrlAt(value, path) {
    return value === null ? null : urlAt(value, path);
}
function repositoryAt(value, path) {
    const repository = stringAt(value, path, 3, 200);
    return REPOSITORY_PATTERN.test(repository) ? repository : invalid("schema_invalid", path, "must use OWNER/REPOSITORY form");
}
function relativePathAt(value, path) {
    const repositoryPath = stringAt(value, path, 1, 300);
    if (repositoryPath.startsWith("/") || repositoryPath.startsWith("\\") || /^[A-Za-z]:/u.test(repositoryPath) || repositoryPath.split(/[\\/]/u).includes("..")) {
        return invalid("schema_invalid", path, "must be a repository-relative path");
    }
    return repositoryPath;
}
function findingIdAt(value, path) {
    const id = stringAt(value, path, 8, 80);
    return FINDING_ID_PATTERN.test(id) ? id : invalid("schema_invalid", path, "must be a stable AgentProof finding ID");
}
function collectorAt(value, path) {
    const collector = stringAt(value, path, 1, 80);
    return COLLECTOR_PATTERN.test(collector) ? collector : invalid("schema_invalid", path, "must contain lowercase letters, numbers, and hyphens");
}
function parseJsonValue(value, path, depth, counter) {
    counter.nodes += 1;
    if (depth > 5 || counter.nodes > 500) {
        return invalid("schema_invalid", path, "exceeds the evidence fact depth or node bound");
    }
    if (value === null || typeof value === "boolean" || typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        return stringAt(value, path, 0, 1000);
    }
    if (Array.isArray(value)) {
        return arrayAt(value, path, 100).map((entry, index)=>parseJsonValue(entry, `${path}[${index}]`, depth + 1, counter));
    }
    const object = objectAt(value, path);
    const entries = Object.entries(object);
    if (entries.length > 100) {
        return invalid("schema_invalid", path, "must not contain more than 100 properties");
    }
    return Object.fromEntries(entries.map(([key, entry])=>[
            stringAt(key, `${path} key`, 1, 80),
            parseJsonValue(entry, `${path}.${key}`, depth + 1, counter)
        ]));
}
function parseFacts(value, path) {
    const object = objectAt(value, path);
    const entries = Object.entries(object);
    if (entries.length > 50) {
        invalid("schema_invalid", path, "must not contain more than 50 fact properties");
    }
    const counter = {
        nodes: 1
    };
    return Object.fromEntries(entries.map(([key, entry])=>{
        if (!/^[A-Za-z][A-Za-z0-9]*$/u.test(key) || key.length > 80) {
            invalid("schema_invalid", `${path}.${key}`, "has an invalid fact key");
        }
        return [
            key,
            parseJsonValue(entry, `${path}.${key}`, 1, counter)
        ];
    }));
}
function parseEvidenceReference(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "kind",
        "name",
        "path",
        "url",
        "line",
        "sha256"
    ], path);
    const repositoryPath = optionalStringAt(object, "path", path, 1, 300);
    const url = optionalStringAt(object, "url", path, 1, 500);
    const line = "line" in object ? integerAt(object.line, `${path}.line`, 1) : undefined;
    const sha256 = "sha256" in object ? digestAt(object.sha256, `${path}.sha256`) : undefined;
    return {
        kind: enumAt(object.kind, [
            "file",
            "test",
            "coverage",
            "advisory",
            "command",
            "pull-request",
            "policy",
            "workflow"
        ], `${path}.kind`),
        name: stringAt(object.name, `${path}.name`, 1, 120),
        ...repositoryPath === undefined ? {} : {
            path: relativePathAt(repositoryPath, `${path}.path`)
        },
        ...url === undefined ? {} : {
            url: urlAt(url, `${path}.url`)
        },
        ...line === undefined ? {} : {
            line
        },
        ...sha256 === undefined ? {} : {
            sha256
        }
    };
}
function parseFinding(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "id",
        "category",
        "state",
        "severity",
        "title",
        "summary",
        "evidenceRefs",
        "exceptionable",
        "remediationHint",
        "collector",
        "sourceSha",
        "facts"
    ], path);
    return {
        id: findingIdAt(object.id, `${path}.id`),
        category: enumAt(object.category, FINDING_CATEGORIES, `${path}.category`),
        state: enumAt(object.state, EVIDENCE_STATES, `${path}.state`),
        severity: enumAt(object.severity, SEVERITIES, `${path}.severity`),
        title: stringAt(object.title, `${path}.title`, 1, 120),
        summary: stringAt(object.summary, `${path}.summary`, 1, 1000),
        evidenceRefs: arrayAt(object.evidenceRefs, `${path}.evidenceRefs`, 50).map((reference, index)=>parseEvidenceReference(reference, `${path}.evidenceRefs[${index}]`)),
        exceptionable: booleanAt(object.exceptionable, `${path}.exceptionable`),
        remediationHint: stringAt(object.remediationHint, `${path}.remediationHint`, 1, 500),
        collector: collectorAt(object.collector, `${path}.collector`),
        sourceSha: shaAt(object.sourceSha, `${path}.sourceSha`),
        facts: parseFacts(object.facts, `${path}.facts`)
    };
}
function parseDiagnostic(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "collector",
        "level",
        "code",
        "message"
    ], path);
    const code = stringAt(object.code, `${path}.code`, 1, 80);
    if (!/^AP_[A-Z0-9_]+$/u.test(code)) {
        invalid("schema_invalid", `${path}.code`, "must be an AgentProof diagnostic code");
    }
    return {
        collector: collectorAt(object.collector, `${path}.collector`),
        level: enumAt(object.level, [
            "warning",
            "error"
        ], `${path}.level`),
        code,
        message: stringAt(object.message, `${path}.message`, 1, 500)
    };
}
function parseDisposition(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "findingId",
        "decision",
        "actor",
        "actorPermission",
        "commentId",
        "commentUrl",
        "bodySha256",
        "rationale",
        "expires",
        "recordedAt",
        "boundHeadSha",
        "status",
        "effective",
        "errors"
    ], path);
    return {
        findingId: object.findingId === null ? null : findingIdAt(object.findingId, `${path}.findingId`),
        decision: enumAt(object.decision, [
            "accept-exception",
            "request-remediation",
            "reject",
            "invalid"
        ], `${path}.decision`),
        actor: stringAt(object.actor, `${path}.actor`, 1, 100),
        actorPermission: enumAt(object.actorPermission, [
            "none",
            "read",
            "triage",
            "write",
            "maintain",
            "admin"
        ], `${path}.actorPermission`),
        commentId: stringAt(object.commentId, `${path}.commentId`, 1, 40),
        commentUrl: urlAt(object.commentUrl, `${path}.commentUrl`),
        bodySha256: digestAt(object.bodySha256, `${path}.bodySha256`),
        rationale: nullableStringAt(object.rationale, `${path}.rationale`, 1, 1000),
        expires: nullableDateAt(object.expires, `${path}.expires`),
        recordedAt: dateTimeAt(object.recordedAt, `${path}.recordedAt`),
        boundHeadSha: object.boundHeadSha === null ? null : shaAt(object.boundHeadSha, `${path}.boundHeadSha`),
        status: enumAt(object.status, DISPOSITION_STATUSES, `${path}.status`),
        effective: booleanAt(object.effective, `${path}.effective`),
        errors: arrayAt(object.errors, `${path}.errors`, 20).map((error, index)=>stringAt(error, `${path}.errors[${index}]`, 1, 300))
    };
}
function parseReviewerNote(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "specialist",
        "sessionUrl",
        "sourceSha",
        "summary",
        "findingIds",
        "createdAt",
        "fragmentSha256"
    ], path);
    return {
        specialist: enumAt(object.specialist, [
            "test",
            "security",
            "policy",
            "evidence"
        ], `${path}.specialist`),
        sessionUrl: urlAt(object.sessionUrl, `${path}.sessionUrl`),
        sourceSha: shaAt(object.sourceSha, `${path}.sourceSha`),
        summary: stringAt(object.summary, `${path}.summary`, 1, 1000),
        findingIds: arrayAt(object.findingIds, `${path}.findingIds`, 50).map((id, index)=>findingIdAt(id, `${path}.findingIds[${index}]`)),
        createdAt: dateTimeAt(object.createdAt, `${path}.createdAt`),
        fragmentSha256: digestAt(object.fragmentSha256, `${path}.fragmentSha256`)
    };
}
function parseOrigin(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "classification",
        "declaredTool",
        "source"
    ], path);
    return {
        classification: enumAt(object.classification, [
            "github-attributed",
            "self-declared",
            "unknown"
        ], `${path}.classification`),
        declaredTool: nullableStringAt(object.declaredTool, `${path}.declaredTool`, 1, 80),
        source: enumAt(object.source, [
            "github",
            "pull-request-body",
            "none"
        ], `${path}.source`)
    };
}
function parsePolicy(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "path",
        "version",
        "baseSha",
        "sha256"
    ], path);
    return {
        path: relativePathAt(object.path, `${path}.path`),
        version: stringAt(object.version, `${path}.version`, 1, 80),
        baseSha: shaAt(object.baseSha, `${path}.baseSha`),
        sha256: digestAt(object.sha256, `${path}.sha256`)
    };
}
function parseTools(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "nodeVersion",
        "npmVersion",
        "vitestVersion",
        "auditDatabaseUpdatedAt",
        "agentproofVersion"
    ], path);
    return {
        nodeVersion: stringAt(object.nodeVersion, `${path}.nodeVersion`, 1, 80),
        npmVersion: nullableStringAt(object.npmVersion, `${path}.npmVersion`, 1, 80),
        vitestVersion: nullableStringAt(object.vitestVersion, `${path}.vitestVersion`, 1, 80),
        auditDatabaseUpdatedAt: nullableDateTimeAt(object.auditDatabaseUpdatedAt, `${path}.auditDatabaseUpdatedAt`),
        agentproofVersion: stringAt(object.agentproofVersion, `${path}.agentproofVersion`, 1, 80)
    };
}
function parseCounts(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, EVIDENCE_STATES, path);
    return {
        pass: integerAt(object.pass, `${path}.pass`),
        fail: integerAt(object.fail, `${path}.fail`),
        unknown: integerAt(object.unknown, `${path}.unknown`),
        exception: integerAt(object.exception, `${path}.exception`)
    };
}
function parseGate(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "conclusion",
        "unresolvedFindingIds",
        "counts",
        "evaluatedAt",
        "validUntil"
    ], path);
    const unresolvedFindingIds = arrayAt(object.unresolvedFindingIds, `${path}.unresolvedFindingIds`, 500).map((id, index)=>findingIdAt(id, `${path}.unresolvedFindingIds[${index}]`));
    if (new Set(unresolvedFindingIds).size !== unresolvedFindingIds.length) {
        invalid("schema_invalid", `${path}.unresolvedFindingIds`, "must contain unique IDs");
    }
    return {
        conclusion: enumAt(object.conclusion, [
            "success",
            "failure"
        ], `${path}.conclusion`),
        unresolvedFindingIds,
        counts: parseCounts(object.counts, `${path}.counts`),
        evaluatedAt: dateTimeAt(object.evaluatedAt, `${path}.evaluatedAt`),
        validUntil: nullableDateTimeAt(object.validUntil, `${path}.validUntil`)
    };
}
function parseArtifact(value, path) {
    const object = objectAt(value, path);
    rejectUnknown(object, [
        "sha256",
        "workflowRunUrl"
    ], path);
    return {
        sha256: digestAt(object.sha256, `${path}.sha256`),
        workflowRunUrl: nullableUrlAt(object.workflowRunUrl, `${path}.workflowRunUrl`)
    };
}
export function countFindings(findings) {
    const counts = {
        pass: 0,
        fail: 0,
        unknown: 0,
        exception: 0
    };
    for (const finding of findings){
        counts[finding.state] += 1;
    }
    return counts;
}
function canonicalJson(value, ancestors = new Set()) {
    if (value === null) return "null";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number" && Number.isFinite(value)) return JSON.stringify(value);
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value !== "object") {
        return invalid("artifact_digest_invalid", "$.artifact.sha256", "document is not canonical JSON");
    }
    if (ancestors.has(value)) {
        return invalid("artifact_digest_invalid", "$.artifact.sha256", "document contains a cycle");
    }
    ancestors.add(value);
    try {
        if (Array.isArray(value)) {
            return `[${value.map((entry)=>canonicalJson(entry, ancestors)).join(",")}]`;
        }
        const record = value;
        return `{${Object.keys(record).sort().map((key)=>`${JSON.stringify(key)}:${canonicalJson(record[key], ancestors)}`).join(",")}}`;
    } finally{
        ancestors.delete(value);
    }
}
export function computeArtifactDigest(document) {
    const unsigned = {
        ...document,
        artifact: {
            ...document.artifact,
            sha256: "0".repeat(64)
        }
    };
    return createHash("sha256").update(canonicalJson(unsigned)).digest("hex");
}
function validateDocumentSemantics(document) {
    if (document.policy.baseSha !== document.baseSha) {
        invalid("mixed_base_sha", "$.policy.baseSha", "must match the evidence baseSha");
    }
    const duplicateFinding = document.findings.find((finding, index)=>document.findings.findIndex((candidate)=>candidate.id === finding.id) !== index);
    if (duplicateFinding !== undefined) {
        invalid("duplicate_finding", "$.findings", `contains duplicate ID ${duplicateFinding.id}`);
    }
    for (const finding of document.findings){
        if (finding.sourceSha !== document.headSha) {
            invalid("mixed_head_sha", `$.findings.${finding.id}.sourceSha`, "must match the evidence headSha");
        }
    }
    const findingIds = new Set(document.findings.map((finding)=>finding.id));
    for (const note of document.reviewerNotes){
        if (note.sourceSha !== document.headSha) {
            invalid("mixed_head_sha", `$.reviewerNotes.${note.specialist}.sourceSha`, "must match the evidence headSha");
        }
        const unknownId = note.findingIds.find((id)=>!findingIds.has(id));
        if (unknownId !== undefined) {
            invalid("unknown_finding", "$.reviewerNotes.findingIds", `contains unknown ID ${unknownId}`);
        }
    }
    const unknownUnresolved = document.gate.unresolvedFindingIds.find((id)=>!findingIds.has(id));
    if (unknownUnresolved !== undefined) {
        invalid("unknown_finding", "$.gate.unresolvedFindingIds", `contains unknown ID ${unknownUnresolved}`);
    }
    const actualCounts = countFindings(document.findings);
    for (const state of EVIDENCE_STATES){
        if (document.gate.counts[state] !== actualCounts[state]) {
            invalid("gate_count_mismatch", `$.gate.counts.${state}`, `expected ${actualCounts[state]} from findings`);
        }
    }
    const accepted = new Set(document.dispositions.flatMap((disposition)=>disposition.effective && disposition.status === "accepted" && disposition.decision === "accept-exception" && disposition.findingId !== null && disposition.boundHeadSha === document.headSha && disposition.expires !== null && `${disposition.expires}T23:59:59.999Z` >= document.gate.evaluatedAt ? [
            disposition.findingId
        ] : []));
    const forcedBlockers = new Set(document.dispositions.flatMap((disposition)=>disposition.effective && disposition.findingId !== null && disposition.decision !== "accept-exception" ? [
            disposition.findingId
        ] : []));
    const expectedUnresolved = document.findings.filter((finding)=>forcedBlockers.has(finding.id) || finding.state !== "pass" && !(finding.state === "exception" && accepted.has(finding.id))).map((finding)=>finding.id).sort();
    const actualUnresolved = [
        ...document.gate.unresolvedFindingIds
    ].sort();
    if (expectedUnresolved.join("\n") !== actualUnresolved.join("\n")) {
        invalid("gate_unresolved_mismatch", "$.gate.unresolvedFindingIds", "does not match the fail-closed finding and disposition state");
    }
    const expectedConclusion = expectedUnresolved.length === 0 ? "success" : "failure";
    if (document.gate.conclusion !== expectedConclusion) {
        invalid("gate_conclusion_mismatch", "$.gate.conclusion", `must be ${expectedConclusion} for the unresolved findings`);
    }
    const digest = computeArtifactDigest(document);
    if (digest !== document.artifact.sha256) {
        invalid("artifact_digest_mismatch", "$.artifact.sha256", `does not match canonical document digest ${digest}`);
    }
}
export function parseEvidenceDocument(value) {
    const object = objectAt(value, "$");
    rejectUnknown(object, [
        "schemaVersion",
        "documentType",
        "repository",
        "pullRequestNumber",
        "baseSha",
        "headSha",
        "generatedAt",
        "generatorVersion",
        "origin",
        "policy",
        "tools",
        "findings",
        "diagnostics",
        "dispositions",
        "reviewerNotes",
        "gate",
        "artifact"
    ], "$");
    if (object.schemaVersion !== "1.0.0") {
        invalid("unsupported_schema_version", "$.schemaVersion", "only schema version 1.0.0 is supported");
    }
    if (object.documentType !== "final") {
        invalid("invalid_document_type", "$.documentType", "must be final evidence");
    }
    const document = {
        schemaVersion: "1.0.0",
        documentType: "final",
        repository: repositoryAt(object.repository, "$.repository"),
        pullRequestNumber: integerAt(object.pullRequestNumber, "$.pullRequestNumber", 1),
        baseSha: shaAt(object.baseSha, "$.baseSha"),
        headSha: shaAt(object.headSha, "$.headSha"),
        generatedAt: dateTimeAt(object.generatedAt, "$.generatedAt"),
        generatorVersion: stringAt(object.generatorVersion, "$.generatorVersion", 1, 80),
        origin: parseOrigin(object.origin, "$.origin"),
        policy: parsePolicy(object.policy, "$.policy"),
        tools: parseTools(object.tools, "$.tools"),
        findings: arrayAt(object.findings, "$.findings", 500, 1).map((finding, index)=>parseFinding(finding, `$.findings[${index}]`)),
        diagnostics: arrayAt(object.diagnostics, "$.diagnostics", 100).map((diagnostic, index)=>parseDiagnostic(diagnostic, `$.diagnostics[${index}]`)),
        dispositions: arrayAt(object.dispositions, "$.dispositions", 1000).map((disposition, index)=>parseDisposition(disposition, `$.dispositions[${index}]`)),
        reviewerNotes: arrayAt(object.reviewerNotes, "$.reviewerNotes", 100).map((note, index)=>parseReviewerNote(note, `$.reviewerNotes[${index}]`)),
        gate: parseGate(object.gate, "$.gate"),
        artifact: parseArtifact(object.artifact, "$.artifact")
    };
    validateDocumentSemantics(document);
    return document;
}
export function parseDraftDispositionInput(value) {
    const object = objectAt(value, "$");
    rejectUnknown(object, [
        "findingId",
        "decision",
        "headSha",
        "reason",
        "expires"
    ], "$");
    const decision = enumAt(object.decision, DISPOSITION_DECISIONS, "$.decision");
    const rawReason = stringAt(object.reason, "$.reason", 20, 500);
    if (/[\r\n]/u.test(rawReason)) {
        invalid("invalid_reason", "$.reason", "must be a single line");
    }
    const reason = rawReason.trim();
    if (reason.length < 20) {
        invalid("invalid_reason", "$.reason", "must contain at least 20 non-padding characters");
    }
    const expires = "expires" in object ? dateAt(object.expires, "$.expires") : undefined;
    if (decision === "accept-exception" && expires === undefined) {
        invalid("missing_expiry", "$.expires", "is required for an accepted exception");
    }
    if (decision !== "accept-exception" && expires !== undefined) {
        invalid("unexpected_expiry", "$.expires", "is allowed only for accepted exceptions");
    }
    return {
        findingId: findingIdAt(object.findingId, "$.findingId"),
        decision,
        headSha: shaAt(object.headSha, "$.headSha"),
        reason,
        ...expires === undefined ? {} : {
            expires
        }
    };
}
export function parseFindingSelection(value) {
    const object = objectAt(value, "$");
    rejectUnknown(object, [
        "id"
    ], "$");
    return findingIdAt(object.id, "$.id");
}
export function isDispositionExpired(disposition, now = new Date()) {
    return disposition.expires !== null && new Date(`${disposition.expires}T23:59:59.999Z`).valueOf() < now.valueOf();
}
export function projectDispositions(document, now = new Date()) {
    return [
        ...document.dispositions
    ].sort((left, right)=>Date.parse(right.recordedAt) - Date.parse(left.recordedAt)).map((disposition)=>{
        const stale = disposition.status === "stale" || disposition.boundHeadSha !== null && disposition.boundHeadSha !== document.headSha;
        const expired = disposition.status === "expired" || isDispositionExpired(disposition, now);
        const effective = disposition.effective && disposition.status === "accepted" && !stale && !expired;
        const badge = stale ? "stale" : expired ? "expired" : disposition.effective ? "current" : disposition.status;
        return {
            disposition,
            stale,
            expired,
            effective,
            badge
        };
    });
}
export function boardKey(repository, pullRequestNumber) {
    return `${repository}#${pullRequestNumber}`;
}
export function documentBoardKey(document) {
    return boardKey(document.repository, document.pullRequestNumber);
}
export function shortSha(sha) {
    return sha.slice(0, 12);
}


//# sourceURL=agentproof://model.ts