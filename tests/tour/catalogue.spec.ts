import { expect, test } from "@playwright/test"

// The single scripted tour for ticket 14's before/after recordings. One script,
// run against three checkouts (main, deploy A, Studio Dark) and twice per mode.
// The identity of the script — same waits, same scroll offsets, same actions — is
// the whole value: two clips that pause in the same places at the same moments
// compare; two hand-driven captures do not.
//
// Per ticket 14 step 2:
//   - the tour asserts almost nothing. One soft check at the top — the page
//     responded — and nothing after, because a failed `expect` truncates the
//     video at that frame and wastes the capture.
//   - every wait is an explicit duration, never waitForLoadState or an
//     auto-retrying locator. Those settle at different times on different
//     builds, which desynchronises exactly the thing being compared. S1 is
//     slower than S3 by design; let the clip show that, do not let it shift the
//     timeline.
//   - driven by visible text and ARIA role, not by data-testid. The testids in
//     tests/e2e/ were added by ui-ux-overhaul and mostly do not exist on `main`.
//   - the few genuine differences between states live in PER_STATE below, not
//     branched through the tour body.

// The route. The clip is about the catalogue, not the ten routes.
const PATH = "/"

// Per-state selectors. S1 (`main`) predates the Entry→Recording rename and has
// no keyboard layer; Studio Dark and deploy A share the post-rename vocabulary.
// Keep the differences tiny and declared here so the body stays identical.
const PER_STATE = {
  // Both Studio Dark and deploy A label the control "Save"; main labelled it
  // "Bookmark". Match either so one script runs on all three checkouts.
  saveButton: 'button:has-text("Save"), button:has-text("Bookmark")',
  // A Category chip in the rail. "Buttons" exists in all three states.
  categoryChip: 'button:has-text("Buttons")',
  // First card headline link — opens the detail overlay.
  firstCard: "h3 a",
  // The sort control. Labels differ slightly across states; match the common
  // words rather than the exact string.
  sortControl: 'button:has-text("Recent"), button:has-text("Most viewed")',
  // Theme switch in the header.
  themeToggle: 'button:has-text("Dark"), button:has-text("Light")',
}

test("catalogue tour", async ({ page }) => {
  // One soft check, and only before the tour begins.
  await page.goto(PATH, { waitUntil: "domcontentloaded" })
  await expect(page.getByRole("heading").first()).toBeVisible()

  // Let the grid autoplay settle. Fixed wait (not waitForLoadState) so S1 and S3
  // share a timeline despite S1 being slower.
  await page.waitForTimeout(2500)

  // Scroll the grid into view and a little down.
  await page.mouse.wheel(0, 600)
  await page.waitForTimeout(1200)

  // Hover a tile — the glow is part of what the redesign changed.
  await page.locator(PER_STATE.firstCard).first().hover()
  await page.waitForTimeout(800)

  // Open a detail, then close it with Escape.
  await page.locator(PER_STATE.firstCard).first().click()
  await page.waitForTimeout(1500)
  await page.keyboard.press("Escape")
  await page.waitForTimeout(800)

  // Filter by a Category from the rail.
  await page.locator(PER_STATE.categoryChip).first().click()
  await page.waitForTimeout(1200)

  // Search.
  await page.getByRole("textbox", { name: /search/i }).fill("button")
  await page.waitForTimeout(1200)

  // Change sort.
  await page.locator(PER_STATE.sortControl).first().click()
  await page.waitForTimeout(800)

  // Load more, if the control is present on this state.
  const loadMore = page.getByRole("button", { name: /load more/i })
  if (await loadMore.count()) {
    await loadMore.first().click()
    await page.waitForTimeout(1500)
  }

  // Bookmark one.
  await page.locator(PER_STATE.saveButton).first().click()
  await page.waitForTimeout(800)

  // Toggle the colour mode.
  const themeToggle = page.locator(PER_STATE.themeToggle).first()
  if (await themeToggle.count()) {
    await themeToggle.click()
    await page.waitForTimeout(1000)
  }
})
