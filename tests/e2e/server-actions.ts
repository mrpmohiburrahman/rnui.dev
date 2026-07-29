import { expect, type Browser, type Page } from "@playwright/test"

// Every server action posts to the address of the page that fired it and is told
// apart only by the opaque `Next-Action` header, so counting requests cannot by
// itself say which write happened. What these helpers record is the header value
// per request, so an assertion can talk about *which* action fired and how often
// — a repeated id is a double billing, and it is invisible to a plain count.

/**
 * Open `url` in a fresh context and record the id of every server action fired
 * while `interact` runs. A fresh context per call, not a second `goto` on one
 * page: bookmarks and votes are remembered in localStorage, so a reused context
 * arrives at the next route already holding the last one's state.
 */
export async function recordServerActions(
  browser: Browser,
  url: string,
  interact: (page: Page) => Promise<void>
) {
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

  await interact(page)

  // Wait for a quiet period rather than for a fixed delay: the claim under test
  // is how many writes one interaction produces, so the test has to know the
  // interaction has finished producing them. The writes the unfixed tree fires
  // arrive roughly 700ms apart, so a second of silence would have ended the wait
  // in the middle of them and counted one — which is exactly how the first draft
  // of the vote test passed against the bug it was written to catch.
  const QUIET_MS = 2_000
  await expect
    .poll(() => actionIds.length > 0 && Date.now() - lastSeenAt > QUIET_MS, {
      timeout: 20_000,
      intervals: [250],
      message: "the interaction produced no server action",
    })
    .toBe(true)

  await context.close()
  return actionIds
}

/** Fails naming the ids when any action fired more than once. */
export function expectNoActionRepeated(actionIds: string[]) {
  expect(
    actionIds.length,
    `an action fired more than once: ${actionIds.join(", ")}`
  ).toBe(new Set(actionIds).size)
}
