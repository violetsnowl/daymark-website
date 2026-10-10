/**
 * Diagnostic: after jumping to a scroll position and settling, prints what the
 * Context scene actually wrote to the DOM. Used to confirm whether a "nothing
 * revealed" screenshot is a scroll-application problem, a stale-state problem,
 * or a real bug in the scene.
 *
 * Usage: node .review/probe-context-state.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9348;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-context-state`;
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
  const stage = document.querySelector('.context-stage');
  const section = document.querySelector('#context');
  const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
  const stageRect = stage.getBoundingClientRect();
  return {
    scrollY: Math.round(window.scrollY),
    stageTopViewport: Math.round(stageRect.top),
    stageInlineStyle: stage.getAttribute('style'),
    stageProgressData: stage.dataset.progress ?? null,
    sectionSceneRect: section.dataset.sceneRect ?? null,
    sectionSceneInline: section.getAttribute('style'),
    chips: chips.map((chip) => ({
      kind: chip.dataset.chip,
      inlineIn: chip.style.getPropertyValue('--in'),
      computedIn: getComputedStyle(chip).getPropertyValue('--in').trim(),
      computedOpacity: getComputedStyle(chip).opacity,
    })),
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

  const anchor = await evaluate(
    `(() => {
      const stage = document.querySelector('.context-stage');
      return Math.round(stage.getBoundingClientRect().top + window.scrollY);
    })()`,
  );
  console.log(`context stage starts at y=${anchor}\n`);

  for (const mode of ["jump", "walk"]) {
    console.log(`== ${mode}`);
    if (mode === "walk") {
      await evaluate(`window.scrollTo({ top: 0, behavior: 'auto' })`);
      await delay(400);
      for (let y = 0; y <= anchor - 60; y += 300) {
        await evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
        await delay(120);
      }
    }
    await evaluate(`window.scrollTo({ top: ${anchor - 60}, behavior: 'auto' })`);
    await delay(700);
    const report = await evaluate(REPORT);
    console.log(JSON.stringify(report, null, 2));
    console.log("");
  }

  client.close();
} finally {
  chrome.kill();
}
