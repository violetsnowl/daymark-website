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
  import.meta.env.VITE_GITHUB_URL ?? "https://github.com/a161858970-ux/Daymark";
