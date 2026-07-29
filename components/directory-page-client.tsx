// components/directory-page-client.tsx
"use client"

import type { ReactNode } from "react"
import type { Entry } from "@/data/entry"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"

import CardModal from "./card-modal"
import { EntryCardGrid } from "./entry-card-grid"

interface DirectoryPageClientProps {
  sortedData: Entry[]
  filteredFeaturedData: Entry[] | null
  children?: ReactNode
}

const DirectoryPageClient: React.FC<DirectoryPageClientProps> = ({
  sortedData: initialData,
  filteredFeaturedData,
  children,
}) => {
  // Use the separate hooks
  const { bookmarks, toggleBookmark } = useBookmarks()

  const { votedEntryIds, toggleVote } = useVotes()
  const { isModalOpen, selectedEntry, openModal, closeModal } = useModal()
  const { sortedData, sort, setSort } = useSortedData(initialData)

  // Ensure bookmarks and votedEntryIds are loaded before rendering
  if (bookmarks === null || votedEntryIds === null) {
    return <div /> // Optionally, replace with a loader
  }

  return (
    <div
    // style={{ borderWidth: 1, borderColor: "purple" }}
    //
    >
      <EntryCardGrid
        sortedData={sortedData}
        filteredFeaturedData={filteredFeaturedData}
        openModal={openModal}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        votedEntryIds={votedEntryIds}
        toggleVote={toggleVote}
        setSort={setSort} // Pass setSort to handle sorting
        currentSort={sort} // Pass current sort state
      >
        {children}
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

export default DirectoryPageClient
