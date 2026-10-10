/**
 * One-off diagnostic (scratch): dumps every sample of the reachability-style
 * walk at 20px/70ms, including docHeight per sample, so any layout drift in
 * the middle of the walk is visible instead of inferred.
 *
 * Usage: node .review/scratch/diag-views-bands.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9382;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-bands`;
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
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await client.send("Page.navigate", { url: BASE });
  await delay(2600);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  const rows = await evaluate(`(async () => {
    const section = document.querySelector('#views');
    const stage = document.querySelector('.views-stage');
    let stageTop = stage.getBoundingClientRect().top + window.scrollY;
    const seconds = stage.getBoundingClientRect().height + 400;
    const out = [];
    for (let offset = 0; offset <= seconds; offset += 20) {
      window.scrollTo({ top: Math.max(0, stageTop - 200 + offset), behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 70));
      const raw = stage.dataset.sceneRect ?? 'none';
      const rectTop = stage.getBoundingClientRect().top;
      const rawP = raw === 'none' ? NaN : Number(raw.split(':')[2]);
      out.push({
        offset,
        y: Math.round(window.scrollY),
        rectTop: Math.round(rectTop),
        docH: document.documentElement.scrollHeight,
        stageDocTop: Math.round(rectTop + window.scrollY),
        rawP: Number.isFinite(rawP) ? +rawP.toFixed(3) : 'none',
        view: section.dataset.view,
      });
    }
    return out;
  })()`);

  console.log("offset     y  rectTop  stageDocTop  docH     rawP   view");
  for (const row of rows) {
    console.log(
      `${String(row.offset).padStart(6)} ${String(row.y).padStart(6)} ${String(row.rectTop).padStart(8)} ${String(row.stageDocTop).padStart(12)} ${String(row.docH).padStart(6)} ${String(row.rawP).padStart(8)}   ${row.view}`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
