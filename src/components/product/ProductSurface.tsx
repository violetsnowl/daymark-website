import type { ReactNode } from "react";

/**
 * Material B — Product Surface (W2 §4.1).
 *
 * Near-white, precise border, restrained shadow. The showcase sits inside the
 * page rather than levitating above it, and it is never glass.
 */
export function ProductSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["product-surface", className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
