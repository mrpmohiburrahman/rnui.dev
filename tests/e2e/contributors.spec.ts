import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"
import { contributorsByCount } from "../../data/recording"

// A CI run is not a site visit.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// One save button per card, as filters.spec.ts and pagination.spec.ts count them.
const cards = (page: Page) => page.getByRole("button", { name: /^Saved?$/ })

// The index's rows. Scoped to main, because the rail in the layout draws four
// links to the same addresses on every route.
const rows = (page: Page) => page.locator("main").getByRole("listitem")

const CONTRIBUTORS = contributorsByCount()

test("every Contributor gets one row, and the counts account for the catalogue", async ({
  page,
}) => {
  await page.goto("/contributors")

  await expect(rows(page)).toHaveCount(CONTRIBUTORS.length)

  // Read off the page rather than off the import: this is the assertion that
  // the page shows what data/recording.ts computed, and taking the numbers from
  // the same module twice would prove nothing.
  const printed = await rows(page).allInnerTexts()
  const counts = printed.map((text) => Number(text.trim().split(/\s+/).pop()))
  expect(counts.reduce((sum, n) => sum + n, 0)).toBe(allRecordings.length)

  // The derived header line, both numbers.
  await expect(
    page
      .locator("main")
      .getByText(
        `${CONTRIBUTORS.length} CONTRIBUTORS · ${allRecordings.length} RECORDINGS`
      )
  ).toBeVisible()
  await expect(
    page.getByRole("heading", { level: 1, name: "Contributors" })
  ).toBeVisible()
})

// The assertion that catches `data/fullapps.ts`'s trailing space being restored.
// One person spelled two ways draws two rows reading the same thing, pointing at
// two addresses and holding two different numbers — precisely the lie decision 2
// forbids. The counts are aria-hidden, so a row's accessible name is the exact
// Contributor name and a duplicate cannot hide behind a different number.
test("no two rows carry the same accessible name", async ({ page }) => {
  await page.goto("/contributors")

  // The first child is the name span; the count beside it is aria-hidden and so
  // is no part of the name.
  const names = await rows(page)
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => link.firstElementChild?.textContent ?? "")
    )
  expect(new Set(names).size).toBe(names.length)
})

test("a row lands on that Contributor's filtered catalogue", async ({
  page,
}) => {
  const NAME = "Hewad Mubariz"
  const theirs = allRecordings.filter((r) => r.contributor === NAME).length

  await page.goto("/contributors")
  await page
    .locator("main")
    .getByRole("link", { name: NAME, exact: true })
    .click()

  await expect(page).toHaveURL("/products?contributor=Hewad+Mubariz")
  await expect(cards(page)).toHaveCount(theirs, { timeout: 15_000 })
})

// The three names that killed `/contributors/[slug]`: whitespace that a slugifier
// eats, a CJK name that NFKD-then-strip empties, and a pipe. Each is exact and
// unambiguous inside `?contributor=`, and each has to survive the round trip
// through the URL to the filtered catalogue.
for (const [name, expected] of [
  ["Enzo Manuel Mangano ( Reactiive )", 124],
  ["Daehyeon Mun (문대현)", 4],
  ["Epicode | 0xV", 2],
] as const) {
  test(`\`${name}\` addresses its own ${expected} recordings`, async ({
    page,
  }) => {
    await page.goto("/contributors")

    const href = `/products?${new URLSearchParams({ contributor: name })}`
    const row = page.locator("main").getByRole("link", { name, exact: true })
    await expect(row).toHaveAttribute("href", href)

    await row.click()
    await expect(page).toHaveURL(href)

    // A page is 48 cards (recording-card-grid.tsx:16), so the whole of Enzo's
    // 124 is not on screen and asserting it would be asserting pagination away.
    // The Load more line carries the true total, which is the number this test
    // is actually about.
    //
    // The wider timeout is for `/products`, the one route in this file that is
    // rendered on demand and reads Firestore to do it: with the whole suite's
    // workers queued behind it, the default 5s expired once on a page that was
    // still rendering.
    await expect(cards(page)).toHaveCount(Math.min(expected, 48), {
      timeout: 15_000,
    })
    if (expected > 48) {
      await expect(
        page.getByText(`48 OF ${expected} SHOWN · NO INFINITE SCROLL`)
      ).toBeVisible()
    }
  })
}

// Ticket 05 (d) rejected truncating these names on the evidence that the longest
// two are unreadable when cut, so the row wraps instead. A clientWidth short of
// scrollWidth is the shape of an ellipsis whether or not one is drawn.
test("the longest name renders in full at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/contributors")

  const name = page
    .locator("main")
    .getByRole("link", {
      name: "Enzo Manuel Mangano ( Reactiive )",
      exact: true,
    })
    .locator("span")
    .first()

  await expect(name).toHaveText("Enzo Manuel Mangano ( Reactiive )")
  const overflow = await name.evaluate(
    (el) => el.scrollWidth > el.clientWidth + 1
  )
  expect(overflow).toBe(false)
})

// The rail's own link to this page, which ticket 05 hardcoded before the route
// existed. The count in it and the number of rows it lands on are the same
// number or one of them is wrong.
test("the rail's `All N contributors →` link resolves and agrees", async ({
  page,
}) => {
  await page.goto("/")

  const link = page.locator("aside").getByRole("link", { name: /contributors/ })
  await expect(link).toHaveText(`All ${CONTRIBUTORS.length} contributors →`)

  const response = await page.goto("/contributors")
  expect(response?.status()).toBe(200)
  await expect(rows(page)).toHaveCount(CONTRIBUTORS.length)
})

// focus-visible and not focus: a mouse click draws nothing, a Tab draws the
// rail's ring. The same rule ticket 05 step 11 applies to a rail row.
test("Tab draws the accent ring, a mouse press does not", async ({ page }) => {
  await page.goto("/contributors")

  const first = rows(page).first().getByRole("link")
  await first.evaluate((el) => (el as HTMLElement).focus())
  await expect(first).toHaveCSS("outline-width", "3px")
  await expect(first).toHaveCSS("outline-style", "solid")
  await expect(first).toHaveCSS("outline-offset", "2px")

  const second = rows(page).nth(1).getByRole("link")
  await second.hover()
  await page.mouse.down()
  await expect(second).toHaveCSS("outline-style", "none")
  await page.mouse.up()
})

// Hover takes the sheet's selected treatment. The four token values are read
// off the page rather than typed, so this holds in either mode — the light and
// dark palettes differ in every one of them.
test("hover moves the row to the accent, over 120ms", async ({ page }) => {
  await page.goto("/contributors")

  const token = (name: string) =>
    page.evaluate((property) => {
      const probe = document.createElement("span")
      probe.style.color = `var(${property})`
      document.body.append(probe)
      const value = getComputedStyle(probe).color
      probe.remove()
      return value
    }, name)

  const [acc, accSoft, t1] = await Promise.all([
    token("--acc"),
    token("--acc-soft"),
    token("--t1"),
  ])

  const row = rows(page).first().getByRole("link")
  await expect(row).toHaveCSS("transition-duration", "0.12s")
  await expect(row).not.toHaveCSS("border-top-color", acc)

  await row.hover()
  await expect(row).toHaveCSS("border-top-color", acc)
  await expect(row).toHaveCSS("background-color", accSoft)
  await expect(row).toHaveCSS("color", t1)
  await expect(row.locator("span").nth(1)).toHaveCSS("color", acc)
})
