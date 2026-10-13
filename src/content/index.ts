import { cn } from "./cn.ts";
import { en } from "./en.ts";
import type { Locale, SiteCopy } from "./types.ts";

export type { Locale, SiteCopy } from "./types.ts";
export { showcase, showcaseStrings } from "./demo.ts";

export const copies: Record<Locale, SiteCopy> = { cn, en };

/** The prototype's only hard language boundary (W3 §2.1). */
export const EN_PREFIX = "/en";

/* Records an explicit language choice so it survives navigation. Nothing is
   inferred from the browser. */
const STORAGE_KEY = "daymark-language";

/** Chinese is canonical: anything that is not the /en subtree is Chinese. */
export function localeFromPath(pathname: string): Locale {
  const normalised = pathname.replace(/\/+$/, "").toLowerCase();
  return normalised === EN_PREFIX || normalised.startsWith(`${EN_PREFIX}/`) ? "en" : "cn";
}

export function storeLocale(locale: Locale): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — the choice simply does not persist */
  }
}

/* There is no entry redirect: `/` is always Chinese and `/en/` is reached only
   by choosing English with the toggle (user ruling, 2026-10-13 — the earlier
   English-first browser inference was removed because it read as "the site
   defaults to English"). */
