import { useEffect, useRef, type CSSProperties } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { stepReveal, useReducedMotion, useSceneProgress } from "../../motion/index.ts";
import { SceneHeader } from "./SceneHeader.tsx";

/**
 * Scene 08 — A Day With Daymark (W4 §8).
 *
 * The scenes before this one explain how the product works. This one answers a
 * different question: what is it like to have used it for a while?
 *
 * The form is an editorial timeline, not a dashboard (W4 §8.3) — a handful of
 * moments in a day, each arriving as the visitor scrolls. W4 §8.6 rules out metrics
 * of every kind, and there is nothing here to measure anyway: the section's claim is
 * that the day took up less of the visitor's attention, which a completion rate
 * could only contradict.
 *
 * The ambient light starts slightly more active and settles as the timeline fills —
 * motion serving the section's meaning rather than decorating it (W4 §8.4). There is
 * deliberately no day/night theme switch.
 *
 * ## One source of truth for the reveal
 *
 * Each entry's `--in` is derived in render and bound inline, and nothing else writes
 * to it. The first version computed it in render *and* again in an effect that
 * queried the DOM, and the two ran against different progress values — which showed
 * up as an entry sitting at "not yet arrived" while a later one was already
 * complete. Five elements re-rendering on a scroll-derived value is not a cost worth
 * engineering around, and the alternative was two writers for one property.
 */

/**
 * Where each entry arrives, as a fraction of the scene's own window. Deliberately
 * uneven, so the list does not read as a mechanical sequence.
 *
 * The closing line completes at 0.6 rather than near the end. This scene is followed
 * by the closing scene, so it cannot count on the document having scroll to spare:
 * measured against the real page, its window is exhausted while its top edge is
 * still above the fold, and a last line that never arrives is worse than one that
 * finishes a little early. The gap between the last entry (0.5) and the closing line
 * is deliberate — the day fills in, then the line lands.
 */
const ENTRY_STOPS = [0.12, 0.24, 0.36, 0.5];
const CLOSING_ARRIVES = 0.6;

export function DayScene() {
  const copy = useCopy();
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);

  /* The scene owns its window: it opens as the timeline comes into view and finishes
     as it passes, so whatever follows it cannot move its ending. */
  const { progress } = useSceneProgress(stageRef, {
    untilPassed: true,
    leadIn: 260,
    disabled: reducedMotion,
  });

  const reveals = ENTRY_STOPS.map((stop) =>
    stepReveal(progress, stop, { disabled: reducedMotion }),
  );
  const closing = stepReveal(progress, CLOSING_ARRIVES, { disabled: reducedMotion });

  /* Only the values that are not per-element write through the DOM: the scene's
     published progress, its state, and the environment's amplitude. */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.progress = progress.toFixed(3);
    stage.style.setProperty("--day-calm", (1 - closing.eased * 0.55).toFixed(3));
    stage.dataset.dayState = closing.arrived ? "settled" : "filling";
  }, [progress, closing.eased, closing.arrived]);

  /* The closing phrase wraps as one unit so the headline never leaves a
     three-glyph stub on its own line (user ruling, follow-up to review
     P2-1 — same technique as the Scene 03 heading fix). */
  const dayTitle = copy.day.title;
  const dayTitleNode = dayTitle.endsWith("自己的日子。") ? (
    <>
      {dayTitle.slice(0, -6)}
      <span className="nowrap">自己的日子。</span>
    </>
  ) : (
    dayTitle
  );

  return (
    <section
      id="day"
      ref={stageRef}
      className="scene scene-day"
      aria-labelledby="day-title"
      data-day-state={reducedMotion ? "settled" : undefined}
    >
      <div className="env-light day-env" aria-hidden="true" />
      <div className="container">
        <SceneHeader
          id="day-title"
          index={copy.day.index}
          title={dayTitleNode}
          description={copy.day.description}
        />

        <ol className="day-timeline">
          {copy.day.entries.map((entry, index) => {
            const reveal = reveals[index] ?? stepReveal(progress, 1, { disabled: reducedMotion });
            return (
              <li
                key={entry.time}
                className="day-entry"
                data-day-entry
                data-arrives={ENTRY_STOPS[index] ?? 0.8}
                style={
                  {
                    "--in": reveal.eased.toFixed(3),
                    "--out": `${((1 - reveal.eased) * 10).toFixed(2)}px`,
                  } as CSSProperties
                }
              >
                <p className="day-time">{entry.time}</p>
                <div className="day-body">
                  <p className="day-what">{entry.what}</p>
                  {entry.note ? <p className="day-note">{entry.note}</p> : null}
                </div>
              </li>
            );
          })}
        </ol>

        <p
          className="scene-closing day-closing"
          data-day-closing
          style={
            {
              "--in": closing.eased.toFixed(3),
              "--out": `${((1 - closing.eased) * 10).toFixed(2)}px`,
            } as CSSProperties
          }
        >
          {copy.day.closing}
        </p>
      </div>
    </section>
  );
}
