import { configDefaults, defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  // tsconfig.json sets `jsx: "preserve"` for Next; esbuild would otherwise fall back to the
  // classic runtime and blow up on an undefined `React`.
  esbuild: { jsx: "automatic" },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    testTimeout: 20000,
    // The live suite needs a real server and a node environment; it runs from
    // vitest.integration.config.ts (`pnpm test:integration`), never from the default run.
    exclude: [...configDefaults.exclude, "src/test/integration/**"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // `server-only` throws by design when a bundler resolves its browser entry. Vitest's
      // jsdom environment picks exactly that entry, so every server module would fail to
      // import. Alias it to an empty module — the guard still works in the real build.
      "server-only": path.resolve(__dirname, "./src/test/empty-module.ts"),
    },
  },
});
