import { describe, expect, it } from "vitest"

import { config as middlewareConfig } from "../middleware"
import { CATEGORIES, CATEGORY_NAMES, LEGACY_REDIRECTS } from "../data/categories"
import { allEntries } from "../data/catalogue"
import type { Entry } from "../data/entry"
import { demoPathFor, narrow, posterPathFor } from "../lib/asset-path"
import { ALL_ENTRIES } from "../lib/codex/entries"

// The category directory is lowercase with no spaces, and basenames avoid
// anything needing percent-encoding. A space survives the local filesystem
// and 404s or 403s at the CDN, which is how four Bottom Sheets demos ended
// up pointing at a directory that has never existed.
//
// These patterns restate what lib/asset-path.ts already knows, and are
// deliberately not imported from it: a test that takes its expectation from
// the code under test can no longer catch that code being wrong. Do not merge
// the two. See docs/adr/0005-the-data-test-states-the-asset-path-rules-independently.md.
const DEMO_PATH = /^demo\/[a-z0-9_-]+\/[A-Za-z0-9._-]+\.mp4$/
const POSTER_PATH = /^thumbnails\/[a-z0-9_-]+\/[A-Za-z0-9._-]+\.avif$/

describe("catalog data integrity", () => {
  it("has items", () => {
    expect(allEntries.length).toBeGreaterThan(0)
  })

  it("no duplicate IDs", () => {
    const ids = allEntries.map((entry) => entry.id)
    const unique = new Set(ids)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicates, `duplicate IDs: ${duplicates.join(", ")}`).toHaveLength(0)
    expect(unique.size).toBe(ids.length)
  })

  it("all entries have required fields", () => {
    const required = ["id", "caption", "demoPath", "posterPath", "author", "source", "category"] as const
    for (const entry of allEntries) {
      for (const field of required) {
        expect(entry[field], `${entry.id} missing field "${field}"`).toBeTruthy()
      }
    }
  })

  it("all source URLs match https?://", () => {
    const bad = allEntries.filter((entry) => !entry.source.match(/^https?:\/\//))
    expect(bad.map((b) => `${b.id}: ${b.source}`)).toHaveLength(0)
  })

  it("all IDs are non-empty strings", () => {
    const bad = allEntries.filter((entry) => typeof entry.id !== "string" || entry.id.trim() === "")
    expect(bad).toHaveLength(0)
  })
})

// Asset paths are immutable: a path identifies specific bytes, never a Demo.
// See docs/adr/0003-asset-paths-are-immutable.md. Published Assets are written
// once, cached for a year and never overwritten, so a duplicated or
// mis-encoded path cannot be corrected after upload — it has to be caught here.
describe("asset paths", () => {
  const duplicatesBy = (field: "demoPath" | "posterPath") => {
    const seen = new Map<string, string[]>()
    for (const entry of allEntries) {
      const path = entry[field]
      if (!path) continue
      seen.set(path, [...(seen.get(path) ?? []), entry.id])
    }
    return [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([path, ids]) => `${path} <- ${ids.join(", ")}`)
  }

  it("no two entries share a Demo path", () => {
    const dupes = duplicatesBy("demoPath")
    expect(dupes, `duplicate Demo paths:\n${dupes.join("\n")}`).toHaveLength(0)
  })

  it("no two entries share a Poster path", () => {
    const dupes = duplicatesBy("posterPath")
    expect(dupes, `duplicate Poster paths:\n${dupes.join("\n")}`).toHaveLength(0)
  })

  // macOS stores filenames decomposed (NFD) while these strings are composed
  // (NFC). macOS is normalization-insensitive so the mismatch is invisible
  // locally, but byte-exact object storage 404s on it. This previously broke
  // 16 assets whose author's name contained "ś".
  it("all asset paths are printable ASCII", () => {
    const bad = allEntries.flatMap((entry) =>
      [entry.demoPath, entry.posterPath]
        .filter((path) => path && !/^[\x20-\x7E]+$/.test(path))
        .map((path) => `${entry.id}: ${path}`)
    )
    expect(bad, `non-ASCII asset paths:\n${bad.join("\n")}`).toHaveLength(0)
  })

  it("all Demo paths are well-formed", () => {
    const bad = allEntries
      .filter((entry) => entry.demoPath && !DEMO_PATH.test(entry.demoPath))
      .map((entry) => `${entry.id}: ${entry.demoPath}`)
    expect(bad, `malformed Demo paths:\n${bad.join("\n")}`).toHaveLength(0)
  })

  it("all Poster paths are well-formed", () => {
    const bad = allEntries
      .filter((entry) => entry.posterPath && !POSTER_PATH.test(entry.posterPath))
      .map((entry) => `${entry.id}: ${entry.posterPath}`)
    expect(bad, `malformed Poster paths:\n${bad.join("\n")}`).toHaveLength(0)
  })
})

// The module that builds Asset paths, checked against the patterns above
// rather than against itself.
describe("asset path construction", () => {
  const base = "a_demo_by_someone"

  it.each(CATEGORY_NAMES)("builds a well-formed Demo path for %s", (name) => {
    expect(demoPathFor(name, base)).toMatch(DEMO_PATH)
  })

  it.each(CATEGORY_NAMES)("derives a well-formed Poster path for %s", (name) => {
    expect(posterPathFor(demoPathFor(name, base))).toMatch(POSTER_PATH)
  })

  it("a Poster differs from its Demo only in prefix and extension", () => {
    expect(posterPathFor("demo/buttons/split_button_hewad_mubariz.mp4")).toBe(
      "thumbnails/buttons/split_button_hewad_mubariz.avif"
    )
  })

  it("refuses to derive a Poster from anything that is not a Demo path", () => {
    expect(() => posterPathFor("thumbnails/buttons/split_button.avif")).toThrow()
    expect(() => posterPathFor("demo/buttons/split_button.mov")).toThrow()
  })

  // Every Entry in the catalogue already obeys the derivation, so a new one
  // that does not is a hand-typed path rather than a generated one.
  it("every Entry's Poster path is the derivation of its Demo path", () => {
    const bad = allEntries
      .filter((entry) => entry.demoPath && entry.posterPath && posterPathFor(entry.demoPath) !== entry.posterPath)
      .map((entry) => `${entry.id}: ${entry.posterPath} — expected ${posterPathFor(entry.demoPath)}`)
    expect(bad, `Poster paths that are not derived from their Demo:\n${bad.join("\n")}`).toHaveLength(0)
  })
})

// Which Assets a narrowed publish run touches. A pure function since ticket 04:
// the publish tool resolves the list here and hands it to the codec checker, so
// there is no second derivation left to disagree with it.
describe("narrowing a set of Asset paths", () => {
  const paths = [
    "demo/buttons/one.mp4",
    "demo/misc/two.mp4",
    "thumbnails/buttons/one.avif",
    "thumbnails/misc/two.avif",
  ]

  it("selects everything when no fragment is given", () => {
    expect(narrow(paths, [])).toEqual([
      "demo/buttons/one.mp4",
      "demo/misc/two.mp4",
      "thumbnails/buttons/one.avif",
      "thumbnails/misc/two.avif",
    ])
  })

  // The publish tool sorts what it gets back, and what it passes in is the
  // catalogue's own exported array.
  it("does not hand back the array it was given", () => {
    expect(narrow(paths, [])).not.toBe(paths)
  })

  it("selects both the Demo and the Poster directory of a Category", () => {
    expect(narrow(paths, ["misc"])).toEqual(["demo/misc/two.mp4", "thumbnails/misc/two.avif"])
  })

  it("selects the union of several fragments", () => {
    expect(narrow(paths, ["misc", "buttons"])).toEqual(paths)
  })

  it("selects nothing when no path matches", () => {
    expect(narrow(paths, ["sliders"])).toEqual([])
  })
})

// The two lists a table cannot generate, because the framework requires both
// be written out statically: the catalogue merge and the middleware matcher.
// Forget the merge and the Category's Entries vanish from the site with no
// error, no warning and nothing failing. These are the tests that make the
// silent failure loud.
describe("catalogue wiring", () => {
  const merged = new Set(allEntries.map((entry) => entry.id))

  it.each(CATEGORY_NAMES)("every Entry in %s reaches the merged catalogue", async (name) => {
    const row = CATEGORIES[name]
    const file = (await import(`../data/${row.file}.ts`)) as Record<string, Entry[] | undefined>
    const entries = file[row.exportName]

    expect(entries, `data/${row.file}.ts exports no "${row.exportName}"`).toBeDefined()

    // An empty Category is legal: a row may exist before its first Entry does.
    const missing = (entries ?? []).filter((entry) => !merged.has(entry.id)).map((entry) => entry.id)
    expect(
      missing,
      `${name}: ${missing.length} Entries in data/${row.file}.ts never reached data/catalogue.ts — ${missing.join(", ")}`
    ).toHaveLength(0)
  })

  // The same eighteen-way merge exists a second time in lib/codex/entries.ts.
  // A Category added to one and not the other is the same silent failure as
  // forgetting a merge line: the whole suite passes while that Category's
  // Entries are unreachable from search. Why the two are pinned rather than
  // collapsed is in the header of lib/codex/entries.ts.
  it("the search merge holds exactly the Entries the catalogue does", () => {
    const inSearchMerge = new Set(ALL_ENTRIES.map((entry) => entry.id))
    const missingFromSearch = [...merged].filter((id) => !inSearchMerge.has(id))
    const missingFromCatalogue = [...inSearchMerge].filter((id) => !merged.has(id))
    const bad = [...missingFromSearch, ...missingFromCatalogue]
    expect(
      bad,
      [
        `${missingFromSearch.length} Entries in data/catalogue.ts never reached lib/codex/entries.ts — ${missingFromSearch.join(", ")}`,
        `${missingFromCatalogue.length} Entries in lib/codex/entries.ts never reached data/catalogue.ts — ${missingFromCatalogue.join(", ")}`,
      ].join("; ")
    ).toHaveLength(0)
  })

  // The redirect map is generated from the table; the matcher beside it cannot
  // be, so it is checked here instead. See the comment in middleware.ts.
  it("the middleware matcher lists exactly the table's legacy paths", () => {
    expect([...middlewareConfig.matcher].sort()).toEqual(Object.keys(LEGACY_REDIRECTS).sort())
  })
})
