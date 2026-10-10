import { useLocale } from "../../app/LocaleProvider.tsx";

/**
 * A mode switch, not a pair of decorative labels (W3 §2.3): each half is a real
 * button that changes the whole page language, and the active half stays quiet
 * rather than shouting.
 */
export function LanguageSwitch({ className }: { className?: string }) {
  const { copy, locale, switchTo } = useLocale();

  return (
    <div className={["language-switch", className].filter(Boolean).join(" ")}>
      <span className="sr-only">{copy.nav.languageLabel}</span>
      <button
        type="button"
        className={locale === "cn" ? "is-active" : undefined}
        aria-current={locale === "cn" ? "true" : undefined}
        onClick={() => switchTo("cn")}
      >
        {copy.nav.languageCn}
      </button>
      <span className="language-switch-divider" aria-hidden="true">
        /
      </span>
      <button
        type="button"
        className={locale === "en" ? "is-active" : undefined}
        aria-current={locale === "en" ? "true" : undefined}
        onClick={() => switchTo("en")}
      >
        {copy.nav.languageEn}
      </button>
    </div>
  );
}
