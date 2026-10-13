import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App.tsx";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/site.css";

/**
 * Language entry rule (user ruling, 2026-10-13).
 *
 * Chinese is the only default: `/` is always the Chinese surface, whatever the
 * browser prefers, and `/en/` is entered by choosing it with the language
 * toggle — never by inference. (Until this date an English-first browser was
 * rewritten to `/en/` on entry; that read as "the site defaults to English"
 * and was removed. W2 §2.3's rule that the Chinese surface must never be a
 * redirect target visitors cannot leave still holds.)
 */

const container = document.getElementById("root");
if (!container) throw new Error("#root container is missing");

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
