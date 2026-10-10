import { useEffect, useRef, type CSSProperties } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase } from "../../content/demo.ts";
import { stepReveal, useReducedMotion, useSceneProgress } from "../../motion/index.ts";
import { ItemRow } from "../product/ProductWindow.tsx";
import { SceneHeader } from "./SceneHeader.tsx";

/**
 * Scene 05 — Reminder (W4 §5).
 *
 * Scene 04 answered "the thing has a place". This one answers "and then time
 * brings it back". The sequence is deliberately short:
 *
 *   静止的 Item → 时间标签进入 → 轻微状态变化 → 提醒面出现 → Item 仍是同一件事
 *
 * The reminder is a **re-appearance of the same item**, not a new object and not
 * a countdown: W4 §5.3 rules out timer UI outright because a ticking number turns
 * a calm tool into an anxious one. No red, no alarm glyph, no pulsing, no toast.
 */

/** Scroll positions for the two arrivals, as fractions of the shared window.
 *
 * The gap between them is load-bearing, not cosmetic. The scene's whole subject is
 * "the object is bare, and then the moment comes back to it", and the assertion
 * that guards it looks for a sampled frame where the label has arrived but the
 * reminder surface has not. At 0.30/0.62 that frame existed; at 0.30/0.75 it did
 * not, because a 0.45 gap is narrower than the sampling step. Anything that
 * narrows this gap turns a two-stage arrival back into one gesture — which is
 * exactly the failure this scene was rewritten to fix. */
const TIME_ARRIVES = 0.3;
const SURFACE_ARRIVES = 0.62;

export function ReminderScene() {
  const copy = useCopy();
  const { mainItem } = showcase[copy.locale];
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* Anchored to the stage, and expressed in **pixels** so the scene takes the
     same amount of scrolling on every screen. The window opens 900px down the
     viewport — inside the fold on every reference viewport, so the time label
     starts moving as the object comes into view — and spans 800px.
     The span has a floor as well as a ceiling: each arrival is a 0.16-wide step,
     so the window has to be wide enough for "on the way" to be a state a reader can
     actually see rather than a frame that passes between two scroll events. */
  const { progress } = useSceneProgress(stageRef, {
    startOffset: 900,
    travel: 800,
    disabled: reducedMotion,
  });

  const time = stepReveal(progress, TIME_ARRIVES, { disabled: reducedMotion });
  const surface = stepReveal(progress, SURFACE_ARRIVES, { disabled: reducedMotion });

  /* Custom properties only: scrolling never re-renders React (W4 §18.1). */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.progress = progress.toFixed(3);
    const write = (name: string, reveal: ReturnType<typeof stepReveal>) => {
      const node = stage.querySelector<HTMLElement>(`[data-reveal="${name}"]`);
      if (!node) return;
      node.style.setProperty("--in", reveal.eased.toFixed(3));
      node.style.setProperty("--out", ((1 - reveal.eased) * 10).toFixed(2) + "px");
    };
    write("time", time);
    write("surface", surface);
    stage.dataset.reminderState = surface.arrived ? "settled" : time.arrived ? "time" : "idle";
  }, [progress, time, surface]);

  return (
    <section
      id="reminder"
      ref={sectionRef}
      className="scene scene-reminder"
      aria-labelledby="reminder-title"
    >
      <div className="env-light reminder-env" aria-hidden="true" />
      <div className="container">
        <SceneHeader
          id="reminder-title"
          index={copy.reminder.index}
          title={copy.reminder.title}
          description={copy.reminder.description}
        />

        <div className="reminder-stage" ref={stageRef}>
          <div className="reminder-item">
            <div className="context-item">
              <p className="context-item-course">{mainItem.course}</p>
              <p className="context-item-title">{mainItem.title}</p>
            </div>

            {/* The same label language Scene 03 introduced, so the two scenes read
                as one product rather than two designs. */}
            <div
              className="context-chip context-chip--reminder reminder-time"
              data-reveal="time"
              aria-hidden="true"
              style={{ "--in": 0, "--out": "10px" } as CSSProperties}
            >
              <span className="reminder-time-main">
                <span className="context-chip-dot" />
                <span className="context-chip-text">
                  <span className="context-chip-label">{copy.reminder.label}</span>
                  <span className="context-chip-value">{copy.reminder.value}</span>
                </span>
              </span>
              {/* The quiet state change W4 §5.4 asks for: the same reminder, now
                  confirmed, rather than a second object appearing. */}
              <span className="reminder-note">{copy.reminder.surface.note}</span>
            </div>
          </div>

          <div
            className="reminder-surface"
            data-reveal="surface"
            aria-hidden="true"
            style={{ "--in": 0, "--out": "10px" } as CSSProperties}
          >
            <dl className="reminder-fields">
              <div>
                <dt>{copy.context.labels.course}</dt>
                <dd>{copy.reminder.surface.course}</dd>
              </div>
              <div>
                <dt>{copy.context.labels.time}</dt>
                <dd>{copy.reminder.surface.when}</dd>
              </div>
              <div>
                <dt>{copy.context.labels.content}</dt>
                <dd>{copy.reminder.surface.content}</dd>
              </div>
            </dl>
            <ItemRow
              title={mainItem.title}
              meta={`${mainItem.course} · ${copy.reminder.surface.when}`}
              marked
            />
          </div>
        </div>

        <p className="scene-closing">{copy.reminder.closing}</p>
        <p className="caption reminder-hint">{copy.reminder.hint}</p>
        {/* The reminder's own confirmation, available to assistive tech without a
            second visual layer. */}
        <p className="sr-only">{copy.reminder.surface.note}</p>
      </div>
    </section>
  );
}
