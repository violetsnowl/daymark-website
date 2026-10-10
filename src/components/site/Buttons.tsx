import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type CommonProps = {
  children: ReactNode;
  variant?: "primary" | "quiet";
  size?: "default" | "small";
  className?: string;
  /** Renders a trailing glyph that moves the way the label promises. */
  trailing?: ReactNode;
};

const classNames = (
  variant: "primary" | "quiet",
  size: "default" | "small",
  className?: string,
) =>
  ["btn", `btn-${variant}`, size === "small" ? "btn-small" : "", className]
    .filter(Boolean)
    .join(" ");

/** Same semantic family as the product's primary action (W3 §6.4). */
export function PrimaryButton({
  to,
  children,
  variant = "primary",
  size = "default",
  className,
  trailing,
  external,
  onClick,
}: CommonProps & {
  to: string;
  external?: boolean;
  onClick?: () => void;
}) {
  const classes = classNames(variant, size, className);
  if (external) {
    const isApp = to.startsWith("https://app.");
    return (
      <a
        className={classes}
        href={to}
        target={isApp ? undefined : "_blank"}
        rel={isApp ? undefined : "noreferrer"}
        onClick={onClick}
      >
        {children}
        {trailing}
      </a>
    );
  }
  return (
    <Link className={classes} to={to} onClick={onClick}>
      {children}
      {trailing}
    </Link>
  );
}

/** Same-document anchor: stays a real link, so it works without JavaScript. */
export function AnchorButton({
  href,
  children,
  variant = "quiet",
  size = "default",
  className,
  trailing,
  onNavigate,
}: CommonProps & { href: string; onNavigate?: () => void }) {
  return (
    <a
      className={classNames(variant, size, className)}
      href={href}
      onClick={() => onNavigate?.()}
    >
      {children}
      {trailing}
    </a>
  );
}
