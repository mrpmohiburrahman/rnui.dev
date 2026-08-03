import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  // Nor is it a viewing. Demos autoplay, and nothing here is about playback, so
  // letting them run would bill views against the real catalogue on every run.
  await page.route("**/demo/**", (route) => route.abort())
})

// Written out rather than imported, for the reason tests/e2e/remembered-set.spec.ts
// records: what matters is the key already sitting in visitors' browsers.
const BOOKMARKS_KEY = "bookmarkedItems"

// An anchor inside an anchor is not navigable markup and browsers recover from
// it by splitting the tree. The card holds three profile links, a Source link
// and now a headline link, so wrapping the card itself would have created five.
//
// Every catalogue route, because the claim is about the card and the card is the
// same component on all three. /bookmarks is seeded first: with nothing saved it
// renders no cards at all, so it would pass this without ever rendering the
// markup under test.
for (const route of ["/", "/products", "/bookmarks"]) {
  test(`${route} nests no anchor inside another`, async ({ page }) => {
    await page.addInitScript(
      ([key, id]) => localStorage.setItem(key, JSON.stringify([id])),
      [BOOKMARKS_KEY, allRecordings[0].id]
    )
    await page.goto(route)
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible()
    expect(await page.locator("a a").count()).toBe(0)
  })
}

// The card body is a div with an onClick — a mouse affordance no Tab reaches.
// Before the headline became a link, the detail view had no keyboard route at
// all: the poster area held one focusable thing, a play button, and that played
// the Demo. Demos autoplay now, so it holds none.
test("the headline opens the Recording from the keyboard", async ({ page }) => {
  await page.goto("/")

  const headline = page
    .getByRole("heading", { level: 3 })
    .first()
    .getByRole("link")
  await expect(headline).toBeVisible()

  await headline.focus()
  await page.keyboard.press("Enter")

  await expect(page).toHaveURL(/\/recording\/[0-9A-Za-z]{26}/)
  await expect(page.getByRole("dialog")).toBeVisible()
})

// Focus rings: `focus:outline-none` used to sit on the bookmark, vote and play
// buttons, so a keyboard visitor arrived at a control with no way to tell they
// had. Nothing replaced it — the browser's own ring draws on :focus-visible
// only, which is why a mouse click still shows none.
//
// The play button is not in the list below because it no longer exists: the
// Demo autoplays and the tile is not focusable at all.
test("focused controls draw a ring, clicked ones do not", async ({ page }) => {
  await page.goto("/")

  // One real Tab first. :focus-visible is a heuristic on the last input
  // modality, and a programmatic .focus() only matches it while the page has
  // seen no pointer — true straight after goto, but true by accident. A
  // keypress puts the browser in the modality this test is about.
  await page.keyboard.press("Tab")

  // The UA rule is `:focus-visible { outline: -webkit-focus-ring-color auto 1px }`,
  // so "none" here means the element draws no ring at all.
  const ring = () =>
    page.evaluate(() =>
      document.activeElement
        ? getComputedStyle(document.activeElement).outlineStyle
        : null
    )

  const bookmark = page.getByRole("button", { name: /^Saved?$/ }).first()
  for (const control of [
    bookmark,
    page.getByRole("heading", { level: 3 }).first().getByRole("link"),
    page.getByRole("link", { name: "Repo" }).first(),
    page.getByRole("button", { name: /^Vote/ }).first(),
  ]) {
    await control.focus()
    expect(await ring(), await control.innerText()).not.toBe("none")
  }

  // The same control reached by mouse. :focus-visible is false for a pointer,
  // so deleting focus:outline-none is invisible to a mouse visitor — which is
  // what keeps this out of decision 1's appearance freeze.
  await bookmark.click()
  expect(await ring()).toBe("none")
})

// opacity-10 plus pointer-events-none until :hover. Neither removes an element
// from the tab order, and on touch there is no hover at all — so the control was
// invisible to everyone and usable by no one but a mouse. Run with a touch
// screen, because that is the case that had no way through it.
test.describe("touch", () => {
  test.use({ hasTouch: true })

  test("the bookmark control is usable with no pointer on the card", async ({
    page,
  }) => {
    await page.goto("/")

    const bookmark = page.getByRole("button", { name: "Save" }).first()
    await expect(bookmark).toBeVisible()
    expect(await bookmark.evaluate((el) => getComputedStyle(el).opacity)).toBe(
      "1"
    )

    // A tap toggles the bookmark and does not open the Recording behind it.
    await bookmark.tap()
    await expect(
      page.getByRole("button", { name: "Saved" }).first()
    ).toBeVisible()
    await expect(page).not.toHaveURL(/\/recording\//)
  })
})

// The field had no aria-label, no name, no id, no title and no placeholder. Its
// visible hint was a separate <p> associated with it by nothing, cycling through
// all 18 Categories every 3 seconds with no prefers-reduced-motion check.
test("the search field is named, and its hint stands still", async ({
  page,
}) => {
  await page.goto("/")

  const box = page.getByRole("textbox", { name: /search/i })
  await expect(box).toBeVisible()

  const hint = () => box.getAttribute("placeholder")
  const first = await hint()
  expect(first).toBeTruthy()

  // Longer than the 3-second cycle, across a visibility change — the old
  // interval was torn down and restarted on visibilitychange, so a hidden tab
  // was the one path that could reset it.
  await page.waitForTimeout(3_500)
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await page.waitForTimeout(3_500)

  expect(await hint()).toBe(first)
})
