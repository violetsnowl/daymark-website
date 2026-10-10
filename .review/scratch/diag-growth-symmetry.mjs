/**
 * One-off diagnostic (scratch): is the down/up asymmetry transient?
 *
 * Records document height every 700ms for ~14s (watching the one-shot growth),
 * then runs the same down+up mark passes as sweep-page.mjs and reports the
 * value differences once the height has settled.
 *
 * Usage: node .review/scratch/diag-growth-symmetry.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9387;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-symmetry`;
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
  await delay(1200);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  const growth = await evaluate(`(async () => {
    const series = [];
    for (let i = 0; i < 20; i += 1) {
      series.push({ t: Math.round(performance.now()), h: document.documentElement.scrollHeight });
      await new Promise((resolve) => setTimeout(resolve, 700));
    }
    return series;
  })()`);
  console.log("height series (t=ms since load-ish, h=scrollHeight):");
  for (const row of growth) console.log(`  t=${row.t}  h=${row.h}`);

  const result = await evaluate(`(async () => {
    const read = () => {
      const views = document.querySelector('#views');
      const day = document.querySelector('#day');
      const sync = document.querySelector('.sync-stage');
      return {
        y: Math.round(window.scrollY),
        viewsP: views?.dataset.sceneRect ? Number(views.dataset.sceneRect.split(':')[2]) : null,
        dayP: day?.dataset.progress ? Number(day.dataset.progress) : null,
        syncP: sync?.dataset.progress ? Number(sync.dataset.progress) : null,
        h: document.documentElement.scrollHeight,
      };
    };
    const doPass = async () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const stepPx = 350;
      const marks = [];
      for (let y = 0; y <= max; y += stepPx) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 40));
        marks.push(read());
      }
      window.scrollTo({ top: 999999, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 500));
      marks.push(read());
      const upMarks = [];
      for (let i = marks.length - 1; i >= 0; i -= 1) {
        window.scrollTo({ top: marks[i].y, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 40));
        upMarks.push(read());
      }
      const diffs = [];
      for (let i = 0; i < marks.length; i += 1) {
        const up = upMarks[upMarks.length - 1 - i];
        const down = marks[i];
        for (const key of ['viewsP', 'dayP', 'syncP']) {
          const a = down[key];
          const b = up[key];
          if (a === null || b === null) continue;
          if (Math.abs(a - b) > 0.005) diffs.push({ y: down.y, key, down: a, up: b });
        }
      }
      const heights = [...new Set(marks.map((m) => m.h))];
      return { marks: marks.length, diffs, heights };
    };
    /* The first pass absorbs the one-shot growth the demos trigger when they are
       first scrolled into view (it fires *during* the pass); the second pass runs
       on a document that is no longer changing. */
    const first = await doPass();
    const second = await doPass();
    return { first, second };
  })()`);
  console.log("first pass (demos fire):", JSON.stringify(result.first, null, 2));
  console.log("second pass (document settled):", JSON.stringify(result.second, null, 2));

  client.close();
} finally {
  chrome.kill();
}
