// components/recording-card-grid.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { Recording } from "@/data/recording"

import { loadMoreClicked, searchPerformed } from "@/lib/analytics"
import { cn } from "@/lib/utils"

import { RecordingCard } from "./recording-card"

/** How many Recordings one page of the grid renders. The catalogue is 277. */
const PAGE_SIZE = 48

/**
 * The pill treatment for the Load more control. It used to be shared by the
 * Last updated and Total items pills, which moved into the site header (ticket
 * 04); the class is kept here so Load more introduces no colour, radius or
 * shadow value that was not already on the page.
 */
const PILL_CLASS =
  "px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] "

/**
 * Which of the two visual treatments to render. `framed` wraps the heading row
 * and the grid in a panel; `plain` leaves both bare.
 *
 * It is a required prop rather than a default because it used to be a substring
 * test against the current address, performed in here: invisible from every call
 * site, and wrong the moment a route was added.
 */
export type GridTreatment = "framed" | "plain"

export interface RecordingCardGridProps {
  sortedData?: Recording[]
  treatment: GridTreatment
  /**
   * What to say when there is nothing to show, or null when the caller cannot
   * yet tell whether there is anything — an empty list is a gap during a fetch
   * as often as it is an answer, and a message shown across that gap is a false
   * one.
   *
   * Required rather than defaulted: only the caller knows whether an empty list
   * means "no Recording matches this filter" or "this visitor has bookmarked
   * nothing", and a default here would quietly show the wrong one of those.
   */
  emptyMessage: string | null
  children?: React.ReactNode
  bookmarks: string[]
  toggleBookmark: (id: string) => void
  votedRecordingIds: string[]
  toggleVote: (id: string) => void
  /**
   * The phone's only sort control. The desktop pills this grid used to render
   * moved into the header (ticket 04 step 7), and below `md` the header draws no
   * sort control at all (step 10) — so this dropdown, `flex sm:hidden`, is the
   * only one there is on a phone until ticket 11 replaces it with the filter
   * dock's sort. It writes the same `?sort=` the header writes, through the same
   * hook.
   */
  setSort?: (sort: "recent" | "top-voted" | "top-viewed") => void
  currentSort?: "recent" | "top-voted" | "top-viewed"
}

export const RecordingCardGrid: React.FC<RecordingCardGridProps> = ({
  sortedData,
  treatment,
  emptyMessage,
  children,
  bookmarks,
  toggleBookmark,
  votedRecordingIds,
  toggleVote,
  setSort,
  currentSort,
}) => {
  const [isSortDropdownOpen, setSortDropdownOpen] = useState(false)
  // Pagination lives in the URL, not in state, so a page is shareable and Back
  // returns to the previous count. `page` is the only reader of the param that
  // catalogue-search.tsx has been deleting on every keystroke all along, which
  // is what makes a search reset to the first page.
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const total = sortedData?.length ?? 0
  const shownCount = page * PAGE_SIZE
  const hasMore = total > shownCount
  const isEmpty = total === 0

  // pushState rather than router.push: the App Router picks it up through
  // useSearchParams, so it costs no server render and no Firestore read, it does
  // not move the scroll position, and Back pops to the previous count.
  const loadMore = () => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(page + 1))
    window.history.pushState(null, "", `?${params}`)
    // The page and count the click arrives at, not the ones it left. The last
    // page is short, so `recordings_shown` is capped at what exists rather than
    // being page × 48.
    loadMoreClicked(page + 1, Math.min((page + 1) * PAGE_SIZE, total))
  }

  // `search_performed` is reported from here rather than from the search box,
  // because only this component has the other half of it: the box knows the
  // term and nothing else knows how many Recordings came back. The URL is what the
  // 300ms debounce settles into (components/catalogue-search.tsx:43), so one
  // settled search is exactly one change of this value.
  //
  // The term itself never leaves this closure — `searchPerformed` takes a
  // length. `null` means nothing has been reported yet, which is how a page
  // arriving at /?search=slider from a shared link stays silent: nobody typed.
  const search = searchParams.get("search") ?? ""
  const reported = useRef<string | null>(null)
  useEffect(() => {
    if (reported.current === search) return
    const first = reported.current === null
    reported.current = search
    // Clearing the box is not a search, and neither is the first paint.
    if (first || !search) return
    searchPerformed(search.length, total)
  }, [search, total])

  return (
    <div
      // style={{ borderWidth: 1, borderColor: "purple" }}
      className="flex flex-col md:items-start gap-4 overflow-hidden pb-4 md:mx-4 mx-0  relative"
    >
      <div
        className={cn(
          "px-4",
          treatment === "plain"
            ? "md:p-4 md:gap-3"
            : "bg-white p-4 gap-3 dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
        )}
      >
        {children}
      </div>
      {/* The desktop sort pills, the counter line and the Last updated / Total
          items pills all moved into the site header (ticket 04 steps 7 and 4);
          the only sort control left here is the phone dropdown below, `flex
          sm:hidden`, which the header below `md` does not replace. */}
      <div className="flex sm:hidden flex-col w-full">
        <button
          type="button"
          className="w-full px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-inner border-2 border-transparent flex justify-between items-center transition-colors duration-200"
          onClick={() => setSortDropdownOpen(!isSortDropdownOpen)}
          aria-haspopup="true"
          aria-expanded={isSortDropdownOpen}
        >
          <span>
            {currentSort === "recent"
              ? "Recent"
              : currentSort === "top-viewed"
                ? "Top Viewed"
                : "Top Voted"}
          </span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${
              isSortDropdownOpen ? "transform rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        {isSortDropdownOpen && (
          <div className="mt-2 w-full bg-white dark:bg-[#1E1E1E] rounded-[1rem] shadow-inner border border-transparent">
            <button
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-t-[1rem] transition-colors duration-200"
              onClick={() => {
                setSort?.("recent")
                setSortDropdownOpen(false)
              }}
            >
              Recent
            </button>
            <button
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] transition-colors duration-200"
              onClick={() => {
                setSort?.("top-viewed")
                setSortDropdownOpen(false)
              }}
            >
              Top Viewed
            </button>
            <button
              type="button"
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-[#2E2E2E] rounded-b-[1rem] transition-colors duration-200"
              onClick={() => {
                setSort?.("top-voted")
                setSortDropdownOpen(false)
              }}
            >
              Top Voted
            </button>
          </div>
        )}
      </div>
      <div
        className={cn(
          "p-4 w-full",
          treatment === "plain"
            ? ""
            : "bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]"
        )}
      >
        {/* No Suspense boundary. Nothing below here is async — every card
            renders from props already in hand — but the server still emitted
            the "Loading…" fallback and streamed all 277 cards into a
            `<div hidden>` for an inline script to swap in. A visitor with
            JavaScript off never got that swap, so the catalogue stayed hidden
            inside markup that had been there all along. The sidebar keeps its
            boundary, because that one suspends for real on useSearchParams. */}
        <div className="relative">
          {/* An empty list used to render an empty grid: the only thing on
              screen was `Total Items: 0`, on a filtered catalogue and on a
              /bookmarks page with nothing saved alike. Both paths arrive here,
              because CataloguePage is the only caller. */}
          {isEmpty && emptyMessage ? (
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              {emptyMessage}
            </p>
          ) : (
            /* Adjusted Grid Columns for Smaller Portrait Cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {/* Keyed by id alone. The key used to carry the array index, so
                  every key changed when the list reordered and a sort toggle
                  unmounted and remounted all 277 cards, restarting every Demo.
                  Ids are unique — tests/data-integrity.test.ts enforces it. */}
              {sortedData
                ?.slice(0, shownCount)
                .map((recording) => (
                  <RecordingCard
                    key={recording.id}
                    recording={recording}
                    isBookmarked={bookmarks.includes(recording.id)}
                    toggleBookmark={toggleBookmark}
                    isVoted={votedRecordingIds.includes(recording.id)}
                    toggleVote={toggleVote}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
      {hasMore && (
        <button
          type="button"
          className={cn(PILL_CLASS, "self-center")}
          onClick={loadMore}
        >
          Load more
        </button>
      )}
    </div>
  )
}
