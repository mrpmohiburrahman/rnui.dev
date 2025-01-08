// app/bookmarks/page.tsx
"use client"

import React, { useEffect, useState } from "react"
import type { ItemType } from "@/data/items"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"
import CardModal from "@/components/card-modal"
import { Hero } from "@/components/hero"
import { ResourceCardGrid } from "@/components/resource-card-grid"

import { getProducts } from "../actions/get-products"
import { incrementViewCount } from "../actions/increment-view-count"

const BookmarksPage = () => {
  // Use custom hooks
  const { bookmarks, toggleBookmark } = useBookmarks()
  const { votedItems, toggleVote } = useVotes()
  const { isModalOpen, selectedProduct, openModal, closeModal } = useModal()

  // State to store items
  const [initialData, setInitialData] = useState<ItemType[]>([])
  const { sortedData, sort, setSort } = useSortedData(initialData)

  // Fetch items from API based on bookmarks
  useEffect(() => {
    ;(async () => {
      try {
        if (bookmarks && bookmarks.length > 0) {
          const fetchedData: ItemType[] = await getProducts()

          const filteredData = fetchedData.filter((item) =>
            bookmarks.includes(item.id)
          )
          setInitialData(filteredData)
        } else {
          setInitialData([])
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setInitialData([])
      }
    })()
  }, [bookmarks])

  // Vote handler integration
  const handleToggleVote = (id: string) => {
    incrementViewCount(id)
    toggleVote(id)
  }

  // Ensure bookmarks and votedItems are loaded before rendering
  if (bookmarks === null || votedItems === null) {
    return <div /> // Replace with a loader if desired
  }

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <ResourceCardGrid
        sortedData={sortedData}
        openModal={openModal}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        votedItems={votedItems}
        toggleVote={handleToggleVote}
        setSort={setSort}
        currentSort={sort}
      >
        <div className="grid grid-cols-1 md:grid-cols-6 lg:gap-16 py-8 relative">
          <Hero title="Bookmarks" />
        </div>
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

export default BookmarksPage
