/**
 * Diagnostic: prints computed grid/box values and tries candidate fixes in the
 * live page so the real cause of a layout problem is identified by measurement
 * rather than by guessing.
 *
 * Usage: node .review/diagnose.mjs
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9334;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-diag`;
mkdirSync(PROFILE, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
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

const DIAGNOSE = `(() => {
  const pick = (selector, props) => {
    const node = document.querySelector(selector);
    if (!node) return { selector, missing: true };
    const cs = getComputedStyle(node);
    const out = { selector, width: Math.round(node.getBoundingClientRect().width) };
    for (const prop of props) out[prop] = cs[prop];
    return out;
  };
  const probes = ['.hero-title', '.hero-description', '.hero-actions', '.item-title'];
  const measure = () => {
    const copy = document.querySelector('.hero-copy');
    const r = copy.getBoundingClientRect();
    return {
      copyWidth: Math.round(r.width),
      titleLines: Math.round(
        document.querySelector('.hero-title').getBoundingClientRect().height /
          parseFloat(getComputedStyle(document.querySelector('.hero-title')).lineHeight),
      ),
      probes: probes.map((selector) => {
        const probe = document.createElement('div');
        probe.style.cssText =
          'position:absolute;visibility:hidden;white-space:nowrap;font-size:16px;';
        probe.textContent = '一二三四五六七八九十';
        const host = document.querySelector(selector);
        host.appendChild(probe);
        const width = probe.getBoundingClientRect().width;
        probe.remove();
        return { selector, tenCjkEm: +(width / 16).toFixed(3) };
      }),
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      bodyFontSize: getComputedStyle(document.body).fontSize,
    };
  };
  const stage = document.querySelector('.hero-stage');
  const copy = document.querySelector('.hero-copy');
  const inner = document.querySelector('.hero-inner');
  if (stage) stage.style.minWidth = '0';
  const before = measure();
  copy.style.maxWidth = 'none';
  const afterMaxWidthNone = measure();
  inner.style.gridTemplateColumns = 'minmax(0, 1.25fr) minmax(0, 1fr)';
  const afterExplicitColumns = measure();
  copy.style.maxWidth = '';
  const restored = measure();
  return {
    inner: pick('.hero-inner', ['display','gridTemplateColumns','columnGap','width','paddingLeft']),
    copy: pick('.hero-copy', ['width','maxWidth','minWidth','gridColumn','fontSize']),
    title: pick('.hero-title', ['fontSize','lineHeight','maxWidth']),
    stage: pick('.hero-stage', ['width','maxWidth','minWidth']),
    win: pick('.product-window', ['width','minWidth']),
    before,
    afterMaxWidthNone,
    afterExplicitColumns,
    restored,
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
  await client.send("Page.navigate", { url: "http://127.0.0.1:5173/" });
  await delay(2200);
  const result = await client.send("Runtime.evaluate", {
    expression: DIAGNOSE,
    returnByValue: true,
  });
  console.log(JSON.stringify(result.result.value, null, 2));
  client.close();
} finally {
  chrome.kill();
}
