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
import { usePathname } from "next/navigation"
import type { Entry } from "@/data/entry"

import {
  BOOKMARKS_KEY,
  useRememberedSet,
  VOTED_ENTRY_IDS_KEY,
} from "@/hooks/use-remembered-set"
import useSortedData from "@/hooks/use-sorted-data"
import { EntryCardGrid, type GridTreatment } from "@/components/entry-card-grid"
import { EntryOverlay } from "@/components/entry-overlay"

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
  const { ids: bookmarks, toggle: toggleBookmark } =
    useRememberedSet(BOOKMARKS_KEY)
  const { ids: votedEntryIds, toggle: toggleVote } =
    useRememberedSet(VOTED_ENTRY_IDS_KEY)

  // Which Entry is open is the address, not state. The card pushes /entry/<id>
  // with the History API, which the App Router reflects back through
  // usePathname — no server render, no Firestore read, and Back closes the
  // panel because Back is the only close path there is.
  //
  // Searched against `entries`, not the filtered or sorted list: un-bookmarking
  // the open Entry from inside the panel must not make the panel vanish
  // mid-interaction.
  const pathname = usePathname()
  const openEntry =
    (pathname.startsWith("/entry/") &&
      entries.find((e) => e.id === pathname.slice("/entry/".length))) ||
    null

  // A set that has not been read yet means "nothing remembered so far", not
  // "everything". The distinction never used to matter: a hydration guard used to
  // sit under this memo and return before any of it was read. Once that went, a
  // null set on the bookmarks route fell through to the whole catalogue.
  const visible = useMemo(
    () =>
      bookmarkedOnly
        ? entries.filter((entry) => bookmarks?.includes(entry.id) ?? false)
        : entries,
    [bookmarkedOnly, bookmarks, entries]
  )
  const { sortedData, sort, setSort } = useSortedData(visible)

  return (
    <>
      <EntryCardGrid
        sortedData={sortedData}
        treatment={treatment}
        // Both stored sets are still null until an effect has read localStorage.
        // `[]` rather than a placeholder render: the server and the first client
        // render both see an empty set, so there is no hydration mismatch, and the
        // effect fills it on the next render. Waiting instead meant the served HTML
        // of every catalogue route was a bare `<div />` — no heading, no sort
        // controls, no Entries.
        bookmarks={bookmarks ?? []}
        toggleBookmark={toggleBookmark}
        votedEntryIds={votedEntryIds ?? []}
        toggleVote={toggleVote}
        setSort={setSort}
        currentSort={sort}
      >
        {children}
      </EntryCardGrid>

      {/* history.back() is the whole close path, so Escape, the close button,
          the tint and the browser's own Back button all do one identical thing.
          Safe because the overlay only opens on an /entry/… pathname this page
          pushed itself; a cold /entry/… renders app/entry/[id]/page.tsx, which
          has no overlay. */}
      <EntryOverlay entry={openEntry} onClose={() => window.history.back()} />
    </>
  )
}
