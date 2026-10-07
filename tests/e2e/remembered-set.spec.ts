import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// The stored keys are written out as literals here on purpose. The claim under
// test is that state written by the *previous* build still loads, so importing the
// constants the code now uses would make the test agree with whatever the code
// says rather than with what is already sitting in visitors' browsers.
const BOOKMARKS_KEY = "bookmarkedItems"
const VOTED_RECORDING_IDS_KEY = "votedItems"

const remembered = allRecordings[0]

test("a set stored by the previous build still loads after the hook merge", async ({
  browser,
}) => {
  const context = await browser.newContext()
  await context.addInitScript(
    ({ bookmarksKey, votedKey, id }) => {
      localStorage.setItem(bookmarksKey, JSON.stringify([id]))
      localStorage.setItem(votedKey, JSON.stringify([id]))
    },
    {
      bookmarksKey: BOOKMARKS_KEY,
      votedKey: VOTED_RECORDING_IDS_KEY,
      id: remembered.id,
    }
  )

  const page = await context.newPage()
  // A CI run is not a site visit.
  await page.route("**/*posthog.com/**", (route) => route.abort())
  // Nor is it a viewing. Demos autoplay, and this test has nothing to say about
  // playback, so letting them run would bill views against the real catalogue.
  await page.route("**/demo/**", (route) => route.abort())
  await page.goto("/bookmarks")

  // Exactly the one Recording the stored set names — so the set was read, and the
  // route's filter ran against it.
  await expect(page.getByTestId("demo")).toHaveCount(1)
  await expect(page.getByText(remembered.contributor)).toBeVisible()

  // Both labels are the flipped ones, so both sets hydrated rather than only one.
  await expect(
    page.getByRole("button", { name: "Saved" })
  ).toBeVisible()
  await expect(page.getByRole("button", { name: /^Unvote/ })).toBeVisible()

  // sign-in-to-save ticket 07: the stored bookmarks are merge input now, and
  // anonymous visitors cannot save — so pressing the tile's button no longer
  // un-saves. It opens the provider sheet in place and stashes the press for
  // the return trip, and the card stays put: nothing is written anywhere.
  //
  // The card has to be hovered first: the bookmark button carries
  // `pointer-events-none group-hover:pointer-events-auto`, so until the pointer is
  // over the card it is not hit-testable and a click waits forever. Hovering the
  // heading rather than the button keeps the whole card group hovered while the
  // pointer travels to it.
  await page.getByRole("heading", { level: 3 }).hover()
  await page.getByRole("button", { name: "Saved" }).click()
  // The gate is a centered modal, not the nav's dropdown: exactly one dialog,
  // naming the Demo the press was on. The card stays put — nothing is written
  // anywhere.
  const modal = page.getByRole("dialog", { name: "Sign in to save Demos" })
  await expect(modal).toHaveCount(1)
  await expect(
    page.getByText("Sign in to save Demos").first()
  ).toBeVisible()
  await expect(page.getByTestId("demo")).toHaveCount(1)

  await context.close()
})

  // The badge crowds a narrow sheet: "Continue with Google" wrapped under it.
  // The sheet widens whenever either door can carry the badge, so both rows
  // stay single-line — asserted by height, not pixels of width.
  test("the last-used badge fits without wrapping a provider row", async ({
    browser,
  }) => {
    const context = await browser.newContext()
    await context.addInitScript(() => {
      localStorage.setItem("rnui:last-provider", "google")
    })
    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (route) => route.abort())
    await page.route("**/demo/**", (route) => route.abort())
    await page.goto("/")

    await page.getByRole("button", { name: "Sign in to save Demos" }).click()
    await expect(page.getByText("LAST USED")).toBeVisible()
    for (const label of ["Continue with GitHub", "Continue with Google"]) {
      const box = await page
        .getByRole("button", { name: new RegExp(label) })
        .boundingBox()
      expect(box?.height, label).toBeLessThan(44)
    }
    await context.close()
  })

// The header is not under the catalogue, so it cannot be handed the set as a
// prop the way recording-detail.tsx is (recording-detail.tsx:107-111).
// sign-in-to-save ticket 07: an anonymous press no longer saves anywhere — it
// opens the provider sheet in place and stashes the press for the return trip
// — so what this test pins is the gate, not the count: the chip stays honest
// at 0 and the sheet is the answer the press gets.
test("saving a tile while signed out opens sign-in and saves nothing", async ({
  page,
}) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
  await page.goto("/")

  const savedChip = page.locator('header a[href="/bookmarks"]').first()
  await expect(savedChip).toContainText("0")

  await page.getByRole("heading", { level: 3 }).first().hover()
  await page.getByRole("button", { name: "Save", exact: true }).first().click()

  // No save happened — and a centered modal, not a silent nothing and not the
  // nav's dropdown, is what says so.
  await expect(
    page.getByRole("dialog", { name: "Sign in to save Demos" })
  ).toHaveCount(1)
  await expect(savedChip).toContainText("0")
})
