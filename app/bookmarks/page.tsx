// app/bookmarks/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import type { Recording } from "@/data/recording"

import { BOOKMARKS_KEY, parseRememberedIds } from "@/hooks/use-remembered-set"
import { CataloguePage } from "@/components/catalogue-page"

import { getRecordings, getTopViewCount } from "../actions/get-recordings"

const BookmarksPage = () => {
  // This route keeps its own fetch. Unlike the home page and the Category listing
  // it has no server component above it: which Recordings to show is decided by
  // localStorage, and the server cannot read that.
  //
  // It fetches the whole catalogue and lets the Catalogue page do the filtering,
  // so the saved set has exactly one owner. Reading the set here as well to
  // pre-filter would mean two copies of it, and the copy up here would not learn
  // that a visitor had un-bookmarked something from a card.
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [topViewCount, setTopViewCount] = useState(0)

  useEffect(() => {
    ;(async () => {
      // A one-shot read of the stored set, not a second copy of it: this answers
      // only "has this visitor bookmarked anything at all", which cannot change
      // while they are on a route that shows nothing but bookmarks. Skipping the
      // fetch when the answer is no is what the pre-collapse route did, and
      // fetching all 277 Recordings to then show none of them was a real cost.
      const { ids } = parseRememberedIds(localStorage.getItem(BOOKMARKS_KEY))
      if (ids.length === 0) return

      try {
        // The catalogue and its top view count are awaited together: the bar's
        // denominator is a server-shaped number (get-recordings.ts) and this
        // route has no server component above it to hand either one over.
        const [catalogue, top] = await Promise.all([
          getRecordings(),
          getTopViewCount(),
        ])
        setRecordings(catalogue)
        setTopViewCount(top)
      } catch (error) {
        console.error("Error fetching Recordings:", error)
        setRecordings([])
      }
    })()
  }, [])

  return (
    // No top padding — see app/page.tsx. `main` already spends the mock's 22px.
    <div className="max-w-full">
      <CataloguePage
        recordings={recordings}
        bookmarkedOnly
        topViewCount={topViewCount}
      />
    </div>
  )
}

export default BookmarksPage
