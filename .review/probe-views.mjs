/**
 * Diagnostic: prints the vertical stack inside each views projection so a
 * baseline mismatch can be traced to the element that causes it.
 *
 * Usage: node .review/probe-views.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9344;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-views`;
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

  const report = await evaluate(`(() => {
    const panels = Array.from(document.querySelectorAll('.views-panel'));
    return panels.map((panel) => {
      const rect = (node) => {
        if (!node) return null;
        const r = node.getBoundingClientRect();
        const cs = getComputedStyle(node);
        return {
          tag: node.tagName.toLowerCase() + '.' + (node.className || '').split(' ')[0],
          top: +r.top.toFixed(2),
          height: +r.height.toFixed(2),
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          minHeight: cs.minHeight,
          borderTop: cs.borderTopWidth,
        };
      };
      const panelRect = panel.getBoundingClientRect();
      return {
        name: panel.dataset.panel,
        panel: { top: +panelRect.top.toFixed(2), height: +panelRect.height.toFixed(2) },
        context: rect(panel.querySelector('.views-context')),
        contextChildren: Array.from(panel.querySelector('.views-context')?.children ?? []).map(rect),
        list: rect(panel.querySelector('.product-list')),
        firstRow: rect(panel.querySelector('.item-row')),
        markedRow: rect(panel.querySelector('.item-row.is-marked')),
        rows: Array.from(panel.querySelectorAll('.item-row')).map((row) =>
          +row.getBoundingClientRect().top.toFixed(2),
        ),
      };
    });
  })()`);

  for (const panel of report) {
    console.log(`\n== panel ${panel.name}  top=${panel.panel.top} height=${panel.panel.height}`);
    console.log(`   context ${JSON.stringify(panel.context)}`);
    for (const child of panel.contextChildren) {
      console.log(`     child ${JSON.stringify(child)}`);
    }
    console.log(`   list    ${JSON.stringify(panel.list)}`);
    console.log(`   row0    ${JSON.stringify(panel.firstRow)}`);
    console.log(`   marked  ${JSON.stringify(panel.markedRow)}`);
    console.log(`   rowTops ${panel.rows.join(", ")}`);
  }

  client.close();
} finally {
  chrome.kill();
}
