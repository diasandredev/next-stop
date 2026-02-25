import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 5000000,
      },
      includeAssets: ["favicon.png", "logo.png", "logo-192.png", "logo-500.png", "robots.txt"],
      manifest: {
        name: "Next Stop - Travel Planner",
        short_name: "Next Stop",
        description: "Plan your perfect trip with Kanban boards, interactive maps, and real-time sync.",
        theme_color: "#09090b",
        background_color: "#09090b",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "logo-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "logo-500.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "logo-500.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            if (id.includes("maplibre-gl") || id.includes("react-map-gl")) return "maps";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
