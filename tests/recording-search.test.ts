import { describe, expect, it } from "vitest"

import { allRecordings } from "../data/catalogue"
import { CATEGORY_NAMES } from "../data/categories"
import type { Recording } from "../data/recording"
import { matchesSearchTerm } from "../lib/recording-search"

// The search box rotates the Category display names as its placeholder
// suggestions, and fourteen of the eighteen returned nothing when typed: the filter
// tested the caption and only the caption, and a caption averages 2.31 words and
// never contains its own Category name.
//
// These assertions iterate the Category table and the Contributors present in the
// catalogue rather than naming cases, so a Category added later is covered the day
// it lands and forgetting to extend this test is not possible.

const find = (term: string) =>
  allRecordings.filter((recording) => matchesSearchTerm(recording, term))

/** The rule this replaced, kept only to measure against. */
const captionOnly = (recording: Recording, term: string) =>
  recording.caption.toLowerCase().includes(term.toLowerCase())

describe("every Category display name is findable", () => {
  for (const category of CATEGORY_NAMES) {
    const inCategory = allRecordings.filter(
      (recording) => recording.category === category
    )

    it(`finds every Recording in ${category}`, () => {
      for (const recording of inCategory) {
        expect(
          matchesSearchTerm(recording, category),
          `${recording.id} is in ${category} but typing "${category}" does not find it`
        ).toBe(true)
      }
    })

    // A Category may have a row before it has its first Recording, so the non-empty
    // claim is only made about Categories that have Recordings at all.
    if (inCategory.length > 0) {
      it(`returns a non-empty result for ${category}`, () => {
        expect(find(category).length).toBeGreaterThan(0)
      })
    }
  }
})

describe("every Contributor in the catalogue is findable", () => {
  const contributors = Array.from(
    new Set(allRecordings.map((recording) => recording.contributor))
  )

  it("has more than one Contributor to check", () => {
    // Guards the loop below against passing vacuously.
    expect(contributors.length).toBeGreaterThan(1)
  })

  for (const contributor of contributors) {
    it(`returns a non-empty result for ${contributor}`, () => {
      expect(find(contributor).length).toBeGreaterThan(0)
    })
  }
})

describe("matchesSearchTerm", () => {
  it("requires every word, and takes each from any of the three fields", () => {
    const recording = allRecordings[0]
    const categoryWord = recording.category.split(/\s+/)[0]
    const contributorWord = recording.contributor.split(/\s+/)[0]

    expect(
      matchesSearchTerm(recording, `${categoryWord} ${contributorWord}`)
    ).toBe(true)
  })

  it("rejects a term with one word that appears nowhere", () => {
    const recording = allRecordings[0]
    expect(
      matchesSearchTerm(recording, `${recording.contributor} zzzznotinanyfield`)
    ).toBe(false)
  })

  it("finds more for a multi-word Category term than the caption-only rule did", () => {
    // The reported symptom: "tab bar" matched three captions. Asserted as a
    // comparison rather than as counts, which drift as the catalogue grows.
    const term = "tab bar"
    const before = allRecordings.filter((recording) =>
      captionOnly(recording, term)
    ).length
    expect(find(term).length).toBeGreaterThan(before)
  })

  it("does not let one word span two fields", () => {
    // The fields are joined before the substring test, so the separator has to be
    // something no typed word can contain. Joined with a space, a Recording whose
    // caption ended "split" and whose contributor began "button" would answer to
    // "split button" — but also, with a naive join, to "splitbutton".
    const recording: Recording = {
      ...allRecordings[0],
      caption: "a slider that goes split",
      contributor: "button Person",
    }

    expect(matchesSearchTerm(recording, "split button")).toBe(true)
    expect(matchesSearchTerm(recording, "splitbutton")).toBe(false)
  })

  it("is case-insensitive", () => {
    const category = CATEGORY_NAMES[0]
    expect(find(category.toUpperCase()).length).toBe(find(category).length)
    expect(find(category.toLowerCase()).length).toBe(find(category).length)
  })

  it("returns every Recording for an empty or whitespace-only term", () => {
    expect(find("").length).toBe(allRecordings.length)
    expect(find("   ").length).toBe(allRecordings.length)
    expect(find("\t\n ").length).toBe(allRecordings.length)
  })
})
