import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLocale } from "../../app/LocaleProvider.tsx";
import { useReducedMotion } from "../../motion/index.ts";
import { BrandMark } from "./BrandMark.tsx";
import { LanguageSwitch } from "./LanguageSwitch.tsx";
import { PrimaryButton } from "./Buttons.tsx";

/** Minimal top bar (W3 §6): logo, three anchors, language, one CTA. */
export function SiteNav() {
  const { copy, href } = useLocale();
  const reducedMotion = useReducedMotion();
  const { pathname } = useLocation();
  /** On the download page the CTA would point back at the page itself
   *  (it leads to /download/), so the top action becomes the way home. */
  const onDownloadPage = pathname.includes("/download");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 64);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  /* The menu is a functional overlay (W3 §6.5): Escape closes it and returns
     focus to the trigger, and the page behind it stops scrolling. */
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKeyDown);
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
      target.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
      window.history.replaceState(null, "", `#${sectionId}`);
    },
    [reducedMotion, href],
  );

  return (
    <header className={`site-nav${scrolled ? " is-scrolled" : ""}`} data-scrolled={scrolled}>
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

      {menuOpen ? (
        <div
          id="site-menu"
          ref={panelRef}
          className="site-menu"
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={copy.nav.menuOpen}
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
              <PrimaryButton to={href("/download/")}>
                {copy.nav.enterApp}
              </PrimaryButton>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
