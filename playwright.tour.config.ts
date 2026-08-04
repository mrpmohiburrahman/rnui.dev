import { defineConfig, devices } from "@playwright/test"

// A standalone config for ticket 14 — the before/after recordings. It is a
// sibling of playwright.config.ts, NOT a project inside it, so the default
// `pnpm exec playwright test` (which reads playwright.config.ts and its
// testDir ./tests/e2e) never collects these specs, and the 119-spec e2e run
// stays clean. Run this one explicitly:
//
//   pnpm exec playwright test -c playwright.tour.config.ts
//
// Two deliberate differences from the e2e config (ticket 14 step 1):
//   - video "on" and a fixed viewport, so the three captured states can be laid
//     side by side at the same size.
//   - NO webServer block. The e2e config's reuseExistingServer cost this repo a
//     full afternoon of phantom failures against a stale build; the tour must
//     attach to whatever server the operator started so it can run against a
//     `main`, a deploy-A and a Studio Dark checkout in turn. Auto-starting one
//     would defeat the entire point.
export default defineConfig({
  testDir: "./tests/tour",
  timeout: 120_000,
  use: {
    baseURL: "http://localhost:3000",
    // The tour records the screen; every run has to be the same size or the
    // three states cannot be compared frame-for-frame.
    video: "on",
    // Without this the grid records as a wall of still Posters — the autoplay
    // never starts, because Chrome blocks unmuted autoplay without a gesture.
    launchOptions: {
      args: ["--autoplay-policy=no-user-gesture-required"],
    },
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Force the viewport over the device default (1280×720) so all three
        // captures are 1440×900.
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
})
