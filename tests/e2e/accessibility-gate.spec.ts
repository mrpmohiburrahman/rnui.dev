import { expect, test } from "@playwright/test"

import { allRecordings } from "../../data/catalogue"

// studio-dark ticket 13, steps 8 and 9 — the accessible-name and focus-visibility
// sweeps across all ten routes, in both modes. The motion + reduced-motion +
// keyboard coverage lives in keyboard.spec.ts / home.spec.ts / recording-route.spec.ts;
// this file owns the two route-wide sweeps the merge gate requires.

const ROUTES = [
  "/",
  "/products",
  "/bookmarks",
  `/recording/${allRecordings[0].id}`,
  "/contributors",
  "/aboutus",
  "/contactus",
  "/subscribe",
  "/privacypolicy",
  "/termsofservice",
] as const

// The only ambiguous accessible names the site ships on purpose. Every tile has
// a Repo link whose name is exactly "Repo" (the arrow is aria-hidden), and each
// sits inside a card whose <h3> names its Recording — so 48 "Repo" links on one
// page all point at different GitHub repos. The detail panel renders the same
// source link with the variant text "Open repo" (recording-detail.tsx:519), one
// per open overlay/detail, again each a distinct repo. Both are the same
// destination class the gate allows; anything else sharing a name across
// different hrefs fails. The single "Open source repo on GitHub" link on the
// detail (recording-detail.tsx:413) carries unique text per Recording and needs
// no allow-list entry.
const ALLOWED_SHARED_NAMES = new Set(["repo", "open repo"])

test.beforeEach(async ({ page }) => {
  await page.route("**/*posthog.com/**", (route) => route.abort())
  await page.route("**/demo/**", (route) => route.abort())
})

// Step 9 — no two links sharing an accessible name point at different hrefs,
// except names on the allow-list. Run per route, per mode.
for (const mode of ["no-preference", "reduce"] as const) {
  for (const route of ROUTES) {
    test(`step 9 · ${route} · ${mode} · no ambiguous link names`, async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: mode })
      await page.goto(route, { waitUntil: "networkidle" })

      const groups = await page.evaluate(() => {
        const byName = new Map<string, Set<string>>()
        for (const a of Array.from(document.querySelectorAll("a[href]"))) {
          const name = (a.textContent || "").trim().toLowerCase()
          if (!name) continue
          const href = a.getAttribute("href") || ""
          let set = byName.get(name)
          if (!set) {
            set = new Set<string>()
            byName.set(name, set)
          }
          set.add(href)
        }
        const bad: Record<string, string[]> = {}
        byName.forEach((hrefs, name) => {
          if (hrefs.size > 1) bad[name] = Array.from(hrefs)
        })
        return bad
      })

      const offenders = Object.keys(groups).filter(
        (name) => !ALLOWED_SHARED_NAMES.has(name)
      )
      expect(offenders, JSON.stringify(groups)).toEqual([])
    })
  }
}

// Step 9, second half — the detail's three Contributor links carry the
// Contributor's own name, and /contributors has no two rows with the same name.
test("step 9 · detail Contributor links are named, and /contributors rows are distinct", async ({
  page,
}) => {
  await page.goto(`/recording/${allRecordings[0].id}`, {
    waitUntil: "networkidle",
  })

  const profileNames = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a"))
      .map((a) => (a.textContent || "").trim())
      .filter((t) => /(x|github|linkedin) ↗/i.test(t))
  )
  // At least the GitHub link exists for the first Recording (enzo has one).
  expect(profileNames.some((n) => /github ↗/i.test(n))).toBe(true)

  await page.goto("/contributors", { waitUntil: "networkidle" })
  const rowNames = await page.evaluate(() => {
    const rows = Array.from(
      document.querySelectorAll("a[href^='/products?contributor=']")
    )
    const names = rows.map((r) => (r.textContent || "").trim())
    return { count: names.length, distinct: new Set(names).size }
  })
  expect(rowNames.distinct, `duplicate contributor rows: ${JSON.stringify(rowNames)}`).toBe(
    rowNames.count
  )
})

// Step 8 — Tab through every focusable element on each route, in dark and light,
// and assert the focused element never resolves to a `none` outline. One real
// keypress first (per keyboard.spec.ts): :focus-visible is a modality heuristic,
// and a programmatic .focus() only matches it while the page has seen no pointer.
for (const mode of ["dark", "light"] as const) {
  for (const route of ROUTES) {
    test(`step 8 · ${route} · ${mode} · every focus stop draws a ring`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: mode })
      await page.goto(route, { waitUntil: "networkidle" })
      await page.keyboard.press("Tab")

      // The walk runs in the browser, not in Node. An earlier version read
      // `document.activeElement` and `getComputedStyle` directly in the test
      // body, where neither exists — every one of these 20 cases died on
      // `ReferenceError: document is not defined` before asserting anything.
      // Each stop is measured inside page.evaluate() and Tab is pressed from
      // the test, so the sequencing stays with Playwright.
      const stops: Array<{ index: number; tag: string; outline: string }> = []
      let firstKey: string | null = null

      for (let i = 0; i < 60; i++) {
        const stop = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null
          if (!el) return null
          return {
            tag: el.tagName,
            outline: getComputedStyle(el).outlineStyle,
            // Identity across round-trips: activeElement cannot cross the
            // bridge, so key on what distinguishes a stop.
            key: `${el.tagName}|${el.getAttribute("href") ?? ""}|${
              (el.textContent || "").trim().slice(0, 40)
            }`,
          }
        })
        if (!stop) break

        // Tabbing past the last control moves focus to the document body (and
        // on to browser chrome). BODY is not a focus stop and legitimately has
        // no ring, so the walk ends here rather than asserting on it — the
        // original guard tested this only *after* the assertion, which is why
        // every route reported a phantom `BODY has no visible ring` failure at
        // the end of its tab order.
        if (stop.tag === "BODY" && i > 0) break

        if (i === 0) firstKey = stop.key
        stops.push({ index: i, tag: stop.tag, outline: stop.outline })

        expect(
          stop.outline,
          `focus stop ${i} (${stop.tag}) on ${route} (${mode}) has no visible ring`
        ).not.toBe("none")

        await page.keyboard.press("Tab")

        const next = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null
          if (!el) return null
          return `${el.tagName}|${el.getAttribute("href") ?? ""}|${
            (el.textContent || "").trim().slice(0, 40)
          }`
        })
        // Wrapped the focusable set — every stop visited has been asserted.
        if (i > 0 && next === firstKey) break
      }

      // A route with no focusable element at all would pass vacuously.
      expect(stops.length, `no focus stops found on ${route} (${mode})`).toBeGreaterThan(0)
    })
  }
}
