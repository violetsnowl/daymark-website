/**
 * Diagnostic: walks the Context scene's scroll window top-down in a single
 * fresh pass and prints the reveal value the scene actually computed at each
 * step. Used to confirm the reveal is progressive rather than instant.
 *
 * Usage: node .review/probe-context.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9343;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-context`;
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

  const anchor = await evaluate(
    `(() => {
      const node = document.querySelector('#context');
      return Math.round(node.getBoundingClientRect().top + window.scrollY);
    })()`,
  );
  console.log(`context section starts at y=${anchor}\n`);

  await evaluate(`window.scrollTo({ top: 0, behavior: 'auto' })`);
  await delay(500);

  /* Report the scroll position that actually took effect next to the section's
     measured top edge, so a scroll that silently did nothing is visible. */
  for (let delta = -600; delta <= 900; delta += 150) {
    const target = Math.max(0, anchor + delta);
    const applied = await evaluate(
      `(() => { window.scrollTo({ top: ${target}, behavior: 'auto' }); return Math.round(window.scrollY); })()`,
    );
    await delay(420);
    const state = await evaluate(`(() => {
      const section = document.querySelector('#context');
      const stage = document.querySelector('.context-stage');
      const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
      return {
        scrollY: Math.round(window.scrollY),
        range: document.documentElement.scrollHeight - window.innerHeight,
        top: Math.round(section.getBoundingClientRect().top),
        progress: stage.dataset.progress ?? null,
        in: chips.map((chip) => Number(chip.style.getPropertyValue('--in') || 0).toFixed(2)),
      };
    })()`);
    console.log(
      `target=${String(target).padStart(5)} applied=${String(applied).padStart(5)} scrollY=${String(state.scrollY).padStart(5)} range=${String(state.range).padStart(5)} sectionTop=${String(state.top).padStart(5)} progress=${String(state.progress).padStart(5)} in=[${state.in.join(", ")}]`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
