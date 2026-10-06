import path from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    // `.claude/**` for the scratch worktrees a coding agent checks out inside
    // the repo: each is a second copy of tests/, so the same suite was
    // collected twice and the reported count doubled.
    // `tests/tour/**` holds Playwright specs (ticket 14's before/after tour) that
    // run under playwright.tour.config.ts, not the unit runner.
    // `.ogcard-verify/**` for the same reason as `.claude/**` above: it is a
    // whole second copy of tests/, so the same submit-route suite is collected
    // twice and its 15 cases fail against the copy's own module graph.
    exclude: [
      "**/node_modules/**",
      "**/tests/e2e/**",
      "**/tests/tour/**",
      ".claude/**",
      ".ogcard-verify/**",
    ],
  },
})
