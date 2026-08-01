// app/actions/get-recordings.ts

"use server"

import "server-only"

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { getRecordingsWithCounts, type Recording } from "@/data/recording"

import { matchesSearchTerm } from "@/lib/recording-search"

// The counts are one whole-collection Firestore read, and every request for `/`
// or `/products` used to pay for it — a search of seven characters paid seven
// times. Cached across requests for five minutes; the `cache()` below still
// dedupes within a single render pass, which this does not do.
//
// Not exported, and not movable into data/recording.ts. A "use server" module may
// export only async functions, which is why every counter action in this
// directory is a one-line delegate. And data/recording.ts is in the client graph —
// components/catalogue-search.tsx imports getUniqueCategories from it, so
// `next/cache` there would break the bundle.
const readRecordingsWithCounts = unstable_cache(
  getRecordingsWithCounts,
  ["recordings-with-counts"],
  {
    revalidate: 300,
  }
)

export const getRecordings = cache(
  async (
    searchTerm?: string,
    category?: string,
    contributor?: string
  ): Promise<Recording[]> => {
    try {
      let filteredRecordings = await readRecordingsWithCounts()

      // Apply search term filter. The rule lives in lib/recording-search.ts, where the
      // data suite can reach it — this action cannot be imported without Firestore,
      // so while the rule was a line in here nothing checked it, and it tested the
      // caption alone.
      if (searchTerm) {
        filteredRecordings = filteredRecordings.filter((recording) =>
          matchesSearchTerm(recording, searchTerm)
        )
      }

      // Apply category filter
      if (category) {
        filteredRecordings = filteredRecordings.filter(
          (recording) =>
            recording.category.toLowerCase() === category.toLowerCase()
        )
      }

      // Apply contributor filter
      if (contributor) {
        filteredRecordings = filteredRecordings.filter(
          (recording) =>
            recording.contributor.toLowerCase() === contributor.toLowerCase()
        )
      }

      return filteredRecordings
    } catch (error) {
      console.error("Error filtering Recordings:", error)
      return []
    }
  }
)
