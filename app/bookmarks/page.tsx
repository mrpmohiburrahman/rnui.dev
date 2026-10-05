// app/bookmarks/page.tsx
"use client"

import React, { Suspense, useEffect, useState } from "react"
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
      // fetching every Recording to then show none of them was a real cost.
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
    //
    // The boundary is not optional: CataloguePage and the grid read `page` and
    // the facets with useSearchParams(), which opts every ancestor out of
    // prerendering, and this is the one catalogue route with no server
    // component above it to absorb that. Without it the build fails on
    // "useSearchParams() should be wrapped in a suspense boundary". The
    // fallback is null: which Recordings show is decided by localStorage, so
    // the grid itself was never going to be in the served HTML anyway.
    <div className="max-w-full">
      {/* The fallback carries this route's `h1`. `6acf554` set it to `null` along
          with the rest of the heading row, which left /bookmarks with no `h1`
          at all — and then with none in its *served* HTML either, since the grid
          below only renders once the client has read localStorage. The heading
          element is what the grid hands to the section head, so repeating it
          here keeps one `h1` in the document rather than two: Suspense shows
          this until the grid resolves, then swaps it out. */}
      <Suspense
        fallback={
          <h1 className="sr-only text-section m-0 text-t1">Saved on this device</h1>
        }
      >
        <CataloguePage
          recordings={recordings}
          bookmarkedOnly
          // The grid's visually-hidden `h1`, restored in commit 6acf554's wake.
          // Without it this route carries no `h1` at all. The saved view has no
          // filtered count to derive a heading from, so it names itself.
          heading="Saved on this device"
          topViewCount={topViewCount}
        />
      </Suspense>
    </div>
  )
}

export default BookmarksPage
