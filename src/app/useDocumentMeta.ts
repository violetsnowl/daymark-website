import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCopy } from "./LocaleProvider.tsx";

/**
 * Keeps language-dependent metadata in step with the active route (W3 §23).
 *
 * The static tags in index.html already describe the Chinese canonical entry;
 * this hook exists so `/en/` never advertises the Chinese title, and so both
 * surfaces carry `hreflang` alternates and their own canonical URL. Only public,
 * non-sensitive values are written.
 */
export function useDocumentMeta(): void {
  const copy = useCopy();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.lang = copy.htmlLang;
    document.documentElement.classList.toggle("lang-en", copy.locale === "en");
    /* `/download/` is the one alternate page under the same shell; its metadata
       follows the same rule as the two home surfaces (W3 §23). */
    const isDownload = location.pathname.includes("/download");
    document.title = (isDownload ? copy.download.meta : copy.metadata).title;

    const head = document.head;

    const meta = (selector: string, attribute: string, value: string) => {
      let element = head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        const match = /^meta\[(.+?)=["']?(.+?)["']?\]$/.exec(selector);
        if (!match) return;
        element.setAttribute(match[1], match[2]);
        head.appendChild(element);
      }
      element.setAttribute(attribute, value);
    };

    const link = (selector: string, href: string, hreflang?: string) => {
      let element = head.querySelector<HTMLLinkElement>(selector);
      if (!element) {
        element = document.createElement("link");
        element.rel = hreflang ? "alternate" : "canonical";
        if (hreflang) element.hreflang = hreflang;
        head.appendChild(element);
      }
      element.href = href;
    };

    const { title, description } = isDownload ? copy.download.meta : copy.metadata;
    meta('meta[name="description"]', "content", description);
    meta('meta[property="og:title"]', "content", title);
    meta('meta[property="og:description"]', "content", description);
    meta('meta[property="og:locale"]', "content", copy.locale === "en" ? "en" : "zh_CN");
    meta('meta[name="twitter:title"]', "content", title);
    meta('meta[name="twitter:description"]', "content", description);

    const pageZh = isDownload ? "https://daymark.top/download/" : "https://daymark.top/";
    const pageEn = isDownload ? "https://daymark.top/en/download/" : "https://daymark.top/en/";
    const canonical = copy.locale === "en" ? pageEn : pageZh;
    link('link[rel="canonical"]', canonical);
    meta('meta[property="og:url"]', "content", canonical);
    link('link[rel="alternate"][hreflang="zh-CN"]', pageZh, "zh-CN");
    link('link[rel="alternate"][hreflang="en"]', pageEn, "en");
    link('link[rel="alternate"][hreflang="x-default"]', pageZh, "x-default");
  }, [copy, location.pathname]);
}
