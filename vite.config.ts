import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/leaf.svg"],
      manifest: {
        id: "/",
        name: "Sage",
        short_name: "Sage",
        description: "思ったこと・学び・気づきをその場で記録し、Life Agentへ届ける入口",
        theme_color: "#4b6b4f",
        background_color: "#faf8f3",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Never cache the API: offline writes go through the IndexedDB
        // outbox instead, so a stale cached response here must not be
        // mistaken for a successful submission.
        navigateFallbackDenylist: [/^\/functions\//],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: {
    port: 5173,
  },
});
