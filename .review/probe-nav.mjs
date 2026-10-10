/**
 * Diagnostic: reports, at a few scroll positions on one fresh page, the views
 * projection the scene says it is in, the nav item it highlights, and the
 * layout line of the marked item — read together so a desynchronised reading
 * cannot be mistaken for a bug.
 *
 * Usage: node .review/probe-nav.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9345;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-nav`;
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

  const inventory = await evaluate(`(() => {
    const groups = Array.from(document.querySelectorAll('.views-panels'));
    return {
      groupCount: groups.length,
      inSequence: groups.filter((group) => group.closest('.views-sequence')).length,
      inPinned: groups.filter((group) => group.closest('.views-stage')).length,
      markedRows: document.querySelectorAll('.item-row.is-marked').length,
      markedByGroup: groups.map((group) => ({
        active: group.dataset.active,
        marked: group.querySelectorAll('.item-row.is-marked').length,
        rows: Array.from(group.querySelectorAll('.item-row')).map((row) => row.offsetTop),
      })),
    };
  })()`);
  console.log("inventory:", JSON.stringify(inventory, null, 2));

  const section = await evaluate(
    `(() => {
      const node = document.querySelector('#views');
      return { top: Math.round(node.getBoundingClientRect().top + window.scrollY), height: Math.round(node.getBoundingClientRect().height) };
    })()`,
  );
  console.log(`\nviews section: top=${section.top} height=${section.height}\n`);

  await evaluate(`window.scrollTo({ top: 0, behavior: 'auto' })`);
  await delay(400);

  for (let delta = 0; delta <= section.height; delta += Math.round(section.height / 10)) {
    const target = section.top + delta;
    await evaluate(`window.scrollTo({ top: ${target}, behavior: 'auto' })`);
    await delay(420);
    const state = await evaluate(`(() => {
      const views = document.querySelector('#views');
      const nav = document.querySelector('.product-nav');
      const active = nav ? nav.querySelector('li.is-active') : null;
      const panels = document.querySelector('.views-panels');
      const marked = document.querySelector('.views-panels .item-row.is-marked');
      return {
        scrollY: Math.round(window.scrollY),
        dataView: views.dataset.view,
        pinned: views.dataset.pinned,
        panelsActive: panels ? panels.dataset.active : null,
        navActive: active ? active.dataset.productView : null,
        navClass: active ? active.className : null,
        markedOffsetTop: marked ? marked.offsetTop : null,
        markedText: marked ? marked.querySelector('.item-title').textContent : null,
        navCount: document.querySelectorAll('.product-nav').length,
      };
    })()`);
    console.log(
      `delta=${String(delta).padStart(5)} y=${String(state.scrollY).padStart(5)} dataView=${String(state.dataView).padStart(9)} panels=${String(state.panelsActive).padStart(9)} navActive=${String(state.navActive).padStart(9)} navs=${state.navCount} markedTop=${String(state.markedOffsetTop).padStart(4)} "${state.markedText}"`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
