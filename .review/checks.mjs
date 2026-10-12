/**
 * Asserts the prototype's runtime behaviour in a real browser (W3 §26, §28):
 * capture state machine, reset action, reduced-motion fallback, keyboard focus,
 * language switching and horizontal overflow — at the reference viewports.
 *
 * Usage: node .review/checks.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9336;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-checks`;
mkdirSync(PROFILE, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
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

const results = [];
const check = (name, passed, detail = "") => {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
};

const evaluate = async (client, expression) => {
  const result = await client.send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails));
  }
  return result.result.value;
};

const goTo = async (
  client,
  path,
  width,
  height,
  reducedMotion = false,
  readyExpression = "Boolean(document.querySelector('.hero') && document.querySelector('#capture'))",
) => {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 768,
  });
  await client.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" }],
  });
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Page.navigate", { url: new URL(path, BASE).href });
  await delay(700);
  await client.send("Page.reload", { ignoreCache: true });
  await delay(1500);
  /* Wait for the app to have actually rendered, rather than trusting a fixed delay.
     A one-shot demo on the page keeps changing its height after load, so "load
     event fired" is not the same as "the sections exist" — and on a loaded machine
     the gap is long enough for the next query to run against an empty document,
     which then reads as a missing selector instead of as slow rendering.
     Pages without the home sections (e.g. /download/) pass their own selector. */
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const ready = await evaluate(client, readyExpression);
    if (ready) break;
    await delay(150);
  }
};

const scrollToSection = async (client, selector) => {
  await evaluate(
    client,
    `(() => {
      const node = document.querySelector(${JSON.stringify(selector)});
      window.scrollTo({ top: node.getBoundingClientRect().top + window.scrollY, behavior: 'auto' });
      return true;
    })()`,
  );
};

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);

  /* ---------- 1. Capture demo, desktop ---------- */
  await goTo(client, "/", 1440, 900);
  await scrollToSection(client, "#capture");
  await delay(3600);

  const settled = await evaluate(
    client,
    `(() => ({
      phase: document.querySelector('.scene-capture').dataset.phase,
      inputValue: document.querySelector('#capture-input').value,
      fieldRows: document.querySelectorAll('.capture-fields > div').length,
      itemTitle: document.querySelector('.capture-settled .item-title')?.textContent ?? null,
      itemMeta: document.querySelector('.capture-settled .item-meta')?.textContent ?? null,
      resetVisible: !!document.querySelector('.capture-foot-actions .text-action'),
      live: document.querySelector('[role="status"]')?.textContent ?? null,
    }))()`,
  );
  check("capture reaches STRUCTURED", settled.phase === "STRUCTURED", settled.phase);
  check(
    "demo sentence stays in the field",
    settled.inputValue === "周五交高等数学第二次作业",
    settled.inputValue,
  );
  check("course / time / content are shown", settled.fieldRows === 3, `${settled.fieldRows} rows`);
  check("item title settled", settled.itemTitle === "周五交第二次作业", String(settled.itemTitle));
  check(
    "item meta carries the course and the deadline the whole site shares",
    settled.itemMeta === "高等数学 · 截止 周五 · 23:59",
    String(settled.itemMeta),
  );
  check("reset action is offered", settled.resetVisible);
  check(
    "status is announced",
    typeof settled.live === "string" && settled.live.includes("已整理"),
    String(settled.live),
  );

  /* ---------- 2. Reset returns to EMPTY ---------- */
  await evaluate(client, `document.querySelector('.capture-foot-actions .text-action').click()`);
  await delay(400);
  const afterReset = await evaluate(
    client,
    `(() => ({
      phase: document.querySelector('.scene-capture').dataset.phase,
      inputValue: document.querySelector('#capture-input').value,
      focused: document.activeElement?.id ?? null,
    }))()`,
  );
  check("reset returns to EMPTY", afterReset.phase === "EMPTY", afterReset.phase);
  check("reset clears the field", afterReset.inputValue === "", `"${afterReset.inputValue}"`);
  check("reset returns focus to the field", afterReset.focused === "capture-input", String(afterReset.focused));

  /* ---------- 3. Visitor types an ambiguous sentence ---------- */
  await evaluate(
    client,
    `(() => {
      const input = document.querySelector('#capture-input');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, '周五交作业');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.form.requestSubmit();
      return true;
    })()`,
  );
  await delay(1600);
  const ambiguous = await evaluate(
    client,
    `(() => ({
      phase: document.querySelector('.scene-capture').dataset.phase,
      clarify: document.querySelector('.capture-clarify-question')?.textContent ?? null,
    }))()`,
  );
  check(
    "ambiguous capture asks instead of inventing",
    ambiguous.phase === "CLARIFY",
    `${ambiguous.phase} / ${ambiguous.clarify}`,
  );

  /* ---------- 4. Keyboard: tab reaches the language switch and CTA ---------- */
  await goTo(client, "/", 1440, 900);
  const reachable = await evaluate(
    client,
    `(() => {
      const selectors = [
        'a.skip-link',
        '.site-brand',
        '.site-nav-links a',
        '.site-nav-language button',
        '.site-nav-cta',
        '.hero-actions a',
        '#capture-input',
        '.capture-submit',
        '.site-footer-groups a',
      ];
      const focusable = Array.from(
        document.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
      );
      /* offsetParent is null for genuinely unrendered controls (the mobile menu
         trigger at desktop width); it stays non-null for the off-screen skip
         link and for fixed-position elements. */
      const rendered = focusable.filter((node) => node.offsetParent !== null);
      return {
        count: rendered.length,
        hidden: focusable.filter((node) => node.offsetParent === null).map((node) => node.className),
        allPresent: selectors.map((selector) => ({
          selector,
          found: !!document.querySelector(selector),
        })),
        allVisible: rendered.every((node) => {
          const rect = node.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        }),
        minTouch: rendered
          .map((node) => ({
            control: (node.id || node.className || node.tagName) + "",
            height: Math.round(node.getBoundingClientRect().height),
          }))
          /* W2 §19.2 asks for "about 44px": the product's own compact control
             floor is 42px (the app's .btn-small), which this inherits. */
          .filter((entry) => entry.height > 0 && entry.height < 42),
      };
    })()`,
  );
  check(
    "every expected control exists",
    reachable.allPresent.every((entry) => entry.found),
    reachable.allPresent.filter((entry) => !entry.found).map((entry) => entry.selector).join(", ") || "all present",
  );
  check(
    "rendered controls have real boxes",
    reachable.allVisible,
    `hidden: ${reachable.hidden.join(", ") || "none"}`,
  );
  check(
    "touch targets stay at least 44px",
    reachable.minTouch.length === 0,
    reachable.minTouch.map((entry) => `${entry.control}=${entry.height}`).join(", ") ||
      `${reachable.count} controls checked`,
  );

  /* ---------- 4b. Keyboard order reaches the capture field ---------- */
  const tabOrder = await evaluate(
    client,
    `(() => {
      const seen = [];
      const nodes = Array.from(
        document.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'),
      ).filter((node) => node.offsetParent !== null);
      for (const node of nodes) {
        node.focus();
        seen.push(document.activeElement === node ? (node.id || node.className || node.tagName) : 'MISS');
      }
      return { seen: seen.slice(0, 12), misses: seen.filter((entry) => entry === 'MISS').length };
    })()`,
  );
  check(
    "every rendered control can take focus",
    tabOrder.misses === 0,
    `first: ${tabOrder.seen.slice(0, 6).join(" → ")}`,
  );

  /* ---------- 4c. Mobile menu is reachable and closes on Escape ---------- */
  await goTo(client, "/", 390, 844);
  const triggerInfo = await evaluate(
    client,
    `(() => {
      const trigger = document.querySelector('.site-nav-menu-trigger');
      const rect = trigger.getBoundingClientRect();
      trigger.click();
      return {
        innerWidth: window.innerWidth,
        display: getComputedStyle(trigger).display,
        box: [Math.round(rect.width), Math.round(rect.height)],
      };
    })()`,
  );
  await delay(500);
  const menuOpen = await evaluate(
    client,
    `(() => {
      const panel = document.querySelector('#site-menu');
      return {
        open: !!panel,
        links: panel ? panel.querySelectorAll('a').length : 0,
        buttons: panel ? panel.querySelectorAll('button').length : 0,
        focusInside: document.activeElement?.id === 'site-menu',
        bodyLocked: document.body.style.overflow === 'hidden',
      };
    })()`,
  );
  await evaluate(
    client,
    `document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))`,
  );
  await delay(400);
  const menuClosed = await evaluate(
    client,
    `({ gone: !document.querySelector('#site-menu'), bodyUnlocked: document.body.style.overflow !== 'hidden' })`,
  );
  check(
    "mobile menu opens with all anchors",
    menuOpen.open && menuOpen.links >= 3,
    `${menuOpen.links} links, ${menuOpen.buttons} buttons (trigger ${triggerInfo.display} @${triggerInfo.innerWidth}px)`,
  );
  check("mobile menu moves focus inside", menuOpen.focusInside);
  check("mobile menu locks background scroll", menuOpen.bodyLocked);
  check("Escape closes the mobile menu", menuClosed.gone && menuClosed.bodyUnlocked);

  /* ---------- 5. Horizontal overflow across viewports ---------- */
  for (const [width, height] of [
    [1440, 900],
    [1280, 800],
    [1024, 1366],
    [768, 1024],
    [430, 932],
    [390, 844],
    [360, 780],
  ]) {
    await goTo(client, "/", width, height);
    const overflow = await evaluate(
      client,
      `(() => {
        const offenders = Array.from(document.querySelectorAll('body *'))
          .filter((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width > 0 && (rect.right > window.innerWidth + 1 || rect.left < -1);
          })
          .slice(0, 4)
          .map((node) => node.className || node.tagName);
        return {
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
          offenders,
        };
      })()`,
    );
    check(
      `no horizontal overflow at ${width}×${height}`,
      overflow.scrollWidth <= overflow.innerWidth + 1,
      `scrollWidth ${overflow.scrollWidth} vs ${overflow.innerWidth}${overflow.offenders.length ? ` — ${overflow.offenders.join(" | ")}` : ""}`,
    );
  }

  /* ---------- 6. Reduced motion resolves Scene 02 without animating ---------- */
  await goTo(client, "/", 1440, 900, true);
  await scrollToSection(client, "#capture");
  await delay(700);
  const reduced = await evaluate(
    client,
    `(() => ({
      phase: document.querySelector('.scene-capture').dataset.phase,
      fieldRows: document.querySelectorAll('.capture-fields > div').length,
      fragmentsResting: Array.from(document.querySelectorAll('.fragment')).every((node) => {
        const transform = getComputedStyle(node).transform;
        return transform === 'none' || /matrix\\(1, 0, 0, 1, 0, 0\\)/.test(transform);
      }),
      heroTitleOpacity: getComputedStyle(document.querySelector('.hero-title')).opacity,
    }))()`,
  );
  check(
    "reduced motion shows the final capture state",
    reduced.phase === "STRUCTURED" && reduced.fieldRows === 3,
    `${reduced.phase} / ${reduced.fieldRows} rows`,
  );
  check("reduced motion removes fragment drift", reduced.fragmentsResting);
  check("reduced motion keeps the headline fully visible", reduced.heroTitleOpacity === "1", reduced.heroTitleOpacity);

  /* ---------- 7. Scene 01 — the scatter actually moves ---------- */
  /* 用户反馈（2026-10-10）：第一版位移太轻，"甚至不仔细看看不出在动"；更早还
     出现过"两条片段从未出现在屏幕上"。这一节直接对着两次反馈量两件事：
     ①进入场景主体时五条片段全部在屏（含幽灵问题）；②每条片段在整段旅程中真实
     移动的净距离 ≥ 36px、缩放落定 ≥ 3%——位移再被改"轻"会在这里立刻红。 */
  await goTo(client, "/", 1440, 900);
  await delay(600);
  const ideasSample = await evaluate(
    client,
    `(async () => {
      const section = document.querySelector('.scene-small-things');
      const docTop = section.getBoundingClientRect().top + window.scrollY;
      const vh = window.innerHeight;
      const pause = () => new Promise((resolve) => setTimeout(resolve, 250));
      const read = () => Array.from(document.querySelectorAll('.scene-small-things .fragment')).map((node) => {
        const rect = node.getBoundingClientRect();
        const ex = Number(node.style.getPropertyValue('--ex') || '1');
        const base = Number(node.style.getPropertyValue('--base-opacity') || '1');
        return {
          text: node.textContent ?? '',
          visible: rect.top < vh && rect.bottom > 0 && ex * base > 0.1,
          fx: parseFloat(node.style.getPropertyValue('--fx') || '0'),
          fy: parseFloat(node.style.getPropertyValue('--fy') || '0'),
          fs: parseFloat(node.style.getPropertyValue('--fs') || '1'),
        };
      });
      /* Three samples against the scene window (startAt 0.5, one viewport of
         travel): the primary view (every fragment now on screen), an early
         drift sample (progress ≈ 0.15, offsets near their full scatter), and
         the rest state (progress ≥ 1). */
      window.scrollTo({ top: docTop - 0.12 * vh, behavior: 'instant' });
      await pause();
      const primary = read();
      window.scrollTo({ top: docTop - 0.35 * vh, behavior: 'instant' });
      await pause();
      const early = read();
      window.scrollTo({ top: docTop + 0.70 * vh, behavior: 'instant' });
      await pause();
      const late = read();
      return { primary, early, late };
    })()`,
  );
  check(
    "every fragment is on screen when the section becomes primary",
    ideasSample.primary.length === 5 && ideasSample.primary.every((fragment) => fragment.visible),
    ideasSample.primary.map((fragment) => `${fragment.text.slice(0, 6)}:${fragment.visible ? "on" : "off"}`).join(" "),
  );
  const fragmentTravels = ideasSample.early.map((fragment, index) => {
    const rest = ideasSample.late[index];
    return {
      text: fragment.text,
      distance: Math.hypot(fragment.fx - rest.fx, fragment.fy - rest.fy),
      scale: rest.fs - fragment.fs,
    };
  });
  check(
    "the scatter visibly converges (each fragment travels ≥ 36px, scale settles ≥ 3%)",
    fragmentTravels.every((entry) => entry.distance >= 36 && entry.scale >= 0.03),
    fragmentTravels
      .map((entry) => `${entry.text.slice(0, 5)} ${Math.round(entry.distance)}px/${entry.scale.toFixed(3)}`)
      .join(" "),
  );

  /* ---------- 8. Scene 03 — Context (W4 §3) ---------- */
  await goTo(client, "/", 1440, 900);
  await scrollToSection(client, "#context");
  await delay(900);
  const contextStage = await evaluate(
    client,
    `(() => {
      const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
      const item = document.querySelector('.context-item');
      const itemRect = item.getBoundingClientRect();
      return {
        chipCount: chips.length,
        kinds: chips.map((chip) => chip.dataset.chip),
        labels: chips.map((chip) => chip.querySelector('.context-chip-label')?.textContent ?? ''),
        values: chips.map((chip) => chip.querySelector('.context-chip-value')?.textContent ?? ''),
        itemCourse: document.querySelector('.context-item-course')?.textContent ?? null,
        itemTitle: document.querySelector('.context-item-title')?.textContent ?? null,
        itemBox: [Math.round(itemRect.width), Math.round(itemRect.height)],
        dots: chips.map((chip) => getComputedStyle(chip.querySelector('.context-chip-dot')).backgroundColor),
        closing: document.querySelector('.scene-context .scene-closing')?.textContent ?? null,
      };
    })()`,
  );
  check("context shows four pieces of context", contextStage.chipCount === 4, contextStage.kinds.join(", "));
  /* The narrative order is carried by `arrivesAt`, not by DOM order: the chips
     sit in their layout positions (reminder on the right of the object, content
     below it) while arriving 课程 → 时间 → 内容 → 提醒 (W4 §3.4). */
  const arrivalOrder = await evaluate(
    client,
    `Array.from(document.querySelectorAll('#context [data-chip]')).map((chip) => ({
      kind: chip.dataset.chip,
      arrivesAt: Number(chip.dataset.arrives),
    }))`,
  );
  const byArrival = [...arrivalOrder]
    .sort((a, b) => a.arrivesAt - b.arrivesAt)
    .map((entry) => entry.kind)
    .join(",");
  check(
    "context arrives in the order 课程 → 时间 → 内容 → 提醒",
    byArrival === "course,time,content,reminder" &&
      new Set(arrivalOrder.map((entry) => entry.arrivesAt)).size === 4,
    `${byArrival} (${arrivalOrder.map((entry) => `${entry.kind}@${entry.arrivesAt}`).join(" ")})`,
  );
  check(
    "context carries this item's real values",
    contextStage.itemCourse === "高等数学" && contextStage.itemTitle === "周五交第二次作业",
    `${contextStage.itemCourse} / ${contextStage.itemTitle}`,
  );
  check(
    "the course connection is the only accented one",
    contextStage.dots[0] === "rgb(49, 86, 74)" &&
      contextStage.dots.slice(1).every((colour) => colour !== "rgb(49, 86, 74)"),
    contextStage.dots.join(" | "),
  );
  check(
    "context closing line is present",
    String(contextStage.closing).includes("上下文"),
    String(contextStage.closing),
  );

  /* The object must not move while the context arrives (W4 §3.3). Measured
     relative to the stage, because scrolling moves the whole scene by design. */
  const itemStability = await evaluate(
    client,
    `(async () => {
      const item = document.querySelector('.context-item');
      const stage = document.querySelector('.context-stage');
      const read = () => {
        const itemRect = item.getBoundingClientRect();
        const stageRect = stage.getBoundingClientRect();
        return {
          x: Math.round(itemRect.left - stageRect.left),
          y: Math.round(itemRect.top - stageRect.top),
        };
      };
      const start = window.scrollY;
      const before = read();
      window.scrollTo({ top: start - 200, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const earlier = read();
      window.scrollTo({ top: start + 200, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const later = read();
      return { before, earlier, later };
    })()`,
  );
  check(
    "the item itself stays put while context arrives",
    itemStability.before.x === itemStability.earlier.x &&
      itemStability.before.x === itemStability.later.x &&
      itemStability.before.y === itemStability.earlier.y &&
      itemStability.before.y === itemStability.later.y,
    JSON.stringify(itemStability),
  );

  /* The reveal follows scroll, sampled as a curve in one page lifetime, read
     from the chips' own `--in` value rather than from the scene's published
     progress: the published value is written by a React effect one frame behind
     a scripted scroll, while `--in` is the ground truth of what is on screen.
     `stageTop` is reported so the curve can be checked against the viewport. */
  await goTo(client, "/", 1440, 900);
  const revealCurve = await evaluate(
    client,
    `(async () => {
      const stage = document.querySelector('.context-stage');
      const top = stage.getBoundingClientRect().top + window.scrollY;
      const samples = [];
      for (let delta = -700; delta <= 900; delta += 100) {
        window.scrollTo({ top: Math.max(0, top + delta), behavior: 'auto' });
        await new Promise((resolve) => setTimeout(resolve, 500));
        const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
        samples.push({
          delta,
          scrollY: Math.round(window.scrollY),
          stageTop: Math.round(stage.getBoundingClientRect().top),
          viewportH: window.innerHeight,
          in: chips.map((chip) => Number(chip.style.getPropertyValue('--in') || 0)),
        });
      }
      return samples;
    })()`,
  );
  const allRevealValues = revealCurve.flatMap((sample) => sample.in);
  /* The reveal must be entirely visible: it begins as the object comes into view
     and finishes while the object is still comfortably on screen. Measured
     against the viewport height reported by the samples themselves, so the check
     does not depend on the window size the harness happens to run at. */
  const viewportHeight = revealCurve[0].viewportH;
  const firstMove = revealCurve.find((sample) =>
    sample.in.some((value) => value > 0.05 && value < 0.95),
  );
  const laterMovement = revealCurve.filter((sample) =>
    sample.in.some((value) => value > 0.05 && value < 0.95),
  );
  const lastTouched = laterMovement[laterMovement.length - 1];
  const completelyArrived = revealCurve.filter((sample) =>
    sample.in.every((value) => value > 0.98),
  );
  const arrivalComplete = completelyArrived[0];
  check(
    "context arrives gradually, not all at once",
    /* Starts from nothing, passes through intermediate states, ends complete. */
    Math.min(...allRevealValues) < 0.05 &&
      Math.max(...allRevealValues) > 0.98 &&
      /* Several distinct intermediate states — not one gesture. */
      laterMovement.length >= 3 &&
      /* And all of it happens on screen: movements begin no lower than the bottom
         of the viewport, the last movement no higher than the top of it, and the
         final state is reached before the object leaves the screen. */
      Boolean(firstMove) &&
      firstMove.stageTop <= viewportHeight &&
      Boolean(lastTouched) &&
      lastTouched.stageTop >= -0.1 * viewportHeight &&
      Boolean(arrivalComplete) &&
      arrivalComplete.stageTop >= -0.15 * viewportHeight,
    `first movement at stageTop ${firstMove?.stageTop} (viewport ${viewportHeight}), ` +
      `last movement at ${lastTouched?.stageTop}, complete at ${arrivalComplete?.stageTop} | ` +
      revealCurve
        .map(
          (sample) =>
            `${sample.stageTop}:${sample.in.map((value) => value.toFixed(2)).join("/")}`,
        )
        .join("  "),
  );

  /* ---------- 9. Scene 04 — One Item, Many Views (W4 §4) ---------- */
  await goTo(client, "/", 1440, 900);
  /* Walked across the stage, not the page: the pinned stretch is ~400px of
     travel now (flanks ~100px, 课程 ~200px), and a page-wide step grid skips
     whole projections. 'instant' — see the smooth-behaviour note in the
     reachability walk. */
  const viewScan = await evaluate(
    client,
    `(async () => {
      const section = document.querySelector('#views');
      const stage = document.querySelector('.views-stage');
      const byView = {};
      const stageDocTop = stage.getBoundingClientRect().top + window.scrollY;
      const start = Math.max(0, stageDocTop - window.innerHeight);
      const end = Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        stageDocTop + stage.getBoundingClientRect().height,
      );
      const steps = 60;
      for (let step = 0; step <= steps; step += 1) {
        window.scrollTo({ top: start + ((end - start) * step) / steps, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 90));
        const view = section.dataset.view;
        if (section.dataset.pinned !== 'true') continue;
        const item = document.querySelector('.views-panels [data-panel="' + view + '"] .item-row.is-marked');
        if (!item) continue;
        /* Measured against the projection's own box, which is unaffected by the
           small transform the inactive projections carry while fading. */
        const panel = item.closest('.views-panel');
        const panelBox = panel.getBoundingClientRect();
        const itemBox = item.getBoundingClientRect();
        byView[view] = byView[view] || [];
        byView[view].push({
          scrollY: Math.round(window.scrollY),
          title: item.querySelector('.item-title')?.textContent ?? '',
          meta: item.querySelector('.item-meta')?.textContent ?? '',
          lineTop: Math.round(itemBox.top - panelBox.top),
          lineLeft: Math.round(itemBox.left - panelBox.left),
        });
      }
      return byView;
    })()`,
  );
  const seenViews = Object.keys(viewScan);
  check(
    "all three projections appear while pinned",
    ["overview", "courses", "calendar"].every((view) => seenViews.includes(view)),
    seenViews.join(", ") || "none",
  );
  const markedTitles = seenViews.map((view) => viewScan[view][0]?.title ?? null);
  check(
    "the same item is the marked one in every view",
    markedTitles.length === 3 && markedTitles.every((title) => title === "周五交第二次作业"),
    markedTitles.join(" | "),
  );
  /* The item keeps one line across the projections: sub-pixel rounding in a
     three-column layout can differ by a pixel, so the comparison allows ±2px
     rather than demanding byte-identical layout. */
  const positions = seenViews.map((view) => {
    const first = viewScan[view][0];
    return { left: first.lineLeft, top: first.lineTop };
  });
  const baseline = positions[0];
  check(
    "the item keeps its line in the composition across views",
    positions.every(
      (position) =>
        Math.abs(position.left - baseline.left) <= 2 && Math.abs(position.top - baseline.top) <= 2,
    ),
    positions.map((position) => `${position.left},${position.top}`).join(" | "),
  );
  /* The nav highlight is read together with the view it belongs to, and scoped
     to the views window: the hero shows a product window too, and its nav is
     always on the overview. */
  /* Walked across the views stage itself, not the whole page: the pinned
     stretch is short now (~300px of travel), and a page-wide 41-step grid
     skips entire projections — the check then reports a missing view that the
     reader would never miss. 'instant' for the same reason as the reachability
     walk: the stylesheet's smooth behaviour turns 'auto' into an animation and
     samples chase it. */
  const navFollows = await evaluate(
    client,
    `(async () => {
      const section = document.querySelector('#views');
      const stage = document.querySelector('.views-stage');
      const nav = document.querySelector('.product-window--views .product-nav');
      const mismatches = [];
      const observed = {};
      const stageDocTop = stage.getBoundingClientRect().top + window.scrollY;
      const start = Math.max(0, stageDocTop - window.innerHeight);
      const end = Math.min(
        document.documentElement.scrollHeight - window.innerHeight,
        stageDocTop + stage.getBoundingClientRect().height,
      );
      const steps = 60;
      for (let step = 0; step <= steps; step += 1) {
        window.scrollTo({ top: start + ((end - start) * step) / steps, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 90));
        if (section.dataset.pinned !== 'true') continue;
        const view = section.dataset.view;
        const active = nav?.querySelector('li.is-active')?.dataset.productView ?? null;
        observed[view] = active;
        if (active !== view) mismatches.push(view + '→' + active);
      }
      return { observed, mismatches };
    })()`,
  );
  check(
    "the product nav follows the current projection",
    Object.keys(navFollows.observed).length === 3 && navFollows.mismatches.length === 0,
    JSON.stringify(navFollows),
  );
  const viewsCaption = await evaluate(
    client,
    `document.querySelector('.scene-views .scene-closing')?.textContent ?? null`,
  );
  check(
    "views closing line is present",
    String(viewsCaption).includes("不是复制"),
    String(viewsCaption),
  );

  /* ---------- 10. Scene 05 — Reminder (W4 §5) ---------- */
  await goTo(client, "/", 1440, 900);
  const reminder = await evaluate(
    client,
    `(async () => {
      const stage = document.querySelector('.reminder-stage');
      const top = stage.getBoundingClientRect().top + window.scrollY;
      const samples = [];
      /* Sampled every 50px, not every 100px. Each arrival eases in over 0.16 of an
         800px window — about 128px — so a 100px step can straddle a whole
         transition and see only its endpoints. That is not a hypothetical: it made
         a correct two-stage arrival look like a single gesture, and the fix belongs
         in the sampling rather than in the scene. */
      for (let delta = -700; delta <= 300; delta += 50) {
        window.scrollTo({ top: Math.max(0, top + delta), behavior: 'auto' });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const read = (selector) => {
          const node = stage.querySelector(selector);
          const raw = node?.style.getPropertyValue('--in');
          return raw === '' || raw === undefined ? null : Number(raw);
        };
        samples.push({
          stageTop: Math.round(stage.getBoundingClientRect().top),
          viewportH: window.innerHeight,
          time: read('[data-reveal="time"]'),
          surface: read('[data-reveal="surface"]'),
          state: stage.dataset.reminderState,
        });
      }
      const fields = Array.from(document.querySelectorAll('.reminder-fields dd')).map(
        (node) => node.textContent,
      );
      const itemTitle = document.querySelector('.reminder-surface .item-title')?.textContent ?? null;
      return {
        samples,
        fields,
        itemTitle,
        closing: document.querySelector('.scene-reminder .scene-closing')?.textContent ?? null,
      };
    })()`,
  );
  const reminderSamples = reminder.samples;
  const reminderArrived = reminderSamples.filter((sample) => sample.surface > 0.98);
  const reminderMoved = reminderSamples.filter((sample) => sample.surface > 0.05 && sample.surface < 0.95);
  check(
    "the reminder arrives after the time label, not with it",
    reminderSamples.some((sample) => (sample.time ?? 0) > 0.9 && (sample.surface ?? 0) < 0.1) &&
      reminderSamples.some((sample) => (sample.time ?? 0) < 0.1 && (sample.surface ?? 0) < 0.1),
    reminderSamples
      .map((sample) => `${sample.stageTop}:${sample.time?.toFixed(2)}/${sample.surface?.toFixed(2)}`)
      .join("  "),
  );
  check(
    "the whole reminder reveal happens on screen",
    reminderMoved.length >= 1 &&
      reminderMoved.every((sample) => sample.stageTop <= reminderSamples[0].viewportH) &&
      reminderArrived.length > 0 &&
      reminderArrived[0].stageTop >= -0.15 * reminderSamples[0].viewportH,
    `moved at ${reminderMoved.map((s) => s.stageTop).join(",")}; complete at ${reminderArrived[0]?.stageTop}`,
  );
  check(
    "the reminder holds the same item, never a new object",
    reminder.itemTitle === "周五交第二次作业" &&
      JSON.stringify(reminder.fields) ===
        JSON.stringify(["高等数学", "周五 · 23:59", "第二次作业"]),
    `${reminder.itemTitle} / ${reminder.fields.join(" | ")}`,
  );
  check(
    "the reminder scene shows no countdown",
    !/\d{2}:\d{2}:\d{2}/.test(JSON.stringify(reminderSamples)) &&
      reminderSamples.every((sample) => sample.state !== "counting"),
    `states: ${[...new Set(reminderSamples.map((s) => s.state))].join(", ")}`,
  );
  check(
    "reminder closing line is present",
    String(reminder.closing).includes("暂时放下"),
    String(reminder.closing),
  );

  /* ---------- 11. Scene 06 — AI, Quietly (W4 §6) ---------- */
  await goTo(client, "/", 1440, 900);
  const aiInitial = await evaluate(
    client,
    `(async () => {
      const scene = document.querySelector('.scene-ai');
      const stage = document.querySelector('.ai-stage');
      window.scrollTo({ top: stage.getBoundingClientRect().top + window.scrollY - 320, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 1200));
      return {
        phase: scene.dataset.phase,
        input: document.querySelector('.ai-input-text')?.textContent ?? null,
        question: document.querySelector('.ai-question-text')?.textContent ?? null,
        answers: Array.from(document.querySelectorAll('.ai-answer')).map((node) => node.textContent.trim()),
        pending: document.querySelector('.ai-pending')?.textContent ?? null,
        questionVisible: document.querySelector('.ai-question')?.dataset.visible,
        resultVisible: document.querySelector('.ai-result')?.dataset.visible,
        hasAiBadge: /AI\\s*(powered|模型|引擎)/i.test(scene.textContent ?? ''),
        /* Nothing in this scene may assert a calendar date. */
        inventsDate: /\\d+\\s*月\\s*\\d+\\s*日|\\d{4}-\\d{2}-\\d{2}|\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+\\d{1,2}\\b|\\b\\d{1,2}\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\b/.test(
          scene.textContent ?? '',
        ),
      };
    })()`,
  );
  check(
    "AI scene opens with the ambiguous input and one question",
    aiInitial.phase === "ASKING" &&
      aiInitial.input === "周五交作业" &&
      String(aiInitial.question).includes("属于哪门课") &&
      aiInitial.answers.length === 2,
    `${aiInitial.phase} / "${aiInitial.input}" / ${aiInitial.answers.join(" | ")}`,
  );
  check(
    "the AI scene asks before it decides",
    aiInitial.resultVisible === "false" && aiInitial.questionVisible === "true",
    `question=${aiInitial.questionVisible} result=${aiInitial.resultVisible}`,
  );
  check(
    "no AI-powered marketing badge in the scene",
    aiInitial.hasAiBadge === false,
  );
  check(
    "the AI demo never invents a date",
    aiInitial.inventsDate === false,
    String(aiInitial.pending),
  );

  const aiResolved = await evaluate(
    client,
    `(async () => {
      document.querySelectorAll('.ai-answer')[0].click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const scene = document.querySelector('.scene-ai');
      return {
        phase: scene.dataset.phase,
        label: document.querySelector('.ai-confirmed-label')?.textContent ?? null,
        value: document.querySelector('.ai-confirmed-value')?.textContent ?? null,
        note: document.querySelector('.ai-note')?.textContent ?? null,
        itemTitle: document.querySelector('.ai-result-item .item-title')?.textContent ?? null,
        itemMeta: document.querySelector('.ai-result-item .item-meta')?.textContent ?? null,
        /* The question is answered, so the answers must no longer invite a click. */
        answersDisabled: Array.from(document.querySelectorAll('.ai-answer')).every(
          (node) => node.disabled,
        ),
        /* No date, and no invented detail beyond the course. */
        inventsDate: /\\d+\\s*月\\s*\\d+\\s*日|\\b(Oct|October)\\b/.test(scene.textContent ?? ''),
      };
    })()`,
  );
  check(
    "answering resolves the course — the thing the sentence left unstated",
    aiResolved.phase === "RESOLVED" &&
      aiResolved.value === "高等数学" &&
      String(aiResolved.label).includes("课程"),
    `${aiResolved.phase} / ${aiResolved.label}: ${aiResolved.value}`,
  );
  check(
    "the resolved item keeps its own time and content, unchanged",
    aiResolved.itemMeta === "高等数学 · 周五 · 23:59" &&
      aiResolved.inventsDate === false,
    `title=${aiResolved.itemTitle} meta=${aiResolved.itemMeta}`,
  );

  const aiKept = await evaluate(
    client,
    `(async () => {
      document.querySelector('.scene-ai .text-action')?.click();
      await new Promise((resolve) => setTimeout(resolve, 300));
      document.querySelectorAll('.ai-answer')[1].click();
      await new Promise((resolve) => setTimeout(resolve, 500));
      const scene = document.querySelector('.scene-ai');
      return {
        phase: scene.dataset.phase,
        note: document.querySelector('.ai-note')?.textContent ?? null,
        confirmed: document.querySelectorAll('.ai-confirmed').length,
        itemTitle: document.querySelector('.ai-result-item .item-title')?.textContent ?? null,
        reopen: document.querySelector('.scene-ai .text-action')?.textContent ?? null,
        inventsDate: /\\d+\\s*月\\s*\\d+\\s*日|\\b(Oct|October)\\b/.test(scene.textContent ?? ''),
      };
    })()`,
  );
  check(
    "declining to answer keeps the input and the unconfirmed state",
    aiKept.phase === "KEPT" &&
      String(aiKept.note).includes("原样") &&
      aiKept.confirmed === 0 &&
      aiKept.itemTitle === "周五交作业" &&
      aiKept.inventsDate === false,
    `${aiKept.phase} / ${aiKept.note} / item=${aiKept.itemTitle}`,
  );
  check(
    "both paths lead back to the question rather than to a dead end",
    String(aiKept.reopen).includes("回答"),
    String(aiKept.reopen),
  );
  const aiClosing = await evaluate(
    client,
    `document.querySelector('.scene-ai .scene-closing')?.textContent ?? null`,
  );
  check(
    "AI closing line describes assistance, not automation",
    String(aiClosing).includes("弄清楚") && !/自动(安排|规划|完成)/.test(String(aiClosing)),
    String(aiClosing),
  );

  /* ---------- 12a. Navigation anchors (W4 §11.1) ---------- */
  await goTo(client, "/", 1440, 900);
  const navTargets = await evaluate(
    client,
    `(() => {
      const links = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));
      return links.map((link) => ({
        label: link.textContent.trim(),
        href: link.getAttribute('href'),
        /* An anchor that resolves to nothing scrolls nowhere, silently. */
        resolves: Boolean(document.querySelector(link.getAttribute('href'))),
      }));
    })()`,
  );
  const howItWorks = navTargets.find((entry) => entry.label === "怎么工作");
  check(
    "怎么工作 starts at the workflow's beginning, not at its centrepiece",
    howItWorks?.href === "#capture" && navTargets.every((entry) => entry.resolves),
    navTargets
      .map((entry) => `${entry.label}→${entry.href}${entry.resolves ? "" : "(missing)"}`)
      .join("  "),
  );

  /* ---------- 12c. One story, one weekday (review decision) ---------- */
  const timeConsistency = await evaluate(
    client,
    `(() => {
      const text = document.body.innerText;
      /* A date anywhere on the page would contradict the weekday every scene uses. */
      const datePattern =
        /\\d+\\s*月\\s*\\d+\\s*日|\\d{4}-\\d{2}-\\d{2}|\\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\.?\\s+\\d{1,2}\\b|\\b\\d{1,2}\\s+(January|February|March|April|May|June|July|August|September|October|November|December)\\b/;
      const hits = (text.match(datePattern) ?? []).slice(0, 5);
      /* And the weekday has to be the same one in the text and in the calendar. */
      const calendarActive = document.querySelector('.views-calendar-days .is-active')?.textContent ?? null;
      const itemMetas = Array.from(document.querySelectorAll('.item-meta')).map((n) => n.textContent);
      return { hits, calendarActive, itemMetas };
    })()`,
  );
  check(
    "no scene asserts a calendar date anywhere on the page",
    timeConsistency.hits.length === 0,
    timeConsistency.hits.length ? timeConsistency.hits.join(" | ") : "no dates found",
  );
  check(
    "the calendar projection and the item's deadline agree on the weekday",
    timeConsistency.calendarActive === "周五" &&
      timeConsistency.itemMetas.some((meta) => String(meta).includes("周五 · 23:59")),
    `calendar=${timeConsistency.calendarActive} metas=${timeConsistency.itemMetas.slice(0, 3).join(" | ")}`,
  );

  /* ---------- 12. Scene 07 — Offline / Sync (W4 §7) ----------
   *
   * A note on what can be asserted here. This suite runs at 1440×900 against a
   * homepage that is only a few screens long, so the document can run out of scroll
   * before the scene reaches its own end — through no fault of the scene, which is
   * bounded by its own content. Whether the scene *completes* is therefore checked
   * where the page is long enough to allow it: `.review/probe-page-end.mjs` at six
   * reference viewports, plus the injected-space measurements below. What is
   * asserted here is the shape of the reveal and that it is driven by position
   * rather than accumulated. */
  await goTo(client, "/", 1440, 900);
  await evaluate(
    client,
    `(() => {
      const tail = document.createElement('div');
      tail.setAttribute('data-review-tail', '');
      tail.style.height = '200vh';
      tail.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tail);
    })()`,
  );
  const sync = await evaluate(
    client,
    `(async () => {
      const stage = document.querySelector('.sync-stage');
      const top = stage.getBoundingClientRect().top + window.scrollY;
      const samples = [];
      /* 50px steps: each beat eases in over a fraction of the window, so a coarser
         step can straddle a whole transition and see only its endpoints. The range
         runs past the scene's end so the samples include its finished state. */
      for (let delta = -700; delta <= 1200; delta += 50) {
        window.scrollTo({ top: Math.max(0, top + delta), behavior: 'auto' });
        await new Promise((resolve) => setTimeout(resolve, 280));
        samples.push({
          stageTop: Math.round(stage.getBoundingClientRect().top),
          viewportH: window.innerHeight,
          progress: stage.dataset.progress === undefined ? null : Number(stage.dataset.progress),
          phoneItem: (() => {
            const node = document.querySelector('[data-sync-item]');
            const raw = node?.style.getPropertyValue('--in');
            return raw === '' || raw === undefined ? null : Number(raw);
          })(),
          cord: stage.dataset.cord === undefined ? null : Number(stage.dataset.cord),
          state: stage.dataset.syncState,
        });
      }
      return {
        samples,
        panes: document.querySelectorAll('.sync-pane').length,
        laptopItem: document.querySelector('.sync-pane--laptop .item-title')?.textContent ?? null,
        phoneItem: document.querySelector('.sync-pane--phone .item-title')?.textContent ?? null,
        closing: document.querySelector('.scene-sync .scene-closing')?.textContent ?? null,
        stateWords: Array.from(
          new Set(
            Array.from(document.querySelectorAll('.sync-cord-state')).map((n) => n.textContent),
          ),
        ),
      };
    })()`,
  );
  check(
    "two surfaces hold the same item by the end",
    sync.panes === 2 &&
      sync.laptopItem === "周五交第二次作业" &&
      sync.phoneItem === "周五交第二次作业",
    `${sync.panes} panes / ${sync.laptopItem} / ${sync.phoneItem}`,
  );
  const syncOrder = sync.samples.map((sample) => sample.state).join(",");
  check(
    "the sync state reads 离线记录中 → 同步中 → 已同步",
    /offline[,\s\S]*syncing[,\s\S]*synced/.test(syncOrder),
    syncOrder,
  );
  const cordPresent = sync.samples.filter((sample) => (sample.cord ?? 0) > 0.5);
  /* The end of the scene is where its *progress* completes, not a fixed distance
     above it: the scene now carries its own scroll space, so its surfaces sit well
     above its bottom edge. */
  const settledSamples = sync.samples.filter((sample) => (sample.progress ?? 0) >= 0.99);
  const cordGone = settledSamples.filter((sample) => (sample.cord ?? 1) < 0.05);
  check(
    "the connection is drawn, then leaves for good",
    cordPresent.length > 0 &&
      cordGone.length > 0 &&
      /* Gone *and staying* gone: no sample at the scene's endstate may bring it back. */
      settledSamples.every((sample) => (sample.cord ?? 0) < 0.05),
    sync.samples
      .map((sample) => `${sample.stageTop}@${sample.progress?.toFixed(2)}:${sample.cord?.toFixed(2)}`)
      .join("  "),
  );
  const phoneSteps = sync.samples.filter((sample) => (sample.phoneItem ?? 0) > 0.05);
  check(
    "the phone's item arrives gradually, and on screen",
    phoneSteps.length >= 3 &&
      phoneSteps.every((sample) => sample.stageTop <= sync.samples[0].viewportH) &&
      (phoneSteps[phoneSteps.length - 1].phoneItem ?? 0) > 0.98,
    sync.samples.map((sample) => `${sample.stageTop}:${sample.phoneItem?.toFixed(2)}`).join("  "),
  );
  check(
    "sync closing line is present",
    String(sync.closing).includes("连接本身就不重要"),
    String(sync.closing),
  );

  /* The scene has to be *finished* where a reader actually ends up: holding the
     scroll wheel down to the bottom of the document. That is a different question
     from the samples above, which are taken at scroll positions the suite chose —
     and it is the one that failed in real use, twice, while the sampled assertions
     passed. */
  await goTo(client, "/", 1440, 900);
  await evaluate(
    client,
    `(() => {
      const tail = document.createElement('div');
      tail.setAttribute('data-review-tail', '');
      tail.style.height = '200vh';
      tail.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tail);
    })()`,
  );
  const pageEnd = await evaluate(
    client,
    `(async () => {
      /* Wait for the page to be real before walking it: the suite reaches this
         point straight after a navigation, and scrolling a not-yet-rendered
         document silently does nothing, which then reads as a scene failure. */
      for (let attempt = 0; attempt < 40; attempt += 1) {
        if (document.querySelector('.sync-stage')) break;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 400));
      const total = document.documentElement.scrollHeight - window.innerHeight;
      for (let y = 0; y <= total; y += 400) {
        window.scrollTo({ top: y, behavior: 'auto' });
        await new Promise((resolve) => setTimeout(resolve, 130));
      }
      window.scrollTo({ top: 999999, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 900));
      /* Re-read after arriving: one-shot demos above can lengthen the document
         while the walk is in progress, and a stale total then reads as "did not
         reach the bottom" when the page in fact did. */
      const totalNow = document.documentElement.scrollHeight - window.innerHeight;
      const read = (node, prop) => {
        const raw = node?.style.getPropertyValue(prop);
        return raw === '' || raw === undefined ? null : Number(raw);
      };
      const stage = document.querySelector('.sync-stage');
      const item = document.querySelector('[data-sync-item]');
      const closing = document.querySelector('.scene-sync .scene-closing');
      const rect = closing?.getBoundingClientRect();
      return {
        atBottom: Math.abs(window.scrollY - totalNow) < 1.5,
        scrollY: Math.round(window.scrollY),
        total: Math.round(totalNow),
        progress: stage?.dataset.progress ? Number(stage.dataset.progress) : null,
        hasSync: Boolean(stage),
        state: stage?.dataset.syncState ?? null,
        cord: read(document.querySelector('.sync-cord'), '--cord'),
        cordDraw: read(document.querySelector('.sync-cord-line'), '--cord-draw'),
        phoneItem: read(item, '--in'),
        closingVisible: Boolean(rect && rect.top < window.innerHeight && rect.bottom > 0),
      };
    })()`,
  );
  check(
    "the last scene is finished at the bottom of the page, line gone",
    pageEnd.atBottom &&
      (pageEnd.progress ?? 0) >= 0.99 &&
      pageEnd.state === "synced" &&
      (pageEnd.cord ?? 1) < 0.05 &&
      (pageEnd.cordDraw ?? 1) < 0.05 &&
      (pageEnd.phoneItem ?? 0) > 0.98,
    `atBottom=${pageEnd.atBottom} scrollY=${pageEnd.scrollY}/${pageEnd.total} ` +
      `progress=${pageEnd.progress} state=${pageEnd.state} cord=${pageEnd.cord} ` +
      `draw=${pageEnd.cordDraw} phone=${pageEnd.phoneItem}`,
  );

  /* The scene owns its own ending. Appending page below it must not move that
     ending — this is the property that binding progress to the document's end
     silently lost, and it is what will break again when Scene 08 follows. */
  const syncWithPageBelow = await evaluate(
    client,
    `(async () => {
      const tail = document.createElement('div');
      tail.style.height = '250vh';
      tail.setAttribute('aria-hidden', 'true');
      document.body.appendChild(tail);
      await new Promise((resolve) => setTimeout(resolve, 400));
      const read = (node, prop) => {
        const raw = node?.style.getPropertyValue(prop);
        return raw === '' || raw === undefined ? null : Number(raw);
      };
      const stage = document.querySelector('.sync-stage');
      const sample = () => ({
        state: stage?.dataset.syncState ?? null,
        cord: read(document.querySelector('.sync-cord'), '--cord'),
        phone: read(document.querySelector('[data-sync-item]'), '--in'),
        progress: stage?.dataset.progress === undefined ? null : Number(stage.dataset.progress),
      });
      /* Walk from just above the scene to well past it, sampling as we go. */
      const top = stage.getBoundingClientRect().top + window.scrollY;
      const samples = [];
      for (let step = 0; step <= 8; step += 1) {
        window.scrollTo({ top: top - 500 + step * 200, behavior: 'auto' });
        await new Promise((resolve) => setTimeout(resolve, 260));
        samples.push(sample());
      }
      /* Then jump far beyond it, the way a reader skimming the page would. */
      window.scrollTo({ top: 999999, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const afterJump = sample();
      /* And a second time, faster, to prove the value is derived and not accumulated. */
      window.scrollTo({ top: 0, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 300));
      window.scrollTo({ top: 999999, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 400));
      const afterSecondJump = sample();
      tail.remove();
      return { samples, afterJump, afterSecondJump };
    })()`,
  );
  const passedSamples = syncWithPageBelow.samples.filter((sample) => (sample.progress ?? 0) > 0.99);
  check(
    "Scene 07 finishes inside its own boundaries, with page still below it",
    passedSamples.length > 0 &&
      passedSamples.every(
        (sample) => sample.state === "synced" && (sample.cord ?? 1) < 0.05 && (sample.phone ?? 0) > 0.98,
      ),
    syncWithPageBelow.samples
      .map((sample) => `${sample.progress?.toFixed(2)}:${sample.state}/${sample.cord}/${sample.phone}`)
      .join("  "),
  );
  check(
    "Scene 07 stops changing once it has passed",
    syncWithPageBelow.afterJump.state === "synced" &&
      (syncWithPageBelow.afterJump.cord ?? 1) < 0.05 &&
      (syncWithPageBelow.afterJump.phone ?? 0) > 0.98 &&
      syncWithPageBelow.afterSecondJump.state === "synced" &&
      (syncWithPageBelow.afterSecondJump.cord ?? 1) < 0.05,
    `after jump ${syncWithPageBelow.afterJump.state}/${syncWithPageBelow.afterJump.cord}/` +
      `${syncWithPageBelow.afterJump.phone}; after second jump ` +
      `${syncWithPageBelow.afterSecondJump.state}/${syncWithPageBelow.afterSecondJump.cord}`,
  );

  /* Fast scrolling must resolve to a coherent state rather than freeze halfway
     (W2 §18.3): the value is derived from the element's position every frame, not
     accumulated from scroll events.
     
     The property is tested directly — jump, then check that the value equals what
     the position implies. Whether the jump lands past the scene depends on how much
     scroll the document has left, which in this suite's short page it may not; the
     derivation holding either way is the actual claim, and "does the scene finish"
     is answered by `.review/probe-page-end.mjs` at six reference viewports. */
  const fastScroll = await evaluate(
    client,
    `(async () => {
      const stage = document.querySelector('.sync-stage');
      if (!stage) return { ok: false, missing: true };
      const readProgress = () => (stage.dataset.progress ? Number(stage.dataset.progress) : null);
      const LEAD_IN = 200;
      const expectedAt = (scrollY) => {
        const rect = stage.getBoundingClientRect();
        const docTop = rect.top + scrollY;
        const entry = docTop - window.innerHeight - LEAD_IN;
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const exit = Math.min(docTop + rect.height, maxScroll);
        const span = exit - entry;
        return span > 0 ? Math.min(1, Math.max(0, (scrollY - entry) / span)) : 1;
      };

      /* Start from the top, so the jump has the whole page to travel. */
      window.scrollTo({ top: 0, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 400));

      const probe = async (target) => {
        window.scrollTo({ top: target, behavior: 'auto' });
        await new Promise((resolve) => setTimeout(resolve, 300));
        const landed = window.scrollY;
        return { landed, measured: readProgress(), expected: expectedAt(landed) };
      };

      const rect = stage.getBoundingClientRect();
      const docTop = rect.top + window.scrollY;
      /* One step to the middle of the scene, and one straight past it. */
      const mid = await probe(Math.round(docTop - window.innerHeight + LEAD_IN + 60));
      const past = await probe(Math.round(docTop + rect.height + 200));

      const coherent = (sample) =>
        sample.measured !== null &&
        /* A tenth of tolerance: the page's height shifts by a few hundred pixels
           while a one-shot demo elsewhere on it replays, so the position implies a
           slightly different value by the time it is read. What this catches is the
           failure the check exists for — a value that does not follow the position
           at all, i.e. one that froze part-way (W2 §18.3). */
        Math.abs(sample.measured - sample.expected) < 0.1;
      return {
        ok: coherent(mid) && coherent(past),
        mid,
        past,
        state: stage.dataset.syncState ?? null,
      };
    })()`,
  );
  check(
    "a one-step jump resolves to the value its landing position implies",
    fastScroll.ok === true,
    `mid ${fastScroll.mid?.landed}: measured=${fastScroll.mid?.measured} ` +
      `expected=${fastScroll.mid?.expected?.toFixed(3)} · ` +
      `past ${fastScroll.past?.landed}: measured=${fastScroll.past?.measured} ` +
      `expected=${fastScroll.past?.expected?.toFixed(3)}`,
  );

  /* ---------- 13. Scene 08 — A Day With Daymark (W4 §8) ---------- */
  await goTo(client, "/", 1440, 900);
  const day = await evaluate(
    client,
    `(async () => {
      const scene = document.querySelector('#day');
      const top = scene.getBoundingClientRect().top + window.scrollY;
      const samples = [];
      /* Sampled in the scene's own progress space: for each target progress the
         scroll position is solved against the *live* geometry of the scene at
         that moment, so a mid-walk layout shift (the one-shot demos above
         lengthen the page) cannot drift the sampling. The earlier fixed-offset
         walk missed the last entry's arrival window on one run and the first
         entry's on the next — both times because the samples' effective
         progress spacing moved under it. The window definition here mirrors the
         hook's untilPassed form (entry: top edge leadIn below the fold; exit:
         bottom edge at the fold, capped by the last scrollable position). */
      const LEAD_IN = 260;
      const pick = (p) => {
        const rect = scene.getBoundingClientRect();
        const docTop = rect.top + window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const entry = docTop - window.innerHeight - LEAD_IN;
        const exit = Math.min(docTop + rect.height, maxScroll);
        return Math.max(0, Math.min(maxScroll, entry + (exit - entry) * p));
      };
      for (let step = 0; step <= 49; step += 1) {
        const target = pick(step / 50);
        window.scrollTo({ top: target, behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 130));
        const read = (node) => Number(node?.style.getPropertyValue('--in') || 0);
        samples.push({
          y: Math.round(target),
          progress: scene.dataset.progress ? Number(scene.dataset.progress) : null,
          state: scene.dataset.dayState,
          entries: Array.from(document.querySelectorAll('[data-day-entry]')).map(read),
          closing: read(document.querySelector('[data-day-closing]')),
          stageTop: Math.round(scene.getBoundingClientRect().top),
        });
      }
      return {
        samples,
        times: Array.from(document.querySelectorAll('.day-time')).map((n) => n.textContent),
        closingText: document.querySelector('[data-day-closing]')?.textContent ?? null,
        /* W4 §8.6 forbids metrics outright — check the rendered text for them. */
        metrics: (scene.textContent ?? '').match(
          /\\d+\\s*%|完成率|streak|连续\\s*\\d+\\s*天|效率|productivity|score|节省\\s*[\\d.]+\\s*小时|徽章|badge/gi,
        ),
        hasSurfaceOrChart: Boolean(
          scene.querySelector('.product-window, canvas, svg[role="img"], table'),
        ),
      };
    })()`,
  );
  check(
    "the day is a timeline of moments, not a dashboard",
    JSON.stringify(day.times) === JSON.stringify(["08:15", "11:40", "14:20", "18:05"]) &&
      day.metrics === null &&
      day.hasSurfaceOrChart === false,
    `${day.times.join(" ")} · metrics=${day.metrics ? day.metrics.join(",") : "none"} · ` +
      `surfaceOrChart=${day.hasSurfaceOrChart}`,
  );
  const daySettled = day.samples.filter((sample) => sample.state === "settled");
  /* The scene is tall enough that several entries are on screen at once, so the
     property to assert is that no entry is ever skipped: at some sampled frame each
     one is mid-arrival, the closing line stays below landing while anything is still
     arriving ("the day fills in, then the line lands" — DayScene), and once the day
     has closed every one of them is complete.
     The earlier form asserted `state === "filling" implies closing < 0.9`, which
     cannot hold: the scene defines "settled" as *the closing line having arrived*,
     so a sample in the closing's last sliver legitimately reads filling with a
     closing value in [0.9, 1). It used to pass only because the sampler skipped
     that sliver. */
  const entryNumbers = [0, 1, 2, 3].map((index) =>
    day.samples.filter((sample) => {
      const value = sample.entries[index] ?? 0;
      return value > 0.05 && value < 0.95;
    }).length,
  );
  const closingWaits = day.samples
    .filter((sample) => sample.entries.some((value) => value < 0.98))
    .every((sample) => sample.closing < 0.9);
  check(
    "the entries arrive one at a time, then the day closes",
    entryNumbers.every((count) => count > 0) &&
      daySettled.length > 0 &&
      daySettled.every((sample) => sample.entries.every((value) => value > 0.98)) &&
      closingWaits,
    `mid-arrival frames per entry: ${entryNumbers.join("/")} · closing waits for the fill: ${closingWaits} · ` +
      day.samples
        .map(
          (sample) =>
            `${sample.progress?.toFixed(2)}:${sample.entries.map((v) => v.toFixed(1)).join("/")}:${sample.closing.toFixed(2)}`,
        )
        .join("  "),
  );
  check(
    "the day ends on 今天的事情，各归其位。",
    String(day.closingText).includes("各归其位"),
    String(day.closingText),
  );

  /* ---------- 14. Scene 09 — Closing (W4 §9) and the footer (W4 §10) ---------- */
  const ending = await evaluate(
    client,
    `(async () => {
      window.scrollTo({ top: 999999, behavior: 'auto' });
      await new Promise((resolve) => setTimeout(resolve, 700));
      const scene = document.querySelector('#closing');
      const footer = document.querySelector('.site-footer');
      const cta = scene.querySelector('.btn-primary');
      const back = scene.querySelector('.btn-quiet') ?? scene.querySelector('a.btn-quiet');
      return {
        /* A name, a line, an action — and nothing else competing for attention. */
        brand: scene.querySelector('.closing-brand')?.textContent?.trim() ?? null,
        title: scene.querySelector('.closing-title')?.textContent ?? null,
        subcopy: scene.querySelector('.closing-subcopy')?.textContent ?? null,
        cta: cta?.textContent?.trim() ?? null,
        ctaIsExternal: cta?.getAttribute('href') === 'https://app.daymark.top',
        back: back?.textContent?.trim() ?? null,
        backResolves: Boolean(document.querySelector(back?.getAttribute('href') ?? '')),
        /* W4 §9.3: no feature list or product surface in the closing scene. */
        hasFeatureList: Boolean(scene.querySelector('ul, ol, .product-window')),
        footerGroups: footer
          ? Array.from(footer.querySelectorAll('.site-footer-group-title')).map((n) => n.textContent)
          : [],
        footerLegal: footer?.querySelector('.site-footer-legal')?.textContent ?? null,
        footerLinksResolve: footer
          ? Array.from(footer.querySelectorAll('a')).every((a) => {
              const href = a.getAttribute('href') ?? '';
              if (href.startsWith('http') || href.startsWith('mailto:')) return true;
              /* Same-document anchors appear as "#x" or "/#x" depending on whether
                 the link was built from a route prefix; only the fragment matters,
                 and a raw "/#x" is not a valid selector. */
              const hash = href.includes('#') ? '#' + href.split('#')[1] : null;
              return hash ? Boolean(document.querySelector(hash)) : false;
            })
          : false,
      };
    })()`,
  );
  check(
    "the closing scene is a name, a line and an action",
    String(ending.title).includes("交给拾序") &&
      String(ending.subcopy).includes("下一件小事") &&
      ending.ctaIsExternal === true &&
      ending.hasFeatureList === false,
    `title=${ending.title} · subcopy=${ending.subcopy} · cta=${ending.cta} · ` +
      `featureList=${ending.hasFeatureList}`,
  );
  check(
    "the quiet second action goes back up the page, and works",
    String(ending.back).includes("回到前面") && ending.backResolves === true,
    `${ending.back} → resolves=${ending.backResolves}`,
  );
  check(
    "the footer carries identity, navigation, state and legal",
    ending.footerGroups.length === 3 &&
      JSON.stringify(ending.footerGroups) === JSON.stringify(["产品", "关于", "外部"]) &&
      String(ending.footerLegal).includes("Daymark") &&
      ending.footerLinksResolve === true,
    `groups=${ending.footerGroups.join("/")} legal=${ending.footerLegal} ` +
      `linksResolve=${ending.footerLinksResolve}`,
  );

  /* ---------- 15. Scene 04 without pinning: the same three views in flow ---------- */
  await goTo(client, "/", 1440, 900, true);
  const reducedViews = await evaluate(
    client,
    `(() => {
      const section = document.querySelector('#views');
      const steps = document.querySelectorAll('.views-sequence-step').length;
      const panels = document.querySelectorAll('.views-panels').length;
      const markedRows = Array.from(
        document.querySelectorAll('.views-sequence .item-row.is-marked'),
      );
      /* Each projection carries exactly one marked row: the overview also lists
         two other items, but only the page's main item is identified. */
      const perPanel = Array.from(
        document.querySelectorAll('.views-sequence .views-panels'),
      ).flatMap((group) =>
        Array.from(group.querySelectorAll('.views-panel')).map(
          (panel) => panel.querySelectorAll('.item-row.is-marked').length,
        ),
      );
      return {
        pinned: section.dataset.pinned,
        steps,
        panels,
        markedRows: markedRows.length,
        perPanel,
      };
    })()`,
  );
  check(
    "reduced motion shows the three views as a plain sequence",
    reducedViews.pinned === "false" && reducedViews.steps === 3 && reducedViews.panels === 3,
    `pinned=${reducedViews.pinned} steps=${reducedViews.steps} panels=${reducedViews.panels}`,
  );
  /* One marked row per projection, nine in the DOM because all three projections
     exist and only the active one is visible. */
  check(
    "every projection marks the item without motion",
    reducedViews.markedRows === 9 &&
      reducedViews.perPanel.length === 9 &&
      reducedViews.perPanel.every((count) => count === 1),
    `${reducedViews.markedRows} marked rows, per projection ${reducedViews.perPanel.join("/")}`,
  );

  /* ---------- 11. Language switch ---------- */
  await goTo(client, "/", 1440, 900);
  await evaluate(
    client,
    `Array.from(document.querySelectorAll('.site-nav-language button')).find((b) => b.textContent.includes('English')).click()`,
  );
  await delay(1200);
  const english = await evaluate(
    client,
    `(() => ({
      path: location.pathname,
      lang: document.documentElement.lang,
      title: document.title,
      h1: document.querySelector('h1')?.textContent ?? null,
      cta: document.querySelector('.site-nav-cta')?.textContent ?? null,
      stored: localStorage.getItem('daymark-language'),
      canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
      hasChineseBody: /[\\u4e00-\\u9fff]/.test(
        (document.querySelector('.scene-capture')?.textContent ?? '').replace(/拾序|高等数学|数理统计|课程|日程|事项/g, ''),
      ),
    }))()`,
  );
  check("switch lands on /en/", english.path === "/en/" || english.path === "/en", english.path);
  check("html lang follows the route", english.lang === "en", english.lang);
  check("English metadata", english.title.startsWith("Daymark"), english.title);
  check("English headline", /Put the small things/.test(String(english.h1)), String(english.h1));
  check("English CTA label", String(english.cta).includes("Open Daymark"), String(english.cta));
  check("language choice persists", english.stored === "en", String(english.stored));
  check("English canonical", String(english.canonical).includes("/en/"), String(english.canonical));

  /* ---------- 8. 404 surface ---------- */
  await goTo(client, "/definitely-not-a-page", 1440, 900);
  const notFound = await evaluate(
    client,
    `(() => ({
      h1: document.querySelector('.not-found-title')?.textContent ?? null,
      back: document.querySelector('.not-found-action a')?.getAttribute('href') ?? null,
    }))()`,
  );
  check("404 uses the site language", notFound.h1 === "这里暂时没有你要找的东西。", String(notFound.h1));
  check("404 offers a way back", notFound.back === "/", String(notFound.back));

  /* Every projection must be reachable by scrolling the page itself, and each
     must own a real share of the pinned travel. Bands are measured in the
     scene's own progress units rather than in scroll pixels: progress is a
     normalised 0..1 value, so the measurement does not drift with the document
     height (which varies by a few hundred pixels between runs). */
  await goTo(client, "/", 1440, 900);
  const reachability = await evaluate(
    client,
    `(async () => {
      const section = document.querySelector('#views');
      const stage = document.querySelector('.views-stage');
      const sticky = document.querySelector('.views-sticky');
      const pinTarget = parseFloat(getComputedStyle(sticky).top) || 0;
      const seconds = stage.getBoundingClientRect().height + 400;
      const span = { overview: [], courses: [], calendar: [] };
      let progressAtStageTop = null;
      /* The pin's own bookkeeping, asserted below: which projection is current
         when the panel first arrives at its pinned position, and how far the
         progress had reached when it left it. Together they say "the pin comes
         first, the story follows it, and the story is over by the release". */
      let pinView = null;
      let releaseProgress = null;
      let pinCentreDelta = null;
      /* 10px steps: the pinned travel is short (~400px), and the dwell-width
         guard compares band widths — at 20px steps the sampling error alone
         could reach the tolerance. */
      for (let offset = 0; offset <= seconds; offset += 10) {
        /* Anchored to the stage's *live* position at every step, and scrolled
           with 'instant'. The stylesheet gives scrolling a smooth behaviour
           (global.css), which 'auto' defers to — with 'auto' every sample
           chased an animation and the capture demo's mid-walk height change
           skewed the lag differently around each boundary, which polluted the
           measured bands. Re-anchoring also absorbs that height change. */
        const stageDocTop = stage.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.max(0, stageDocTop - 200 + offset), behavior: 'instant' });
        await new Promise((resolve) => setTimeout(resolve, 70));
        /* Read the scene's own published progress. The hook writes sceneRect
           ("top:height:rawProgress") onto the element that owns the ref — the
           stage — from the same measure pass that drives the projections. */
        const raw = stage.dataset.sceneRect;
        const progress = raw ? Number(raw.split(':')[2]) : 0;
        const clamped = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
        span[section.dataset.view]?.push(clamped);
        if (progressAtStageTop === null && stage.getBoundingClientRect().top <= 0) {
          progressAtStageTop = clamped;
        }
        const stickyTop = sticky.getBoundingClientRect().top;
        if (pinView === null && stickyTop <= pinTarget + 2) {
          pinView = section.dataset.view;
          /* Where the object actually parks, against its computed target:
             vertically centred, or the nav floor on short viewports. */
          pinCentreDelta = Math.round(
            stickyTop -
              Math.max(
                (window.innerHeight - sticky.getBoundingClientRect().height) / 2,
                (document.querySelector('.site-nav')?.getBoundingClientRect().height ?? 72) + 16,
              ),
          );
        } else if (pinView !== null && releaseProgress === null && stickyTop < pinTarget - 2) {
          releaseProgress = clamped;
        }
      }
      const band = {};
      for (const [view, values] of Object.entries(span)) {
        band[view] = values.length
          ? { low: +Math.min(...values).toFixed(3), high: +Math.max(...values).toFixed(3) }
          : null;
      }
      return { band, progressAtStageTop, pinView, releaseProgress, pinCentreDelta };
    })()`,
  );
  const bandSummary = Object.entries(reachability.band).map(([view, values]) =>
    values ? `${view} ${values.low}–${values.high} (${(values.high - values.low).toFixed(2)})` : `${view} unreachable`,
  );
  check(
    "all three projections are reachable by an ordinary page scroll",
    Object.values(reachability.band).every(Boolean) &&
      Object.values(reachability.band).every((values) => values.high - values.low >= 0.12),
    `progressAtStageTop=${reachability.progressAtStageTop} | ${bandSummary.join(" | ")}`,
  );
  /* User trial (2026-10-10): the middle projection is given **twice the dwell**
     of each flank — 总览 and 日程 ~a quarter each, 课程 ~half. This replaces
     the earlier equal-thirds guard. */
  check(
    "the middle projection is given twice the dwell of the others",
    (() => {
      const { overview, courses, calendar } = reachability.band;
      if (!overview || !courses || !calendar) return false;
      const flank = (overview.high - overview.low + (calendar.high - calendar.low)) / 2;
      if (flank <= 0) return false;
      const ratio = (courses.high - courses.low) / flank;
      return ratio >= 1.7 && ratio <= 2.3;
    })(),
    bandSummary.join(" | "),
  );
  /* The user's measure for this scene: it carries the story, it must not hold
     the reader. Travel is fixed in pixels — ~100px for each flank, ~200px for
     the middle (user trial) — about one to two wheel clicks per page; this
     guards against a future edit quietly turning the passage back into a
     scroll marathon. */
  const travelPx = await evaluate(
    client,
    `(() => {
      const m = /^px:([0-9.]+)\\+([0-9.]+)$/.exec(document.querySelector('.views-stage')?.dataset.sceneWindow ?? '');
      return m ? Math.round(Number(m[2])) : null;
    })()`,
  );
  check(
    "the pinned travel stays a short passage (each projection ≈ 1–2 wheel clicks)",
    typeof travelPx === "number" && travelPx >= 200 && travelPx <= 420,
    `travel=${travelPx}px`,
  );
  /* "Arrived" now means *vertically centred* (user ruling, 2026-10-10): the
     panel must park at (viewport − panel height)/2, not tucked under the nav. */
  check(
    "the panel parks vertically centred when it arrives",
    typeof reachability.pinCentreDelta === "number" && Math.abs(reachability.pinCentreDelta) <= 2,
    `offset from centre=${reachability.pinCentreDelta}px`,
  );
  /* The two properties the Scene 04 pacing rework exists to guarantee. The pin
     must arrive *before* the story does — a reader who has just watched the
     panel come up is still on the overview — and the story must be over by the
     time the panel releases, so the pinned stretch never ends in a dead tail
     of scrolling after the last projection has settled. */
  check(
    "the pin arrives before the story does (the overview is still current when the panel pins)",
    reachability.pinView === "overview",
    `pinView=${reachability.pinView}`,
  );
  check(
    "the story is finished by the time the panel releases (no dead tail)",
    typeof reachability.releaseProgress === "number" && reachability.releaseProgress >= 0.97,
    `progress at release=${reachability.releaseProgress}`,
  );
  /* The overview must be the state a reader arrives on, not a transition already
     in flight. Asserted structurally — the overview owns progress 0 and the pin
     is engaged while it is current — rather than by comparing a scroll position
     with a progress sample taken in a different pass: this loop drives scroll
     programmatically and the two readings can describe different positions. */
  /* The overview band starting at progress 0 *is* the proof that a reader
     arrives on the first state: the scan above walked the stage top-down and
     recorded which projection was current at each progress value. No second
     assertion is made here — a jump-scrolled probe reads the scene's published
     value one measure behind, which is an artefact of driving scroll from
     script rather than anything a reader would meet. */

  /* ---------- Download page (/download/), 2026-10-12 ---------- */
  const DL_READY = "Boolean(document.querySelector('.download-page'))";
  const UA_ANDROID =
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";
  const UA_WINDOWS =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
  const UA_IPHONE =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
  const setUserAgent = (agent, ua) =>
    agent.send("Emulation.setUserAgentOverride", { userAgent: ua });

  await goTo(client, "/download/", 1440, 900, false, DL_READY);
  /* The version line appears once the update manifest has answered; wait for it
     so the link assertions read the resolved state, not the static fallback. */
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const resolved = await evaluate(
      client,
      `Boolean(document.querySelector('.download-card-version'))`,
    );
    if (resolved) break;
    await delay(300);
  }
  const downloadPage = await evaluate(
    client,
    `(() => ({
      title: document.querySelector('.download-title')?.textContent ?? '',
      cards: document.querySelectorAll('.download-card').length,
      androidHref: document.querySelector('.download-card[data-platform="android"] a')?.href ?? '',
      windowsHref: document.querySelector('.download-card[data-platform="windows"] a')?.href ?? '',
      version: document.querySelector('.download-card-version')?.textContent ?? '',
      webHref: document.querySelector('.download-card[data-platform="web"] a')?.href ?? '',
      totalActions: document.querySelectorAll('.download-card .download-card-action').length,
      recommended: document.querySelectorAll('.download-card.is-recommended').length,
    }))()`,
  );
  check(
    "the download page renders three choices (at most one carries the device mark)",
    downloadPage.title.includes("下载") &&
      downloadPage.cards === 3 &&
      downloadPage.recommended <= 1,
    JSON.stringify(downloadPage),
  );
  check(
    "the Android download points at the permanent mirror alias",
    downloadPage.androidHref === "https://api.daymark.top/update/app-universal-release.apk",
    downloadPage.androidHref,
  );
  check(
    "the Windows download resolves to the latest build from the manifest",
    /^https:\/\/api\.daymark\.top\/update\/daymark_[\w.-]+\.exe$/.test(downloadPage.windowsHref),
    downloadPage.windowsHref,
  );
  check(
    "the version line reflects the manifest",
    /^最新版本 v\d+\.\d+\.\d+$/.test(downloadPage.version),
    downloadPage.version,
  );
  check(
    "all three entries carry an action; the web entry points at the app address",
    downloadPage.totalActions === 3 &&
      downloadPage.webHref.startsWith("https://app.daymark.top/"),
    `actions=${downloadPage.totalActions} webHref=${downloadPage.webHref}`,
  );

  /* Device marks: an Android UA and a Windows UA each light the right card; an
     iPhone gets no mark at all — the hint never fires for a device we cannot
     serve. */
  await setUserAgent(client, UA_ANDROID);
  await goTo(client, "/download/", 390, 844, false, DL_READY);
  const androidMark = await evaluate(
    client,
    `(() => ({
      marked: document.querySelector('.download-card.is-recommended')?.dataset.platform ?? 'none',
      chip: document.querySelector('.download-card.is-recommended .download-recommended')?.textContent ?? '',
    }))()`,
  );
  check(
    "an Android visitor sees the mark on the Android card",
    androidMark.marked === "android" && androidMark.chip.includes("为你的设备推荐"),
    JSON.stringify(androidMark),
  );

  await setUserAgent(client, UA_WINDOWS);
  await goTo(client, "/download/", 1440, 900, false, DL_READY);
  const windowsMark = await evaluate(
    client,
    `document.querySelector('.download-card.is-recommended')?.dataset.platform ?? 'none'`,
  );
  check(
    "a Windows visitor sees the mark on the Windows card",
    windowsMark === "windows",
    `marked=${windowsMark}`,
  );

  await setUserAgent(client, UA_IPHONE);
  await goTo(client, "/download/", 390, 844, false, DL_READY);
  const iphoneMark = await evaluate(
    client,
    `document.querySelectorAll('.download-card.is-recommended').length`,
  );
  check(
    "an iPhone gets no mark — the hint never fires for a device we don't serve",
    iphoneMark === 0,
    `recommended=${iphoneMark}`,
  );

  await setUserAgent(client, "");
  await goTo(client, "/download/", 390, 844, false, DL_READY);
  const downloadOverflow = await evaluate(
    client,
    `document.documentElement.scrollWidth <= window.innerWidth + 1`,
  );
  check(
    "the download page has no horizontal overflow at 390",
    downloadOverflow === true,
    `no overflow=${downloadOverflow}`,
  );

  await goTo(client, "/en/download/", 1440, 900, false, DL_READY);
  const downloadEn = await evaluate(
    client,
    `(() => ({
      title: document.querySelector('.download-title')?.textContent ?? '',
      htmlLang: document.documentElement.lang,
    }))()`,
  );
  check(
    "the English download page renders its own language",
    downloadEn.title.includes("Download") && downloadEn.htmlLang === "en",
    JSON.stringify(downloadEn),
  );

  await goTo(client, "/download/", 1440, 900, true, DL_READY);
  const downloadReduced = await evaluate(
    client,
    `(() => {
      const head = document.querySelector('.download-head');
      return {
        opacity: head ? Number(getComputedStyle(head).opacity) : 0,
        cards: document.querySelectorAll('.download-card').length,
      };
    })()`,
  );
  check(
    "the download page is fully readable under reduced motion",
    downloadReduced.cards === 3 && downloadReduced.opacity >= 0.99,
    JSON.stringify(downloadReduced),
  );

  client.close();
} finally {
  chrome.kill();
}

const failed = results.filter((entry) => !entry.passed);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) process.exitCode = 1;
