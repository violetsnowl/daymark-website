import { useEffect, useRef, type CSSProperties } from "react";
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
  size: 0 | 1 | 2;
  opacity: number;
  /** Leaving fragments resolve out of the scene before it ends. */
  exitsAt?: [number, number];
}

const LAYOUT: (FragmentLayout | null)[] = [
  {
    top: "4%",
    left: "9%",
    align: "left",
    fromX: 34,
    fromY: -12,
    size: 2,
    opacity: 1,
  },
  {
    top: "17%",
    left: "68%",
    align: "left",
    fromX: -30,
    fromY: -9,
    size: 0,
    opacity: 0.78,
  },
  {
    top: "73%",
    left: "13%",
    align: "left",
    fromX: -28,
    fromY: 12,
    size: 1,
    opacity: 0.92,
    exitsAt: [0.7, 0.88],
  },
  {
    top: "82%",
    left: "55%",
    align: "left",
    fromX: 30,
    fromY: 10,
    size: 2,
    opacity: 1,
  },
  /* The unresolved thought: the only fragment that has no place at the end. */
  {
    top: "43%",
    left: "36%",
    align: "left",
    fromX: 20,
    fromY: -6,
    size: 1,
    opacity: 0.34,
    exitsAt: [0.34, 0.62],
  },
  null,
];

export function SmallThingsScene() {
  const copy = useCopy();
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  const { progress } = useSceneProgress(sectionRef, {
    startAt: 0.92,
    endAt: 0.28,
    disabled: reducedMotion,
  });

  /* Fragments move toward the shared axis purely through custom properties:
     one scroll value, no React re-render per frame (W4 §18.1). */
  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    const nodes = field.querySelectorAll<HTMLElement>("[data-fragment]");

    for (const node of nodes) {
      const layout = LAYOUT[Number(node.dataset.fragment)];
      if (!layout) continue;
      const eased = progress * progress * (3 - 2 * progress);
      const x = reducedMotion ? 0 : layout.fromX * (1 - eased);
      const y = reducedMotion ? 0 : layout.fromY * (1 - eased);
      node.style.setProperty("--fx", `${x.toFixed(2)}px`);
      node.style.setProperty("--fy", `${y.toFixed(2)}px`);
      node.style.setProperty("--fs", reducedMotion ? "1" : (0.976 + eased * 0.024).toFixed(4));

      if (layout.exitsAt && !reducedMotion) {
        const [from, to] = layout.exitsAt;
        const exit =
          progress <= from ? 0 : Math.min(1, (progress - from) / Math.max(to - from, 0.01));
        node.style.setProperty("--ex", (1 - exit).toFixed(3));
      } else {
        node.style.setProperty("--ex", "1");
      }
    }
  }, [progress, reducedMotion]);

  const fragments = copy.smallThings.fragments.map((fragment, index) => ({
    ...fragment,
    layout: LAYOUT[index] ?? null,
  }));

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
                    "--fx": `${fragment.layout.fromX}px`,
                    "--fy": `${fragment.layout.fromY}px`,
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
                  "--base-opacity": 0.34,
                  "--fx": "20px",
                  "--fy": "-6px",
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
            <p className="small-things-description">{copy.smallThings.description}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
