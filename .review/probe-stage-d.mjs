/**
 * Diagnostic: measures the scroll windows of the Stage D scenes (Reminder, AI,
 * Offline/Sync) against the viewport, the same way `.review/probe-bands.mjs`
 * does for Context and Views.
 *
 * Every one of the earlier scroll-window bugs was of the same shape — a window
 * that began or ended while the scene was off screen — so each new scene gets
 * measured before it is trusted.
 *
 * Usage: node .review/probe-stage-d.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9349;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-stage-d`;
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

const STATE = `(() => {
  const read = (selector, prop = '--in') => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const value = node.style.getPropertyValue(prop);
    return value === '' ? null : Number(value);
  };
  const reminder = document.querySelector('.scene-reminder');
  const ai = document.querySelector('.scene-ai');
  const sync = document.querySelector('.scene-sync');
  const top = (node) => (node ? Math.round(node.getBoundingClientRect().top) : null);
  return {
    viewportH: window.innerHeight,
    scrollY: Math.round(window.scrollY),
    reminderTop: top(reminder),
    reminderStageTop: top(document.querySelector('.reminder-stage')),
    reminderTime: read('[data-reveal="time"]'),
    reminderSurface: read('[data-reveal="surface"]'),
    reminderState: document.querySelector('.reminder-stage')?.dataset.reminderState ?? null,
    aiTop: top(ai),
    aiStageTop: top(document.querySelector('.ai-stage')),
    aiPhase: ai?.dataset.phase ?? null,
    syncTop: top(sync),
    syncStageTop: top(document.querySelector('.sync-stage')),
    syncItem: read('[data-sync-item]'),
    syncProgress: (() => {
      const stage = document.querySelector('.sync-stage');
      const raw = stage?.dataset.progress;
      return raw === undefined ? null : Number(raw);
    })(),
    syncCord: (() => {
      const stage = document.querySelector('.sync-stage');
      return stage?.dataset.cord ? Number(stage.dataset.cord) : null;
    })(),
    syncState: document.querySelector('.sync-stage')?.dataset.syncState ?? null,
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
  await delay(2800);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  const geometry = await evaluate(STATE);
  console.log(
    `viewport ${geometry.viewportH}px · reminder stage @${geometry.reminderStageTop} · ai stage @${geometry.aiStageTop} · sync stage @${geometry.syncStageTop}\n`,
  );

  /* Walk each scene's own window from above its top edge downward. */
  const walk = async (label, stageTop, rows) => {
    console.log(`== ${label}`);
    for (let delta = -700; delta <= 500; delta += 100) {
      await evaluate(`window.scrollTo({ top: ${Math.max(0, stageTop + delta)}, behavior: 'auto' })`);
      await delay(420);
      const state = await evaluate(STATE);
      console.log(
        `  stageTop=${String(state[rows.stageTopKey]).padStart(5)}  ${rows.describe(state)}`,
      );
    }
    console.log("");
  };

  await walk("Scene 05 — Reminder", geometry.reminderStageTop, {
    stageTopKey: "reminderStageTop",
    describe: (state) =>
      `time=${state.reminderTime?.toFixed(2) ?? "-"} surface=${state.reminderSurface?.toFixed(2) ?? "-"} state=${state.reminderState}`,
  });

  await walk("Scene 07 — Offline / Sync", geometry.syncStageTop, {
    stageTopKey: "syncStageTop",
    describe: (state) =>
      `p=${state.syncProgress === null || state.syncProgress === undefined ? "-" : Number(state.syncProgress).toFixed(3)} phoneItem=${state.syncItem?.toFixed(2) ?? "-"} cord=${state.syncCord?.toFixed(2) ?? "-"} state=${state.syncState}`,
  });

  /* Scene 06 is an interaction, so its window is walked once and the answer
     paths are exercised at the end. */
  console.log("== Scene 06 — AI, Quietly");
  for (let delta = -600; delta <= 300; delta += 150) {
    await evaluate(
      `window.scrollTo({ top: ${Math.max(0, geometry.aiStageTop + delta)}, behavior: 'auto' })`,
    );
    await delay(500);
    const state = await evaluate(STATE);
    console.log(
      `  stageTop=${String(state.aiStageTop).padStart(5)}  phase=${state.aiPhase}`,
    );
  }

  await evaluate(`window.scrollTo({ top: ${geometry.aiStageTop - 300}, behavior: 'auto' })`);
  await delay(600);
  const asked = await evaluate(
    `(() => {
      const scene = document.querySelector('.scene-ai');
      return {
        phase: scene.dataset.phase,
        questionVisible: document.querySelector('.ai-question')?.dataset.visible,
        answersReady: document.querySelector('.ai-answers')?.dataset.ready,
        resultVisible: document.querySelector('.ai-result')?.dataset.visible,
      };
    })()`,
  );
  console.log(`\n  after entering  ${JSON.stringify(asked)}`);

  await evaluate(
    `Array.from(document.querySelectorAll('.ai-answer'))[0].click()`,
  );
  await delay(500);
  const resolved = await evaluate(
    `(() => ({
      phase: document.querySelector('.scene-ai').dataset.phase,
      resultVisible: document.querySelector('.ai-result')?.dataset.visible,
      fields: Array.from(document.querySelectorAll('.ai-fields dd')).map((node) => node.textContent),
    }))()`,
  );
  console.log(`  after answering A ${JSON.stringify(resolved)}`);

  await evaluate(`Array.from(document.querySelectorAll('.text-action')).at(-1).click()`);
  await delay(400);
  await evaluate(`Array.from(document.querySelectorAll('.ai-answer'))[1].click()`);
  await delay(500);
  const kept = await evaluate(
    `(() => ({
      phase: document.querySelector('.scene-ai').dataset.phase,
      resultVisible: document.querySelector('.ai-result')?.dataset.visible,
      note: document.querySelector('.ai-note')?.textContent ?? null,
    }))()`,
  );
  console.log(`  after answering B ${JSON.stringify(kept)}`);

  client.close();
} finally {
  chrome.kill();
}
