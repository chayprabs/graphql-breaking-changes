import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "robots.txt", "sitemap.xml"],
      manifest: {
        name: "GraphQLGuard",
        short_name: "GraphQLGuard",
        description:
          "Diff two GraphQL schemas online — breaking changes, operation coverage, federation checks.",
        theme_color: "#2563eb",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,txt,xml}"],
        navigateFallback: "/index.html",
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      graphql: path.resolve(__dirname, "../../node_modules/graphql"),
    },
    dedupe: ["graphql"],
  },
  worker: {
    format: "es",
  },
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("monaco-editor") || id.includes("@monaco-editor")) {
            return "monaco";
          }
          if (id.includes("@theguild/federation-composition")) {
            return "federation";
          }
          if (id.includes("node_modules/graphql")) {
            return "graphql";
          }
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
