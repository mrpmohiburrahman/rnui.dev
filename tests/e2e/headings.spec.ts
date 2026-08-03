import { expect, test } from "@playwright/test"

// A CI run is not a site visit.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// The heading row pairs every section head with a right-aligned mono result
// line, Catalogue.dc.html:85-88. Each route computes the pair from its own
// filter state (lib/catalogue-heading.ts); these assertions pin the derived
// figures, never a drawn one.

test.describe("heading rows", () => {
  test("`/` has one h1 and the sort-default result line", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toHaveCount(1)

    // The hero h1 lands on the type-scale "hero" step with the copy as drawn
    // (Catalogue.dc.html:64).
    const h1 = page.getByRole("heading", {
      level: 1,
      name: "A dark room full of React Native interfaces, playing quietly.",
    })
    await expect(h1).toBeVisible()
    await expect(h1).toHaveCSS("font-size", "29px")
    await expect(h1).toHaveCSS("font-weight", "500")
    await expect(h1).toHaveCSS("letter-spacing", "-0.58px")

    // The stats row and the heading beneath.
    await expect(
      page.getByRole("heading", { level: 2, name: "Recent" })
    ).toBeVisible()
    await expect(page.getByText("48 OF 277 · SORTED RECENT")).toBeVisible()
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
    ).toBeVisible()
  })

  test("`/products?category=Buttons` heads with the category and counts it", async ({
    page,
  }) => {
    await page.goto("/products?category=Buttons")
    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: "Buttons" })
    ).toBeVisible()
    // 20 is what data/buttons.ts actually holds, not the mock's 14.
    await expect(page.getByText("20 OF 277 · 1 FILTER")).toBeVisible()
  })

  test("a category+contributor filter reads '<category>, by one contributor'", async ({
    page,
  }) => {
    await page.goto(
      "/products?category=Misc&contributor=Enzo%20Manuel%20Mangano%20(%20Reactiive%20)"
    )
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Misc, by one contributor",
      })
    ).toBeVisible()
  })

  test("a search that matches nothing reads No matches at 0 OF 277", async ({
    page,
  }) => {
    await page.goto("/products?search=zzzzzthisnotfound")
    await expect(
      page.getByRole("heading", { level: 1, name: "No matches" })
    ).toBeVisible()
    await expect(page.getByText("0 OF 277 · 1 FILTER")).toBeVisible()
  })

  test("the result line keeps its reserved width and tabular figures", async ({
    page,
  }) => {
    await page.goto("/")
    const line = page.getByText("48 OF 277 · SORTED RECENT")
    const box = await line.boundingBox()
    expect(box).not.toBeNull()
    expect(box!.width).toBeGreaterThanOrEqual(180)
    await expect(line).toHaveCSS("font-variant-numeric", "tabular-nums")
  })

  test("switching sort to Most Viewed changes only the tail", async ({
    page,
  }) => {
    await page.goto("/products?sort=top-viewed")
    await expect(page.getByText(/OF 277 · SORTED MOST VIEWED/)).toBeVisible()
  })
})
