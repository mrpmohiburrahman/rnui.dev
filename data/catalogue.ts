// data/catalogue.ts
//
// Every Entry in the catalogue, in one array. The 18-category merge used to be
// copy-pasted into each consumer; it lives here so that adding a Category is a
// one-line change and so the publish tooling can read the catalogue without
// pulling in Firebase.
//
// `ItemType` is imported as a type only, deliberately: data/items.ts imports
// this module back, and a value import would make that cycle real.

import type { ItemType } from "./items"

import { accordions } from "./accordions"
import { arcsliders } from "./arcsliders"
import { bottomsheets } from "./bottomsheets"
import { buttons } from "./buttons"
import { carousels } from "./carousels"
import { charts } from "./charts"
import { circular_progress_bars } from "./circular-progress-bars"
import { drop_down } from "./dropdowns"
import { full_apps } from "./fullapps"
import { headers } from "./headers"
import { list } from "./lists"
import { loaders } from "./loaders"
import { misc } from "./misc"
import { onboarding } from "./onboardings"
import { parallaxes } from "./parallaxes"
import { pickers } from "./pickers"
import { sliders } from "./sliders"
import { tabbars } from "./tabbars"

export const allEntries: ItemType[] = [
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

/**
 * Every Asset path the catalogue references — one Demo and one Poster per Entry.
 *
 * The empty-string filter is not decoration: this list feeds an upload that
 * cannot be undone, so a malformed Entry drops out here rather than becoming an
 * object key.
 */
export const allAssetPaths: string[] = allEntries.flatMap((entry) =>
  [entry.videoSrc, entry.thumbnailSrc].filter(Boolean)
)
