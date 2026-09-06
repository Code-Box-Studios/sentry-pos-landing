import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // A real HTTP client against a real server — no DOM involved.
    environment: "node",
    include: ["src/test/integration/**/*.test.ts"],
    globals: true,
    testTimeout: 60000,
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
