import { expect, test, type Page } from "@playwright/test"

const CDN = process.env.NEXT_PUBLIC_CDN_URL ?? "https://cdn.rnui.dev"

// A CI run is not a site visit. Without this every test would post pageviews and
// autocaptures into the production PostHog project.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

/**
 * Every grid <video>, with the two things the playback owner's policy is stated
 * in: whether it is on screen, and whether it is playing. Read in one evaluate,
 * in one frame — two round trips straddle a scroll and disagree about both.
 *
 * A Demo that errored is dropped: its element is on its way out of the tree,
 * replaced by the failure state, and it would otherwise read as an in-view tile
 * the owner refused to play.
 */
const tiles = (page: Page) =>
  page.locator("video").evaluateAll((all) =>
    (all as HTMLVideoElement[])
      .map((video, index) => {
        const box = video.getBoundingClientRect()
        return {
          index,
          failed: video.error !== null,
          onScreen:
            box.bottom > 0 &&
            box.top < window.innerHeight &&
            box.right > 0 &&
            box.left < window.innerWidth,
          playing: !video.paused,
        }
      })
      .filter((tile) => !tile.failed)
  )

const playing = async (page: Page) =>
  (await tiles(page)).filter((tile) => tile.playing).map((tile) => tile.index)

test("home page renders catalog and search", async ({ page }) => {
  await page.goto("/")
  await expect(page).not.toHaveTitle(/error/i)

  // Hero / title visible. By role, because it is the one h1 on the page — the
  // comment that used to justify this ("the footer repeats the name twice") was
  // retired with the old footer, which the ticket 04 footer replaced. The copy
  // changed with the Studio Dark hero (ticket 06).
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "A dark room full of React Native interfaces, playing quietly.",
    })
  ).toBeVisible()

  // Exactly one h1 on the route: the hero is it, and the heading row renders as
  // an h2 beneath it (recording-card-grid.tsx).
  await expect(page.locator("h1")).toHaveCount(1)

  // Search input present, in the header now (ticket 04 step 5), named with the
  // catalogue size. By its accessible name, which it did not have when this was
  // written — `input[placeholder]` used to identify it by being the only input
  // on the page without one, and matched the newsletter's once the search box
  // gained a placeholder of its own.
  await expect(
    page.getByRole("textbox", { name: /Search \d+ recordings/ })
  ).toBeVisible()
})

// Asserting that a video element exists is not enough. The most recent bug was
// a Demo that mounted, loaded, decoded a frame and never moved. Only currentTime
// advancing distinguishes playback from a still frame — and nothing is clicked
// here any more: the tile autoplays because it is on screen.
test("the Demos on screen play themselves, five at a time", async ({
  page,
}) => {
  await page.goto("/")

  const first = page.locator("video").first()
  await expect(first).toBeAttached()
  await expect
    .poll(() => first.evaluate((v: HTMLVideoElement) => v.currentTime), {
      timeout: 20_000,
      message: "Demo mounted but never advanced past frame 0",
    })
    .toBeGreaterThan(0)

  const state = await tiles(page)
  const onScreen = state.filter((tile) => tile.onScreen)
  const started = state.filter((tile) => tile.playing)

  expect(started.length).toBeGreaterThan(0)
  expect(started.length).toBeLessThanOrEqual(5)

  // The cap is granted in document order, which is visual order: the grid sets
  // no `order` and is not `dense`. So the playing tiles are exactly the first
  // five on screen, never a scattered five.
  expect(started.map((tile) => tile.index)).toEqual(
    onScreen.slice(0, 5).map((tile) => tile.index)
  )
})

// preload="none" plus play-on-grant is what makes a Demo cost nothing until it
// is watched. Counted, not read off the attribute: the attribute is a
// declaration and the count is the behaviour — the same distinction
// poster-loading.spec.ts records for the Posters.
test("a Demo is fetched only once its tile is on screen", async ({ page }) => {
  const demos = new Set<string>()
  page.on("request", (r) => {
    if (r.url().includes("/demo/")) demos.add(r.url())
  })

  await page.goto("/")
  await expect.poll(() => playing(page)).not.toHaveLength(0)
  await page.waitForTimeout(1_500)

  // One page renders 48 tiles. Only the granted five have asked for anything.
  await expect(page.getByTestId("demo")).toHaveCount(48)
  expect(demos.size).toBeGreaterThan(0)
  expect(demos.size).toBeLessThanOrEqual(5)

  // …and the rest arrive on the way down rather than never.
  const nearTop = demos.size
  for (let scroll = 0; scroll < 6; scroll++) {
    await page.mouse.wheel(0, 1_200)
    await page.waitForTimeout(500)
  }
  await expect.poll(() => demos.size).toBeGreaterThan(nearTop)
})

test("scrolling a tile away pauses it, and scrolling back restarts it", async ({
  page,
}) => {
  await page.goto("/")
  await expect.poll(() => playing(page)).not.toHaveLength(0)
  const atTop = await playing(page)

  const stillPlaying = async () =>
    (await tiles(page)).filter(
      (tile) => atTop.includes(tile.index) && tile.playing
    ).length

  // Far enough that nothing from the first row is still on screen.
  await page.mouse.wheel(0, 4_000)
  await expect.poll(stillPlaying).toBe(0)

  // …and something further down took the freed slots.
  await expect.poll(() => playing(page)).not.toHaveLength(0)

  await page.mouse.wheel(0, -4_000)
  await expect.poll(stillPlaying).toBeGreaterThan(0)
})

test("opening the overlay stops every Demo behind it", async ({ page }) => {
  await page.goto("/")
  await expect.poll(() => playing(page)).not.toHaveLength(0)

  // The heading, so the click lands on the card body rather than a control.
  await page.getByRole("heading", { level: 3 }).first().click()
  await expect(page.getByRole("dialog")).toBeVisible()

  // Zero, not fewer: five Demos decoding behind a tint is five decodes nobody
  // can see. The panel's own <video> is click-to-play, so it adds none.
  await expect.poll(() => playing(page)).toHaveLength(0)

  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect.poll(() => playing(page)).not.toHaveLength(0)
})

// The previous behaviour was a silent swap to a root-relative path, which after
// the migration is a guaranteed second failure and still shows the user a black
// rectangle. Failure is injected rather than waited for, so this is deterministic.
test("a Demo that cannot load says so, and the rest of the grid survives", async ({
  page,
}) => {
  await page.route(`${CDN}/demo/**`, (route) => route.abort())
  await page.goto("/")

  // No click anywhere: the tile fetches its Demo because it is on screen, so the
  // failure surfaces on its own.
  await expect(page.getByTestId("demo-error").first()).toBeVisible()

  // The failure is confined to the card that broke: the rest of the grid still
  // renders. Deliberately not an exact count — CI saw the number move on its own
  // between two counts of the same page, and the claim under test is isolation,
  // not arithmetic.
  const demos = page.getByTestId("demo")
  await expect(demos.first()).toBeVisible()
  expect(await demos.count()).toBeGreaterThan(10)
})

test.describe("reduced motion", () => {
  // Under contextOptions, not as a bare option: Playwright 1.60 moved it there.
  test.use({ contextOptions: { reducedMotion: "reduce" } })

  // Not mounted-and-idle: not mounted. A <video> the browser has been told to
  // hold still is still a <video> that fetched and decoded a first frame.
  test("mounts no Demo at all and fetches none", async ({ page }) => {
    const demoRequests: string[] = []
    page.on("request", (request) => {
      if (request.url().includes("/demo/")) demoRequests.push(request.url())
    })

    await page.goto("/")
    await expect(page.getByTestId("demo").first()).toBeVisible()
    await page.waitForLoadState("networkidle")

    await expect(page.locator("video")).toHaveCount(0)
    expect(demoRequests).toEqual([])

    // The tiles are not blank: they hold their Poster.
    await expect(page.getByTestId("demo").first().locator("img")).toBeVisible()
  })

  // No <video> mounts, so `playing` is never true and nothing is ever brighter
  // than anything else — a resting-by-default dim would hand the visitors who
  // asked for less motion a permanently darkened catalogue (Specimen.dc.html:95).
  // The brightness must live in CSS behind the media query rather than in the
  // hook, whose server snapshot is `true`, so this is the assertion that would
  // have caught shipping that dim.
  test("tiles sit at full brightness, and say so", async ({ page }) => {
    await page.goto("/")
    const tile = page.getByTestId("demo").first()
    await tile.waitFor()

    expect(
      await tile.evaluate((el) => getComputedStyle(el).filter)
    ).toBe("none")

    // The state chip's text is the CSS ::before (globals.css), so it is read
    // off the pseudo-element, not the element's textContent.
    const label = await tile
      .locator(".state-chip")
      .evaluate((el) => getComputedStyle(el, "::before").content)
    expect(label).toContain("STILLS ONLY")
  })
})
