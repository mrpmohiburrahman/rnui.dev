import { describe, expect, it } from "vitest"

import { allRecordings } from "../data/catalogue"
import {
  CATEGORIES,
  CATEGORY_NAMES,
  LEGACY_REDIRECTS,
} from "../data/categories"
import type { Recording } from "../data/recording"
import { demoPathFor, narrow, posterPathFor } from "../lib/asset-path"
import { config as middlewareConfig } from "../middleware"

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
    expect(allRecordings.length).toBeGreaterThan(0)
  })

  it("no duplicate IDs", () => {
    const ids = allRecordings.map((recording) => recording.id)
    const unique = new Set(ids)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicates, `duplicate IDs: ${duplicates.join(", ")}`).toHaveLength(
      0
    )
    expect(unique.size).toBe(ids.length)
  })

  it("all recordings have required fields", () => {
    const required = [
      "id",
      "caption",
      "demoPath",
      "posterPath",
      "contributor",
      "source",
      "category",
    ] as const
    for (const recording of allRecordings) {
      for (const field of required) {
        expect(
          recording[field],
          `${recording.id} missing field "${field}"`
        ).toBeTruthy()
      }
    }
  })

  // A Contributor's identity is the exact string in this field: it is the key
  // RECORDINGS_PER_CONTRIBUTOR counts under, the value `?contributor=` filters
  // on, and the text /contributors draws a row from. So `"Pushkar Tandon "` and
  // `"Pushkar Tandon"` are two people to every one of them — one person, two
  // rows, two addresses, two counts. Invisible in the data and invisible on the
  // rail, which shows the top four; the directory is the surface that prints
  // the lie. Guarded here rather than by trimming in the three derivations,
  // because a fourth reader would need a fourth trim (ADR-0005).
  it("no contributor name carries leading or trailing whitespace", () => {
    const padded = allRecordings
      .filter((recording) => recording.contributor !== recording.contributor.trim())
      .map((recording) => `${recording.id}: "${recording.contributor}"`)
    expect(
      padded,
      `contributor names with surrounding whitespace:\n${padded.join("\n")}`
    ).toHaveLength(0)
  })

  it("all source URLs match https?://", () => {
    const bad = allRecordings.filter(
      (recording) => !recording.source.match(/^https?:\/\//)
    )
    expect(bad.map((b) => `${b.id}: ${b.source}`)).toHaveLength(0)
  })

  it("all IDs are non-empty strings", () => {
    const bad = allRecordings.filter(
      (recording) =>
        typeof recording.id !== "string" || recording.id.trim() === ""
    )
    expect(bad).toHaveLength(0)
  })
})

// The three fields `pnpm assets:measure` writes. Absent is legal — a Recording
// that has not been measured yet has none — but where a field is present it has
// to be sane: this is what catches a write-back that landed a value in the
// wrong object, or a hue formula that regressed.
describe("measured fields", () => {
  it("where present, durationMs, aspect and hue are in range", () => {
    const bad = allRecordings.flatMap((recording) => {
      const problems: string[] = []
      if (
        recording.durationMs !== undefined &&
        (!Number.isInteger(recording.durationMs) || recording.durationMs <= 0)
      ) {
        problems.push(
          `durationMs ${recording.durationMs} is not a positive integer`
        )
      }
      if (
        recording.aspect !== undefined &&
        (recording.aspect < 0.2 || recording.aspect > 5)
      ) {
        problems.push(`aspect ${recording.aspect} is outside [0.2, 5]`)
      }
      if (
        recording.hue !== undefined &&
        (!Number.isInteger(recording.hue) ||
          recording.hue < 0 ||
          recording.hue >= 360)
      ) {
        problems.push(`hue ${recording.hue} is outside [0, 360)`)
      }
      return problems.map((problem) => `${recording.id}: ${problem}`)
    })
    expect(
      bad,
      `out-of-range measured fields:\n${bad.join("\n")}`
    ).toHaveLength(0)
  })
})

// Asset paths are immutable: a path identifies specific bytes, never a Demo.
// See docs/adr/0003-asset-paths-are-immutable.md. Published Assets are written
// once, cached for a year and never overwritten, so a duplicated or
// mis-encoded path cannot be corrected after upload — it has to be caught here.
describe("asset paths", () => {
  const duplicatesBy = (field: "demoPath" | "posterPath") => {
    const seen = new Map<string, string[]>()
    for (const recording of allRecordings) {
      const path = recording[field]
      if (!path) continue
      seen.set(path, [...(seen.get(path) ?? []), recording.id])
    }
    return [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([path, ids]) => `${path} <- ${ids.join(", ")}`)
  }

  it("no two recordings share a Demo path", () => {
    const dupes = duplicatesBy("demoPath")
    expect(dupes, `duplicate Demo paths:\n${dupes.join("\n")}`).toHaveLength(0)
  })

  it("no two recordings share a Poster path", () => {
    const dupes = duplicatesBy("posterPath")
    expect(dupes, `duplicate Poster paths:\n${dupes.join("\n")}`).toHaveLength(
      0
    )
  })

  // macOS stores filenames decomposed (NFD) while these strings are composed
  // (NFC). macOS is normalization-insensitive so the mismatch is invisible
  // locally, but byte-exact object storage 404s on it. This previously broke
  // 16 assets whose contributor's name contained "ś".
  it("all asset paths are printable ASCII", () => {
    const bad = allRecordings.flatMap((recording) =>
      [recording.demoPath, recording.posterPath]
        .filter((path) => path && !/^[\x20-\x7E]+$/.test(path))
        .map((path) => `${recording.id}: ${path}`)
    )
    expect(bad, `non-ASCII asset paths:\n${bad.join("\n")}`).toHaveLength(0)
  })

  it("all Demo paths are well-formed", () => {
    const bad = allRecordings
      .filter(
        (recording) => recording.demoPath && !DEMO_PATH.test(recording.demoPath)
      )
      .map((recording) => `${recording.id}: ${recording.demoPath}`)
    expect(bad, `malformed Demo paths:\n${bad.join("\n")}`).toHaveLength(0)
  })

  it("all Poster paths are well-formed", () => {
    const bad = allRecordings
      .filter(
        (recording) =>
          recording.posterPath && !POSTER_PATH.test(recording.posterPath)
      )
      .map((recording) => `${recording.id}: ${recording.posterPath}`)
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

  it.each(CATEGORY_NAMES)(
    "derives a well-formed Poster path for %s",
    (name) => {
      expect(posterPathFor(demoPathFor(name, base))).toMatch(POSTER_PATH)
    }
  )

  it("a Poster differs from its Demo only in prefix and extension", () => {
    expect(posterPathFor("demo/buttons/split_button_hewad_mubariz.mp4")).toBe(
      "thumbnails/buttons/split_button_hewad_mubariz.avif"
    )
  })

  it("refuses to derive a Poster from anything that is not a Demo path", () => {
    expect(() =>
      posterPathFor("thumbnails/buttons/split_button.avif")
    ).toThrow()
    expect(() => posterPathFor("demo/buttons/split_button.mov")).toThrow()
  })

  // Every Recording in the catalogue already obeys the derivation, so a new one
  // that does not is a hand-typed path rather than a generated one.
  it("every Recording's Poster path is the derivation of its Demo path", () => {
    const bad = allRecordings
      .filter(
        (recording) =>
          recording.demoPath &&
          recording.posterPath &&
          posterPathFor(recording.demoPath) !== recording.posterPath
      )
      .map(
        (recording) =>
          `${recording.id}: ${recording.posterPath} — expected ${posterPathFor(recording.demoPath)}`
      )
    expect(
      bad,
      `Poster paths that are not derived from their Demo:\n${bad.join("\n")}`
    ).toHaveLength(0)
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
    expect(narrow(paths, ["misc"])).toEqual([
      "demo/misc/two.mp4",
      "thumbnails/misc/two.avif",
    ])
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
// Forget the merge and the Category's Recordings vanish from the site with no
// error, no warning and nothing failing. These are the tests that make the
// silent failure loud.
describe("catalogue wiring", () => {
  const merged = new Set(allRecordings.map((recording) => recording.id))

  it.each(CATEGORY_NAMES)(
    "every Recording in %s reaches the merged catalogue",
    async (name) => {
      const row = CATEGORIES[name]
      const file = (await import(`../data/${row.file}.ts`)) as Record<
        string,
        Recording[] | undefined
      >
      const recordings = file[row.exportName]

      expect(
        recordings,
        `data/${row.file}.ts exports no "${row.exportName}"`
      ).toBeDefined()

      // An empty Category is legal: a row may exist before its first Recording does.
      const missing = (recordings ?? [])
        .filter((recording) => !merged.has(recording.id))
        .map((recording) => recording.id)
      expect(
        missing,
        `${name}: ${missing.length} Recordings in data/${row.file}.ts never reached data/catalogue.ts — ${missing.join(", ")}`
      ).toHaveLength(0)
    }
  )

  // The redirect map is generated from the table; the matcher beside it cannot
  // be, so it is checked here instead. See the comment in middleware.ts.
  it("the middleware matcher lists exactly the table's legacy paths", () => {
    expect([...middlewareConfig.matcher].sort()).toEqual(
      Object.keys(LEGACY_REDIRECTS).sort()
    )
  })
})
