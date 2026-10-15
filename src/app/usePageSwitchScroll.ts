import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { barePath, localeFromPath } from "../content/index.ts";

/**
 * Page switches start at the top (user ruling, 2026-10-15).
 *
 * The site is a client-side router, so a `Link` to another page leaves the
 * document's scroll offset untouched: a homepage read at y=2200 dropped the
 * reader at the very bottom of /download/ (measured 387 = that page's whole
 * range), and 「回到首页」 carried it back to y=2200. A page switch now starts
 * where a freshly opened page would start.
 *
 * Three rules, each one ruled on:
 *   1. Forward navigations land at the top — in a layout effect, i.e. before the
 *      first paint, so nothing is ever seen sliding down from the old offset.
 *      `behavior: "instant"` because the document's global `scroll-behavior:
 *      smooth` would otherwise turn the reset into a visible scroll to the top.
 *   2. The browser's back/forward keeps its own restoration (POP is left alone):
 *      it already returns the reader where they were, and that is the behaviour
 *      people expect from a back button.
 *   3. A language switch is not "another page": it keeps the reader's place, and
 *      an arrival carrying a #section still aims at that section.
 */
export function usePageSwitchScroll() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previous = useRef<{ key: string; page: string; locale: string } | null>(null);

  useLayoutEffect(() => {
    const next = {
      key: location.key,
      page: barePath(location.pathname),
      locale: localeFromPath(location.pathname),
    };
    const last = previous.current;
    previous.current = next;

    /* First load: the browser's own landing (a #section URL is handled by the
       browser, not by us). Same key: a re-run of the entry we already handled. */
    if (!last || last.key === next.key) return;
    if (navigationType === "POP") return;
    if (location.hash) return;
    /* Same page, other language: the reader stays where they were reading. */
    if (last.page === next.page && last.locale !== next.locale) return;

    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location, navigationType]);
}
