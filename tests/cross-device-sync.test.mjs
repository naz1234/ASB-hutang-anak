import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("cross-device-test", `${process.pid}-${Date.now()}`);
  return import(workerUrl.href);
}

const context = { waitUntil() {}, passThroughOnException() {} };

test("routes different devices to one shared tracker", async () => {
  const { default: worker, TrackerStore } = await loadWorker();
  let stored;
  const resolvedNames = [];
  const store = new TrackerStore({
    storage: {
      async get() { return stored; },
      async put(_key, value) { stored = value; },
    },
  });
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    TRACKER: {
      idFromName(name) { resolvedNames.push(name); return name; },
      get() { return store; },
    },
  };
  const tracker = {
    children: [{ id: "child-1", name: "Child A", debt: 100, monthlyTarget: 10, withdrawalDate: "2026-01-01", color: "#ffffff" }],
    payments: [{ id: "payment-1", childId: "child-1", amount: 10, date: "2026-01-02", note: "Test payment" }],
    updatedAt: "2026-01-02T00:00:00.000Z",
  };

  const saveResponse = await worker.fetch(new Request("http://localhost/api/tracker", {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      "x-sync-key": "1234567890abcdef1234567890abcdef",
    },
    body: JSON.stringify(tracker),
  }), env, context);
  assert.equal(saveResponse.status, 200);

  const otherDeviceResponse = await worker.fetch(new Request("http://localhost/api/tracker", {
    headers: { "x-sync-key": "abcdef1234567890abcdef1234567890" },
  }), env, context);
  assert.equal(otherDeviceResponse.status, 200);
  assert.deepEqual(await otherDeviceResponse.json(), tracker);

  const normalUrlResponse = await worker.fetch(
    new Request("http://localhost/api/tracker"),
    env,
    context,
  );
  assert.equal(normalUrlResponse.status, 200);
  assert.deepEqual(await normalUrlResponse.json(), tracker);
  assert.deepEqual(resolvedNames, [
    "shared-family-record-v1",
    "shared-family-record-v1",
    "shared-family-record-v1",
  ]);
});
