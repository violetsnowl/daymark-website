import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: "127.0.0.1",
    watch: {
      /* Local review tooling writes screenshots and profiles next to the
         project, and editors on Windows briefly lock temp files while saving.
         Polling avoids the native watcher's EBUSY crash in both cases. */
      ignored: ["**/.review/**", "**/dist/**"],
      usePolling: true,
      interval: 400,
    },
  },
  build: {
    target: "es2020",
    cssTarget: "chrome110",
    sourcemap: false,
  },
});
