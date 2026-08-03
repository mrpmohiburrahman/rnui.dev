import { describe, expect, it } from "vitest"

import {
  contributorsByCount,
  RECORDINGS_PER_CATEGORY,
  RECORDINGS_PER_CONTRIBUTOR,
} from "../data/recording"

// The rail's numbers, pinned by hand and not computed from allRecordings: a test
// that took its expectation from the thing under test could no longer catch that
// thing being wrong (the arrangement ADR-0005 exists for). These are the values
// ticket 05's acceptance states — the counts are of the whole catalogue and never
// move with the query, and the Contributor order is count-descending with a
// localeCompare tie-break, so the four the rail shows stay the four with the most.

describe("RECORDINGS_PER_CATEGORY", () => {
  it("counts the whole catalogue, per Category, summing to 277", () => {
    expect(RECORDINGS_PER_CATEGORY).toEqual({
      Accordions: 2,
      "Arc Sliders": 2,
      "Bottom Sheets": 6,
      Buttons: 20,
      Carousels: 10,
      Charts: 9,
      "Circular Progress Bars": 3,
      "Drop Down": 1,
      "Full Apps": 5,
      Headers: 3,
      List: 17,
      Loaders: 4,
      Misc: 148,
      Onboarding: 6,
      Parallaxes: 4,
      Pickers: 1,
      Sliders: 17,
      "Tab bars": 19,
    })

    const total = Object.values(RECORDINGS_PER_CATEGORY).reduce(
      (sum, count) => sum + count,
      0
    )
    expect(total).toBe(277)
  })
})

describe("RECORDINGS_PER_CONTRIBUTOR", () => {
  it("counts 24 contributors, the whole catalogue again", () => {
    expect(Object.keys(RECORDINGS_PER_CONTRIBUTOR)).toHaveLength(24)
    expect(
      RECORDINGS_PER_CONTRIBUTOR["Enzo Manuel Mangano ( Reactiive )"]
    ).toBe(124)
    expect(RECORDINGS_PER_CONTRIBUTOR["Hewad Mubariz"]).toBe(31)
  })
})

describe("contributorsByCount", () => {
  it("ranks count-descending, breaking ties with localeCompare", () => {
    const ranked = contributorsByCount()

    expect(ranked[0]).toEqual({
      name: "Enzo Manuel Mangano ( Reactiive )",
      count: 124,
    })
    expect(ranked[1]).toEqual({ name: "Hewad Mubariz", count: 31 })
    expect(ranked[2]).toEqual({ name: "Daniel Friyia", count: 19 })
    expect(ranked[3]).toEqual({ name: "Arunabh Verma", count: 16 })
    expect(ranked).toHaveLength(24)

    // The two 8s are the tie to break: Alireza sorts before Kacper, so the
    // ranked list is stable when the data changes.
    const eights = ranked.filter((c) => c.count === 8).map((c) => c.name)
    expect(eights).toEqual(["Alireza Hadjar", "Kacper Kapuściak"])
  })
})
