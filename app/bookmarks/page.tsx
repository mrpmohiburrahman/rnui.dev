// app/bookmarks/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import type { Entry } from "@/data/entry"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"
import CardModal from "@/components/card-modal"
import { EntryCardGrid } from "@/components/entry-card-grid"
import { Hero } from "@/components/hero"

import { getEntries } from "../actions/get-entries"

const BookmarksPage = () => {
  // Use custom hooks
  const { bookmarks, toggleBookmark } = useBookmarks()
  const { votedEntryIds, toggleVote } = useVotes()
  const { isModalOpen, selectedEntry, openModal, closeModal } = useModal()

  // State to store Entries
  const [initialData, setInitialData] = useState<Entry[]>([])
  const { sortedData, sort, setSort } = useSortedData(initialData)

  // Fetch Entries from the catalogue based on bookmarks
  useEffect(() => {
    ;(async () => {
      try {
        if (bookmarks && bookmarks.length > 0) {
          const fetchedData: Entry[] = await getEntries()

          const filteredData = fetchedData.filter((entry) =>
            bookmarks.includes(entry.id)
          )
          setInitialData(filteredData)
        } else {
          setInitialData([])
        }
      } catch (error) {
        console.error("Error fetching Entries:", error)
        setInitialData([])
      }
    })()
  }, [bookmarks])

  // Ensure bookmarks and votedEntryIds are loaded before rendering
  if (bookmarks === null || votedEntryIds === null) {
    return <div /> // Replace with a loader if desired
  }

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <EntryCardGrid
        sortedData={sortedData}
        treatment="framed"
        openModal={openModal}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        votedEntryIds={votedEntryIds}
        toggleVote={toggleVote}
        setSort={setSort}
        currentSort={sort}
      >
        <div className="grid grid-cols-1 md:grid-cols-6 lg:gap-16 py-8 relative">
          <Hero title="Bookmarks" />
        </div>
      </EntryCardGrid>

      {/* Modal */}
      <CardModal
        selectedEntry={selectedEntry}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </div>
  )
}

export default BookmarksPage
