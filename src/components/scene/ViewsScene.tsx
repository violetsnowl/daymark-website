import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase, showcaseStrings } from "../../content/demo.ts";
import { useReducedMotion, useSceneProgress } from "../../motion/index.ts";
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

/** Scroll mapping (W4 §4.5): overview settles → course → calendar. */
const COURSE_UNTIL = 0.47;
const CALENDAR_UNTIL = 0.75;

function viewForProgress(progress: number, pinned: boolean): PlanView {
  if (!pinned || progress < COURSE_UNTIL) return "overview";
  if (progress < CALENDAR_UNTIL) return "courses";
  return "calendar";
}

export function ViewsScene() {
  const copy = useCopy();
  const demo = showcaseStrings[copy.locale];
  const reducedMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
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

  /* The driver spans the pinned travel, and its **start** is placed at the bottom
   * edge of the screen.
   *
   * Three mistakes shaped these numbers, all three reported from real use:
   *   1. A window longer than the hold left the calendar unreachable on a page
   *      scroll (it only appeared to work while the pointer was over the panel).
   *   2. A window that *started* too early meant the first transition fired while
   *      the stage was still coming into view: a reader saw a sliver of 总览 and
   *      it was already 课程.
   *   3. A window that *finished* too early left the page holding a completely
   *      static frame for ~1700px of scrolling after the last projection had
   *      settled — the scrollbar moved and the picture did not, so the section
   *      read as finished while the reader kept scrolling toward its closing line.
   *
   * `startAt: 0.9` is the fix for the second: progress 0 sits at `0.9 × viewport`
   * from the top, i.e. just below the fold, so the overview is current and fully
   * settled while the whole panel is still scrolling up into place.
   *
   * `endAt: −1.41` is the fix for the third: progress now reaches 1 shortly before
   * the panel releases, so the last projection settles into the closing line
   * rather than into a long static hold. `startAt − endAt` = 2.31 viewports = the
   * hold measured at 1440×900 (stage 1800px, panel 576px, pin offset 129px, plus
   * 12svh of headroom ≈ 1203px). Change the stage height in `site.css` and this
   * has to change with it. */
  const { progress } = useSceneProgress(sectionRef, {
    startAt: 0.9,
    endAt: -1.41,
    disabled: !pinned,
  });

  const activeView = viewForProgress(progress, pinned);
  const activeIndex = VIEW_ORDER.indexOf(activeView);

  const panel = (view: PlanView) => (
    <ViewsPanel
      activeView={view}
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
      ref={sectionRef}
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
          <div className="views-stage">
            <div className="views-sticky">
              <ViewSwitcher
                labels={copy.views.views}
                activeIndex={activeIndex}
                anchorPrefix="views"
              />
              {panel(activeView)}
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
      <div className="views-panels" data-active={activeView}>
        <div className="views-panel" data-panel="overview">
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

        <div className="views-panel" data-panel="courses">
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

        <div className="views-panel" data-panel="calendar">
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
