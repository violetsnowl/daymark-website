/**
 * Diagnostic: prints the boxes of Scene 05's parts at the settled position.
 *
 * Written after two rounds of guessing at a layout problem from screenshots
 * alone. Rendering the numbers is faster than reasoning about the cascade.
 *
 * Usage: node .review/probe-reminder-boxes.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9351;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-reminder-boxes`;
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
  const describe = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return { selector, missing: true };
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      selector,
      x: Math.round(rect.left),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
      display: style.display,
      justifyItems: style.justifyItems,
      placeItems: style.placeItems,
      alignContent: style.alignContent,
      gridTemplateColumns: style.gridTemplateColumns,
      width: style.width,
      maxWidth: style.maxWidth,
      marginInline: style.marginInline,
      position: style.position,
    };
  };
  return JSON.stringify(
    [
      '.container',
      '.scene-reminder .scene-header',
      '.reminder-stage',
      '.reminder-item',
      '.reminder-item .context-item',
      '.reminder-time',
      '.reminder-surface',
    ].map(describe),
    null,
    1,
  );
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

  await evaluate(
    `(async () => {
      const stage = document.querySelector('.reminder-stage');
      window.scrollTo({ top: stage.getBoundingClientRect().top + window.scrollY - 200, behavior: 'auto' });
      await new Promise((r) => setTimeout(r, 900));
    })()`,
  );
  await delay(600);
  console.log(await evaluate(REPORT));

  client.close();
} finally {
  chrome.kill();
}
