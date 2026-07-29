import { expect, test, type Browser } from "@playwright/test"

// Every server action posts to the address of the page that fired it and is
// told apart only by the opaque `Next-Action` header, so counting requests
// cannot by itself separate the view increment from the vote increment that the
// same click also fires. What this records is the header value per request, so
// the assertions can talk about *which* action fired and how often — a repeated
// id is the double billing, and it is invisible to a plain request count.
//
// A fresh context per route, not a second goto on one page: a vote is remembered
// in localStorage, so a reused context would arrive at the next route with the
// button already reading "Unvote" and fire the decrement path instead.
async function actionsFiredByOneVoteClick(browser: Browser, url: string) {
  const context = await browser.newContext()
  const page = await context.newPage()
  // A CI run is not a site visit.
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.goto(url)

  const actionIds: string[] = []
  let lastSeenAt = 0
  page.on("request", (request) => {
    if (request.method() !== "POST") return
    const id = request.headers()["next-action"]
    if (!id) return
    actionIds.push(id)
    lastSeenAt = Date.now()
  })

  await page.getByRole("button", { name: "Vote", exact: true }).first().click()

  // Wait for a quiet period rather than for a fixed delay: the claim under test
  // is how many writes one click produces, so the test has to know the click has
  // finished producing them. The three writes the unfixed tree fires arrive
  // roughly 700ms apart, so a second of silence would have ended the wait in the
  // middle of them and counted one — which is exactly how the first draft of
  // this test passed against the bug it was written to catch.
  const QUIET_MS = 2_000
  await expect
    .poll(
      () => actionIds.length > 0 && Date.now() - lastSeenAt > QUIET_MS,
      {
        timeout: 20_000,
        intervals: [250],
        message: "vote click produced no server action",
      }
    )
    .toBe(true)

  await context.close()
  return actionIds
}

// The bug this pins: recording a view was a fire-and-forget action imported by
// four unrelated layers, so one vote click billed two views on the home page and
// three on the Category listing — the busiest route, since every legacy Category
// address redirects into it.
test("a vote click fires each server action exactly once", async ({
  browser,
}) => {
  const fired = await actionsFiredByOneVoteClick(browser, "/")

  expect(
    fired.length,
    `an action fired more than once: ${fired.join(", ")}`
  ).toBe(new Set(fired).size)
  expect(fired).toHaveLength(2) // one view, one vote
})

test("the Category listing records the same count as the home page", async ({
  browser,
}) => {
  const home = await actionsFiredByOneVoteClick(browser, "/")
  const category = await actionsFiredByOneVoteClick(
    browser,
    "/products?category=Buttons"
  )

  expect(
    category.length,
    `an action fired more than once: ${category.join(", ")}`
  ).toBe(new Set(category).size)
  expect(category.length).toBe(home.length)
})
