import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// A CI run is not a site visit, and nothing in here has anything to say about
// playback — letting the Demos run would bill views against the real catalogue.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

// One bookmark button per card, as pagination.spec.ts counts them.
const cards = (page: Page) => page.getByRole("button", { name: /Bookmark$/ })

const NO_MATCHES = "No recordings match the current search or filters."

test.describe("the full catalogue is reachable from the nav", () => {
  // Wide enough for the desktop aside (`hidden sm:flex`). The header draws its
  // desktop row at `md` and up and its two-row phone block below that, so at
  // 700px the aside is the desktop-width rail under a phone-width header — the
  // point is that the aside is present and reachable here at all.
  test.use({ viewport: { width: 700, height: 900 } })

  test("the aside link lands on the unfiltered catalogue", async ({ page }) => {
    await page.goto("/products?category=Buttons")

    await page
      .locator("aside")
      .getByRole("link", { name: "All recordings", exact: true })
      .click()

    // No query string at all: the Category the visitor arrived with is dropped,
    // which is the whole point of a link to the *full* catalogue.
    await expect(page).toHaveURL(/\/products$/)
  })

  // The class attribute, not a screenshot: the link is authorised by decision 13
  // to exist, not to introduce a treatment of its own. A category link at rest is
  // the only appearance it is allowed to have.
  test("it is dressed exactly like an inactive category link", async ({
    page,
  }) => {
    await page.goto("/products?category=Buttons")
    const aside = page.locator("aside")

    const link = await aside
      .getByRole("link", { name: "All recordings", exact: true })
      .getAttribute("class")
    // Accordions, not Buttons: Buttons is the active one and carries the
    // highlight.
    const inactive = await aside
      .getByRole("link", { name: "Accordions", exact: true })
      .getAttribute("class")

    expect(link).toBe(inactive)
    expect(link).not.toContain("bg-yellow-400")
  })
})

test("the sheet carries the same link on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/products?category=Buttons")

  await page.getByRole("button", { name: "Toggle Menu" }).click()
  await page
    .getByRole("dialog")
    .getByRole("link", { name: "All recordings", exact: true })
    .click()

  await expect(page).toHaveURL(/\/products$/)
})

test.describe("something is rendered when there is nothing to render", () => {
  for (const path of [
    "/products?search=zzzzz",
    "/?search=zzzzz",
    "/products?category=Buttons&contributor=zzzzz",
  ]) {
    test(`${path} says so`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByText(NO_MATCHES)).toBeVisible()
      await expect(cards(page)).toHaveCount(0)
    })
  }

  test("an empty Saved list says where bookmarks live", async ({ page }) => {
    await page.goto("/bookmarks")

    // Under the heading the route already renders, not instead of it.
    await expect(
      page.getByRole("heading", { name: "Saved on this device" })
    ).toBeVisible()

    const sentence = page.getByText(/^No bookmarked recordings yet\./)
    await expect(sentence).toBeVisible()

    // Decision 18: the copy has to be plain that the set is local to this
    // browser, and must not imply an account exists.
    const copy = (await sentence.textContent()) ?? ""
    expect(copy).toContain("this browser")
    expect(copy).toContain("this device")
    expect(copy).toContain("no accounts")
    expect(copy).not.toMatch(/sign in|log ?in|sync/i)
  })

  // The bookmarks route mounts with no Recordings and fetches them from an effect,
  // so for the length of that round trip the rendered list is empty while the
  // stored set is not. A message keyed on the rendered list said "No bookmarked
  // Recordings yet" to a visitor who had some. The stored set is what answers the
  // question, so it is what the message is keyed on.
  test("a held fetch never claims the visitor has no bookmarks", async ({
    browser,
  }) => {
    const context = await browser.newContext()
    await context.addInitScript((id) => {
      localStorage.setItem("bookmarkedItems", JSON.stringify([id]))
    }, allRecordings[0].id)

    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (route) => route.abort())
    await page.route("**/demo/**", (route) => route.abort())

    // Hold the server action that fetches the catalogue. Every action posts to
    // the address of the page that fired it (tests/e2e/server-actions.ts), so
    // the POST to /bookmarks is the fetch this route is waiting on.
    let release = () => {}
    const held = new Promise<void>((resolve) => (release = resolve))
    await page.route("**/bookmarks", async (route, request) => {
      if (request.method() !== "POST") return route.continue()
      await held
      await route.continue()
    })

    await page.goto("/bookmarks")
    // The heading is up, so the route has rendered — this is the window the
    // false sentence used to appear in, not a moment before it.
    await expect(
      page.getByRole("heading", { name: "Saved on this device" })
    ).toBeVisible()
    await expect(cards(page)).toHaveCount(0)
    await expect(page.getByText(/^No bookmarked recordings yet\./)).toHaveCount(
      0
    )

    release()
    await expect(cards(page)).toHaveCount(1)
    await expect(page.getByText(/^No bookmarked recordings yet\./)).toHaveCount(
      0
    )

    await context.close()
  })

  test("one bookmark is one card and no sentence", async ({ browser }) => {
    const context = await browser.newContext()
    await context.addInitScript((id) => {
      localStorage.setItem("bookmarkedItems", JSON.stringify([id]))
    }, allRecordings[0].id)

    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (route) => route.abort())
    await page.route("**/demo/**", (route) => route.abort())
    await page.goto("/bookmarks")

    await expect(cards(page)).toHaveCount(1)
    await expect(page.getByText(/^No bookmarked recordings yet\./)).toHaveCount(
      0
    )

    await context.close()
  })
})

test.describe("a card fills its track instead of overflowing it", () => {
  // `sm` and up, where the card used to be a fixed 221px against a fractional
  // track. Below `sm` the grid is one column and the card was already `w-full`.
  for (const width of [640, 768, 1024, 1280, 1440]) {
    for (const path of ["/", "/products"]) {
      test(`${path} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)

        const measured = await page.evaluate(() => {
          const grid = document.querySelector('[class*="xl:grid-cols-5"]')
          if (!grid) return null
          const track = parseFloat(
            getComputedStyle(grid).gridTemplateColumns.split(" ")[0]
          )
          const content = grid.getBoundingClientRect().right
          const cards = [...grid.children].slice(0, 5).map((c) => {
            const box = c.getBoundingClientRect()
            return { width: box.width, right: box.right }
          })
          return {
            track,
            cards,
            content,
            scrollWidth: grid.scrollWidth,
            clientWidth: grid.clientWidth,
          }
        })

        expect(measured).not.toBeNull()
        const {
          track,
          cards: boxes,
          content,
          scrollWidth,
          clientWidth,
        } = measured!
        expect(boxes.length).toBeGreaterThan(0)
        for (const box of boxes) {
          expect(Math.abs(box.width - track)).toBeLessThanOrEqual(1)
          expect(box.right).toBeLessThanOrEqual(content + 1)
        }
        // The clipping itself: `overflow-hidden` on the grid's ancestor cut off
        // whatever ran past, so the difference was invisible rather than absent.
        expect(scrollWidth).toBe(clientWidth)
      })
    }
  }
})

test.describe("the page never scrolls sideways", () => {
  // 640px is where the sidebar appears (`hidden sm:flex`) and `main` picks up
  // its 168px left margin, and where the sort controls turn horizontal. For a
  // 30px-wide band above it the three sort pills and the two status pills had a
  // 470px min-content against the 440px `main` had left, and a flex item cannot
  // shrink below its min-content — so `main` was floored wider than the
  // viewport and the whole document scrolled. 700px is past the band, 639px is
  // below the margin, and both were always clean.
  for (const width of [390, 639, 640, 660, 700, 768, 1024, 1440]) {
    for (const path of ["/", "/products", "/bookmarks"]) {
      test(`${path} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        const measured = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }))
        expect(measured.scrollWidth).toBeLessThanOrEqual(measured.clientWidth)
      })
    }
  }
})

test.describe("the content clears the header instead of sitting under it", () => {
  const mainTop = (page: Page) =>
    page.evaluate(
      () => document.querySelector("main")!.getBoundingClientRect().top
    )
  const headerBottom = (page: Page) =>
    page.evaluate(
      () => document.querySelector("header")!.getBoundingClientRect().bottom
    )

  // The header is in flow now (ticket 04), sticky rather than fixed, so `main`
  // starts exactly where the header ends at every width. It used to be
  // `h-[83px] fixed top-0` paid for with a 64px spacer that let it paint over
  // the top 19px of every page at `md` and up.
  for (const width of [390, 768, 1440]) {
    for (const path of ["/", "/products", "/bookmarks"]) {
      test(`${path} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)
        expect(await mainTop(page)).toBe(await headerBottom(page))
      })
    }
  }
})
