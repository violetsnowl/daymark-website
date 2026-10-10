import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  EN_PREFIX,
  copies,
  localeFromPath,
  storeLocale,
  type Locale,
  type SiteCopy,
} from "../content/index.ts";

interface LocaleContextValue {
  locale: Locale;
  copy: SiteCopy;
  /** Switches the whole page language, keeping the current section if possible. */
  switchTo: (next: Locale, hash?: string) => void;
  /** Prefixes a site path with the active language surface. */
  href: (path: string) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const locale = localeFromPath(location.pathname);
  const copy = copies[locale];

  const href = useCallback(
    (path: string) => {
      const normalised = path.startsWith("/") ? path : `/${path}`;
      return `${copy.urlPrefix}${normalised}`;
    },
    [copy.urlPrefix],
  );

  /**
   * Language switching navigates to the equivalent surface rather than
   * translating in place (W3 §2.3), so there is never a moment where both
   * languages are on screen together.
   */
  const switchTo = useCallback(
    (next: Locale, hash?: string) => {
      if (next === locale) return;
      storeLocale(next);
      const target = next === "en" ? EN_PREFIX : "/";
      navigate(`${target}${location.search ?? ""}${hash ?? ""}`);
    },
    [locale, location.search, navigate],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, copy, switchTo, href }),
    [locale, copy, switchTo, href],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used inside LocaleProvider");
  return context;
}

export function useCopy(): SiteCopy {
  return useLocale().copy;
}
