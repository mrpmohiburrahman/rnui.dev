import { expect, test } from "@playwright/test"

// github-star-button ticket 03.
//
// A bug fix in its own right, and the ticket says so: the phone `Saved` chip
// announced a bare number with nothing to attach it to, and the desktop chip
// broke onto two lines at 768 and 820 — a live production defect — because its
// visible word could not be dropped.
//
// The word and the accessible name were bound together, which is the whole
// reason the drop was impossible. These tests pin them apart: the name survives
// every width and both layouts, and the painting does not.
//
// **Nothing here asserts anything about the theme toggle, and that is
// deliberate.** The 768–880 band is also where the star control
// (ticket 04) reintroduces a toggle wrap *on purpose*. A test covering both
// controls passes today and goes red when that lands, and amending it to assert
// the toggle *does* wrap would pin an accepted defect as expected behaviour in a
// suite that outlives this effort. The toggle's state is a manual measurement in
// the pull request body.

// Below `lg`, which is Tailwind's default 1024px and is untouched by
// tailwind.config.ts (only `2xl` is overridden there). The word is `lg:inline`,
// so 1024 itself already shows it — the band that wraps is 768–880, comfortably
// below the breakpoint.
const WORDLESS_WIDTHS = [768, 820, 900, 1023]
const WORD_WIDTHS = [1024, 1280, 1440]

test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

test("the desktop chip announces Saved {count} at every width", async ({ page }) => {
  await page.goto("/")

  // Above the breakpoint the visible word is painted; below it, not. Either way
  // the name is the same string, which is the criterion that makes this ticket
  // safe to land alone.
  for (const width of [...WORD_WIDTHS, ...WORDLESS_WIDTHS]) {
    await page.setViewportSize({ width, height: 900 })
    const chip = page.locator('header a[href="/bookmarks"]').first()
    await expect(
      chip,
      `no "Saved {count}" name at ${width}px`
    ).toHaveAttribute("aria-label", /^Saved \d+$/)
  }
})

test("the phone chip announces Saved {count}, which it never did", async ({
  page,
}) => {
  // The defect this ticket exists for: `◆ 3`, read aloud as "three", with
  // nothing saying what three of.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  const chip = page.locator('header a[href="/bookmarks"]').last()
  await expect(chip).toBeVisible()
  await expect(chip).toHaveAttribute("aria-label", /^Saved \d+$/)

  // And no visible word was added to fix it — 320px has no room, and the fix is
  // the name rather than a smaller chip.
  const word = await chip
    .getByText("Saved", { exact: true })
    .count()
  expect(word, "the phone chip grew a visible word").toBe(0)
})

test("the name is not announced twice", async ({ page }) => {
  // Both halves of the chip are aria-hidden because the label carries the whole
  // name. Without that, a screen reader says "Saved 3, 3".
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  // The chip's own direct children, not every descendant: `aria-hidden` is
  // inherited, so the `◆` nested inside the word span is covered by its parent
  // and asserting it separately would be asserting the same thing twice.
  const chip = page.locator('header a[href="/bookmarks"]').first()
  const children = await chip.locator(":scope > span").all()
  expect(children.length).toBeGreaterThan(0)
  for (const span of children) {
    await expect(span).toHaveAttribute("aria-hidden", "true")
  }
})

test("the desktop chip is single-line at 768 and 820", async ({ page }) => {
  // The regression this ticket repairs. Two lines at these widths pushed the mode
  // toggle off-screen, which is how the defect reached production unnoticed.
  await page.goto("/")
  for (const width of WORDLESS_WIDTHS) {
    await page.setViewportSize({ width, height: 900 })
    const box = await page
      .locator('header a[href="/bookmarks"]')
      .first()
      .boundingBox()
    expect(box, `no chip at ${width}px`).not.toBeNull()
    // One line is a height of one text line plus the 6px vertical padding and the
    // 1px borders: ~33px. Two lines measured ~54px before this ticket.
    expect(
      box!.height,
      `the chip wraps onto two lines at ${width}px`
    ).toBeLessThan(42)
  }
})

test("the word returns at the middle breakpoint, and the counts keep no reservation", async ({
  page,
}) => {
  await page.goto("/")

  // Below it the word takes no room. Measured as a box rather than by
  // `offsetParent`, because `sr-only` is `position:absolute` and has one while
  // painting nothing — which is how an earlier version of this assertion
  // reported a hidden word as visible.
  await page.setViewportSize({ width: 1023, height: 900 })
  const hidden = await page
    .locator('header a[href="/bookmarks"]')
    .first()
    .getByText("Saved", { exact: true })
    .boundingBox()
  expect(hidden, "the word left the DOM entirely below the breakpoint").toBeNull()

  // At and above it, a real box. `lg` is Tailwind's unmodified 1024px.
  await page.setViewportSize({ width: 1024, height: 900 })
  const shown = await page
    .locator('header a[href="/bookmarks"]')
    .first()
    .getByText("Saved", { exact: true })
    .boundingBox()
  expect(shown, "the word did not return at the breakpoint").not.toBeNull()
  expect(shown!.width).toBeGreaterThan(20)

  // Ticket 03 is explicit that the no-reservation rule stays removed: `min-w-[2ch]`
  // came off once so a 0 → 3 change could not shove the toggle sideways.
  const chip = page.locator('header a[href="/bookmarks"]').first()
  await expect(chip).not.toHaveCSS("min-width", /\\d/)
})