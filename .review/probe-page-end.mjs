/**
 * Checks what a scene that is followed by more page has to guarantee about its own
 * ending, at six viewports:
 *
 *   1. By the time the scene has fully passed — its bottom edge reaching the fold —
 *      it is finished: state 已同步, the phone's item complete, the connection gone.
 *   2. With *more page appended below it*, the scene is already finished when it
 *      passes and does not change again afterwards.
 *   3. Fast scrolling — one jump straight past it — resolves to the same final
 *      state rather than freezing halfway.
 *
 * Property 2 is the one that a window bound to the end of the document silently
 * loses the moment anything is added below the scene, which is exactly what Scene
 * 08 would have done to Scene 07.
 *
 * Usage: node .review/probe-page-end.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:4173/";
const PORT = 9352;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-probe-page-end`;
mkdirSync(PROFILE, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 1024, height: 1366 },
  { width: 768, height: 1024 },
  { width: 430, height: 932 },
  { width: 390, height: 844 },
];

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

const AT_BOTTOM = `(() => {
  const stage = document.querySelector('.sync-stage');
  const section = document.querySelector('#sync');
  const item = document.querySelector('[data-sync-item]');
  const read = (node, prop) => {
    const raw = node?.style.getPropertyValue(prop);
    return raw === '' || raw === undefined ? null : Number(raw);
  };
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const stageRect = stage?.getBoundingClientRect();
  const closingRect = document.querySelector('.scene-sync .scene-closing')?.getBoundingClientRect();
  return JSON.stringify({
    scrollY: Math.round(window.scrollY),
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    atBottom:
      Math.abs(
        window.scrollY - (document.documentElement.scrollHeight - window.innerHeight),
      ) < 1.5,
    viewportH: window.innerHeight,
    syncState: stage?.dataset.syncState ?? null,
    syncProgress: stage?.dataset.progress ? Number(stage.dataset.progress) : null,
    cord: read(document.querySelector('.sync-cord'), '--cord'),
    cordDraw: read(document.querySelector('.sync-cord-line'), '--cord-draw'),
    phoneItem: read(item, '--in'),
    /* Has the scene finished passing? Its bottom edge at or above the fold. */
    passed: Boolean(stageRect && stageRect.bottom <= 1),
    stageBottom: stageRect ? Math.round(stageRect.bottom) : null,
    closingVisible: Boolean(
      closingRect && closingRect.top < window.innerHeight && closingRect.bottom > 0,
    ),
    sectionTop: section ? Math.round(section.getBoundingClientRect().top) : null,
    stageHeight: stageRect ? Math.round(stageRect.height) : null,
    reducedMotion: prefersReduced,
  });
})()`;

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };

  let failures = 0;
  for (const viewport of VIEWPORTS) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.width < 768,
    });
    await client.send("Page.navigate", { url: BASE });
    await delay(2600);

    /* Arrive the way a reader does, walking down so visibility-driven scenes have
       fired, then go as far as the document allows. The claim being checked is
       "finished by the time the scene is behind you", so the position to inspect is
       the furthest one available — not "the element has left the viewport", which
       the end of the document may make impossible and which is not the point. */
    const total = await evaluate(
      `document.documentElement.scrollHeight - window.innerHeight`,
    );
    for (let y = 0; y <= total; y += 400) {
      await evaluate(`window.scrollTo({ top: ${y}, behavior: 'auto' })`);
      await delay(110);
    }
    await evaluate(`window.scrollTo({ top: 999999, behavior: 'auto' })`);
    await delay(600);

    const report = JSON.parse(await evaluate(AT_BOTTOM));

    const gone =
      report.reducedMotion ||
      ((report.cord ?? 1) < 0.05 && (report.cordDraw ?? 1) < 0.05);
    /* 0.99 rather than exactly 1: at the last reachable scroll position the value
       can sit a thousandth short of 1 from sub-pixel clamping, and there is no
       state between 0.99 and 1 — every beat has already completed. */
    const ok =
      (report.syncProgress ?? 0) >= 0.99 &&
      report.syncState === "synced" &&
      gone &&
      (report.phoneItem ?? 0) > 0.98;

    /* 2. With more page below: finished when it passes, and frozen afterwards. */
    await evaluate(
      `(() => {
        const tail = document.createElement('div');
        tail.setAttribute('data-review-tail', '');
        tail.style.height = '200vh';
        tail.setAttribute('aria-hidden', 'true');
        document.body.appendChild(tail);
      })()`,
    );
    await delay(400);
    /* Walk past the scene one step at a time, sampling, so the check sees the
       order of events rather than only the end of them. */
    const passSamples = [];
    for (let step = 0; step < 6; step += 1) {
      await evaluate(`window.scrollBy({ top: ${Math.round(viewport.height * 0.35)}, behavior: 'auto' })`);
      await delay(260);
      passSamples.push(JSON.parse(await evaluate(AT_BOTTOM)));
    }
    const finishedWhenLeaving = passSamples[0];
    const tailOk =
      finishedWhenLeaving.syncState === "synced" &&
      (finishedWhenLeaving.cord ?? 1) < 0.05 &&
      (finishedWhenLeaving.phoneItem ?? 0) > 0.98 &&
      /* and it stays finished for the rest of the walk */
      passSamples.every(
        (sample) =>
          sample.syncState === "synced" &&
          (sample.cord ?? 1) < 0.05 &&
          (sample.phoneItem ?? 0) > 0.98,
      );

    if (!ok || !tailOk) failures += 1;
    console.log(
      `${ok && tailOk ? "PASS" : "FAIL"}  ${String(viewport.width).padStart(4)}×${String(viewport.height).padEnd(4)} ` +
        `at the furthest reachable point: progress=${report.syncProgress} ` +
        `state=${report.syncState} cord=${report.cord} phone=${report.phoneItem} ` +
        `closing=${report.closingVisible}` +
        (tailOk
          ? ` | with page below: finished on leaving, unchanged after`
          : ` | with page below: ${
              passSamples
                .map((s) => `${s.syncState}/${s.cord}/${s.phoneItem}`)
                .join(" → ")
            }`),
    );
  }

  console.log(
    failures === 0
      ? `\nEvery viewport leaves the scene with it already finished, and it stays finished.`
      : `\n${failures} viewport(s) leave the scene before it finishes.`,
  );
  client.close();
  if (failures > 0) process.exitCode = 1;
} finally {
  chrome.kill();
}
