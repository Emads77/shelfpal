import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode !== "test" &&
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "ShelfPal",
          short_name: "ShelfPal",
          description: "Catalogue your home library",
          start_url: "/",
          display: "standalone",
          background_color: "#f7efe0",
          theme_color: "#3b2a1e",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            {
              src: "/icons/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//, /^\/admin\//, /^\/static\//],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "api",
                networkTimeoutSeconds: 5,
                matchOptions: { ignoreVary: true },
                cacheableResponse: { statuses: [200] },
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 7 * 24 * 60 * 60,
                },
              },
            },
          ],
        },
      }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    include: ["src/**/*.test.{js,jsx}"],
    clearMocks: true,
  },
}));
