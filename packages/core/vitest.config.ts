import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      graphql: path.resolve(__dirname, "../../node_modules/graphql"),
    },
    dedupe: ["graphql"],
  },
  test: {
    environment: "node",
  },
});
