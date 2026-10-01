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
        // The *accessible* name, not `textContent`. An `aria-hidden` descendant
        // contributes nothing to the name a screen reader announces, and every
        // Repo link ends in `<span aria-hidden>↗</span>`
        // (recording-card.tsx:382). Reading `textContent` grouped them under
        // `repo ↗`, which the allow-list below could never match — so the gate
        // reported all 48 Repo links as ambiguous on every catalogue route,
        // while the names it was actually asserting on were not the ones the
        // page exposes.
        const accessibleName = (el: Element) => {
          const clone = el.cloneNode(true) as Element
          clone
            .querySelectorAll("[aria-hidden='true'],[aria-hidden='']")
            .forEach((hidden) => hidden.remove())
          return (
            el.getAttribute("aria-label") ||
            clone.textContent ||
            ""
          ).trim()
        }

        const byName = new Map<string, Set<string>>()
        for (const a of Array.from(document.querySelectorAll("a[href]"))) {
          const name = accessibleName(a).toLowerCase()
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
    // Scoped to <main>: the rail is in the layout and links its top four
    // Contributors to the same four addresses, so an unscoped query returned
    // 27 links for 23 rows and read the four legitimate duplicates as duplicate
    // *rows*. The rail deliberately points at the same place the row does.
    const rows = Array.from(
      document.querySelectorAll("main a[href^='/products?contributor=']")
    )
    const names = rows.map((r) => (r.textContent || "").trim())
    return { count: names.length, distinct: new Set(names).size }
  })
  expect(
    rowNames.distinct,
    `duplicate contributor rows: ${JSON.stringify(rowNames)}`
  ).toBe(rowNames.count)
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
            key: `${el.tagName}|${el.getAttribute("href") ?? ""}|${(
              el.textContent || ""
            )
              .trim()
              .slice(0, 40)}`,
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

        // Same class of artefact, found by `/review-animations` fallout rather
        // than by this ticket: `NEXTJS-PORTAL` is the custom element Next injects
        // for its own dev-tools/error overlay. It is not authored here, renders
        // no affordance a visitor can use, and cannot be given a focus ring by
        // this codebase — so asserting one on it fails 14 cases (7 routes x 2
        // modes) for a control the site does not own. Skipped, not ended on: it
        // appears mid-walk at stop 46, and `break` here would silently stop
        // asserting every real control after it. Narrow on purpose — one tag
        // name, not a blanket allow-list, so a real unfocusable control still
        // fails the sweep.
        if (stop.tag === "NEXTJS-PORTAL") {
          await page.keyboard.press("Tab")
          continue
        }

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
          return `${el.tagName}|${el.getAttribute("href") ?? ""}|${(
            el.textContent || ""
          )
            .trim()
            .slice(0, 40)}`
        })
        // Wrapped the focusable set — every stop visited has been asserted.
        if (i > 0 && next === firstKey) break
      }

      // A route with no focusable element at all would pass vacuously.
      expect(
        stops.length,
        `no focus stops found on ${route} (${mode})`
      ).toBeGreaterThan(0)
    })
  }
}

// studio-dark ticket 13 step 14 fallout — the pointer-target sweep the gate
// never ran. `/review-animations` found the filter chips' ✕ at `size-4`, a
// 16x16 CSS-pixel target, which is the only way to drop a facet on a phone.
// `review-animations`'s STANDARDS.md (~/.claude/skills/) puts the floor at 44x44; WCAG 2.2 SC 2.5.8 (AA) puts it at 24x24
// and is the one that is normative, so the assertion below is written against
// 44 and the failure message names both.
//
// Scoped to the chips row rather than every control on the page: a route-wide
// sweep would fail on inherited chrome this ticket did not draw and cannot fix
// without a spec override, and a gate that fails for reasons outside its own
// diff gets muted rather than fixed.
const TARGET_MIN = 44

// Hit-tested, not measured. `boundingBox()` returns the border box, which
// cannot see a transparent `::before` hit area — the standard way to widen a
// small control without redrawing it. Asserting the box would therefore fail a
// correct fix and pass a control that merely looks big, so this probes the four
// corners and the centre of the required square with elementFromPoint and
// requires every probe to land on the control itself. Pseudo-elements are not
// returned by elementFromPoint; their originating element is, which is the
// answer this needs.
// Both viewports, because the two chip rows swap at `md` and each has its own
// ✕. The desktop bar's was 16x16 and the phone header's 20x20, and a
// desktop-only sweep silently skips the phone one — `isVisible()` filters it out
// rather than failing on it, which is how a 20x20 target on the one row that is
// only ever touched stayed invisible to a gate that was already looking for it.
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "phone", width: 390, height: 844 },
] as const

for (const viewport of VIEWPORTS) {
  test(`every filter-chip control clears the pointer-target floor · ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })
    await page.goto("/products?category=Misc&search=wheel")

    const controls = page.getByLabel(/Remove .* filter|Clear search|Clear all/)
    const count = await controls.count()
    expect(
      count,
      "no chip controls found — the fixture stopped filtering"
    ).toBeGreaterThan(0)

    const misses: string[] = []
    for (let i = 0; i < count; i++) {
      const control = controls.nth(i)
      if (!(await control.isVisible())) continue
      const label = await control.getAttribute("aria-label")

      const hit = await control.evaluate((el, min) => {
        const box = el.getBoundingClientRect()
        const cx = box.left + box.width / 2
        const cy = box.top + box.height / 2
        const half = min / 2 - 1 // inset a pixel so rounding cannot fail an exact-size target
        const probes: [number, number][] = [
          [cx, cy],
          [cx - half, cy - half],
          [cx + half, cy - half],
          [cx - half, cy + half],
          [cx + half, cy + half],
        ]
        const landed = probes.filter(([x, y]) => {
          const at = document.elementFromPoint(x, y)
          return at === el || el.contains(at)
        })
        return { landed: landed.length, probes: probes.length }
      }, TARGET_MIN)

      if (hit.landed < hit.probes) {
        misses.push(`${label}: ${hit.landed}/${hit.probes} probes landed`)
      }
    }

    expect(
      misses,
      `controls whose hit area is smaller than ${TARGET_MIN}x${TARGET_MIN} (WCAG 2.2 SC 2.5.8 floor is 24x24): ${misses.join(", ")}`
    ).toEqual([])
  })
}
