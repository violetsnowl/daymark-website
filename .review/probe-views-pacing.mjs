/**
 * Diagnostic: Scene 04 pacing table.
 *
 * Records, per scroll step across the whole Scene 04 region:
 *   y | section top | stage top | sticky top (live pin state) | view | progress
 *     | panel opacities [overview, courses, calendar] | closing-line top
 *
 * Then derives the landmarks that define the felt pacing:
 *   where progress leaves 0 → where the panel pins → fade starts/ends
 *   → switch points → where the sticky releases → where progress reaches 1.
 *
 * Waits for the layout to hold still first: the Quick Capture demo replays on
 * every load and grows the document by ~300px while it does.
 *
 * Usage: node .review/probe-views-pacing.mjs [baseUrl] [width] [height] [step] [delayMs]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const WIDTH = Number(process.argv[3] ?? 1440);
const HEIGHT = Number(process.argv[4] ?? 900);
const STEP = Number(process.argv[5] ?? 80);
const STEP_DELAY = Number(process.argv[6] ?? 220);
const PORT = 9377;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-pacing`;
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

  /* The capture demo grows the document by ~300px after load; walk nothing
     until the height and the scroll position have held still for a moment. */
  const stable = await evaluate(`(async () => {
    const read = () => document.documentElement.scrollHeight + ':' + Math.round(window.scrollY);
    let previous = read();
    let quietSince = Date.now();
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const current = read();
      if (current !== previous) {
        previous = current;
        quietSince = Date.now();
        continue;
      }
      if (Date.now() - quietSince >= 600) return true;
    }
    return false;
  })()`);
  console.log(`layout stable: ${stable}`);

  const geometry = await evaluate(`(() => {
    const top = (node) => Math.round(node.getBoundingClientRect().top + window.scrollY);
    const height = (node) => Math.round(node.getBoundingClientRect().height);
    const section = document.querySelector('#views');
    const stage = document.querySelector('.views-stage');
    const sticky = document.querySelector('.views-sticky');
    const nav = document.querySelector('.site-nav');
    const closing = document.querySelector('#views .scene-closing');
    return {
      viewportH: window.innerHeight,
      sectionTop: top(section),
      sectionHeight: height(section),
      stageTop: top(stage),
      stageHeight: height(stage),
      stickyHeight: height(sticky),
      stickyComputedTop: getComputedStyle(sticky).top,
      navHeight: height(nav),
      closingTop: top(closing),
      docHeight: document.documentElement.scrollHeight,
      sceneRect: stage.dataset.sceneRect,
      sceneWindow: stage.dataset.sceneWindow,
    };
  })()`);
  console.log(`viewport ${WIDTH}×${HEIGHT}  step=${STEP}px`);
  console.log(JSON.stringify(geometry, null, 2));

  const pinTarget = (() => {
    const m = /([\d.]+)px/.exec(geometry.stickyComputedTop);
    return m ? Math.round(Number(m[1])) : Math.round(geometry.navHeight + 56);
  })();
  console.log(`pin target (sticky top, px from viewport top): ~${pinTarget}`);

  const start = Math.max(0, geometry.stageTop - Math.round(HEIGHT * 1.1));
  const end = geometry.stageTop + geometry.stageHeight + Math.round(HEIGHT * 0.6);
  const rows = [];
  for (let y = start; y <= end; y += STEP) {
    await evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
    await delay(STEP_DELAY);
    const state = await evaluate(`(() => {
      const section = document.querySelector('#views');
      const stage = document.querySelector('.views-stage');
      const sticky = document.querySelector('.views-sticky');
      const closing = document.querySelector('#views .scene-closing');
      const o = {};
      for (const view of ['overview', 'courses', 'calendar']) {
        const panel = document.querySelector('.views-panel[data-panel="' + view + '"]');
        o[view] = Number(panel ? getComputedStyle(panel).opacity : '0');
      }
      const raw = stage.dataset.sceneRect ?? '0:0:0';
      return {
        y: Math.round(window.scrollY),
        sectTop: Math.round(section.getBoundingClientRect().top),
        stageTop: Math.round(stage.getBoundingClientRect().top),
        stickyTop: Math.round(sticky.getBoundingClientRect().top),
        view: section.dataset.view,
        progress: Number(raw.split(':')[2]),
        o,
        closingTop: Math.round(closing.getBoundingClientRect().top),
      };
    })()`);
    rows.push(state);
  }

  console.log("\ny      sectTop stageTop stickyTop view      p      o:[ov, co, cal]     closingTop");
  const pinTol = 2;
  let yP0 = null;
  let yPin = null;
  let yRel = null;
  let yP1 = null;
  let yS1 = null;
  let yS2 = null;
  let yF1s = null;
  let yF1e = null;
  let yF2s = null;
  let yF2e = null;
  let wasPinned = false;
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    if (row.progress > 0.002 && yP0 === null) yP0 = row.y;
    if (yP0 !== null && yP1 === null && row.progress >= 0.999) yP1 = row.y;
    const near = Math.abs(row.stickyTop - pinTarget) <= pinTol;
    if (!wasPinned && near) {
      wasPinned = true;
      yPin = row.y;
    }
    if (wasPinned && yRel === null && !near && row.stickyTop < pinTarget - pinTol) {
      yRel = row.y;
    }
    if (yF1s === null && row.o.overview < 0.995) yF1s = row.y;
    if (yF1e === null && row.o.courses > 0.995) yF1e = row.y;
    if (row.view === "courses" && yS1 === null) yS1 = row.y;
    if (yF2s === null && row.o.calendar > 0.005) yF2s = row.y;
    if (row.view === "calendar" && yS2 === null) yS2 = row.y;
    if (yF2e === null && row.o.calendar > 0.995) yF2e = row.y;
    const mark =
      row.y === yP0 ? " ← progress 0"
      : row.y === yPin ? " ← PIN"
      : row.y === yF1s ? " ← fade1 starts"
      : row.y === yS1 ? " ← switch: courses"
      : row.y === yF1e ? " ← fade1 done"
      : row.y === yF2s ? " ← fade2 starts"
      : row.y === yS2 ? " ← switch: calendar"
      : row.y === yF2e ? " ← fade2 done"
      : row.y === yP1 ? " ← progress 1"
      : row.y === yRel ? " ← release"
      : "";
    console.log(
      `${String(row.y).padStart(6)} ${String(row.sectTop).padStart(7)} ${String(row.stageTop).padStart(8)} ${String(row.stickyTop).padStart(9)} ${row.view.padEnd(9)} ${row.progress.toFixed(3).padStart(6)}  [${row.o.overview.toFixed(2)}, ${row.o.courses.toFixed(2)}, ${row.o.calendar.toFixed(2)}]  ${String(row.closingTop).padStart(10)}${mark}`,
    );
  }

  const vh = HEIGHT;
  console.log("\nlandmarks (scroll distance):");
  const dist = (a, b) =>
    a === null || b === null ? "n/a" : `${String(b - a).padStart(5)}px  (${((b - a) / vh).toFixed(2)} vp)`;
  console.log(`  progress 0            y=${yP0}`);
  console.log(`  pin engages           y=${yPin}    (progress ${rows.find((r) => r.y === yPin)?.progress.toFixed(3)})`);
  console.log(`  approach (0 → pin)    ${dist(yP0, yPin)}`);
  console.log(`  fade1 (ov→co)         y=${yF1s} … ${yF1e}   ${dist(yF1s, yF1e)}`);
  console.log(`  switch → courses      y=${yS1}    after pin: ${dist(yPin, yS1)}`);
  console.log(`  fade2 (co→cal)        y=${yF2s} … ${yF2e}   ${dist(yF2s, yF2e)}`);
  console.log(`  switch → calendar     y=${yS2}    after switch1: ${dist(yS1, yS2)}`);
  console.log(`  pin releases          y=${yRel}    (progress ${rows.find((r) => r.y === yRel)?.progress.toFixed(3)}); after fade2: ${dist(yF2e, yRel)}`);
  console.log(`  pinned total          ${dist(yPin, yRel)}`);
  console.log(`  progress 1            y=${yP1}    after release: ${dist(yRel, yP1)}`);
  const closingFirst = rows.find((row) => row.closingTop < vh);
  console.log(`  closing line enters viewport   y=${closingFirst ? closingFirst.y : "n/a"}`);

  client.close();
} finally {
  chrome.kill();
}
