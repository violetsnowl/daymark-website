/**
 * Diagnostic: reports what the Stage D scenes believe about themselves at
 * several scroll positions reached by *walking* the page rather than jumping to
 * it, plus the environment flags that drive their initial state.
 *
 * Written because a screenshot run showed `ai=ASKING` while the AI scene was
 * still thousands of pixels below the fold. Jumping to a scroll offset from the
 * top of a freshly loaded document and walking down to it are not the same
 * experiment when a scene is triggered by visibility.
 *
 * Usage: node .review/probe-stage-d-state.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9350;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-stage-d-state`;
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

const REPORT = `(() => {
  const rect = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
  };
  return {
    scrollY: Math.round(window.scrollY),
    viewportH: window.innerHeight,
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    reminderState: document.querySelector('.reminder-stage')?.dataset.reminderState ?? null,
    aiPhase: document.querySelector('.scene-ai')?.dataset.phase ?? null,
    aiQuestionVisible: document.querySelector('.ai-question')?.dataset.visible ?? null,
    aiAnswersReady: document.querySelector('.ai-answers')?.dataset.ready ?? null,
    syncState: document.querySelector('.sync-stage')?.dataset.syncState ?? null,
    /* The cord's own value, not just the state word. "The line is gone" is the
       claim that matters at the end of the document, and a state label can read
       correctly while the line is still drawn. */
    syncCord: (() => {
      const stage = document.querySelector('.sync-stage');
      const raw = stage?.dataset.cord;
      return raw === undefined ? null : Number(raw);
    })(),
    syncPhoneItem: (() => {
      const node = document.querySelector('[data-sync-item]');
      const raw = node?.style.getPropertyValue('--in');
      return raw === '' || raw === undefined ? null : Number(raw);
    })(),
    syncProgress: (() => {
      const stage = document.querySelector('.sync-stage');
      const raw = stage?.dataset.progress;
      return raw === undefined ? null : Number(raw);
    })(),
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    reminderStage: rect('.reminder-stage'),
    aiStage: rect('.ai-stage'),
    syncStage: rect('.sync-stage'),
  };
})()`;

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

  console.log("== on load (nothing scrolled)");
  console.log(JSON.stringify(await evaluate(REPORT), null, 2));

  /* Walk the whole document in viewport-sized steps, reporting whenever a Stage D
     state is anything other than its resting value. */
  const total = await evaluate(
    `document.documentElement.scrollHeight - window.innerHeight`,
  );
  console.log(`\n== walking 0 → ${total} in 300px steps`);
  let printed = 0;
  for (let y = 0; y <= total; y += 300) {
    await evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
    await delay(200);
    const report = await evaluate(REPORT);
    const interesting =
      report.reminderState !== "idle" ||
      report.aiPhase !== "IDLE" ||
      report.syncState !== "offline";
    if (interesting) {
      console.log(
        `  y=${String(report.scrollY).padStart(5)}  reminder=${report.reminderStage?.top} ${report.reminderState}` +
          `  ai=${report.aiStage?.top} ${report.aiPhase}` +
          `  sync=${report.syncStage?.top} ${report.syncState}`,
      );
      printed += 1;
      if (printed > 40) break;
    }
  }
  if (printed === 0) console.log("  (no state ever left its resting value)");

  console.log("\n== at the bottom");
  await evaluate(`window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' })`);
  await delay(600);
  console.log(JSON.stringify(await evaluate(REPORT), null, 2));

  client.close();
} finally {
  chrome.kill();
}
