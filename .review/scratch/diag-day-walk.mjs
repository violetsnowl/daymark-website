/**
 * One-off diagnostic (scratch): replicate the Scene 08 day-walk eval from
 * checks.mjs and print the assertion inputs, so the walk's coverage can be
 * verified in ~20s instead of a full suite run.
 *
 * Usage: node .review/scratch/diag-day-walk.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9386;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-daywalk`;
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

  const samples = await evaluate(`(async () => {
    const scene = document.querySelector('#day');
    const samples = [];
    const LEAD_IN = 260;
    const pick = (p) => {
      const rect = scene.getBoundingClientRect();
      const docTop = rect.top + window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const entry = docTop - window.innerHeight - LEAD_IN;
      const exit = Math.min(docTop + rect.height, maxScroll);
      return Math.max(0, Math.min(maxScroll, entry + (exit - entry) * p));
    };
    for (let step = 0; step <= 49; step += 1) {
      const target = pick(step / 50);
      window.scrollTo({ top: target, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 130));
      const read = (node) => Number(node?.style.getPropertyValue('--in') || 0);
      samples.push({
        y: Math.round(target),
        progress: scene.dataset.progress ? Number(scene.dataset.progress) : null,
        state: scene.dataset.dayState,
        entries: Array.from(document.querySelectorAll('[data-day-entry]')).map(read),
        closing: read(document.querySelector('[data-day-closing]')),
      });
    }
    return samples;
  })()`);

  const entryNumbers = [0, 1, 2, 3].map(
    (index) => samples.filter((s) => s.entries[index] > 0.05 && s.entries[index] < 0.95).length,
  );
  const dayFilling = samples.filter((s) => s.state === "filling");
  const daySettled = samples.filter((s) => s.state === "settled");
  const closingOk = samples
    .filter((s) => s.entries.some((v) => v < 0.98))
    .every((s) => s.closing < 0.9);
  const settledOk = daySettled.length > 0 && daySettled.every((s) => s.entries.every((v) => v > 0.98));
  const verdict = entryNumbers.every((c) => c > 0) && closingOk && settledOk;

  console.log(`samples: ${samples.length}  filling: ${dayFilling.length}  settled: ${daySettled.length}`);
  console.log(`mid-arrival frames per entry: ${entryNumbers.join("/")}`);
  console.log(`closing<0.9 in filling: ${closingOk}; settled entries complete: ${settledOk}`);
  console.log(`VERDICT: ${verdict ? "PASS" : "FAIL"}`);
  console.log("--- samples ---");
  for (const s of samples) {
    console.log(
      `p=${s.progress?.toFixed(2)}  state=${String(s.state).padEnd(8)}  entries=${s.entries.map((v) => v.toFixed(2)).join("/")}  closing=${s.closing.toFixed(2)}`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
