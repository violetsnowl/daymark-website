import type { ReactNode } from "react";

/**
 * The editorial header shared by every scene from 03 onward (W4 §3–§9).
 *
 * The small low-contrast index is a chapter marker in the site's editorial
 * language, approved at review: it keeps the page reading as one continuous
 * document rather than a stack of independent sections.
 */
export function SceneHeader({
  id,
  index,
  title,
  description,
  className,
}: {
  /** id for the heading, so the section can be labelled by it. */
  id: string;
  index?: string;
  /** A node, not just a string: Scene 03 wraps part of its statement in a
      nowrap span so the line never breaks inside 「“做什么”。」(review P2-1). */
  title: ReactNode;
  description?: string;
  className?: string;
}) {
  return (
    <header className={["scene-header", className].filter(Boolean).join(" ")}>
      {index ? (
        <span className="scene-index" aria-hidden="true">
          {index}
        </span>
      ) : null}
      <h2 id={id} className="scene-title display">
        {title}
      </h2>
      {description ? <p className="scene-description">{description}</p> : null}
    </header>
  );
}
