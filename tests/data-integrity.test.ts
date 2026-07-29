import { describe, expect, it } from "vitest"

import { accordions } from "../data/accordions"
import { arcsliders } from "../data/arcsliders"
import { bottomsheets } from "../data/bottomsheets"
import { buttons } from "../data/buttons"
import { carousels } from "../data/carousels"
import { charts } from "../data/charts"
import { circular_progress_bars } from "../data/circular-progress-bars"
import { drop_down } from "../data/dropdowns"
import { full_apps } from "../data/fullapps"
import { headers } from "../data/headers"
import { list } from "../data/lists"
import { loaders } from "../data/loaders"
import { misc } from "../data/misc"
import { onboarding } from "../data/onboardings"
import { parallaxes } from "../data/parallaxes"
import { pickers } from "../data/pickers"
import { sliders } from "../data/sliders"
import { tabbars } from "../data/tabbars"

const allItems = [
  ...accordions,
  ...arcsliders,
  ...bottomsheets,
  ...buttons,
  ...carousels,
  ...charts,
  ...circular_progress_bars,
  ...drop_down,
  ...full_apps,
  ...headers,
  ...list,
  ...loaders,
  ...misc,
  ...onboarding,
  ...parallaxes,
  ...pickers,
  ...sliders,
  ...tabbars,
]

describe("catalog data integrity", () => {
  it("has items", () => {
    expect(allItems.length).toBeGreaterThan(0)
  })

  it("no duplicate IDs", () => {
    const ids = allItems.map((item) => item.id)
    const unique = new Set(ids)
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(duplicates, `duplicate IDs: ${duplicates.join(", ")}`).toHaveLength(0)
    expect(unique.size).toBe(ids.length)
  })

  it("all entries have required fields", () => {
    const required = ["id", "caption", "videoSrc", "thumbnailSrc", "author", "source", "category"] as const
    for (const item of allItems) {
      for (const field of required) {
        expect(item[field], `${item.id} missing field "${field}"`).toBeTruthy()
      }
    }
  })

  it("all source URLs match https?://", () => {
    const bad = allItems.filter((item) => !item.source.match(/^https?:\/\//))
    expect(bad.map((b) => `${b.id}: ${b.source}`)).toHaveLength(0)
  })

  it("all IDs are non-empty strings", () => {
    const bad = allItems.filter((item) => typeof item.id !== "string" || item.id.trim() === "")
    expect(bad).toHaveLength(0)
  })
})

// Asset paths are immutable: a path identifies specific bytes, never a Demo.
// See docs/adr/0003-asset-paths-are-immutable.md. Published Assets are written
// once, cached for a year and never overwritten, so a duplicated or
// mis-encoded path cannot be corrected after upload — it has to be caught here.
describe("asset paths", () => {
  const duplicatesBy = (field: "videoSrc" | "thumbnailSrc") => {
    const seen = new Map<string, string[]>()
    for (const item of allItems) {
      const path = item[field]
      if (!path) continue
      seen.set(path, [...(seen.get(path) ?? []), item.id])
    }
    return [...seen.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([path, ids]) => `${path} <- ${ids.join(", ")}`)
  }

  it("no two entries share a Demo path", () => {
    const dupes = duplicatesBy("videoSrc")
    expect(dupes, `duplicate Demo paths:\n${dupes.join("\n")}`).toHaveLength(0)
  })

  it("no two entries share a Poster path", () => {
    const dupes = duplicatesBy("thumbnailSrc")
    expect(dupes, `duplicate Poster paths:\n${dupes.join("\n")}`).toHaveLength(0)
  })

  // macOS stores filenames decomposed (NFD) while these strings are composed
  // (NFC). macOS is normalization-insensitive so the mismatch is invisible
  // locally, but byte-exact object storage 404s on it. This previously broke
  // 16 assets whose author's name contained "ś".
  it("all asset paths are printable ASCII", () => {
    const bad = allItems.flatMap((item) =>
      [item.videoSrc, item.thumbnailSrc]
        .filter((path) => path && !/^[\x20-\x7E]+$/.test(path))
        .map((path) => `${item.id}: ${path}`)
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
    const bad = allItems
      .filter((item) => item.videoSrc && !DEMO_PATH.test(item.videoSrc))
      .map((item) => `${item.id}: ${item.videoSrc}`)
    expect(bad, `malformed Demo paths:\n${bad.join("\n")}`).toHaveLength(0)
  })

  it("all Poster paths are well-formed", () => {
    const bad = allItems
      .filter((item) => item.thumbnailSrc && !POSTER_PATH.test(item.thumbnailSrc))
      .map((item) => `${item.id}: ${item.thumbnailSrc}`)
    expect(bad, `malformed Poster paths:\n${bad.join("\n")}`).toHaveLength(0)
  })
})
