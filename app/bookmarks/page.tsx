// app/bookmarks/page.tsx
"use client"

import React, { Suspense, useEffect, useState } from "react"
import type { Recording } from "@/data/recording"

import { useReader } from "@/hooks/use-reader"
import { useSavedDemos } from "@/hooks/use-saved-demos"
import { CataloguePage } from "@/components/catalogue-page"

import { getRecordings, getTopViewCount } from "../actions/get-recordings"

const BookmarksPage = () => {
  // This route keeps its own fetch. Unlike the home page and the Category listing
  // it has no server component above it: which Recordings to show is decided by
  // the Reader's saved set, which the server cannot read for them — signed in
  // it lives on their account behind their ID token, signed out in their
  // browser. (The old comment said the server cannot read localStorage. That
  // was true and is now the smaller half: the signed-in set is not in any
  // browser at all.)
  //
  // It fetches the whole catalogue and lets the Catalogue page do the filtering,
  // so the saved set has exactly one owner. Reading the set here as well to
  // pre-filter would mean two copies of it, and the copy up here would not learn
  // that a visitor had un-saved something from a card. The catalogue fetch is
  // the same cached server action the other routes read — no per-Recording
  // reads, which is the discipline map decision 6's D1 shape exists to keep.
  const { reader, ready } = useReader()
  const { ids } = useSavedDemos()
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [topViewCount, setTopViewCount] = useState(0)

  const signedIn = ready && reader !== null

  useEffect(() => {
    ;(async () => {
      // A one-shot read of the saved set, not a second copy of it: this answers
      // only "has this Reader saved anything at all", which cannot change
      // while they are on a route that shows nothing but saves. Skipping the
      // fetch when the answer is no is what the pre-collapse route did, and
      // fetching every Recording to then show none of them was a real cost.
      // `null` is "not known yet" — the saved list is still loading from the
      // account or the browser — and must not render as empty.
      if (ids === null) return
      if (ids.length === 0) {
        setRecordings([])
        return
      }

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
  }, [ids])

  // A signed-in Reader's saves follow their account, so the heading names what
  // they are rather than where they sit. Signed out, the heading keeps the old
  // words — those saves really are on this device, and they merge into the
  // account on first sign-in. The Suspense fallback below is the served HTML,
  // which is always signed out, so it keeps the device words too.
  const heading = signedIn ? "Saved Demos" : "Saved on this device"

  return (
    // No top padding — see app/page.tsx. `main` already spends the mock's 22px.
    //
    // The boundary is not optional: CataloguePage and the grid read `page` and
    // the facets with useSearchParams(), which opts every ancestor out of
    // prerendering, and this is the one catalogue route with no server
    // component above it to absorb that. Without it the build fails on
    // "useSearchParams() should be wrapped in a suspense boundary". The
    // fallback is null: which Recordings show is decided by the saved set,
    // which the server never holds, so the grid itself was never going to be
    // in the served HTML anyway.
    <div className="max-w-full">
      {/* The fallback carries this route's `h1`. `6acf554` set it to `null` along
          with the rest of the heading row, which left /bookmarks with no `h1`
          at all — and then with none in its *served* HTML either, since the grid
          below only renders once the saved set is known. The heading
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
          // Without it this route carries no `h1` at all. Signed in it names
          // the account's list; signed out, the device's.
          heading={heading}
          topViewCount={topViewCount}
        />
      </Suspense>
    </div>
  )
}

export default BookmarksPage
