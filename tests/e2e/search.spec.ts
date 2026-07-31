import { expect, test, type Page } from "@playwright/test"

// Kept in step with PAGE_SIZE in components/entry-card-grid.tsx.
const PAGE_SIZE = 48

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  // Nor is it a viewing. Demos autoplay, and nothing here is about playback, so
  // letting them run would bill views against the real catalogue on every run.
  await page.route("**/demo/**", (route) => route.abort())
})

const searchBox = (page: Page) =>
  page.getByRole("textbox", { name: "Search the catalogue" })

const cards = (page: Page) => page.getByRole("button", { name: /Bookmark$/ })

const searchParam = (page: Page) =>
  new URL(page.url()).searchParams.get("search")

// Every keystroke used to be a router.replace: `buttons` was 7 navigations, 7
// whole-collection Firestore reads and 7 re-renders of the grid. Counted from
// the RSC fetches carrying a search term rather than from every `_rsc=` request,
// because the router also prefetches the sidebar's links on its own schedule.
test("typing produces one navigation, not one per keystroke", async ({
  page,
}) => {
  await page.goto("/")
  // Hydration of a full page of cards can hold the main thread for longer than
  // the debounce, which would let the first keystroke's timer fire on its own
  // and fail this for a reason that is not the behaviour under test.
  await expect(cards(page)).toHaveCount(PAGE_SIZE)
  await page.waitForLoadState("networkidle")

  const navigations: string[] = []
  let lastSeenAt = 0
  page.on("request", (request) => {
    const url = request.url()
    if (!url.includes("_rsc=") || !url.includes("search=")) return
    navigations.push(url)
    lastSeenAt = Date.now()
  })

  // 10ms apart — the whole word is typed well inside the 300ms debounce, so only
  // the last keystroke may navigate.
  await searchBox(page).pressSequentially("buttons", { delay: 10 })

  // Waiting for quiet rather than for a fixed delay, the reason
  // tests/e2e/server-actions.ts:38-43 records: the claim under test is how many
  // navigations one burst of typing produces, so the wait has to end when the
  // typing has finished producing them. Unfixed, they arrive ~40ms apart.
  const QUIET_MS = 1_000
  await expect
    .poll(() => navigations.length > 0 && Date.now() - lastSeenAt > QUIET_MS, {
      timeout: 20_000,
      intervals: [250],
      message: "typing produced no navigation at all",
    })
    .toBe(true)

  await expect(page).toHaveURL(/search=buttons/)
  expect(navigations, navigations.join("\n")).toHaveLength(1)
})

test("a shared /?search=slider shows the term, and clearing it restores the grid", async ({
  page,
}) => {
  await page.goto("/?search=slider")

  const box = searchBox(page)
  await expect(box).toHaveValue("slider")

  const filtered = await cards(page).count()
  expect(filtered).toBeGreaterThan(0)
  expect(filtered).toBeLessThan(PAGE_SIZE)

  await box.press("ControlOrMeta+a")
  await box.press("Delete")

  await expect(cards(page)).toHaveCount(PAGE_SIZE)
  expect(searchParam(page)).toBeNull()
})

// Enter used to run the vanish animation, whose particle loop ends by clearing
// the input. The box emptied, the URL kept `search=slider`, and the grid stayed
// filtered by a term the visitor could no longer see or edit.
test("Enter leaves the query alone", async ({ page }) => {
  await page.goto("/")

  const box = searchBox(page)
  await box.pressSequentially("slider", { delay: 40 })
  await expect(page).toHaveURL(/search=slider/)

  await box.press("Enter")
  // Long enough for the old vanish animation to have finished erasing it.
  await page.waitForTimeout(1_000)

  await expect(box).toHaveValue("slider")
  expect(searchParam(page)).toBe("slider")
})

test("Back leaves the box showing whatever the URL says", async ({ page }) => {
  await page.goto("/")

  const box = searchBox(page)
  await box.pressSequentially("slider", { delay: 40 })
  await expect(page).toHaveURL(/search=slider/)

  // The Category link carries the search with it: a facet link keeps every
  // param it did not set. It used to be written whole and dropped the term.
  await page.getByRole("link", { name: "Onboarding" }).first().click()
  await expect(page).toHaveURL(/category=Onboarding/)
  await expect(page).toHaveURL(/search=slider/)

  await page.goBack()
  await expect(page).not.toHaveURL(/category=/)
  await expect(page).toHaveURL(/search=slider/)
  await expect(searchBox(page)).toHaveValue("slider")
})
