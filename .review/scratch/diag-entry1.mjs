import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9358;
const PROFILE = import.meta.dirname + "/chrome-profile-probe-entry1";
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
console.log("script src:", await ev(`Array.from(document.scripts).map(s=>s.src).join(',')`));

/* Trace progress against the *actual* scroll position, from the top down. */
const dayTopNow = await ev(`Math.round(document.querySelector('#day').getBoundingClientRect().top + scrollY)`);
console.log("day doc top:", dayTopNow, "maxScroll:", await ev(`document.documentElement.scrollHeight - innerHeight`));
for (const y of [0, 2000, 4000, 6000, 8000, dayTopNow - 1400, dayTopNow - 1000, dayTopNow - 600, dayTopNow - 200, dayTopNow, dayTopNow + 300]) {
  await ev(`scrollTo({top:${y}, behavior:'auto'})`);
  await delay(350);
  const row = await ev(`(() => {
    const s = document.querySelector('#day');
    return JSON.stringify({
      actual: Math.round(scrollY),
      progress: s.dataset.progress,
      state: s.dataset.dayState,
      top: Math.round(s.getBoundingClientRect().top),
      inn: Array.from(document.querySelectorAll('[data-day-entry]')).map(n => getComputedStyle(n).getPropertyValue('--in').trim()),
    });
  })()`);
  console.log(`  want=${String(y).padStart(6)} ${row}`);
}
// Park the page just above the day scene so no entry has started.
const top = await ev(`Math.round(document.querySelector('#day').getBoundingClientRect().top + scrollY)`);
await ev(`scrollTo({top:${top + 900}, behavior:'auto'})`);
await delay(1200);
console.log("just after load, above the scene:");
console.log(await ev(`(() => {
  const nodes = Array.from(document.querySelectorAll('[data-day-entry]'));
  return JSON.stringify(nodes.map((n,i) => ({
    i,
    inlineIn: JSON.stringify(n.getAttribute('style')),
    computedIn: getComputedStyle(n).getPropertyValue('--in'),
    opacity: getComputedStyle(n).opacity,
  })), null, 1);
})()`));
await delay(2500);
console.log("after waiting 2.5s more:");
console.log(await ev(`JSON.stringify(Array.from(document.querySelectorAll('[data-day-entry]')).map(n => getComputedStyle(n).getPropertyValue('--in')))`));
chrome.kill();
