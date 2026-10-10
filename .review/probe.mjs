/**
 * Diagnostic: prints the measured state of the Context and Views scenes at a
 * series of scroll positions, so their scroll windows can be checked against
 * real numbers instead of inferred from screenshots.
 *
 * Usage: node .review/probe.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9342;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe`;
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
  const context = document.querySelector('#context');
  const stage = document.querySelector('.context-stage');
  const views = document.querySelector('#views');
  const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
  const rect = context.getBoundingClientRect();
  return {
    scrollY: Math.round(window.scrollY),
    range: document.documentElement.scrollHeight - window.innerHeight,
    contextTop: Math.round(rect.top),
    stageProgress: stage ? stage.dataset.progress : null,
    chips: chips.map((chip) => chip.style.getPropertyValue('--in') || '0'),
    view: views ? views.dataset.view : null,
    pinned: views ? views.dataset.pinned : null,
    activeNav: document.querySelector('.product-nav li.is-active')?.dataset.productView ?? null,
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
  await delay(2400);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  const range = (await evaluate(STATE)).range;
  console.log(`document scrollable range: ${range}px\n`);

  /* The views band boundaries matter more than raw fractions: they say exactly
     where each projection becomes current. */
  const bands = { overview: [], courses: [], calendar: [] };
  for (let fraction = 0.5; fraction <= 0.92; fraction += 0.01) {
    const target = Math.round(range * fraction);
    await evaluate(
      `(() => { window.scrollTo({ top: ${target}, behavior: 'auto' }); return window.scrollY; })()`,
    );
    await delay(280);
    const state = await evaluate(STATE);
    if (state.pinned === "true" && state.view) bands[state.view].push(state.scrollY);
  }
  for (const [view, positions] of Object.entries(bands)) {
    console.log(
      positions.length
        ? `views band "${view}": y ${positions[0]} … ${positions[positions.length - 1]}`
        : `views band "${view}": not observed`,
    );
  }
  console.log("");

  for (const fraction of [0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.8]) {
    const target = Math.round(range * fraction);
    await evaluate(
      `(() => { window.scrollTo({ top: ${target}, behavior: 'auto' }); return window.scrollY; })()`,
    );
    await delay(500);
    const state = await evaluate(STATE);
    console.log(
      `f=${fraction.toFixed(2)} y=${String(state.scrollY).padStart(5)} contextTop=${String(state.contextTop).padStart(5)} progress=${String(state.stageProgress).padStart(5)} chips=[${state.chips.join(",")}] view=${state.view} nav=${state.activeNav} pinned=${state.pinned}`,
    );
  }

  /* Panel geometry: why the marked item lands on a different line per view. */
  const geometry = await evaluate(`(() => {
    const panels = Array.from(document.querySelectorAll('.views-panel'));
    return panels.map((panel) => {
      const context = panel.querySelector('.views-context');
      const item = panel.querySelector('.item-row.is-marked');
      const panelRect = panel.getBoundingClientRect();
      const contextRect = context ? context.getBoundingClientRect() : null;
      const itemRect = item ? item.getBoundingClientRect() : null;
      return {
        name: panel.dataset.panel,
        contextHeight: contextRect ? Math.round(contextRect.height) : null,
        contextChildren: context
          ? Array.from(context.children).map((child) => Math.round(child.getBoundingClientRect().height))
          : [],
        itemTopFromPanel: itemRect ? Math.round(itemRect.top - panelRect.top) : null,
        itemLeftFromPanel: itemRect ? Math.round(itemRect.left - panelRect.left) : null,
        panelHeight: Math.round(panelRect.height),
      };
    });
  })()`);
  console.log("\npanel geometry:");
  for (const panel of geometry) console.log("  " + JSON.stringify(panel));

  /* Context reveal: at the scene's own top edge nothing should have arrived. */
  const revealScan = await evaluate(`(async () => {
    const section = document.querySelector('#context');
    const top = section.getBoundingClientRect().top + window.scrollY;
    const samples = [];
    for (const delta of [-200, -60, 0, 60, 140, 220, 300, 380]) {
      window.scrollTo({ top: Math.max(0, top + delta), behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 420));
      const stage = document.querySelector('.context-stage');
      const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
      samples.push({
        delta,
        progress: stage.dataset.progress,
        in: chips.map((chip) => chip.style.getPropertyValue('--in') || '0'),
      });
    }
    return samples;
  })()`);
  console.log("\ncontext reveal:");
  for (const sample of revealScan) {
    console.log(`  delta=${String(sample.delta).padStart(4)} progress=${String(sample.progress).padStart(5)} in=[${sample.in.join(",")}]`);
  }

  client.close();
} finally {
  chrome.kill();
}
