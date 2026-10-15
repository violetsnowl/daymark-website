import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "../../app/LocaleProvider.tsx";
import { useReducedMotion } from "../../motion/index.ts";
import { BrandMark } from "./BrandMark.tsx";
import { LanguageSwitch } from "./LanguageSwitch.tsx";
import { PrimaryButton } from "./Buttons.tsx";

/**
 * The phone sheet's anchor jump, animated by hand — **phone only** (2026-10-13):
 * the desktop bar keeps the browser's own smooth scroll, which the user calls
 * perfect, and only the phone was ever in scope.
 *
 * Two things the naive version got wrong (measured on a phone):
 *   1. `window.scrollTo(y)` obeys the global `scroll-behavior: smooth`, so every
 *      frame of a hand-written animation became its own smooth scroll — a double
 *      animation that read as "slow to start, constant to the end" (user report).
 *      Every frame here passes `behavior: "instant"`.
 *   2. Duration only scales with distance; the curve is the site's own
 *      `--ease-out` (cubic-bezier(0.22, 0.61, 0.36, 1)), so the jump starts
 *      promptly and spends its last stretch *arriving*.
 */
const SCROLL_MIN_MS = 420;
const SCROLL_MAX_MS = 900;
let scrollAnimationFrame = 0;

function cancelAnimatedScroll() {
  if (scrollAnimationFrame) {
    window.cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = 0;
  }
}

/** cubic-bezier(0.22, 0.61, 0.36, 1) — the `--ease-out` token, solved. */
function easeOutToken(t: number): number {
  const x1 = 0.22;
  const y1 = 0.61;
  const x2 = 0.36;
  const y2 = 1;
  const bezier = (a: number, b: number, u: number) => {
    const v = 1 - u;
    return 3 * v * v * u * a + 3 * v * u * u * b + u * u * u;
  };
  let low = 0;
  let high = 1;
  let u = t;
  for (let i = 0; i < 20; i += 1) {
    const x = bezier(x1, x2, u);
    if (Math.abs(x - t) < 0.0005) break;
    if (x < t) low = u;
    else high = u;
    u = (low + high) / 2;
  }
  return bezier(y1, y2, u);
}

function animateScrollTo(targetY: number, reducedMotion: boolean) {
  cancelAnimatedScroll();
  const startY = window.scrollY;
  const delta = targetY - startY;
  if (reducedMotion || Math.abs(delta) < 2) {
    window.scrollTo({ top: targetY, behavior: "instant" });
    return;
  }
  const duration = Math.min(SCROLL_MAX_MS, Math.max(SCROLL_MIN_MS, Math.abs(delta) * 0.55));
  const started = performance.now();
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / duration);
    window.scrollTo({ top: startY + delta * easeOutToken(t), behavior: "instant" });
    scrollAnimationFrame = t < 1 ? window.requestAnimationFrame(step) : 0;
  };
  scrollAnimationFrame = window.requestAnimationFrame(step);
}

/** Minimal top bar (W3 §6): logo, three anchors, language, one CTA. */
export function SiteNav() {
  const { copy, href } = useLocale();
  const reducedMotion = useReducedMotion();
  const { pathname } = useLocation();
  /** On the download page the CTA would point back at the page itself
   *  (it leads to /download/), so the top action becomes the way home. */
  const onDownloadPage = pathname.includes("/download");
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /* The menu is a functional overlay (W3 §6.5): Escape closes it and returns
     focus to the trigger, and the page behind it stops scrolling. */
  useEffect(() => {
    const stop = () => cancelAnimatedScroll();
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      triggerRef.current?.focus();
    };
    /* The sheet does not cover the page (user ruling, 2026-10-13): the page
       below stays visible, but a tap there must only close the menu — nothing
       underneath may react. `inert` gives that without a scrim, and keeps the
       background out of the tab order while the dialog is open. */
    const outside = Array.from(
      document.querySelectorAll<HTMLElement>(".skip-link, main, footer"),
    );
    for (const node of outside) node.inert = true;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    /* `preventScroll` matters: a plain focus() asks the browser to bring the
       panel into view, and because the panel lives inside the sticky bar the
       target it computes is wrong — the page itself jumped up by ~470px the
       moment the sheet opened (measured 1200 → 729; user report 2026-10-13:
       "会把当前所在页面往下挤一点"). Focus still moves into the dialog. */
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
      for (const node of outside) node.inert = false;
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  /** Anchor navigation respects reduced motion but works without JavaScript too. */
  const goToSection = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string, options?: { sheet?: boolean }) => {
      const target = document.getElementById(sectionId);
      if (!target) {
        /* The sections live on the home page. From /download/ (or the 404) the
           honest move is to go there and land on the section itself. */
        event.preventDefault();
        setMenuOpen(false);
        window.location.assign(`${href("/")}#${sectionId}`);
        return;
      }
      event.preventDefault();
      setMenuOpen(false);
      if (!options?.sheet) {
        /* Desktop bar: the browser's own smooth scroll, exactly as before the
           phone work — the user calls this one perfect and only the phone was in
           scope (2026-10-13). */
        target.scrollIntoView({
          behavior: reducedMotion ? "auto" : "smooth",
          block: "start",
        });
        window.history.replaceState(null, "", `#${sectionId}`);
        return;
      }
      /* Phone sheet: hand-animated (see `animateScrollTo`). Scroll on the next
         frame — the sheet's effect releases the body scroll lock on this commit,
         and scrolling while it is still locked would be a no-op — and aim at the
         section's own `scroll-margin-top` so the landing matches the CSS. */
      window.requestAnimationFrame(() => {
        const margin = Number.parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
        const maxScroll = Math.max(
          0,
          document.documentElement.scrollHeight - window.innerHeight,
        );
        const targetY = Math.max(
          0,
          Math.min(target.getBoundingClientRect().top + window.scrollY - margin, maxScroll),
        );
        animateScrollTo(targetY, reducedMotion);
      });
      window.history.replaceState(null, "", `#${sectionId}`);
    },
    [reducedMotion, href],
  );

  return (
    <header className="site-nav">
      <div className="site-nav-inner container">
        <Link className="site-brand" to={href("/")} aria-label={copy.nav.homeLabel}>
          <BrandMark className="site-brand-mark" />
          <span className="site-brand-text">
            {copy.nav.brandCn ? <strong>{copy.nav.brandCn}</strong> : null}
            <small>{copy.nav.brandEn}</small>
          </span>
        </Link>

        <nav className="site-nav-links" aria-label={copy.nav.homeLabel}>
          {copy.nav.anchors.map((anchor) => (
            <a
              key={anchor.id}
              href={anchor.href}
              onClick={(event) => goToSection(event, anchor.id)}
            >
              {anchor.label}
            </a>
          ))}
        </nav>

        <div className="site-nav-actions">
          <LanguageSwitch className="site-nav-language" />
          {onDownloadPage ? (
            <PrimaryButton to={href("/")} size="small" className="site-nav-cta">
              {copy.nav.backHome}
            </PrimaryButton>
          ) : (
            <PrimaryButton to={href("/download/")} size="small" className="site-nav-cta">
              {copy.nav.enterApp}
            </PrimaryButton>
          )}
          <button
            ref={triggerRef}
            type="button"
            className="site-nav-menu-trigger"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span aria-hidden="true" className="menu-glyph" />
            {menuOpen ? copy.nav.menuClose : copy.nav.menuOpen}
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        ref={panelRef}
        className="site-menu"
        data-open={menuOpen ? "true" : "false"}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={copy.nav.menuOpen}
        aria-hidden={menuOpen ? undefined : true}
      >
        <nav className="site-menu-links" aria-label={copy.nav.homeLabel}>
          {copy.nav.anchors.map((anchor) => (
            <a
              key={anchor.id}
              href={anchor.href}
              onClick={(event) => goToSection(event, anchor.id, { sheet: true })}
            >
              {anchor.label}
            </a>
          ))}
        </nav>
        <div className="site-menu-foot">
          <LanguageSwitch />
          {onDownloadPage ? (
            <PrimaryButton to={href("/")}>{copy.nav.backHome}</PrimaryButton>
          ) : (
            <PrimaryButton to={href("/download/")}>{copy.nav.enterApp}</PrimaryButton>
          )}
        </div>
      </div>
    </header>
  );
}
