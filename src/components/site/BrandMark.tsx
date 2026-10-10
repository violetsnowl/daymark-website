/**
 * The Daymark / 拾序 brand mark, drawn as the same identifier the product app
 * uses in its navigation (apps/web `.brand-mark`): a calm, unclosed document
 * outline with two text lines. Geometry is not reinterpreted (W0 §29) — no
 * gradient, no glow, no rotation, no animation.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 28"
      width="21"
      height="24.5"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 13.5A12 12 0 0 1 13 1.5h0.5A9.5 9.5 0 0 1 23 11v6.5A9.5 9.5 0 0 1 13.5 27H10.5A9.5 9.5 0 0 1 1 17.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeOpacity="0.72"
      />
      <path
        d="M7 9.6h8.6M7 14.9h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
