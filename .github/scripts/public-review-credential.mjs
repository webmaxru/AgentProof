import { request } from "node:https";
import { performance } from "node:perf_hooks";
import { clearTimeout, setTimeout } from "node:timers";
import { TextDecoder } from "node:util";
import { AgentProofError } from "@agentproof/evidence-core";

export const MAX_CREDENTIAL_RESPONSE_BYTES = 32 * 1024;
export const CREDENTIAL_TIMEOUT_MS = 10_000;
const MAX_CREDENTIAL_HEADER_BYTES = 8192;
const ENDPOINT = "https://api.github.com/user";
const ERRORS = {
  INPUT: "Credential-owner verification requires a sealed explicit credential and expected user.",
  DIAGNOSTICS:
    "Credential-owner transport requires host debugging and preload diagnostics to be disabled.",
  REUSED: "Credential-owner verification cannot be repeated or retried.",
  DEADLINE: "Credential-owner verification has no remaining observation budget.",
  TIMEOUT: "Credential-owner verification exceeded its bounded deadline.",
  HTTP: "The fixed GitHub authenticated-user endpoint did not return HTTP 200.",
  HEADERS: "GitHub credential-owner response headers are unsupported.",
  BYTES: "GitHub credential-owner response exceeds its fixed byte bound.",
  TRANSPORT: "GitHub credential-owner transport failed.",
  TRUNCATED: "GitHub credential-owner response did not complete.",
  JSON: "GitHub credential-owner response is not valid UTF-8 JSON.",
  SCHEMA: "GitHub credential-owner response lacks a valid User identity.",
  OWNER: "The supplied credential does not identify the exact expected GitHub user.",
};

function rejected(code) {
  return new AgentProofError(`AP_REVIEW_CREDENTIAL_${code}`, ERRORS[code]);
}

export function createCredentialOwnerVerifier(environment, expectedLogin, requestNative = request) {
  const tokenDescriptor =
    environment !== null &&
    typeof environment === "object" &&
    !Array.isArray(environment) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(environment))
      ? Object.getOwnPropertyDescriptor(environment, "COPILOT_GITHUB_TOKEN")
      : undefined;
  const token = tokenDescriptor?.value;
  if (
    tokenDescriptor?.enumerable !== true ||
    typeof token !== "string" ||
    !/^[\x21-\x7e]{1,4096}$/u.test(token) ||
    typeof expectedLogin !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/u.test(expectedLogin) ||
    ["GH_TOKEN", "GITHUB_TOKEN", "COPILOT_SDK_AUTH_TOKEN"].some((key) =>
      Object.hasOwn(environment, key),
    )
  )
    throw rejected("INPUT");
  if (
    ["NODE_DEBUG", "NODE_DEBUG_NATIVE", "NODE_OPTIONS", "NODE_PATH"].some((key) =>
      Object.hasOwn(process.env, key),
    ) ||
    process.execArgv.some((arg) =>
      /^(?:--(?:inspect|trace-tls|tls-keylog|require|import)(?:[=-]|$)|-r(?:.|$))/u.test(arg),
    )
  )
    throw rejected("DIAGNOSTICS");
  Object.freeze(environment);
  let used = false;

  return async (remainingMilliseconds) => {
    if (used) throw rejected("REUSED");
    used = true;
    let remaining;
    try {
      remaining = remainingMilliseconds();
    } catch {
      throw rejected("DEADLINE");
    }
    if (!Number.isFinite(remaining) || remaining < 1 || remaining > 180_000)
      throw rejected("DEADLINE");
    const deadlineAt = performance.now() + Math.min(CREDENTIAL_TIMEOUT_MS, remaining);
    return new Promise((resolve, reject) => {
      let nativeRequest;
      let response;
      let timer;
      let finished = false;
      let bytes = 0;
      let expectedBytes;
      const chunks = [];
      const fail = (code) => {
        if (finished) return;
        finished = true;
        clearTimeout(timer);
        chunks.length = 0;
        response?.destroy();
        nativeRequest?.destroy();
        reject(rejected(code));
      };
      const withinDeadline = () => {
        let budget;
        try {
          budget = remainingMilliseconds();
        } catch {
          fail("DEADLINE");
          return false;
        }
        if (!Number.isFinite(budget) || performance.now() >= deadlineAt || budget < 1) {
          fail("TIMEOUT");
          return false;
        }
        return true;
      };
      try {
        nativeRequest = requestNative(
          ENDPOINT,
          {
            method: "GET",
            agent: false,
            rejectUnauthorized: true,
            maxHeaderSize: MAX_CREDENTIAL_HEADER_BYTES,
            headers: {
              Accept: "application/vnd.github+json",
              "Accept-Encoding": "identity",
              Authorization: `Bearer ${token}`,
              "Cache-Control": "no-cache",
              Connection: "close",
              "X-GitHub-Api-Version": "2026-03-10",
              "User-Agent": "agentproof-credential-bound-state",
            },
          },
          (incoming) => {
            response = incoming;
            response.on("error", () => fail("TRANSPORT"));
            response.once("aborted", () => fail("TRUNCATED"));
            response.once("close", () => {
              if (!finished) fail("TRUNCATED");
            });
            response.on("data", (chunk) => {
              if (finished || !withinDeadline()) return;
              if (!Buffer.isBuffer(chunk)) return fail("TRANSPORT");
              bytes += chunk.length;
              if (bytes > MAX_CREDENTIAL_RESPONSE_BYTES) return fail("BYTES");
              chunks.push(Buffer.from(chunk));
            });
            response.once("end", () => {
              if (finished || !withinDeadline()) return;
              if (!response.complete || (expectedBytes !== undefined && bytes !== expectedBytes))
                return fail("TRUNCATED");
              let user;
              try {
                user = JSON.parse(
                  new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
                );
              } catch {
                return fail("JSON");
              }
              chunks.length = 0;
              if (
                user === null ||
                typeof user !== "object" ||
                Array.isArray(user) ||
                typeof user.login !== "string" ||
                !/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/u.test(user.login) ||
                !Number.isSafeInteger(user.id) ||
                user.id <= 0 ||
                user.type !== "User"
              )
                return fail("SCHEMA");
              if (user.login !== expectedLogin) return fail("OWNER");
              if (!withinDeadline()) return;
              finished = true;
              clearTimeout(timer);
              nativeRequest?.destroy();
              resolve({
                authority: "github-rest-authenticated-user",
                expectedLoginMatch: true,
                userTypeMatch: true,
                userIdValid: true,
                responseBytes: bytes,
                observedAt: new Date().toISOString(),
              });
            });
            if (finished || !withinDeadline()) {
              response.destroy();
              return;
            }
            if (response.statusCode !== 200) return fail("HTTP");
            const headers = response.headers;
            if (headers === null || typeof headers !== "object" || Array.isArray(headers))
              return fail("HEADERS");
            const contentType = headers["content-type"];
            if (
              typeof contentType !== "string" ||
              !/^application\/json(?:;\s*charset=utf-8)?$/iu.test(contentType) ||
              (headers["content-encoding"] !== undefined &&
                headers["content-encoding"] !== "identity")
            )
              return fail("HEADERS");
            const length = headers["content-length"];
            if (
              length !== undefined &&
              (typeof length !== "string" ||
                !/^(0|[1-9][0-9]{0,8})$/u.test(length) ||
                Number(length) > MAX_CREDENTIAL_RESPONSE_BYTES)
            )
              return fail("BYTES");
            if (length !== undefined) expectedBytes = Number(length);
          },
        );
        if (finished) {
          nativeRequest.destroy();
          return;
        }
        nativeRequest.on("error", () => fail("TRANSPORT"));
        nativeRequest.once("close", () => {
          if (!finished) fail("TRUNCATED");
        });
        if (!withinDeadline()) return;
        timer = setTimeout(() => fail("TIMEOUT"), Math.max(1, deadlineAt - performance.now()));
        nativeRequest.end();
      } catch {
        fail("TRANSPORT");
      }
    });
  };
}
