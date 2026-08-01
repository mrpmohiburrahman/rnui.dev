import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"
import { truncateString } from "../../lib/utils"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// One bookmark button per card, as pagination.spec.ts counts them.
const cards = (page: Page) => page.getByRole("button", { name: /Bookmark$/ })

// The first card's caption, which is how an order is compared: the bookmark
// button is named "Add Bookmark" on every card and identifies none of them.
const firstCaption = (page: Page) =>
  page.getByRole("heading", { level: 3 }).first().textContent()

// A pair that genuinely intersects: each filter alone matches more than the two
// together, so a count that is merely "one of them applied" fails. Derived from
// the catalogue rather than written down, so a data change moves the expectation
// with it. Every figure here is under one page of 48, so pagination cannot mask a
// wrong count.
const CATEGORY = "Buttons"
const AUTHOR = "Hewad Mubariz"
const inCategory = allRecordings.filter((e) => e.category === CATEGORY).length
const byContributor = allRecordings.filter(
  (e) => e.contributor === AUTHOR
).length
const inBoth = allRecordings.filter(
  (e) => e.category === CATEGORY && e.contributor === AUTHOR
).length

// A link in the desktop facet list, by the name it is filtered under. Scoped to
// the aside, because the mobile drawer renders a second copy of the same links,
// and truncated the way catalogue-nav.tsx truncates every label — so the
// accessible name of a contributor link is not the contributor's name.
const facet = (page: Page, name: string) =>
  page
    .locator("aside")
    .getByRole("link", { name: truncateString(name, 12), exact: true })

test("a facet link keeps the params it did not set", async ({ page }) => {
  await page.goto(`/products?category=${CATEGORY}`)
  await expect(cards(page)).toHaveCount(inCategory)

  // The contributor link used to be written whole, so it discarded the Category.
  await facet(page, AUTHOR).click()

  await expect(page).toHaveURL(new RegExp(`category=${CATEGORY}`))
  await expect(page).toHaveURL(/contributor=Hewad\+Mubariz/)

  // The intersection, not either half of it.
  await expect(cards(page)).toHaveCount(inBoth)
  expect(inBoth).toBeLessThan(inCategory)
  expect(inBoth).toBeLessThan(byContributor)
})

test("clicking the facet that is already on clears it and leaves the other", async ({
  page,
}) => {
  await page.goto(`/products?category=${CATEGORY}&contributor=Hewad+Mubariz`)

  // Both chips carry the active treatment, so the visitor can see which link
  // would clear what.
  await expect(facet(page, CATEGORY)).toHaveClass(/bg-yellow-400/)
  await expect(facet(page, AUTHOR)).toHaveClass(/bg-yellow-400/)

  await facet(page, CATEGORY).click()

  await expect(page).toHaveURL(/contributor=Hewad\+Mubariz/)
  await expect(page).not.toHaveURL(/category=/)
  await expect(cards(page)).toHaveCount(byContributor)
})

test("the search term survives a facet click", async ({ page }) => {
  await page.goto("/?search=slider")
  const matched = await cards(page).count()
  expect(matched).toBeGreaterThan(0)

  await facet(page, CATEGORY).click()
  await expect(page).toHaveURL(/search=slider/)
  await expect(page).toHaveURL(new RegExp(`category=${CATEGORY}`))
})

test("the sort is in the URL, applied without a document request", async ({
  page,
}) => {
  await page.goto("/products")

  // A sort is a reorder of cards already in hand. A navigation would buy a
  // server render and a whole-collection Firestore read for nothing.
  const documents: string[] = []
  page.on("request", (r) => {
    if (r.resourceType() === "document") documents.push(r.url())
  })

  await page.getByRole("button", { name: "Top Voted" }).click()
  await expect(page).toHaveURL(/sort=top-voted/)

  // Recent is the absence of the param, not `sort=recent`.
  await page.getByRole("button", { name: "Recent" }).click()
  await expect(page).not.toHaveURL(/sort=/)

  expect(documents).toEqual([])
})

test("a sort survives a facet click, and reloads cold in the same order", async ({
  page,
}) => {
  await page.goto("/products?sort=top-voted")
  const topVoted = await firstCaption(page)

  await facet(page, CATEGORY).click()
  await expect(page).toHaveURL(/sort=top-voted/)
  await expect(page).toHaveURL(new RegExp(`category=${CATEGORY}`))

  // The button still reads as selected — the sort used to reset silently,
  // because a facet link is a real navigation and the state remounted.
  await expect(page.getByRole("button", { name: "Top Voted" })).toHaveClass(
    /border-gray-100/
  )

  await page.goto("/products?sort=top-voted")
  expect(await firstCaption(page)).toBe(topVoted)
})

test("an unknown sort renders Recent order, not an empty grid", async ({
  page,
}) => {
  await page.goto("/products")
  const firstRecent = await firstCaption(page)

  await page.goto("/products?sort=banana")
  await expect(page.getByText(/^Total Items: /)).toHaveText(
    `Total Items: ${allRecordings.length}`
  )
  expect(await firstCaption(page)).toBe(firstRecent)
})

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  // The trigger was `position: absolute` under no positioned ancestor, so its
  // containing block was the document: past ~10px of scroll it was gone, and
  // with the desktop aside `hidden sm:flex` a phone visitor had no route to the
  // filters at all.
  test("the filter trigger is still on screen after a scroll", async ({
    page,
  }) => {
    await page.goto("/products")
    await page.evaluate(() => window.scrollTo(0, 2_000))
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000)

    await expect(
      page.getByRole("button", { name: "Toggle Menu" })
    ).toBeInViewport()

    // …and it floats over the grid without eating it. The wrapper's padding is
    // an 80×48px box where the pill paints 56×40, so a quarter of it is
    // invisible and sits at z-30 over a card. Harmless while it scrolled away;
    // a permanent dead strip once it stopped, which is what `pointer-events`
    // undoes. Hit-tested rather than read off the class, because the class is
    // the declaration and this is the behaviour.
    const swallowsWhatIsBesideIt = await page.evaluate(() => {
      const button = [...document.querySelectorAll("span")]
        .find((s) => s.textContent === "Toggle Menu")
        ?.closest("button")
      if (!button) return null
      const box = button.getBoundingClientRect()
      const under = document.elementFromPoint(
        box.right + 8,
        box.y + box.height / 2
      )
      return under !== null && under.contains(button)
    })
    expect(swallowsWhatIsBesideIt).toBe(false)
  })

  test("the drawer carries Contributors, and its last row can be reached", async ({
    page,
  }) => {
    await page.goto("/products")
    await page.evaluate(() => window.scrollTo(0, 2_000))
    await page.getByRole("button", { name: "Toggle Menu" }).click()

    const drawer = page.getByRole("dialog")
    await expect(drawer).toBeVisible()

    // The contributor facet used to be passed only to the desktop call.
    await expect(drawer.getByText("Contributors")).toBeVisible()

    // The last row of the list, which is what the ScrollArea's fixed height puts
    // at risk: a box taller than the panel never scrolls to its own bottom, and
    // the drawer is `fixed` with body scroll locked, so there is no outer scroll
    // to fall back on.
    const last = drawer.locator('a[href*="contributor="]').last()
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport()
    await last.click()
    await expect(page).toHaveURL(/contributor=/)
  })
})

// `?author=` is the spelling `main` hands out on all 24 contributor links (23 people plus the trailing-space duplicate ticket 10 trims), so a
// visitor can have bookmarked one and a rendering crawler can have indexed one.
// ADR-0008 keeps it alive as a permanent redirect rather than a second reader, so
// there is one canonical address for a filtered catalogue instead of two that
// render identically. This asserts both halves: the redirect happens, and it
// lands on the same Recordings.
test("the legacy ?author= spelling redirects to ?contributor=", async ({
  page,
}) => {
  await page.goto(`/products?contributor=${encodeURIComponent(AUTHOR)}`)
  const canonical = await cards(page).count()
  expect(canonical).toBeGreaterThan(0)

  await page.goto(`/products?author=${encodeURIComponent(AUTHOR)}`)

  await expect(page).toHaveURL(/contributor=Hewad\+Mubariz/)
  await expect(page).not.toHaveURL(/author=/)
  await expect(cards(page)).toHaveCount(canonical)
})
