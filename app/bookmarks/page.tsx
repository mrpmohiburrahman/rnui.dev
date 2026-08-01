// app/bookmarks/page.tsx
"use client"

import React, { Suspense, useEffect, useState } from "react"
import type { Recording } from "@/data/recording"

import { BOOKMARKS_KEY, parseRememberedIds } from "@/hooks/use-remembered-set"
import { CataloguePage } from "@/components/catalogue-page"
import { Hero } from "@/components/hero"

import { getRecordings } from "../actions/get-recordings"

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
        setRecordings(await getRecordings())
      } catch (error) {
        console.error("Error fetching Recordings:", error)
        setRecordings([])
      }
    })()
  }, [])

  const hero = (
    <div className="grid grid-cols-1 md:grid-cols-6 lg:gap-16 py-8 relative">
      <Hero title="Bookmarks" />
    </div>
  )

  // The grid reads `page` from the URL, and useSearchParams() opts every
  // ancestor out of prerendering — this is the one catalogue route with no
  // server component above it to absorb that, so the boundary lives here.
  // The fallback is the heading on its own, following components/nav/
  // catalogue-nav.tsx: the served HTML keeps what it can rather than going
  // blank. Which Recordings this route shows is decided by localStorage, so the
  // grid itself was never going to be in that HTML.
  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <Suspense fallback={hero}>
        <CataloguePage
          recordings={recordings}
          treatment="framed"
          bookmarkedOnly
        >
          {hero}
        </CataloguePage>
      </Suspense>
    </div>
  )
}

export default BookmarksPage
