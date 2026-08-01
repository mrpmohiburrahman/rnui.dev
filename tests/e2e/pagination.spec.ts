import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// Kept in step with PAGE_SIZE in components/recording-card-grid.tsx.
const PAGE_SIZE = 48

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// One bookmark button per card.
const cards = (page: Page) => page.getByRole("button", { name: /Bookmark$/ })

test("the home page renders one page of Recordings, not the whole catalogue", async ({
  page,
}) => {
  await page.goto("/")
  await expect(cards(page)).toHaveCount(PAGE_SIZE)

  // The count pill reports the whole set. Paginating the grid must not paginate
  // the arithmetic.
  await expect(page.getByText(/^Total Items: /)).toHaveText(
    `Total Items: ${allRecordings.length}`
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
  await expect(cards(page)).toHaveCount(allRecordings.length)
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

  // Identified by source, not by position: a sort is a reorder, so `.first()`
  // after the toggle is a different Recording than `.first()` before it. The src is
  // the Recording's own Demo and follows the element wherever it lands.
  const advanced = () =>
    page
      .locator("video")
      .evaluateAll((all) =>
        (all as HTMLVideoElement[])
          .filter((video) => video.currentTime > 0)
          .map((video) => video.src)
      )

  await expect
    .poll(advanced, {
      timeout: 20_000,
      message: "no Demo ever advanced past frame 0",
    })
    .not.toHaveLength(0)
  const before = await advanced()

  await page.getByRole("button", { name: "Top Voted" }).click()

  // Read straight after the click, with no poll: a remount hands back a fresh
  // <video> at currentTime 0, and a poll would wait for the owner to grant it a
  // slot and start it again — which is the failure, not the fix.
  expect(await advanced()).toEqual(expect.arrayContaining(before))
})
