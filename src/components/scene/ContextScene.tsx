import { useEffect, useRef, type CSSProperties } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase } from "../../content/demo.ts";
import { useReducedMotion, useSceneProgress } from "../../motion/index.ts";
import { SceneHeader } from "./SceneHeader.tsx";

/**
 * Scene 03 — Context (W4 §3).
 *
 * The item is already recorded; what it is missing is where it belongs. The
 * geometry says this literally: **the item never moves, the context moves
 * toward it** (W4 §3.3). Each piece of context arrives on its own beat and in
 * the order that carries meaning —
 *
 *   事情 → 属于哪里 → 什么时候 → 需要怎样记住
 *
 * Nothing spins, nothing flies. The addition is the spectacle (W1 §7).
 */

type ChipKind = "course" | "time" | "content" | "reminder";

interface ChipLayout {
  kind: ChipKind;
  /** Which side of the object the label sits on, in object-relative px. */
  side: "above" | "left" | "right" | "below";
  /** Starting offset before the chip settles, in px. */
  fromX: number;
  fromY: number;
  /** Scene progress at which this chip finishes its approach. */
  arrivesAt: number;
}

/**
 * The four pieces gather *toward* the object rather than scattering across the
 * scene. They are positioned against the object's own box — above it, flanking
 * it, below it — not against percentages of the stage: percentage placement
 * collided with the object as soon as the stage was narrowed, and left the
 * labels ~450px away when it was wide.
 *
 * `arrivesAt` values are spread from 0.45 to 0.94 rather than starting near 0.
 * With the first arrival at 0.28 the earliest label had completed most of its
 * approach before the object had finished entering the screen, so on first sight
 * 课程 was simply *there* while the other three had yet to move — reported from
 * real use, and visible in the reveal curve as the first movement landing at
 * `stageTop ≈ 700` with the label already at 0.77.
 *
 * `fromX/fromY` are deliberately larger than a nudge: at a 40px displacement the
 * approach reads as movement even across the ~0.15 of progress each label owns.
 */
const CHIPS: ChipLayout[] = [
  { kind: "course", side: "above", fromX: 0, fromY: 40, arrivesAt: 0.5 },
  { kind: "time", side: "left", fromX: -58, fromY: 0, arrivesAt: 0.58 },
  { kind: "content", side: "below", fromX: -44, fromY: 30, arrivesAt: 0.74 },
  { kind: "reminder", side: "right", fromX: 58, fromY: 0, arrivesAt: 0.9 },
];

export function ContextScene() {
  const copy = useCopy();
  const { mainItem } = showcase[copy.locale];
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* The window is measured on the **stage**, and expressed in **pixels** rather
   * than viewport fractions.
   *
   * Four mistakes shaped these numbers, three found by measurement and one
   * reported from real use:
   *   1. A window expressed relative to the *section* spends its first ~500px
   *      while the stage is below the fold.
   *   2. A window that finished too late left the last piece (提醒) arriving when
   *      the stage's top edge was ~45px from the top of the screen — measured
   *      1.00/1.00/1.00/**0.00** there, so only three of the four were ever seen.
   *   3. A window that started too early spent the first three arrivals while the
   *      stage was still mostly below the fold, so a reader saw only the last one
   *      move (and the same in reverse on the way back up).
   *   4. A viewport-fraction window is a different amount of scrolling on every
   *      screen: it behaved at 1440×900 and at 390×844 and not at 1024×1366.
   *      Pixels are the same distance everywhere, which matters because this scene
   *      has to complete inside the visible band rather than inside a viewport.
   *
   * The window opens 900px down the viewport — inside the fold on every reference
   * viewport, so the first piece begins moving as the object comes into view — and
   * spans 800px, giving each of the four pieces ~200px of its own, all on screen. */
  const { progress } = useSceneProgress(stageRef, {
    startOffset: 900,
    travel: 800,
    disabled: reducedMotion,
  });

  /* One progress value, one rAF-driven pass: reveals are pure CSS variable
     writes, so scrolling never triggers a React re-render (W4 §18.1). */
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    stage.dataset.progress = progress.toFixed(3);
    const chips = stage.querySelectorAll<HTMLElement>("[data-chip]");
    for (const chip of chips) {
      const kind = chip.dataset.chip as ChipKind;
      const layout = CHIPS.find((entry) => entry.kind === kind);
      if (!layout) continue;
      const span = Math.max(1 - layout.arrivesAt, 0.01);
      const raw = (progress - layout.arrivesAt) / span + 1;
      const reveal = reducedMotion ? 1 : Math.min(1, Math.max(0, raw));
      const eased = reveal * reveal * (3 - 2 * reveal);
      chip.style.setProperty("--in", eased.toFixed(3));
      chip.style.setProperty("--cx", `${((1 - eased) * layout.fromX).toFixed(2)}px`);
      chip.style.setProperty("--cy", `${((1 - eased) * layout.fromY).toFixed(2)}px`);
    }
  }, [progress, reducedMotion]);

  const chipValue = (kind: ChipKind) => {
    if (kind === "course") return mainItem.course;
    if (kind === "time") return mainItem.time;
    if (kind === "content") return mainItem.detail;
    return copy.context.reminderValue;
  };

  /* The statement must not split inside 「“做什么”。」(review P2-1): the
     segment from the opening quote onward wraps as one unit — at 1440 the
     line previously broke after 「做什」, leaving a three-glyph widow. */
  const title = copy.context.title;
  const titleBreak = title.indexOf("\u201C");
  const titleNode =
    titleBreak > 0 ? (
      <>
        {title.slice(0, titleBreak)}
        <span className="nowrap">{title.slice(titleBreak)}</span>
      </>
    ) : (
      title
    );

  return (
    <section
      id="context"
      ref={sectionRef}
      className="scene scene-context"
      aria-labelledby="context-title"
    >
      <div className="env-light context-env" aria-hidden="true" />
      <div className="container">
        <SceneHeader
          id="context-title"
          index={copy.context.index}
          title={titleNode}
          description={copy.context.description}
        />

        <div className="context-stage" ref={stageRef}>
          {/* The object itself never moves (W4 §3.3). It and its four labels are
              one three-column grid, so no label can drift onto it. */}
          <div className="context-item">
            <p className="context-item-course">{mainItem.course}</p>
            <p className="context-item-title">{mainItem.title}</p>
          </div>

          {CHIPS.map((chip) => (
            <div
              key={chip.kind}
              className={`context-chip context-chip--${chip.kind} context-chip--${chip.side}`}
              data-chip={chip.kind}
              aria-hidden="true"
              style={
                {
                  "--arrives": String(chip.arrivesAt),
                  "--in": 0,
                  "--cx": `${chip.fromX}px`,
                  "--cy": `${chip.fromY}px`,
                } as CSSProperties
              }
              data-arrives={chip.arrivesAt}
            >
              <span className="context-chip-dot" />
              <span className="context-chip-text">
                <span className="context-chip-label">{copy.context.labels[chip.kind]}</span>
                <span className="context-chip-value">{chipValue(chip.kind)}</span>
              </span>
            </div>
          ))}
        </div>

        <p className="scene-closing">{copy.context.closing}</p>
      </div>
    </section>
  );
}
