import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  // Runs after webServer is confirmed up (reused or freshly started) and
  // before any test — refuses to run at all if that server is writing votes
  // to the production Firestore collection. See tests/e2e/collection-guard.ts.
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    // Playback here is started by a real click, but the play() call lands in an
    // effect a tick later — outside the gesture window Chrome requires for
    // unmuted audio. Without this the playback assertion is flaky rather than wrong.
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  webServer: {
    command: "pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
