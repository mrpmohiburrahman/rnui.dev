import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

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
// the aside, because the mobile drawer renders a second copy of the same links.
// The row's count is `aria-hidden`, so the link's accessible name is the full
// name — never truncated (ticket 05) and never "name count".
const facet = (page: Page, name: string) =>
  page.locator("aside").getByRole("link", { name, exact: true })

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
  // would clear what — the soft accent fill, not the old yellow pill.
  await expect(facet(page, CATEGORY)).toHaveClass(/bg-acc-soft/)
  await expect(facet(page, AUTHOR)).toHaveClass(/bg-acc-soft/)

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

  await page.getByRole("button", { name: "MOST VOTED" }).click()
  await expect(page).toHaveURL(/sort=top-voted/)

  // Recent is the absence of the param, not `sort=recent`.
  await page.getByRole("button", { name: "RECENT" }).click()
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

  // The segment still reads as selected — the sort used to reset silently,
  // because a facet link is a real navigation and the state remounted. The
  // control is the header's now (ticket 04 step 7), whose active item paints
  // acc-soft rather than the grid pill's gray border.
  await expect(page.getByRole("button", { name: "MOST VOTED" })).toHaveClass(
    /bg-acc-soft/
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
  // The count pill that used to verify the grid was full is gone (ticket 04
  // step 15); the order itself is the subject, so it alone is asserted.
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

    // …and it stays inside the header instead of floating over the grid. The
    // old check — hit-test 8px right of the pill and expect the card, not the
    // wrapper's dead strip — guarded a `position: fixed` pill with a padded
    // wrapper that the redesign removed: the trigger is now a 36px inline
    // button in the sticky header (CatalogueMobile.dc.html:16), so nothing of
    // it hangs over a card to eat taps. In-flow is the geometry that replaced
    // the pointer-events fix, and it is asserted the same way.
    const trigger = page.getByRole("button", { name: "Toggle Menu" })
    const [box, header] = await Promise.all([
      trigger.boundingBox(),
      page.locator("header").boundingBox(),
    ])
    expect(box).not.toBeNull()
    expect(header).not.toBeNull()
    expect(box!.x + box!.width).toBeLessThanOrEqual(header!.x + header!.width)
    expect(box!.y + box!.height).toBeLessThanOrEqual(header!.y + header!.height)
  })

  test("the drawer carries Contributors, and its last row can be reached", async ({
    page,
  }) => {
    await page.goto("/products")
    await page.evaluate(() => window.scrollTo(0, 2_000))
    await page.getByRole("button", { name: "Toggle Menu" }).click()

    const drawer = page.getByRole("dialog")
    await expect(drawer).toBeVisible()

    // The contributor facet used to be passed only to the desktop call. The
    // label carries the count (`CONTRIBUTORS · 24`) and the "All … contributors"
    // link below it contains the same word, so the match is exact.
    await expect(drawer.getByText(/^CONTRIBUTORS · \d+$/)).toBeVisible()

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

// The decision in (b): the rail counts the whole catalogue, so no filter moves a
// number. Misc is 148 and Hewad Mubariz 31 no matter what is applied. A later
// "improvement" that made the counts filter-aware would quietly reverse this,
// which is why it is asserted rather than described.
test("the rail counts the whole catalogue, not the filtered result set", async ({
  page,
}) => {
  await page.goto(
    "/products?category=Misc&contributor=Hewad+Mubariz&search=ticket"
  )
  await expect(facet(page, "Misc")).toContainText("148")
  await expect(facet(page, AUTHOR)).toContainText("31")
})

// Four of twenty-four contributors is the design, not a placeholder — and a
// filter on any of the other twenty would draw a rail with no row showing it and
// no row to click to clear it. The active Contributor is pinned as a fifth row.
test("a filter on a Contributor outside the top four pins that row to the rail", async ({
  page,
}) => {
  await page.goto(
    `/products?contributor=${encodeURIComponent("Kacper Kapuściak")}`
  )

  const aside = page.locator("aside")
  // The contributors are the second list — top four plus the pin. The pinned
  // row is the applied one, so its href clears `contributor=` rather than
  // carrying it; count the links themselves, not the ones that carry the facet.
  const rows = aside.locator("ul").nth(1).locator("a")
  await expect(rows).toHaveCount(5)

  const pinned = aside.getByRole("link", {
    name: "Kacper Kapuściak",
    exact: true,
  })
  await expect(pinned).toHaveClass(/bg-acc-soft/)
  // The pin is the fifth row, and being applied it is the one link that clears
  // the filter — /products with no `contributor=`.
  await expect(rows.nth(4)).toHaveAttribute("href", "/products")
})

test("the rail is 232px wide and main starts exactly beside it", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/products")

  const box = await page.locator("aside").evaluate(() => {
    const rail = document.querySelector("aside")!.getBoundingClientRect()
    const main = document.querySelector("main")!.getBoundingClientRect()
    return { railLeft: rail.left, width: rail.width, mainLeft: main.left }
  })

  expect(box.railLeft).toBe(0)
  expect(box.width).toBe(232)
  // No gap or overlap: main starts where the rail ends.
  expect(box.mainLeft).toBe(box.railLeft + 232)
})
