import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { fakeProtocolChild } from "./public-review-protocol-fixtures.mjs";
import {
  MAX_PROTOCOL_BYTES,
  MAX_PROTOCOL_HEADER_BYTES,
  MAX_PROTOCOL_REQUESTS,
  MAX_PROTOCOL_REQUEST_BYTES,
  MAX_PROTOCOL_NOTIFICATIONS,
  ProtocolFrameReader,
  encodeProtocolMessage,
  openProtocolTransport,
} from "./public-review-protocol-transport.mjs";

function open(child, options = {}) {
  return openProtocolTransport(
    {
      executable: process.execPath,
      args: [],
      cwd: process.cwd(),
      env: {},
      onNotification() {},
      ...options,
    },
    () => child,
  );
}

test("framing survives every byte boundary and multiple frames", () => {
  const messages = [
    { jsonrpc: "2.0", id: 1, result: { text: "\u00e9" } },
    { jsonrpc: "2.0", method: "session.event", params: {} },
  ];
  const bytes = Buffer.concat(messages.map(encodeProtocolMessage));
  for (let split = 0; split <= bytes.length; split++) {
    const actual = [];
    const reader = new ProtocolFrameReader((message) => actual.push(message));
    reader.push(bytes.subarray(0, split));
    reader.push(bytes.subarray(split));
    reader.end();
    assert.deepEqual(actual, messages);
  }
});

test("raw response fingerprints include exact header casing and JSON whitespace across fragments", () => {
  const body = Buffer.from('{ "jsonrpc": "2.0", "id": 1, "result": {} }\n');
  const frame = Buffer.concat([Buffer.from(`content-length: ${body.length}\r\n\r\n`), body]);
  for (let split = 0; split <= frame.length; split++) {
    let fingerprint;
    const reader = new ProtocolFrameReader((message, metadata) => {
      assert.deepEqual(message.result, {});
      fingerprint = metadata;
    });
    reader.push(frame.subarray(0, split));
    reader.push(frame.subarray(split));
    reader.end();
    assert.equal(fingerprint.rawResponseBytes, frame.length);
    assert.equal(fingerprint.rawResponseSha256, createHash("sha256").update(frame).digest("hex"));
  }
});

for (const header of [
  "Content-Length: -1\r\n\r\n",
  "Content-Length: 01\r\n\r\n",
  "Content-Length: 1.5\r\n\r\n",
  "Content-Length: 2\r\nContent-Length: 2\r\n\r\n",
  "Content-Length: 2\r\nUnknown: value\r\n\r\n",
  `Content-Length: ${MAX_PROTOCOL_BYTES + 1}\r\n\r\n`,
  "Content-Length: 999999999999999999999999\r\n\r\n",
  "Content-Length: 2\n\n",
]) {
  test(`rejects invalid or excessive framing: ${JSON.stringify(header)}`, () => {
    let parsed = 0;
    const reader = new ProtocolFrameReader(() => parsed++);
    assert.throws(() => {
      reader.push(Buffer.from(header));
      reader.end();
    });
    assert.equal(parsed, 0);
  });
}

test("the header byte ceiling is enforced before body parsing", () => {
  const reader = new ProtocolFrameReader(() => assert.fail("must not parse"));
  reader.push(Buffer.alloc(MAX_PROTOCOL_HEADER_BYTES, 65));
  assert.throws(() => reader.push(Buffer.from("A")), /header/iu);
});

test("incomplete body, invalid UTF-8, malformed JSON, and trailing bytes fail closed", () => {
  for (const bytes of [
    Buffer.from("Content-Length: 10\r\n\r\n{}"),
    Buffer.from("Content-Length: 1\r\n\r\n{"),
    Buffer.concat([Buffer.from("Content-Length: 2\r\n\r\n"), Buffer.from([0xc0, 0xaf])]),
    Buffer.concat([encodeProtocolMessage({ jsonrpc: "2.0", id: 1, result: {} }), Buffer.from("X")]),
  ]) {
    const reader = new ProtocolFrameReader(() => {});
    assert.throws(() => {
      reader.push(bytes);
      reader.end();
    });
  }
});

test("native responses are correlated and process exit, not a kill request, closes the transport", async () => {
  const child = fakeProtocolChild((message, native) => {
    native.stdout.write(
      encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result: { fixture: true } }),
    );
  });
  const transport = open(child);
  assert.deepEqual(await transport.request("status.get", {}), { fixture: true });
  assert.equal(transport.metadata().exitObserved, false);
  assert.equal(await transport.finish(), true);
  assert.equal(transport.metadata().exitObserved, true);
  assert.equal(transport.metadata().streamsClosed, true);
  assert.equal(transport.metadata().exitCode, 0);
  assert.deepEqual(child.kills, []);
});

test("notifications are registered before the first request is written", async () => {
  const seen = [];
  const child = fakeProtocolChild((message, native) => {
    native.stdout.write(
      encodeProtocolMessage({ jsonrpc: "2.0", method: "session.event", params: { fixture: true } }),
    );
    native.stdout.write(encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result: {} }));
  });
  const transport = open(child, {
    onNotification: (method, params) => seen.push([method, params]),
  });
  await transport.request("connect", {});
  assert.deepEqual(seen, [["session.event", { fixture: true }]]);
  await transport.finish();
});

for (const [label, response] of [
  ["wrong id", { jsonrpc: "2.0", id: 99, result: {} }],
  ["string id", { jsonrpc: "2.0", id: "1", result: {} }],
  ["wrong JSON-RPC version", { jsonrpc: "1.0", id: 1, result: {} }],
  ["ambiguous result/error", { jsonrpc: "2.0", id: 1, result: {}, error: { code: -1 } }],
  ["batch response", [{ jsonrpc: "2.0", id: 1, result: {} }]],
  ["permission request", { jsonrpc: "2.0", id: 5, method: "permission.request", params: {} }],
  ["tool request", { jsonrpc: "2.0", id: 5, method: "tool.call", params: {} }],
  ["elicitation request", { jsonrpc: "2.0", id: 5, method: "userInput.request", params: {} }],
  ["unknown notification", { jsonrpc: "2.0", method: "unsupported", params: {} }],
]) {
  test(`${label} blocks and terminates only the owned child`, async () => {
    const child = fakeProtocolChild((message, native) => {
      native.stdout.write(encodeProtocolMessage(response));
    });
    const transport = open(child);
    await assert.rejects(transport.request("status.get", {}));
    assert.equal(await transport.finish(), true);
    assert.deepEqual(child.kills, ["SIGKILL"]);
    assert.ok(transport.metadata().errorCode);
  });
}

test("native errors are reduced to safe codes; no error text is persisted or thrown", async () => {
  const privateSentinel = "synthetic-private-error-must-not-leak";
  const child = fakeProtocolChild((message, native) => {
    native.stdout.write(
      encodeProtocolMessage({
        jsonrpc: "2.0",
        id: message.id,
        error: { code: -32601, message: privateSentinel, data: { privateSentinel } },
      }),
    );
  });
  const transport = open(child);
  await assert.rejects(transport.request("connect", {}), (error) => {
    assert.ok(!String(error).includes(privateSentinel));
    return true;
  });
  await transport.finish();
  assert.equal(transport.metadata().nativeRpcErrorCode, -32601);
  assert.ok(!JSON.stringify(transport.metadata()).includes(privateSentinel));
  assert.equal(child.messages.length, 1, "no handshake downgrade or retry");
});

test("cumulative stdout plus stderr is bounded at 4 MiB before decoding", async () => {
  const child = fakeProtocolChild();
  const transport = open(child);
  const pending = assert.rejects(transport.request("connect", {}));
  child.stdout.write(Buffer.from("Content-Length: 4000000\r\n\r\n"));
  child.stderr.write(Buffer.alloc(MAX_PROTOCOL_BYTES));
  await pending;
  await transport.finish();
  assert.equal(transport.metadata().errorCode, "AP_REVIEW_PROTOCOL_BYTES_EXCEEDED");
  assert.equal(transport.metadata().responseCount, 0);
  assert.equal(
    transport.metadata().stdoutHashedBytes + transport.metadata().stderrHashedBytes,
    MAX_PROTOCOL_BYTES,
  );
});

function sizedResponse(bytes) {
  let padding = bytes - 100;
  for (;;) {
    const frame = encodeProtocolMessage({ jsonrpc: "2.0", id: 1, result: "x".repeat(padding) });
    if (frame.length === bytes) return frame;
    padding += bytes - frame.length;
  }
}

test("the exact 4 MiB cumulative/frame threshold passes; one extra byte blocks before parsing", async () => {
  const frame = sizedResponse(MAX_PROTOCOL_BYTES);
  for (const extraByte of [false, true]) {
    const child = fakeProtocolChild((message, native) => {
      native.stdout.write(extraByte ? Buffer.concat([frame, Buffer.from(" ")]) : frame);
    });
    const transport = open(child);
    if (extraByte) {
      await assert.rejects(transport.request("status.get", {}), /4 MiB/u);
      assert.equal(transport.metadata().responseCount, 0);
    } else {
      assert.equal(typeof (await transport.request("status.get", {})), "string");
      assert.equal(transport.metadata().responseCount, 1);
    }
    await transport.finish();
    assert.equal(transport.metadata().stdoutHashedBytes, MAX_PROTOCOL_BYTES);
    assert.equal(transport.error === undefined, !extraByte);
  }
});

test("request-byte and notification ceilings are enforced exactly", async () => {
  const emptyRequest = encodeProtocolMessage({
    jsonrpc: "2.0",
    id: 1,
    method: "status.get",
    params: { fixture: "" },
  });
  let padding = MAX_PROTOCOL_REQUEST_BYTES - emptyRequest.length - 10;
  let request;
  do {
    request = { fixture: "x".repeat(padding) };
    padding +=
      MAX_PROTOCOL_REQUEST_BYTES -
      encodeProtocolMessage({ jsonrpc: "2.0", id: 1, method: "status.get", params: request })
        .length;
  } while (padding !== request.fixture.length);
  for (const extraByte of [false, true]) {
    const child = fakeProtocolChild((message, native) =>
      native.stdout.write(encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result: {} })),
    );
    const transport = open(child);
    const call = transport.request("status.get", {
      fixture: request.fixture + (extraByte ? "x" : ""),
    });
    if (extraByte) await assert.rejects(call);
    else await call;
    await transport.finish();
    assert.equal(child.messages.length, extraByte ? 0 : 1);
  }
  let notifications = 0;
  const child = fakeProtocolChild();
  const transport = open(child, { onNotification: () => notifications++ });
  const call = assert.rejects(transport.request("connect", {}));
  const frame = encodeProtocolMessage({ jsonrpc: "2.0", method: "session.event", params: {} });
  for (let index = 0; index < MAX_PROTOCOL_NOTIFICATIONS; index++) child.stdout.write(frame);
  assert.equal(notifications, MAX_PROTOCOL_NOTIFICATIONS);
  assert.equal(transport.error, undefined);
  child.stdout.write(frame);
  await call;
  await transport.finish();
  assert.equal(notifications, MAX_PROTOCOL_NOTIFICATIONS);
});

test("elapsed deadline is enforced even before its timer callback can run", async () => {
  const child = fakeProtocolChild();
  const transport = open(child, { timeoutMs: 10 });
  const until = performance.now() + 20;
  while (performance.now() < until) {
    /* Deliberately block the event loop in this fixture. */
  }
  await assert.rejects(transport.request("connect", {}), /deadline/iu);
  await transport.finish();
  assert.equal(child.messages.length, 0);
  child.complete();
});

test("cleanup sees only the remaining original deadline even after native exit closes its timer", async () => {
  const child = fakeProtocolChild();
  const transport = open(child, { timeoutMs: 40 });
  const initial = transport.remainingMilliseconds();
  assert.ok(initial > 0 && initial <= 40);
  child.complete();
  assert.equal(await transport.finish(), true);
  const until = performance.now() + 50;
  while (performance.now() < until) {
    /* Deliberately advance beyond the original deadline after transport closure. */
  }
  assert.equal(transport.remainingMilliseconds(), 0);
});

test("real owned stdio child exits and closes streams before finish returns", async (t) => {
  let child;
  const transport = openProtocolTransport(
    {
      executable: process.execPath,
      args: [
        fileURLToPath(new URL("./public-review-protocol-fixtures.mjs", import.meta.url)),
        "--stdio-fixture",
      ],
      cwd: tmpdir(),
      env: {},
      timeoutMs: 10_000,
      onNotification() {},
    },
    (...args) => {
      child = spawn(...args);
      return child;
    },
  );
  t.after(async () => {
    if (!transport.metadata().exitObserved) transport.abort();
    await transport.finish();
  });
  assert.deepEqual(await transport.request("status.get", {}), { syntheticFixture: true });
  assert.equal(transport.metadata().exitObserved, false);
  assert.equal(await transport.request("runtime.shutdown", {}), null);
  assert.equal(await transport.finish(), true);
  assert.equal(child.exitCode, 0);
  assert.equal(transport.metadata().exitObserved, true);
  assert.equal(transport.metadata().streamsClosed, true);
  assert.equal(transport.metadata().shutdownAcknowledged, true);
  assert.equal(transport.error, undefined);
});

for (const failure of ["spawn", "stdin", "stdout", "stderr", "shutdown-shape"]) {
  test(`${failure} failure is sanitized and cannot be a successful shutdown`, async () => {
    const sentinel = "synthetic-private-diagnostic";
    const child = fakeProtocolChild();
    const transport = open(child);
    const method = failure === "shutdown-shape" ? "runtime.shutdown" : "connect";
    const call = assert.rejects(transport.request(method, {}), (error) => {
      assert.ok(!String(error).includes(sentinel));
      return true;
    });
    if (failure === "shutdown-shape") {
      child.stdout.write(
        encodeProtocolMessage({ jsonrpc: "2.0", id: 1, result: { success: true } }),
      );
    } else if (failure === "spawn") {
      child.pid = undefined;
      child.emit("error", new Error(sentinel));
      child.emit("close");
    } else {
      child[failure].emit("error", new Error(sentinel));
    }
    await call;
    await transport.finish();
    assert.equal(transport.metadata().shutdownAcknowledged, false);
    assert.ok(!JSON.stringify(transport.metadata()).includes(sentinel));
  });
}

test("the outgoing request ceiling is exact, and model-send/resume/tools are never permitted", async () => {
  const child = fakeProtocolChild((message, native) =>
    native.stdout.write(encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result: {} })),
  );
  const transport = open(child);
  for (let index = 0; index < MAX_PROTOCOL_REQUESTS; index++) {
    await transport.request("status.get", {});
  }
  await assert.rejects(transport.request("status.get", {}));
  await transport.finish();
  assert.equal(child.messages.length, MAX_PROTOCOL_REQUESTS);

  for (const method of [
    "session.send",
    "session.resume",
    "session.tools.execute",
    "ping",
    "task.create",
    "task.run",
    "session.tasks.create",
  ]) {
    const blockedChild = fakeProtocolChild();
    const blocked = open(blockedChild);
    await assert.rejects(blocked.request(method, {}));
    await blocked.finish();
    assert.equal(blockedChild.messages.length, 0);
  }
});

test("connect-only transport rejects every second request, including shutdown or another connect", async () => {
  for (const method of [
    "connect",
    "status.get",
    "auth.getStatus",
    "session.create",
    "runtime.shutdown",
  ]) {
    const child = fakeProtocolChild((message, native) =>
      native.stdout.write(encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result: {} })),
    );
    const transport = open(child, { connectOnly: true });
    await transport.request("connect", {});
    await assert.rejects(transport.request(method, {}));
    await transport.finish();
    assert.deepEqual(
      child.messages.map((message) => message.method),
      ["connect"],
    );
    if (method !== "connect") {
      const firstChild = fakeProtocolChild();
      const first = open(firstChild, { connectOnly: true });
      await assert.rejects(first.request(method, {}));
      await first.finish();
      assert.equal(firstChild.messages.length, 0);
    }
  }
});

test("one deadline bounds an unresponsive child without claiming unobserved exit", async () => {
  const child = fakeProtocolChild(undefined, { closeOnKill: false });
  const transport = open(child, { timeoutMs: 30 });
  await assert.rejects(transport.request("connect", {}), /deadline/iu);
  assert.equal(await transport.finish(), false);
  assert.deepEqual(child.kills, ["SIGKILL"]);
  assert.equal(transport.metadata().exitObserved, false);
  assert.equal(transport.metadata().streamsClosed, false);
  child.complete(null, "SIGKILL");
});

test("duplicate responses, truncated final frames, and nonzero exits cannot become success", async () => {
  for (const failure of ["duplicate", "truncated", "exit"]) {
    const child = fakeProtocolChild((message, native) => {
      const frame = encodeProtocolMessage({ jsonrpc: "2.0", id: message.id, result: {} });
      native.stdout.write(frame);
      if (failure === "duplicate") native.stdout.write(frame);
      if (failure === "truncated") native.stdout.write(Buffer.from("Content-Length: 9\r\n\r\n{"));
      if (failure === "exit") native.complete(2);
    });
    const transport = open(child);
    try {
      await transport.request("status.get", {});
    } catch (error) {
      assert.match(error.code, /^AP_REVIEW_PROTOCOL_/u);
    }
    await transport.finish();
    assert.ok(transport.metadata().errorCode, failure);
  }
});
