// hooks/useSortedData.ts
import { useMemo, useState } from "react"
import type { Entry } from "@/data/entry"

type SortType = "recent" | "top-voted" | "top-viewed"

const useSortedData = (initialData: Entry[]) => {
  const [sort, setSort] = useState<SortType>("recent")

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
    // "recent" sorts nothing: getEntriesWithCounts already returns the catalogue
    // ordered by created_at, newest first.
    return sorted
  }, [sort, initialData])

  return { sortedData, sort, setSort }
}

export default useSortedData
