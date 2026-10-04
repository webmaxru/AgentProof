import { execFile } from "node:child_process";
import { basename, dirname, isAbsolute } from "node:path";
import { nextTick } from "node:process";
import { setTimeout as delay } from "node:timers/promises";

const FS_CODES = [
  "EBUSY",
  "ENOTEMPTY",
  "EPERM",
  "EACCES",
  "ENOENT",
  "ENOTDIR",
  "EISDIR",
  "EMFILE",
  "ENFILE",
  "EROFS",
  "EIO",
  "EINVAL",
];
const TRANSIENT_WINDOWS_CODES = new Set(["EBUSY", "ENOTEMPTY", "EPERM"]);
const RETRY_DELAY_MS = 100;
const FAILURE_CODES = [
  ...FS_CODES,
  "OWNED_PATH_CHANGED",
  "OWNED_PATH_REMAINS",
  "UNCLASSIFIED_FILESYSTEM_ERROR",
  "CLEANUP_DEADLINE",
  "CLEANUP_WORKER_FAILED",
];
const workerFailure = (
  errorCode = "CLEANUP_WORKER_FAILED",
  worker = {
    exitObserved: false,
    streamsClosed: false,
  },
) => ({
  removed: false,
  pathVerified: false,
  stage: "worker",
  errorCode,
  worker,
});

function safeRemovalResult(value) {
  const worker = value?.worker;
  const validWorker =
    worker !== null &&
    typeof worker === "object" &&
    !Array.isArray(worker) &&
    typeof worker.exitObserved === "boolean" &&
    typeof worker.streamsClosed === "boolean" &&
    Object.keys(worker).every((key) =>
      ["exitObserved", "streamsClosed", "processId"].includes(key),
    ) &&
    (!Object.hasOwn(worker, "processId") ||
      (Number.isSafeInteger(worker.processId) && worker.processId > 0));
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).length !== 5 ||
    !validWorker ||
    !Object.keys(value).every((key) =>
      ["removed", "pathVerified", "stage", "errorCode", "worker"].includes(key),
    ) ||
    typeof value.removed !== "boolean" ||
    typeof value.pathVerified !== "boolean" ||
    !["verify-owned-path", "remove", "verify-removed", "worker"].includes(value.stage) ||
    (value.removed
      ? value.errorCode !== null ||
        !value.pathVerified ||
        value.stage !== "verify-removed" ||
        !worker.exitObserved ||
        !worker.streamsClosed
      : !FAILURE_CODES.includes(value.errorCode))
  )
    return workerFailure("CLEANUP_WORKER_FAILED", validWorker ? { ...worker } : undefined);
  return {
    removed: value.removed,
    pathVerified: value.pathVerified,
    stage: value.stage,
    errorCode: value.errorCode,
    worker: { ...worker },
  };
}

// Recursive fs.rm is not abortable in-process; the owned worker has the remaining deadline.
const REMOVE_WORKER = `
import { lstat, realpath, rm } from "node:fs/promises";
const expected = JSON.parse(process.argv[1]);
const codes = ${JSON.stringify(FS_CODES)};
let pathVerified = false;
let stage = "verify-owned-path";
try {
  const stat = await lstat(expected.path, { bigint: true });
  if (!stat.isDirectory() || stat.isSymbolicLink() ||
      stat.dev.toString() !== expected.dev || stat.ino.toString() !== expected.ino ||
      await realpath(expected.path) !== expected.path) {
    process.stdout.write(JSON.stringify({ removed: false, pathVerified, stage, errorCode: "OWNED_PATH_CHANGED" }));
    process.exitCode = 1;
  } else {
    pathVerified = true;
    stage = "remove";
    await rm(expected.path, { recursive: true, maxRetries: 0 });
    stage = "verify-removed";
    let absent = false;
    try { await lstat(expected.path); } catch (error) {
      if (error.code !== "ENOENT") throw error;
      absent = true;
    }
    process.stdout.write(JSON.stringify({ removed: absent, pathVerified, stage,
      errorCode: absent ? null : "OWNED_PATH_REMAINS" }));
    if (!absent) process.exitCode = 1;
  }
} catch (error) {
  process.stdout.write(JSON.stringify({ removed: false, pathVerified, stage,
    errorCode: codes.includes(error?.code) ? error.code : "UNCLASSIFIED_FILESYSTEM_ERROR" }));
  process.exitCode = 1;
}
`;

function removeInOwnedWorker(identity, timeoutMs) {
  return new Promise((resolve) => {
    const worker = { exitObserved: false, streamsClosed: false };
    const child = execFile(
      process.execPath,
      ["--input-type=module", "-e", REMOVE_WORKER, JSON.stringify(identity)],
      {
        cwd: dirname(identity.path),
        env: {},
        shell: false,
        windowsHide: true,
        timeout: timeoutMs,
        killSignal: "SIGKILL",
        maxBuffer: 4096,
        encoding: "utf8",
      },
      (error, stdout, stderr) =>
        nextTick(() => {
          if (!worker.exitObserved || !worker.streamsClosed) {
            resolve(workerFailure("CLEANUP_WORKER_FAILED", worker));
            return;
          }
          if (error?.killed) {
            resolve(
              workerFailure(
                error.code === "ERR_CHILD_PROCESS_STDIO_MAXBUFFER"
                  ? "CLEANUP_WORKER_FAILED"
                  : "CLEANUP_DEADLINE",
                worker,
              ),
            );
            return;
          }
          if (stderr || stdout.length > 4096 || (error !== null && error.code !== 1)) {
            resolve(workerFailure("CLEANUP_WORKER_FAILED", worker));
            return;
          }
          let result;
          try {
            result = JSON.parse(stdout);
          } catch {
            resolve(workerFailure("CLEANUP_WORKER_FAILED", worker));
            return;
          }
          if (
            !result ||
            typeof result !== "object" ||
            Array.isArray(result) ||
            Object.keys(result).length !== 4 ||
            !Object.keys(result).every((key) =>
              ["removed", "pathVerified", "stage", "errorCode"].includes(key),
            )
          ) {
            resolve(workerFailure("CLEANUP_WORKER_FAILED", worker));
            return;
          }
          resolve(
            result?.removed === (error === null)
              ? safeRemovalResult({ ...result, worker })
              : workerFailure("CLEANUP_WORKER_FAILED", worker),
          );
        }),
    );
    if (Number.isSafeInteger(child.pid) && child.pid > 0) worker.processId = child.pid;
    child.once("exit", () => {
      worker.exitObserved = true;
    });
    child.once("close", () => {
      worker.streamsClosed = true;
    });
  });
}

export async function cleanupOwnedRuntime(
  { identity, nativeExitObserved, nativeStreamsClosed, noProcessStarted, remainingMilliseconds },
  { remove = removeInOwnedWorker, platform = process.platform, wait = delay } = {},
) {
  const receipt = {
    status: "failed",
    nativeExitObserved,
    nativeStreamsClosed,
    noProcessStarted,
    attempts: [],
  };
  const directoryName = basename(identity.path);
  if (/^agentproof-protocol-state-[A-Za-z0-9]{6}$/u.test(directoryName))
    receipt.directoryName = directoryName;
  if (
    !(noProcessStarted === true || (nativeExitObserved === true && nativeStreamsClosed === true)) ||
    !receipt.directoryName ||
    !isAbsolute(identity.path) ||
    !/^[0-9]+$/u.test(identity.dev) ||
    !/^[0-9]+$/u.test(identity.ino)
  ) {
    receipt.errorCode = "CLEANUP_OWNERSHIP_UNVERIFIED";
    return receipt;
  }
  const target = Object.freeze({ path: identity.path, dev: identity.dev, ino: identity.ino });
  for (let attempt = 1; attempt <= 2; attempt++) {
    const remaining = Math.floor(remainingMilliseconds());
    if (!Number.isFinite(remaining) || remaining <= 0) {
      receipt.errorCode = "CLEANUP_DEADLINE";
      return receipt;
    }
    const result = safeRemovalResult(await remove(target, remaining));
    receipt.attempts.push({ attempt, remainingDeadlineMs: remaining, ...result });
    if (!result.removed) receipt.firstErrorCode ??= result.errorCode;
    const afterRemoval = remainingMilliseconds();
    if (!Number.isFinite(afterRemoval) || afterRemoval <= 0) {
      receipt.errorCode = "CLEANUP_DEADLINE";
      return receipt;
    }
    if (result.removed) {
      receipt.status =
        attempt === 2
          ? "removed-after-retry"
          : noProcessStarted
            ? "removed-without-launch"
            : "removed-after-exit";
      return receipt;
    }
    if (
      attempt !== 1 ||
      platform !== "win32" ||
      !nativeExitObserved ||
      !nativeStreamsClosed ||
      !result.pathVerified ||
      result.stage !== "remove" ||
      !result.worker.exitObserved ||
      !result.worker.streamsClosed ||
      !TRANSIENT_WINDOWS_CODES.has(result.errorCode) ||
      remainingMilliseconds() <= RETRY_DELAY_MS
    ) {
      receipt.errorCode = result.errorCode;
      return receipt;
    }
    await wait(RETRY_DELAY_MS);
  }
  return receipt;
}
