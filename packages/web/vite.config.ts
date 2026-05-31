import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      graphql: path.resolve(__dirname, "../../node_modules/graphql"),
    },
    dedupe: ["graphql"],
  },
  build: {
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          graphql: ["graphql"],
          federation: ["@theguild/federation-composition"],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
