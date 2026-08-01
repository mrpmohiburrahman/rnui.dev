// data/entry.ts
import { counters } from "@/lib/counters-firestore"

import { allEntries } from "./catalogue"

// Return the unique categories sorted alphabetically.
//
// Derived from the Entries present, not from the Category table in
// data/categories.ts, and deliberately so: a Category may have a row before it
// has its first Entry. Reading the table here would put an empty Category in
// the navigation and the search placeholder, sending visitors to a page with
// nothing on it.
export function getUniqueCategories(): string[] {
  const categories = allEntries.map((entry) => entry.category)
  return Array.from(new Set(categories)).sort((a, b) => a.localeCompare(b))
}

// Return the unique authors sorted alphabetically
export function getUniqueAuthors(): string[] {
  const authors = allEntries.map((entry) => entry.author)
  return Array.from(new Set(authors)).sort((a, b) => a.localeCompare(b))
}

export type Entry = {
  id: string
  caption: string
  demoPath: string
  posterPath: string
  author: string
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

export async function getEntriesWithCounts(): Promise<Entry[]> {
  // The collection name, the fallback and the snapshot walk all live in
  // lib/counters.ts now. This module used to hold the fourth copy of the first two.
  const countsMap = await counters.readCounts()

  // Merge counts into the local Entries
  const entriesWithCounts: Entry[] = allEntries.map((entry) => ({
    ...entry,
    view_count: countsMap[entry.id]?.view_count || 0,
    vote_count: countsMap[entry.id]?.vote_count || 0,
  }))

  // Sort Entries based on created_at in descending order (latest first)
  entriesWithCounts.sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0
    if (!a.created_at) return 1 // a is older or missing, place after b
    if (!b.created_at) return -1 // b is older or missing, place after a

    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()

    return dateB - dateA // Descending order
  })

  // Find the latest date (YYYY-MM-DD)
  const latestDate = entriesWithCounts[0]?.created_at
    ? new Date(entriesWithCounts[0].created_at).toISOString().split("T")[0]
    : ""

  // Add isNew property based on the latest date
  const entriesWithIsNew: Entry[] = entriesWithCounts.map((entry) => ({
    ...entry,
    isNew: entry.created_at
      ? new Date(entry.created_at).toISOString().split("T")[0] === latestDate
      : false,
  }))

  return entriesWithIsNew
}
