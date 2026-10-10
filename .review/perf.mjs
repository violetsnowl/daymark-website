/**
 * Samples first-load performance on the production build (W2 §27, W4 §32):
 * LCP, CLS, TTFB and the transfer weight of the first viewport.
 *
 * Usage: node .review/perf.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9338;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-perf`;
mkdirSync(PROFILE, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

async function waitForDevTools() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return;
    } catch {
      /* not up yet */
    }
    await delay(250);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  let nextId = 1;
  const pending = new Map();
  const events = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.method) events.push(message);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });
  return {
    events,
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close: () => socket.close(),
  };
}

const PROBE = `(() => new Promise((resolve) => {
  const lcp = { value: 0, element: null };
  const cls = { value: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      lcp.value = Math.round(entry.startTime);
      lcp.element = entry.element ? (entry.element.className || entry.element.tagName) : null;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) cls.value += entry.value;
    }
  }).observe({ type: 'layout-shift', buffered: true });
  const nav = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  setTimeout(() => {
    resolve({
      lcpMs: lcp.value,
      lcpElement: lcp.element,
      cls: +cls.value.toFixed(4),
      ttfbMs: nav ? Math.round(nav.responseStart) : null,
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadMs: nav ? Math.round(nav.loadEventEnd) : null,
      fcpMs: paint.find((entry) => entry.name === 'first-contentful-paint')?.startTime ?? null,
      transferredKb: Math.round(
        performance.getEntriesByType('resource').reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024,
      ),
      resources: performance.getEntriesByType('resource').map((entry) => ({
        name: entry.name.split('/').pop(),
        kb: Math.round((entry.transferSize || 0) / 1024),
      })),
    });
  }, 3200);
}))()`;

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);

  for (const [label, width, height, throttled] of [
    ["desktop 1440x900", 1440, 900, false],
    ["mobile 390x844 (4x CPU, slow 4G)", 390, 844, true],
  ]) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 768,
    });
    if (throttled) {
      await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
    } else {
      await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
      });
    }
    await client.send("Page.navigate", { url: BASE });
    const result = await client.send("Runtime.evaluate", {
      expression: PROBE,
      awaitPromise: true,
      returnByValue: true,
    });
    const value = result.result.value;
    console.log(`\n== ${label}`);
    console.log(
      `   FCP ${Math.round(value.fcpMs ?? 0)}ms · LCP ${value.lcpMs}ms (${value.lcpElement}) · CLS ${value.cls} · TTFB ${value.ttfbMs}ms · load ${value.loadMs}ms`,
    );
    console.log(`   first-viewport transfer ${value.transferredKb} kB`);
    for (const resource of value.resources.filter((entry) => entry.kb > 0)) {
      console.log(`     ${resource.name} — ${resource.kb} kB`);
    }
  }

  client.close();
} finally {
  chrome.kill();
}
