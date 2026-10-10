/**
 * Diagnostic: finds where each views projection actually becomes current, and
 * where the context reveal actually completes, by stepping the scroll and
 * watching the scene state. Used to confirm the two scroll windows line up with
 * what the pinned stage can physically reach.
 *
 * Usage: node .review/probe-bands.mjs [baseUrl] [width] [height]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const WIDTH = Number(process.argv[3] ?? 1440);
const HEIGHT = Number(process.argv[4] ?? 900);
const PORT = 9347;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-bands`;
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
    mobile: WIDTH < 768,
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

  const geometry = await evaluate(`(() => {
    const top = (node) => Math.round(node.getBoundingClientRect().top + window.scrollY);
    const height = (node) => Math.round(node.getBoundingClientRect().height);
    const stage = document.querySelector('.views-stage');
    const sticky = document.querySelector('.views-sticky');
    const nav = document.querySelector('.site-nav');
    const contextStage = document.querySelector('.context-stage');
    const contextItem = document.querySelector('.context-item');
    return {
      viewportH: window.innerHeight,
      stageTop: top(stage),
      stageHeight: height(stage),
      stickyHeight: height(sticky),
      pinOffset: Math.round(nav.getBoundingClientRect().height) + 24,
      closing: (() => {
        const node = document.querySelector('#views .scene-closing');
        return node ? Math.round(node.getBoundingClientRect().top + window.scrollY) : null;
      })(),
      stageProgressRect: stage.dataset.sceneRect,
      contextStageTop: top(contextStage),
      contextStageHeight: height(contextStage),
      contextItemTop: top(contextItem),
      contextSceneRect: document.querySelector('#context').dataset.sceneRect,
    };
  })()`);
  console.log(`viewport ${WIDTH}×${HEIGHT}`);
  console.log(JSON.stringify(geometry, null, 2));

  /* Walk the pinned region fine enough to catch the boundaries. */
  const step = 60;
  const rows = [];
  const end = geometry.stageTop + geometry.stageHeight;
  for (let y = Math.max(0, geometry.stageTop - 400); y <= end; y += step) {
    await evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
    await delay(300);
    const state = await evaluate(`(() => {
      const s = document.querySelector('.views-stage');
      const views = document.querySelector('#views');
      const sticky = document.querySelector('.views-sticky');
      return {
        scrollY: Math.round(window.scrollY),
        stageRect: s.dataset.sceneRect,
        view: views.dataset.view,
        pinned: views.dataset.pinned,
        stickyTop: Math.round(sticky.getBoundingClientRect().top),
      };
    })()`);
    rows.push(state);
  }

  const bands = {};
  for (const row of rows) {
    if (row.pinned !== "true") continue;
    bands[row.view] = bands[row.view] ?? [];
    bands[row.view].push(row.scrollY);
  }
  console.log("\nviews bands (pinned only):");
  for (const [view, positions] of Object.entries(bands)) {
    console.log(
      `  ${view.padEnd(9)} y ${positions[0]} … ${positions[positions.length - 1]}  (${positions.length} samples × ${step}px)`,
    );
  }
  const transitions = rows.filter(
    (row, index) => index > 0 && rows[index - 1].view !== row.view,
  );
  console.log("\ntransitions:");
  for (const row of transitions) {
    console.log(`  ${row.scrollY} → ${row.view}  (stage ${row.stageRect})`);
  }
  const released = rows.find((row) => row.pinned !== "true" && row.scrollY > geometry.stageTop);
  console.log(
    `\npin releases at ${released ? released.scrollY : "not within the walk"}; stage runs to ${geometry.stageTop + geometry.stageHeight}`,
  );
  console.log("\nsticky position near the end of the stage:");
  for (const row of rows.slice(-6)) {
    console.log(
      `  y=${String(row.scrollY).padStart(5)}  view=${String(row.view).padStart(9)}  pinned=${row.pinned}  stickyTop=${row.stickyTop}`,
    );
  }

  /* Context reveal: find where the first and the last piece settle. */
  console.log("\ncontext reveal (chips reaching 0.99):");
  const contextWindow = [];
  for (
    let y = Math.max(0, geometry.contextStageTop - 900);
    y <= geometry.contextStageTop + 400;
    y += 100
  ) {
    await evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
    await delay(340);
    const state = await evaluate(`(() => {
      const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
      return {
        scrollY: Math.round(window.scrollY),
        top: Math.round(document.querySelector('.context-stage').getBoundingClientRect().top),
        in: chips.map((chip) => Number(chip.style.getPropertyValue('--in') || 0)),
      };
    })()`);
    contextWindow.push(state);
  }
  for (const row of contextWindow) {
    const settled = row.in.filter((value) => value > 0.99).length;
    console.log(
      `  y=${String(row.scrollY).padStart(5)} stageTop=${String(row.top).padStart(5)} in=[${row.in.map((v) => v.toFixed(2)).join(", ")}] settled ${settled}/4`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
