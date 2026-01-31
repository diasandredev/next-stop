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
      includeAssets: ["favicon.png", "favicon1.png", "robots.txt", "placeholder.svg"],
      manifest: {
        name: "NextStop",
        short_name: "NextStop",
        description: "Travel planner",
        theme_color: "#ffffff",
        icons: [
          {
            src: "favicon-192-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "favicon-512-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "favicon-512-512.png",
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
