import { useCallback, useEffect, useRef, useState } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase } from "../../content/demo.ts";
import { useEnterOnce, useReducedMotion } from "../../motion/index.ts";
import { SceneHeader } from "./SceneHeader.tsx";

/**
 * Scene 06 — AI, Quietly (W4 §6).
 *
 * A brand-trust scene, not a capability demo. Its whole job is to show the one
 * behaviour the product actually has (W0 §16.2, W4 §6.6):
 *
 *   an ambiguous sentence → one lightweight question → the visitor answers →
 *   the item becomes clear
 *
 * Nothing is decided on the visitor's behalf, there is no "AI is thinking" beat,
 * no sweeping light, no token stream. The AI mark is deliberately absent — W4
 * §6.3 says the thing that matters is resolving the ambiguity, not announcing
 * that a model was involved. Both answers are real paths, and refusing to answer
 * is one of them.
 *
 * The whole demo is local state. It never calls a model or a service.
 */

type AiPhase = "IDLE" | "ASKING" | "RESOLVED" | "KEPT";

/** A short beat between the question appearing and the answers becoming usable. */
const OPTIONS_READY_MS = 260;

export function AiQuietlyScene() {
  const copy = useCopy();
  const { mainItem } = showcase[copy.locale];
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* Reduced motion starts at the question: the scene's meaning is the exchange,
     so it is shown complete rather than skipped. */
  const [phase, setPhase] = useState<AiPhase>(() =>
    reducedMotion ? "ASKING" : "IDLE",
  );
  const [optionsReady, setOptionsReady] = useState(reducedMotion);

  const entered = useEnterOnce(stageRef, 0.35);

  /**
   * The question appears when the scene is read, and the answers become usable a
   * short beat later — so the exchange reads as "asked" and then "ready to
   * answer" rather than as a form that was always there (W4 §6.4).
   *
   * `phase` is deliberately not a dependency. Including it made the cleanup run
   * when the phase changed to ASKING, which cancelled the very timeout that was
   * about to enable the answers: the question appeared and the options never
   * became clickable, deterministically. The guard is written against the
   * functional update instead of the captured value.
   */
  useEffect(() => {
    if (!entered || reducedMotion) return;
    setPhase((current) => (current === "IDLE" ? "ASKING" : current));
    const handle = window.setTimeout(() => setOptionsReady(true), OPTIONS_READY_MS);
    return () => window.clearTimeout(handle);
  }, [entered, reducedMotion]);

  const answer = useCallback((next: Extract<AiPhase, "RESOLVED" | "KEPT">) => {
    setOptionsReady(true);
    setPhase(next);
  }, []);

  const reset = useCallback(() => {
    setPhase("ASKING");
    setOptionsReady(true);
  }, []);

  const answered = phase === "RESOLVED" || phase === "KEPT";

  return (
    <section
      id="ai"
      ref={sectionRef}
      className="scene scene-ai"
      aria-labelledby="ai-title"
      data-phase={phase}
    >
      <div className="container">
        <SceneHeader
          id="ai-title"
          index={copy.ai.index}
          title={copy.ai.title}
          description={copy.ai.description}
          className="scene-header--centered"
        />

        <div className="ai-stage" ref={stageRef}>
          {/* The input stays exactly where it is for the whole scene (W4 §6.4). */}
          <p className="ai-input">
            <span className="sr-only">{copy.ai.inputLabel}: </span>
            <span className="ai-input-text">{copy.ai.input}</span>
          </p>

          <div className="ai-question" data-visible={phase !== "IDLE"}>
            <p className="ai-question-text">{copy.ai.question}</p>
            <div className="ai-answers" data-ready={optionsReady}>
              <button
                type="button"
                className="btn btn-primary ai-answer"
                onClick={() => answer("RESOLVED")}
                disabled={answered}
              >
                {copy.ai.answerConfirm}
              </button>
              <button
                type="button"
                className="btn btn-quiet ai-answer ai-answer--quiet"
                onClick={() => answer("KEPT")}
                disabled={answered}
              >
                {copy.ai.answerKeep}
              </button>
            </div>
          </div>

          {/* Resolution.
           *
           * Only the course is confirmed, because the course is the only thing the
           * sentence left unstated. The time stays the weekday the visitor wrote and
           * the item's content is untouched — no date, requirement or detail is
           * invented. The label is the visitor's own confirmation, not a claim the
           * product decided anything.
           *
           * The open state says the same thing from the other side: what is not yet
           * known, and what is being preserved while it waits. */}
          {phase === "ASKING" ? <p className="ai-pending">{copy.ai.pendingNote}</p> : null}

          <div className="ai-result" data-visible={answered}>
            {phase === "RESOLVED" ? (
              <>
                <p className="ai-confirmed">
                  <span className="ai-confirmed-label">{copy.ai.resolvedLabel}</span>
                  <span className="ai-confirmed-value">{copy.ai.resolved}</span>
                </p>
                <p className="ai-note">{copy.ai.settledNote}</p>
                {/* The same sentence, now with a place. The course is the only part
                    that changed. */}
                <p className="ai-result-item" aria-hidden="true">
                  <span className="item-title">{mainItem.title}</span>
                  <span className="item-meta">
                    {copy.ai.resolved} · {copy.reminder.value}
                  </span>
                </p>
              </>
            ) : null}
            {phase === "KEPT" ? (
              <>
                <p className="ai-note">{copy.ai.keptNote}</p>
                <p className="ai-result-item" aria-hidden="true">
                  <span className="item-title">{copy.ai.input}</span>
                  <span className="item-meta">{copy.reminder.value}</span>
                </p>
              </>
            ) : null}
            {answered ? (
              <button type="button" className="text-action" onClick={reset}>
                {copy.ai.reopen}
              </button>
            ) : null}
          </div>

          {/* One announcement for the whole exchange. */}
          <p className="sr-only" role="status" aria-live="polite">
            {phase === "KEPT"
              ? copy.ai.status.kept
              : phase === "RESOLVED"
                ? copy.ai.status.resolved
                : phase === "ASKING"
                  ? copy.ai.status.asking
                  : ""}
          </p>
        </div>

        <p className="scene-closing scene-closing--centered">{copy.ai.closing}</p>
        <p className="caption ai-hint">{copy.ai.hint}</p>
      </div>
    </section>
  );
}
