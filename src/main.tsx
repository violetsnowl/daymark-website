import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App.tsx";
import { resolveEntryPath, storeLocale } from "./content/index.ts";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/site.css";

/**
 * Language entry rule (W2 §2.3, W4 §12.2).
 *
 * `/` and `/en/` are both complete, canonical surfaces. An exact `/` visit with
 * no stored preference and an English-first browser is the only case that lands
 * on `/en/`; the redirect does not run for any other path, and choosing 中文
 * always writes an explicit preference so the visitor is never bounced back.
 */
const entryPath = resolveEntryPath(window.location.pathname, window.location.search);
if (entryPath) {
  storeLocale("en");
  window.history.replaceState(null, "", entryPath);
}

const container = document.getElementById("root");
if (!container) throw new Error("#root container is missing");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
