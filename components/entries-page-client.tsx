// components/entries-page-client.tsx
"use client"

import type { ReactElement } from "react"
import type { Entry } from "@/data/entry"
import { BoxIcon, Hash, Search, TagIcon, User } from "lucide-react"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"
import { FadeIn } from "@/components/cult/fade-in"
import { GradientHeading } from "@/components/cult/gradient-heading"
import { EntryCardGrid } from "@/components/entry-card-grid"

import CardModal from "./card-modal"

interface EntriesPageClientProps {
  sortedData: Entry[]
  search?: string
  category?: string
  label?: string
  tag?: string
  author?: string
}

const EntriesPageClient = ({
  sortedData: initialData,
  search,
  category,
  label,
  tag,
  author,
}: EntriesPageClientProps): ReactElement => {
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
    <>
      <div className=" max-w-full pt-4">
        <FadeIn>
          <EntryCardGrid
            sortedData={sortedData}
            treatment="plain"
            openModal={openModal}
            bookmarks={bookmarks}
            toggleBookmark={toggleBookmark}
            votedEntryIds={votedEntryIds}
            toggleVote={toggleVote}
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
          </EntryCardGrid>

          {/* Modal */}
          <CardModal
            selectedEntry={selectedEntry}
            isModalOpen={isModalOpen}
            closeModal={closeModal}
          />
        </FadeIn>
      </div>
    </>
  )
}

export default EntriesPageClient
