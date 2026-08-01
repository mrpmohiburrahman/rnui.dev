import { describe, expect, it } from "vitest"

import { allEntries } from "../data/catalogue"
import { CATEGORY_NAMES } from "../data/categories"
import type { Entry } from "../data/entry"
import { matchesSearchTerm } from "../lib/entry-search"

// The search box rotates the Category display names as its placeholder
// suggestions, and fourteen of the eighteen returned nothing when typed: the filter
// tested the caption and only the caption, and a caption averages 2.31 words and
// never contains its own Category name.
//
// These assertions iterate the Category table and the Authors present in the
// catalogue rather than naming cases, so a Category added later is covered the day
// it lands and forgetting to extend this test is not possible.

const find = (term: string) =>
  allEntries.filter((entry) => matchesSearchTerm(entry, term))

/** The rule this replaced, kept only to measure against. */
const captionOnly = (entry: Entry, term: string) =>
  entry.caption.toLowerCase().includes(term.toLowerCase())

describe("every Category display name is findable", () => {
  for (const category of CATEGORY_NAMES) {
    const inCategory = allEntries.filter((entry) => entry.category === category)

    it(`finds every Entry in ${category}`, () => {
      for (const entry of inCategory) {
        expect(
          matchesSearchTerm(entry, category),
          `${entry.id} is in ${category} but typing "${category}" does not find it`
        ).toBe(true)
      }
    })

    // A Category may have a row before it has its first Entry, so the non-empty
    // claim is only made about Categories that have Entries at all.
    if (inCategory.length > 0) {
      it(`returns a non-empty result for ${category}`, () => {
        expect(find(category).length).toBeGreaterThan(0)
      })
    }
  }
})

describe("every Author in the catalogue is findable", () => {
  const authors = Array.from(new Set(allEntries.map((entry) => entry.author)))

  it("has more than one Author to check", () => {
    // Guards the loop below against passing vacuously.
    expect(authors.length).toBeGreaterThan(1)
  })

  for (const author of authors) {
    it(`returns a non-empty result for ${author}`, () => {
      expect(find(author).length).toBeGreaterThan(0)
    })
  }
})

describe("matchesSearchTerm", () => {
  it("requires every word, and takes each from any of the three fields", () => {
    const entry = allEntries[0]
    const categoryWord = entry.category.split(/\s+/)[0]
    const authorWord = entry.author.split(/\s+/)[0]

    expect(matchesSearchTerm(entry, `${categoryWord} ${authorWord}`)).toBe(true)
  })

  it("rejects a term with one word that appears nowhere", () => {
    const entry = allEntries[0]
    expect(
      matchesSearchTerm(entry, `${entry.author} zzzznotinanyfield`)
    ).toBe(false)
  })

  it("finds more for a multi-word Category term than the caption-only rule did", () => {
    // The reported symptom: "tab bar" matched three captions. Asserted as a
    // comparison rather than as counts, which drift as the catalogue grows.
    const term = "tab bar"
    const before = allEntries.filter((entry) => captionOnly(entry, term)).length
    expect(find(term).length).toBeGreaterThan(before)
  })

  it("does not let one word span two fields", () => {
    // The fields are joined before the substring test, so the separator has to be
    // something no typed word can contain. Joined with a space, an Entry whose
    // caption ended "split" and whose author began "button" would answer to
    // "split button" — but also, with a naive join, to "splitbutton".
    const entry: Entry = {
      ...allEntries[0],
      caption: "a slider that goes split",
      author: "button Person",
    }

    expect(matchesSearchTerm(entry, "split button")).toBe(true)
    expect(matchesSearchTerm(entry, "splitbutton")).toBe(false)
  })

  it("is case-insensitive", () => {
    const category = CATEGORY_NAMES[0]
    expect(find(category.toUpperCase()).length).toBe(find(category).length)
    expect(find(category.toLowerCase()).length).toBe(find(category).length)
  })

  it("returns every Entry for an empty or whitespace-only term", () => {
    expect(find("").length).toBe(allEntries.length)
    expect(find("   ").length).toBe(allEntries.length)
    expect(find("\t\n ").length).toBe(allEntries.length)
  })
})
