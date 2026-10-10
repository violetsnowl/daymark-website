import { useEffect, useRef } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase } from "../../content/demo.ts";
import { useReducedMotion, useSceneProgress } from "../../motion/index.ts";
import { ItemRow } from "../product/ProductWindow.tsx";
import { SceneHeader } from "./SceneHeader.tsx";

/**
 * Scene 07 — Offline / Sync (W4 §7).
 *
 * The subject is **continuity**, not the cloud (W4 §7.2). Two surfaces hold the
 * same item; while offline only one of them has it, and once they agree the
 * connection between them stops being worth drawing.
 *
 * It is the one scene whose final frame removes something: the hairline path
 * between the two devices fades out at the end, because "同步完成以后，连接本身
 * 就不重要了". No glowing beam, no arrows travelling along a wire, no network
 * icon — the sync is told through the phone's own item arriving (opacity
 * 0 → 0.4 → 1, W4 §7.3) and a state line that changes its wording.
 *
 * Every state is local and deterministic; nothing is sent anywhere.
 */

/**
 * Scroll mapping from W4 §7.4, expressed as the progress at which each stage
 * completes:
 *
 *   0.00 laptop item appears      0.45 subtle sync state
 *   0.25 phone still unchanged    0.65 phone item enters
 *                                 0.85 both surfaces equalize
 *                                 1.00 connection disappears
 */
const PHONE_ENTER = 0.65;
const PHONE_SETTLED = 0.85;
/** The line is present only while the two sides disagree (W4 §7.3, §7.4). */
const CORD_FROM = 0.45;
const CORD_FULL = 0.55;
const CORD_FADE_FROM = 0.8;
const CORD_GONE = 0.9;

function track(progress: number, from: number, to: number): number {
  if (to <= from) return progress >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - from) / (to - from)));
}

export function SyncScene() {
  const copy = useCopy();
  const { mainItem } = showcase[copy.locale];
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* The window belongs to the scene alone. It is measured on the element that
   * contains the surfaces, the closing line **and** a trailing spacer, so the span
   * is "everything this scene has to say", and it reaches 1 exactly as that element
   * finishes passing. Nothing below the scene can move its ending.
   *
   * Three earlier attempts bounded it against the *document*, each failing the same
   * way: the section did not break, it simply came to rest before its own ending,
   * reading 同步中 with the connection still drawn. The last used `scrollRange` —
   * progress from entry to the end of the document — which is only correct while
   * the scene happens to be last on the page, and which Scene 08 would have broken.
   *
   * `leadIn: 200` starts the reveal just before the scene comes into view. Combined
   * with the section's trailing scroll space it gives roughly 500–900px of travel
   * depending on viewport, which is what the four beats need. Measured across the
   * six reference viewports with `.review/probe-page-end.mjs`, and the beats in
   * `checks.mjs`. */
  const { progress } = useSceneProgress(stageRef, {
    untilPassed: true,
    leadIn: 200,
    disabled: reducedMotion,
  });

  /* The phone's item arrives in two steps — 0 → 0.4 → 1 — so the eye can follow
     it, and the hairline exists only while the two sides disagree: it draws in as
     the sync starts and is gone before the scene ends, which is the whole point
     of W4 §7.4's final state. */
  const phoneArrival = track(progress, CORD_FROM, PHONE_ENTER);
  const phoneSettled = track(progress, PHONE_ENTER, PHONE_SETTLED);
  const cord = Math.min(
    track(progress, CORD_FROM, CORD_FULL),
    1 - track(progress, CORD_FADE_FROM, CORD_GONE),
  );

  useEffect(() => {
    /* State is published on the stage element, while the *window* is measured on
       the section (which carries the trailing scroll space). The harness reads
       both, so they are named for what they are. */
    const section = sectionRef.current;
    const stage = section?.querySelector<HTMLElement>("[data-sync-stage]");
    if (!section || !stage) return;
    stage.dataset.progress = progress.toFixed(3);

    const phoneItem = stage.querySelector<HTMLElement>("[data-sync-item]");
    const empty = stage.querySelector<HTMLElement>("[data-sync-empty]");
    const laptopItem = stage.querySelector<HTMLElement>("[data-sync-laptop]");
    const line = stage.querySelector<HTMLElement>("[data-sync-cord]");
    const cordNode = stage.querySelector<HTMLElement>("[data-sync-cord-line]");
    /* The window's own value lives on the section, so a reviewer can see what the
       scene measured as well as what it rendered. */
    section.dataset.progress = progress.toFixed(3);

    /* Opacity reaches 0.4 on the way to 1 — two visible stages, not a fade. */
    const itemOpacity = reducedMotion
      ? 1
      : Math.min(1, phoneArrival * 0.4 + phoneSettled * 0.6);
    if (phoneItem) {
      phoneItem.style.setProperty("--in", itemOpacity.toFixed(3));
      phoneItem.style.setProperty("--out", `${((1 - itemOpacity) * 8).toFixed(2)}px`);
    }
    /* "还没有同步到这里" is no longer true once the item starts arriving, so it
       goes as the item comes — the two must never be legible together. */
    if (empty) empty.style.setProperty("--in", (1 - phoneArrival).toFixed(3));
    /* The laptop's line settles rather than changes state: it was already right. */
    if (laptopItem) {
      laptopItem.style.setProperty("--settle", (phoneSettled * 0.45).toFixed(3));
    }
    if (line) line.style.setProperty("--cord", (reducedMotion ? 0 : cord).toFixed(3));
    if (cordNode) cordNode.style.setProperty("--cord-draw", (reducedMotion ? 1 : cord).toFixed(3));
    /* Published rather than left in the custom property alone, so the harness can
       assert that the connection actually leaves (W4 §7.4). */
    stage.dataset.cord = (reducedMotion ? 0 : cord).toFixed(3);

    const state =
      reducedMotion || phoneSettled > 0.5
        ? "synced"
        : progress >= CORD_FROM
          ? "syncing"
          : "offline";
    stage.dataset.syncState = state;
  }, [progress, reducedMotion, phoneArrival, phoneSettled, cord]);

  const stateLabel = reducedMotion
    ? copy.sync.states.synced
    : progress >= PHONE_SETTLED
      ? copy.sync.states.synced
      : progress >= CORD_FROM
        ? copy.sync.states.syncing
        : copy.sync.states.offline;

  const pane = (which: "laptop" | "phone") => (
    <div className={`sync-pane sync-pane--${which}`} data-device={which}>
      <p className="sync-pane-name">{copy.sync.devices[which]}</p>
      <div className="sync-pane-body">
        {which === "laptop" ? (
          <ul className="product-list product-list--bare" data-sync-laptop aria-hidden="true">
            <li>
              <ItemRow title={mainItem.title} meta={copy.sync.laptop.meta} marked />
            </li>
          </ul>
        ) : (
          <>
            <p className="sync-empty" data-sync-empty aria-hidden="true">
              {copy.sync.phone.emptyLabel}
            </p>
            <ul className="product-list product-list--bare" data-sync-item aria-hidden="true">
              <li className="sync-item">
                <ItemRow title={mainItem.title} meta={copy.sync.phone.meta} marked />
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );

  return (
    <section
      id="sync"
      ref={sectionRef}
      className="scene scene-sync"
      aria-labelledby="sync-title"
    >
      <div className="env-light sync-env" aria-hidden="true" />
      <div className="container">
        <SceneHeader
          id="sync-title"
          index={copy.sync.index}
          title={copy.sync.title}
          description={copy.sync.description}
          className="scene-header--centered"
        />

        {/* The window is measured on this element, whose bottom is the end of the
            scene's *content*: the surfaces and the closing line. The scroll space
            that lets it pass belongs to the section, not here — otherwise the span
            would include a screenful of empty canvas and the ending would happen
            after the visitor had already scrolled past everything. */}
        <div className="sync-stage" ref={stageRef} data-sync-stage>
          {/* The hairline is a path between two surfaces, not a beam (W4 §7.3):
              a 1px line that draws in and then leaves for good. */}
          <div className="sync-cord" data-sync-cord aria-hidden="true">
            <span className="sync-cord-line" data-sync-cord-line />
            <span className="sync-cord-state">{stateLabel}</span>
          </div>

          <div className="sync-pair">
            {pane("laptop")}
            {pane("phone")}
          </div>

          {/* The closing line belongs *inside* the measured element: the window ends
              when this element has passed, and the visitor should be looking at the
              ending as it completes rather than at empty canvas. */}
          <p className="scene-closing scene-closing--centered">{copy.sync.closing}</p>

          {/* Both surfaces end up showing the same item — that equivalence *is*
              the message, so it is stated for assistive tech too. */}
          <p className="sr-only">
            {copy.sync.windowLabel}：{mainItem.title}，{copy.sync.states.synced}。
          </p>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {stateLabel}
        </p>
      </div>
    </section>
  );
}
