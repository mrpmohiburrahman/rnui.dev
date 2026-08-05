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
import { usePathname, useSearchParams } from "next/navigation"
import type { FacetCount, Recording } from "@/data/recording"

import type { CatalogueDiagnosis } from "@/lib/catalogue-filters"
import {
  BOOKMARKS_KEY,
  useRememberedSet,
  VOTED_RECORDING_IDS_KEY,
} from "@/hooks/use-remembered-set"
import useSortedData from "@/hooks/use-sorted-data"
import type { EmptyState } from "@/components/catalogue-empty"
import { FilterDock } from "@/components/filter-dock"
import { Hero } from "@/components/hero"
import { PlaybackOwner } from "@/components/playback-owner"
import { RecordingCardGrid, shownCount } from "@/components/recording-card-grid"
import { RecordingOverlay } from "@/components/recording-overlay"

interface CataloguePageProps {
  recordings: Recording[]
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
  /** Whole-catalogue Recordings per Contributor — `RECORDINGS_PER_CONTRIBUTOR`,
   * step 1's `catalogueFacts.perContributor`, folded in beside `stats` rather
   * than added as a second facts object. Both server routes pass it because
   * both hand over a filtered set, and a count derived from a filtered set is
   * the size of the filter. `/bookmarks` omits it: that route fetches the whole
   * catalogue and filters in here, so deriving is exact.
   *
   * Passing the map as a prop value does not put data/catalogue in a client
   * chunk — it travels as RSC payload data, 23 entries, exactly as `stats`
   * already does. */
  perContributor?: Record<string, number>
  /** The whole catalogue's top view count, the denominator of every tile's
   * views bar. Threaded from the routes, like the Recordings themselves. */
  topViewCount: number
  /** The section head under the hero, computed by the route from the filter
   * state (lib/catalogue-heading.ts). This component does not derive it:
   * CataloguePage is a client component and the counts it would need are not
   * in the client graph. */
  heading: string
  /** Why the filtered catalogue is empty, computed by the route's server
   * component and passed straight through — this module is "use client" and
   * the diagnosis needs the whole catalogue to answer "what would I see if I
   * dropped this one filter". Absent on /bookmarks, which can never show the
   * zero panel. */
  diagnosis?: CatalogueDiagnosis | null
  /** Rendered above the sort controls: a heading, a hero, a newsletter form. */
  children?: ReactNode
  /** The phone filter sheet's two facet lists. Passed by the routes that can
   *  (server components reading data/recording.ts), and absent on /bookmarks,
   *  which is "use client" and must not value-import @/data/* into a client
   *  chunk (components/catalogue-search.tsx:54-57). On that route the dock
   *  renders the sort button alone and the sheet shows only its SORT block. */
  categories?: FacetCount[]
  contributors?: FacetCount[]
}

export function CataloguePage({
  recordings,
  bookmarkedOnly = false,
  showHero = false,
  stats,
  perContributor,
  heading,
  diagnosis,
  children,
  topViewCount,
  categories,
  contributors,
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

  // The filter dock's `Show N recordings` names the count the grid actually
  // has on screen — page-capped, which is the first number in the result line
  // (recording-card-grid.tsx computes the same figure from the same `page`).
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const resultCount = shownCount(page, sortedData.length)

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
  //
  // `null` also covers the one case where there is nothing truthful to say: an
  // empty list with no filter on it, which is what get-recordings.ts returns
  // when the Firestore read throws. The zero panel diagnoses filters, and there
  // are none, so it would draw an empty box.
  const emptyState: EmptyState | null = !bookmarkedOnly
    ? diagnosis
      ? { kind: "zero", diagnosis }
      : null
    : bookmarks?.length === 0
      ? { kind: "saved" }
      : null

  // What the open Recording's detail draws.
  //
  // `contributorTotal` is the route's whole-catalogue map when it supplies one,
  // and only falls back to counting the Recordings in hand when it does not
  // (/bookmarks, where the two are the same answer). It used to always count the
  // set in hand, which on /products?category=X is the *filtered* set — so the
  // panel read "3 of the 277 recordings here are theirs" with a `See all 3 →`
  // that landed on a page showing 124. The numerator was of the filter and the
  // denominator was of the catalogue.
  //
  // `more` stays derived from the set in hand, deliberately: step 8 wants the
  // Recordings themselves and getting those from anywhere else means importing
  // data/catalogue into a client chunk. So on a filtered route the See-all link
  // can now name a bigger number than the strip below it shows, which is the
  // honest pair — the link goes where it says it goes.
  const sameCategory = useMemo(
    () => recordings.filter((r) => r.category === openRecording?.category),
    [recordings, openRecording]
  )
  const catalogueTotalProvided = stats?.recordings ?? recordings.length
  const contributorTotal = openRecording
    ? (perContributor?.[openRecording.contributor] ??
      recordings.filter((r) => r.contributor === openRecording.contributor)
        .length)
    : 0
  const more = useMemo(() => {
    if (!openRecording) return []
    return recordings
      .filter(
        (r) =>
          r.contributor === openRecording.contributor &&
          r.id !== openRecording.id
      )
      .slice(0, 2)
  }, [recordings, openRecording])

  return (
    <>
      {/* One owner for every Demo on the page, and the only thing that records a
          view. `suspended` reads the same open-Recording binding the overlay does —
          not a boolean of its own — so five Demos cannot keep decoding behind
          the tint, and closing re-grants whatever is still in view. */}
      <PlaybackOwner suspended={openRecording !== null}>
        <RecordingCardGrid
          sortedData={sortedData}
          emptyState={emptyState}
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
          currentSort={sort}
          topViewCount={topViewCount}
        >
          {children}
        </RecordingCardGrid>
      </PlaybackOwner>

      {/* The phone's filter surface: the fixed dock and the bottom sheet. Below
          `md` only, and only on the three catalogue routes — this is the one
          module they all render, and the reason it lives here rather than in
          the layout, which is never handed searchParams or a filtered count. */}
      <FilterDock
        categories={categories}
        contributors={contributors}
        resultCount={resultCount}
        sort={sort}
        setSort={setSort}
      />

      {/* history.back() is the whole close path, so every close — Escape, the
          close button, the scrim, browser Back — does one identical thing. Safe
          because the overlay only opens on an /recording/… pathname this page
          pushed itself; a cold /recording/… renders app/recording/[id]/page.tsx,
          which has no overlay. */}
      <RecordingOverlay
        recording={openRecording}
        onClose={() => window.history.back()}
        topViewCount={topViewCount}
        catalogueTotal={catalogueTotalProvided}
        contributorTotal={contributorTotal}
        more={more}
        sequence={sameCategory}
        saved={
          openRecording
            ? (bookmarks?.includes(openRecording.id) ?? false)
            : false
        }
        voted={
          openRecording
            ? (votedRecordingIds?.includes(openRecording.id) ?? false)
            : false
        }
        onToggleSave={() => openRecording && toggleBookmark(openRecording.id)}
        onToggleVote={() => openRecording && toggleVote(openRecording.id)}
        // The same two sets again, by id, for the detail's MORE FROM THIS
        // CONTRIBUTOR strip — which draws the catalogue's own Tile, controls
        // included, exactly as Detail.dc.html:83 imports it.
        savedIds={bookmarks ?? []}
        votedIds={votedRecordingIds ?? []}
        onToggleSaveId={toggleBookmark}
        onToggleVoteId={toggleVote}
      />
    </>
  )
}
