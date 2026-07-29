// data/categories.ts
//
// One row per Category, carrying every spelling that Category needs. The
// display name is canonical — the slug in a legacy URL and the slug in an
// Asset path are both derived from the row, never the other way round
// (CONTEXT.md).
//
// Adding a Category means a row here plus three things no table can generate,
// each of which fails loudly if forgotten: the name in the Entry type's union
// (compiler), the two literal lines in data/catalogue.ts and the matcher line
// in middleware.ts (both covered by tests/data-integrity.test.ts).
//
// This lives in the data layer rather than beside the ingest script: the whole
// site reads it, not one tool.

import type { Entry } from "./entry"

export type Category = Entry["category"]

export type CategoryRow = {
  /** the path that redirected here before the redesign, without its leading slash */
  legacySlug: string
  /** directory slug under the Demo and Poster prefixes of an Asset path */
  assetSlug: string
  /** filename under data/<file>.ts */
  file: string
  /** exported array name inside that file */
  exportName: string
}

// Keyed by the Entry type's Category union, so the compiler rejects both a name
// that is not a Category and a Category with no row.
export const CATEGORIES: Record<Category, CategoryRow> = {
  Accordions: { legacySlug: "accordions", assetSlug: "accordions", file: "accordions", exportName: "accordions" },
  "Arc Sliders": { legacySlug: "arcsliders", assetSlug: "arcsliders", file: "arcsliders", exportName: "arcsliders" },
  "Bottom Sheets": {
    legacySlug: "bottomsheets",
    assetSlug: "bottomsheets",
    file: "bottomsheets",
    exportName: "bottomsheets",
  },
  Buttons: { legacySlug: "buttons", assetSlug: "buttons", file: "buttons", exportName: "buttons" },
  Carousels: { legacySlug: "carousels", assetSlug: "carousels", file: "carousels", exportName: "carousels" },
  Charts: { legacySlug: "charts", assetSlug: "charts", file: "charts", exportName: "charts" },
  "Circular Progress Bars": {
    legacySlug: "circular-progress-bars",
    assetSlug: "circular-progress-bars",
    file: "circular-progress-bars",
    exportName: "circular_progress_bars",
  },
  "Drop Down": { legacySlug: "dropdowns", assetSlug: "dropdowns", file: "dropdowns", exportName: "drop_down" },
  "Full Apps": { legacySlug: "fullapps", assetSlug: "fullapps", file: "fullapps", exportName: "full_apps" },
  Headers: { legacySlug: "headers", assetSlug: "headers", file: "headers", exportName: "headers" },
  List: { legacySlug: "lists", assetSlug: "lists", file: "lists", exportName: "list" },
  Loaders: { legacySlug: "loaders", assetSlug: "loaders", file: "loaders", exportName: "loaders" },
  // The one Category whose legacy path is not its filename.
  Misc: { legacySlug: "miscellaneous", assetSlug: "misc", file: "misc", exportName: "misc" },
  Onboarding: { legacySlug: "onboardings", assetSlug: "onboardings", file: "onboardings", exportName: "onboarding" },
  Parallaxes: { legacySlug: "parallaxes", assetSlug: "parallaxes", file: "parallaxes", exportName: "parallaxes" },
  Pickers: { legacySlug: "pickers", assetSlug: "pickers", file: "pickers", exportName: "pickers" },
  Sliders: { legacySlug: "sliders", assetSlug: "sliders", file: "sliders", exportName: "sliders" },
  "Tab bars": { legacySlug: "tabbars", assetSlug: "tabbars", file: "tabbars", exportName: "tabbars" },
}

export const CATEGORY_NAMES = Object.keys(CATEGORIES) as Category[]

/** Legacy path → the address it redirects to today. Read by middleware.ts. */
export const LEGACY_REDIRECTS: Record<string, string | undefined> = Object.fromEntries(
  CATEGORY_NAMES.map((name) => [`/${CATEGORIES[name].legacySlug}`, `/products?category=${encodeURIComponent(name)}`])
)
