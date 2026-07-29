import type { Entry } from "@/data/entry"

type Category = Entry["category"]

type CategoryMeta = {
  /** filename under data/<file>.ts (without extension) */
  file: string
  /** exported array name inside that file */
  exportName: string
  /** directory slug under public/demo and public/thumbnails */
  assetSlug: string
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  Accordions: { file: "accordions", exportName: "accordions", assetSlug: "accordions" },
  "Arc Sliders": { file: "arcsliders", exportName: "arcsliders", assetSlug: "arcsliders" },
  "Bottom Sheets": { file: "bottomsheets", exportName: "bottomsheets", assetSlug: "bottomsheets" },
  Buttons: { file: "buttons", exportName: "buttons", assetSlug: "buttons" },
  Carousels: { file: "carousels", exportName: "carousels", assetSlug: "carousels" },
  Charts: { file: "charts", exportName: "charts", assetSlug: "charts" },
  "Circular Progress Bars": {
    file: "circular-progress-bars",
    exportName: "circular_progress_bars",
    assetSlug: "circular-progress-bars",
  },
  "Drop Down": { file: "dropdowns", exportName: "drop_down", assetSlug: "dropdowns" },
  "Full Apps": { file: "fullapps", exportName: "full_apps", assetSlug: "fullapps" },
  Headers: { file: "headers", exportName: "headers", assetSlug: "headers" },
  List: { file: "lists", exportName: "list", assetSlug: "lists" },
  Loaders: { file: "loaders", exportName: "loaders", assetSlug: "loaders" },
  Misc: { file: "misc", exportName: "misc", assetSlug: "misc" },
  Onboarding: { file: "onboardings", exportName: "onboarding", assetSlug: "onboardings" },
  Parallaxes: { file: "parallaxes", exportName: "parallaxes", assetSlug: "parallaxes" },
  Pickers: { file: "pickers", exportName: "pickers", assetSlug: "pickers" },
  Sliders: { file: "sliders", exportName: "sliders", assetSlug: "sliders" },
  "Tab bars": { file: "tabbars", exportName: "tabbars", assetSlug: "tabbars" },
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}
