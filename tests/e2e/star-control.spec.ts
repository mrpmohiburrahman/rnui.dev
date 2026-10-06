import { expect, test, type Browser, type Page } from "@playwright/test"

import starCountFile from "../../scripts/star-count.json"

// github-star-button ticket 04.
//
// **The served-HTML assertions are the point of this file.** Everything else here
// could be checked by reading components/star-control.tsx; the equality between
// the number in the served document and the number in the committed file cannot,
// and it is the only proof that the count is inlined at build time rather than
// fetched at request time. GitHub being absent from a visitor's request path is
// the ticket's architecture, and this is the test that proves it.

const STAR_COUNT = starCountFile.stars

test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
})

/** The control's accessible name. One string, every width, both layouts. */
const NAME = `Star ${STAR_COUNT} stars on GitHub`

test("the number in the served HTML equals the number in the committed file", async ({
  request,
}) => {
  // The architecture assertion. If the count were fetched at request time this
  // equality would hold only while the fetch resolved, and the served document
  // would carry a placeholder instead — so reading it from `request.get` rather
  // than from a rendered page is what makes it a proof.
  const html = await (await request.get("/")).text()

  // The header rides a Suspense boundary (useSearchParams), so the fallback is
  // what carries the whole control set into the served document. This also
  // catches the control being absent from that fallback, which is the failure
  // mode the fallback exists to prevent.
  expect(html).toContain(STAR_COUNT.toString())
  expect(html).toContain('aria-label="Star ')
  // And no GitHub API call anywhere in the served document.
  expect(html).not.toMatch(/api\.github\.com/)
})

test("the file's date never reaches the page, and the control has no title", async ({
  request,
}) => {
  // github-star-button ticket 03 decided the count must not advertise its own
  // staleness. A `title` attribute is the path of least resistance for undoing
  // that: it looks like a nicety, every other test still passes, and a settled
  // decision is reversed by someone who never read the ticket.
  const html = await (await request.get("/")).text()

  expect(html).not.toContain(starCountFile.generated_at)
  // `title=` on the anchor specifically. The document has legitimate titles
  // elsewhere (the <title> element, the search field's), so this is scoped to the
  // star anchor's own attributes.
  const anchor = html.match(/<a[^>]*aria-label="Star [^"]*"[^>]*>/)?.[0] ?? ""
  expect(anchor, "the star anchor is not in the served document").not.toBe("")
  expect(anchor).not.toMatch(/title=/)
})

test("the accessible name is identical above and below the breakpoint", async ({
  page,
}) => {
  await page.goto("/")
  const chip = page.getByRole("link", { name: NAME })
  await expect(chip).toHaveCount(1)

  // Hit-tested, not measured: the border box is not the touchable area, and this
  // is a width-budget problem that cannot be checked by reading the class names.
  for (const width of [1440, 1280, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.getByRole("link", { name: NAME })).toBeVisible()
  }
})

test("on the phone the name survives the word being dropped", async ({ page }) => {
  // The phone draws `★ 350` with no word. Matching the name to what is drawn was
  // rejected precisely because this case would then announce a bare number.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await expect(page.getByRole("link", { name: NAME })).toBeVisible()

  // And the word really takes no room on the phone. Both chips are always in the
  // DOM — one per layout, CSS-hidden rather than conditionally rendered, which is
  // how the header already ships its search box — so this measures the phone
  // chip's own word box.
  //
  // **Width, not `offsetParent`.** The first version of this counted spans with a
  // non-null `offsetParent` and reported the word as painted on the phone, which
  // is wrong: `sr-only` is `position:absolute`, so it has an offsetParent while
  // painting nothing. A 1px box is the honest claim — the word is in the
  // document and out of the layout — and it is what a reader would notice.
  const wordBox = await page
    .locator('a[aria-label^="Star "] span', { hasText: /^Star$/ })
    .last()
    .boundingBox()
  expect(wordBox, "the phone chip has no 'Star' span at all").not.toBeNull()
  expect(wordBox!.width).toBeLessThanOrEqual(2)
  expect(wordBox!.height).toBeLessThanOrEqual(2)

  // The desktop chip's word, by contrast, is a real box once the viewport is wide
  // enough to draw it — which is the other half of "one name, two forms".
  await page.setViewportSize({ width: 1440, height: 900 })
  const desktopWord = await page
    .locator('a[aria-label^="Star "] span', { hasText: /^Star$/ })
    .first()
    .boundingBox()
  expect(desktopWord!.width).toBeGreaterThan(20)
})

test("the phone tap target is 44 by 44, hit-tested", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  const chip = page.getByRole("link", { name: NAME })

  // Hit-tested at the four corners plus the centre: a `::before` pseudo-element
  // is not in the element's own box, so boundingBox() would report the small
  // glyph and this would pass while the real target was short.
  const box = (await chip.boundingBox())!
  const points = [
    [box.x + 2, box.y + box.height / 2],
    [box.x + box.width - 2, box.y + box.height / 2],
    [box.x + box.width / 2, box.y + 2],
    [box.x + box.width / 2, box.y + box.height - 2],
    [box.x + box.width / 2, box.y + box.height / 2],
  ] as const

  for (const [x, y] of points) {
    const hits = await page.evaluate(
      ([px, py]) =>
        (document.elementFromPoint(px as number, py as number) as HTMLElement | null)
          ?.closest("a")
          ?.getAttribute("aria-label") ?? "",
      [x, y]
    )
    expect(hits, `nothing at (${Math.round(x)}, ${Math.round(y)})`).toBe(NAME)
  }
})

test("it opens in a new tab, with noopener noreferrer and the arrow", async ({
  page,
}) => {
  await page.goto("/")
  const chip = page.getByRole("link", { name: NAME })
  await expect(chip).toHaveAttribute("target", "_blank")
  await expect(chip).toHaveAttribute("rel", /noopener/)
  await expect(chip).toHaveAttribute("rel", /noreferrer/)
  await expect(chip).toHaveAttribute("href", "https://github.com/mrpmohiburrahman/rnui.dev")
  // The trailing arrow is the footer's own "leaves the site" convention, and it
  // is aria-hidden so it is not read aloud.
  await expect(chip.locator("span", { hasText: "↗" })).toHaveAttribute(
    "aria-hidden",
    "true"
  )
})

// The capture spy, copied verbatim from tests/e2e/posthog-events.spec.ts. The
// events read here only fire on the clicks this file drives, long after init, so
// the wrap is reliably in place first. No network leaves the page.
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

async function readCaptured(page: Page) {
  return page.evaluate(
    () =>
      (
        window as unknown as {
          __captured?: [string, Record<string, unknown>][]
        }
      ).__captured ?? []
  )
}

/**
 * Click the chip at a width and return its `star_clicked` emissions.
 *
 * **`dispatchEvent`, not `click`, and the reason is worth keeping.** The control
 * is a link with `target="_blank"`, which is a requirement of the ticket rather
 * than an implementation detail: a same-tab link races the page unload, so the
 * handler would not finish. Playwright's real `click()` therefore opens a GitHub
 * tab and the assertion reads the *old* page once it has begun navigating — the
 * event is emitted, but not where the test is looking. Verified rather than
 * assumed: invoking the React handler directly and `dispatchEvent` both fire
 * `star_clicked`, while `click()` on its own does not surface it.
 *
 * This is a harness detail and not a product defect. The test above asserts
 * `target="_blank"` and `rel` directly, so the new-tab behaviour is pinned; what
 * is left here is only "the handler runs, and reports one event".
 */
async function starEventsFrom(
  browser: Browser,
  viewport: { width: number; height: number }
): Promise<[string, Record<string, unknown>][]> {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()
  await page.addInitScript(CAPTURE_SPY)
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.goto("/")
  // The chip that this viewport actually draws. Both layouts are in the DOM and
  // the desktop one is first in document order, so selecting on position would
  // dispatch into a CSS-hidden element at phone width — which is a click on
  // nothing, and the reason this helper takes the width rather than assuming
  // which chip it is looking at.
  const chip = viewport.width < 768 ? "last" : "first"
  await page
    .locator(String.raw`a[aria-label^="Star "]`)[chip]()
    .waitFor()
  // The spy attaches by polling until PostHog assigns `window.posthog`, so wait
  // for the wrap rather than racing it.
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __wrapped?: boolean }).__wrapped)
    )
    .toBe(true)
  await page.locator(String.raw`a[aria-label^="Star "]`)[chip]().dispatchEvent("click")
  const captured = await readCaptured(page)
  await context.close()
  return captured.filter(([event]) => event === "star_clicked")
}

test("the click reports one event with only the count", async ({ browser }) => {
  // One shared handler for both layouts (components/star-control.tsx), asserted
  // from the desktop bar. The phone half is the next test, and the reason it is a
  // separate test is that the two layouts have already drifted once.
  const stars = await starEventsFrom(browser, { width: 1440, height: 900 })

  expect(stars).toHaveLength(1)
  // Exactly one property. A `staleness_days` would reintroduce through analytics
  // the disclosure ticket 03 decided against.
  expect(Object.keys(stars[0][1])).toEqual(["stars"])
  expect(stars[0][1].stars).toBe(STAR_COUNT)
})

test("the phone layout reports the same event, through the same handler", async ({
  browser,
}) => {
  const stars = await starEventsFrom(browser, { width: 390, height: 844 })

  expect(stars).toHaveLength(1)
  expect(Object.keys(stars[0][1])).toEqual(["stars"])
  expect(stars[0][1].stars).toBe(STAR_COUNT)
})

test("nothing acknowledges the press", async ({ page }) => {
  // "Thanks for starring" claims an observation the site cannot make, and a
  // "Starred" chip copy both claims something about the visitor's account from
  // one outbound click and spends the count, which is the entire social proof.
  // The site already carries an unused toast dependency, so this is the decision
  // written as an assertion rather than a comment.
  await page.goto("/")
  const chip = page.getByRole("link", { name: NAME })
  await chip.click()
  await page.waitForTimeout(300)

  // The chip's own text is unchanged after the click.
  await expect(chip).toContainText(String(STAR_COUNT))
  const body = await page.locator("body").innerText()
  expect(body).not.toMatch(/thanks for star/i)
  expect(body).not.toMatch(/you['’]ve starred|you starred/i)
  // And no new stored key: the control is stateless.
  const keys = await page.evaluate(() => Object.keys(localStorage))
  expect(keys.filter((k) => /star/i.test(k))).toEqual([])
})