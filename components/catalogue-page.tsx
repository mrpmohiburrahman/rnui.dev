// components/catalogue-page.tsx
//
// The Catalogue page (CONTEXT.md): the one client module the home page, the
// Category listing and the bookmarks page all render. It was three near-identical
// modules repeating the same four-hook preamble, the same hydration guard, the
// same grid call and the same modal tail.
//
// It does not fetch. Each route hands it Entries — two from a server component
// above them, and the bookmarks route from its own effect, because it has no
// server component above it.
"use client"

import { useMemo, type ReactNode } from "react"
import type { Entry } from "@/data/entry"

import useBookmarks from "@/hooks/use-bookmarks"
import useModal from "@/hooks/use-modal"
import useSortedData from "@/hooks/use-sorted-data"
import useVotes from "@/hooks/use-votes"
import CardModal from "@/components/card-modal"
import { EntryCardGrid, type GridTreatment } from "@/components/entry-card-grid"

interface CataloguePageProps {
  entries: Entry[]
  treatment: GridTreatment
  /**
   * Show only the Entries this visitor has bookmarked. The bookmarks route is
   * handed the whole catalogue and sets this, rather than filtering before it
   * hands the Entries over: the saved set lives in here, and a route filtering
   * against its own second copy of that set would keep showing a card after the
   * visitor un-bookmarked it, until a reload.
   */
  bookmarkedOnly?: boolean
  /** Rendered above the sort controls: a heading, a hero, a newsletter form. */
  children?: ReactNode
}

export function CataloguePage({
  entries,
  treatment,
  bookmarkedOnly = false,
  children,
}: CataloguePageProps) {
  const { bookmarks, toggleBookmark } = useBookmarks()
  const { votedEntryIds, toggleVote } = useVotes()
  const { isModalOpen, selectedEntry, openModal, closeModal } = useModal()

  const visible = useMemo(
    () =>
      bookmarkedOnly && bookmarks
        ? entries.filter((entry) => bookmarks.includes(entry.id))
        : entries,
    [bookmarkedOnly, bookmarks, entries]
  )
  const { sortedData, sort, setSort } = useSortedData(visible)

  // Both stored sets read localStorage in an effect, so on the first client render
  // they are still null and no card can know whether it is bookmarked or voted.
  // Rendering nothing for that one frame is the placeholder; it was written three
  // times before this module existed.
  if (bookmarks === null || votedEntryIds === null) {
    return <div />
  }

  return (
    <>
      <EntryCardGrid
        sortedData={sortedData}
        treatment={treatment}
        openModal={openModal}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        votedEntryIds={votedEntryIds}
        toggleVote={toggleVote}
        setSort={setSort}
        currentSort={sort}
      >
        {children}
      </EntryCardGrid>

      <CardModal
        selectedEntry={selectedEntry}
        isModalOpen={isModalOpen}
        closeModal={closeModal}
      />
    </>
  )
}

export default CataloguePage
