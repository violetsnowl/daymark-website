/**
 * Local review tool: renders the running site in headless Chrome and writes
 * screenshots at the reference viewports (W3 §25.3).
 *
 * Scroll targets are resolved by *state*, not by hard-coded pixel offsets: for
 * scenes whose appearance depends on a scroll window, the runner searches for
 * the scroll position that produces the requested state and only then captures.
 * That keeps the screenshots meaningful as the layout changes.
 *
 * Usage: node .review/shots.mjs [baseUrl]
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { setTimeout as delay } from "node:timers/promises";

const CHROME =
  process.env.CHROME_PATH ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] ?? "http://127.0.0.1:5173/";
const PORT = 9335;
const OUT_DIR = import.meta.dirname;
const PROFILE = `${OUT_DIR}/chrome-profile-shots`;
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

/**
 * The states Stage D shots are named after. Each predicate is matched against the
 * shared page state while walking from the top, and the first position that
 * satisfies it becomes that shot's anchor.
 */
const STAGE_D = {
  reminderTime: (state) => state.reminderState === "time",
  reminderSettled: (state) => state.reminderState === "settled",
  aiAsking: (state) => state.aiPhase === "ASKING",
  syncSyncing: (state) => state.syncState === "syncing",
  /* The end of the scene, where the connection has left and both surfaces agree. */
  syncCordGone: (state) => state.syncState === "synced" && (state.syncCord ?? 1) < 0.05,
  /* Nothing has gathered yet, and the scene is on screen. */
  contextBare: (state) =>
    (state.contextRevealed ?? 1) < 0.02 &&
    state.contextStageTop !== null &&
    state.contextStageTop < 900,
  /* The day's timeline is filling, but its closing line has not landed yet. */
  dayFilling: (state) => state.dayState === "filling",
  /* Everything arrived, closing line included. */
  daySettled: (state) => state.dayState === "settled",
};

/**
 * Absolute scroll anchors, measured with `.review/probe.mjs` at each viewport.
 * Every entry declares the state it is supposed to produce; the runner warns
 * loudly when the measured state disagrees, so a stale anchor can never be
 * mistaken for a correct screenshot.
 */
const SHOTS = [
  { name: "cn-1440-hero", width: 1440, height: 900, anchor: ".hero", expect: { view: "overview" } },
  { name: "cn-1440-small-things", width: 1440, height: 900, anchor: "#ideas" },
  {
    name: "cn-1440-capture",
    width: 1440,
    height: 900,
    anchor: "#capture",
    settle: 3400,
    expect: { phase: "STRUCTURED" },
  },
  /* Context reveals across a one-viewport window, and the views bands are
     anchored to the scene that owns them. Both are therefore aimed with
     `anchor + extra` px rather than absolute page offsets: a few hundred pixels
     of document-height drift between runs would otherwise move the shot into a
     neighbouring state. The `expect` block turns that into a visible warning. */
  {
    /* The "before" frame: the scene is on screen but nothing has gathered yet,
       which is the half of W4 §3.4 that a settled screenshot cannot show. Found by
       state rather than aimed with a pixel offset — the reveal is anchored to the
       stage and its window has been re-fitted more than once, so an offset that is
       right today is inside the reveal tomorrow. */
    name: "cn-1440-context-before",
    width: 1440,
    height: 900,
    findStageD: STAGE_D.contextBare,
    expect: { context: 0 },
  },
  {
    /* The settled frame is found by state rather than by an offset: the reveal is
       anchored to the stage, and the page height shifts while the capture demo
       replays, so a fixed pixel aim drifts between runs. */
    name: "cn-1440-context-settled",
    width: 1440,
    height: 900,
    aimContext: { viewportOffset: 0 },
    expect: { context: 1 },
  },
  {
    name: "cn-1440-views-overview",
    width: 1440,
    height: 900,
    aimViews: { viewportOffset: 360 },
    expect: { view: "overview", pinned: "true" },
  },
  {
    name: "cn-1440-views-course",
    width: 1440,
    height: 900,
    findView: { view: "courses", refine: 0.5 },
    expect: { view: "courses", pinned: "true" },
  },
  {
    name: "cn-1440-views-calendar",
    width: 1440,
    height: 900,
    findView: { view: "calendar", refine: 0.5 },
    expect: { view: "calendar", pinned: "true" },
  },
  { name: "cn-1280-hero", width: 1280, height: 800, anchor: ".hero" },
  {
    name: "cn-1280-views-course",
    width: 1280,
    height: 800,
    findView: { view: "courses", refine: 0.5 },
    expect: { view: "courses", pinned: "true" },
  },
  { name: "cn-768-hero", width: 768, height: 1024, anchor: ".hero", mobile: true },
  {
    name: "cn-768-capture",
    width: 768,
    height: 1024,
    anchor: "#capture",
    mobile: true,
    settle: 3400,
    expect: { phase: "STRUCTURED" },
  },
  {
    name: "cn-768-context",
    width: 768,
    height: 1024,
    mobile: true,
    aimContext: { viewportOffset: 0 },
    expect: { context: 1 },
  },
  { name: "cn-768-views", width: 768, height: 1024, anchor: "#views", mobile: true },
  /* --- Stage D: Reminder / AI / Offline-Sync ---
     Reminder and Sync are aimed by stage, like Context: their states are depths
     inside a short window, and the stage's own position is the stable anchor. */
  {
    name: "cn-1440-reminder-time",
    width: 1440,
    height: 900,
    findStageD: STAGE_D.reminderTime,
  },
  {
    name: "cn-1440-reminder-settled",
    width: 1440,
    height: 900,
    findStageD: STAGE_D.reminderSettled,
  },
  {
    name: "cn-1440-ai-asked",
    width: 1440,
    height: 900,
    /* Framed from the section rather than from a state search. The AI scene is
       deliberately airy (W4 §6.3), so the frame starts part-way down it — but the
       section's top must stay on screen, because the question only appears once
       the stage has been observed, and an over-eager offset means it never is. */
    anchor: ".scene-ai",
    extra: 260,
    settle: 1600,
    expect: { aiPhase: "ASKING" },
  },
  {
    name: "cn-1440-ai-resolved",
    width: 1440,
    height: 900,
    anchor: ".scene-ai",
    extra: 260,
    settle: 1600,
    interaction: "resolve-ai",
    expect: { aiPhase: "RESOLVED" },
  },
  {
    name: "cn-1440-sync-syncing",
    width: 1440,
    height: 900,
    findStageD: STAGE_D.syncSyncing,
  },
  {
    name: "cn-1440-sync-synced",
    width: 1440,
    height: 900,
    /* Aimed at the bottom of the document, which is where a reader ends up: the
       scene has to be finished by then, with the connection gone and both surfaces
       agreeing. The scene defines its own ending — its bottom edge reaching the fold
       — so this frame is past that point rather than exactly on it. */
    scroll: 999999,
    expect: { syncState: "synced" },
  },
  {
    name: "cn-768-reminder",
    width: 768,
    height: 1024,
    findStageD: STAGE_D.reminderSettled,
    mobile: true,
  },
  { name: "cn-768-sync", width: 768, height: 1024, anchor: ".sync-stage", frac: 0.6, mobile: true },
  /* --- Stage E: A Day / Closing / Footer --- */
  {
    name: "cn-1440-day-filling",
    width: 1440,
    height: 900,
    anchor: "#day",
    extra: 200,
    expect: { dayState: "filling" },
  },
  {
    name: "cn-1440-day-settled",
    width: 1440,
    height: 900,
    /* Found by state rather than aimed at an offset. The scene's window ends while
       its top edge is still above the fold, and the published state updates a frame
       after a scripted jump — so locating the settled frame is more reliable than
       calculating where it should be. */
    findStageD: STAGE_D.daySettled,
  },
  { name: "cn-1440-closing", width: 1440, height: 900, anchor: "#closing", extra: 0 },
  { name: "cn-1440-footer", width: 1440, height: 900, scroll: 999999 },
  { name: "cn-768-day", width: 768, height: 1024, findStageD: STAGE_D.daySettled, mobile: true },
  { name: "cn-768-closing", width: 768, height: 1024, anchor: "#closing", extra: 0, mobile: true },
  { name: "cn-390-day", width: 390, height: 844, findStageD: STAGE_D.daySettled, mobile: true },
  { name: "cn-390-closing", width: 390, height: 844, anchor: "#closing", extra: 0, mobile: true },
  { name: "cn-390-hero", width: 390, height: 844, anchor: ".hero", mobile: true },
  { name: "cn-390-small-things", width: 390, height: 844, anchor: "#ideas", mobile: true },
  {
    name: "cn-390-capture",
    width: 390,
    height: 844,
    anchor: "#capture",
    mobile: true,
    settle: 3400,
    expect: { phase: "STRUCTURED" },
  },
  {
    name: "cn-390-context",
    width: 390,
    height: 844,
    mobile: true,
    aimContext: { viewportOffset: 0 },
    expect: { context: 1 },
  },
  { name: "cn-390-views", width: 390, height: 844, anchor: "#views", mobile: true },
  {
    name: "cn-390-reminder",
    width: 390,
    height: 844,
    findStageD: STAGE_D.reminderSettled,
    mobile: true,
  },
  {
    name: "cn-390-ai",
    width: 390,
    height: 844,
    anchor: ".ai-stage",
    frac: 1.5,
    mobile: true,
    settle: 1600,
    expect: { aiPhase: "ASKING" },
  },
  { name: "cn-390-sync", width: 390, height: 844, anchor: ".sync-stage", frac: 0.9, mobile: true },
  { name: "en-1440-hero", width: 1440, height: 900, anchor: ".hero", path: "/en/" },
  { name: "en-390-hero", width: 390, height: 844, anchor: ".hero", mobile: true, path: "/en/" },
];

const STATE_EXPRESSION = `(() => {
  const views = document.querySelector('#views');
  const stage = document.querySelector('.context-stage');
  const capture = document.querySelector('.scene-capture');
  const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
  return {
    scrollY: Math.round(window.scrollY),
    range: document.documentElement.scrollHeight - window.innerHeight,
    view: views ? views.dataset.view : null,
    pinned: views ? views.dataset.pinned : null,
    contextProgress: stage ? Number(stage.dataset.progress ?? 0) : null,
    contextRevealed: chips.length
      ? Math.min(...chips.map((chip) => Number(chip.style.getPropertyValue('--in') || 0)))
      : null,
    phase: capture ? capture.dataset.phase : null,
    /* Stage D scenes publish their own state on the stage element. */
    reminderState: document.querySelector('.reminder-stage')?.dataset.reminderState ?? null,
    aiPhase: document.querySelector('.scene-ai')?.dataset.phase ?? null,
    syncState: document.querySelector('.sync-stage')?.dataset.syncState ?? null,
    dayState: document.querySelector('.scene-day')?.dataset.dayState ?? null,
    syncCord: (() => {
      const stage = document.querySelector('.sync-stage');
      const raw = stage?.dataset.cord;
      return raw === undefined ? null : Number(raw);
    })(),
    syncProgress: (() => {
      const stage = document.querySelector('.sync-stage');
      const raw = stage?.dataset.progress;
      return raw === undefined ? null : Number(raw);
    })(),
    viewportH: window.innerHeight,
    maxScroll: document.documentElement.scrollHeight - window.innerHeight,
    contextStageTop: (() => {
      const stage = document.querySelector('.context-stage');
      return stage ? Math.round(stage.getBoundingClientRect().top) : null;
    })(),
    /* Where the views panel is right now. The projection state is "overview"
       long before the scene arrives, so a state search has to require the panel
       to be pinned before it accepts a match. */
    stickyTop: (() => {
      const sticky = document.querySelector('.views-sticky');
      return sticky ? Math.round(sticky.getBoundingClientRect().top) : null;
    })(),
  };
})()`;

const matchesExpectation = (state, expect) => {
  if (!expect) return true;
  if (expect.view && state.view !== expect.view) return false;
  if (expect.pinned && state.pinned !== expect.pinned) return false;
  if (expect.phase && state.phase !== expect.phase) return false;
  if (expect.reminderState && state.reminderState !== expect.reminderState) return false;
  if (expect.aiPhase && state.aiPhase !== expect.aiPhase) return false;
  if (expect.syncState && state.syncState !== expect.syncState) return false;
  if (expect.dayState && state.dayState !== expect.dayState) return false;
  if (expect.context === 0 && (state.contextRevealed ?? 0) > 0.1) return false;
  if (expect.context === 1 && (state.contextRevealed ?? 0) < 0.98) return false;
  return true;
};

try {
  await waitForDevTools();
  const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const page = targets.find((target) => target.type === "page");
  const client = await connect(page.webSocketDebuggerUrl);

  const evaluate = async (expression) => {
    const result = await client.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
    });
    return result.result.value;
  };

  const scrollTo = async (top) => {
    await evaluate(
      `(() => { window.scrollTo({ top: ${Math.max(0, Math.round(top))}, behavior: 'auto' }); return window.scrollY; })()`,
    );
    /* Scroll-linked scenes re-measure on the next animation frame and write
       their state from a React effect, so a read straight after the jump would
       still describe the previous position. */
    await delay(340);
  };

  /**
   * Puts the views stage's top edge at a given viewport-relative position — used
   * for the first projection, whose band sits right where the panel is arriving
   * and is therefore narrower than any sensible scan step.
   *
   * By design the overview is current as the panel scrolls up into place, so
   * aiming the stage at the middle of the screen lands inside that band.
   */
  const aimViewsStage = async ({ viewportOffset = 360 }) => {
    const info = await evaluate(
      `(() => {
        const stage = document.querySelector('.views-stage');
        const rect = stage.getBoundingClientRect();
        return { top: Math.round(rect.top + window.scrollY) };
      })()`,
    );
    await scrollTo(info.top - viewportOffset);
  };

  /**
   * Waits until the document stops changing height and the scroll position holds
   * still.
   *
   * Every page load replays the Quick Capture demo, which types a sentence into
   * the field and fills three rows — that changes the height of everything below
   * it while a shot is being framed. Without this gate a shot's target is
   * computed against one layout and captured against another, which is how
   * Stage D's early shots kept landing in the wrong state.
   */
  const waitForStableLayout = async ({ timeoutMs = 6000, quietMs = 400 } = {}) => {
    const read = async () =>
      evaluate(
        `JSON.stringify({
          height: document.documentElement.scrollHeight,
          y: Math.round(window.scrollY),
        })`,
      );
    let previous = await read();
    let quietSince = Date.now();
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await delay(120);
      const current = await read();
      if (current !== previous) {
        previous = current;
        quietSince = Date.now();
        continue;
      }
      if (Date.now() - quietSince >= quietMs) return true;
    }
    return false;
  };

  /** The anchor's current place on screen, plus the layout it sits in. */
  const readAnchor = async (anchor) => {
    const raw = await evaluate(
      `(() => {
        const node = document.querySelector(${JSON.stringify(anchor)});
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return JSON.stringify({
          top: rect.top,
          height: rect.height,
          y: window.scrollY,
          docHeight: document.documentElement.scrollHeight,
        });
      })()`,
    );
    return raw === null || raw === undefined ? null : JSON.parse(raw);
  };

  /**
   * Puts the anchor's top edge at a requested place on screen, and keeps
   * correcting until it is actually there.
   *
   * An open-loop `scrollTo` cannot do this job on this page: the Quick Capture
   * demo grows the document by ~300px while a shot is being framed, and the
   * browser keeps scroll position stable by pushing content down, so an offset
   * that was exact when it was computed is 300px wrong a second later. The aim is
   * therefore expressed as "where the anchor should sit in the viewport" and the
   * loop drives towards that, re-reading the layout every pass.
   */
  const aim = async (shot) => {
    const frac = shot.frac ?? null;
    const extra = shot.extra ?? 0;
    for (let pass = 0; pass < 6; pass += 1) {
      const before = await readAnchor(shot.anchor);
      if (before === null) return null;
      const wanted = frac === null ? extra : frac * before.height;
      const target = before.y + (before.top - wanted);
      if (process.env.SHOT_DEBUG) {
        console.log(
          `    ${shot.name} pass ${pass}: y=${Math.round(before.y)} top=${Math.round(before.top)} wanted=${Math.round(wanted)} target=${Math.round(target)}`,
        );
      }
      if (Math.abs(before.top - wanted) <= 2 && pass > 0) {
        if (process.env.SHOT_DEBUG) {
          /* Sample the frame that is about to be captured, so any drift between
             aiming and capturing is attributed instead of inferred. */
          for (let sample = 0; sample < 8; sample += 1) {
            await delay(180);
            const now = await readAnchor(shot.anchor);
            console.log(
              `      settle ${sample}: y=${Math.round(now.y)} top=${Math.round(now.top)} doc=${now.docHeight}`,
            );
          }
        }
        return { ok: true, passes: pass, top: before.top };
      }
      /* Scrolling by the difference between where the anchor is and where it
         should be is exact regardless of what the page did in between. */
      await scrollTo(target);
      await waitForStableLayout({ timeoutMs: 2500, quietMs: 300 });
    }
    const after = await readAnchor(shot.anchor);
    return { ok: false, top: after?.top ?? null, passes: 6 };
  };

  /**
   * Walks the page from the top recording, for every step, the state the Stage D
   * scenes are in and where they sit on screen. The first position at which a
   * desired state appears becomes a shot's anchor.
   *
   * Searching by state rather than predicting a `frac` is the same decision made
   * for Scene 04's projections: the scenes' states are depths inside a window
   * whose absolute position moves whenever anything above them changes height,
   * and the Quick Capture demo does exactly that on every page load.
   */
  const findStageDState = async (want) => {
    const range = (await evaluate(STATE_EXPRESSION)).range;
    const steps = Math.ceil(range / 150);
    for (let step = 0; step <= steps; step += 1) {
      await scrollTo((range * step) / steps);
      const now = await evaluate(STATE_EXPRESSION);
      if (want(now)) return now.scrollY;
    }
    return null;
  };

  /**
   * Scans the document top-down for the requested projection and returns a
   * position inside it. Two conditions, not one: the scene has to be reporting
   * that projection *and* the panel has to be pinned at the top of the viewport.
   * Without the second the search matches immediately — `data-view` reads
   * "overview" from the moment the page loads — and the shot lands inside the
   * previous scene instead.
   */
  const findState = async (find) => {
    const range = (await evaluate(STATE_EXPRESSION)).range;
    const steps = 90;
    const matches = [];
    for (let step = 0; step <= steps; step += 1) {
      await scrollTo((range * step) / steps);
      const now = await evaluate(STATE_EXPRESSION);
      const pinned =
        now.pinned === "true" &&
        now.stickyTop !== null &&
        now.stickyTop <= 140 &&
        now.stickyTop > -40;
      if (now.view === find.view && pinned) matches.push(now.scrollY);
    }
    if (!matches.length) return null;
    const first = matches[0];
    const last = matches[matches.length - 1];
    return first + (last - first) * (find.refine ?? 0.5);
  };

  /**
   * Puts the context stage's top edge at a given viewport-relative position.
   *
   * This is deliberately not a state search. The reveal runs across ~1250px of
   * travel and the scene publishes its value one measure behind a scripted
   * scroll, so searching for "all arrived" and stepping back produces a frame
   * where they are no longer arrived. Aiming the stage is predictable instead:
   * near the top of the screen the last piece has settled, and the composition
   * is the one a reader actually sees.
   */
  const aimContextStage = async ({ viewportOffset = 60 }) => {
    const info = await evaluate(
      `(() => {
        const stage = document.querySelector('.context-stage');
        const rect = stage.getBoundingClientRect();
        return { top: Math.round(rect.top + window.scrollY) };
      })()`,
    );
    const target = info.top - viewportOffset;
    await scrollTo(target);

    /* The context scene writes its reveal from a React effect that runs a frame
       or two after the scroll. This loop drives scroll from script rather than
       from a reader, so it waits for those frames before the state is read —
       otherwise the measured value describes wherever the scene was before. */
    await evaluate(
      `new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300))))`,
    );
    const revealed = await evaluate(
      `(() => {
        const chips = Array.from(document.querySelectorAll('#context [data-chip]'));
        return chips.length
          ? Math.min(...chips.map((chip) => Number(chip.style.getPropertyValue('--in') || 0)))
          : null;
      })()`,
    );
    return { target, revealed };
  };

  for (const shot of SHOTS) {
    await client.send("Emulation.setDeviceMetricsOverride", {
      width: shot.width,
      height: shot.height,
      deviceScaleFactor: 1,
      mobile: Boolean(shot.mobile),
    });
    await client.send("Network.setCacheDisabled", { cacheDisabled: true });
    await client.send("Page.navigate", { url: new URL(shot.path ?? "/", BASE).href });
    await delay(700);
    await client.send("Page.reload", { ignoreCache: true });
    await delay(1600);
    /* A pump below everything, which does not touch the site.
     *
     * The Quick Capture demo replaces its result area as it plays, so the document
     * changes height on every page load. A shot's anchor is resolved before the demo
     * finishes and captured after, so the frame drifts — measured at 303px, enough to
     * land a Stage D shot in the wrong state. The pump holds the document at a fixed
     * height by absorbing exactly that variation. It waits for the page height to
     * hold still for 700ms first, so the demo's own ending is never cancelled, and it
     * stops adjusting once the capture has been taken.
     *
     * There used to be a spacer here as well, because this harness once stepped
     * through a partially built homepage whose last scene sat at the bottom of the
     * document. The page is complete now, so it has been removed: it only pushed the
     * real ending out of the scrollable range and photographed blank canvas. */
    await evaluate(
      `(() => {
        const pump = document.createElement('div');
        pump.setAttribute('data-review-pump', '');
        pump.setAttribute('aria-hidden', 'true');
        pump.style.height = '0px';
        document.body.appendChild(pump);

        window.__reviewHold = false;
        const fixed = document.documentElement.scrollHeight;
        let lastChange = Date.now();
        let lastHeight = fixed;

        const tick = () => {
          const height = document.documentElement.scrollHeight;
          if (height !== lastHeight) {
            lastHeight = height;
            lastChange = Date.now();
          }
          if (!window.__reviewHold) {
            /* Settle first: adjusting during the demo's own layout changes would
               make the scene finish early and misreport its own end state. */
            if (Date.now() - lastChange > 700 && height !== fixed) {
              pump.style.height = String(
                Math.max(0, parseFloat(pump.style.height || '0') + (fixed - height)),
              ) + 'px';
            }
            requestAnimationFrame(tick);
          }
        };
        requestAnimationFrame(tick);
      })()`,
    );
    /* Let the Quick Capture demo finish typing before anything is measured. */
    await waitForStableLayout();

    if (shot.aimViews) {
      await aimViewsStage(shot.aimViews);
    } else if (shot.findView) {
      const target = await findState(shot.findView);
      if (target === null) {
        console.log(`SKIPPED ${shot.name} — state ${shot.findView.view} never appeared`);
        continue;
      }
      await scrollTo(target);
    } else if (shot.aimContext) {
      const aimed = await aimContextStage(shot.aimContext);
      /* Extra settle: the capture demo above is still finishing its one-shot
         sequence, and its height change can shift what is on screen. */
      await delay(1600);
      if (aimed && aimed.revealed !== null && aimed.revealed < 0.98) {
        console.log(`NOTE ${shot.name} — stage aimed but reveal read ${aimed.revealed}`);
      }
    } else if (shot.findStageD) {
      const found = await findStageDState(shot.findStageD);
      if (found === null) {
        console.log(`SKIPPED ${shot.name} — state ${shot.expect ? JSON.stringify(shot.expect) : ""} never appeared`);
        continue;
      }
      await scrollTo(found);
      await waitForStableLayout();
    } else if (shot.scroll !== undefined) {
      await scrollTo(shot.scroll);
    } else {
      const aimed = await aim(shot);
      if (aimed === null) {
        console.log(`SKIPPED ${shot.name} — anchor ${shot.anchor} missing`);
        continue;
      }
      if (!aimed.ok) {
        console.log(
          `NOTE ${shot.name} — aim did not converge (anchor at ${aimed.top}, wanted ${shot.frac ?? shot.extra})`,
        );
      } else if (process.env.SHOT_DEBUG) {
        console.log(`  aim ${shot.name}: converged in ${aimed.passes} passes, anchor at ${aimed.top}`);
      }
    }

    /* Let scroll-linked values and the one-shot capture demo finish (W3 §14). */
    await delay(shot.settle ?? 900);

    /* Scripted interactions for shots that need the visitor's own click. */
    if (shot.interaction === "resolve-ai") {
      await evaluate(`document.querySelectorAll('.ai-answer')[0]?.click()`);
      await delay(600);
    }

    const state = await evaluate(STATE_EXPRESSION);
    if (!matchesExpectation(state, shot.expect)) {
      console.log(
        `WARNING ${shot.name} — expected ${JSON.stringify(shot.expect)} but measured view=${state.view} pinned=${state.pinned} context=${state.contextRevealed} phase=${state.phase} reminder=${state.reminderState} ai=${state.aiPhase} sync=${state.syncState} day=${state.dayState}. Re-measure with .review/probe.mjs.`,
      );
    }

    const { data } = await client.send("Page.captureScreenshot", { format: "png" });
    /* Freeze the pump before the next shot navigates away. */
    await evaluate(`window.__reviewHold = true`);
    writeFileSync(`${OUT_DIR}/${shot.name}.png`, Buffer.from(data, "base64"));
    if (process.env.SHOT_DEBUG) {
      const raw = await evaluate(
        `JSON.stringify({ y: Math.round(window.scrollY), vh: window.innerHeight, max: document.documentElement.scrollHeight - window.innerHeight, p: document.querySelector('.sync-stage')?.dataset.progress ?? null, key: document.querySelector('.context-stage')?.dataset.sceneRect ?? null })`,
      );
      console.log(`    state ${shot.name}: ${raw}`);
    }
    /* Report the anchor's actual place on screen and how much page is left below
       the current scroll: when a requested aim cannot be reached, this is what
       says so instead of leaving it to be inferred from a state that never
       changes. */
    const geometry = shot.anchor
      ? await evaluate(
          `(() => {
            const node = document.querySelector(${JSON.stringify(shot.anchor)});
            const result = {
              anchorTop: node ? Math.round(node.getBoundingClientRect().top) : null,
              anchorHeight: node ? Math.round(node.getBoundingClientRect().height) : null,
              pageHeight: document.documentElement.scrollHeight,
              maxScroll: document.documentElement.scrollHeight - window.innerHeight,
              atBottom: Math.abs(
                window.scrollY - (document.documentElement.scrollHeight - window.innerHeight),
              ) < 1,
            };
            return JSON.stringify(result);
          })()`,
        )
      : "{}";
    console.log(
      `captured ${shot.name} @y=${state.scrollY} context=${state.contextRevealed ?? "-"} phase=${state.phase ?? "-"} reminder=${state.reminderState ?? "-"} ai=${state.aiPhase ?? "-"} sync=${state.syncState ?? "-"} ${geometry}`,
    );
  }

  client.close();
} finally {
  chrome.kill();
}
