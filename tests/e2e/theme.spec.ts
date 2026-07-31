import { expect, test, type Page } from "@playwright/test"

// A CI run is not a site visit, and nothing here is about playback.
test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

// next-themes writes its own key, and only from setTheme — it never persists the
// default. Spelled as a literal because the claim under test is about what is
// already sitting in visitors' browsers, not about what the code now calls it.
const THEME_KEY = "theme"

const htmlClass = (page: Page) =>
  page.evaluate(() => document.documentElement.className)

const colorScheme = (page: Page) =>
  page.evaluate(() => document.documentElement.style.colorScheme)

test.describe("a first visit follows the device", () => {
  // A fresh context per test, which is exactly "no stored preference" — and
  // "never opened the toggle" is the same path, however many times someone has
  // been here.
  for (const scheme of ["dark", "light"] as const) {
    test(`${scheme} device, nothing stored`, async ({ browser }) => {
      const context = await browser.newContext({ colorScheme: scheme })
      const page = await context.newPage()
      await page.route("**/*posthog.com/**", (r) => r.abort())
      await page.route("**/demo/**", (r) => r.abort())
      await page.goto("/")

      expect(await htmlClass(page)).toContain(scheme)
      expect(await colorScheme(page)).toBe(scheme)
      // Nothing was written: the visitor has still made no choice, so flipping
      // the device setting later still moves them.
      expect(
        await page.evaluate((k) => localStorage.getItem(k), THEME_KEY)
      ).toBeNull()

      await context.close()
    })
  }

  // The point of reading the device setting before first paint rather than
  // correcting it after hydration.
  //
  // Measured at first contentful paint, not off `requestAnimationFrame`. A rAF
  // callback runs *before* the paint of its own frame, so a rAF sampler started
  // from an init script reads the document before next-themes' blocking script
  // has run and reports a light frame that was never painted. FCP is the first
  // moment a visitor could have seen anything, which is the thing the claim is
  // about.
  test("nothing light has been painted by first contentful paint", async ({
    browser,
  }) => {
    const context = await browser.newContext({ colorScheme: "dark" })
    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (r) => r.abort())
    await page.route("**/demo/**", (r) => r.abort())

    await page.addInitScript(() => {
      const w = window as unknown as {
        __atPaint: { background: string; html: string } | null
      }
      w.__atPaint = null
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name !== "first-contentful-paint" || w.__atPaint) continue
          w.__atPaint = {
            background: getComputedStyle(document.body).backgroundColor,
            html: document.documentElement.className,
          }
        }
      }).observe({ type: "paint", buffered: true })
    })

    await page.goto("/")
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible()

    const atPaint = await page.evaluate(
      () =>
        (
          window as unknown as {
            __atPaint: { background: string; html: string } | null
          }
        ).__atPaint
    )
    expect(atPaint).not.toBeNull()
    // #FAFAFA is the light body (app/globals.css:75); #0A0A0A is the dark one.
    expect(atPaint!.background).toBe("rgb(10, 10, 10)")
    expect(atPaint!.html).toContain("dark")

    await context.close()
  })
})

test.describe("a stored preference still wins", () => {
  test("light stored, dark device", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "dark" })
    await context.addInitScript(
      ({ key }) => localStorage.setItem(key, "light"),
      { key: THEME_KEY }
    )
    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (r) => r.abort())
    await page.route("**/demo/**", (r) => r.abort())
    await page.goto("/")

    expect(await htmlClass(page)).toContain("light")
    expect(await htmlClass(page)).not.toContain("dark")

    await context.close()
  })

  test("toggling to Dark persists across a reload", async ({ browser }) => {
    const context = await browser.newContext({ colorScheme: "light" })
    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (r) => r.abort())
    await page.route("**/demo/**", (r) => r.abort())
    await page.goto("/")

    await page.getByRole("button", { name: "Toggle theme" }).click()
    await page.getByRole("menuitem", { name: "Dark" }).click()

    await expect
      .poll(() => page.evaluate((k) => localStorage.getItem(k), THEME_KEY))
      .toBe("dark")

    await page.reload()
    expect(await htmlClass(page)).toContain("dark")

    await context.close()
  })
})

// next-themes keeps a matchMedia listener while the resolved name is "system",
// which is now the state a visitor who has never touched the toggle is in.
test("picking System follows the device without a reload", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "light" })
  const page = await context.newPage()
  await page.route("**/*posthog.com/**", (r) => r.abort())
  await page.route("**/demo/**", (r) => r.abort())
  await page.goto("/")

  await page.getByRole("button", { name: "Toggle theme" }).click()
  await page.getByRole("menuitem", { name: "System" }).click()
  await expect.poll(() => htmlClass(page)).toContain("light")

  await page.emulateMedia({ colorScheme: "dark" })
  await expect.poll(() => htmlClass(page)).toContain("dark")

  await context.close()
})

// Not a theme assertion, but adding `suppressHydrationWarning` to the <html> tag
// for the theme is what exposed it. Those few extra bytes pushed the last nav
// item past the point where React outlines an element into its own RSC row, and
// Radix's `asChild` Slot erases a lazy reference — so the <li> was served empty.
// components/nav/top-nav-bar.tsx is a client component now, which keeps its
// subtree out of Flight entirely.
//
// It is a size threshold, so it can be tripped again by anything that grows the
// tree, and it fails silently: no error, no warning, just a missing link.
// Asserted against the served markup, because that is where it went missing —
// before any hydration.
test("the header still carries the GitHub link, server-rendered", async ({
  page,
}) => {
  const response = await page.goto("/")
  const html = (await response?.text()) ?? ""
  expect(html).toContain(
    'href="https://github.com/mrpmohiburrahman/awesome-react-native-ui"'
  )

  await expect(
    page.getByRole("link", { name: /Star us on GitHub/ })
  ).toBeVisible()
})

test("the console carries no hydration warning under either emulation", async ({
  browser,
}) => {
  for (const scheme of ["dark", "light"] as const) {
    const context = await browser.newContext({ colorScheme: scheme })
    const page = await context.newPage()
    await page.route("**/*posthog.com/**", (r) => r.abort())
    await page.route("**/demo/**", (r) => r.abort())

    const complaints: string[] = []
    page.on("console", (message) => {
      const text = message.text()
      if (/hydrat|did not match|server (HTML|rendered)/i.test(text)) {
        complaints.push(text)
      }
    })
    page.on("pageerror", (error) => {
      if (/hydrat/i.test(error.message)) complaints.push(error.message)
    })

    await page.goto("/")
    await expect(page.getByRole("heading", { level: 3 }).first()).toBeVisible()
    expect(complaints, `under ${scheme}`).toEqual([])

    await context.close()
  }
})
