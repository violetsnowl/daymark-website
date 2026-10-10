import { useEffect, useRef, useState, type CSSProperties } from "react";
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

/** Scroll mapping (W4 §4.5's bands, expressed against the stage-anchored
 *  window): a projection becomes current at the middle of its fade —
 *  0.35 for courses, 0.78 for calendar. */
const COURSE_FROM = 0.35;
const CALENDAR_FROM = 0.78;

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

  /* The driver is measured against the **stage**, not the section: the stage is
   * the element whose travel the reader is inside — it pins when its top passes
   * under the nav and releases when its travel runs out. Measured against the
   * section, the same fractions pick up the header height above the stage, so
   * the pin, the first switch and the release drift apart whenever the header
   * changes.
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
   *
   * `startAt: 0.3` puts progress 0 just above the pin (~140px of rise left): the
   * reader arrives on the overview, the panel finishes coming up, and the story
   * only starts once it has. `endAt: −1.22` puts progress 1 exactly at the
   * release, so the calendar settles into the release rather than into a dead
   * stretch. Measured at 1440×900 (stage 1800px, sticky 576px, pin offset
   * 128px): pin at progress ≈0.10, release at ≈1.00. Change the stage height in
   * `site.css` and this has to change with it.
   */
  const { progress } = useSceneProgress(stageRef, {
    startAt: 0.3,
    endAt: -1.22,
    disabled: !pinned,
  });

  /* The cross-fade itself is scroll-linked (W4 §4.5 asks for scroll-linked
   * values over several timed triggers): the overview fades out over 0.20→0.50
   * and the calendar fades in over 0.66→0.90; everything between is derived
   * from those two, so no beat of the pinned stretch is inert. `arrivesAt` is
   * where each fade completes, `span` is how much of the window it takes. */
  const overviewOut = stepReveal(progress, 0.5, { span: 0.3 });
  const calendarIn = stepReveal(progress, 0.9, { span: 0.24 });
  const viewOpacity: Record<PlanView, number> = {
    overview: 1 - overviewOut.eased,
    courses: overviewOut.eased - calendarIn.eased,
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
        <SceneHeader
          id="views-title"
          index={copy.views.index}
          title={copy.views.title}
          description={copy.views.description}
        />

        {pinned ? (
          /* The stage owns the ref: the scroll window is measured against it
             (see above), and it is the element that pins and releases. */
          <div className="views-stage" ref={stageRef}>
            <div className="views-sticky">
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
