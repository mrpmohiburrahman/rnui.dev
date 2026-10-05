// tests/og-contributor-card.test.ts
//
// Four invariants, each of which fails silently in production if it breaks.
//
// None of these are the kind of thing a render surfaces. A card with the wrong cache key still
// renders. A card whose font file 404s still renders, in the wrong face. A card with no
// `twitter:image` renders perfectly and is simply invisible on X. So they are asserted here
// instead of being left to review.

import { describe, expect, it } from "vitest"

import { allRecordings } from "@/data/catalogue"
import { AR, COLUMN, DECK, countLabel, nameSizeFor, solveFan, splitName } from "@/lib/og-contributor-card"
import { contributorCardKey, contributorCardUrl, newestRecordingId } from "@/lib/og-contributor-url"

const names = [...new Set((allRecordings as { contributor: string }[]).map((r) => r.contributor))]

describe("the Contributor's name", () => {
  it("splits a trailing alias into its own block, so no break is left to Satori", () => {
    // The defect this prevents: `keep-all` plus a non-breaking space still broke the widest
    // real name as `Enzo Manuel Mangano (` / `Reactiive)`, orphaning the bracket.
    expect(splitName("Enzo Manuel Mangano (Reactiive)")).toEqual(["Enzo Manuel Mangano", "(Reactiive)"])
    // A two-word alias, which the settled card's cast never contained.
    expect(splitName("Arnaud Dellinger (evening kid)")).toEqual(["Arnaud Dellinger", "(evening kid)"])
    // Hangul whole, as one block — which is also why it cannot be split mid-word.
    expect(splitName("Daehyeon Mun (문대현)")).toEqual(["Daehyeon Mun", "(문대현)"])
  })

  it("leaves a name with no parenthetical untouched", () => {
    // The binding constraint on every size, and the reason the ceiling exists at all.
    expect(splitName("Konstantinos Efkarpidis")).toEqual(["Konstantinos Efkarpidis", null])
  })

  it("does not mistake a pipe or a digit for an alias", () => {
    expect(splitName("Epicode | 0xV")).toEqual(["Epicode | 0xV", null])
  })
})

describe("the count's label", () => {
  it("is singular for exactly one", () => {
    // A real render, not a nicety: "1 ANIMATIONS" is visibly machine-made on a share.
    expect(countLabel(1)).toBe("ANIMATION")
    expect(countLabel(0)).toBe("ANIMATIONS")
    expect(countLabel(138)).toBe("ANIMATIONS")
  })
})

describe("the fan's geometry", () => {
  it("holds its width across every tile count, so the type column never moves", () => {
    // The fan's footprint is fixed and the tiles inside it grow or shrink to fill it. If the
    // width drifted with the tile count, the right column would move with the Contributor's
    // Recording count and every measured name ceiling would be wrong for some card.
    const widths = [1, 2, 3, 5, 8].map((cap) => {
      const { w } = solveFan(cap)
      // width = (cap-1)*ratio*w + w + 2*overhang + 2*shadowReach
      const overhang = w * AR * Math.sin((Math.abs(DECK.tilt) * ((cap - 1) / 2) * Math.PI) / 180)
      return (cap - 1) * DECK.stepRatio * w + w + 2 * overhang + 48
    })
    for (const [i, got] of widths.entries()) {
      // Within a pixel: the solver rounds the tile width to an integer.
      expect(Math.abs(got - DECK.fanW)).toBeLessThanOrEqual(3)
      void i
    }
  })

  it("keeps a one-Recording Contributor's single tile inside the card", () => {
    // The clamp that stops the solver solving to a tile taller than the band.
    const { w } = solveFan(1)
    expect(w * AR).toBeLessThanOrEqual(630 - 2 * 66)
    expect(w).toBeGreaterThan(100)
  })

  it("insets by its own overhang, so the outer card is not cropped", () => {
    // A rotated card's top corner swings a FULL height, not half. Halving this put the
    // leftmost ink at x=12 — inside the 66px Slack crop, so the outer card was cut off on
    // every share.
    const { w, inset } = solveFan(8)
    const expected = w * AR * Math.sin((Math.abs(DECK.tilt) * (7 / 2) * Math.PI) / 180) + 24
    expect(Math.abs(inset - expected)).toBeLessThanOrEqual(1)
  })
})

describe("the card URL", () => {
  it("moves when the fan's content moves, and not otherwise", () => {
    // Ticket 03 measured that an existing LinkedIn share is PERMANENT, and RFC 9111 §4 makes a
    // different target URI a different cache entry. So the key has to carry the newest
    // Recording's id: without it, a share keeps the fan it was made with forever while the
    // page it points at shows a newer one.
    const enzo = "Enzo Manuel Mangano (Reactiive)"
    expect(newestRecordingId(enzo)).not.toBe("")
    expect(contributorCardKey(enzo)).toMatch(/^[0-9a-f]{16}$/)
    // Stable for the same input — an unstable key would make every share a cache miss.
    expect(contributorCardKey(enzo)).toBe(contributorCardKey(enzo))
    // And case- and whitespace-insensitive, because `?contributor=` has been through a URL.
    expect(contributorCardKey(enzo)).toBe(contributorCardKey("enzo  manuel   mangano (reactiive)"))
  })

  it("is absolute, and carries the name and the key", () => {
    const url = new URL(contributorCardUrl("Hubert Ryan"))
    expect(url.pathname).toMatch(/\/api\/og\/contributor$/)
    expect(url.searchParams.get("name")).toBe("Hubert Ryan")
    expect(url.searchParams.get("v")).toMatch(/^[0-9a-f]{16}$/)
    // Absolute because a scraper resolves og:image against the page.
    expect(url.origin).not.toBe("null")
  })

  it("mints no slug — ADR-0009 gives a Contributor no slug and no id", () => {
    // The only derived thing here is an opaque cache key. The page address stays
    // `/products?contributor=<exact name>`, and this must not leak a slug into it.
    const url = new URL(contributorCardUrl("Daehyeon Mun (문대현)"))
    expect(url.pathname).not.toContain("dae")
    expect(url.pathname).not.toContain("dae-hyeon")
    expect(url.searchParams.get("name")).toBe("Daehyeon Mun (문대현)")
  })
})

describe("the name's size", () => {
  it("is the measured all-names ceiling for this card's column", () => {
    // 64px is the largest size at which all 24 real names keep each part on one line in a
    // 733px column, measured by rendering and ink-counting. Bound by Konstantinos Efkarpidis.
    expect(nameSizeFor()).toBe(64)
    expect(COLUMN).toBe(733)
  })

  it("would fall rather than overflow if the column narrowed", () => {
    // The size is a function of the column, not a stored number — that is the whole reason a
    // fan-width change cannot silently ship a clipped name.
    expect(nameSizeFor(560)).toBeLessThan(nameSizeFor(COLUMN))
    expect(nameSizeFor(556)).toBe(48)
  })

  it("covers every real Contributor in the catalogue", () => {
    // 24 names, and the cast the renders show is five of them. The other nineteen decide the
    // ceiling just as much, which is why they are asserted here rather than eyeballed.
    expect(names.length).toBeGreaterThanOrEqual(24)
    for (const n of names) {
      const [main, alias] = splitName(n)
      expect(main.length).toBeGreaterThan(0)
      if (alias) expect(alias.startsWith("(")).toBe(true)
    }
  })
})
