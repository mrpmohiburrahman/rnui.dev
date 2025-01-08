// components/directory-page-client.tsx
"use client"

import type { ReactNode } from "react"
import type { ItemType } from "@/data/items"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"

import CardModal from "./card-modal"
import { ResourceCardGrid } from "./resource-card-grid"

interface DirectoryPageClientProps {
  sortedData: ItemType[]
  filteredFeaturedData: ItemType[] | null
  children?: ReactNode
}

const DirectoryPageClient: React.FC<DirectoryPageClientProps> = ({
  sortedData: initialData,
  filteredFeaturedData,
  children,
}) => {
  // Use the separate hooks
  const { bookmarks, toggleBookmark } = useBookmarks()

  const { votedItems, toggleVote } = useVotes()
  const { isModalOpen, selectedProduct, openModal, closeModal } = useModal()
  const { sortedData, sort, setSort } = useSortedData(initialData)

  // Ensure bookmarks and votedItems are loaded before rendering
  if (bookmarks === null || votedItems === null) {
    return <div /> // Optionally, replace with a loader
  }

  return (
    <div
    // style={{ borderWidth: 1, borderColor: "purple" }}
    //
    >
      <ResourceCardGrid
        sortedData={sortedData}
        filteredFeaturedData={filteredFeaturedData}
        openModal={openModal}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        votedItems={votedItems}
        toggleVote={toggleVote}
        setSort={setSort} // Pass setSort to handle sorting
        currentSort={sort} // Pass current sort state
      >
        {children}
      </ResourceCardGrid>

      {/* Modal */}
      <CardModal
        selectedProduct={selectedProduct}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </div>
  )
}

export default DirectoryPageClient
