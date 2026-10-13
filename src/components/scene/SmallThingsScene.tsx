import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { useReducedMotion, useSceneProgress } from "../../motion/index.ts";

/**
 * Scene 01 — 真正容易忘记的，往往不是大事。(W3 §10, §11)
 *
 * One large field, a designed scatter of everyday notes (never random
 * coordinates — §10.2), and a single scroll progress value that moves them
 * toward one invisible editorial axis. No particles, no wandering: the motion
 * is slow and legible, and it says "散落 → 看得见彼此 → 开始归拢".
 */

interface FragmentLayout {
  /** Desktop coordinates, expressed against the fragment field. */
  top: string;
  left: string;
  /** Alignment axis: `left` uses left, `right` uses right, `center` centres. */
  align: "left" | "center" | "right";
  /** Starting offset from the shared axis, in px. */
  fromX: number;
  fromY: number;
  /** Narrow screens (<768px) show an in-flow column instead of an absolute
   *  field, so the start offsets alone carry the scatter — and they must be
   *  large enough to read as movement in a 350px column (user report,
   *  2026-10-13: the notes read as one still list, and the convergence measured
   *  only ≈50px on a phone). Positive = the note starts to the right and drifts
   *  left into the column edge. */
  narrowFromX?: number;
  narrowFromY?: number;
  size: 0 | 1 | 2;
  opacity: number;
  /** Leaving fragments resolve out of the scene before it ends. */
  exitsAt?: [number, number];
}

/**
 * The unresolved question's start offset. It is a named constant because both
 * the render-time inline value and the convergence effect read it — the ghost
 * is not part of `copy.smallThings.fragments`, so it has no LAYOUT index of its
 * own. Narrow screens: same as the rest of the scatter, it arrives with the
 * whole question and then resolves out mid-scene.
 */
const GHOST_LAYOUT: FragmentLayout = {
  top: "43%",
  left: "11%",
  align: "left",
  fromX: 40,
  fromY: -12,
  narrowFromX: 120,
  narrowFromY: -12,
  size: 1,
  opacity: 0.34,
  exitsAt: [0.34, 0.62],
};

const LAYOUT: (FragmentLayout | null)[] = [
  {
    top: "4%",
    left: "9%",
    align: "left",
    fromX: 68,
    fromY: -24,
    narrowFromX: 96,
    narrowFromY: -18,
    size: 2,
    opacity: 1,
  },
  {
    top: "17%",
    left: "68%",
    align: "left",
    fromX: -60,
    fromY: -18,
    narrowFromX: 52,
    narrowFromY: 16,
    size: 0,
    /* Was 0.78 — under the contrast review (P1-1) this whisper read below any
       usable level; 0.97 keeps it the softer of the two ink notes while
       measuring ≈4.5:1 on the canvas. */
    opacity: 0.97,
  },
  {
    top: "73%",
    left: "13%",
    align: "left",
    fromX: -56,
    fromY: 24,
    narrowFromX: 150,
    narrowFromY: -10,
    size: 1,
    opacity: 0.92,
    exitsAt: [0.7, 0.88],
  },
  {
    top: "82%",
    left: "55%",
    align: "left",
    fromX: 60,
    fromY: 20,
    narrowFromX: 64,
    narrowFromY: 18,
    size: 2,
    opacity: 1,
  },
  /* The unresolved thought: the only fragment that has no place at the end.
     It floats in the left column beside the headline — never on the headline
     glyphs (the old 36% left landed it inside the headline's second line and
     read as mud once the window fix made it actually visible). */
  GHOST_LAYOUT,
  null,
];

export function SmallThingsScene() {
  const copy = useCopy();
  const reducedMotion = useReducedMotion();
  /* Phones get the in-flow column, so the convergence runs on the narrow
     start offsets (see FragmentLayout.narrowFromX). Same window, same curve. */
  const [narrow, setNarrow] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const { progress } = useSceneProgress(sectionRef, {
    /* The choreography must play where the reader can see it (W3 §10.5–10.7):
       fragments are already visible when the section becomes primary, the
       convergence is watched, and the designed fade-outs are witnessed
       mid-screen. The window is centred on the moment the section settles —
       progress 0 as its top is 50vh up from the fold, progress 1 as it is 50vh
       above the fold (1.0 viewport of travel, W3 §11's recommended duration):
       the drift begins while the scene is still arriving, the fades play in
       the settled view, and everything freezes while over half the section is
       still on screen — nothing keeps moving into the exit.
       (0.92 → 0.28, the original mapping, completed the whole animation while
       the section was still entering: the exits ran off-screen — measured 0px
       of visible window. 0.25 → −0.75 fixed that but still read "too late" on
       a real screen: the drift started only after the scene had almost fully
       arrived, and its tail drifted past the top of the viewport — user
       report, 2026-10-10.) */
    startAt: 0.5,
    endAt: -0.5,
    disabled: reducedMotion,
  });

  /* Fragments move toward the shared axis purely through custom properties:
     one scroll value, no React re-render per frame (W4 §18.1).
     Amplitude is a user decision (2026-10-10): the first shipping values read
     as motionless on a real screen — the drift is now ~60–68px per fragment
     plus a 4% settle in scale, still one calm monotonic convergence (W3
     §10.6's "6–14px" was a prototype hint; the user 裁决 overrides it, same
     as Scene 04 covered W4 §4.5's suggested pacing). */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const nodes = field.querySelectorAll<HTMLElement>("[data-fragment]");

    for (const node of nodes) {
      const layout = LAYOUT[Number(node.dataset.fragment)];
      if (!layout) continue;
      const eased = progress * progress * (3 - 2 * progress);
      const startX = narrow ? (layout.narrowFromX ?? layout.fromX) : layout.fromX;
      const startY = narrow ? (layout.narrowFromY ?? layout.fromY) : layout.fromY;
      const x = reducedMotion ? 0 : startX * (1 - eased);
      const y = reducedMotion ? 0 : startY * (1 - eased);
      node.style.setProperty("--fx", `${x.toFixed(2)}px`);
      node.style.setProperty("--fy", `${y.toFixed(2)}px`);
      node.style.setProperty("--fs", reducedMotion ? "1" : (0.96 + eased * 0.04).toFixed(4));

      if (layout.exitsAt && !reducedMotion) {
        const [from, to] = layout.exitsAt;
        const exit =
          progress <= from ? 0 : Math.min(1, (progress - from) / Math.max(to - from, 0.01));
        node.style.setProperty("--ex", (1 - exit).toFixed(3));
      } else {
        node.style.setProperty("--ex", "1");
      }
    }
  }, [progress, reducedMotion, narrow]);

  const fragments = copy.smallThings.fragments.map((fragment, index) => ({
    ...fragment,
    layout: LAYOUT[index] ?? null,
  }));

  /* The acceptance pass measured the description breaking 「都不 / 大」 once
     the quote brackets made the line slightly denser (2026-10-11). Keep the
     predicate whole so the wrap lands on the subject boundary (「这些事情 /
     都不大」) — the same nowrap technique as the scene headings. English
     never matches this unit and renders unchanged. */
  const description = copy.smallThings.description;
  const notBigAt = description.indexOf("都不大，");
  const descriptionNode =
    notBigAt >= 0 ? (
      <>
        {description.slice(0, notBigAt)}
        <span className="nowrap">{"都不大，"}</span>
        {description.slice(notBigAt + 4)}
      </>
    ) : (
      description
    );

  return (
    <section
      id="ideas"
      ref={sectionRef}
      className="scene scene-small-things"
      aria-labelledby="small-things-title"
      style={{ "--scene-progress": progress } as CSSProperties}
    >
      <div className="env-light small-things-env" aria-hidden="true" />
      <div className="container">
        <div className="small-things-field" ref={fieldRef}>
          {fragments.map((fragment, index) =>
            fragment.layout ? (
              <p
                key={fragment.text}
                className={[
                  "fragment",
                  `fragment--size-${fragment.layout.size}`,
                  fragment.serif ? "fragment--serif" : "",
                  fragment.layout.align === "center" ? "fragment--center" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                data-fragment={index}
                style={
                  {
                    top: fragment.layout.top,
                    left: fragment.layout.left,
                    "--base-opacity": fragment.layout.opacity,
                    "--fx": `${
                      (narrow ? fragment.layout.narrowFromX : fragment.layout.fromX) ??
                      fragment.layout.fromX
                    }px`,
                    "--fy": `${
                      (narrow ? fragment.layout.narrowFromY : fragment.layout.fromY) ??
                      fragment.layout.fromY
                    }px`,
                  } as CSSProperties
                }
              >
                {fragment.text}
              </p>
            ) : null,
          )}

          {copy.smallThings.ghost.map((text, index) => (
            <p
              key={text}
              className="fragment fragment--ghost"
              data-fragment={copy.smallThings.fragments.length + index}
              style={
                {
                  /* Was 0.34 — the question read as an accident (1.3:1).
                     Raised to ≈2.9:1 so it is perceivable while still the
                     faintest fragment in the scatter (review P1-1). */
                  "--base-opacity": 0.72,
                  "--fx": `${
                    (narrow ? GHOST_LAYOUT.narrowFromX : GHOST_LAYOUT.fromX) ??
                    GHOST_LAYOUT.fromX
                  }px`,
                  "--fy": `${GHOST_LAYOUT.fromY}px`,
                } as CSSProperties
              }
            >
              {text}
            </p>
          ))}

          <div className="small-things-copy">
            <h2 id="small-things-title" className="small-things-title display">
              {copy.smallThings.title}
            </h2>
            <p className="small-things-description">{descriptionNode}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
