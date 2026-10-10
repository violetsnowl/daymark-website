/**
 * One-off diagnostic (scratch): frame timing during a slow scripted scroll
 * through Scene 04, and through the approach + pin + pinned stretch.
 *
 * Drives scrolling from an rAF loop inside the page (8px per frame), records
 * frame deltas, and reports p50 / p95 / max and the long-frame counts for the
 * region before the pin vs. the pinned stretch.
 *
 * Usage: node .review/scratch/probe-views-frames.mjs [baseUrl] [width] [height]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const WIDTH = Number(process.argv[3] ?? 1440);
const HEIGHT = Number(process.argv[4] ?? 900);
const PORT = 9381;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-frames`;
mkdirSync(PROFILE, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--hide-scrollbars",
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
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  });
  return {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    close: () => socket.close(),
  };
}

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH,
    height: HEIGHT,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: BASE });
  await delay(3000);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  const result = await evaluate(`(async () => {
    const stage = document.querySelector('.views-stage');
    const stageDocTop = stage.getBoundingClientRect().top + window.scrollY;
    const stageHeight = stage.getBoundingClientRect().height;
    /* Walk from half a screen above the stage to the end of the stage, ~6px/frame. */
    const from = Math.max(0, stageDocTop - 450);
    const to = stageDocTop + stageHeight + 200;
    window.scrollTo({ top: from, behavior: 'instant' });
    await new Promise((r) => setTimeout(r, 500));

    const samples = [];
    await new Promise((resolve) => {
      let last = performance.now();
      const step = () => {
        const now = performance.now();
        const y = window.scrollY;
        const stageTop = Math.round(stage.getBoundingClientRect().top);
        samples.push({ dt: now - last, y: Math.round(y), stageTop });
        last = now;
        if (y >= to) return resolve();
        window.scrollTo({ top: y + 6, behavior: 'instant' });
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    const summary = (rows) => {
      const dts = rows.map((r) => r.dt).sort((a, b) => a - b);
      const pick = (q) => dts[Math.min(dts.length - 1, Math.floor(q * dts.length))];
      return {
        frames: dts.length,
        p50: +pick(0.5).toFixed(2),
        p95: +pick(0.95).toFixed(2),
        max: +dts[dts.length - 1].toFixed(2),
        over20: dts.filter((d) => d > 20).length,
        over33: dts.filter((d) => d > 33).length,
      };
    };
    /* Pin offset ~128: "pinned stretch" = stageTop <= 128. */
    const pinned = samples.filter((r) => r.stageTop <= 128);
    const approach = samples.filter((r) => r.stageTop > 128);
    return { all: summary(samples), approach: summary(approach), pinned: summary(pinned) };
  })()`);

  console.log(`viewport ${WIDTH}×${HEIGHT}  target ${BASE}`);
  console.log(JSON.stringify(result, null, 2));

  client.close();
} finally {
  chrome.kill();
}
