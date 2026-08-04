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

// The `/` shortcut the search field's chip advertises (Catalogue.dc.html:22,
// ticket 04 step 6). One document-level listener in the header answers a bare
// `/` and nothing else — the three early returns in site-header.tsx are an
// input (including the search box itself), a [contenteditable] and a trapped
// dialog. Asserting the first half of each: it focuses and selects the visible
// search box, and it never types a character.
for (const route of ["/", "/products", "/bookmarks"]) {
  test(`/ focuses and selects the search box on ${route}`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole("textbox", { name: /search/i })).toBeVisible()

    // /bookmarks hydrates its grid from a Suspense boundary; pressing before the
    // input has finished hydrating focuses an element React then replaces, and
    // the focus is lost on the swap. A real visitor can only press after the
    // page is interactive, so wait to be interactive rather than asserting a
    // focus the draw cannot hold yet.
    await page.waitForLoadState("networkidle")

    await page.keyboard.press("/")

    const box = page.getByRole("textbox", { name: /search/i })
    await expect(box).toBeFocused()
    // select()ed, so the value — had there been one — is selected; the box is
    // empty here, so the selection is asserted as a zero-length caret at the
    // start rather than as a highlighted range.
    const sel = await box.evaluate((el) => {
      const input = el as HTMLInputElement
      return [input.selectionStart, input.selectionEnd] as const
    })
    expect(sel).toEqual([0, 0])
    // And nothing was typed: a plain `/` in the box would have been the focus
    // mechanism's own keystroke, not this shortcut's.
    await expect(box).toHaveValue("")
  })
}

test("/ does nothing inside the search box, and nothing reaches a dialog", async ({
  page,
}) => {
  // Caret already in the box: the shortcut must not steal the keystroke, so a
  // typed `/` is the box's own character, not a refocus of it. (Focus being
  // moved at all is the other test's job; this one is about the two guards.)
  await page.goto("/")
  const box = page.getByRole("textbox", { name: /search/i })
  await page.waitForLoadState("networkidle")
  await box.click()
  await box.pressSequentially("/")
  await expect(box).toHaveValue("/")

  // Inside the open Recording overlay the key is inert on a fresh load — no
  // keystroke in the box first, so the focus contract is unclouded — because
  // yanking focus out of a trapped dialog is worse than not answering it.
  // The dialog is a Radix Dialog, so everything outside it is aria-hidden and
  // gone from the accessibility tree; assert the real thing, that focus stayed
  // inside the dialog, rather than on a textbox getByRole cannot even see.
  await page.goto("/")
  await page.getByRole("heading", { level: 3 }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("/")
  const focus = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    return { inDialog: !!el?.closest('[role="dialog"]'), tag: el?.tagName }
  })
  expect(focus.inDialog).toBe(true)
  // The overlay still has focus (the close button), so the trap held.
  await expect(
    page.getByRole("button", { name: "Close, or press Escape" })
  ).toBeFocused()
})

// The same two keys that drive the overlay's save and vote, typed into the
// search box: they are the box's letters now, not the overlay's commands, and
// they must toggle nothing. The overlay half of the pair is
// recording-route.spec.ts:273-309.
test("s and v in the search box insert letters and toggle nothing", async ({
  page,
}) => {
  await page.goto("/")
  const box = page.getByRole("textbox", { name: /search/i })
  await box.click()

  const save = page.getByRole("button", { name: /^Saved?$/ }).first()
  const vote = page.getByRole("button", { name: /^Vote/ }).first()
  const saved = await save.getAttribute("aria-pressed")
  const voted = await vote.getAttribute("aria-pressed")

  await page.keyboard.press("s")
  await page.keyboard.press("v")
  await expect(box).toHaveValue("sv")
  expect(await save.getAttribute("aria-pressed")).toBe(saved)
  expect(await vote.getAttribute("aria-pressed")).toBe(voted)
})

// The legend's three controls each carry an aria-keyshortcuts equal to the key
// the legend names (Detail.dc.html:24-25). ← and → are keys only — ticket 09
// builds no prev/next control — so they are absent here by construction. The
// keyshortcuts are overlay chrome (recording-overlay.tsx sets keyboardControls),
// so the panel must be open to see them.
test("save, vote and close each carry their aria-keyshortcuts", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("heading", { level: 3 }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()

  await expect(
    page.getByRole("button", { name: /^Save/ }).last()
  ).toHaveAttribute("aria-keyshortcuts", "s")
  await expect(
    page.getByRole("button", { name: /^Vote/ }).last()
  ).toHaveAttribute("aria-keyshortcuts", "v")
  await expect(
    page.getByRole("button", { name: "Close, or press Escape" })
  ).toHaveAttribute("aria-keyshortcuts", "Escape")
})
