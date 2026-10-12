import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase, showcaseStrings } from "../../content/demo.ts";
import { useReducedMotion, useSceneProgress, stepReveal } from "../../motion/index.ts";
import type { PlanView } from "../../content/types.ts";
import {
  ItemRow,
  ProductBrand,
  ProductSidebar,
  ProductWindow,
} from "../product/ProductWindow.tsx";
import { SceneHeader } from "./SceneHeader.tsx";

/**
 * Scene 04 — One Item, Many Views (W4 §4). The conceptual centerpiece.
 *
 * The claim on screen is one sentence: **this is the same object, seen from
 * another place**. Three things carry it and nothing else does (W4 §4.4):
 *
 *   1. the item's title text is identical in every view
 *   2. the same accent-soft identification mark stays on it
 *   3. it never leaves its line in the composition — the environment changes
 *      underneath it, and the switch is a cross-fade, not a cut
 *
 * There is no 3D, no card flip, no dissolve into a different layout. The only
 * thing that moves is what surrounds the item.
 */

const VIEW_ORDER: PlanView[] = ["overview", "courses", "calendar"];

/** The pinned travel reads as **1 : 2 : 1 quarters** — overview, courses,
 *  calendar. The crossfade midpoints sit at the quarters (0.25 / 0.75), so
 *  each flank owns ~a quarter of the travel and 课程 owns ~half: entering
 *  shows 总览, leaving holds 日程, and the middle projection — which used to
 *  flash past as a sliver — gets twice their dwell (user trial, 2026-10-10:
 *  先设 2 倍试试). At `TRAVEL_PX` = 400 that is ~100px / 200px / 100px,
 *  ~one to two wheel clicks per page; the passage still carries the story,
 *  it does not hold the reader.
 *
 *  User rulings (2026-10-10): "arrived" means the object is **vertically
 *  centred**, from that moment the projections divide the scroll 1 : 2 : 1,
 *  and the **whole scene pins as one object** — chapter marker, title,
 *  switcher, product window and caption together. These replace the
 *  W4 §4.5 suggested band table and the earlier long travels, while keeping
 *  §4.5's actual requirement: scroll-linked values, not trigger stamps. */
const FADE_SPAN = 0.2;
/** Crossfade midpoints: 总览 → 课程 at 0.25, 课程 → 日程 at 0.75. */
const COURSE_FROM = 0.25;
const CALENDAR_FROM = 0.75;

/** Pinned travel, fixed in pixels so the wheel feel is identical on every
 *  display. The stage is sized to the measured object height + this. */
const TRAVEL_PX = 400;

function viewForProgress(progress: number, pinned: boolean): PlanView {
  if (!pinned || progress < COURSE_FROM) return "overview";
  if (progress < CALENDAR_FROM) return "courses";
  return "calendar";
}

export function ViewsScene() {
  const copy = useCopy();
  const demo = showcaseStrings[copy.locale];
  const reducedMotion = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const [pinned, setPinned] = useState(false);

  /* The pinned stage is a desktop affordance. Below 1024px and whenever motion
     is reduced, the same three views are shown as a plain in-flow sequence, so
     the meaning never depends on scrubbing (W2 §25, W4 §31). */
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setPinned(query.matches && !reducedMotion);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [reducedMotion]);

  /* The pin position, the stage size and the scroll window come from one
   * measurement pass. The scene pins when the whole object is vertically
   * centred — `--views-pin-top` = (viewport − object height) / 2, held below
   * the nav — and the stage is sized to the measured object plus the fixed
   * pinned travel (`TRAVEL_PX`, written to `--views-stage-height`), so the
   * window is exactly that travel: progress 0 at the pin, progress 1 at the
   * release. Re-measured on resize and whenever a box changes; the pin, the
   * stage and the window can never drift apart.
   *
   * The stage owns the ref: the scroll window is measured against it. */
  const [windowPx, setWindowPx] = useState({ startOffset: 600, travel: TRAVEL_PX });

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const sticky = stickyRef.current;
    if (!stage || !sticky) return;
    const measure = () => {
      const viewport = window.innerHeight || 1;
      const height = sticky.getBoundingClientRect().height;
      /* Stage = pinned object + fixed travel → the flanks own TRAVEL_PX/4 each, the middle TRAVEL_PX/2. */
      stage.style.setProperty("--views-stage-height", `${height + TRAVEL_PX}px`);
      const stageHeight = stage.getBoundingClientRect().height;
      const travel = Math.max(1, stageHeight - height);
      /* Centred — but never tucked under the nav on short viewports, where the
         object is close to a full screen. */
      const navHeight =
        document.querySelector(".site-nav")?.getBoundingClientRect().height ?? 72;
      const pinTop = Math.max((viewport - height) / 2, navHeight + 16);
      sticky.style.setProperty("--views-pin-top", `${pinTop}px`);
      setWindowPx((current) =>
        Math.abs(current.startOffset - pinTop) < 0.5 && Math.abs(current.travel - travel) < 0.5
          ? current
          : { startOffset: pinTop, travel },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stage);
    observer.observe(sticky);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [pinned]);

  /* The driver is measured against the **stage**, not the section: the stage is
   * the element whose travel the reader is inside. The window *is* the pinned
   * travel: progress 0 is the moment the panel arrives (vertically centred),
   * progress 1 the moment it releases — both ends and the pin position are
   * computed from the same measured geometry, so they cannot drift apart when
   * the viewport, the nav or the panel's content height changes.
   *
   * Four mistakes shaped this scene, all reported from real use:
   *   1. A window longer than the hold left the calendar unreachable on a page
   *      scroll (it only appeared to work while the pointer was over the panel).
   *   2. A window that *started* too early meant the first transition fired while
   *      the stage was still coming into view: a reader saw a sliver of 总览 and
   *      it was already 课程.
   *   3. A window that *finished* too early left the page holding a completely
   *      static frame for ~1700px of scrolling after the last projection had
   *      settled — the scrollbar moved and the picture did not, so the section
   *      read as finished while the reader kept scrolling toward its closing line.
   *   4. Switches that fired on a threshold with a *timed* fade left long inert
   *      holds: the first switch fired mid-rise, before the panel had even
   *      arrived, and once pinned the reader scrolled through hundreds of pixels
   *      in which the picture did not respond. The scene read as a wait for two
   *      remote changes, not as a response to the scrolling.
   */
  const { progress } = useSceneProgress(stageRef, {
    startOffset: windowPx.startOffset,
    travel: windowPx.travel,
    disabled: !pinned,
  });

  /* The switches are scroll-linked (W4 §4.5) and strictly sequential —
   * "fade out, then fade in" (user ruling 2026-10-11): the outgoing
   * projection completes its fade exactly at the switch point and the
   * incoming one starts from zero there, so two projections are never
   * visible at the same time (the old overlapping cross-fade read as a
   * double exposure at its midpoint). The total span is unchanged — the
   * FADE_SPAN zone split into two halves — so each switch still plays across
   * the same stretch of travel and no beat of the pinned stretch is inert.
   * `arrivesAt` is where each half-fade completes, `span` how much of the
   * window it takes. */
  const HALF_FADE = FADE_SPAN / 2;
  const overviewOut = stepReveal(progress, COURSE_FROM, { span: HALF_FADE });
  const coursesIn = stepReveal(progress, COURSE_FROM + HALF_FADE, { span: HALF_FADE });
  const coursesOut = stepReveal(progress, CALENDAR_FROM, { span: HALF_FADE });
  const calendarIn = stepReveal(progress, CALENDAR_FROM + HALF_FADE, { span: HALF_FADE });
  const viewOpacity: Record<PlanView, number> = {
    overview: 1 - overviewOut.eased,
    courses: coursesIn.eased - coursesOut.eased,
    calendar: calendarIn.eased,
  };

  const activeView = viewForProgress(progress, pinned);
  const activeIndex = VIEW_ORDER.indexOf(activeView);

  const panel = (view: PlanView, scrub = false) => (
    <ViewsPanel
      activeView={view}
      scrub={scrub}
      opacities={scrub ? viewOpacity : undefined}
      windowLabel={copy.views.windowLabel}
      brandCn={copy.nav.brandCn}
      brandEn={copy.nav.brandEn}
      navLabels={demo.nav}
      navLabel={copy.capture.product.windowLabel}
      syncNote={demo.syncNote}
      today={demo.today}
      sectionTitle={demo.sectionTitle}
    />
  );

  const sceneHeader = (
    <SceneHeader
      id="views-title"
      index={copy.views.index}
      title={copy.views.title}
      description={copy.views.description}
    />
  );

  return (
    <section
      id="views"
      className="scene scene-views"
      aria-labelledby="views-title"
      data-pinned={pinned}
      data-view={activeView}
    >
      <div className="env-light views-env" aria-hidden="true" />
      <div className="container">
        {pinned ? (
          /* The whole scene — chapter marker, title, switcher, product window,
             caption — is one pinned object (user ruling): it centres as a
             whole, and the three projections play across the fixed travel. */
          <div className="views-stage" ref={stageRef}>
            <div className="views-sticky" ref={stickyRef}>
              {sceneHeader}
              <ViewSwitcher
                labels={copy.views.views}
                activeIndex={activeIndex}
                anchorPrefix="views"
              />
              {panel(activeView, true)}
              <p className="views-caption" aria-live="polite">
                {copy.views.views[activeView].caption}
              </p>
            </div>
          </div>
        ) : (
          <>
            {sceneHeader}
            <div className="views-sequence">
              {VIEW_ORDER.map((view, index) => (
                <div className="views-sequence-step" key={view}>
                  <ViewSwitcher
                    labels={copy.views.views}
                    activeIndex={index}
                    anchorPrefix={`views-${view}`}
                  />
                  {panel(view)}
                  <p className="views-caption">{copy.views.views[view].caption}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <p className="scene-closing">{copy.views.closing}</p>
        {/* Meaning is never locked inside the sticky stage (W2 §25). */}
        <p className="sr-only">{copy.views.staticSummary}</p>
      </div>
    </section>
  );
}

/**
 * Light editorial cue, not a progress meter (W4 §4.6). The labels are plain
 * text — scroll drives the stage, so the visitor is never asked to click
 * something just to be allowed to read on.
 */
function ViewSwitcher({
  labels,
  activeIndex,
  anchorPrefix,
}: {
  labels: Record<PlanView, { label: string; hint: string }>;
  activeIndex: number;
  anchorPrefix: string;
}) {
  return (
    <ol className="view-switcher" aria-hidden="true">
      {VIEW_ORDER.map((view, index) => (
        <li
          key={view}
          id={`${anchorPrefix}-${view}`}
          className={index === activeIndex ? "is-active" : undefined}
        >
          <span className="view-switcher-index">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="view-switcher-text">
            <span className="view-switcher-label">{labels[view].label}</span>
            <span className="view-switcher-hint">{labels[view].hint}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function ViewsPanel({
  activeView,
  scrub = false,
  opacities,
  windowLabel,
  brandCn,
  brandEn,
  navLabels,
  navLabel,
  syncNote,
  today,
  sectionTitle,
}: {
  activeView: PlanView;
  /** Scroll-linked cross-fade (pinned mode): each projection carries its own
   *  `--o`, computed from the scene's window in ViewsScene. */
  scrub?: boolean;
  opacities?: Record<PlanView, number>;
  windowLabel: (view: string) => string;
  brandCn: string;
  brandEn: string;
  navLabels: Record<PlanView, string>;
  navLabel: string;
  syncNote: string;
  today: string;
  sectionTitle: string;
}) {
  const copy = useCopy();
  const demo = showcaseStrings[copy.locale];
  const { mainItem, heroItems, secondaryItems, calendar } = showcase[copy.locale];

  const itemMeta =
    copy.locale === "cn" ? `截止 ${mainItem.due}` : `${demo.duePrefix} ${mainItem.due}`;

  /* Each projection carries its own real heading, the way the product would. */
  const pageTitle =
    activeView === "overview"
      ? navLabels.overview
      : activeView === "courses"
        ? mainItem.course
        : navLabels.calendar;

  return (
    <ProductWindow
      className="product-window--views"
      ariaLabel={windowLabel(copy.views.views[activeView].label)}
      brand={<ProductBrand cn={brandCn} en={brandEn} />}
      sidebar={
        <ProductSidebar
          labels={navLabels}
          active={activeView}
          navLabel={navLabel}
          syncNote={syncNote}
        />
      }
    >
      <div className="product-page-header">
        <p className="product-today">{today}</p>
        <p className="product-h1">{pageTitle}</p>
      </div>

      {/* All three projections share one grid cell, so the item keeps its line
          and the change reads as the same object being re-seen (W4 §4.3). */}
      <div
        className="views-panels"
        data-active={activeView}
        data-scrub={scrub ? "true" : undefined}
      >
        <div
          className="views-panel"
          data-panel="overview"
          style={opacities ? ({ "--o": opacities.overview } as CSSProperties) : undefined}
        >
          <div className="views-context">
            <p className="product-section-label">{sectionTitle}</p>
          </div>
          <ul className="product-list product-list--bare">
            <ItemRow
              title={mainItem.title}
              meta={`${mainItem.course} · ${itemMeta}`}
              marked
            />
            {heroItems.slice(1).map((item) => (
              <ItemRow
                key={item.title}
                title={item.title}
                meta={`${item.course} · ${item.time}`}
              />
            ))}
          </ul>
        </div>

        <div
          className="views-panel"
          data-panel="courses"
          style={opacities ? ({ "--o": opacities.courses } as CSSProperties) : undefined}
        >
          <div className="views-context">
            <p className="product-section-label">{mainItem.course}</p>
          </div>
          <ul className="product-list product-list--bare">
            <ItemRow title={mainItem.title} meta={itemMeta} marked />
            {secondaryItems.map((item) => (
              <ItemRow key={item.title} title={item.title} meta={mainItem.course} />
            ))}
          </ul>
        </div>

        <div
          className="views-panel"
          data-panel="calendar"
          style={opacities ? ({ "--o": opacities.calendar } as CSSProperties) : undefined}
        >
          <div className="views-context">
            <div className="views-calendar-days">
              {calendar.days.map((day) => (
                <span key={day.label} className={day.active ? "is-active" : undefined}>
                  {day.label}
                </span>
              ))}
            </div>
            <div className="views-calendar-scale">
              {calendar.hours.map((hour, index) => (
                <span
                  key={hour}
                  className={index === calendar.activeHourIndex ? "is-active" : undefined}
                >
                  {hour}
                </span>
              ))}
            </div>
            <div className="views-calendar-track">
              <span
                className="views-calendar-marker"
                style={
                  {
                    "--marker-position": `${
                      (calendar.activeHourIndex / Math.max(calendar.hours.length - 1, 1)) * 100
                    }%`,
                  } as CSSProperties
                }
              />
            </div>
          </div>
          <ul className="product-list product-list--bare">
            <ItemRow title={mainItem.title} meta={mainItem.course} marked />
          </ul>
        </div>
      </div>
    </ProductWindow>
  );
}
