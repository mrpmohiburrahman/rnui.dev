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

  // Un-bookmarking drops the card from the list immediately. Two copies of the set
  // — one in the route, one in the Catalogue page — would leave it there until a
  // reload, which is the regression the collapse in ticket 12 was written to avoid.
  //
  // The card has to be hovered first: the bookmark button carries
  // `pointer-events-none group-hover:pointer-events-auto`, so until the pointer is
  // over the card it is not hit-testable and a click waits forever. Hovering the
  // heading rather than the button keeps the whole card group hovered while the
  // pointer travels to it.
  await page.getByRole("heading", { level: 3 }).hover()
  await page.getByRole("button", { name: "Saved" }).click()
  await expect(page.getByTestId("demo")).toHaveCount(0)

  await context.close()
})
