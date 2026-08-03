// components/catalogue-page.tsx
//
// The Catalogue page (CONTEXT.md): the one client module the home page, the
// Category listing and the bookmarks page all render. It was three near-identical
// modules repeating the same four-hook preamble, the same hydration guard, the
// same grid call and the same modal tail.
//
// It does not fetch. Each route hands it Recordings — two from a server component
// above them, and the bookmarks route from its own effect, because it has no
// server component above it.
"use client"

import { useMemo, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import type { Recording } from "@/data/recording"

import {
  BOOKMARKS_KEY,
  useRememberedSet,
  VOTED_RECORDING_IDS_KEY,
} from "@/hooks/use-remembered-set"
import useSortedData from "@/hooks/use-sorted-data"
import { Hero } from "@/components/hero"
import { PlaybackOwner } from "@/components/playback-owner"
import {
  RecordingCardGrid,
  type GridTreatment,
} from "@/components/recording-card-grid"
import { RecordingOverlay } from "@/components/recording-overlay"

interface CataloguePageProps {
  recordings: Recording[]
  treatment: GridTreatment
  /**
   * Show only the Recordings this visitor has bookmarked. The bookmarks route is
   * handed the whole catalogue and sets this, rather than filtering before it
   * hands the Recordings over: the saved set lives in here, and a route filtering
   * against its own second copy of that set would keep showing a card after the
   * visitor un-bookmarked it, until a reload.
   */
  bookmarkedOnly?: boolean
  /** Render the hero above the heading row. `/` sets it, `/products` and
   * `/bookmarks` do not (decision 10). */
  showHero?: boolean
  /** The three whole-catalogue counts the hero's stats row draws. Optional
   * because `/bookmarks` cannot supply them — this route is a client component
   * and counting here would pull the catalogue into a client chunk. */
  stats?: { recordings: number; contributors: number; categories: number }
  /** The whole catalogue's top view count, the denominator of every tile's
   * views bar. Threaded from the routes, like the Recordings themselves. */
  topViewCount: number
  /** The section head under the hero, computed by the route from the filter
   * state (lib/catalogue-heading.ts). This component does not derive it:
   * CataloguePage is a client component and the counts it would need are not
   * in the client graph. */
  heading: string
  /** Rendered above the sort controls: a heading, a hero, a newsletter form. */
  children?: ReactNode
}

export function CataloguePage({
  recordings,
  treatment,
  bookmarkedOnly = false,
  showHero = false,
  stats,
  heading,
  children,
  topViewCount,
}: CataloguePageProps) {
  const { ids: bookmarks, toggle: toggleBookmark } =
    useRememberedSet(BOOKMARKS_KEY)
  const { ids: votedRecordingIds, toggle: toggleVote } = useRememberedSet(
    VOTED_RECORDING_IDS_KEY
  )

  // Which Recording is open is the address, not state. The card pushes /recording/<id>
  // with the History API, which the App Router reflects back through
  // usePathname — no server render, no Firestore read, and Back closes the
  // panel because Back is the only close path there is.
  //
  // Searched against `recordings`, not the filtered or sorted list: un-bookmarking
  // the open Recording from inside the panel must not make the panel vanish
  // mid-interaction.
  const pathname = usePathname()
  const openRecording =
    (pathname.startsWith("/recording/") &&
      recordings.find((e) => e.id === pathname.slice("/recording/".length))) ||
    null

  // A set that has not been read yet means "nothing remembered so far", not
  // "everything". The distinction never used to matter: a hydration guard used to
  // sit under this memo and return before any of it was read. Once that went, a
  // null set on the bookmarks route fell through to the whole catalogue.
  const visible = useMemo(
    () =>
      bookmarkedOnly
        ? recordings.filter(
            (recording) => bookmarks?.includes(recording.id) ?? false
          )
        : recordings,
    [bookmarkedOnly, bookmarks, recordings]
  )
  const { sortedData, sort, setSort } = useSortedData(visible)

  // Which of the two empty states an empty list is, decided here because this is
  // the only place that knows. null means "not known yet, so say nothing".
  //
  // On the bookmarks route the question is answered by the stored set, not by the
  // rendered list: that route mounts with no Recordings and fills them from an
  // effect (app/bookmarks/page.tsx:27-44), so a message keyed on the rendered
  // list would tell a visitor who does have bookmarks that they have none, for as
  // long as the fetch takes. `bookmarks` is null until localStorage has been
  // read, which is the same "not known yet".
  //
  // The other routes are handed their Recordings by a server component, so an empty
  // list there is an answer rather than a gap.
  const emptyMessage = !bookmarkedOnly
    ? "No recordings match the current search or filters."
    : bookmarks?.length === 0
      ? "No bookmarked recordings yet. Bookmarks are kept in this browser on this device — there are no accounts, so they do not follow you to another browser or another device."
      : null

  return (
    <>
      {/* One owner for every Demo on the page, and the only thing that records a
          view. `suspended` reads the same open-Recording binding the overlay does —
          not a boolean of its own — so five Demos cannot keep decoding behind
          the tint, and closing re-grants whatever is still in view. */}
      <PlaybackOwner suspended={openRecording !== null}>
        <RecordingCardGrid
          sortedData={sortedData}
          treatment={treatment}
          emptyMessage={emptyMessage}
          hero={showHero && stats ? <Hero {...stats} /> : undefined}
          heading={heading}
          catalogueTotal={stats?.recordings}
          bookmarkedOnly={bookmarkedOnly}
          // Both stored sets are still null until an effect has read localStorage.
          // `[]` rather than a placeholder render: the server and the first client
          // render both see an empty set, so there is no hydration mismatch, and the
          // effect fills it on the next render. Waiting instead meant the served HTML
          // of every catalogue route was a bare `<div />` — no heading, no sort
          // controls, no Recordings.
          bookmarks={bookmarks ?? []}
          toggleBookmark={toggleBookmark}
          votedRecordingIds={votedRecordingIds ?? []}
          toggleVote={toggleVote}
          setSort={setSort}
          currentSort={sort}
          topViewCount={topViewCount}
        >
          {children}
        </RecordingCardGrid>
      </PlaybackOwner>

      {/* history.back() is the whole close path, so Escape, the close button,
          the tint and the browser's own Back button all do one identical thing.
          Safe because the overlay only opens on an /recording/… pathname this page
          pushed itself; a cold /recording/… renders app/recording/[id]/page.tsx, which
          has no overlay. */}
      <RecordingOverlay
        recording={openRecording}
        onClose={() => window.history.back()}
      />
    </>
  )
}
