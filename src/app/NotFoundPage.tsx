import { Link } from "react-router-dom";
import { useCopy, useLocale } from "./LocaleProvider.tsx";

/**
 * 404 — no easter eggs, no jokes, no spectacle (W4 §26). Same canvas, same
 * type, one calm way back.
 */
export function NotFoundPage() {
  const copy = useCopy();
  const { href } = useLocale();
  const isEnglish = copy.locale === "en";

  return (
    <main id="main" className="not-found">
      <div className="env-light" aria-hidden="true" />
      <div className="container not-found-inner">
        <p className="eyebrow">{isEnglish ? "404" : "404"}</p>
        <h1 className="not-found-title display">
          {isEnglish
            ? "There is nothing here yet."
            : "这里暂时没有你要找的东西。"}
        </h1>
        <p className="lead">
          {isEnglish ? "It may belong somewhere else." : "也许它应该在别的位置。"}
        </p>
        <p className="not-found-action">
          <Link className="btn btn-primary" to={href("/")}>
            {isEnglish ? "Back to Daymark" : "回到拾序"}
          </Link>
        </p>
      </div>
    </main>
  );
}
