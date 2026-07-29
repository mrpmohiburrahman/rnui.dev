// This is the same eighteen-way merge as `allEntries` in data/catalogue.ts, and
// nothing asserts the two agree. Collapsing them is survey candidate 3, which
// the spec holds back to its own ticket; until then the duplication is real and
// the near-identical names are a warning, not a coincidence.

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
