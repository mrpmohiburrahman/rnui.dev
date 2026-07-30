import { expect, test } from "@playwright/test"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// The gate that was supposed to do this was dead code: isInView was computed and
// never read, so all 277 Posters (~3.9MB) were fetched as soon as the grid
// mounted. The assertion is a count, not the presence of a loading attribute,
// because only the count distinguishes a working gate from a declared one.
test("only Posters near the viewport are fetched", async ({ page }) => {
  const posters = new Set<string>()
  page.on("request", (r) => {
    if (r.url().includes("/thumbnails/")) posters.add(r.url())
  })
  await page.goto("/")
  await page.getByRole("button", { name: "Play video" }).first().waitFor()
  await page.waitForLoadState("networkidle")

  expect(posters.size).toBeGreaterThan(0) // Posters still load
  expect(posters.size).toBeLessThan(60) // 277 today

  // …and the rest arrive on demand rather than never.
  const nearTop = posters.size
  await page
    .getByRole("button", { name: "Play video" })
    .last()
    .scrollIntoViewIfNeeded()
  await expect.poll(() => posters.size).toBeGreaterThan(nearTop)
})

// object-cover plus the default 50% 50% origin is what reproduces the old
// backgroundSize: "cover" + backgroundPosition: "center". Same rect, same
// painted pixels — which is decision 1 in spec.md, not a nicety.
test("the Poster paints the same rect the background painted into", async ({
  page,
}) => {
  await page.goto("/")
  const button = page.getByRole("button", { name: "Play video" }).first()
  await button.waitFor()

  const img = button.locator("img")
  await expect(img).toHaveCSS("object-fit", "cover")
  await expect(img).toHaveCSS("object-position", "50% 50%")

  // Both rects come out of one evaluate, in one frame. Two separate
  // boundingBox() calls straddle the card mount animation and disagree on y by
  // a few px, which says nothing about whether the <img> covers its button.
  const [imgRect, buttonRect] = await button.evaluate((el) => {
    const image = el.querySelector("img")!
    const r = (n: Element) => {
      const { x, y, width, height } = n.getBoundingClientRect()
      return { x, y, width, height }
    }
    return [r(image), r(el)]
  })
  expect(imgRect).toEqual(buttonRect)
})
