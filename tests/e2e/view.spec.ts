import { expect, test } from "@playwright/test"

import {
  expectNoActionRepeated,
  expectOneEntryTargeted,
  recordServerActions,
} from "./server-actions"

// Playing the Demo is the view; opening the Entry is not. Opening and dismissing
// without watching is not a view of anything.
//
// The playback test in home.spec.ts cannot see this: it clicks the play control on
// a grid card, and that handler stops the event before the card's own open handler
// runs. Reaching the doubled path means clicking the card body, waiting for the
// modal, and playing from inside it.
test("opening an Entry and playing its Demo records one view", async ({
  browser,
}) => {
  const fired = await recordServerActions(browser, "/", async (page) => {
    // The card's heading, so the click lands on the card body rather than on the
    // play control, the bookmark button, the vote button or a profile link — all
    // of which stop the event.
    await page.getByRole("heading", { level: 3 }).first().click()

    const modal = page.getByRole("dialog")
    await expect(modal).toBeVisible()
    await modal.getByRole("button", { name: "Play video" }).click()
  })

  expectNoActionRepeated(fired)
  expectOneEntryTargeted(fired)
  expect(fired).toHaveLength(1) // the Demo played, once
})
