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
    exclude: ["**/node_modules/**", "**/tests/e2e/**", ".claude/**"],
  },
})
