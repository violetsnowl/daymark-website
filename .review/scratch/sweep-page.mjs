/**
 * One-off diagnostic (scratch): full-page sweep.
 *
 *  1. collects console errors/exceptions and horizontal overflow during a
 *     full instant-scroll pass (down, then up);
 *  2. compares scene values between the down and the up pass (scroll-derived
 *     values must agree in both directions);
 *  3. captures a set of reference screenshots at named positions.
 *
 * Usage: node .review/scratch/sweep-page.mjs [baseUrl] [width] [height]
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const WIDTH = Number(process.argv[3] ?? 1440);
const HEIGHT = Number(process.argv[4] ?? 900);
const PORT = 9385;
const OUT_DIR = import.meta.dirname;
const SHOT_DIR = `${OUT_DIR}/sweep-shots`;
const PROFILE = `${OUT_DIR}/chrome-profile-sweep`;
mkdirSync(PROFILE, { recursive: true });
mkdirSync(SHOT_DIR, { recursive: true });

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
  const events = [];
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method) events.push(message);
  });
  return {
    send(method, params = {}) {
      const id = nextId++;
      socket.send(JSON.stringify({ id, method, params }));
      return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    },
    events,
    close: () => socket.close(),
  };
}

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);
  await client.send("Runtime.enable");
  await client.send("Log.enable");
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

  /* Wait for layout stability (capture demo). */
  const stable = await evaluate(`(async () => {
    const read = () => document.documentElement.scrollHeight + ':' + Math.round(window.scrollY);
    let previous = read();
    let quietSince = Date.now();
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const current = read();
      if (current !== previous) {
        previous = current;
        quietSince = Date.now();
        continue;
      }
      if (Date.now() - quietSince >= 700) return true;
    }
    return false;
  })()`);
  console.log(`layout stable before sweep: ${stable}`);

  /* --- 1: down + up passes, recording values and overflow --- */
  const pass = await evaluate(`(async () => {
    const read = () => {
      const views = document.querySelector('#views');
      const day = document.querySelector('#day');
      const sync = document.querySelector('.sync-stage');
      return {
        y: Math.round(window.scrollY),
        viewsP: views?.dataset.sceneRect ? Number(views.dataset.sceneRect.split(':')[2]) : null,
        dayP: day?.dataset.progress ? Number(day.dataset.progress) : null,
        syncP: sync?.dataset.progress ? Number(sync.dataset.progress) : null,
        vw: document.documentElement.scrollWidth,
        iw: window.innerWidth,
        docH: document.documentElement.scrollHeight,
      };
    };
    const total = () => document.documentElement.scrollHeight - window.innerHeight;
    const marks = [];
    const max = total();
    const stepPx = 350;
    for (let y = 0; y <= max; y += stepPx) {
      window.scrollTo({ top: y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 40));
      marks.push(read());
    }
    window.scrollTo({ top: 999999, behavior: 'instant' });
    await new Promise((resolve) => setTimeout(resolve, 500));
    marks.push(read());
    const downEnd = marks.length;
    /* Up pass: same marks, reversed — values must agree with the down pass. */
    const upMarks = [];
    for (let i = marks.length - 1; i >= 0; i -= 1) {
      window.scrollTo({ top: marks[i].y, behavior: 'instant' });
      await new Promise((resolve) => setTimeout(resolve, 40));
      upMarks.push(read());
    }
    const diffs = [];
    for (let i = 0; i < marks.length; i += 1) {
      const up = upMarks[upMarks.length - 1 - i];
      const down = marks[i];
      for (const key of ['viewsP', 'dayP', 'syncP']) {
        const a = down[key];
        const b = up[key];
        if (a === null || b === null) continue;
        if (Math.abs(a - b) > 0.01) diffs.push({ y: down.y, key, down: a, up: b });
      }
    }
    const overflows = marks.filter((m) => m.vw > m.iw + 1).map((m) => ({ y: m.y, vw: m.vw, iw: m.iw }));
    const heights = [...new Set(marks.map((m) => m.docH))];
    return { marks: downEnd, diffs, overflows, heights };
  })()`);
  console.log("down/up pass:", JSON.stringify(pass, null, 2));

  /* --- 2: console messages collected so far --- */
  const consoleMessages = client.events
    .filter((e) => e.method === "Runtime.consoleAPICalled" || e.method === "Runtime.exceptionThrown" || e.method === "Log.entryAdded")
    .map((e) => {
      if (e.method === "Runtime.consoleAPICalled") {
        return {
          kind: "console." + e.params.type,
          text: (e.params.args ?? []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 300),
        };
      }
      if (e.method === "Runtime.exceptionThrown") {
        return { kind: "exception", text: (e.params.exceptionDetails?.exception?.description ?? e.params.exceptionDetails?.text ?? "").slice(0, 300) };
      }
      const entry = e.params.entry ?? {};
      return { kind: "log." + (entry.level ?? "?"), text: String(entry.text ?? "").slice(0, 300) };
    })
    .filter((m) => !/favicon|DevTools|Download the React DevTools/i.test(m.text));
  console.log("console messages:", JSON.stringify(consoleMessages, null, 2));

  /* --- 3: screenshots --- */
  const shots = [
    { name: "01-hero", aim: { sel: ".hero", screenTop: 0 } },
    { name: "02-capture", aim: { sel: "#capture", screenTop: -120 }, settle: 3200 },
    { name: "03-context", aim: { sel: ".context-stage", screenTop: 0 }, settle: 900 },
    { name: "04-views-pinned", aim: { progress: 0.15 }, settle: 700 },
    { name: "04b-views-fade1", aim: { progress: 0.35 }, settle: 700 },
    { name: "04c-views-calendar", aim: { progress: 0.85 }, settle: 700 },
    { name: "05-reminder", aim: { sel: ".reminder-stage", screenTop: 100 }, settle: 1200 },
    { name: "06-ai", aim: { sel: ".scene-ai", screenTop: 80 }, settle: 1600 },
    { name: "07-sync", aim: { sel: ".sync-stage", screenTop: -350 }, settle: 900 },
    { name: "08-day", aim: { passedProgress: 0.75 }, settle: 900 },
    { name: "09-closing", aim: { sel: "#closing, footer", screenTop: 120 }, settle: 700 },
    { name: "10-footer-bottom", aim: { bottom: true }, settle: 700 },
  ];
  let captured = 0;
  for (const shot of shots) {
    const aim = shot.aim;
    const aimed = await evaluate(`(async () => {
      const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
      const settle = ${shot.settle ?? 500};
      if (${JSON.stringify(Boolean(aim.bottom))}) {
        window.scrollTo({ top: 999999, behavior: 'instant' });
        await wait(settle);
        return { y: Math.round(window.scrollY) };
      }
      if (${aim.progress !== undefined ? "true" : "false"}) {
        const stage = document.querySelector('.views-stage');
        const target = ${Number(aim.progress) || 0};
        const vh = window.innerHeight;
        if (stage) {
          for (let pass = 0; pass < 5; pass += 1) {
            const rect = stage.getBoundingClientRect();
            const scrollY = window.scrollY;
            const docTop = rect.top + scrollY;
            const want = Math.max(0, docTop - (0.3 * vh - 1.52 * vh * target));
            if (Math.abs(want - scrollY) < 6) break;
            window.scrollTo({ top: want, behavior: 'instant' });
            await wait(320);
          }
        }
        await wait(settle);
        return {
          y: Math.round(window.scrollY),
          view: document.querySelector('#views')?.dataset.view ?? null,
        };
      }
      if (${aim.passedProgress !== undefined ? "true" : "false"}) {
        const stage = document.querySelector(${JSON.stringify(aim.passedStage ?? "#day")});
        const target = ${Number(aim.passedProgress) || 0};
        const vh = window.innerHeight;
        for (let pass = 0; pass < 5; pass += 1) {
          const rect = stage.getBoundingClientRect();
          const scrollY = window.scrollY;
          const docTop = rect.top + scrollY;
          const maxScroll = document.documentElement.scrollHeight - vh;
          const entry = docTop - vh - 260;
          const exit = Math.min(docTop + rect.height, maxScroll);
          const want = Math.max(0, Math.min(maxScroll, entry + (exit - entry) * target));
          if (Math.abs(want - scrollY) < 6) break;
          window.scrollTo({ top: want, behavior: 'instant' });
          await wait(320);
        }
        await wait(settle);
        return { y: Math.round(window.scrollY) };
      }
      const node = document.querySelector(${JSON.stringify(aim.sel)});
      if (!node) return null;
      const docTop = node.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: Math.max(0, docTop - ${Number(aim.screenTop) || 0}), behavior: 'instant' });
      await wait(settle);
      return { y: Math.round(window.scrollY) };
    })()`);
    if (aimed === null) {
      console.log(`shot ${shot.name}: selector not found (${aim.sel})`);
      continue;
    }
    const png = await client.send("Page.captureScreenshot", { format: "png" });
    writeFileSync(`${SHOT_DIR}/${WIDTH}x${HEIGHT}-${shot.name}.png`, Buffer.from(png.data, "base64"));
    captured += 1;
    console.log(`shot ${shot.name}: ${JSON.stringify(aimed)}`);
  }
  console.log(`captured ${captured} shots into ${SHOT_DIR}`);

  client.close();
} finally {
  chrome.kill();
}
