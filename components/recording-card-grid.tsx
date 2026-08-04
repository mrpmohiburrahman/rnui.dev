// components/recording-card-grid.tsx
"use client"

import { useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import type { Recording } from "@/data/recording"

import { loadMoreClicked, searchPerformed } from "@/lib/analytics"
import { catalogueResultLine } from "@/lib/catalogue-heading"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"
import { CatalogueEmpty, type EmptyState } from "./catalogue-empty"
import { FilterChips } from "./filter-chips"
import { RecordingCard } from "./recording-card"

/** How many Recordings one page of the grid renders. The catalogue is 277. */
const PAGE_SIZE = 48

/**
 * How many Recordings are on screen: whole pages, capped at what exists. This
 * is the first number in the result line, and the filter dock's
 * `Show N recordings` is the same figure — the acceptance pins the two together
 * ("N matches the first number in the result line"), so they share the
 * arithmetic rather than each doing it. `page` is read from the URL by both
 * callers, which is where pagination lives.
 */
export function shownCount(page: number, total: number): number {
  return Math.min(page * PAGE_SIZE, total)
}

/**
 * The mock's tile width at both of the two widths it draws — 208px desktop
 * (Catalogue.dc.html:91) and 163px phone (CatalogueMobile.dc.html:37) — with
 * their own column and row gaps, 16/20 and 24/28.
 *
 * `auto-fill` rather than the mock's literal `repeat(5, 208px)`: the container
 * width belongs to the shell and the rail, and a hard five would overflow the
 * moment either moved. A fixed track fits as many as the box holds and can never
 * exceed it, so `scrollWidth === clientWidth` holds at every width by
 * construction. The card stays `w-full`, which is the other half of that
 * criterion — ticket 12's defect was card width ≠ track width, not fixed tracks.
 */
const GRID_CLASS =
  "grid grid-cols-[repeat(auto-fill,163px)] sm:grid-cols-[repeat(auto-fill,208px)] gap-x-4 gap-y-5 sm:gap-x-6 sm:gap-y-7"

export interface RecordingCardGridProps {
  sortedData?: Recording[]
  /**
   * Which panel to render when there is nothing to show, or null when the caller
   * cannot yet tell whether there is anything — an empty list is a gap during a
   * fetch as often as it is an answer, and a panel shown across that gap is a
   * false one.
   *
   * Required rather than defaulted: only the caller knows whether an empty list
   * means "no Recording matches this filter" or "this visitor has bookmarked
   * nothing", and a default here would quietly show the wrong one of those.
   */
  emptyState: EmptyState | null
  children?: React.ReactNode
  bookmarks: string[]
  toggleBookmark: (id: string) => void
  votedRecordingIds: string[]
  toggleVote: (id: string) => void
  /** The current sort, for the result line's SORTED tail. The controls that
   *  change it live in the header (desktop) and the filter dock's sheet
   *  (phone), both of which write the same `?sort=` through the same hook. */
  currentSort?: "recent" | "top-voted" | "top-viewed"
  /**
   * The catalogue hero, rendered above the heading row and outside the framed
   * panel. Absent on `/products` and `/bookmarks`, which show only the heading.
   * When present, the heading below is an `h2` so the page keeps exactly one
   * `h1` (the hero's).
   */
  hero?: React.ReactNode
  /**
   * The section head text. This grid owns the heading element but not the
   * string — a route computes it from the filter state.
   */
  heading: string
  /** The whole catalogue size, always 277 — never the filtered set. Used as the
   * denominator of the result line. Absent on `/bookmarks`, whose saved view has
   * no denominator. */
  catalogueTotal?: number
  /** The whole catalogue's top view count, the denominator of every tile's views
   * bar (ticket 07 step 8). Threaded from the routes. */
  topViewCount: number
  /** Show only bookmarked Recordings; selects the `N SAVED · THIS BROWSER` form
   * of the result line. */
  bookmarkedOnly?: boolean
}

export const RecordingCardGrid: React.FC<RecordingCardGridProps> = ({
  sortedData,
  emptyState,
  children,
  bookmarks,
  toggleBookmark,
  votedRecordingIds,
  toggleVote,
  currentSort,
  hero,
  heading,
  catalogueTotal,
  bookmarkedOnly,
  topViewCount,
}) => {
  // Pagination lives in the URL, not in state, so a page is shareable and Back
  // returns to the previous count. `page` is the only reader of the param that
  // catalogue-search.tsx has been deleting on every keystroke all along, which
  // is what makes a search reset to the first page.
  const searchParams = useSearchParams()
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const total = sortedData?.length ?? 0
  // `pageEnd` is where the slice stops and may run past the data; `shown` is
  // what is actually on screen, and is the number the result line and the
  // filter dock's `Show N recordings` both print.
  const pageEnd = page * PAGE_SIZE
  const hasMore = total > pageEnd
  const isEmpty = total === 0
  const shown = shownCount(page, total)

  // The number of category / contributor / search filters that are on, read
  // from the same useSearchParams already in hand. It drives the FILTERS tail of
  // the result line, not any heading logic — a search term never enters the
  // heading (lib/catalogue-heading.ts).
  const activeCategory = searchParams.get("category") ?? ""
  const activeContributor = searchParams.get("contributor") ?? ""
  const search = searchParams.get("search") ?? ""
  const filterCount = [activeCategory, activeContributor, search].filter(
    Boolean
  ).length

  // A reduced-motion visitor sees the whole catalogue as stills, so the result
  // line says so where the mock draws it (Catalogue.dc.html:216). This is the
  // `48 OF 277 · STILLS ONLY` handover from ticket 08 — the grid reads its own
  // preference rather than being told, because the saved view and the filter
  // view already print their own tails and only the unfiltered resting view has
  // a STILLS variant to give. The server snapshot `false` means the served HTML
  // claims nothing it does not deliver for a visitor who will play Demos, and
  // the line flips to STILLS ONLY only where the browser says reduce
  // (hooks/use-prefers-reduced-motion.ts).
  const reducedMotion = usePrefersReducedMotion(false)

  const resultLine = catalogueResultLine({
    shown,
    // The saved view's form has no denominator, so `total` is the safe
    // fallback when a route (bookmarks) supplies none.
    catalogueTotal: catalogueTotal ?? total,
    filterCount,
    savedView: bookmarkedOnly,
    sort: currentSort ?? "recent",
    reducedMotion,
  })

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
    loadMoreClicked(page + 1, shownCount(page + 1, total))
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
    // `pb-[calc(96px+...)] md:pb-4`: below `md` the filter dock is a fixed bar
    // at the bottom of the viewport (CatalogueMobile.dc.html:32 draws the 96px
    // as the dock's clearance), and without the reserve the last row of the
    // grid sits under it forever. At `md` the dock is gone and the padding
    // returns to the grid's own 1rem.
    <div className="relative flex w-full flex-col gap-4 overflow-hidden pb-[calc(96px+env(safe-area-inset-bottom,0px))] md:items-start md:pb-4">
      {hero && <div className="w-full">{hero}</div>}
      {children && <div className="w-full">{children}</div>}
      {/* The desktop filter bar, Catalogue.dc.html:76-82, above the heading row
          exactly as the mock stacks them — below `md` the phone's own chips row
          (components/site-header.tsx) is the filter surface and this bar is
          `md` and up only. It draws itself only when a facet is on, so every
          unfiltered route renders nothing. Not on the saved view: the three
          params do not filter it, and a chip naming a filter that filters
          nothing is the sort of thing decision 2 forbids. */}
      {!bookmarkedOnly && (
        <div className="hidden w-full md:block">
          <FilterChips />
        </div>
      )}
      {/* The heading row, Catalogue.dc.html:85-88: the section head on the
          left and the mono result line right-aligned on a reserved width. The
          heading is an h2 when the hero is present and an h1 when it is not, so
          every route carries exactly one h1 — /products has none without this.
          The `min-width:180px` and tabular-nums are not decoration: the result
          count occupies its exact reserved width as tabular monospace so
          nothing reflows when the real number replaces an estimate. */}
      <div className="flex items-baseline justify-between gap-4 pb-[14px] w-full">
        {hero ? (
          <h2 className="text-section m-0 text-t1">{heading}</h2>
        ) : (
          <h1 className="text-section m-0 text-t1">{heading}</h1>
        )}
        <span className="text-[10px] font-mono tracking-[0.1em] text-t3 min-w-[180px] text-right tabular-nums">
          {resultLine}
        </span>
      </div>
      <div className="w-full">
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
              because CataloguePage is the only caller.

              The panel replaces the grid rather than sitting under it, as the
              mock's own switch does (Catalogue.dc.html:247), and the min-height
              is that switch's other half (:252) — without it the footer rides up
              under a 620px-shorter page. */}
          {isEmpty && emptyState ? (
            <div className="sm:min-h-[620px]">
              <CatalogueEmpty
                state={emptyState}
                catalogueTotal={catalogueTotal ?? total}
              />
            </div>
          ) : (
            <div className={GRID_CLASS}>
              {/* Keyed by id alone. The key used to carry the array index, so
                  every key changed when the list reordered and a sort toggle
                  unmounted and remounted all 277 cards, restarting every Demo.
                  Ids are unique — tests/data-integrity.test.ts enforces it. */}
              {sortedData?.slice(0, pageEnd).map((recording, i, shown) => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  // The second of two adjacent tiles by the same Contributor
                  // repeats its byline prefixed `↳ ` and in t3 — what the
                  // mock's runRepeat means (Tile.dc.html:108-109). The grid
                  // knows the neighbour; the card does not.
                  repeatsContributor={
                    i > 0 && shown[i - 1].contributor === recording.contributor
                  }
                  topViewCount={topViewCount}
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
      {/* Load more, Catalogue.dc.html:125-127. The label is derived rather than
          the mock's flat `Load 48 more`: the last page is short — 277 less five
          pages of 48 is 37 — and decision 2 is that nothing on screen lies.
          `total` under it is the filtered count, not catalogueTotal: the heading
          row answers "how much of the catalogue is this", this line answers "how
          much of this result set is on screen", and printing 277 under a
          60-result search would be false. */}
      {hasMore && (
        <div className="flex w-full flex-col items-center gap-[11px] pb-[6px] pt-[42px]">
          <button
            type="button"
            className="rounded-[11px] border border-line2 bg-field px-[26px] py-3 text-[13.5px] font-medium text-t1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-[3px]"
            onClick={loadMore}
          >
            Load {Math.min(PAGE_SIZE, total - shown)} more
          </button>
          <span className="font-mono text-metric tracking-[0.1em] text-t3">
            {shown} OF {total} SHOWN · NO INFINITE SCROLL
          </span>
        </div>
      )}
      {/* The end of the set, Catalogue.dc.html:132-141 — every card in a
          non-empty result set is on screen, whether that took five pages or
          none. The mock draws only END OF CATALOGUE, on its unfiltered variant;
          `END OF CATALOGUE · 60 OF 60` under a Category filter would be false, so
          one word is derived. */}
      {!hasMore && total > 0 && (
        <div className="w-full">
          <div className="flex items-center gap-4 pb-[4px] pt-[34px]">
            <div className="h-px flex-1 bg-line" />
            <span className="font-mono text-metric tracking-[0.14em] text-t3">
              {filterCount > 0 || bookmarkedOnly
                ? "END OF RESULTS"
                : "END OF CATALOGUE"}{" "}
              · {total} OF {total}
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>
          <div className="flex items-center justify-center gap-[10px] pt-[18px] text-[12.5px]">
            {/* No smooth behaviour: smooth scrolling is one of the things
                prefers-reduced-motion exists to suppress, and a jump needs no
                exception. */}
            <button
              type="button"
              className="text-acc underline underline-offset-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
              onClick={() => window.scrollTo(0, 0)}
            >
              Back to top ↑
            </button>
            <span aria-hidden="true" className="text-t3">
              ·
            </span>
            {/* Not repoClicked: that event is about following a Recording's
                Source link (lib/analytics.ts:109-113) and this link belongs to
                no Recording. */}
            <a
              href="https://github.com/mrpmohiburrahman/awesome-react-native-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="text-acc underline underline-offset-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
            >
              Add your own recording on GitHub ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
