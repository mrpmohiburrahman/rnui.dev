import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

const first = allRecordings[0]

test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

test.describe("the Blog index", () => {
  test("serves the heading, the maintainer line, and the empty state", async ({
    request,
  }) => {
    const html = await (await request.get("/blog")).text()

    expect(html).toContain(">Blog<")
    expect(html).toContain(">Notes<")
    expect(html).toContain("Notes from the maintainer")
    expect(html).toContain("No notes yet.")
    expect(html).toContain('href="/subscribe"')
    expect(html).toContain('href="/blog"')
  })

  test("has one h1, the nav, and no Note rows", async ({ page }) => {
    await page.goto("/blog")

    await expect(page.locator("h1")).toHaveCount(1)
    await expect(
      page.getByRole("heading", { level: 1, name: "Notes" })
    ).toBeVisible()

    const nav = page.getByRole("navigation", { name: "Site sections" })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole("link", { name: "Catalogue" })).toBeVisible()
    await expect(nav.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "aria-current",
      "page"
    )

    await expect(page.locator("main button[aria-expanded]")).toHaveCount(0)
    await expect(page.getByText("No notes yet.")).toBeVisible()
  })

  test("an unknown slug follows the site's not-found redirect", async ({
    page,
  }) => {
    await page.goto("/blog/not-a-note")
    await expect(page).toHaveURL(/\/$/)
  })

  test("keeps the phone nav row and no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto("/blog")

    const nav = page.getByRole("navigation", { name: "Site sections" })
    await expect(nav).toBeVisible()
    await expect(nav.getByRole("link", { name: "Catalogue" })).toBeVisible()
    await expect(nav.getByRole("link", { name: "Blog" })).toBeVisible()

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})

test.describe("the site navigation", () => {
  test("marks Catalogue on the catalogue and Blog on the Blog", async ({
    page,
  }) => {
    await page.goto("/")
    const nav = page.getByRole("navigation", { name: "Site sections" })
    await expect(nav.getByRole("link", { name: "Catalogue" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    await expect(nav.getByRole("link", { name: "Blog" })).not.toHaveAttribute(
      "aria-current",
      "page"
    )

    await page.goto("/blog")
    await expect(nav.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    await expect(nav.getByRole("link", { name: "Catalogue" })).not.toHaveAttribute(
      "aria-current",
      "page"
    )
  })

  test("leaves both links neutral on a utility route", async ({ page }) => {
    await page.goto("/aboutus")
    const nav = page.getByRole("navigation", { name: "Site sections" })
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(0)
  })

  test("adds both links to the Recording detail header", async ({ page }) => {
    await page.goto(`/recording/${first.id}`)

    const header = page.locator('nav[aria-label="Recording navigation"]')
    await expect(header.getByRole("link", { name: "Catalogue" })).toHaveAttribute(
      "aria-current",
      "page"
    )
    await expect(header.getByRole("link", { name: "Blog" })).toBeVisible()
    await expect(header.getByRole("link", { name: /All recordings/ })).toBeVisible()
  })
})

test.describe("the Blog with no Notes", () => {
  test("answers an unknown Note address with the site's 404", async ({
    request,
    page,
  }) => {
    const response = await request.get("/blog/not-a-note", { maxRedirects: 0 })
    expect(response.status()).toBe(404)

    await page.goto("/blog/not-a-note")
    await expect(page).toHaveURL(/\/$/)
  })
})
