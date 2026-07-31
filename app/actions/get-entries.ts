// app/actions/get-entries.ts

"use server"

import "server-only"

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { getEntriesWithCounts, type Entry } from "@/data/entry"

import { matchesSearchTerm } from "@/lib/entry-search"

// The counts are one whole-collection Firestore read, and every request for `/`
// or `/products` used to pay for it — a search of seven characters paid seven
// times. Cached across requests for five minutes; the `cache()` below still
// dedupes within a single render pass, which this does not do.
//
// Not exported, and not movable into data/entry.ts. A "use server" module may
// export only async functions (see app/actions/increment-view-count.ts), and
// data/entry.ts is in the client graph — components/catalogue-search.tsx imports
// getUniqueCategories from it, so `next/cache` there would break the bundle.
const readEntriesWithCounts = unstable_cache(
  getEntriesWithCounts,
  ["entries-with-counts"],
  {
    revalidate: 300,
  }
)

export const getEntries = cache(
  async (
    searchTerm?: string,
    category?: string,
    author?: string
  ): Promise<Entry[]> => {
    try {
      let filteredEntries = await readEntriesWithCounts()

      // Apply search term filter. The rule lives in lib/entry-search.ts, where the
      // data suite can reach it — this action cannot be imported without Firestore,
      // so while the rule was a line in here nothing checked it, and it tested the
      // caption alone.
      if (searchTerm) {
        filteredEntries = filteredEntries.filter((entry) =>
          matchesSearchTerm(entry, searchTerm)
        )
      }

      // Apply category filter
      if (category) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.category.toLowerCase() === category.toLowerCase()
        )
      }

      // Apply author filter
      if (author) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.author.toLowerCase() === author.toLowerCase()
        )
      }

      return filteredEntries
    } catch (error) {
      console.error("Error filtering Entries:", error)
      return []
    }
  }
)
