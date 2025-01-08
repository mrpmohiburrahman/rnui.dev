// components/products-page-client.tsx
"use client"

import type { ReactElement } from "react"
import type { ItemType } from "@/data/items"
import { BoxIcon, Hash, Search, TagIcon, User } from "lucide-react"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"
import { FadeIn } from "@/components/cult/fade-in"
import { GradientHeading } from "@/components/cult/gradient-heading"
import { ResourceCardGrid } from "@/components/resource-card-grid"
import { incrementViewCount } from "@/app/actions/increment-view-count"

import CardModal from "./card-modal"

interface ProductsPageClientProps {
  sortedData: ItemType[]
  filteredFeaturedData: ItemType[] | null
  search?: string
  category?: string
  label?: string
  tag?: string
  author?: string
}

const ProductsPageClient = ({
  sortedData: initialData,
  filteredFeaturedData,
  search,
  category,
  label,
  tag,
  author,
}: ProductsPageClientProps): ReactElement => {
  // Use the separate hooks
  const { bookmarks, toggleBookmark } = useBookmarks()

  const { votedItems, toggleVote } = useVotes()
  const { isModalOpen, selectedProduct, openModal, closeModal } = useModal()
  const { sortedData, sort, setSort } = useSortedData(initialData)

  // Vote handler integration
  const handleToggleVote = (id: string) => {
    incrementViewCount(id)
    toggleVote(id)
  }

  // Ensure bookmarks and votedItems are loaded before rendering
  if (bookmarks === null || votedItems === null) {
    return <div /> // Optionally, replace with a loader
  }

  return (
    <>
      <div className=" max-w-full pt-4">
        <FadeIn>
          <ResourceCardGrid
            sortedData={sortedData}
            filteredFeaturedData={filteredFeaturedData}
            openModal={openModal}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            votedItems={votedItems}
            toggleVote={handleToggleVote}
            setSort={setSort}
            currentSort={sort}
          >
            {(search || category || label || tag || author) && (
              <div className="md:mr-auto mx-auto flex flex-col items-center md:items-start">
                <div className="flex mb-1 justify-center md:justify-start">
                  {search && (
                    <Search className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                  )}
                  {category && (
                    <BoxIcon className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                  )}
                  {author && (
                    <User className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                  )}
                  {label && (
                    <Hash className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                  )}
                  {tag && (
                    <TagIcon className="mr-1 bg-neutral-800 fill-yellow-300/30 stroke-yellow-500 size-6 p-1 rounded-full" />
                  )}
                  {search && "search"}
                  {category && "category"}
                  {label && "label"}
                  {tag && "tag"}
                  {author && "Author"}
                </div>
                <GradientHeading size="xxl">
                  {search || category || label || tag || author}
                </GradientHeading>
              </div>
            )}
          </ResourceCardGrid>

          {/* Modal */}
          <CardModal
            selectedProduct={selectedProduct}
            isModalOpen={isModalOpen}
            closeModal={closeModal}
          />
        </FadeIn>
      </div>
    </>
  )
}

export default ProductsPageClient
