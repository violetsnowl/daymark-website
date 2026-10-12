import { useLocale } from "../../app/LocaleProvider.tsx";
import { AnchorButton, PrimaryButton } from "../site/Buttons.tsx";

/**
 * Scene 09 — Closing (W4 §9).
 *
 * The page is meant to slow down noticeably here. By this point every mechanism has
 * been explained, so the last screen is a name, one line, and one action — nothing
 * else (W4 §9.3). No feature list, no secondary marketing, no product surface: the
 * surfaces have all stopped moving, and this is where that lands.
 *
 * The quiet second action goes *back up* the page rather than forward, because there
 * is nowhere further to go.
 */
export function ClosingScene() {
  const { copy, href } = useLocale();

  return (
    <section id="closing" className="scene scene-closing-final" aria-labelledby="closing-title">
      <div className="container closing-inner">
        <p className="closing-brand">
          {copy.footer.brandCn ? <strong>{copy.footer.brandCn}</strong> : null}
          <small>{copy.footer.brandEn}</small>
        </p>

        <h2 id="closing-title" className="closing-title display">
          {copy.closing.title}
        </h2>

        <p className="closing-subcopy">{copy.closing.subcopy}</p>

        <div className="closing-actions">
          <PrimaryButton to={href("/download/")}>
            {copy.closing.cta}
          </PrimaryButton>
          <AnchorButton href={copy.closing.backTarget} variant="quiet">
            {copy.closing.back}
          </AnchorButton>
        </div>
      </div>
    </section>
  );
}
