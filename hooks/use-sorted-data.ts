// hooks/useSortedData.ts
import { useEffect, useState } from "react"
import type { Entry } from "@/data/entry"

type SortType = "recent" | "top-voted" | "top-viewed"

const useSortedData = (initialData: Entry[]) => {
  const [sort, setSort] = useState<SortType>("recent")
  const [sortedData, setSortedData] = useState<Entry[]>(initialData)

  useEffect(() => {
    const sorted = [...initialData]
    if (sort === "top-voted") {
      sorted.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0))
    } else if (sort === "top-viewed") {
      sorted.sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    } else if (sort === "recent") {
      // Assuming each item has a 'created_at' property
      //   sorted.sort(
      //     (a, b) =>
      //       new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      //   )
    }
    setSortedData(sorted)
  }, [sort, initialData])

  return { sortedData, sort, setSort }
}

export default useSortedData
