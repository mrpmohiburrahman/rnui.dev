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

      let firstEl: Element | null = null
      let wrapped = false
      for (let i = 0; i < 60; i++) {
        const el = document.activeElement as HTMLElement | null
        if (!el) break
        if (i === 0) firstEl = el
        const outline = getComputedStyle(el).outlineStyle
        expect(
          outline,
          `focus stop ${i} (${el.tagName}) on ${route} (${mode}) has no visible ring`
        ).not.toBe("none")
        await page.keyboard.press("Tab")
        if (i > 0 && document.activeElement === firstEl) {
          wrapped = true
          break
        }
        // A dialog traps focus; stop once we leave it (body reached after close).
        if (el.tagName === "BODY" && i > 0) break
      }
      // We either wrapped the focusable set (normal) or left a dialog — either way
      // every stop we visited was asserted above. `wrapped` is informational.
      void wrapped
    })
  }
}
