import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9355;
const PROFILE = import.meta.dirname + "/chrome-profile-probe-attrs";
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
for (const delta of [-400, 0, 400]) {
  await ev(`window.scrollTo({top:${top + delta}, behavior:'auto'})`);
  await delay(400);
  console.log(`delta=${String(delta).padStart(5)}`, await ev(`(() => {
    const n = document.querySelector('.sync-stage');
    const r = n.getBoundingClientRect();
    return JSON.stringify({
      y: Math.round(scrollY),
      vh: innerHeight,
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      h: Math.round(r.height),
      progress: n.dataset.progress,
      expected: (((innerHeight + 540) - r.top) / ((innerHeight + 540) - r.bottom)).toFixed(3),
    });
  })()`));
}
chrome.kill();
