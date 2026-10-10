import { useEffect, useRef } from "react";
import { useCopy } from "../../app/LocaleProvider.tsx";
import { showcase, showcaseStrings } from "../../content/demo.ts";
import { appUrl } from "../../content/config.ts";
import { DESKTOP_QUERY, useMediaQuery, useReducedMotion } from "../../motion/index.ts";
import { AnchorButton, PrimaryButton } from "../site/Buttons.tsx";
import {
  ItemRow,
  ProductBrand,
  ProductSidebar,
  ProductWindow,
} from "../product/ProductWindow.tsx";

/**
 * Scene 00 — Opening / Hero (W3 §7, §8).
 *
 * Composition: editorial copy on the left, one real Daymark surface on the
 * lower right, a single ambient light field behind it. Nothing else (W1 §2.2).
 */
export function HeroScene() {
  const copy = useCopy();
  const demo = showcaseStrings[copy.locale];
  const items = showcase[copy.locale].heroItems;
  const reducedMotion = useReducedMotion();
  const pointerCapable = useMediaQuery(DESKTOP_QUERY);
  const sceneRef = useRef<HTMLElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);

  /**
   * Pointer response is atmospheric, not mechanical (W2 §6.5): the product
   * surface moves at most a couple of pixels, the light field a little more.
   * Both are smoothed, and neither is required to read the page.
   */
  useEffect(() => {
    const scene = sceneRef.current;
    const surface = windowRef.current;
    if (!scene || !surface || !pointerCapable || reducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let frame = 0;

    const render = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      surface.style.setProperty("--pointer-x", currentX.toFixed(3));
      surface.style.setProperty("--pointer-y", currentY.toFixed(3));
      scene.style.setProperty("--env-shift-x", `${(currentX * 14).toFixed(2)}px`);
      scene.style.setProperty("--env-shift-y", `${(currentY * 10).toFixed(2)}px`);
      const settled =
        Math.abs(targetX - currentX) < 0.001 && Math.abs(targetY - currentY) < 0.001;
      frame = settled ? 0 : window.requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = scene.getBoundingClientRect();
      targetX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const onPointerLeave = () => {
      targetX = 0;
      targetY = 0;
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    scene.addEventListener("pointermove", onPointerMove);
    scene.addEventListener("pointerleave", onPointerLeave);
    return () => {
      scene.removeEventListener("pointermove", onPointerMove);
      scene.removeEventListener("pointerleave", onPointerLeave);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [pointerCapable, reducedMotion]);

  return (
    <section
      ref={sceneRef}
      className="hero"
      aria-labelledby="hero-title"
      data-reduced-motion={reducedMotion}
    >
      <div className="env-light hero-env" aria-hidden="true" />

      <div className="hero-inner container">
        <div className="hero-copy">
          {/* W3 Prototype Baseline (locked 2026-10-08): headline → description →
              CTA → product surface. No eyebrow layer above the headline. */}
          <h1 id="hero-title" className="hero-title display">
            {copy.hero.title}
          </h1>
          <p className="lead hero-description">{copy.hero.description}</p>
          <div className="hero-actions">
            <PrimaryButton to={appUrl} external>
              {copy.hero.primaryCta}
            </PrimaryButton>
            <AnchorButton href="#capture" trailing={<span aria-hidden="true">↓</span>}>
              {copy.hero.secondaryCta}
            </AnchorButton>
          </div>
        </div>

        <div className="hero-stage">
          <div className="hero-surface" ref={windowRef}>
            <ProductWindow
              className="product-window--hero"
              ariaLabel={copy.hero.product.windowLabel}
              brand={<ProductBrand cn={copy.nav.brandCn} en={copy.nav.brandEn} />}
              sidebar={
                <ProductSidebar
                  labels={demo.nav}
                  navLabel={copy.capture.product.windowLabel}
                  syncNote={demo.syncNote}
                />
              }
            >
              <div className="product-page-header">
                <p className="product-today">{demo.today}</p>
                <p className="product-h1">{demo.pageTitle}</p>
              </div>
              <div className="product-list">
                <p className="product-section-label">{demo.sectionTitle}</p>
                <ul>
                  {items.map((item, index) => (
                    <ItemRow
                      key={item.title}
                      title={item.title}
                      meta={`${item.course} · ${demo.duePrefix} ${item.time}`}
                      focused={index === 0}
                    />
                  ))}
                </ul>
                <p className="product-list-note">{demo.moreCount}</p>
              </div>
            </ProductWindow>
          </div>
        </div>
      </div>
    </section>
  );
}
