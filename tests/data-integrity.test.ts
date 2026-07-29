import { describe, expect, it } from "vitest"

import { config as middlewareConfig } from "../middleware"
import { CATEGORIES, CATEGORY_NAMES, LEGACY_REDIRECTS } from "../data/categories"
import { allEntries } from "../data/catalogue"
import type { Entry } from "../data/entry"

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

  // The category directory is lowercase with no spaces, and basenames avoid
  // anything needing percent-encoding. A space survives the local filesystem
  // and 404s or 403s at the CDN, which is how four Bottom Sheets demos ended
  // up pointing at a directory that has never existed.
  const DEMO_PATH = /^demo\/[a-z0-9_-]+\/[A-Za-z0-9._-]+\.mp4$/
  const POSTER_PATH = /^thumbnails\/[a-z0-9_-]+\/[A-Za-z0-9._-]+\.avif$/

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

  // The redirect map is generated from the table; the matcher beside it cannot
  // be, so it is checked here instead. See the comment in middleware.ts.
  it("the middleware matcher lists exactly the table's legacy paths", () => {
    expect([...middlewareConfig.matcher].sort()).toEqual(Object.keys(LEGACY_REDIRECTS).sort())
  })
})
