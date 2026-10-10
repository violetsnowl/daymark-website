/**
 * Diagnostic: measures the geometry that the two scroll-driven scene windows
 * depend on — the pinned stage's real travel, the context stage's offset within
 * its own scene, and where the stage sits while each reveal happens.
 *
 * Usage: node .review/probe-windows.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9346;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-windows`;
mkdirSync(PROFILE, { recursive: true });

const WIDTH = Number(process.env.PROBE_WIDTH ?? 1440);
const HEIGHT = Number(process.env.PROBE_HEIGHT ?? 900);

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
    const views = document.querySelector('#views');
    const stage = document.querySelector('.views-stage');
    const sticky = document.querySelector('.views-sticky');
    const context = document.querySelector('#context');
    const contextStage = document.querySelector('.context-stage');
    const contextItem = document.querySelector('.context-item');
    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      navHeight: Math.round(document.querySelector('.site-nav').getBoundingClientRect().height),
      viewsTop: top(views),
      viewsHeight: height(views),
      stageTop: top(stage),
      stageHeight: height(stage),
      stickyTop: top(sticky),
      stickyHeight: height(sticky),
      contextTop: top(context),
      contextHeight: height(context),
      contextStageTop: top(contextStage),
      contextStageHeight: height(contextStage),
      contextItemTop: top(contextItem),
      range: document.documentElement.scrollHeight - window.innerHeight,
    };
  })()`);

  console.log("geometry:", JSON.stringify(geometry, null, 2));

  const { stageTop, stageHeight, stickyHeight, contextStageTop, contextStageHeight, navHeight, viewport } =
    geometry;
  const pinTop = navHeight + 24;
  const pinnedTravel = stageHeight - stickyHeight;
  const releaseScroll = stageTop - pinTop - 0 + (stageHeight - stickyHeight);
  console.log("\nderived:");
  console.log(`  pinned travel            ${pinnedTravel}px  (stage ${stageHeight} − sticky ${stickyHeight})`);
  console.log(`  sticky offset from top   ${pinTop}px`);
  console.log(
    `  scroll window needed     startAt − endAt = ${(pinnedTravel / viewport.h).toFixed(3)} viewport heights`,
  );
  console.log(
    `  window that fits the pin startAt ${(pinTop / viewport.h + stageTop / viewport.h - stageTop / viewport.h).toFixed(3)} → endAt ${((pinTop - pinnedTravel - (stageTop - 0)) / viewport.h + 0).toFixed(3)} (approximate)`,
  );
  console.log(`  release scroll           ${releaseScroll}`);
  console.log(
    `\n  context stage offset in scene ${contextStageTop - geometry.contextTop}px, height ${contextStageHeight}px`,
  );
  console.log(
    `  context window needed    startAt ${(0.85).toFixed(2)} → endAt ${((0.85 * viewport.h - 1035) / viewport.h).toFixed(2)} for a 1035px reveal`,
  );

  /* Where does the sticky actually sit at each scroll position, and when does
     the pin release? Walk the region and report. */
  console.log("\nwalk:");
  for (let delta = 0; delta <= stageHeight; delta += Math.round(stageHeight / 8)) {
    await evaluate(`window.scrollTo({ top: ${stageTop + delta}, behavior: 'auto' })`);
    await delay(360);
    const state = await evaluate(`(() => {
      const views = document.querySelector('#views');
      const sticky = document.querySelector('.views-sticky');
      return {
        scrollY: Math.round(window.scrollY),
        view: views.dataset.view,
        stickyTop: Math.round(sticky.getBoundingClientRect().top),
        sceneRect: document.querySelector('.views-stage').dataset.sceneRect,
      };
    })()`);
    console.log(
      `  delta=${String(delta).padStart(5)} y=${String(state.scrollY).padStart(5)} stickyTop=${String(state.stickyTop).padStart(5)} view=${String(state.view).padStart(9)} rect=${state.sceneRect}`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
