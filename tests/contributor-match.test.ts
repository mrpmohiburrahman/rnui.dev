import { describe, expect, it } from "vitest"

import {
  canonicaliseContributor,
  existingContributor,
  foldContributorName,
  suggestContributors,
} from "../lib/contributor-match"

// Ticket 13. The rule under test is ADR-0009: a Contributor's identity is the
// name string, and two spellings differing only in letter case, surrounding or
// repeated spaces, or Unicode encoding form name the SAME Contributor.
//
// Every name below is invented. This repo is public and the real 23 are the
// catalogue's own data, which the assertions in tests/recording-counts.test.ts
// already pin where they belong.

const NAMES = [
  "Alireza Hadjar",
  "Daehyeon Mun (문대현)",
  "Jane Doe",
  "Janet Doering",
  "Pushkar Tandon",
  "Zakaria Kerkeb",
]

describe("foldContributorName", () => {
  it("ignores case, surrounding space and repeated space", () => {
    expect(foldContributorName("  jane   DOE ")).toBe(
      foldContributorName("Jane Doe")
    )
  })

  // The one that is invisible in every editor: `é` as one code point and as `e`
  // plus a combining acute are different bytes and the same name.
  it("ignores how an accented character is encoded", () => {
    expect(foldContributorName("Enes O\u0308ztu\u0308rk")).toBe(
      foldContributorName("Enes \u00d6zt\u00fcrk")
    )
  })

  // Deliberately NOT stripped. A rule that merges 22 of 23 names correctly and
  // the 23rd silently is worse than no rule — see app/contributors/page.tsx.
  it("keeps a non-Latin name intact rather than dropping it", () => {
    expect(foldContributorName("Daehyeon Mun (문대현)")).toContain("문대현")
  })
})

describe("existingContributor", () => {
  it("returns the catalogue's own spelling for a differently-typed name", () => {
    expect(existingContributor("  jane   doe  ", NAMES)).toBe("Jane Doe")
  })

  it("returns null for a name the catalogue does not have", () => {
    expect(existingContributor("Jane Does", NAMES)).toBeNull()
    expect(existingContributor("", NAMES)).toBeNull()
  })

  // A near-match is a different person, not the same one badly spelled.
  it("does not match a name that merely starts the same", () => {
    expect(existingContributor("Janet", NAMES)).toBeNull()
  })
})

describe("suggestContributors", () => {
  it("offers nothing until something is typed", () => {
    expect(suggestContributors("", NAMES)).toEqual([])
    expect(suggestContributors("   ", NAMES)).toEqual([])
  })

  it("matches on a prefix, case- and space-insensitively", () => {
    expect(suggestContributors("jane", NAMES)).toEqual([
      "Jane Doe",
      "Janet Doering",
    ])
  })

  it("ranks prefix matches before matches inside the name", () => {
    // "Alireza Hadjar" contains "ja" without starting with it, and it sorts
    // first alphabetically — so the order below is the ranking, not the input's.
    expect(suggestContributors("ja", NAMES)).toEqual([
      "Jane Doe",
      "Janet Doering",
      "Alireza Hadjar",
    ])
  })

  it("caps the rows it offers", () => {
    expect(suggestContributors("a", NAMES, 2)).toHaveLength(2)
    expect(suggestContributors("a", NAMES).length).toBeLessThanOrEqual(6)
  })

  it("offers nothing for a name nobody has", () => {
    expect(suggestContributors("qqqq", NAMES)).toEqual([])
  })
})

describe("canonicaliseContributor", () => {
  // The whole of ADR-0009's "folding never reaches storage": what is sent is a
  // string the catalogue already holds, character for character.
  it("adopts the existing spelling rather than the typed one", () => {
    expect(canonicaliseContributor("JANE DOE", NAMES)).toBe("Jane Doe")
  })

  // A new Contributor keeps their own words. Whitespace is tidied and nothing
  // else: no case folding, no accent stripping, no slug.
  it("tidies whitespace for a new name and changes nothing else", () => {
    expect(canonicaliseContributor("  Obi-Wan   Kenobi ", NAMES)).toBe(
      "Obi-Wan Kenobi"
    )
    expect(canonicaliseContributor("Daehyeon Mun (문대현)", NAMES)).toBe(
      "Daehyeon Mun (문대현)"
    )
  })

  it("is idempotent, because the endpoint runs it a second time", () => {
    const once = canonicaliseContributor("  jane  doe ", NAMES)
    expect(canonicaliseContributor(once, NAMES)).toBe(once)
  })
})
