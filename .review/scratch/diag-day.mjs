import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9357;
const PROFILE = import.meta.dirname + "/chrome-profile-probe-day";
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
await delay(3000);
const total = await ev(`document.documentElement.scrollHeight - innerHeight`);
for (let y = 0; y <= total; y += 700) { await ev(`scrollTo({top:${y},behavior:'auto'})`); await delay(90); }
const top = await ev(`Math.round(document.querySelector('#day').getBoundingClientRect().top + scrollY)`);
console.log("day section document top:", top);
for (let d = 700; d >= -900; d -= 150) {
  await ev(`scrollTo({top:${Math.max(0, top + d)},behavior:'auto'})`);
  await delay(400);
  console.log(`delta=${String(d).padStart(5)}`, await ev(`(() => {
    const s = document.querySelector('#day');
    const r = s.getBoundingClientRect();
    return JSON.stringify({
      y: Math.round(scrollY), top: Math.round(r.top), h: Math.round(r.height),
      progress: s.dataset.progress, state: s.dataset.dayState,
      entries: Array.from(document.querySelectorAll('[data-day-entry]')).map(n => Number(n.style.getPropertyValue('--in') || 0).toFixed(2)).join(','),
      closing: Number((document.querySelector('[data-day-closing]')||{style:{getPropertyValue:()=>0}}).style.getPropertyValue('--in') || 0).toFixed(2),
    });
  })()`));
}
chrome.kill();
