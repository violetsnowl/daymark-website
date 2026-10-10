import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9354;
const PROFILE = import.meta.dirname + "/chrome-profile-probe-syncwin";
mkdirSync(PROFILE, { recursive: true });
const chrome = spawn(CHROME, ["--headless=new","--disable-gpu","--no-first-run","--hide-scrollbars",
  `--remote-debugging-port=${PORT}`,`--user-data-dir=${PROFILE}`,"about:blank"], { stdio: "ignore" });
for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch {} await delay(250); }
const t = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = t.find(x => x.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener("open", r, { once: true }));
let id = 1; const pending = new Map();
ws.addEventListener("message", e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
const send = (method, params = {}) => { const i = id++; ws.send(JSON.stringify({ id: i, method, params })); return new Promise(r => pending.set(i, r)); };
const ev = async expr => (await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true })).result.value;
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://127.0.0.1:4173/" });
await delay(2800);
const top = await ev(`Math.round(document.querySelector('.sync-stage').getBoundingClientRect().top + scrollY)`);
for (const delta of [-400, -200, 0, 200, 400, 600]) {
  await ev(`window.scrollTo({top:${top + delta}, behavior:'auto'})`);
  await delay(320);
  console.log(`delta=${String(delta).padStart(5)}`, await ev(`JSON.stringify({
    stageTop: Math.round(document.querySelector('.sync-stage').getBoundingClientRect().top),
    stageH: Math.round(document.querySelector('.sync-stage').getBoundingClientRect().height),
    bottom: Math.round(document.querySelector('.sync-stage').getBoundingClientRect().bottom),
    vh: innerHeight,
    sceneRect: document.querySelector('.sync-stage').dataset.sceneRect,
    sceneWindow: document.querySelector('.sync-stage').dataset.sceneWindow,
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    progress: document.querySelector('.sync-stage').dataset.progress,
    formula540: ((innerHeight + 540) - document.querySelector('.sync-stage').getBoundingClientRect().top) / ((innerHeight + 540) - document.querySelector('.sync-stage').getBoundingClientRect().bottom),
    allStages: Array.from(document.querySelectorAll('.sync-stage')).map(function(n){return Math.round(n.getBoundingClientRect().top);}),
    stageInline: document.querySelector('.sync-stage').getAttribute('style'),
    ownPositive: (innerHeight + 540) - document.querySelector('.sync-stage').getBoundingClientRect().bottom > 0,
    rawFormula: ((innerHeight + 540) - document.querySelector('.sync-stage').getBoundingClientRect().top) / ((innerHeight + 540) - document.querySelector('.sync-stage').getBoundingClientRect().bottom),
  })`));
}
chrome.kill();
