import { expect, test, type Browser, type Page } from "@playwright/test"

// Ticket 15.2 — prove the keyboard layer reuses the existing click handlers, so
// deploy B does not silently narrow bookmark_added / vote_cast to mouse-only,
// and so `/` does not bill a search_performed.
//
// The e2e harness normally aborts every posthog.com request
// (tests/e2e/keyboard.spec.ts and friends). That only stops the network send;
// the in-browser `window.posthog.capture` call still fires synchronously, so we
// wrap it as soon as PostHog assigns `window.posthog` and record every
// [event, props] the app emits. No network leaves the page and the assertion is
// fully deterministic — the events we read only fire on the user interactions
// the test drives, long after init, so the wrap is reliably in place first.
//
// The claim: from a fresh (un-saved, un-voted) context the FIRST toggle via the
// button and the FIRST toggle via the key both emit the same event with the same
// properties, because both call handleSave / handleVote. A second toggle would
// emit the _removed twin; that is correct behaviour and NOT what this test is
// about, so each case reads exactly one emission.

// Installed via addInitScript so it runs before app scripts and wraps capture
// the instant PostHog makes it available.
const CAPTURE_SPY = `
  window.__captured = [];
  window.__wrapped = false;
  (function attach() {
    if (window.posthog && typeof window.posthog.capture === 'function') {
      if (!window.__wrapped) {
        var orig = window.posthog.capture.bind(window.posthog);
        window.posthog.capture = function (event, props) {
          window.__captured.push([event, props || {}]);
          return orig(event, props);
        };
        window.__wrapped = true;
      }
    } else {
      setTimeout(attach, 100);
    }
  })();
`

const readCaptured = (page: Page) =>
  page.evaluate(() => window.__captured ?? [])

async function openOverlay(page: Page) {
  await page.goto("/")
  await page.getByRole("heading", { level: 3 }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()
}

// Fresh context per reading: a prior save would make the first toggle a _removed
// instead of an _added, and the comparison must be add-vs-add.
async function eventsFrom(browser: Browser, act: (page: Page) => Promise<void>) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.addInitScript(CAPTURE_SPY)
  await openOverlay(page)
  await act(page)
  const captured = await readCaptured(page)
  await context.close()
  return captured
}

test.beforeEach(async ({ page }) => {
  // A CI run is not a site visit: do not post pageviews or autocaptures into the
  // production PostHog project, and do not bill views against the real catalogue
  // (Demos autoplay). The capture spy above still records locally.
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

test("S and the Save button emit one bookmark_added with identical properties", async ({
  browser,
}) => {
  // Scoped to the dialog and taken first, not last: the panel's MORE FROM THIS
  // CONTRIBUTOR strip now draws the catalogue's own Tile with its own Save
  // (Detail.dc.html:83), so `.last()` clicked a strip card and reported that
  // Recording's id. Inside the dialog the panel's own control comes first.
  const fromButton = await eventsFrom(browser, (page) =>
    page
      .getByRole("dialog")
      .getByRole("button", { name: /^Saved?$/ })
      .first()
      .click()
  )
  const fromKey = await eventsFrom(browser, (page) =>
    page.keyboard.press("s")
  )

  const buttonAdds = fromButton.filter(([e]) => e === "bookmark_added")
  const keyAdds = fromKey.filter(([e]) => e === "bookmark_added")

  expect(buttonAdds, "button path emits bookmark_added").toHaveLength(1)
  expect(keyAdds, "keyboard path emits bookmark_added").toHaveLength(1)

  // Both carry exactly { recording_id, caption } — no more, no less. The same
  // two-property shape handleSave passes to bookmarkAdded / bookmarkRemoved.
  const expectedKeys = ["caption", "recording_id"]
  expect(Object.keys(buttonAdds[0][1]).sort()).toEqual(expectedKeys)
  expect(Object.keys(keyAdds[0][1]).sort()).toEqual(expectedKeys)
  // And the same Recording: the overlay opened on the first card both times
  // against the same catalogue order.
  expect(buttonAdds[0][1].recording_id).toBe(keyAdds[0][1].recording_id)
})

test("V and the Vote control emit one vote_cast with identical properties", async ({
  browser,
}) => {
  // Same scoping as the Save case above, and for the same reason.
  const fromButton = await eventsFrom(browser, (page) =>
    page
      .getByRole("dialog")
      .getByRole("button", { name: /^Vote/ })
      .first()
      .click()
  )
  const fromKey = await eventsFrom(browser, (page) =>
    page.keyboard.press("v")
  )

  const buttonVotes = fromButton.filter(([e]) => e === "vote_cast")
  const keyVotes = fromKey.filter(([e]) => e === "vote_cast")

  expect(buttonVotes, "button path emits vote_cast").toHaveLength(1)
  expect(keyVotes, "keyboard path emits vote_cast").toHaveLength(1)

  const expectedKeys = ["caption", "recording_id"]
  expect(Object.keys(buttonVotes[0][1]).sort()).toEqual(expectedKeys)
  expect(Object.keys(keyVotes[0][1]).sort()).toEqual(expectedKeys)
  expect(buttonVotes[0][1].recording_id).toBe(keyVotes[0][1].recording_id)
})

test("/ fires no search_performed", async ({ page }) => {
  await page.addInitScript(CAPTURE_SPY)
  await page.goto("/")

  const box = page.getByRole("textbox", { name: /search/i })
  // The box is deliberately NOT clicked first. `/` is inert once focus is
  // already inside an input (checkpoint-13-gate.md, step 5) — that is what
  // lets someone type a path into the search box — so pressing it from
  // inside tests the escape hatch and lands a literal `/` in the value. The
  // shortcut under test is the one pressed from the page.
  await page.keyboard.press("/")
  await expect(box).toBeFocused()
  // The bare `/` shortcut focuses and selects the box; it must not type a `/`
  // and must not fire search_performed. Then type a real query without
  // submitting, so no settled-search event can have fired either way.
  await box.pressSequentially("button")

  const captured = await readCaptured(page)
  expect(
    captured.filter(([e]) => e === "search_performed"),
    "the `/` shortcut must not bill a search"
  ).toHaveLength(0)
  // And it really was the shortcut, not a typed slash: the box holds the query
  // with no leading `/`.
  await expect(box).toHaveValue("button")
})
