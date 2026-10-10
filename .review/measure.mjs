/**
 * Local review tool: renders the running dev server in headless Chrome and
 * reports real layout measurements from the DOM.
 *
 * This is not part of the website bundle. It exists because the prototype must
 * be verified at the design reference viewports (W3 §25.3) using measured
 * numbers rather than impressions.
 *
 * Usage: node .review/measure.mjs [url]
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL_TO_MEASURE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9333;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile`;

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
  { stdio: "ignore", detached: false },
);

async function waitForDevTools() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      /* not up yet */
    }
    await delay(250);
  }
  throw new Error("Chrome DevTools endpoint did not start");
}

const MEASURE_EXPRESSION = `(() => {
  const rect = (selector) => {
    const node = document.querySelector(selector);
    if (!node) return null;
    const r = node.getBoundingClientRect();
    const cs = getComputedStyle(node);
    return {
      selector,
      x: Math.round(r.x), y: Math.round(r.y),
      w: Math.round(r.width), h: Math.round(r.height),
      fontSize: cs.fontSize, lineHeight: cs.lineHeight,
      fontFamily: cs.fontFamily.split(",")[0],
    };
  };
  return {
    viewport: { w: innerWidth, h: innerHeight },
    docScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    docHeight: document.documentElement.scrollHeight,
    elements: [
      ".container", ".hero", ".hero-inner", ".hero-copy", ".hero-title",
      ".hero-description", ".hero-actions", ".hero-stage", ".hero-surface",
      ".product-window", ".scene-small-things", ".small-things-field",
      ".small-things-title", ".scene-capture", ".capture-field", ".capture-title",
      ".site-nav-inner", ".site-footer",
    ].map(rect).filter(Boolean),
    fragments: Array.from(document.querySelectorAll(".fragment")).map((node) => {
      const r = node.getBoundingClientRect();
      const cs = getComputedStyle(node);
      return {
        text: node.textContent.slice(0, 14),
        x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width),
        fontSize: cs.fontSize, opacity: cs.opacity,
      };
    }),
  };
})()`;

async function measure(client, { width, height, path }) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Page.navigate", { url: new URL(path, URL_TO_MEASURE).href });
  await delay(900);
  /* A second navigation guarantees freshly compiled CSS/HMR output rather than
     whatever the first paint raced against. */
  await client.send("Page.reload", { ignoreCache: true });
  await delay(2000);
  const result = await client.send("Runtime.evaluate", {
    expression: MEASURE_EXPRESSION,
    returnByValue: true,
  });
  return result.result.value;
}

/** Minimal CDP client over the browser's own WebSocket support. */
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

const VIEWPORTS = [
  { label: "1440x900", width: 1440, height: 900, path: "/" },
  { label: "1280x800", width: 1280, height: 800, path: "/" },
  { label: "768x1024", width: 768, height: 1024, path: "/" },
  { label: "390x844", width: 390, height: 844, path: "/" },
  { label: "1440x900", width: 1440, height: 900, path: "/en/" },
];

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);

  const report = {};
  for (const viewport of VIEWPORTS) {
    const key = `${viewport.path === "/en/" ? "en-" : "cn-"}${viewport.label}`;
    report[key] = await measure(client, viewport);
  }

  writeFileSync(`${OUT_DIR}/measure.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  client.close();
} finally {
  chrome.kill();
}
