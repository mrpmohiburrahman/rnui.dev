import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"
import { RECORDINGS_PER_CONTRIBUTOR } from "../../data/recording"
import {
  expectNoActionRepeated,
  expectOneRecordingTargeted,
  recordServerActions,
} from "./server-actions"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  // Nor is it a viewing. Demos autoplay, and nothing here is about playback, so
  // letting them run would bill views against the real catalogue on every run.
  await page.route("**/demo/**", (route) => route.abort())
})

const known = allRecordings[0]

// The card heading, not the card itself: the bookmark button sits over the
// top-right corner and the Demo fills the top. The heading is inside the div
// that carries the onClick.
const firstCard = (page: import("@playwright/test").Page) =>
  page.getByRole("heading", { level: 3 }).first()

/** One frame of the overlay's computed style, recorded in the page. */
type OverlayFrame = { transform: string; opacity: number; tint: number | null }

/**
 * Start recording the overlay's computed style once per animation frame.
 *
 * In the page rather than from the test, because a Playwright round-trip is not
 * a frame clock: `page.evaluate` in a loop samples at whatever rate the CDP
 * connection manages, which on a loaded machine is slower than the animation it
 * is trying to measure. `requestAnimationFrame` samples every frame the browser
 * paints, and the whole recording is read out in one call at the end.
 *
 * Frames where the overlay is absent are skipped, not recorded as a gap — the
 * loop keeps running so a recording can start before the node exists (or carry
 * on past its unmount) and still hold every frame in between.
 */
async function startSampling(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const frames: OverlayFrame[] = []
    const w = window as unknown as {
      __overlayFrames: OverlayFrame[]
      __stopSampling: () => void
    }
    w.__overlayFrames = frames
    let running = true
    w.__stopSampling = () => {
      running = false
    }
    const tick = () => {
      const panel = document.querySelector('[role="dialog"]')
      const tint = document.querySelector(".bg-scrim")
      if (panel) {
        const style = getComputedStyle(panel)
        frames.push({
          transform: style.transform,
          opacity: Number(style.opacity),
          tint: tint ? Number(getComputedStyle(tint).opacity) : null,
        })
      }
      if (running) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
}

async function readSamples(
  page: import("@playwright/test").Page
): Promise<OverlayFrame[]> {
  // One extra frame first, so a recording that is read the instant an assertion
  // resolves still holds the frame that satisfied it.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  )
  return page.evaluate(() => {
    const w = window as unknown as {
      __overlayFrames: OverlayFrame[]
      __stopSampling: () => void
    }
    w.__stopSampling()
    return w.__overlayFrames
  })
}

test("clicking a card opens the panel at the Recording's own address, without navigating", async ({
  page,
}) => {
  // Page 2, so the address carries a param the open has to keep. pushState
  // replaces the whole URL: dropping the query collapsed the grid behind the
  // tint from 96 cards to 48 for as long as the panel was open.
  await page.goto("/?page=2")
  const cardsBefore = await page.locator(".grid h3").count()

  // The whole reason this is pushState and not router.push. A navigation here
  // would re-run the server component and refetch the catalogue on the most
  // repeated action on the site.
  //
  // Only requests for the Recording address count. The sidebar's <Link>s prefetch
  // `?_rsc=` for /, /bookmarks and /subscribe on their own schedule, and those
  // fire whether or not a card is ever clicked.
  const navigations: string[] = []
  page.on("request", (request) => {
    const url = request.url()
    if (
      url.includes("/recording/") &&
      (request.isNavigationRequest() || url.includes("_rsc="))
    )
      navigations.push(url)
  })

  await firstCard(page).click()

  await expect(page).toHaveURL(/\/recording\/[0-9A-Za-z]{26}\?page=2$/)
  await expect(page.getByRole("dialog")).toBeVisible()
  expect(navigations).toEqual([])

  // The catalogue is still underneath, unchanged, which is what the overlay
  // exists to say. `.grid h3`, not getByRole: Radix aria-hides everything
  // outside the panel, so a role query reports zero cards either way.
  expect(cardsBefore).toBe(96)
  expect(await page.locator(".grid h3").count()).toBe(cardsBefore)
})

test("Escape, the close button, the tint and Back all take the same way out", async ({
  page,
}) => {
  await page.goto("/?search=onboarding")
  const listing = page.url()

  for (const close of [
    async () => page.keyboard.press("Escape"),
    async () =>
      page.getByRole("button", { name: "Close, or press Escape" }).click(),
    // Away from the panel, which is top-aligned and 1080px wide at this viewport.
    async () => page.locator(".bg-scrim").click({ position: { x: 10, y: 10 } }),
    async () => page.goBack(),
  ]) {
    await firstCard(page).click()
    await expect(page).toHaveURL(/\/recording\//)
    await expect(page.getByRole("dialog")).toBeVisible()

    await close()

    // The exact previous URL, search param and all: closing is history.back(),
    // so it cannot land anywhere else.
    await expect(page).toHaveURL(listing)
    await expect(page.getByRole("dialog")).toHaveCount(0)
  }
})

test("the open panel traps focus and locks the page behind it", async ({
  page,
}) => {
  await page.goto("/")
  await firstCard(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()

  // components/modal.tsx claimed aria-modal while leaving all 277 cards in the
  // tab order. Ten tabs is more than the panel holds, so a leak would show.
  for (let i = 0; i < 10; i++) await page.keyboard.press("Tab")
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]')
    )
  ).toBe(true)

  expect(
    await page.evaluate(() => getComputedStyle(document.body).overflow)
  ).toBe("hidden")
})

test("a Recording address opened cold is a page, not an overlay", async ({
  page,
}) => {
  await page.goto(`/recording/${known.id}`)

  // An h1 on the page form, step 4 — the overlay's copy of this same body is an
  // h2, because there it is Radix's DialogTitle. Before this the route shipped
  // no h1 at all.
  await expect(
    page.getByRole("heading", { level: 1, name: known.caption })
  ).toBeVisible()
  await expect(page.locator("h1")).toHaveCount(1)
  await expect(page.getByText(known.contributor).first()).toBeVisible()
  await expect(page.getByRole("dialog")).toHaveCount(0)
})

test("an id that is not a Recording is a 404", async ({ page }) => {
  const response = await page.request.get("/recording/nope", {
    maxRedirects: 0,
  })
  expect(response.status()).toBe(404)
})

// The Contributor line's total is the whole-catalogue count, computed in the
// page's server component from getRecordingsWithCounts — never a mock constant
// (ticket 09 step 5, acceptance: rendered total equals RECORDINGS_PER_CONTRIBUTOR).
test("a Contributor with many Recordings renders their whole-catalogue total and a See-all link", async ({
  page,
}) => {
  const enzo = allRecordings.find(
    (r) => r.contributor === "Enzo Manuel Mangano ( Reactiive )"
  )!
  const total = RECORDINGS_PER_CONTRIBUTOR["Enzo Manuel Mangano ( Reactiive )"]
  await page.goto(`/recording/${enzo.id}`)

  await expect(
    page.getByText(`${total} of the 277 recordings here`, { exact: false })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: `See all ${total} →` })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: `See all ${total} →` })
  ).toHaveAttribute(
    "href",
    `/products?${new URLSearchParams({ contributor: enzo.contributor }).toString()}`
  )
})

test("a Contributor with one Recording renders 1 ... is theirs and no See-all link", async ({
  page,
}) => {
  const counts = new Map<string, number>()
  for (const r of allRecordings)
    counts.set(r.contributor, (counts.get(r.contributor) ?? 0) + 1)
  const solo = allRecordings.find((r) => counts.get(r.contributor) === 1)!
  await page.goto(`/recording/${solo.id}`)

  await expect(
    page.getByText("1 of the 277 recordings here is theirs.", {
      exact: false,
    })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /^See all/ })).toHaveCount(0)
})

test("the arrows walk the Category without wrapping and without growing history", async ({
  page,
}) => {
  await page.goto("/")
  await firstCard(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()

  const startId = new URL(page.url()).pathname.split("/").pop()!
  const historyBefore = await page.evaluate(() => history.length)

  // The context strip names the Category, position and the Category's true size
  // (148 Misc tiles on /). Advance five times, then the assertion that escape
  // still steps to the grid is meaningful only if each step changed the address
  // via replaceState and never pushed.
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowRight")
  expect(page.url()).toMatch(/\/recording\/[0-9A-Za-z]{26}/)
  const middleId = new URL(page.url()).pathname.split("/").pop()!
  expect(middleId).not.toBe(startId)
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)

  // Back to the starting id. ArrowLeft on the first of a Category is clamped,
  // so this is an acceptable way to confirm the wrap is absent too.
  for (let i = 0; i < 5; i++) await page.keyboard.press("ArrowLeft")
  expect(new URL(page.url()).pathname.split("/").pop()).toBe(startId)

  // At both ends the arrows change nothing.
  expect(await page.evaluate(() => history.length)).toBe(historyBefore)
})

test("S and V drive the tile's save and vote behind the scrim", async ({
  page,
}) => {
  await page.goto("/")
  await firstCard(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  const openId = new URL(page.url()).pathname.split("/").pop()!

  // The tile behind the scrim carries the same recording-id (ticket 07). S
  // toggles its bookmark (visible text "Save"/"Saved", no aria-label on the
  // card), V its vote ("Vote, N").
  const tile = page.locator(`[data-recording-id="${openId}"]`)
  await expect(tile).toBeVisible()

  const save = tile
    .locator('button:has-text("Save"), button:has-text("Saved")')
    .first()
  const vote = tile
    .locator('[aria-label^="Vote"], [aria-label^="Unvote"]')
    .first()
  const before = await save.getAttribute("aria-pressed")
  const votesBefore = await vote.getAttribute("aria-pressed")
  await page.keyboard.press("s")
  expect(await save.getAttribute("aria-pressed")).not.toBe(before)
  await page.keyboard.press("V")
  expect(await vote.getAttribute("aria-pressed")).not.toBe(votesBefore)

  // And the count moves with it. aria-pressed alone is what this test used to
  // assert, and it was true of a keyboard path that called the Remembered-set
  // toggle and nothing else — no write, no event, no number. The panel's own
  // button is named `Vote, N` / `Unvote, N`, so the name carries the count.
  const panelVote = page
    .getByRole("dialog")
    .locator('[aria-label^="Vote"], [aria-label^="Unvote"]')
    .first()
  await expect(panelVote).toHaveAttribute("aria-label", /^Unvote, \d+$/)
})

// The other half of the same claim, and the half aria-pressed cannot make: the
// keyboard has to reach the server on the same path the mouse does. Compared
// against a click rather than against a number, so it stays true however many
// actions opening the panel costs — and counting actions rather than the
// rendered count keeps it true whether or not Firestore answers, which is the
// reading tests/e2e/vote.spec.ts takes for the same reason.
//
// The unfixed keyboard fired nothing at all here: `v` called the Remembered-set
// toggle, so this recorded the open's view and stopped.
test("a keyboard vote fires the same server action the button does", async ({
  browser,
}) => {
  const open = async (page: import("@playwright/test").Page) => {
    await page.getByRole("heading", { level: 3 }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
  }

  const byKey = await recordServerActions(browser, "/", async (page) => {
    await open(page)
    await page.keyboard.press("v")
  })
  const byClick = await recordServerActions(browser, "/", async (page) => {
    await open(page)
    await page
      .getByRole("dialog")
      .locator('[aria-label^="Vote"], [aria-label^="Unvote"]')
      .first()
      .click()
  })

  expectNoActionRepeated(byKey)
  expectOneRecordingTargeted(byKey)
  expect(byKey.map((a) => a.id).sort()).toEqual(byClick.map((a) => a.id).sort())
})

// The acceptance bullet that had no test, and the one the panel was failing:
// the flex that was supposed to place it sat on Dialog.Overlay, which Radix
// portals as a sibling of Dialog.Content, so the panel laid out as a static
// block at the end of <body> instead of 64px below the viewport top.
test("the panel sits 64px down, 1080px wide, horizontally centred", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await firstCard(page).click()

  const panel = page.getByRole("dialog")
  await expect(panel).toBeVisible()

  // Polled, not read once: the panel enters from 8px below over 240ms, so a
  // single reading takes whatever y the animation is passing through.
  await expect
    .poll(async () => Math.round((await panel.boundingBox())!.y))
    .toBe(64)

  const box = (await panel.boundingBox())!
  expect(Math.round(box.width)).toBe(1080)
  expect(Math.round(box.x + box.width / 2)).toBe(720)
  await expect(panel).toHaveCSS("border-radius", "18px")
})

// A filtered route hands CataloguePage a filtered set, so a Contributor total
// counted from it is the size of the filter. It read "N of the 277" with an N
// of the filter and a See-all link that landed on a different number.
test("the Contributor total is the whole catalogue's on a filtered route", async ({
  page,
}) => {
  const enzo = "Enzo Manuel Mangano ( Reactiive )"
  const theirs = RECORDINGS_PER_CONTRIBUTOR[enzo]
  const category = allRecordings.find(
    (r) => r.contributor === enzo && r.category === "Charts"
  )!

  await page.goto(`/products?category=${encodeURIComponent(category.category)}`)
  await page.locator(`[data-recording-id="${category.id}"]`).first().click()

  const dialog = page.getByRole("dialog")
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByText(
      `${theirs} of the ${allRecordings.length} recordings here are theirs.`
    )
  ).toBeVisible()
  await expect(
    dialog.getByRole("link", { name: `See all ${theirs} →` })
  ).toBeVisible()
})

// An absent social id states the absence. It was doing that at the call site for
// LinkedIn only, so a Contributor with no twitterId got a gap where the mock
// draws a sentence.
test("an absent social id reads `<network> not listed`", async ({ page }) => {
  const noTwitter = allRecordings.find((r) => !r.twitterId && r.githubId)!

  await page.goto(`/recording/${noTwitter.id}`)
  await expect(page.getByText("X not listed")).toBeVisible()
  await expect(page.getByRole("link", { name: "GitHub ↗" })).toBeVisible()
})

test("Escape leaves focus on the tile that was open", async ({ page }) => {
  await page.goto("/")
  await firstCard(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  const openId = new URL(page.url()).pathname.split("/").pop()!
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)

  expect(
    await page.evaluate((id) => {
      const el = document.querySelector(`[data-recording-id="${id}"]`)
      return (
        document.activeElement === el || el?.contains(document.activeElement)
      )
    }, openId)
  ).toBe(true)
})

test("the close button holds focus on open, and a modified arrow is not swallowed", async ({
  page,
}) => {
  await page.goto("/")
  await firstCard(page).click()
  await expect(page.getByRole("dialog")).toBeVisible()

  // Radix focuses the first focusable in the content on open, which is the close
  // button (recording-overlay.tsx).
  await expect(
    page.getByRole("button", { name: "Close, or press Escape" })
  ).toBeFocused()

  // The arrow handler returns early on e.metaKey || e.ctrlKey; it must never move
  // the Recording under a cream/Cmd+LefLeft (browser Back on macOS). Browser Back
  // itself is the one close path and is covered by the "same way out" test; here
  // we prove the handler does not steal the keystroke, which would freeze the
  // visitor on /recording/<id>.
  const startId = new URL(page.url()).pathname.split("/").pop()!
  await page.keyboard.press("Meta+ArrowRight")
  await page.keyboard.press("Control+ArrowLeft")
  await page.keyboard.press("Alt+ArrowLeft")
  expect(new URL(page.url()).pathname.split("/").pop()).toBe(startId)
})

test.describe("reduced motion", () => {
  // Under contextOptions, not as a bare option: Playwright 1.60 moved it there.
  test.use({ contextOptions: { reducedMotion: "reduce" } })

  // <MotionConfig reducedMotion="user"> is not enough on its own: framer snaps
  // transforms rather than dropping them, so a panel that started at translateY
  // 8px would still paint one frame risen and jump. Sampled across the whole
  // open and the whole close, because one frame is all it took.
  test("the panel fades under reduced motion and stays put", async ({
    page,
  }) => {
    await page.goto("/")

    await startSampling(page)
    await firstCard(page).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    const opening = await readSamples(page)

    await startSampling(page)
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).toHaveCount(0)
    const closing = await readSamples(page)

    // The transform is a translate now, not a scale. `ty` is the 6th value of
    // matrix(a, b, c, d, tx, ty) and the 14th — m42 — of matrix3d(m11…m44). The
    // matcher this replaces read group 2 of `matrix\(([-\d.]+), 0, 0, ([-\d.]+),`,
    // which is `d`, the y-scale, and never matched matrix3d at all. It passed
    // only because the panel had no horizontal centring to write, so every
    // reduced-motion frame was `transform: none`; the panel now carries
    // x: "-50%", so the matrix branch is live and had to be right.
    const tys = [...opening, ...closing].flatMap((frame) => {
      const t = frame.transform.trim()
      if (t === "" || t.toLowerCase() === "none") return [0]
      const parsed = t.match(/^matrix(3d)?\(([^)]+)\)$/i)
      if (!parsed) return []
      const v = parsed[2].split(",").map(Number)
      // The acceptance's "constant scale of exactly 1 in both directions",
      // which the old matcher only enforced by accident.
      expect(parsed[1] ? [v[0], v[5]] : [v[0], v[3]]).toEqual([1, 1])
      return [parsed[1] ? v[13] : v[5]]
    })
    expect(tys.length).toBeGreaterThan(0)
    expect([...new Set(tys)]).toEqual([0])

    // Both nodes still fade, so the transition still says "on top of" rather
    // than "went somewhere else".
    expect(new Set(closing.map((f) => f.opacity)).size).toBeGreaterThan(1)
    expect(
      new Set(closing.map((f) => f.tint).filter((t) => t !== null)).size
    ).toBeGreaterThan(1)
  })
})

// The standalone /recording/<id> route's media chrome (ticket 09 step 3): the
// labels are CSS ::before content on the detail chrome, read off the
// pseudo-element the way home.spec.ts:234-237 reads the tile's.
test("the media centre label reads STILL FRAME with a PAUSED pip before any click", async ({
  page,
}) => {
  await page.route("**/demo/**", (route) => route.abort())
  await page.goto(`/recording/${known.id}`)

  const label = await page
    .locator(".detail-media-center")
    .evaluate((el) => getComputedStyle(el, "::after").content)
  expect(label).toContain("STILL FRAME")
  const pip = await page
    .locator(".detail-pip")
    .evaluate((el) => getComputedStyle(el, "::before").content)
  expect(pip).toContain("PAUSED")
})

// Step 13: the route shows none of the overlay chrome, and its arrows do
// nothing — no keydown listener exists on this page.
test("the standalone route shows no overlay chrome, and ArrowRight does nothing there", async ({
  page,
}) => {
  await page.goto(`/recording/${known.id}`)

  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "Close, or press Escape" })
  ).toHaveCount(0)
  await expect(page.getByText(/PREV \/ NEXT|S SAVE|V VOTE/)).toHaveCount(0)

  const before = new URL(page.url()).pathname
  await page.keyboard.press("ArrowRight")
  expect(new URL(page.url()).pathname).toBe(before)
})

// Step 14: below `lg` the three controls pin under the body, every one at least
// 44px tall, the two glyph buttons exposing the accessible names Vote and Saved.
test.describe("phone layout", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("every bottom-bar control is at least 44px tall", async ({ page }) => {
    await page.goto(`/recording/${known.id}`)

    for (const [role, name] of [
      ["button", "Vote"],
      ["button", /^(Save|Saved)$/],
      ["link", /Open repo/],
    ] as const) {
      const control = page.getByRole(role, { name }).last()
      await expect(control).toBeVisible()
      const height = await control.evaluate(
        (el) => el.getBoundingClientRect().height
      )
      expect(height).toBeGreaterThanOrEqual(44)
    }
  })
})
