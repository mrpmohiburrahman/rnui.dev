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
  it("counts 23 contributors, the whole catalogue again", () => {
    expect(Object.keys(RECORDINGS_PER_CONTRIBUTOR)).toHaveLength(23)
    expect(
      RECORDINGS_PER_CONTRIBUTOR["Enzo Manuel Mangano ( Reactiive )"]
    ).toBe(124)
    expect(RECORDINGS_PER_CONTRIBUTOR["Hewad Mubariz"]).toBe(31)

    // 23 and not the mock's 24, and this is the entry that makes the
    // difference: `data/fullapps.ts` used to spell this name with a trailing
    // space, so one person was counted as two — 2 here and 1 under a key that
    // rendered identically. Ticket 10 removed the space; the guard against it
    // coming back is in tests/data-integrity.test.ts.
    expect(RECORDINGS_PER_CONTRIBUTOR["Pushkar Tandon"]).toBe(3)
    expect(RECORDINGS_PER_CONTRIBUTOR["Pushkar Tandon "]).toBeUndefined()
  })
})

describe("contributorsByCount", () => {
  // The whole ranked list, not the top four: /contributors draws every row of
  // it in this order, so this is the statement of what that page must show and
  // the e2e spec is left to prove the page agrees with it rather than to
  // re-pin twenty-three numbers in a browser.
  it("ranks count-descending, breaking ties with localeCompare", () => {
    const ranked = contributorsByCount()

    expect(ranked).toEqual([
      { name: "Enzo Manuel Mangano ( Reactiive )", count: 124 },
      { name: "Hewad Mubariz", count: 31 },
      { name: "Daniel Friyia", count: 19 },
      { name: "Arunabh Verma", count: 16 },
      { name: "Konstantinos Efkarpidis", count: 11 },
      { name: "William Candillon", count: 10 },
      // The two 8s are the tie to break: Alireza sorts before Kacper, so the
      // ranked list is stable when the data changes.
      { name: "Alireza Hadjar", count: 8 },
      { name: "Kacper Kapuściak", count: 8 },
      { name: "Thomino", count: 7 },
      { name: "Aashu Dubey", count: 6 },
      { name: "Alek Mikucki", count: 6 },
      { name: "Aswin C", count: 5 },
      { name: "Daehyeon Mun (문대현)", count: 4 },
      { name: "Andreev Danila", count: 3 },
      { name: "Lucas Lima", count: 3 },
      { name: "Pushkar Tandon", count: 3 },
      { name: "Yassire Mtioui", count: 3 },
      { name: "Arnaud Dellinger ( evening kid )", count: 2 },
      { name: "Enes Öztürk", count: 2 },
      { name: "Epicode | 0xV", count: 2 },
      { name: "Zakaria Kerkeb", count: 2 },
      { name: "Hubert Ryan", count: 1 },
      { name: "Wahab Balogun", count: 1 },
    ])

    expect(ranked.reduce((sum, c) => sum + c.count, 0)).toBe(277)
  })
})
