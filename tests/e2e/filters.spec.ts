import { expect, test, type Page } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

// One save button per card, as pagination.spec.ts counts them.
const cards = (page: Page) => page.getByRole("button", { name: /^Saved?$/ })

// The first card's caption, which is how an order is compared: the save button
// is named "Save" or "Saved" on every card and identifies none of them.
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

  // The dock's Filters button. The ⚙ at :45 is `aria-hidden` and the count
  // badge is not, so the accessible name is "Filters 2" — matched by regex
  // because the number is the thing under test in two of these.
  const dockFilters = (page: Page) =>
    page.getByRole("button", { name: /Filters/ })
  const sheet = (page: Page) => page.getByRole("dialog")

  // The dock is `fixed` to the bottom of the viewport (filter-dock.tsx:183),
  // and its trigger opens the only filter surface a phone visitor has below
  // `md` — the rail and its route to the filters are `md` and up. The regression
  // the old header trigger hit, the one this scroll guards, is a control that
  // scrolls away with the document: a `fixed` element cannot.
  test("the dock stays on screen after a scroll", async ({ page }) => {
    await page.goto("/products")
    await page.evaluate(() => window.scrollTo(0, 2_000))
    expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(1_000)

    // Both buttons, which is what the acceptance says: "holds `⚙ Filters` with
    // a count badge and `↕ Recent`, and both are still in the viewport".
    await expect(dockFilters(page)).toBeInViewport()
    await expect(
      page.locator("[data-testid='dock']").getByRole("button", {
        name: "Recent",
      })
    ).toBeInViewport()
  })

  // The tap-swallowing guard, re-aimed from the header pill (the padded
  // `wrapper` strip ate taps on the card behind it, commit 02c3730) to the
  // fixed dock. `main` keeps a `calc(96px + safe-area)` clearance under the
  // grid so the dock never covers the last row; this probes the seam: 8px
  // above the dock's top edge, over the Filters button's centre, must be the
  // grid, not the dock.
  test("a fixed dock swallows no tap above it", async ({ page }) => {
    await page.goto("/products")
    // The Filters button sits inside the dock's 12px inset, so its box is not
    // the dock's: probe off the bar's own bounds, from `[data-testid='dock']`.
    const dock = page.locator("[data-testid='dock']")
    const box = await dock.boundingBox()
    expect(box).not.toBeNull()

    const hit = (x: number, y: number) =>
      page.evaluate(
        ([px, py]) => {
          const el = document.elementFromPoint(px, py)
          if (!el) return "none"
          if (el.closest("[data-testid='dock']")) return "dock"
          if (el.closest("main")) return "grid"
          return "other"
        },
        [x, y]
      )

    // Above the dock, dead over the Filters button.
    expect(await hit(box!.x + box!.width / 2, box!.y - 8)).toBe("grid")

    // The dock is `inset-x-0`, so there is nothing to its left to probe — the
    // point 8px left of the button is the dock's own painted bar, which is
    // correct: that bar is visible, not a transparent wrapper that eats grid
    // taps. The second point is therefore the seam the drawing is actually
    // about: over the dock's left gutter, 8px above its top — a transparent
    // wrapper pinned to the dock's left would overhang there exactly as the old
    // strip hung off the pill.
    expect(await hit(box!.x + 8, box!.y - 8)).toBe("grid")
  })

  test("the sheet shows every Category and Contributor, and the last row is reachable", async ({
    page,
  }) => {
    await page.goto("/products")
    await dockFilters(page).click()
    await expect(sheet(page)).toBeVisible()

    // All 18 Category chips, alphabetical as `getUniqueCategories()` orders
    // them — the drawn CATEGORY · 18 of CatalogueMobile.dc.html:58.
    await expect(sheet(page).getByText("CATEGORY · 18")).toBeVisible()
    await expect(sheet(page).locator('a[href*="category="]')).toHaveCount(18)

    // The Contributors all appear, label and rows — the acceptance's "a
    // CONTRIBUTOR · label whose number is contributors.length over that many
    // rows". The count is a real length, and ticket 10 trims a trailing-space
    // duplicate so the figure moves; read it from the label, never a literal.
    const contributorCount = (await sheet(page)
      .getByText(/^CONTRIBUTOR · \d+$/)
      .textContent())!.match(/\d+/)?.[0]
    expect(contributorCount).toBeTruthy()
    await expect(sheet(page).locator('a[href*="contributor="]')).toHaveCount(
      Number(contributorCount)
    )

    // The last row can be reached: the scroll body is capped at 85svh and the
    // sheet is `fixed` over the dock, so there is no outer scroll to fall back
    // on — the row must be reachable inside the panel.
    const last = sheet(page).locator('a[href*="contributor="]').last()
    await last.scrollIntoViewIfNeeded()
    await expect(last).toBeInViewport()
    await last.click()
    await expect(page).toHaveURL(/contributor=/)
  })

  // Step 5 exists so the sheet stays open across a facet tap: a facet link is a
  // real navigation that remounts the tree, so component state would close it;
  // `?filters=open` rides in the href and survives. Clicking the applied facet
  // clears it through the same rule.
  test("composing facets keeps the sheet open and the dock badge honest", async ({
    page,
  }) => {
    await page.goto("/products")
    await dockFilters(page).click()
    await expect(sheet(page)).toBeVisible()

    // By accessible name, not by href: an applied facet's href is the one that
    // *clears* it, so it carries no `category=` at all and an href selector
    // stops matching the moment the chip is on. The counts are aria-hidden, so
    // the name is the bare facet.
    await sheet(page).getByRole("link", { name: "Misc", exact: true }).click()
    await expect(page).toHaveURL(/category=Misc/)
    await expect(sheet(page)).toBeVisible()

    await sheet(page)
      .getByRole("link", { name: "Hewad Mubariz", exact: true })
      .click()
    await expect(page).toHaveURL(/category=Misc/)
    await expect(page).toHaveURL(/contributor=Hewad\+Mubariz/)
    await expect(sheet(page)).toBeVisible()

    // Both rows in the applied treatment, the acceptance's own words — the
    // soft accent fill the rail's applied rows also wear, asserted the same way
    // the desktop facet tests assert it.
    await expect(
      sheet(page).getByRole("link", { name: "Misc", exact: true })
    ).toHaveClass(/bg-acc-soft/)
    await expect(
      sheet(page).getByRole("link", { name: "Hewad Mubariz", exact: true })
    ).toHaveClass(/bg-acc-soft/)

    // The dock badge reads 2 — two facets, and never the search term. Scoped to
    // the bar, not a button role: Radix marks the app `aria-hidden`/`inert`
    // behind the open dialog, so the dock's controls drop out of the role tree
    // while the sheet is up (they are still rendered and painted).
    await expect(
      page.locator("[data-testid='dock']").getByText("2")
    ).toBeVisible()

    // Tapping Misc again removes only `category=`, leaving the contributor and
    // the sheet open.
    await sheet(page).getByRole("link", { name: "Misc", exact: true }).click()
    await expect(page).not.toHaveURL(/category=/)
    await expect(page).toHaveURL(/contributor=/)
    await expect(sheet(page)).toBeVisible()
  })

  // A search term is not a Facet: it has an event of its own, and the badge is
  // the same number `active_filter_count` reports, so one applied Category next
  // to a search box with something in it is 1.
  test("the badge counts facets and not the search term", async ({ page }) => {
    await page.goto("/products?category=Misc&search=ticket")
    await expect(dockFilters(page)).toHaveAccessibleName("Filters 1")
  })

  // Clear all keeps `sort`, because on this surface the sort lives inside the
  // same sheet — a Clear all that also re-sorted the list is the surprise. And
  // it is disabled with nothing to clear: a control that answers nothing is a
  // $dead_click, and the mock only ever draws it with filters applied.
  test("Clear all drops both facets and leaves the sort alone", async ({
    page,
  }) => {
    await page.goto("/products?filters=open&sort=top-viewed")
    await expect(sheet(page)).toBeVisible()
    await expect(
      sheet(page).getByRole("link", { name: "Clear all", exact: true })
    ).toBeDisabled()

    await page.goto(
      "/products?filters=open&sort=top-viewed&category=Misc&contributor=Hewad+Mubariz"
    )
    await sheet(page)
      .getByRole("link", { name: "Clear all", exact: true })
      .click()

    await expect(page).not.toHaveURL(/category=/)
    await expect(page).not.toHaveURL(/contributor=/)
    await expect(page).toHaveURL(/sort=top-viewed/)
  })

  test("Escape closes the sheet and hands focus back to the dock", async ({
    page,
  }) => {
    await page.goto("/products")
    await dockFilters(page).click()
    await expect(sheet(page)).toBeVisible()

    await page.keyboard.press("Escape")
    await expect(sheet(page)).toHaveCount(0)
    await expect(dockFilters(page)).toBeFocused()
    await expect(page).not.toHaveURL(/filters=open/)
  })

  // Opening the filters is a mode, not a step, so it is written with
  // replaceState: Back must return to wherever the visitor came from and not
  // peel the panel open again. The shared-link half of the same param is the
  // cold load above it.
  test("the open sheet is the address, and costs no history entry", async ({
    page,
  }) => {
    await page.goto("/products?filters=open")
    await expect(sheet(page)).toBeVisible()

    await page.goto("/products")
    const before = await page.evaluate(() => history.length)
    await dockFilters(page).click()
    await expect(sheet(page)).toBeVisible()
    await expect(page).toHaveURL(/filters=open/)

    // `Show N recordings` closes it and does nothing else — the filters were
    // applied on the way in — and N is the first number in the result line.
    const shown = (await page
      .getByText(/^\d+ OF \d+ · /)
      .first()
      .textContent())!.match(/^\d+/)![0]
    await page.getByRole("button", { name: `Show ${shown} recordings` }).click()

    await expect(sheet(page)).toHaveCount(0)
    await expect(page).not.toHaveURL(/filters=open/)
    expect(await page.evaluate(() => history.length)).toBe(before)
  })

  // The Specimen gives this surface one line — "Bottom sheet (mobile) · 260ms
  // spring, no overshoot" — and it has to be an animation rather than a
  // transition twice over: Radix portals the panel in already `data-state=open`
  // so a transition has no frame to start from, and Radix's Presence waits on
  // `animationend` and unmounts a transitioned close before it paints. Both
  // failures look identical from outside — the sheet just appears — so the
  // assertion is on the computed properties, not on a frame count.
  test("the sheet animates at the Specimen's 260ms", async ({ page }) => {
    await page.goto("/products")
    await dockFilters(page).click()
    await expect(sheet(page)).toBeVisible()

    const style = await sheet(page).evaluate((el) => {
      const computed = getComputedStyle(el)
      return {
        name: computed.animationName,
        duration: computed.animationDuration,
        ease: computed.animationTimingFunction,
      }
    })
    expect(style.name).not.toBe("none")
    expect(style.duration).toBe("0.26s")
    expect(style.ease).toBe("cubic-bezier(0.2, 0.8, 0.2, 1)")
  })

  // /bookmarks passes neither facet list — it is "use client" and a value
  // import of @/data/* would drag the catalogue into a client chunk — and no
  // facet applies to a set the Remembered ids define. So there is nothing for a
  // Filters button to open, and the dock is the sort button alone.
  test("the dock on /bookmarks is the sort button alone", async ({ page }) => {
    await page.goto("/bookmarks")
    const dock = page.locator("[data-testid='dock']")
    await expect(dock).toBeVisible()
    await expect(dock.getByRole("button", { name: /Filters/ })).toHaveCount(0)
    await expect(dock.getByRole("button", { name: "Recent" })).toBeVisible()
  })

  // A plural that is wrong is the same lie as a count that is wrong. Derived
  // from the catalogue rather than written down, so the day a second Recording
  // lands in that Category this fails instead of quietly asserting nothing.
  test("Show N recordings is singular at one", async ({ page }) => {
    const only = Object.entries(
      allRecordings.reduce<Record<string, number>>((counts, recording) => {
        counts[recording.category] = (counts[recording.category] ?? 0) + 1
        return counts
      }, {})
    ).find(([, count]) => count === 1)
    expect(only).toBeTruthy()

    await page.goto(
      `/products?filters=open&category=${encodeURIComponent(only![0])}`
    )
    await expect(
      sheet(page).getByRole("button", { name: "Show 1 recording" })
    ).toBeVisible()
  })

  test.describe("reduced motion", () => {
    // Under contextOptions, not as a bare option: Playwright 1.60 moved it
    // there (recording-route.spec.ts:455).
    test.use({ contextOptions: { reducedMotion: "reduce" } })

    // The Specimen's rule for this surface is "all durations 0ms", and the
    // panel's own 260ms is a keyframe animation — so the assertion is that no
    // frame of it ever paints, sampled at the frame clock rather than over a
    // CDP round-trip.
    test("the sheet appears with no intermediate frame", async ({ page }) => {
      await page.goto("/products")

      await page.evaluate(() => {
        const w = window as unknown as {
          __sheetFrames: string[]
          __stopSheet: () => void
        }
        w.__sheetFrames = []
        let running = true
        w.__stopSheet = () => {
          running = false
        }
        const tick = () => {
          const panel = document.querySelector('[role="dialog"]')
          if (panel) w.__sheetFrames.push(getComputedStyle(panel).transform)
          if (running) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })

      await dockFilters(page).click()
      await expect(sheet(page)).toBeVisible()
      await page.keyboard.press("Escape")
      await expect(sheet(page)).toHaveCount(0)

      const frames = await page.evaluate(() => {
        const w = window as unknown as {
          __sheetFrames: string[]
          __stopSheet: () => void
        }
        w.__stopSheet()
        return w.__sheetFrames
      })
      expect(frames.length).toBeGreaterThan(0)
      expect([...new Set(frames)]).toHaveLength(1)
    })
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

// Until ticket 08 the only way to drop a filter was to find the same rail row
// and click it again, and a search term had no removal control at all. The bar
// above the heading row is the one place all three are visible at once.
test.describe("the filter bar", () => {
  const BAR_URL = `/products?category=Misc&contributor=${encodeURIComponent(
    "Enzo Manuel Mangano (Reactiive)"
  )}`

  // A chip, by the ✕ that removes it — the label is the mock's own, and the
  // chip is that control's parent span. Not scoped to a role: the two facet ✕
  // are Links, because a facet has an href, and the search ✕ is a button,
  // because clearing a term is a replace on the route the visitor is on.
  // `filter({ visible: true })` because the phone header's chips row carries
  // its own copy of the same label below `md`, hidden by `md:hidden` — at a
  // desktop width it is still in the DOM and getByLabel matches it.
  const chip = (page: Page, label: string) =>
    page.getByLabel(label).locator("..").filter({ visible: true })

  test("counts the active facets and names each one", async ({ page }) => {
    await page.goto(BAR_URL)

    await expect(page.getByText("2 ACTIVE")).toBeVisible()
    await expect(chip(page, "Remove category filter")).toHaveText(
      "CATEGORYMisc✕"
    )
    // The stored spelling, with the spaces inside the parentheses — the mock
    // tidies them and the data does not, and the chip renders what
    // `?contributor=` actually holds.
    await expect(chip(page, "Remove contributor filter")).toHaveText(
      "BYEnzo Manuel Mangano (Reactiive)✕"
    )
  })

  test("removing one chip leaves the other and drops the page", async ({
    page,
  }) => {
    await page.goto(`${BAR_URL}&page=2`)
    await page.getByRole("link", { name: "Remove category filter" }).click()

    await expect(page).toHaveURL(/contributor=/)
    await expect(page).not.toHaveURL(/category=/)
    await expect(page).not.toHaveURL(/page=/)
  })

  test("Clear all lands on the unfiltered catalogue", async ({ page }) => {
    await page.goto(BAR_URL)
    await page.getByRole("link", { name: "Clear all" }).click()

    await expect(page).toHaveURL(/\/products$/)
  })

  test("the search chip clears the term without leaving the route", async ({
    page,
  }) => {
    await page.goto("/?search=wheel")
    await expect(page.getByText("1 ACTIVE")).toBeVisible()
    await expect(chip(page, "Clear search")).toHaveText("SEARCH“wheel”✕")

    await page.getByRole("button", { name: "Clear search" }).click()

    // `/`, not `/products`: the box works on whatever route it is on, and so
    // does its chip. And no query string at all, not a bare `?`.
    await expect
      .poll(() => new URL(page.url()).pathname + new URL(page.url()).search)
      .toBe("/")
  })

  test("the saved view draws no bar", async ({ page }) => {
    await page.goto("/bookmarks?category=Misc")
    await expect(page.getByText(/\d+ ACTIVE/)).toHaveCount(0)
  })

  // Every control in the bar is reachable and operable without a pointer, and
  // shows a ring while it is — ui-ux-overhaul ticket 07 is what put visible
  // focus on this site, and studio-dark checkpoint 5 makes keyboard
  // verification acceptance rather than a follow-up.
  test("every control in the bar takes focus and shows a ring", async ({
    page,
  }) => {
    await page.goto(`${BAR_URL}&search=wheel`)

    // Tab, not `.focus()`: the ring is `:focus-visible`, so a mouse click draws
    // nothing (ui-ux-overhaul ticket 07) and programmatic focus is not the thing
    // under test. Four controls, each reached by keyboard alone.
    const reached: string[] = []
    for (let i = 0; i < 60 && reached.length < 4; i++) {
      await page.keyboard.press("Tab")
      const active = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null
        if (!el) return null
        return {
          label: el.getAttribute("aria-label") ?? el.textContent?.trim() ?? "",
          outline: getComputedStyle(el).outlineWidth,
        }
      })
      if (
        active &&
        [
          "Remove category filter",
          "Remove contributor filter",
          "Clear search",
          "Clear all",
        ].includes(active.label)
      ) {
        expect(active.outline).toBe("3px")
        reached.push(active.label)
      }
    }
    expect(reached).toEqual([
      "Remove category filter",
      "Remove contributor filter",
      "Clear search",
      "Clear all",
    ])
  })

  // The Specimen's "all durations 0ms" (Specimen.dc.html:95).
  //
  // This asserts the *behaviour* now, not `transitionDuration`. The chip's 120ms
  // used to be a CSS transition, reached by the global rule in app/globals.css,
  // and reading the computed duration was a fair proxy for it. It is a framer
  // transition since step 14, gated by `useReducedMotion()` — and framer writes
  // inline styles per frame and never reads a CSS transition, so the old
  // assertion would now pass on a chip with no rule at all and no gate at all.
  // A swapped-out guard must not take its test with it.
  test("a chip does not animate out under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" })
    await page.goto(BAR_URL)

    const opacities = await page.evaluate(async () => {
      const x = Array.from(
        document.querySelectorAll('[aria-label="Remove category filter"]')
      ).find((el) => (el as HTMLElement).offsetParent !== null) as
        | HTMLElement
        | undefined
      if (!x) return null
      const chip = x.parentElement!
      const seen: number[] = []
      let gone = false
      let frame = 0
      const sample = () => {
        if (document.body.contains(chip)) {
          seen.push(Number.parseFloat(getComputedStyle(chip).opacity))
        } else if (seen.length) {
          gone = true
          return
        }
        frame = requestAnimationFrame(sample)
      }
      sample()
      x.click()
      for (let waited = 0; waited < 5000 && !gone; waited += 50) {
        await new Promise((resolve) => setTimeout(resolve, 50))
      }
      cancelAnimationFrame(frame)
      return seen
    })

    expect(opacities, "the category chip was not on the page").not.toBeNull()
    // The exact inverse of the test below: there, a fractional opacity proves the
    // exit played; here, its absence proves the chip snapped.
    expect(
      opacities!.filter((o) => o > 0 && o < 1),
      `the chip faded under reduced motion instead of snapping. Sampled: ${opacities?.join(", ")}`
    ).toEqual([])
  })

  // studio-dark ticket 13 step 14 fallout. The test above passes on a chip that
  // never animates at all — it reads the declared duration, not a played frame,
  // which is exactly how "Filter chip add / remove · 120ms ease-out"
  // (Specimen.dc.html:163) shipped as dead classes: a CSS transition on a node
  // React mounts and unmounts outright has no starting frame to leave on entry
  // and is gone before it can paint on exit.
  //
  // Presence is deliberately not the assertion. Removing a facet is a client
  // navigation that re-renders the grid, measured at 248ms, so the chip is
  // still in the DOM a frame later whether or not anything animated — a
  // presence check would pass on the broken build. A fractional opacity can
  // only come from a played frame.
  test("a removed chip plays its exit instead of vanishing", async ({
    page,
  }) => {
    await page.goto(BAR_URL)

    const opacities = await page.evaluate(async () => {
      // The *visible* one. Two rows carry this label — this bar and the phone
      // header's own chips row (components/site-header.tsx), which is in the DOM
      // at a desktop width behind `md:hidden`. `querySelector` returns the
      // header's copy, which this bar's motion does not own; sampling it reads a
      // chip that was never meant to animate and reports the wrong verdict.
      // The `chip()` helper above filters on visibility for the same reason.
      const x = Array.from(
        document.querySelectorAll('[aria-label="Remove category filter"]')
      ).find((el) => (el as HTMLElement).offsetParent !== null) as
        | HTMLElement
        | undefined
      if (!x) return null
      const chip = x.parentElement!
      const seen: number[] = []
      let frame = 0
      let gone = false
      const sample = () => {
        if (document.body.contains(chip)) {
          seen.push(Number.parseFloat(getComputedStyle(chip).opacity))
        } else if (seen.length) {
          gone = true
          return
        }
        frame = requestAnimationFrame(sample)
      }
      sample()
      x.click()
      // Generous, and deliberately so. The exit cannot start until the client
      // navigation has re-rendered and dropped the chip from `active` — measured
      // at ~300ms here, against the 248ms median in checkpoint-13-gate.md and a
      // spread on top. A 400ms window ended while the chip was still sitting at
      // opacity 1 waiting to be removed, and read that as "never animated".
      // Sampling stops as soon as the node leaves the DOM, so the ceiling only
      // costs time on an actual failure.
      // 5s, not the 1.5s this first carried. The wait is for a client navigation
      // to re-render and drop the chip, and under the suite's four workers that
      // takes materially longer than it does alone — at 1.5s this test passed in
      // isolation and failed in a full run, which is the worst way for a test to
      // behave. The loop exits the moment the node leaves the DOM, so a healthy
      // build still finishes in ~300ms and only a real failure pays the ceiling.
      const deadline = 5000
      const step = 50
      for (let waited = 0; waited < deadline && !gone; waited += step) {
        await new Promise((resolve) => setTimeout(resolve, step))
      }
      cancelAnimationFrame(frame)
      return seen
    })

    expect(opacities, "the category chip was not on the page").not.toBeNull()
    expect(
      opacities!.some((o) => o > 0 && o < 1),
      `never sampled a partial opacity — the chip disappeared without playing its exit. Sampled: ${opacities?.join(", ")}`
    ).toBe(true)
  })
})

// 265, not the mock's literal `width:232px` (Catalogue.dc.html:36). The drawing
// has no CSS reset, so its nav is content-box and that 232 is the content: plus
// `padding:20px 16px 30px` either side and the 1px right border, the rail is
// 265 across as drawn — measured on the mock at a 1440 canvas, nav 8->273 with
// the body's own 8px margin. This aside is border-box, so 232 here drew a rail
// 33px narrower than the drawing and started the grid 33px left of it.
test("the rail is 265px wide and main starts exactly beside it", async ({
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
  expect(box.width).toBe(265)
  // No gap or overlap: main starts where the rail ends.
  expect(box.mainLeft).toBe(box.railLeft + 265)
})
