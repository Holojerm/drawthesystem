import { fileURLToPath } from "node:url";

export default defineNuxtConfig({
  compatibilityDate: "2026-08-01",
  modules: ["@nuxt/ui"],
  css: ["~/assets/css/main.css"],
  // The workspace is an app, not a document: no SSR there (Excalidraw, mic, localStorage).
  routeRules: { "/sessions/**": { ssr: false } },
  devServer: { port: Number(process.env.VOICE_PORT ?? 7788) },
  runtimeConfig: {
    // Repo root (parent of web/). Override with SYSDESIGN_ROOT to point at another checkout.
    repoRoot: process.env.SYSDESIGN_ROOT ?? fileURLToPath(new URL("..", import.meta.url)),
  },
  vite: {
    define: { "process.env.IS_PREACT": JSON.stringify("false") },
    optimizeDeps: { include: ["react", "react-dom", "react-dom/client", "@excalidraw/excalidraw"] },
  },
  app: { head: { title: "sysdesign-prep", link: [{ rel: "icon", href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🧭</text></svg>" }] } },
});
