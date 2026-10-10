import { useEffect, useRef, useState, type RefObject } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/**
 * Reduced motion is a first-class mode, not a fallback (W2 §25). Every scene
 * reads this and resolves to its final, fully readable state instead of
 * animating into it.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(prefersReducedMotion);

  useEffect(() => {
    if (!window.matchMedia) return;
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

/** True once the viewport is at least `query` wide — used for pointer-only work. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia?.(query).matches === true,
  );

  useEffect(() => {
    if (!window.matchMedia) return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener("change", update);
    return () => list.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export const DESKTOP_QUERY = "(min-width: 1024px) and (pointer: fine)";

export interface SceneProgress {
  /** 0 → 1 across the scroll window, clamped. */
  progress: number;
  /** True when the scene has been on screen at least once. */
  entered: boolean;
}

/**
 * One scroll-linked progress value per scene (W4 §18.1).
 *
 * The window starts when the element's top reaches `startAt` of the viewport and
 * completes when its bottom reaches `endAt`. Because the value is derived from
 * `getBoundingClientRect()` on every frame rather than accumulated, jumping or
 * fast scrolling resolves immediately to a coherent state instead of trapping
 * the visitor inside a half-finished animation (W2 §18.3).
 *
 * ## Two ways to describe the same window
 *
 * `startAt` / `endAt` are **viewport fractions**, which is the right unit for a
 * scene that owns the screen while it plays — pinned scenes, and scenes whose
 * reveal should fill the visible area.
 *
 * `startOffset` / `travel` are **pixels**, which is the right unit for a scene
 * that does *not* own the screen and can only rely on a bounded amount of
 * scrolling. A fraction-based window is implicitly a fraction of the viewport, so
 * on a tall viewport it demands more scrolling than the space below the scene
 * actually provides — measured at 1024×1366, where the last scene came to rest
 * reading 同步中 with the connection still drawn, on the same code that behaved
 * correctly at 1440×900. Expressing the window in pixels removes the viewport from
 * the equation entirely.
 *
 * Give one of the three, not more:
 *   · `startAt` + `endAt` — viewport fractions, for a scene that owns the screen
 *     while it plays (pinned scenes, and reveals that fill the visible area).
 *   · `startOffset` + `travel` — pixels, for a scene that does not own the screen
 *     but whose pacing should be identical on every viewport.
 *   · `scrollRange` — "from where the stage comes into view to the last position
 *     the page can be scrolled to". See below.
 *
 * ## `scrollRange`: for the last scene on the page
 *
 * The final scene has no viewport of its own to measure against — it has whatever
 * scrolling is left over after everything above it, and that quantity depends on
 * the page length *and* the viewport height. A fraction-based window therefore
 * demands a fraction of the viewport, and a pixel-based one demands a constant;
 * measured across the reference viewports, the space actually available ranged
 * from ~608px to well over a full screen, so neither unit can be right everywhere.
 *
 * `scrollRange: true` sidesteps the question by defining the window as the range
 * that exists: it opens when the element's top edge is `playInset` above the bottom
 * of the viewport, and reaches 1 exactly when the document can no longer be
 * scrolled. The scene's last state is then reached by construction rather than by
 * arithmetic that has to be kept in step with the page, which is what the previous
 * three attempts at this scene got wrong.
 */
export function useSceneProgress(
  ref: RefObject<HTMLElement | null>,
  options: {
    startAt?: number;
    endAt?: number;
    /** Pixels from the top of the viewport at which progress leaves 0. */
    startOffset?: number;
    /** Pixels of scrolling the window spans, independent of viewport height. */
    travel?: number;
    /** Window spans from entering the viewport to the end of the document. */
    scrollRange?: boolean;
    /** With `scrollRange`, how far above the fold the window opens. */
    playInset?: number;
    /**
     * Window ends when the element's own bottom edge reaches the fold.
     *
     * The scene carries its own scroll: progress 1 arrives exactly as the scene
     * finishes passing, so nothing after the element can affect it. This is the
     * right unit for a scene that is followed by more page — `scrollRange` is only
     * correct while the scene happens to be last, and stops being correct the
     * moment anything is added below it.
     */
    untilPassed?: boolean;
    /** With `untilPassed`, how far above the fold the window opens. */
    leadIn?: number;
    disabled?: boolean;
  } = {},
): SceneProgress {
  const {
    startAt = 0.85,
    endAt = 0.35,
    startOffset,
    travel: travelPx,
    scrollRange = false,
    playInset = 180,
    untilPassed = false,
    leadIn = 260,
    disabled = false,
  } = options;
  const byPixels = !scrollRange && startOffset !== undefined && travelPx !== undefined;
  const [state, setState] = useState<SceneProgress>({ progress: 0, entered: false });
  const enteredRef = useRef(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (disabled) {
      setState({ progress: 1, entered: true });
      return;
    }

    /**
     * The window is measured against the element's top edge as it travels *up*
     * the viewport, so it is only meaningful when the window opens below where it
     * closes — i.e. `startAt > endAt`, or a positive travel. Getting this
     * backwards pins the value at 0 forever, which reads as "the scene never
     * happens" rather than as a crash. Three scenes were shipped with a variant of
     * that mistake, so it now fails loudly during development instead of silently
     * producing a dead scene.
     *
     * `scrollRange` derives its span at measure time instead, so there is nothing
     * to get backwards; only the fraction and pixel forms are validated here.
     */
    const span = byPixels ? (travelPx as number) : (startAt - endAt) * (window.innerHeight || 1);
    if (!scrollRange && !untilPassed && import.meta.env.DEV && span <= 0) {
      throw new Error(
        byPixels
          ? `useSceneProgress: travel (${travelPx}) must be greater than 0 — ` +
              `the window would never advance.`
          : `useSceneProgress: startAt (${startAt}) must be greater than endAt (${endAt}) — ` +
              `the window would never advance.`,
      );
    }
    if (!scrollRange && !untilPassed && span <= 0) return;

    let frame = 0;
    let lastProgress = -1;

    const measure = () => {
      frame = 0;
      const rect = element.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      let raw: number;
      if (untilPassed) {
        /* Both ends expressed as **document scroll positions**, which is what the
           visitor actually does, rather than as a ratio of two moving edges.
           An earlier version divided by `start − rect.bottom` — a quantity that
           shrinks as the element rises, so the value ran ahead of the scroll and
           the scene read as finished while it was still coming up the screen.

             entry  the element's top edge sits `leadIn` below the fold
             exit   the element's bottom edge reaches the fold

           ...except when the page cannot scroll that far, which happens whenever
           enough of the document sits below the element. Then the exit becomes the
           last position the page can reach, so the value still arrives at 1 — it
           just gets there at the end of the scroll instead of mid-screen. Without
           this the scene came to rest unfinished on four of the six reference
           viewports: at 1024×1366 the furthest reachable progress was 0.88. */
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const docTop = rect.top + scrollY;
        const entry = docTop - viewport - leadIn;
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - viewport,
        );
        const exit = Math.min(docTop + rect.height, maxScroll);
        const own = exit - entry;
        raw = own > 0 ? (scrollY - entry) / own : 1;
      } else if (scrollRange) {
        /* Progress 0 when the element's top edge is `playInset` above the bottom
           of the viewport; progress 1 at the last position the page can reach. */
        const docTop =
          rect.top + (window.scrollY || window.pageYOffset || document.documentElement.scrollTop);
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - viewport,
        );
        const from = docTop - viewport - playInset;
        const span2 = maxScroll - from;
        raw = span2 > 0 ? ((window.scrollY || 0) - from) / span2 : 0;
      } else {
        const start = byPixels ? (startOffset as number) : viewport * startAt;
        raw = (start - rect.top) / span;
      }
      const progress = Math.min(1, Math.max(0, raw));

      if (rect.top < viewport && rect.bottom > 0) enteredRef.current = true;

      /* Visible in the DOM for the review tooling in .review/. */
      element.dataset.sceneRect = `${Math.round(rect.top)}:${Math.round(rect.height)}:${raw.toFixed(3)}`;
      /* The inputs the value was computed from, for the same reason: a window that
         is wrong is easier to read than to reason about. */
      element.dataset.sceneWindow = untilPassed
        ? `passed:${viewport}+${leadIn}:${raw.toFixed(3)}`
        : scrollRange
          ? `range:${playInset}`
          : byPixels
            ? `px:${startOffset}+${travelPx}`
            : `frac:${startAt}..${endAt}`;

      if (Math.abs(progress - lastProgress) < 0.0015 && enteredRef.current) return;
      lastProgress = progress;
      setState({ progress, entered: enteredRef.current });
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [
    ref,
    startAt,
    endAt,
    startOffset,
    travelPx,
    scrollRange,
    playInset,
    untilPassed,
    leadIn,
    disabled,
    byPixels,
  ]);

  return state;
}

/** Fires once when the element first becomes meaningfully visible. */
export function useEnterOnce(
  ref: RefObject<HTMLElement | null>,
  threshold = 0.55,
): boolean {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || entered) return;
    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
          }
        }
      },
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, entered]);

  return entered;
}

export interface StepReveal {
  /** 0 → 1 for this step alone; 1 means it has arrived. */
  value: number;
  /** Eased value, ready to bind straight to opacity/transform. */
  eased: number;
  /** True once this step has fully arrived. */
  arrived: boolean;
}

/**
 * Splits a scene's scroll window into a sequence of steps, so several elements
 * can arrive one after another from a single measured progress value.
 *
 * `arrivesAt` is where a step finishes its approach, as a fraction of the shared
 * window. Steps are given deliberately different values — two steps sharing one
 * would arrive together and read as a single gesture.
 */
export function stepReveal(
  progress: number,
  arrivesAt: number,
  options: { disabled?: boolean; span?: number } = {},
): StepReveal {
  const { disabled = false, span = 0.16 } = options;
  if (disabled) return { value: 1, eased: 1, arrived: true };
  const raw = (progress - arrivesAt) / span + 1;
  const value = Math.min(1, Math.max(0, raw));
  return {
    value,
    eased: value * value * (3 - 2 * value),
    arrived: value >= 1,
  };
}

/** Linear interpolation, used to map scene progress onto a property range. */
export function track(progress: number, from: number, to: number): number {
  if (to <= from) return progress >= to ? 1 : 0;
  return Math.min(1, Math.max(0, (progress - from) / (to - from)));
}

/** Eases a 0..1 track with the site's settle curve. */
export function settle(value: number): number {
  return 1 - (1 - value) ** 3;
}

export const motionTokens = {
  fast: 120,
  short: 180,
  medium: 240,
  panel: 280,
  slow: 360,
  narrative: 640,
  narrativeLong: 860,
} as const;
