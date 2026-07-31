import { expect, test, type Page } from "@playwright/test"

import { allEntries } from "../../data/catalogue"

// Kept in step with PAGE_SIZE in components/entry-card-grid.tsx.
const PAGE_SIZE = 48

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// One bookmark button per card, present whether or not the Demo is playing —
// unlike the play button, which the <video> replaces once a card is playing.
const cards = (page: Page) => page.getByRole("button", { name: /Bookmark$/ })

test("the home page renders one page of Entries, not the whole catalogue", async ({
  page,
}) => {
  await page.goto("/")
  await expect(cards(page)).toHaveCount(PAGE_SIZE)

  // The count pill reports the whole set. Paginating the grid must not paginate
  // the arithmetic.
  await expect(page.getByText(/^Total Items: /)).toHaveText(
    `Total Items: ${allEntries.length}`
  )
})

test("Load more appends a page, records it in the URL, and Back undoes it", async ({
  page,
}) => {
  await page.goto("/")

  const loadMore = page.getByRole("button", { name: "Load more" })
  await loadMore.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)

  await loadMore.click()

  await expect(cards(page)).toHaveCount(PAGE_SIZE * 2)
  await expect(page).toHaveURL(/\?page=2$/)

  // pushState, not router.push: no document request, and the reading position
  // is where the visitor left it.
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore)

  await page.goBack()
  await expect(cards(page)).toHaveCount(PAGE_SIZE)
})

test("a page count in the URL is honoured cold", async ({ page }) => {
  await page.goto("/?page=2")
  await expect(cards(page)).toHaveCount(PAGE_SIZE * 2)

  // Past the end of the catalogue: everything, and nothing left to load.
  await page.goto("/?page=99")
  await expect(cards(page)).toHaveCount(allEntries.length)
  await expect(page.getByRole("button", { name: "Load more" })).toHaveCount(0)
})

// The cards used to be keyed by their array index, so every key changed when the
// list reordered: a sort toggle unmounted and remounted all 277 cards and
// restarted every Demo. Searching first keeps the whole result set inside one
// page, so a card cannot leave the rendered slice and fail this for the wrong
// reason.
test("toggling the sort reorders the cards without restarting a Demo", async ({
  page,
}) => {
  await page.goto("/?search=onboarding")

  const count = await cards(page).count()
  expect(count).toBeGreaterThan(1)
  expect(count).toBeLessThanOrEqual(PAGE_SIZE)

  await page.getByRole("button", { name: "Play video" }).first().click()
  const video = page.locator("video").first()
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 20_000,
      message: "Demo mounted but never advanced past frame 0",
    })
    .toBeGreaterThan(0)

  await page.getByRole("button", { name: "Top Voted" }).click()

  await expect(page.locator("video")).toHaveCount(1)
  expect(
    await page.locator("video").evaluate((v: HTMLVideoElement) => v.currentTime)
  ).toBeGreaterThan(0)
})
