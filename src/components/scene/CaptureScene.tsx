import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase, showcaseStrings } from "../../content/demo.ts";
import { parseCapture } from "../../content/parseCapture.ts";
import { useEnterOnce, useReducedMotion, useSceneProgress } from "../../motion/index.ts";
import type { CapturePhase } from "../../content/types.ts";
import { ProductSurface } from "../product/ProductSurface.tsx";

/**
 * Scene 02 — 先记下来。(W3 §12–§14)
 *
 * The order on screen is the order in the product:
 *
 *   记下 → 理解 → 确认 → 归位
 *
 * A capture is acknowledged before anything is interpreted, the interpretation
 * takes a short honest moment, and a sentence the demo cannot place is shown as
 * needing the visitor's confirmation instead of being invented. Everything runs
 * on local state; nothing is sent anywhere (W3 §3.4).
 */

const TYPE_INTERVAL_MS = 58;
const CAPTURE_DELAY_MS = 220;
const STRUCTURE_DELAY_MS = 640;

export function CaptureScene() {
  const copy = useCopy();
  const demo = showcaseStrings[copy.locale];
  const { mainItem } = showcase[copy.locale];
  const reducedMotion = useReducedMotion();

  const sectionRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeouts = useRef<number[]>([]);
  const interval = useRef<number | null>(null);

  const [phase, setPhase] = useState<CapturePhase>(() =>
    reducedMotion ? "STRUCTURED" : "EMPTY",
  );
  const [text, setText] = useState(() => (reducedMotion ? demo.captureInput : ""));
  const [manual, setManual] = useState(false);
  const [focused, setFocused] = useState(false);

  const entered = useEnterOnce(sectionRef, 0.45);
  /* One progress value drives the scene's ambient state (W4 §18.1). */
  const { progress } = useSceneProgress(sectionRef, {
    startAt: 0.85,
    endAt: 0.4,
    disabled: reducedMotion,
  });

  const parsed = useMemo(
    () => parseCapture(text || demo.captureInput, copy.locale),
    [text, demo.captureInput, copy.locale],
  );

  const clearTimers = useCallback(() => {
    for (const id of timeouts.current) window.clearTimeout(id);
    timeouts.current = [];
    if (interval.current !== null) {
      window.clearInterval(interval.current);
      interval.current = null;
    }
  }, []);

  const later = useCallback((fn: () => void, delay: number) => {
    timeouts.current.push(window.setTimeout(fn, delay));
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  /**
   * The visitor typed over the demo, so the demo stops owning the field. The
   * recorded state always appears before any interpretation, then the short
   * "sorting it out" beat, then the result (W3 §12.9–§12.11).
   *
   * Both paths live in refs: keeping them out of the effect dependency list is
   * what lets the one-shot demo playback below survive its own re-renders.
   */
  const runSequence = useCallback(
    (input: string) => {
      clearTimers();
      setPhase("CAPTURED");
      const settle = () => {
        const outcome = parseCapture(input, copy.locale);
        setPhase(outcome.resolved ? "STRUCTURED" : "CLARIFY");
      };
      if (reducedMotion) {
        settle();
        return;
      }
      later(() => setPhase("STRUCTURING"), CAPTURE_DELAY_MS + 180);
      later(settle, STRUCTURE_DELAY_MS + 420);
    },
    [clearTimers, copy.locale, later, reducedMotion],
  );

  const runSequenceRef = useRef(runSequence);
  runSequenceRef.current = runSequence;

  const takeOver = useCallback(() => {
    setManual(true);
    clearTimers();
  }, [clearTimers]);

  /* Automatic showcase playback: once, when the scene is first read (§14).
     Fast scrolling never delays it, and scrolling back never replays it. */
  useEffect(() => {
    if (!entered || manual || reducedMotion) return;
    const phrase = demo.captureInput;
    let index = 0;
    setPhase("TYPING");
    const focusTimer = window.setTimeout(() => setFocused(true), 440);

    interval.current = window.setInterval(() => {
      index += 1;
      setText(phrase.slice(0, index));
      if (index < phrase.length) return;
      if (interval.current !== null) window.clearInterval(interval.current);
      interval.current = null;
      window.setTimeout(() => {
        setFocused(false);
        runSequenceRef.current(phrase);
      }, 360);
    }, TYPE_INTERVAL_MS);

    return () => {
      window.clearTimeout(focusTimer);
      if (interval.current !== null) {
        window.clearInterval(interval.current);
        interval.current = null;
      }
    };
  }, [entered, manual, reducedMotion, demo.captureInput]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    takeOver();
    setFocused(true);
    window.setTimeout(() => setFocused(false), 900);
    runSequence(value);
  };

  const onReset = () => {
    clearTimers();
    setManual(false);
    setPhase("EMPTY");
    setText("");
    inputRef.current?.focus();
  };

  /** The wrapper is the visual focus ring; it must be reachable by keyboard. */
  const onFieldKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && event.target === fieldRef.current) {
      event.preventDefault();
      inputRef.current?.focus();
    }
  };

  const course = parsed.resolved || parsed.item.course ? parsed.item.course : "";
  const metaParts = [
    course,
    /* The same meta line Scene 03 and Scene 04 show for this item (W4 §2). */
    copy.locale === "cn"
      ? `截止 ${mainItem.due}`
      : `${demo.duePrefix} ${mainItem.due}`,
  ].filter(Boolean);
  const finished = manual || phase === "STRUCTURED" || phase === "CLARIFY";

  return (
    <section
      id="capture"
      ref={sectionRef}
      className="scene scene-capture"
      aria-labelledby="capture-title"
      data-phase={phase}
    >
      <div className="env-light capture-env" aria-hidden="true" />
      <div className="container capture-container">
        <header className="capture-header">
          <h2 id="capture-title" className="capture-title display">
            {copy.capture.title}
          </h2>
          <p className="capture-description">{copy.capture.description}</p>
        </header>

        <form className="capture-form" onSubmit={onSubmit}>
          <div
            ref={fieldRef}
            className={`capture-field${focused ? " is-focused" : ""}`}
            tabIndex={-1}
            onKeyDown={onFieldKeyDown}
            style={{ "--capture-progress": progress.toFixed(3) } as CSSProperties}
          >
            <span className="capture-status" aria-hidden="true">
              {phase === "CAPTURED" ? (
                <span className="capture-chip">
                  <span aria-hidden="true">✓</span> {demo.capture.recorded}
                </span>
              ) : null}
              {phase === "STRUCTURING" ? (
                <span className="capture-chip capture-chip--quiet">
                  {demo.capture.structuring}
                </span>
              ) : null}
            </span>

            <label className="sr-only" htmlFor="capture-input">
              {copy.capture.inputLabel}
            </label>
            <input
              id="capture-input"
              ref={inputRef}
              className="capture-input"
              type="text"
              value={text}
              placeholder={copy.capture.placeholder}
              autoComplete="off"
              enterKeyHint="done"
              onChange={(event) => {
                takeOver();
                setText(event.target.value);
                if (phase !== "EMPTY" && phase !== "TYPING") setPhase("TYPING");
              }}
            />
            <button
              type="submit"
              className="capture-submit"
              disabled={!text.trim()}
              aria-label={copy.capture.submit}
            >
              {copy.capture.submit}
            </button>
          </div>
        </form>

        <div className="capture-result" aria-hidden="true">
          {phase === "STRUCTURED" ? (
            <>
              <dl className="capture-fields">
                <div>
                  <dt>{demo.capture.fields.course}</dt>
                  <dd>{parsed.item.course}</dd>
                </div>
                <div>
                  <dt>{demo.capture.fields.time}</dt>
                  <dd>{parsed.item.time}</dd>
                </div>
                <div>
                  <dt>{demo.capture.fields.content}</dt>
                  <dd>{parsed.item.content || parsed.item.title}</dd>
                </div>
              </dl>
              <ProductSurface className="capture-settled">
                <ul className="product-list product-list--bare">
                  <li className="item-row">
                    <span className="item-completion">
                      <span className="item-completion-indicator" />
                    </span>
                    <span className="item-body">
                      <span className="item-title">{parsed.item.title}</span>
                      <span className="item-meta">{metaParts.join(" · ")}</span>
                    </span>
                  </li>
                </ul>
              </ProductSurface>
              <p className="capture-settled-caption">{demo.capture.settled}</p>
            </>
          ) : null}
        </div>

        {phase === "CLARIFY" ? (
          <div className="capture-clarify">
            <p className="capture-clarify-question">{demo.capture.clarifyQuestion}</p>
            <p className="capture-clarify-body">{demo.capture.clarifyBody}</p>
            <div className="capture-clarify-actions">
              <button type="button" className="btn btn-quiet btn-small">
                {demo.capture.clarifyKeep}
              </button>
            </div>
          </div>
        ) : null}

        <div className="capture-foot">
          <p className="caption capture-caption">{copy.capture.caption}</p>
          <div className="capture-foot-actions">
            <p className="capture-demo-hint">{copy.capture.demoHint}</p>
            {finished ? (
              <button type="button" className="text-action" onClick={onReset}>
                {copy.capture.reset}
              </button>
            ) : null}
          </div>
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {copy.capture.statusAnnounce[phase]}
        </p>
      </div>
    </section>
  );
}
