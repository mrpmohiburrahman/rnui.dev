import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// A CI run is not a site visit, and nothing in here has anything to say about
// playback — letting the Demos run would bill views against the real catalogue.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

// One save button per card, as pagination.spec.ts counts them.
const cards = (page: Page) => page.getByRole("button", { name: /^Saved?$/ })

// The empty panel's own escape routes, scoped to the panel: the filter bar above
// it carries a `Clear all` of its own, and the point of these cases is what the
// diagnosis derived, not what the bar always draws. The dashed border is the
// panel's, and on a zero-result page it is the only dashed thing on screen.
const panelActions = (page: Page) =>
  page.locator('[class*="border-dashed"]').first().getByRole("link")

// The one sentence is gone: the zero panel diagnoses itself now, so each of
// these paths has its own derived headline (lib/catalogue-filters.ts). The
// strings are the mock's forms, not a constant the component holds.
const NO_MATCHES: Record<string, string> = {
  "/products?search=zzzzz": "Nothing in the catalogue matches “zzzzz”.",
  "/?search=zzzzz": "Nothing in the catalogue matches “zzzzz”.",
  "/products?category=Buttons&contributor=zzzzz":
    "Nothing in Buttons is by zzzzz.",
}

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
  for (const [path, headline] of Object.entries(NO_MATCHES)) {
    test(`${path} says so`, async ({ page }) => {
      await page.goto(path)
      await expect(page.getByText(headline)).toBeVisible()
      await expect(cards(page)).toHaveCount(0)
    })
  }

  // The mock's own query, and the panel's whole reason for computing rather
  // than rendering a string: the mock's sentence names Pickers, the data says
  // Sliders, and all three of its single drops are non-empty where the mock
  // draws one.
  test("the zero panel diagnoses itself against the real catalogue", async ({
    page,
  }) => {
    await page.goto(
      `/products?category=Misc&contributor=${encodeURIComponent(
        "Enzo Manuel Mangano ( Reactiive )"
      )}&search=wheel`
    )

    await expect(cards(page)).toHaveCount(0)
    await expect(
      page.getByText(`0 OF ${allRecordings.length} MATCH`)
    ).toBeVisible()
    await expect(
      page.getByText(
        "Nothing in Misc by Enzo Manuel Mangano ( Reactiive ) matches “wheel”."
      )
    ).toBeVisible()
    await expect(
      page.getByText(
        "Loosen one of the three. Wheel Picker is by this contributor, but it lives in Sliders — not Misc."
      )
    ).toBeVisible()

    const actions = panelActions(page)
    await expect(actions).toHaveText([
      "Drop the category filter",
      "Drop the contributor filter",
      "Clear the search",
      `Search all ${allRecordings.length} for “wheel”`,
      "Clear all three",
    ])

    // The whole panel is operable from the keyboard with no pointer, and every
    // action rings while it holds focus — checkpoint 5 makes that acceptance.
    const labels = await actions.allTextContents()
    const rung: string[] = []
    for (let i = 0; i < 80 && rung.length < labels.length; i++) {
      await page.keyboard.press("Tab")
      const active = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        return (
          el && {
            label: el.textContent?.trim() ?? "",
            outline: getComputedStyle(el).outlineWidth,
          }
        )
      })
      if (active && labels.includes(active.label)) {
        expect(active.outline).toBe("3px")
        rung.push(active.label)
      }
    }
    expect(rung).toEqual(labels)

    // Every escape route lands somewhere with at least one card.
    const hrefs = await actions.evaluateAll((links) =>
      links.map((link) => (link as HTMLAnchorElement).getAttribute("href")!)
    )
    for (const href of hrefs) {
      await page.goto(href)
      expect(await cards(page).count()).toBeGreaterThan(0)
    }
  })

  test("one filter offers one action and no Clear all", async ({ page }) => {
    await page.goto("/products?search=zzzzz")

    await expect(
      page.getByText("Nothing in the catalogue matches “zzzzz”.")
    ).toBeVisible()
    await expect(page.getByText(/^Loosen one of the/)).toHaveCount(0)
    await expect(panelActions(page)).toHaveText(["Clear the search"])
  })

  test("a query no single drop explains says exactly that", async ({
    page,
  }) => {
    // Nothing in Accordions is by this Contributor, and nothing in the
    // catalogue matches the term — so every pair is empty too.
    await page.goto(
      `/products?category=Accordions&contributor=${encodeURIComponent(
        "Enzo Manuel Mangano ( Reactiive )"
      )}&search=zzzzz`
    )

    await expect(
      page.getByText(
        "No single filter explains it — nothing matches any two of the three."
      )
    ).toBeVisible()
    await expect(panelActions(page)).toHaveText(["Clear all three"])
  })

  test("an empty Saved list says where bookmarks live", async ({ page }) => {
    await page.goto("/bookmarks")

    // Under the heading the route already renders, not instead of it.
    await expect(
      page.getByRole("heading", { name: "Saved on this device" })
    ).toBeVisible()

    await expect(
      page.getByText(/^You haven’t saved anything yet\./)
    ).toBeVisible()

    // Decision 18: the copy has to be plain that the set is local to this
    // browser, and must not imply an account exists. The `sync` clause is gone
    // from the matcher because the replacement copy says "nothing is synced",
    // which is the same promise stated positively — the property is the same,
    // the regexp was checking it the wrong way round.
    const copy = (await page.getByText(/^Tap ◇ Save/).textContent()) ?? ""
    expect(copy).toContain("this browser on this device only")
    expect(copy).toContain("no account")
    expect(copy).not.toMatch(/sign in|log ?in/i)

    // Drawn, so it works (decision 2).
    await page.getByRole("link", { name: "Browse the catalogue" }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(cards(page)).toHaveCount(48)
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
    await expect(
      page.getByText(/^You haven’t saved anything yet\./)
    ).toHaveCount(0)

    release()
    await expect(cards(page)).toHaveCount(1)
    await expect(
      page.getByText(/^You haven’t saved anything yet\./)
    ).toHaveCount(0)

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
    await expect(
      page.getByText(/^You haven’t saved anything yet\./)
    ).toHaveCount(0)

    await context.close()
  })
})

// The mock's own grid, measured rather than described: five 208px tracks, 28px
// between rows and 24px between columns (Catalogue.dc.html:91, and the
// Specimen's spacing scale names both gaps outright). The row gap used to be a
// single `gap-6` on both axes, so it was 4px short.
test("the grid is the mock's five tracks at 1440px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")

  const measured = await page.evaluate(() => {
    const grid = document.querySelector('[class*="auto-fill"]')!
    const style = getComputedStyle(grid)
    return {
      columns: style.gridTemplateColumns,
      rowGap: style.rowGap,
      columnGap: style.columnGap,
    }
  })

  expect(measured.columns).toBe("208px 208px 208px 208px 208px")
  expect(measured.rowGap).toBe("28px")
  expect(measured.columnGap).toBe("24px")
})

test.describe("a card fills its track instead of overflowing it", () => {
  // `sm` and up, where the card used to be a fixed 221px against a fractional
  // track. Below `sm` the grid is one column and the card was already `w-full`.
  //
  // The tracks are fixed now — `repeat(auto-fill, 208px)`, ticket 08 step 4 —
  // which satisfies this by construction rather than by measurement. It is still
  // measured: fixed tracks are what ticket 12 removed, and the defect it removed
  // them for was card width ≠ track width, which is the thing below.
  for (const width of [390, 640, 768, 1024, 1280, 1440]) {
    for (const path of ["/", "/products"]) {
      test(`${path} at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 })
        await page.goto(path)

        const measured = await page.evaluate(() => {
          const grid = document.querySelector('[class*="auto-fill"]')
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
  for (const width of [390, 639, 640, 660, 700, 768, 1024, 1280, 1440]) {
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
