import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  return import(workerUrl.href);
}

const context = { waitUntil() {}, passThroughOnException() {} };
const assets = { fetch: async () => new Response("Not found", { status: 404 }) };

test("renders the dashboard and app metadata in English", async () => {
  const { default: worker } = await loadWorker();
  const response = await worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: assets },
    context,
  );
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="en"/i);
  assert.match(html, /<title>ASB Kids Tracker<\/title>/i);
  assert.match(html, /Main navigation/);
  const favicon = html.match(/<link[^>]*rel="icon"[^>]*>/)?.[0];
  const appleIcon = html.match(/<link[^>]*rel="apple-touch-icon"[^>]*>/)?.[0];
  assert.match(favicon ?? "", /href="\/icons\/asb-anak-32\.png"/);
  assert.match(appleIcon ?? "", /href="\/icons\/asb-anak-180\.png"/);
  for (const label of ["Home", "Debts", "Records", "Settings", "Total balance", "Total paid", "Withdrawal date", "Debt by child"]) {
    assert.ok(html.includes(label), `Expected English label: ${label}`);
  }
  const currentMonth = new Intl.DateTimeFormat("en-MY", { month: "long", year: "numeric" }).format(new Date());
  assert.ok(html.includes(currentMonth));
  assert.doesNotMatch(html, /Baki keseluruhan|Sudah dibayar|Tarikh ambil|Navigasi utama|lang="ms"/);
  assert.doesNotMatch(html, /Starter Project/);
});

test("ships PNG artwork at the sizes required by the icon links and manifest", async () => {
  const manifest = JSON.parse(await readFile(new URL("../dist/client/manifest.webmanifest", import.meta.url), "utf8"));
  const icons = [
    { src: "/icons/asb-anak-32.png", sizes: "32x32" },
    { src: "/icons/asb-anak-180.png", sizes: "180x180" },
    ...manifest.icons,
  ];
  for (const icon of icons) {
    const png = await readFile(new URL(`../dist/client${icon.src}`, import.meta.url));
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});

test("preserves existing Malay notes and payment data through the sync API", async () => {
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
