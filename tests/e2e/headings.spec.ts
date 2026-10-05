import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

/**
 * The catalogue's size, read from the data rather than written down.
 *
 * It *was* written down, as 277, and this file went red the day the catalogue
 * passed that figure — the app derives its number from this same array
 * (`app/page.tsx` hands `stats.recordings = allRecordings.length` to the grid), so
 * a literal here pins only how stale the test had become.
 */
const TOTAL = allRecordings.length

// A CI run is not a site visit.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// The heading row's section head, Catalogue.dc.html:85. Each route computes it
// from its own filter state (lib/catalogue-heading.ts); these assertions pin the
// derived string, never a drawn one.
//
// **The head is `sr-only`.** `c956a9e` removed the right-aligned result line and
// `6acf554` removed the visible heading text, and both took their e2e coverage
// with them by never being run again. The element itself had to come back:
// `/products` and `/bookmarks` were left with **no `h1` at all**, which the code
// that was deleted had explicitly existed to prevent. So these assert
// `toBeAttached`, not `toBeVisible` — nothing paints the head, and pretending
// otherwise would reinstate the text `6acf554` removed on purpose.

test.describe("heading rows", () => {
  test("`/` has one h1 and the section head beneath it", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toHaveCount(1)

    // The hero h1 lands on the type-scale "hero" step with the copy as drawn
    // (Catalogue.dc.html:64).
    const h1 = page.getByRole("heading", {
      level: 1,
      name: "A community-made catalogue of React Native interfaces.",
    })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveCSS("font-size", "29px")
    await expect(h1).toHaveCSS("font-weight", "500")
    await expect(h1).toHaveCSS("letter-spacing", "-0.58px")

    // The section head beneath the hero, as the `h2` that keeps this page at one
    // `h1`. It is `sr-only` since `6acf554` removed the visible heading text —
    // the element stayed, so `getByRole` finds it and `toBeAttached` is the right
    // assertion. Not `toBeVisible`: nothing paints it, by design.
    await expect(
      page.getByRole("heading", { level: 2, name: "Recent" })
    ).toBeAttached()
    // Scoped to main: "RECORDINGS" also matches the header logo and
    // "CONTRIBUTORS" the rail's "CONTRIBUTORS · 24".
    const main = page.locator("main")
    await expect(main.getByText("CONTRIBUTORS")).toBeVisible()
    await expect(main.getByText("CATEGORIES")).toBeVisible()
    await expect(main.getByText("RECORDINGS")).toBeVisible()
  })

  test("`/products` renders no hero h1, exactly one h1", async ({ page }) => {
    await page.goto("/products")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: "Recent" })
    ).toBeAttached()
  })

  test("`/products?category=Buttons` heads with the category", async ({
    page,
  }) => {
    await page.goto("/products?category=Buttons")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: "Buttons" })
    ).toBeAttached()
  })

  test("a category+contributor filter reads '<category>, by one contributor'", async ({
    page,
  }) => {
    await page.goto(
      "/products?category=Misc&contributor=Enzo%20Manuel%20Mangano%20(Reactiive)"
    )
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Misc, by one contributor",
      })
    ).toBeAttached()
  })

  test("a search that matches nothing reads No matches", async ({ page }) => {
    await page.goto("/products?search=zzzzzthisnotfound")
    await expect(
      page.getByRole("heading", { level: 1, name: "No matches" })
    ).toBeAttached()
    // The zero panel is the surface that now carries the filtered count, so
    // this asserts the count rather than dropping it: `total: 0` is what makes
    // the heading read "No matches" at all.
    await expect(page.getByText(`0 OF ${TOTAL} MATCH`)).toBeVisible()
  })

  test("the sort tabs are on screen, since the result line that shared the row is gone", async ({
    page,
  }) => {
    // `c956a9e` removed the heading row's result line and `6acf554` removed the
    // heading beside it, so what is left in this row is the sort control alone.
    // Asserted because the row is now nearly empty: a regression that dropped
    // the tabs too would leave a route with no way to change the sort, and every
    // other assertion in this file would still pass.
    await page.goto("/")
    for (const label of ["RECENT", "MOST VIEWED", "MOST VOTED"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible()
    }
  })

  test("switching sort to Most Viewed marks that tab", async ({ page }) => {
    // The result line used to be where a sort change showed up in the text.
    // The tab's own selected state is what carries it now.
    await page.goto("/products?sort=top-viewed")
    const active = page.getByRole("button", { name: "MOST VIEWED" })
    await expect(active).toHaveClass(/bg-acc-soft/)
    await expect(page.getByRole("button", { name: "RECENT" })).not.toHaveClass(
      /bg-acc-soft/
    )
  })
})
