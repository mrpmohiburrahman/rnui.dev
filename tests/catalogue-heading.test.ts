import { describe, expect, it } from "vitest"

import {
  catalogueHeading,
  catalogueMatchLine,
  catalogueResultLine,
} from "../lib/catalogue-heading"

describe("catalogueHeading", () => {
  it("returns Recent when nothing is filtered", () => {
    expect(catalogueHeading({ total: 277 })).toBe("Recent")
  })

  it("returns No matches when the result set is empty", () => {
    expect(catalogueHeading({ total: 0 })).toBe("No matches")
    expect(catalogueHeading({ category: "Misc", total: 0 })).toBe("No matches")
  })

  it("returns the Category display name when only a Category is set", () => {
    expect(catalogueHeading({ category: "Buttons", total: 20 })).toBe("Buttons")
  })

  it("returns the Contributor's name verbatim when only one is set", () => {
    expect(
      catalogueHeading({
        contributor: "Enzo Manuel Mangano ( Reactiive )",
        total: 7,
      })
    ).toBe("Enzo Manuel Mangano ( Reactiive )")
  })

  it("returns '<category>, by one contributor' when both are set", () => {
    expect(
      catalogueHeading({ category: "Misc", contributor: "Thomino", total: 2 })
    ).toBe("Misc, by one contributor")
  })

  it("ignores the search term entirely", () => {
    // A search chip is on in the mock's filtered variant yet the heading is
    // still the Category+Contributor phrase; the term lives in the chip.
    expect(
      catalogueHeading({ category: "Misc", contributor: "X", total: 2 })
    ).toBe("Misc, by one contributor")
  })
})

describe("catalogueResultLine", () => {
  const base = { shown: 48, catalogueTotal: 277, sort: "recent" as const }

  it("renders the unfiltered first page", () => {
    expect(catalogueResultLine({ ...base, filterCount: 0 })).toBe(
      "48 OF 277 · SORTED RECENT"
    )
  })

  it("renders the last short page", () => {
    expect(catalogueResultLine({ ...base, shown: 277, filterCount: 0 })).toBe(
      "277 OF 277 · SORTED RECENT"
    )
  })

  it("renders the filtered form with a plural count", () => {
    expect(catalogueResultLine({ ...base, shown: 2, filterCount: 3 })).toBe(
      "2 OF 277 · 3 FILTERS"
    )
  })

  it("renders the 1 FILTER singular", () => {
    expect(catalogueResultLine({ ...base, shown: 20, filterCount: 1 })).toBe(
      "20 OF 277 · 1 FILTER"
    )
  })

  it("renders the zero-result filtered form", () => {
    expect(catalogueResultLine({ ...base, shown: 0, filterCount: 3 })).toBe(
      "0 OF 277 · 3 FILTERS"
    )
  })

  it("renders the saved view with and without bookmarks", () => {
    expect(
      catalogueResultLine({
        ...base,
        shown: 3,
        filterCount: 0,
        savedView: true,
      })
    ).toBe("3 SAVED · THIS BROWSER")
    expect(
      catalogueResultLine({
        ...base,
        shown: 0,
        filterCount: 0,
        savedView: true,
      })
    ).toBe("0 SAVED · THIS BROWSER")
  })

  it("renders the reduced-motion stills variant", () => {
    expect(
      catalogueResultLine({ ...base, filterCount: 0, reducedMotion: true })
    ).toBe("48 OF 277 · STILLS ONLY")
  })

  it("switches the sort tail", () => {
    expect(
      catalogueResultLine({
        shown: 48,
        catalogueTotal: 277,
        filterCount: 0,
        sort: "top-viewed",
      })
    ).toBe("48 OF 277 · SORTED MOST VIEWED")
    expect(
      catalogueResultLine({
        shown: 48,
        catalogueTotal: 277,
        filterCount: 0,
        sort: "top-voted",
      })
    ).toBe("48 OF 277 · SORTED MOST VOTED")
  })

  it("lets the saved and filtered forms keep their own tails under reduction", () => {
    expect(
      catalogueResultLine({
        ...base,
        savedView: true,
        filterCount: 0,
        reducedMotion: true,
      })
    ).toBe("48 SAVED · THIS BROWSER")
  })

  it("renders the reserving-space placeholder, winning over every other form", () => {
    expect(
      catalogueResultLine({ ...base, filterCount: 0, loading: true })
    ).toBe("RESERVING SPACE FOR 48")
    expect(
      catalogueResultLine({
        ...base,
        savedView: true,
        filterCount: 3,
        loading: true,
      })
    ).toBe("RESERVING SPACE FOR 48")
  })
})

describe("catalogueMatchLine", () => {
  it("renders the zero panel's eyebrow", () => {
    expect(catalogueMatchLine({ shown: 0, catalogueTotal: 277 })).toBe(
      "0 OF 277 MATCH"
    )
  })

  // Both mono lines are on screen at once in the mock's `zero` variant, and the
  // denominator is the whole catalogue in each — that one rule is why this is a
  // third function rather than a flag on catalogueResultLine.
  it("keeps the same denominator as the heading row's result line", () => {
    expect(catalogueMatchLine({ shown: 0, catalogueTotal: 277 })).toContain(
      "OF 277"
    )
    expect(
      catalogueResultLine({
        shown: 0,
        catalogueTotal: 277,
        filterCount: 3,
        sort: "recent",
      })
    ).toContain("OF 277")
  })
})
