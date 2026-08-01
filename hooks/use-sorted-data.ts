// hooks/useSortedData.ts
import { useMemo } from "react"
import { useSearchParams } from "next/navigation"
import type { Recording } from "@/data/recording"

import { sortChanged } from "@/lib/analytics"

type SortType = "recent" | "top-voted" | "top-viewed"

const useSortedData = (initialData: Recording[]) => {
  // The sort is the address, not component state. Held in useState it was reset
  // by every facet link — a real navigation, which remounts the tree — and no
  // URL described "Top Voted", so the order could not be shared or reloaded.
  //
  // The returned shape is unchanged, so catalogue-page.tsx and recording-card-grid.tsx
  // are untouched.
  const searchParams = useSearchParams()
  const param = searchParams.get("sort")
  const sort: SortType =
    param === "top-voted" || param === "top-viewed" ? param : "recent"

  // replaceState, not router.replace: the sort is applied client-side, so a
  // navigation would buy a server render and a whole-collection Firestore read
  // for a reorder of cards already in hand. This is the pattern the grid's
  // `page` already uses. Replace rather than push because a sort is a mode, not
  // a step — Back should leave the page, not undo three toggles.
  const setSort = (next: SortType) => {
    // Reported on use, not on change: pressing the pill that is already active
    // is a visitor looking for something a re-sort was not going to give them,
    // and a control that answers nothing is worth seeing in the numbers.
    sortChanged(next)
    const params = new URLSearchParams(window.location.search)
    if (next === "recent") params.delete("sort")
    else params.set("sort", next)
    // `page` survives: sorting changes the order of the visible cards, not which
    // Recordings match, and dropping it would collapse a loaded grid back to 48.
    const query = params.toString()
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname
    )
  }

  // Derived rather than held in state and written from an effect. The effect
  // painted the unsorted list and corrected it on the next tick, and
  // react-hooks/set-state-in-effect rejects it outright.
  const sortedData = useMemo(() => {
    const sorted = [...initialData]
    if (sort === "top-voted") {
      sorted.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    } else if (sort === "top-viewed") {
      sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    }
    // "recent" sorts nothing: getRecordingsWithCounts already returns the catalogue
    // ordered by created_at, newest first.
    return sorted
  }, [sort, initialData])

  return { sortedData, sort, setSort }
}

export default useSortedData
