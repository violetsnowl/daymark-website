import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const PORT = 9353;
const PROFILE = import.meta.dirname + "/chrome-profile-probe-diag";
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
await delay(2600);
console.log("before spacer:", await ev(`JSON.stringify({h:document.documentElement.scrollHeight, max:document.documentElement.scrollHeight-innerHeight})`));
await ev(`(()=>{const s=document.createElement('div');s.style.height='120vh';document.body.appendChild(s);})()`);
await delay(300);
console.log("after spacer: ", await ev(`JSON.stringify({h:document.documentElement.scrollHeight, max:document.documentElement.scrollHeight-innerHeight, syncDocTop: Math.round(document.querySelector('.sync-stage').getBoundingClientRect().top+scrollY)})`));
await ev(`window.scrollTo({top:999999,behavior:'auto'})`);
await delay(600);
console.log("at bottom:  ", await ev(`JSON.stringify({y:Math.round(scrollY), max:document.documentElement.scrollHeight-innerHeight, syncTop:Math.round(document.querySelector('.sync-stage').getBoundingClientRect().top), closingTop:Math.round(document.querySelector('.scene-sync .scene-closing').getBoundingClientRect().top)})`));
chrome.kill();
