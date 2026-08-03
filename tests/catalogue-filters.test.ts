import { describe, expect, it } from "vitest"

import { allRecordings } from "../data/catalogue"
import type { Recording } from "../data/recording"
import {
  catalogueActions,
  catalogueDiagnosis,
  catalogueSentences,
  clearAllHref,
  type ActiveFilters,
} from "../lib/catalogue-filters"

// None of this algorithm's branches is visible from a screenshot, so this file
// is where it is pinned.
//
// The fixtures are literal Recordings rather than allRecordings, so a submission
// to the catalogue cannot turn a passing case red. The one exception is the last
// describe block, which asserts against the real data on purpose: it is the
// guard against the mock's own false sentence — "Wheel Picker … lives in
// Pickers" — being hard-coded back in.

const recording = (
  caption: string,
  category: Recording["category"],
  contributor: string
): Recording => ({
  id: caption.toLowerCase().replace(/\s+/g, "-"),
  caption,
  demoPath: `demo/${caption}.mp4`,
  posterPath: `poster/${caption}.jpg`,
  category,
  contributor,
  source: "https://example.com",
})

// A fixture built to reproduce the mock's own query: Category Misc, one
// Contributor, term "wheel", where all three single drops are non-empty.
const CATALOGUE = [
  recording("Wheel Picker", "Sliders", "Enzo"),
  recording("Spin Wheel", "Misc", "Konstantinos"),
  recording("Ticket Stub", "Misc", "Enzo"),
  recording("Fluid Carousel", "Carousels", "Thomino"),
]

const MOCK_QUERY: ActiveFilters = {
  category: "Misc",
  contributor: "Enzo",
  search: "wheel",
}

const diagnose = (active: ActiveFilters, catalogue = CATALOGUE) =>
  catalogueDiagnosis(catalogue, active)

describe("catalogueDiagnosis", () => {
  it("returns null when nothing is filtered", () => {
    expect(diagnose({})).toBeNull()
    // An empty string is not a filter — that is what `?search=` in the URL is.
    expect(diagnose({ search: "", category: "" })).toBeNull()
  })

  it("prefers the Category on the mock's own query, and lists the rest", () => {
    const d = diagnose(MOCK_QUERY)!

    expect(d.keys).toEqual(["category", "contributor", "search"])
    // All three drops help here; the order is the whole rule, so Category wins.
    expect(d.dropped).toBe("category")
    expect(d.example?.caption).toBe("Wheel Picker")
    expect(d.example?.category).toBe("Sliders")
    expect(d.alternatives).toEqual(["contributor", "search"])
    expect(d.searchAll).toBe(true)
  })

  it("returns no alternatives when exactly one drop helps", () => {
    // Nobody by that name is in the catalogue at all, so dropping the Category
    // leaves nothing and dropping the Contributor is the only move. This is the
    // shape of /products?category=Buttons&contributor=zzzzz.
    const catalogue = [recording("Pressable", "Buttons", "Thomino")]
    const d = diagnose(
      { category: "Buttons", contributor: "zzzzz" },
      catalogue
    )!

    expect(d.dropped).toBe("contributor")
    expect(d.alternatives).toEqual([])
    expect(d.example?.caption).toBe("Pressable")
  })

  it("returns dropped: null when no single drop helps", () => {
    // Every pair of the three is empty: nothing is in Misc, nothing is by Enzo,
    // and nothing matches the term.
    const catalogue = [recording("Pressable", "Buttons", "Thomino")]
    const d = diagnose(MOCK_QUERY, catalogue)!

    expect(d.dropped).toBeNull()
    expect(d.example).toBeNull()
    expect(d.alternatives).toEqual([])
  })

  it("never offers a search that would also return zero", () => {
    const catalogue = [recording("Pressable", "Buttons", "Thomino")]
    expect(
      diagnose({ category: "Misc", search: "zzzzz" }, catalogue)!.searchAll
    ).toBe(false)
    // …nor when the term is the only filter, where the action would be the same
    // page again.
    expect(diagnose({ search: "wheel" })!.searchAll).toBe(false)
  })

  it("matches case-insensitively on the filter it keeps, as the server does", () => {
    // `misc`, not `Misc`. Dropping the Contributor has to leave the two Misc
    // Recordings; a case-sensitive predicate would leave none, and the panel
    // would say no single filter explains it.
    const d = diagnose({ category: "misc", contributor: "Nobody" })!

    expect(d.dropped).toBe("contributor")
    expect(d.example?.caption).toBe("Spin Wheel")
  })
})

describe("catalogueSentences", () => {
  const headline = (active: ActiveFilters, catalogue = CATALOGUE) =>
    catalogueSentences(active, diagnose(active, catalogue)!).headline

  it("writes all six headline forms", () => {
    expect(headline(MOCK_QUERY)).toBe(
      "Nothing in Misc by Enzo matches “wheel”."
    )
    expect(headline({ category: "Misc", search: "wheel" })).toBe(
      "Nothing in Misc matches “wheel”."
    )
    expect(headline({ contributor: "Enzo", search: "wheel" })).toBe(
      "Nothing by Enzo matches “wheel”."
    )
    expect(headline({ category: "Misc", contributor: "Enzo" })).toBe(
      "Nothing in Misc is by Enzo."
    )
    expect(headline({ search: "zzzzz" })).toBe(
      "Nothing in the catalogue matches “zzzzz”."
    )
    // Unreachable from the UI, because the rail is derived from the Recordings
    // present — but ?category=Nope is typeable, so it has a string rather than a
    // crash.
    expect(headline({ category: "Nope" })).toBe(
      "Nothing matches these filters."
    )
    expect(headline({ contributor: "Nobody" })).toBe(
      "Nothing matches these filters."
    )
  })

  it("uses the mock's own typographic quotes", () => {
    const line = headline({ search: "wheel" })
    expect(line).toContain("“")
    expect(line).toContain("”")
    expect(line).not.toContain('"')
  })

  it("writes the mock's second sentence word for word", () => {
    const d = diagnose(MOCK_QUERY)!
    expect(catalogueSentences(MOCK_QUERY, d).body).toBe(
      "Loosen one of the three. Wheel Picker is by this contributor, but it lives in Sliders — not Misc."
    )
  })

  it("qualifies by the strongest facet still applied", () => {
    // Contributor dropped, so the term is the strongest thing left.
    const active = { contributor: "Nobody", search: "wheel" }
    const d = diagnose(active)!
    expect(d.dropped).toBe("contributor")
    expect(catalogueSentences(active, d).body).toBe(
      "Loosen one of the two. Wheel Picker is a match for “wheel”, but it is by Enzo — not Nobody."
    )
  })

  it("says so when the term is what has to go", () => {
    const active = {
      category: "Carousels",
      contributor: "Thomino",
      search: "wheel",
    }
    const d = diagnose(active)!
    expect(d.dropped).toBe("search")
    expect(catalogueSentences(active, d).body).toBe(
      "Loosen one of the three. Fluid Carousel is by this contributor, but nothing there matches “wheel”."
    )
  })

  it("omits the second sentence entirely under a single filter", () => {
    expect(
      catalogueSentences({ search: "zzzzz" }, diagnose({ search: "zzzzz" })!)
        .body
    ).toBeNull()
  })

  it("says no single filter explains it when none does", () => {
    const catalogue = [recording("Pressable", "Buttons", "Thomino")]
    const d = diagnose(MOCK_QUERY, catalogue)!
    expect(catalogueSentences(MOCK_QUERY, d).body).toBe(
      "No single filter explains it — nothing matches any two of the three."
    )
  })
})

describe("catalogueActions", () => {
  const labels = (active: ActiveFilters, total = 277, catalogue = CATALOGUE) =>
    catalogueActions(active, diagnose(active, catalogue)!, total).map(
      (a) => a.label
    )

  it("offers all five on the mock's query, in order", () => {
    expect(labels(MOCK_QUERY)).toEqual([
      "Drop the category filter",
      "Drop the contributor filter",
      "Clear the search",
      "Search all 277 for “wheel”",
      "Clear all three",
    ])
    expect(
      catalogueActions(MOCK_QUERY, diagnose(MOCK_QUERY)!, 277).map(
        (a) => a.primary
      )
    ).toEqual([true, false, false, false, false])
  })

  it("offers exactly one action and no Clear all under a single filter", () => {
    expect(labels({ search: "zzzzz" })).toEqual(["Clear the search"])
    expect(labels({ category: "Nope" })).toEqual(["Drop the category filter"])
  })

  it("offers only Clear all when no single drop helps", () => {
    const catalogue = [recording("Pressable", "Buttons", "Thomino")]
    expect(labels(MOCK_QUERY, 277, catalogue)).toEqual(["Clear all three"])
  })

  // `dropped: null` and `searchAll: true` are independent: every pair of the
  // three can be empty while the term alone still matches. Offering the search
  // there would make "exactly one action" two.
  it("offers only Clear all even when the term alone would match", () => {
    // Thomino has nothing matching the term and nothing in Buttons, and no
    // Buttons Recording matches it either — but two Recordings do.
    const active = {
      category: "Buttons",
      contributor: "Thomino",
      search: "wheel",
    }
    const d = diagnose(active)!

    expect(d.dropped).toBeNull()
    expect(d.searchAll).toBe(true)
    expect(labels(active)).toEqual(["Clear all three"])
  })

  it("counts two rather than three when two are on", () => {
    expect(labels({ category: "Misc", contributor: "Nobody" })).toContain(
      "Clear all two"
    )
  })
})

describe("clearAllHref", () => {
  it("lands on /products when a facet was in force", () => {
    expect(clearAllHref("/products", ["category", "search"])).toBe("/products")
    expect(clearAllHref("/", ["contributor"])).toBe("/products")
  })

  it("keeps the route when only the term was", () => {
    expect(clearAllHref("/", ["search"])).toBe("/")
    expect(clearAllHref("/products", ["search"])).toBe("/products")
  })
})

// The one case against the real catalogue. The mock's sentence names Pickers;
// the data says Sliders. If the diagnosis is ever hard-coded again, this is
// what fails.
describe("the mock's own query, against the real catalogue", () => {
  const ACTIVE: ActiveFilters = {
    category: "Misc",
    contributor: "Enzo Manuel Mangano ( Reactiive )",
    search: "wheel",
  }

  it("names Wheel Picker, and its Category is whatever data/sliders.ts holds", () => {
    const d = catalogueDiagnosis(allRecordings, ACTIVE)!
    const stored = allRecordings.find((r) => r.caption === "Wheel Picker")!

    expect(d.dropped).toBe("category")
    expect(d.example?.caption).toBe("Wheel Picker")
    expect(d.example?.category).toBe(stored.category)
    expect(d.example?.category).not.toBe("Pickers")
    expect(d.alternatives).toEqual(["contributor", "search"])
  })

  it("writes the headline in the stored Contributor spelling", () => {
    const d = catalogueDiagnosis(allRecordings, ACTIVE)!
    expect(catalogueSentences(ACTIVE, d).headline).toBe(
      "Nothing in Misc by Enzo Manuel Mangano ( Reactiive ) matches “wheel”."
    )
  })
})
