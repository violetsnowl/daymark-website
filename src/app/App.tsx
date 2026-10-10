import { Route, Routes } from "react-router-dom";
import { LocaleProvider, useCopy } from "./LocaleProvider.tsx";
import { SiteNav } from "../components/site/SiteNav.tsx";
import { HomePage } from "./HomePage.tsx";
import { NotFoundPage } from "./NotFoundPage.tsx";
import { useDocumentMeta } from "./useDocumentMeta.ts";

/**
 * Route model (W3 §2.1): `/` is the Chinese canonical surface and `/en/` is the
 * English one. `/en` is accepted as the same page rather than redirected away,
 * so a hand-typed URL never lands on an error.
 */
function SiteShell() {
  const copy = useCopy();
  useDocumentMeta();

  return (
    <>
      <a className="skip-link" href="#main">
        {copy.skipToContent}
      </a>
      <SiteNav />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/en" element={<HomePage />} />
        <Route path="/en/" element={<HomePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export function App() {
  return (
    <LocaleProvider>
      <SiteShell />
    </LocaleProvider>
  );
}
