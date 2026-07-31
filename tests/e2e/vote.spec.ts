import { expect, test, type Browser } from "@playwright/test"

import {
  expectNoActionRepeated,
  expectOneEntryTargeted,
  recordServerActions,
} from "./server-actions"

function oneVoteClick(browser: Browser, url: string) {
  return recordServerActions(browser, url, (page) =>
    page.getByRole("button", { name: "Vote", exact: true }).first().click()
  )
}

// The bug this pins: recording a view was a fire-and-forget action imported by
// four unrelated layers, so one vote click billed two views on the home page and
// three on the Category listing — the busiest route, since every legacy Category
// address redirects into it.
//
// The count is now one, not two. A vote no longer records a view at all
// (ADR-0007:3, :7): votes are the site's interest signal, and having view_count
// measure interest too would have measured the same thing twice.
test("a vote click fires each server action exactly once", async ({
  browser,
}) => {
  const fired = await oneVoteClick(browser, "/")

  expectNoActionRepeated(fired)
  expectOneEntryTargeted(fired)
  expect(fired).toHaveLength(1) // the vote, and nothing else
})

test("the Category listing records the same count as the home page", async ({
  browser,
}) => {
  const home = await oneVoteClick(browser, "/")
  const category = await oneVoteClick(browser, "/products?category=Buttons")

  expectNoActionRepeated(category)
  expectOneEntryTargeted(category)
  expect(category.length).toBe(home.length)
})
