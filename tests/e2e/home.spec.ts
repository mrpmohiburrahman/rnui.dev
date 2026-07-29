import { expect, test } from "@playwright/test"

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? "https://cdn.rnui.dev"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

test("home page renders catalog and search", async ({ page }) => {
  await page.goto("/")
  await expect(page).not.toHaveTitle(/error/i)

  // Hero / title visible. By role, because the footer repeats the name twice.
  await expect(
    page.getByRole("heading", { level: 1, name: "Awesome React Native UI" })
  ).toBeVisible()

  // Search input present
  await expect(page.locator("input[placeholder]")).toBeVisible()
})

// Asserting that a video element exists is not enough. The most recent bug was
// a Demo that mounted, loaded, decoded a frame and never moved, because the
// effect that calls play() had lost its dependency on the resolved source. Only
// currentTime advancing distinguishes playback from a still frame.
test("clicking a card plays the Demo past its first frame", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Play video" }).first().click()

  const video = page.locator("video").first()
  await expect(video).toBeVisible()
  await expect
    .poll(
      () => video.evaluate((v: HTMLVideoElement) => v.currentTime),
      { timeout: 20_000, message: "Demo mounted but never advanced past frame 0" }
    )
    .toBeGreaterThan(0)
})

// The previous behaviour was a silent swap to a root-relative path, which after
// the migration is a guaranteed second failure and still shows the user a black
// rectangle. Failure is injected rather than waited for, so this is deterministic.
test("a Demo that cannot load says so, and the rest of the grid survives", async ({
  page,
}) => {
  await page.route(`${CDN}/demo/**`, (route) => route.abort())
  await page.goto("/")

  const playButtons = page.getByRole("button", { name: "Play video" })
  const before = await playButtons.count()
  await playButtons.first().click()

  await expect(page.getByTestId("demo-error").first()).toBeVisible()
  // Posters still resolve and every other card still offers to play.
  await expect(playButtons).toHaveCount(before - 1)
})
