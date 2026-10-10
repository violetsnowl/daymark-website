import type { ReactNode } from "react";
import { BrandMark } from "../site/BrandMark.tsx";

export type ProductView = "overview" | "courses" | "calendar";

/**
 * A Daymark item as the product actually renders it (`apps/web` ItemList):
 * a completion control, a title, and one meta line. The website never invents a
 * second layout for an item.
 */
export function ItemRow({
  title,
  meta,
  status = "INCOMPLETE",
  focused = false,
  marked = false,
  interactive = false,
  onActivate,
}: {
  title: string;
  meta: string;
  status?: "INCOMPLETE" | "COMPLETE";
  /** A quiet cue that the interface is alive, not decoration (W1 §4). */
  focused?: boolean;
  /** Accent-soft wash marking the item the scene is talking about. */
  marked?: boolean;
  interactive?: boolean;
  onActivate?: () => void;
}) {
  const rowClass = [
    "item-row",
    status === "COMPLETE" ? "is-complete" : "",
    focused ? "is-focused" : "",
    marked ? "is-marked" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const completion = (
    <span className="item-completion" aria-hidden="true">
      <span className="item-completion-indicator">
        {status === "COMPLETE" ? "✓" : ""}
      </span>
    </span>
  );

  const body = (
    <>
      <span className="item-title">{title}</span>
      <span className="item-meta">{meta}</span>
    </>
  );

  if (interactive) {
    return (
      <li className={rowClass}>
        {completion}
        <button type="button" className="item-body" onClick={onActivate}>
          {body}
        </button>
      </li>
    );
  }

  return (
    <li className={rowClass}>
      {completion}
      <span className="item-body">{body}</span>
    </li>
  );
}

export function ProductNavGlyph({ view }: { view: ProductView }) {
  if (view === "overview") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M6.5 7.5h11M6.5 12h11M6.5 16.5h7" />
        <circle cx="4" cy="7.5" r=".75" />
        <circle cx="4" cy="12" r=".75" />
        <circle cx="4" cy="16.5" r=".75" />
      </svg>
    );
  }
  if (view === "courses") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M4.5 6.5c2.8-.9 5.3-.6 7.5.9v11c-2.2-1.5-4.7-1.8-7.5-.9zM19.5 6.5c-2.8-.9-5.3-.6-7.5.9v11c2.2-1.5 4.7-1.8 7.5-.9z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="4" y="5.5" width="16" height="14" rx="2" />
      <path d="M8 3.8v3.4M16 3.8v3.4M4 9.5h16M8 13h2M14 13h2M8 16.5h2" />
    </svg>
  );
}

export const PRODUCT_VIEWS: ProductView[] = ["overview", "courses", "calendar"];

/** The identity line, identical everywhere the product window appears. */
export function ProductBrand({ cn, en }: { cn: string; en: string }) {
  return (
    <span className="product-brand">
      <BrandMark className="product-brand-mark" />
      <span className="product-brand-text">
        {cn ? <strong>{cn}</strong> : null}
        <small>{en}</small>
      </span>
    </span>
  );
}

/**
 * The product's real navigation. `active` keeps the highlighted view in step
 * with whatever Scene 04 is currently projecting.
 */
export function ProductSidebar({
  labels,
  active = "overview",
  navLabel,
  syncNote,
}: {
  labels: Record<ProductView, string>;
  active?: ProductView;
  navLabel: string;
  syncNote: string;
}) {
  return (
    <>
      <ul className="product-nav" aria-label={navLabel}>
        {PRODUCT_VIEWS.map((view) => (
          <li
            key={view}
            data-product-view={view}
            className={view === active ? "is-active" : undefined}
          >
            <ProductNavGlyph view={view} />
            <span>{labels[view]}</span>
          </li>
        ))}
      </ul>
      <p className="product-sync">{syncNote}</p>
    </>
  );
}

export function ProductWindow({
  ariaLabel,
  brand,
  sidebar,
  children,
  className,
}: {
  ariaLabel: string;
  /** Identity line; kept visible on narrow screens where nav labels cannot fit. */
  brand: ReactNode;
  sidebar: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={["product-window", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="product-window-sidebar" aria-hidden="true">
        {brand}
        {sidebar}
      </div>
      <div className="product-window-main" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}
