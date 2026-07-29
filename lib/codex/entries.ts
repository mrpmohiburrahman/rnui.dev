// This is the same eighteen-way merge as `allEntries` in data/catalogue.ts.
// The duplication is real and the near-identical names are a warning, not a
// coincidence: add a Category here and forget it there (or the reverse) and
// tests/data-integrity.test.ts fails naming the Entries that went missing.
//
// Collapsing the two is survey candidate 3, gated on whether search ships at
// all: search is this merge's only consumer, so that answer decides whether
// the module is merged into data/catalogue.ts or deleted outright. Merging it
// now would be thrown away if search is cut, which is why the two are pinned
// by a test instead.

import { accordions } from "@/data/accordions"
import { arcsliders } from "@/data/arcsliders"
import { bottomsheets } from "@/data/bottomsheets"
import { buttons } from "@/data/buttons"
import { carousels } from "@/data/carousels"
import { charts } from "@/data/charts"
import { circular_progress_bars } from "@/data/circular-progress-bars"
import { drop_down } from "@/data/dropdowns"
import type { Entry } from "@/data/entry"
import { full_apps } from "@/data/fullapps"
import { headers } from "@/data/headers"
import { list } from "@/data/lists"
import { loaders } from "@/data/loaders"
import { misc } from "@/data/misc"
import { onboarding } from "@/data/onboardings"
import { parallaxes } from "@/data/parallaxes"
import { pickers } from "@/data/pickers"
import { sliders } from "@/data/sliders"
import { tabbars } from "@/data/tabbars"

export const ALL_ENTRIES: Entry[] = [
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
