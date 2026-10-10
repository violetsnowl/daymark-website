import { cn } from "./cn.ts";
import { en } from "./en.ts";
import type { Locale, SiteCopy } from "./types.ts";

export type { Locale, SiteCopy } from "./types.ts";
export { showcase, showcaseStrings } from "./demo.ts";

export const copies: Record<Locale, SiteCopy> = { cn, en };

/** The prototype's only hard language boundary (W3 §2.1). */
export const EN_PREFIX = "/en";

const STORAGE_KEY = "daymark-language";

/** Chinese is canonical: anything that is not the /en subtree is Chinese. */
export function localeFromPath(pathname: string): Locale {
  const normalised = pathname.replace(/\/+$/, "").toLowerCase();
  return normalised === EN_PREFIX || normalised.startsWith(`${EN_PREFIX}/`) ? "en" : "cn";
}

/**
 * The stored value preserves an explicit choice across pages. It is only read
 * for exact `/` entry (see resolveEntryPath) and is not required for privacy
 * modes where storage is unavailable.
 */
export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "cn" ? stored : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — the choice simply does not persist */
  }
}

type GlobalWithNavigator = typeof globalThis & {
  navigator?: { languages?: readonly string[]; language?: string };
};

/**
 * `/` and `/en/` are separate canonical surfaces and the Chinese site must never
 * be a redirect target that visitors cannot leave (W2 §2.3). English is only
 * inferred for an exact `/` entry, before the visitor has expressed a choice,
 * and never for any other path (which would hide content or fight the router).
 */
export function resolveEntryPath(pathname: string, search = ""): string | null {
  if (pathname !== "/") return null;
  if (readStoredLocale()) return null;
  const navigatorLike = (globalThis as GlobalWithNavigator).navigator;
  if (!navigatorLike) return null;
  const languages = navigatorLike.languages?.length
    ? navigatorLike.languages
    : navigatorLike.language
      ? [navigatorLike.language]
      : [];
  return languages.some((tag) => /^en\b/i.test(tag)) ? `${EN_PREFIX}/${search}` : null;
}
