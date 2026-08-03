import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// Kept in step with PAGE_SIZE in components/recording-card-grid.tsx.
const PAGE_SIZE = 48

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// One save button per card.
const cards = (page: Page) => page.getByRole("button", { name: /^Saved?$/ })

test("the home page renders one page of Recordings, not the whole catalogue", async ({
  page,
}) => {
  await page.goto("/")
  await expect(cards(page)).toHaveCount(PAGE_SIZE)
})

test("Load more appends a page, records it in the URL, and Back undoes it", async ({
  page,
}) => {
  await page.goto("/")

  const loadMore = page.getByRole("button", { name: "Load 48 more" })
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
  await expect(
    page.getByRole("button", { name: /^Load \d+ more$/ })
  ).toHaveCount(0)
})

// The label used to read a flat "Load more" and the end of the catalogue was
// silent — `hasMore` going false simply removed the button. Both numbers are
// derived: the last page is short, and the line under the button counts the
// filtered result set rather than the catalogue.
test("Load more states what it will load and how much is on screen", async ({
  page,
}) => {
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Load 48 more" })).toBeVisible()
  await expect(
    page.getByText(
      `${PAGE_SIZE} OF ${allRecordings.length} SHOWN · NO INFINITE SCROLL`
    )
  ).toBeVisible()

  // 277 less five pages of 48 is 37, and decision 2 is that nothing on screen
  // lies.
  await page.goto("/?page=5")
  const remaining = allRecordings.length - PAGE_SIZE * 5
  await expect(
    page.getByRole("button", { name: `Load ${remaining} more` })
  ).toBeVisible()
})

test("the end of the catalogue is a rule, and both links under it work", async ({
  page,
}) => {
  await page.goto("/?page=99")

  const total = allRecordings.length
  await expect(
    page.getByText(`END OF CATALOGUE · ${total} OF ${total}`)
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Add your own recording on GitHub ↗" })
  ).toHaveAttribute(
    "href",
    "https://github.com/mrpmohiburrahman/awesome-react-native-ui"
  )

  await page.evaluate(() => window.scrollTo(0, 4_000))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000)
  await page.getByRole("button", { name: "Back to top ↑" }).click()
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

// `END OF CATALOGUE · 20 OF 20` under a Category filter would be false, so one
// word is derived from whether anything is filtered.
test("a filtered last page says END OF RESULTS", async ({ page }) => {
  await page.goto("/products?category=Buttons&page=99")

  const inCategory = allRecordings.filter(
    (r) => r.category === "Buttons"
  ).length
  await expect(
    page.getByText(`END OF RESULTS · ${inCategory} OF ${inCategory}`)
  ).toBeVisible()
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

  // The sort control is the header's segment now (ticket 04 step 7).
  await page.getByRole("button", { name: "MOST VOTED" }).click()

  // Read straight after the click, with no poll: a remount hands back a fresh
  // <video> at currentTime 0, and a poll would wait for the owner to grant it a
  // slot and start it again — which is the failure, not the fix.
  expect(await advanced()).toEqual(expect.arrayContaining(before))
})
