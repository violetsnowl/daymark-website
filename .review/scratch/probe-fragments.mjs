/**
 * Scratch diagnostic: Scene 01 fragment visibility windows.
 *
 * Sweeps the scene past the viewport and records, per scroll step, whether
 * each floating fragment is actually on screen and actually opaque enough to
 * read (alpha ≈ --base-opacity × --ex). Derives each fragment's visible
 * scroll window in pixels — the measure of "does a reader ever see it".
 *
 * Usage: node .review/scratch/probe-fragments.mjs [baseUrl] [width] [height]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const WIDTH = Number(process.argv[3] ?? 1440);
const HEIGHT = Number(process.argv[4] ?? 900);
const PORT = 9395;
const PROFILE = `${import.meta.dirname}/chrome-profile-fragments`;
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
      if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) return;
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

  await evaluate(`(async () => {
    const read = () => document.documentElement.scrollHeight + ':' + Math.round(window.scrollY);
    let previous = read();
    let quietSince = Date.now();
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const current = read();
      if (current !== previous) { previous = current; quietSince = Date.now(); continue; }
      if (Date.now() - quietSince >= 600) return true;
    }
    return false;
  })()`);

  const geometry = await evaluate(`(() => {
    const section = document.querySelector('.scene-small-things');
    const field = document.querySelector('.small-things-field');
    const top = (node) => Math.round(node.getBoundingClientRect().top + window.scrollY);
    return {
      vh: window.innerHeight,
      sectionDocTop: top(section),
      sectionHeight: Math.round(section.getBoundingClientRect().height),
      fieldDocTop: top(field),
      fieldHeight: Math.round(field.getBoundingClientRect().height),
    };
  })()`);
  console.log(`viewport ${WIDTH}×${HEIGHT}  ${JSON.stringify(geometry)}`);

  const start = Math.max(0, geometry.sectionDocTop - geometry.vh);
  const end = geometry.fieldDocTop + geometry.fieldHeight + 200;
  const step = 40;
  const rows = [];
  for (let y = start; y <= end; y += step) {
    await evaluate(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
    await delay(90);
    const state = await evaluate(`(() => {
      const section = document.querySelector('.scene-small-things');
      const raw = section.dataset.sceneRect ?? '0:0:0';
      const nodes = Array.from(document.querySelectorAll('.scene-small-things .fragment'));
      return {
        y: Math.round(window.scrollY),
        sectionTop: Math.round(section.getBoundingClientRect().top),
        progress: Number(raw.split(':')[2]),
        fragments: nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          const ex = Number(node.style.getPropertyValue('--ex') || '1');
          const base = Number(node.style.getPropertyValue('--base-opacity') || '1');
          const text = node.textContent ?? '';
          return {
            text: text.length > 8 ? text.slice(0, 8) : text,
            top: Math.round(rect.top),
            bottom: Math.round(rect.bottom),
            alpha: +(ex * base).toFixed(3),
          };
        }),
      };
    })()`);
    rows.push(state);
  }

  console.log("\n       y  sectTop  progress  " + "| " + "fragment [top..bottom alpha]");
  for (const row of rows) {
    const frag = row.fragments
      .map((f) => `${f.text}[${f.top}..${f.bottom} ${f.alpha}]`)
      .join("  ");
    console.log(
      `${String(row.y).padStart(8)} ${String(row.sectionTop).padStart(8)} ${String(row.progress?.toFixed(3)).padStart(9)}  | ${frag}`,
    );
  }

  console.log("\nvisible scroll windows (needs alpha > 0.08 and any viewport intersection):");
  for (let index = 0; index < rows[0].fragments.length; index += 1) {
    const visible = rows.filter((row) => {
      const f = row.fragments[index];
      return f.alpha > 0.08 && f.top < geometry.vh && f.bottom > 0;
    });
    if (visible.length === 0) {
      console.log(`  [${index}] ${rows[0].fragments[index].text}  NEVER visible`);
      continue;
    }
    const first = visible[0];
    const last = visible[visible.length - 1];
    console.log(
      `  [${index}] ${first.fragments[index].text.padEnd(9)} y=${first.y} … ${last.y}  ` +
        `(${last.y - first.y}px; progress ${first.progress.toFixed(2)} → ${last.progress.toFixed(2)}; ` +
        `sectionTop ${first.sectionTop} … ${last.sectionTop})`,
    );
  }
  client.close();
} finally {
  chrome.kill();
}
