// app/bookmarks/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import type { Entry } from "@/data/entry"

import {
  BOOKMARKS_KEY,
  parseRememberedIds,
} from "@/hooks/use-remembered-set"
import { CataloguePage } from "@/components/catalogue-page"
import { Hero } from "@/components/hero"

import { getEntries } from "../actions/get-entries"

const BookmarksPage = () => {
  // This route keeps its own fetch. Unlike the home page and the Category listing
  // it has no server component above it: which Entries to show is decided by
  // localStorage, and the server cannot read that.
  //
  // It fetches the whole catalogue and lets the Catalogue page do the filtering,
  // so the saved set has exactly one owner. Reading the set here as well to
  // pre-filter would mean two copies of it, and the copy up here would not learn
  // that a visitor had un-bookmarked something from a card.
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    ;(async () => {
      // A one-shot read of the stored set, not a second copy of it: this answers
      // only "has this visitor bookmarked anything at all", which cannot change
      // while they are on a route that shows nothing but bookmarks. Skipping the
      // fetch when the answer is no is what the pre-collapse route did, and
      // fetching all 277 Entries to then show none of them was a real cost.
      const { ids } = parseRememberedIds(localStorage.getItem(BOOKMARKS_KEY))
      if (ids.length === 0) return

      try {
        setEntries(await getEntries())
      } catch (error) {
        console.error("Error fetching Entries:", error)
        setEntries([])
      }
    })()
  }, [])

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <CataloguePage entries={entries} treatment="framed" bookmarkedOnly>
        <div className="grid grid-cols-1 md:grid-cols-6 lg:gap-16 py-8 relative">
          <Hero title="Bookmarks" />
        </div>
      </CataloguePage>
    </div>
  )
}

export default BookmarksPage
