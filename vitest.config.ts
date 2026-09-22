import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["tests/**/*.test.ts"],
    // Builds dist/ once, so no test file rebuilds it while another is running it.
    globalSetup: ["tests/global-setup.ts"],
  },
});
