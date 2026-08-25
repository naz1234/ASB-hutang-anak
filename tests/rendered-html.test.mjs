import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return import(workerUrl.href);
}

const context = { waitUntil() {}, passThroughOnException() {} };
const assets = { fetch: async () => new Response("Not found", { status: 404 }) };

test("renders ASB Anak Tracker metadata", async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
    context,
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>ASB Anak Tracker<\/title>/i);
  assert.match(html, /ASB Anak/);
  assert.doesNotMatch(html, /Starter Project/);
});

test("persists tracker data through the sync API", async () => {
  const { default: worker, TrackerStore } = await loadWorker();
  let stored;
  const store = new TrackerStore({
    storage: {
      async get() { return stored; },
      async put(_key, value) { stored = value; },
    },
  });
  const env = {
    ASSETS: assets,
    TRACKER: {
      idFromName(name) { return name; },
      get() { return store; },
    },
  };
  const syncKey = "1234567890abcdef1234567890abcdef";
  const tracker = {
    children: [{ id: "tasneem", name: "Tasneem", debt: 4600, monthlyTarget: 111, withdrawalDate: "2026-02-16", color: "#9be15d" }],
    payments: [{ id: "payment-1", childId: "tasneem", amount: 111, date: "2026-08-25", note: "Bayaran Ogos" }],
    updatedAt: "2026-08-25T10:00:00.000Z",
  };

  const saveResponse = await worker.fetch(new Request("http://localhost/api/tracker", {
    method: "PUT",
    headers: { "content-type": "application/json", "x-sync-key": syncKey },
    body: JSON.stringify(tracker),
  }), env, context);
  assert.equal(saveResponse.status, 200);

  const loadResponse = await worker.fetch(new Request("http://localhost/api/tracker", {
    headers: { "x-sync-key": syncKey },
  }), env, context);
  assert.equal(loadResponse.status, 200);
  assert.deepEqual(await loadResponse.json(), tracker);
});
