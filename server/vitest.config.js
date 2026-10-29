import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.js"],
    // mongodb-memory-server can take a moment to download/start on first run.
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
