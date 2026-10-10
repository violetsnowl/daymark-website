/**
 * Scratch diagnostic: how Scene 07 reads as the reader exits into Scene 08.
 *
 * Maps the journey from "sync scene approaching" to "scene 08 being read",
 * and prints, per scroll step: the sync state label (the visible one), the
 * published state, cord / phone values, and both scenes' positions. The two
 * scroll positions that matter:
 *
 *   flip   first position where the label reads 已同步
 *   read08 first position where scene 08's top is inside the comfortable
 *          reading zone (top 35% of the viewport)
 *
 * If flip comes after read08, the reader has exited into 08 while the scene
 * still reads 同步中 — the reported bug.
 *
 * Usage: node .review/scratch/probe-sync-exit.mjs [baseUrl] [width] [height]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const WIDTH = Number(process.argv[3] ?? 1440);
const HEIGHT = Number(process.argv[4] ?? 900);
const PORT = 9393;
const PROFILE = `${import.meta.dirname}/chrome-profile-sync-exit`;
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

  /* Layout stabilises after the capture demo's growth. */
  await evaluate(`(async () => {
    const read = () => document.documentElement.scrollHeight + ':' + Math.round(window.scrollY);
    let previous = read();
    let quietSince = Date.now();
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const current = read();
      if (current !== previous) { previous = current; quietSince = Date.now(); continue; }
      if (Date.now() - quietSince >= 600) return true;
    }
    return false;
  })()`);

  const geometry = await evaluate(`(() => {
    const top = (node) => Math.round(node.getBoundingClientRect().top + window.scrollY);
    const stage = document.querySelector('.sync-stage');
    const day = document.querySelector('#day');
    return {
      vh: window.innerHeight,
      stageDocTop: top(stage),
      stageHeight: Math.round(stage.getBoundingClientRect().height),
      dayDocTop: top(day),
      syncSectionDocBottom: Math.round(
        document.querySelector('#sync').getBoundingClientRect().bottom + window.scrollY,
      ),
    };
  })()`);
  console.log(`viewport ${WIDTH}×${HEIGHT}  ${JSON.stringify(geometry)}`);

  const start = Math.max(0, geometry.stageDocTop - Math.round(geometry.vh * 1.8));
  const end = Math.min(
    await evaluate(`document.documentElement.scrollHeight - window.innerHeight`),
    geometry.dayDocTop + Math.round(geometry.vh * 1.5),
  );
  const step = Math.round(geometry.vh * 0.18);
  const rows = [];
  for (let y = start; y <= end; y += step) {
    await evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
    await delay(140);
    const state = await evaluate(`(() => {
      const stage = document.querySelector('.sync-stage');
      const r = stage.getBoundingClientRect();
      const item = document.querySelector('[data-sync-item]');
      const raw = item?.style.getPropertyValue('--in');
      return {
        y: Math.round(window.scrollY),
        stageTop: Math.round(r.top),
        stageBottom: Math.round(r.bottom),
        dayTop: Math.round(document.querySelector('#day').getBoundingClientRect().top),
        progress: stage.dataset.progress ? Number(stage.dataset.progress) : null,
        state: stage.dataset.syncState ?? null,
        label: document.querySelector('.sync-cord-state')?.textContent ?? null,
        cord: stage.dataset.cord ? Number(stage.dataset.cord) : null,
        phone: raw === '' || raw === undefined ? null : Number(raw),
      };
    })()`);
    rows.push(state);
  }

  console.log("\n       y  stageTop stageBottom  dayTop  progress state     label      cord  phone");
  let flip = null;
  let read08 = null;
  for (const row of rows) {
    if (flip === null && row.label && /已同步/.test(row.label)) flip = row;
    if (read08 === null && row.dayTop !== null && row.dayTop <= geometry.vh * 0.35) read08 = row;
    console.log(
      `${String(row.y).padStart(8)} ${String(row.stageTop).padStart(9)} ${String(row.stageBottom).padStart(11)} ${String(row.dayTop).padStart(7)} ${String(row.progress?.toFixed(3)).padStart(9)} ${String(row.state).padEnd(9)} ${String(row.label).padEnd(10)} ${String(row.cord?.toFixed(2)).padStart(5)} ${String(row.phone?.toFixed(2)).padStart(6)}`,
    );
  }
  console.log("\nderived:");
  console.log(`  label flips to 已同步   y=${flip ? flip.y : "never"}  (stageBottom=${flip ? flip.stageBottom : "-"}, progress=${flip ? flip.progress?.toFixed(3) : "-"})`);
  console.log(`  scene 08 readable       y=${read08 ? read08.y : "never"}  (dayTop=${read08 ? read08.dayTop : "-"})`);
  if (flip && read08) {
    const delta = flip.y - read08.y;
    console.log(
      `  => 已同步 arrives ${delta <= 0 ? `${-delta}px BEFORE` : `${delta}px AFTER`} scene 08 is being read${delta > 0 ? "  ← BUG SIGNATURE" : ""}`,
    );
  }
  client.close();
} finally {
  chrome.kill();
}
