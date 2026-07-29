import { expect, test, type Browser } from "@playwright/test"

import { expectNoActionRepeated, recordServerActions } from "./server-actions"

function oneVoteClick(browser: Browser, url: string) {
  return recordServerActions(browser, url, (page) =>
    page.getByRole("button", { name: "Vote", exact: true }).first().click()
  )
}

// The bug this pins: recording a view was a fire-and-forget action imported by
// four unrelated layers, so one vote click billed two views on the home page and
// three on the Category listing — the busiest route, since every legacy Category
// address redirects into it.
test("a vote click fires each server action exactly once", async ({
  browser,
}) => {
  const fired = await oneVoteClick(browser, "/")

  expectNoActionRepeated(fired)
  expect(fired).toHaveLength(2) // one view, one vote
})

test("the Category listing records the same count as the home page", async ({
  browser,
}) => {
  const home = await oneVoteClick(browser, "/")
  const category = await oneVoteClick(browser, "/products?category=Buttons")

  expectNoActionRepeated(category)
  expect(category.length).toBe(home.length)
})
