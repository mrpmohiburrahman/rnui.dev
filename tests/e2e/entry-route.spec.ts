import { expect, test } from "@playwright/test"

import { allEntries } from "../../data/catalogue"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  // Nor is it a viewing. Demos autoplay, and nothing here is about playback, so
  // letting them run would bill views against the real catalogue on every run.
  await page.route("**/demo/**", (route) => route.abort())
})

const known = allEntries[0]

// The card heading, not the card itself: the bookmark button sits over the
// top-right corner and the Demo fills the top. The heading is inside the div
// that carries the onClick.
const firstCard = (page: import("@playwright/test").Page) =>
  page.getByRole("heading", { level: 3 }).first()

test("clicking a card opens the panel at the Entry's own address, without navigating", async ({
  page,
}) => {
  // Page 2, so the address carries a param the open has to keep. pushState
  // replaces the whole URL: dropping the query collapsed the grid behind the
  // tint from 96 cards to 48 for as long as the panel was open.
  await page.goto("/?page=2")
  const cardsBefore = await page.locator(".grid h3").count()

  // The whole reason this is pushState and not router.push. A navigation here
  // would re-run the server component and refetch the catalogue on the most
  // repeated action on the site.
  //
  // Only requests for the Entry address count. The sidebar's <Link>s prefetch
  // `?_rsc=` for /, /bookmarks and /subscribe on their own schedule, and those
  // fire whether or not a card is ever clicked.
  const navigations: string[] = []
  page.on("request", (request) => {
    const url = request.url()
    if (
      url.includes("/entry/") &&
      (request.isNavigationRequest() || url.includes("_rsc="))
    )
      navigations.push(url)
  })

  await firstCard(page).click()

  await expect(page).toHaveURL(/\/entry\/[0-9A-Za-z]{26}\?page=2$/)
  await expect(page.getByRole("dialog")).toBeVisible()
  expect(navigations).toEqual([])

  // The catalogue is still underneath, unchanged, which is what the overlay
  // exists to say. `.grid h3`, not getByRole: Radix aria-hides everything
  // outside the panel, so a role query reports zero cards either way.
  expect(cardsBefore).toBe(96)
  expect(await page.locator(".grid h3").count()).toBe(cardsBefore)
})

test("Escape, the close button, the tint and Back all take the same way out", async ({
  page,
}) => {
  await page.goto("/?search=onboarding")
  const listing = page.url()

  for (const close of [
    async () => page.keyboard.press("Escape"),
    async () => page.getByRole("button", { name: "Close Modal" }).click(),
    // Away from the panel, which is centred and 768px wide at this viewport.
    async () =>
      page
        .locator("[data-radix-dialog-overlay], .fixed.inset-0.bg-black")
        .click({ position: { x: 10, y: 10 } }),
    async () => page.goBack(),
  ]) {
    await firstCard(page).click()
    await expect(page).toHaveURL(/\/entry\//)
    await expect(page.getByRole("dialog")).toBeVisible()

    await close()

    // The exact previous URL, search param and all: closing is history.back(),
    // so it cannot land anywhere else.
    await expect(page).toHaveURL(listing)
    await expect(page.getByRole("dialog")).toHaveCount(0)
  }
})

test("the open panel traps focus and locks the page behind it", async ({
  page,
}) => {
  await page.goto("/")
  await firstCard(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()

  // components/modal.tsx claimed aria-modal while leaving all 277 cards in the
  // tab order. Ten tabs is more than the panel holds, so a leak would show.
  for (let i = 0; i < 10; i++) await page.keyboard.press("Tab")
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]')
    )
  ).toBe(true)

  expect(
    await page.evaluate(() => getComputedStyle(document.body).overflow)
  ).toBe("hidden")
})

test("an Entry address opened cold is a page, not an overlay", async ({
  page,
}) => {
  await page.goto(`/entry/${known.id}`)

  await expect(
    page.getByRole("heading", { level: 2, name: known.caption })
  ).toBeVisible()
  await expect(page.getByText(known.author).first()).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("an id that is not an Entry is a 404", async ({ page }) => {
  const response = await page.request.get("/entry/nope", { maxRedirects: 0 })
  expect(response.status()).toBe(404)
})

test.describe("reduced motion", () => {
  // Under contextOptions, not as a bare option: Playwright 1.60 moved it there.
  test.use({ contextOptions: { reducedMotion: "reduce" } })

  // <MotionConfig reducedMotion="user"> is not enough on its own: framer snaps
  // transforms rather than dropping them, so a panel that started at scale 0.98
  // would still paint one frame at 0.98 and jump. Sampled across the whole open
  // and the whole close, because one frame is all it took.
  test("the panel fades and never scales", async ({ page }) => {
    await page.goto("/")
    await firstCard(page).click()
    await expect(page.getByRole("dialog")).toBeVisible()

    const scales: number[] = []
    const panelOpacity: number[] = []
    const tintOpacity: number[] = []
    const sample = async () => {
      for (let i = 0; i < 25; i++) {
        const seen = await page.evaluate(() => {
          const panel = document.querySelector('[role="dialog"]')
          const tint = document.querySelector(".fixed.inset-0.bg-black")
          if (!panel) return null
          const style = getComputedStyle(panel)
          return {
            transform: style.transform,
            opacity: style.opacity,
            tint: tint ? getComputedStyle(tint).opacity : null,
          }
        })
        if (!seen) continue
        const matrix = seen.transform.match(
          /matrix\(([-\d.]+), 0, 0, ([-\d.]+),/
        )
        if (matrix) scales.push(Number(matrix[1]), Number(matrix[2]))
        panelOpacity.push(Number(seen.opacity))
        if (seen.tint !== null) tintOpacity.push(Number(seen.tint))
        await page.waitForTimeout(8)
      }
    }

    await sample()
    // The close is sampled from its first frame, unlike the open, which cannot
    // be reached before toBeVisible() resolves. So the fade claim is made
    // against the close: each node is checked on its own, because a set of
    // combined strings would pass on either one moving alone.
    await page.keyboard.press("Escape")
    panelOpacity.length = 0
    tintOpacity.length = 0
    await sample()

    expect(scales.length).toBeGreaterThan(0)
    expect([...new Set(scales)]).toEqual([1])

    // Both nodes still fade, so the transition still says "on top of" rather
    // than "went somewhere else".
    expect(new Set(panelOpacity).size).toBeGreaterThan(1)
    expect(new Set(tintOpacity).size).toBeGreaterThan(1)
  })
})
