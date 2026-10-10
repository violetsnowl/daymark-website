import { BrandMark } from "./BrandMark.tsx";
import { LanguageSwitch } from "./LanguageSwitch.tsx";
import { useLocale } from "../../app/LocaleProvider.tsx";

/**
 * Footer — identity, navigation, state, legal (W4 §10).
 *
 * This is the reduced first-prototype footer: it exists because the About
 * anchor and the language control need a real destination. Group headings and
 * density stay well below a conventional SaaS footer; the full footer with
 * privacy and terms belongs to a later stage.
 */
export function SiteFooter() {
  const { copy } = useLocale();

  return (
    <footer className="site-footer" id="about">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <BrandMark className="site-footer-mark" />
          <p className="site-footer-name">
            {copy.footer.brandCn ? <strong>{copy.footer.brandCn}</strong> : null}
            <small>{copy.footer.brandEn}</small>
          </p>
          <p className="site-footer-line">{copy.footer.line}</p>
        </div>

        <nav className="site-footer-groups" aria-label={copy.nav.homeLabel}>
          {copy.footer.groups.map((group) => (
            <div className="site-footer-group" key={group.title}>
              <h2 className="site-footer-group-title">{group.title}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} rel="noreferrer" target="_blank">
                        {link.label}
                      </a>
                    ) : (
                      <a href={`${copy.urlPrefix}/${link.href}`}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="container site-footer-base">
        <LanguageSwitch />
        <p className="site-footer-legal">{copy.footer.legal}</p>
        <p className="site-footer-note">{copy.footer.note}</p>
      </div>
    </footer>
  );
}
