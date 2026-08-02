// data/recording.ts
import { counters } from "@/lib/counters-firestore"

import { allRecordings } from "./catalogue"

// Return the unique categories sorted alphabetically.
//
// Derived from the Recordings present, not from the Category table in
// data/categories.ts, and deliberately so: a Category may have a row before it
// has its first Recording. Reading the table here would put an empty Category in
// the navigation and the search placeholder, sending visitors to a page with
// nothing on it.
export function getUniqueCategories(): string[] {
  const categories = allRecordings.map((recording) => recording.category)
  return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b))
}

// Return the unique contributors sorted alphabetically
export function getUniqueContributors(): string[] {
  const contributors = allRecordings.map((recording) => recording.contributor)
  return Array.from(new Set(contributors)).sort((a, b) => a.localeCompare(b))
}

export type Recording = {
  id: string
  caption: string
  demoPath: string
  posterPath: string
  /** Written by pnpm assets:measure from the Published Demo. Absent until measured. */
  durationMs?: number
  /** Demo width ÷ height, from the Published Demo. Absent until measured. */
  aspect?: number
  /** Dominant hue of the Poster in degrees, 0–359. Absent when the Poster has no colour. */
  hue?: number
  contributor: string
  source: string
  twitterId?: string
  linkedInId?: string
  githubId?: string
  category:
    | "Accordions"
    | "Arc Sliders"
    | "Bottom Sheets"
    | "Buttons"
    | "Carousels"
    | "Charts"
    | "Circular Progress Bars"
    | "Drop Down"
    | "Full Apps"
    | "Headers"
    | "List"
    | "Loaders"
    | "Misc"
    | "Onboarding"
    | "Parallaxes"
    | "Pickers"
    | "Sliders"
    | "Tab bars"
  // view_count, vote_count and created_at are field names inside live Firestore
  // documents, so they keep their stored spelling rather than the glossary's.
  view_count?: number
  vote_count?: number
  created_at?: string
  isNew?: boolean
}

export async function getRecordingsWithCounts(): Promise<Recording[]> {
  // The collection name, the fallback and the snapshot walk all live in
  // lib/counters.ts now. This module used to hold the fourth copy of the first two.
  const countsMap = await counters.readCounts()

  // Merge counts into the local Recordings
  const recordingsWithCounts: Recording[] = allRecordings.map((recording) => ({
    ...recording,
    view_count: countsMap[recording.id]?.view_count || 0,
    vote_count: countsMap[recording.id]?.vote_count || 0,
  }))

  // Sort Recordings based on created_at in descending order (latest first)
  recordingsWithCounts.sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0
    if (!a.created_at) return 1 // a is older or missing, place after b
    if (!b.created_at) return -1 // b is older or missing, place after a

    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()

    return dateB - dateA // Descending order
  })

  // Find the latest date (YYYY-MM-DD)
  const latestDate = recordingsWithCounts[0]?.created_at
    ? new Date(recordingsWithCounts[0].created_at).toISOString().split("T")[0]
    : ""

  // Add isNew property based on the latest date
  const recordingsWithIsNew: Recording[] = recordingsWithCounts.map(
    (recording) => ({
      ...recording,
      isNew: recording.created_at
        ? new Date(recording.created_at).toISOString().split("T")[0] ===
          latestDate
        : false,
    })
  )

  return recordingsWithIsNew
}
