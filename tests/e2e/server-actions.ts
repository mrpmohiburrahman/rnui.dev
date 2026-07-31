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
 *
 * `interact` is handed the recording as it stands, so a test can take a reading
 * partway through — how many actions had fired before a reload, say.
 */
export async function recordServerActions(
  browser: Browser,
  url: string,
  interact: (page: Page, fired: FiredAction[]) => Promise<void>,
  /**
   * Demos autoplay, and one that plays two seconds bills a view. That makes
   * every other claim in this file non-deterministic — five autoplays land in
   * the middle of the quiet period and a vote test counts them as its own. A
   * Demo that cannot load cannot bill a view, so they are aborted unless the
   * test under way is about playback.
   */
  { playDemos = false }: { playDemos?: boolean } = {}
) {
  const context = await browser.newContext()
  const page = await context.newPage()
  // A CI run is not a site visit.
  await page.route("**/*posthog.com/**", (route) => route.abort())
  if (!playDemos) await page.route("**/demo/**", (route) => route.abort())
  await page.goto(url)

  const fired: FiredAction[] = []
  let lastSeenAt = 0
  page.on("request", (request) => {
    if (request.method() !== "POST") return
    const id = request.headers()["next-action"]
    if (!id) return
    fired.push({ id, body: request.postData() ?? "" })
    lastSeenAt = Date.now()
  })

  await interact(page, fired)

  // Wait for a quiet period rather than for a fixed delay: the claim under test
  // is how many writes one interaction produces, so the test has to know the
  // interaction has finished producing them. The writes the unfixed tree fires
  // arrive roughly 700ms apart, so a second of silence would have ended the wait
  // in the middle of them and counted one — which is exactly how the first draft
  // of the vote test passed against the bug it was written to catch.
  const QUIET_MS = 2_000
  await expect
    .poll(() => fired.length > 0 && Date.now() - lastSeenAt > QUIET_MS, {
      timeout: 20_000,
      intervals: [250],
      message: "the interaction produced no server action",
    })
    .toBe(true)

  await context.close()
  return fired
}

export type FiredAction = { id: string; body: string }

/** Fails naming the ids when any action fired more than once. */
export function expectNoActionRepeated(fired: FiredAction[]) {
  const ids = fired.map((action) => action.id)
  expect(ids.length, `an action fired more than once: ${ids.join(", ")}`).toBe(
    new Set(ids).size
  )
}

/**
 * Every action a single click produces carries the same Entry id. Recorded from the
 * bodies rather than inferred: the bodies are the only place the id appears, since
 * the address is the page's and the header is opaque.
 */
export function expectOneEntryTargeted(fired: FiredAction[]) {
  const bodies = new Set(fired.map((action) => action.body))
  expect(
    bodies.size,
    `one click addressed more than one Entry: ${[...bodies].join(" | ")}`
  ).toBe(1)
  // A body Next did not fill in would make the assertion above pass vacuously.
  expect([...bodies][0]).toMatch(/^\["[0-9A-Z]{26}"\]$/)
}
