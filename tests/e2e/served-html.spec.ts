import { expect, test } from "@playwright/test"

import { allEntries } from "../../data/catalogue"
import { BOOKMARKS_KEY } from "../../hooks/use-remembered-set"

// Everything here reads the HTML the server actually sent. `request.get` rather
// than `page.goto` on purpose: it runs no JavaScript, so what it returns is what
// a crawler, a slow connection and a visitor with scripts off all get. Four
// separate causes used to leave that document empty or invisible — a hydration
// guard that returned `<div />` on every server render, a page-level FadeIn and
// a per-card mount animation that both server-rendered `opacity: 0`, and a
// Suspense boundary that streamed all 277 cards into a `<div hidden>`.

const ROUTES = ["/", "/products", "/bookmarks"] as const

const remembered = allEntries[0]

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project. A test that builds its own
// context repeats it, because this only covers the shared `page` fixture.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

test("the served HTML of / carries the heading, the sort controls and every card", async ({
  request,
}) => {
  const html = await (await request.get("/")).text()

  expect(html).toMatch(/<h1[^>]*>Awesome React Native UI<\/h1>/)

  // All three desktop sort buttons. They are what the guard dropped along with
  // the grid, since the heading is passed through the grid as children.
  for (const label of ["Recent", "Top Viewed", "Top Voted"]) {
    expect(html).toContain(`>${label}</span>`)
  }

  // One card per Entry. `getEntries` merges Firestore counts onto the local
  // catalogue without adding or dropping rows, so the count is exact.
  const cards = html.match(/aria-label="Play video"/g) ?? []
  expect(cards).toHaveLength(allEntries.length)
})

test("the served HTML of /bookmarks carries its heading", async ({ request }) => {
  const html = await (await request.get("/bookmarks")).text()
  expect(html).toMatch(/<h1[^>]*>Bookmarks<\/h1>/)
})

for (const route of ROUTES) {
  test(`the served HTML of ${route} paints nothing at zero opacity`, async ({
    request,
  }) => {
    const html = await (await request.get(route)).text()
    // framer-motion serialises an initial variant into the style attribute, so
    // an element that animates in from `opacity: 0` arrives invisible and stays
    // that way until hydration finishes. Matching loosely — React emits
    // `opacity:0` and a hand-written style could say `opacity: 0`.
    expect(html).not.toMatch(/opacity:\s*0[;"]/)
  })
}

test("/ is readable with JavaScript turned off", async ({ browser }) => {
  // The markup assertions above prove the document is not empty. This one adds
  // the only claim they cannot make: that what arrived is actually painted. A
  // Suspense boundary is the way to fail this while passing all of them — its
  // content ships inside a `<div hidden>` that only an inline script reveals.
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto("/")

  await expect(
    page.getByRole("heading", { level: 1, name: "Awesome React Native UI" })
  ).toBeVisible()
  await expect(
    page.getByRole("button", { name: "Play video" }).first()
  ).toBeVisible()

  await context.close()
})

test("/bookmarks never shows more than the bookmarked Entries, at any frame", async ({
  browser,
}) => {
  const context = await browser.newContext()
  await context.addInitScript(
    ({ key, id }) => {
      localStorage.setItem(key, JSON.stringify([id]))
      // A poll cannot catch a single bad frame. This watches every DOM mutation
      // instead and keeps the high-water mark: the guard used to hide the case
      // where a not-yet-read set means "everything" rather than "nothing yet".
      const watched = window as unknown as { __peakCards: number }
      watched.__peakCards = 0
      new MutationObserver(() => {
        const showing = document.querySelectorAll(
          '[aria-label="Play video"]'
        ).length
        if (showing > watched.__peakCards) watched.__peakCards = showing
      }).observe(document, { childList: true, subtree: true })
    },
    { key: BOOKMARKS_KEY, id: remembered.id }
  )

  const page = await context.newPage()
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.goto("/bookmarks")

  await expect(page.getByRole("button", { name: "Play video" })).toHaveCount(1)
  await page.waitForLoadState("networkidle")

  const peak = await page.evaluate(
    () => (window as unknown as { __peakCards: number }).__peakCards
  )
  // Reached one, so the observer ran and the assertion is not vacuous.
  expect(peak).toBe(1)

  await context.close()
})

for (const route of ROUTES) {
  test(`${route} hydrates without React disagreeing with the server`, async ({
    page,
  }) => {
    const complaints: string[] = []
    // A production build minifies these: #418, #423 and #425 are the hydration
    // family. The words are matched too, so a dev-mode run reports the same.
    page.on("console", (message) => {
      const text = message.text()
      if (/hydrat|did not match|React error #(418|423|425)/i.test(text)) {
        complaints.push(text)
      }
    })
    await page.goto(route)
    await page.waitForLoadState("networkidle")

    expect(complaints).toEqual([])
  })
}
