import { useEffect, useState } from "react";
import { useLocale } from "../app/LocaleProvider.tsx";
import { SiteFooter } from "../components/site/SiteFooter.tsx";
import { downloadConfig } from "../content/config.ts";
import { useReducedMotion } from "../motion/index.ts";

type Platform = "android" | "windows" | null;

/**
 * The visitor's device, inferred from the UA.
 *
 * This only decides where the quiet 「为你的设备推荐」 mark goes — it is a hint,
 * never a gate: every download stays one tap away on every device, and a wrong
 * guess costs nothing.
 */
function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent ?? "";
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  return null;
}

interface ReleaseInfo {
  version?: string;
  windowsUrl?: string;
}

/**
 * `/download/` (2026-10-12).
 *
 * The page never hardcodes a version. The Android link is a permanent alias on
 * the API mirror (replaced server-side on every release), and the Windows link
 * is read from the same update manifest the app itself uses — so the page is
 * always the latest release without anyone editing copy. Anything unexpected
 * falls back to a static URL; the downloads must never depend on the request.
 */
export function DownloadPage() {
  const { copy } = useLocale();
  const d = copy.download;
  const reducedMotion = useReducedMotion();

  const [platform, setPlatform] = useState<Platform>(null);
  const [release, setRelease] = useState<ReleaseInfo | null>(null);

  /* Detection runs after the first paint, so the mark arrives as a small
     moment — and so the static render is already complete without it. */
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  /* The manifest is served with `access-control-allow-origin: *` (verified
     2026-10-12), so the browser can read it directly. */
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 8000);
    let alive = true;
    fetch(downloadConfig.manifestUrl, { signal: controller.signal })
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error("bad status")),
      )
      .then(
        (data: { version?: unknown; platforms?: Record<string, { url?: unknown }> }) => {
          if (!alive) return;
          const url = data?.platforms?.["windows-x86_64"]?.url;
          setRelease({
            version: typeof data?.version === "string" ? data.version : undefined,
            windowsUrl:
              typeof url === "string" && url.startsWith("https://") ? url : undefined,
          });
        },
      )
      .catch(() => {
        /* Keep the static fallback — the page must not depend on this call. */
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      alive = false;
      controller.abort();
      window.clearTimeout(timer);
    };
  }, []);

  /* The green line on the recommended card rides its border, following the
     pointer along the nearest edge. Plain pointer math onto the element's own
     custom properties — no state, no re-render. Mouse-only, and disabled under
     reduced motion (the chip carries the meaning in both cases). */
  const handleCardGlow = (event: React.PointerEvent<HTMLLIElement>) => {
    if (event.pointerType !== "mouse") return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    /* Project the pointer onto the nearest edge so the glow segment hugs the
       border instead of floating in the middle of the card. */
    const toLeft = x;
    const toRight = rect.width - x;
    const toTop = y;
    const toBottom = rect.height - y;
    const nearest = Math.min(toLeft, toRight, toTop, toBottom);
    const gx = nearest === toLeft ? 0 : nearest === toRight ? rect.width : x;
    const gy = nearest === toTop ? 0 : nearest === toBottom ? rect.height : y;
    el.style.setProperty("--glow-x", `${gx.toFixed(1)}px`);
    el.style.setProperty("--glow-y", `${gy.toFixed(1)}px`);
  };

  const windowsHref = release?.windowsUrl ?? downloadConfig.windowsFallback;
  const versionLine = release?.version ? `${d.currentVersion} v${release.version}` : null;

  return (
    <>
      <main id="main" className="download-page">
        <div className="env-light" aria-hidden="true" />
        <div className="container download-inner">
          <header className="download-head">
            <p className="eyebrow">{d.eyebrow}</p>
            <h1 className="download-title display">{d.title}</h1>
            <p className="lead download-lead">{d.lead}</p>
          </header>

          <ul className="download-grid">
            <li
              className={`download-card${platform === "android" ? " is-recommended" : ""}`}
              data-platform="android"
              onPointerMove={
                platform === "android" && !reducedMotion ? handleCardGlow : undefined
              }
            >
              {platform === "android" ? (
                <p className="download-recommended">{d.recommended}</p>
              ) : null}
              <h2 className="download-card-name">{d.android.name}</h2>
              <p className="download-card-note">{d.android.note}</p>
              {versionLine ? <p className="download-card-version">{versionLine}</p> : null}
              <a
                className="btn btn-primary download-card-action"
                href={downloadConfig.androidApk}
              >
                {d.android.action}
                <span className="download-arrow" aria-hidden="true">
                  ↓
                </span>
              </a>
            </li>

            <li
              className={`download-card${platform === "windows" ? " is-recommended" : ""}`}
              data-platform="windows"
              onPointerMove={
                platform === "windows" && !reducedMotion ? handleCardGlow : undefined
              }
            >
              {platform === "windows" ? (
                <p className="download-recommended">{d.recommended}</p>
              ) : null}
              <h2 className="download-card-name">{d.windows.name}</h2>
              <p className="download-card-note">{d.windows.note}</p>
              {versionLine ? <p className="download-card-version">{versionLine}</p> : null}
              <a className="btn btn-primary download-card-action" href={windowsHref}>
                {d.windows.action}
                <span className="download-arrow" aria-hidden="true">
                  ↓
                </span>
              </a>
            </li>

            <li className="download-card download-card-web" data-platform="web">
              <h2 className="download-card-name">{d.web.name}</h2>
              <p className="download-card-note">{d.web.note}</p>
              <p className="download-card-coming">{d.web.badge}</p>
            </li>
          </ul>

          <p className="download-footnote">{d.footnote}</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
