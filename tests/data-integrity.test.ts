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
