/**
 * Public, non-sensitive website configuration (W4 §35).
 *
 * Only values that are safe to ship in a browser bundle live here. No database
 * URL, no service key, no private API host, no model key — ever.
 */

export const appUrl = import.meta.env.VITE_APP_URL ?? "https://app.daymark.top";

export const siteUrl = import.meta.env.VITE_SITE_URL ?? "https://daymark.top";

/** Public destination for the GitHub link, once release policy allows it. */
export const githubUrl =
  import.meta.env.VITE_GITHUB_URL ?? "https://github.com/violetsnowl/Daymark";

/**
 * Download-page data sources (2026-10-12).
 *
 * Both URLs point at the API host's own mirror, which the release flow keeps
 * current — the Android alias is replaced on every release, and the manifest is
 * the same file the app itself reads to update. The page therefore always
 * links to the latest build without anyone editing copy.
 */
export const downloadConfig = {
  /** Permanent alias, replaced server-side on every release. */
  androidApk: "https://api.daymark.top/update/app-universal-release.apk",
  /** Update manifest (served with `access-control-allow-origin: *`). */
  manifestUrl: "https://api.daymark.top/update/latest.json",
  /** Windows target used until the manifest answers — and if it never does. */
  windowsFallback: "https://api.daymark.top/update/daymark_0.2.2_x64-setup.exe",
} as const;
