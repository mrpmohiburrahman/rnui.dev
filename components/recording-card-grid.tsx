// components/entry-card-grid.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import type { Entry } from "@/data/entry"

import { loadMoreClicked, searchPerformed } from "@/lib/analytics"
import { cn } from "@/lib/utils"

import { EntryCard } from "./entry-card"
import LastUpdated from "./last-updated"

/** How many Entries one page of the grid renders. The catalogue is 277. */
const PAGE_SIZE = 48

/**
 * The pill treatment, verbatim from the Last updated and Total items controls
 * below. Shared so the new Load more control introduces no colour, radius or
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

export interface EntryCardGridProps {
  sortedData?: Entry[]
  treatment: GridTreatment
  /**
   * What to say when there is nothing to show, or null when the caller cannot
   * yet tell whether there is anything — an empty list is a gap during a fetch
   * as often as it is an answer, and a message shown across that gap is a false
   * one.
   *
   * Required rather than defaulted: only the caller knows whether an empty list
   * means "no Entry matches this filter" or "this visitor has bookmarked
   * nothing", and a default here would quietly show the wrong one of those.
   */
  emptyMessage: string | null
  children?: React.ReactNode
  bookmarks: string[]
  toggleBookmark: (id: string) => void
  votedEntryIds: string[]
  toggleVote: (id: string) => void
  setSort?: (sort: "recent" | "top-voted" | "top-viewed") => void // New prop
  currentSort?: "recent" | "top-voted" | "top-viewed" // New prop
}

export const EntryCardGrid: React.FC<EntryCardGridProps> = ({
  sortedData,
  treatment,
  emptyMessage,
  children,
  bookmarks,
  toggleBookmark,
  votedEntryIds,
  toggleVote,
  setSort, // Destructure new prop
  currentSort, // Destructure new prop
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
    // page is short, so `entries_shown` is capped at what exists rather than
    // being page × 48.
    loadMoreClicked(page + 1, Math.min((page + 1) * PAGE_SIZE, total))
  }

  // `search_performed` is reported from here rather than from the search box,
  // because only this component has the other half of it: the box knows the
  // term and nothing else knows how many Entries came back. The URL is what the
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
      {/* Wraps, and spaces its lines with `gap-y` rather than `space-y`.
          The three sort pills have a 278px min-content and the two status pills
          191px; together 470px, against the 440px `main` actually has at 640px
          (a 640px viewport less the sidebar's 168px margin and this column's
          32px of padding). A flex item cannot shrink below its min-content, so
          `main` was floored at 502px and the document scrolled sideways for the
          640-670px band — the band where the sidebar appears and this row turns
          horizontal, but nothing is wide enough for both yet.

          `gap-y-4` in place of `space-y-4 sm:space-y-0` because `space-y` is a
          margin on every child but the first, which lands on the first item of
          a wrapped line too. The two spell the same 16px in the column layout
          and in the unwrapped row, so nothing moves where it already fitted. */}
      <div className="flex flex-wrap flex-col sm:flex-row justify-between w-full items-start sm:items-center gap-y-4">
        {setSort && currentSort && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            {/* Desktop Sorting Buttons */}
            <div className="hidden sm:flex flex-row space-x-4 w-full">
              <button
                type="button"
                className={` px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${
                  currentSort === "recent" ? "border-2 border-gray-100" : ""
                }`}
                onClick={() => setSort("recent")}
              >
                <span className="w-full text-center">Recent</span>
              </button>

              <button
                type="button"
                className={`px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${
                  currentSort === "top-viewed" ? "border-2 border-gray-100" : ""
                }`}
                onClick={() => setSort("top-viewed")}
              >
                <span className="w-full text-center">Top Viewed</span>
              </button>
              <button
                type="button"
                className={`px-4 py-2 bg-white dark:bg-[#1E1E1E] rounded-[2rem] shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)] ${
                  currentSort === "top-voted" ? "border-2 border-gray-100" : ""
                }`}
                onClick={() => setSort("top-voted")}
              >
                <span className="w-full text-center">Top Voted</span>
              </button>
            </div>
          </div>
        )}

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
        {/* last updade and total number of ites */}
        <div className="flex flex-row space-x-4">
          <button type="button" className={PILL_CLASS}>
            <LastUpdated />
          </button>
          {/* Counts the whole set, not the rendered slice. */}
          <button type="button" className={PILL_CLASS}>
            <span>Total Items: {sortedData?.length}</span>
          </button>
        </div>
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
              {sortedData?.slice(0, shownCount).map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  isBookmarked={bookmarks.includes(entry.id)}
                  toggleBookmark={toggleBookmark}
                  isVoted={votedEntryIds.includes(entry.id)}
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
