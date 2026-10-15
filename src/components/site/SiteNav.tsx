import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "../../app/LocaleProvider.tsx";
import { useReducedMotion } from "../../motion/index.ts";
import { BrandMark } from "./BrandMark.tsx";
import { LanguageSwitch } from "./LanguageSwitch.tsx";
import { PrimaryButton } from "./Buttons.tsx";

/**
 * In-page scrolling is animated here rather than handed to the browser's own
 * `scroll-behavior: smooth`. Measured (2026-10-13): the native curve spends a
 * long jump at 440px per 45ms of near-constant speed and then stops — on a
 * phone it reads as "线性的刷刷唰飞过去" with no arrival, while the rest of the
 * site ends everything softly. The landing position is the same
 * (`scroll-margin-top` is honoured), the duration scales with the distance, and
 * the curve is easeOutCubic — the character of the `--ease-out` token.
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

function animateScrollTo(targetY: number, reducedMotion: boolean) {
  cancelAnimatedScroll();
  if (reducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }
  const startY = window.scrollY;
  const delta = targetY - startY;
  if (Math.abs(delta) < 2) return;
  const duration = Math.min(SCROLL_MAX_MS, Math.max(SCROLL_MIN_MS, Math.abs(delta) * 0.6));
  const started = performance.now();
  const ease = (t: number) => 1 - (1 - t) ** 3;
  const step = (now: number) => {
    const t = Math.min(1, (now - started) / duration);
    window.scrollTo(0, startY + delta * ease(t));
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
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
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
      /* Compute the landing here (not via scrollIntoView) so the animated scroll
         can be handed an exact target: the section's position minus its
         `scroll-margin-top`, clamped to the document. Scroll on the next frame —
         the menu effect releases the body scroll lock on the same commit, and
         scrolling while it is still locked would be a no-op. The page then
         glides to the section *below the sheet*, which is the point of the small
         sheet (user ruling, 2026-10-13). */
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
              onClick={(event) => goToSection(event, anchor.id)}
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
