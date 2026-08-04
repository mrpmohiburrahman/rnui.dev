// components/filter-dock.tsx
//
// The phone's only filter surface (CatalogueMobile.dc.html:44-80): a fixed bar
// across the bottom of the viewport holding `⚙ Filters` and `↕ Recent`, and a
// bottom sheet above it holding Categories, Contributors, sort and two actions.
// One component, because they are never used apart: both dock buttons open the
// same sheet, which already carries a SORT block — two filter surfaces on one
// screen is one more than the mock draws.
//
// Rendered from components/catalogue-page.tsx, not from the layout: only the
// Catalogue page knows the filtered count for `Show N recordings`, and a fixed
// `⚙ Filters` bar on /aboutus is the wrong-routes half of the old drawer.
//
// Whether the sheet is open is the address, not component state. A facet link
// is a real navigation that remounts the tree (hooks/use-sorted-data.ts:12-14),
// so `?filters=open` — carried along by facetHref like any other param — is the
// only state that survives the trip to /products and back.
"use client"

import { useRef } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import type { FacetCount } from "@/data/recording"
import * as Dialog from "@radix-ui/react-dialog"

import { FILTER_KEYS } from "@/lib/catalogue-filters"
import { cn } from "@/lib/utils"
import type { SortType } from "@/hooks/use-sorted-data"

import { facetHref, reportFacetClick } from "./nav/catalogue-nav"

/** The three sorts, with both labels this file draws for each: `sheet` inside
 *  the SORT block and `dock` on the bar's own button, which the drawing sets
 *  shorter (`:123` draws `Recent` and `Viewed`; `Voted` is the same
 *  extrapolation the desktop header makes for MOST VOTED, which no mock variant
 *  selects either). One table rather than two keyed on the same type, so a
 *  fourth sort cannot arrive in one of them. */
const SORTS: ReadonlyArray<{ value: SortType; sheet: string; dock: string }> = [
  { value: "recent", sheet: "Recent", dock: "Recent" },
  { value: "top-viewed", sheet: "Most viewed", dock: "Viewed" },
  { value: "top-voted", sheet: "Most voted", dock: "Voted" },
]

/** The mock's focus ring on every control in the dock and the sheet
 *  (`:45`, `:122`): `outline:3px solid acc` at 3px offset, `:focus-visible` so
 *  a tap draws nothing. */
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-[3px]"

/** Write the sheet's open flag with the History API, never router.replace:
 *  opening a panel must not buy a server render (the rule use-sorted-data.ts
 *  states for `sort`), and a mode is not a step, so no entry lands in session
 *  history — the acceptance pins history.length across an open and a close.
 *  Next reflects native History API writes back through useSearchParams, which
 *  this repo already depends on for the Recording overlay. */
function setFiltersOpen(open: boolean) {
  const params = new URLSearchParams(window.location.search)
  const { pathname } = window.location
  if (open) params.set("filters", "open")
  else params.delete("filters")
  const query = params.toString()
  const next = query ? `${pathname}?${query}` : pathname
  window.history.replaceState(null, "", next)
}

/** Clear all, keeping `sort` and `filters`. The desktop bar's clearAllHref
 *  drops the whole query, because on desktop sort lives in the header; here
 *  sort lives inside the sheet this button is part of, and a "Clear all" that
 *  also re-sorted the list would be the surprise the acceptance is about.
 *  Returns the pathname unchanged when nothing is left to keep. */
function clearFacetHref(current: URLSearchParams, pathname: string): string {
  const params = new URLSearchParams(current)
  // FILTER_KEYS, not a fourth spelling of the same three: the desktop bar and
  // the zero panel already clear by that list (components/filter-chips.tsx
  // :152-154), and a list that drifts is a Clear all that leaves one on.
  for (const key of [...FILTER_KEYS, "page"]) params.delete(key)
  const query = params.toString()
  return query ? `${pathname}?${query}` : pathname
}

/** The Specimen's bottom-sheet moment — 260ms, "no overshoot" — as the
 *  decelerate curve the other two long moments already use, on transform and
 *  opacity only so both directions are composited and cost the main thread
 *  nothing after the class flips. Not framer-motion: a JS spring runs its first
 *  frames on the main thread inside the INP window, on the device already at
 *  286ms p75.
 *
 *  A keyframe animation rather than a transition, for two reasons that are both
 *  about this being a Radix Dialog. The panel is portalled in already carrying
 *  `data-state="open"`, so a transition has no starting frame to leave and the
 *  enter plays instantly; and Radix's Presence holds a closing node mounted by
 *  watching `animationend` — it does not watch transitions, so a transitioned
 *  exit is unmounted before its first frame.
 *
 *  The four keyframes, the 260ms and the reduced-motion reset are in
 *  app/globals.css under `.sheet-scrim` / `.sheet-panel`, with the reasoning
 *  for not spelling them as tailwindcss-animate utilities. The figures there
 *  are ticket 02's tokens read through `theme()`, so the Specimen's number is
 *  still written exactly once, in the config. */
const SHEET_OVERLAY_CLASS = [
  "sheet-scrim",
  "fixed",
  "inset-0",
  "z-40",
  "bg-scrim",
  // No backdrop-filter: the mock blurs the desktop overlay's scrim and not
  // this one (Catalogue.dc.html:167 vs CatalogueMobile.dc.html:51), and a
  // full-viewport blur on a phone GPU is one of the cheapest ways to lose
  // frames — the drawing already says not to.
]

const SHEET_PANEL_CLASS = [
  "sheet-panel",
  "fixed",
  "inset-x-0",
  "bottom-0",
  "z-50",
  "flex",
  "max-h-[85svh]",
  "flex-col",
  "rounded-t-[20px]",
  "border-t",
  "border-line2",
  "bg-panel",
  "px-4",
  "pt-[14px]",
  "pb-[calc(18px+env(safe-area-inset-bottom,0px))]",
  "shadow-[0_-30px_70px_-20px_rgba(0,0,0,0.6)]",
]

/** The mono section label the sheet's three blocks share — the Specimen's
 *  `mono 9 / +14% · labels` tracking (Specimen.dc.html:144), not the rail's
 *  wider 0.16em: the two surfaces are drawn differently and both ship as drawn. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-2 font-mono text-[8.5px] tracking-[0.14em] text-t3">
      {children}
    </div>
  )
}

export function FilterDock({
  categories,
  contributors,
  resultCount,
  sort,
  setSort,
}: {
  categories?: FacetCount[]
  contributors?: FacetCount[]
  /** The count `Show N recordings` names: the number the grid has on screen,
   *  page-capped — the first number in the result line. */
  resultCount: number
  sort: SortType
  setSort: (next: SortType) => void
}) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const open = searchParams.get("filters") === "open"

  const activeCategory = searchParams.get("category")
  const activeContributor = searchParams.get("contributor")
  // The badge counts the two facets and not search: the mock's filtered
  // variant has searchText 'ticket' and still draws 2 (CatalogueMobile.dc.html
  // :112,:116). The same rule the rail's FACETS and filterApplied's
  // active_filter_count encode, so the badge and the event cannot disagree —
  // a search term has an event of its own and is not a Facet.
  const activeFacetCount = [activeCategory, activeContributor].filter(
    Boolean
  ).length
  const hasFilters = activeFacetCount > 0

  // /bookmarks passes neither list — it is "use client" and a value import of
  // @/data/* would drag data/catalogue.ts into a client chunk — and no facet
  // applies to a set the Remembered ids define anyway. So there is nothing for a
  // Filters button to open there, and the dock is the sort button alone at
  // `flex-1`, with the sheet showing only its SORT block.
  const hasFacets = Boolean(categories?.length || contributors?.length)

  // The sheet has no trigger Radix can see — opening is a URL write, not a
  // Dialog.Trigger — so the element focus returns to on close is named here.
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <>
      {/* The dock (CatalogueMobile.dc.html:44-47). `fixed`, not `absolute`:
          in a real document absolute resolves against the initial containing
          block and scrolls away, which is the defect ui-ux-overhaul ticket 11
          step 7 fixed and :48 annotates. The mock's own box — dockBg, a line2
          top border, and a 12px blur. */}
      <div
        data-testid="dock"
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-[9px] border-t border-line bg-dock px-[14px] pb-[calc(16px+env(safe-area-inset-bottom,0px))] pt-[12px] backdrop-blur-[12px] md:hidden"
      >
        {hasFacets && (
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={open}
            className={cn(
              "flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-[12px] border text-[13.5px] font-medium",
              FOCUS_RING,
              // Applied, or the sheet open: the accent fill, the mock's own
              // rule (CatalogueMobile.dc.html:117-122).
              hasFilters || open
                ? "border-acc bg-acc text-on-acc"
                : "border-line2 bg-field text-t1"
            )}
          >
            {/* The ⚙ is a picture and is hidden; the badge is not, so the
                accessible name is `Filters 2` — a control whose count only
                exists in pixels tells a screen reader nothing about how much
                is filtered. */}
            <span aria-hidden="true">⚙</span> Filters{" "}
            <span
              className={cn(
                "rounded-[5px] px-[6px] py-[2px] font-mono text-[11px] tabular-nums",
                hasFilters || open
                  ? "bg-[rgba(0,0,0,0.16)] text-on-acc"
                  : "bg-acc-soft text-t2"
              )}
            >
              {activeFacetCount}
            </span>
          </button>
        )}
        <button
          ref={hasFacets ? undefined : triggerRef}
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={cn(
            "flex min-h-[46px] items-center gap-[7px] rounded-[12px] border border-line2 bg-field px-[14px] text-[13px] text-t1",
            FOCUS_RING,
            hasFacets ? "flex-none" : "flex-1 justify-center"
          )}
        >
          <span aria-hidden="true">↕</span>{" "}
          {SORTS.find((item) => item.value === sort)!.dock}
        </button>
      </div>

      <Dialog.Root open={open} onOpenChange={setFiltersOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className={cn(SHEET_OVERLAY_CLASS)} />
          <Dialog.Content
            // No Dialog.Description: the title and the blocks below it are the
            // whole surface, and Radix warns about the missing id rather than
            // the missing prose (recording-overlay.tsx:183 does the same).
            aria-describedby={undefined}
            // Radix returns focus to whatever was focused before the open, which
            // is the dock button on every tapped path but is `body` on a cold
            // `?filters=open` load. Naming the button covers both, and it has to
            // happen here rather than in an effect on `open`: the dock is inside
            // the subtree Radix marks inert while the sheet is up, and an inert
            // element cannot take focus.
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              triggerRef.current?.focus()
            }}
            className={cn(SHEET_PANEL_CLASS)}
          >
            {/* The grabber (:53) — 38×4px of decoration, not draggable; the
                sheet has three real dismissals, the ✕, the scrim and Escape. */}
            <div
              aria-hidden="true"
              className="mx-auto mb-[14px] h-[4px] w-[38px] rounded-[3px] bg-line2"
            />
            {/* The title row (:54-56). Radix requires a Dialog.Title. */}
            <div className="flex items-center gap-[10px] pb-3">
              <Dialog.Title className="text-[15px] font-medium text-t1">
                Filter &amp; sort
              </Dialog.Title>
              <Dialog.Close
                aria-label="Close filters"
                className={cn(
                  "ml-auto flex min-h-[36px] min-w-[36px] items-center justify-center rounded-[9px] border border-acc bg-acc-soft text-[12px] text-t1",
                  FOCUS_RING
                )}
              >
                ✕
              </Dialog.Close>
            </div>

            {/* The scroll body: Categories, Contributors and Sort. `svh`, not
                `vh`: on iOS 100vh is the large viewport measured with the URL
                bar hidden, and eighteen Categories plus twenty-four
                Contributors is ~1,400px of content. `overscroll-contain` so a
                flick at the end of the Contributor list does not chain to the
                document behind it. */}
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {categories && (
                <>
                  <SectionLabel>CATEGORY · {categories.length}</SectionLabel>
                  <div className="flex flex-wrap gap-[7px] pb-[14px]">
                    {categories.map((category) => {
                      const on = activeCategory === category.name
                      return (
                        <Link
                          key={category.name}
                          href={facetHref(
                            searchParams,
                            "category",
                            category.name
                          )}
                          onClick={() =>
                            reportFacetClick(
                              searchParams,
                              "category",
                              category.name
                            )
                          }
                          prefetch={false}
                          className={cn(
                            "flex min-h-[34px] items-center gap-[6px] rounded-[9px] border px-[10px] text-[12px]",
                            FOCUS_RING,
                            on
                              ? "border-acc bg-acc-soft text-t1"
                              : "border-line text-t2"
                          )}
                        >
                          {category.name}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "font-mono text-[9.5px] tabular-nums",
                              on ? "text-acc" : "text-t3"
                            )}
                          >
                            {category.count}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}

              {contributors && (
                <>
                  <SectionLabel>
                    CONTRIBUTOR · {contributors.length}
                  </SectionLabel>
                  <div className="flex flex-col gap-[6px] pb-[14px]">
                    {contributors.map((contributor) => {
                      const on = activeContributor === contributor.name
                      return (
                        <Link
                          key={contributor.name}
                          href={facetHref(
                            searchParams,
                            "contributor",
                            contributor.name
                          )}
                          onClick={() =>
                            reportFacetClick(
                              searchParams,
                              "contributor",
                              contributor.name
                            )
                          }
                          prefetch={false}
                          className={cn(
                            "flex min-h-[38px] items-center gap-2 rounded-[9px] px-[11px] text-[12.5px]",
                            FOCUS_RING,
                            on
                              ? "border border-acc bg-acc-soft text-t1"
                              : "border border-line text-t2"
                          )}
                        >
                          <span className="min-w-0 truncate">
                            {contributor.name}
                          </span>
                          <span
                            aria-hidden="true"
                            className={cn(
                              "ml-auto flex-none font-mono text-[10px] tabular-nums",
                              on ? "text-acc" : "text-t3"
                            )}
                          >
                            {contributor.count}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Sort (:70-74). Sentence case here, where the desktop header
                  draws mono uppercase. No new analytics event: setSort fires
                  sortChanged from inside the hook already. */}
              <SectionLabel>SORT</SectionLabel>
              <div className="flex gap-[7px] pb-4">
                {SORTS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setSort(item.value)}
                    className={cn(
                      "min-h-[38px] flex-1 rounded-[9px] border text-center text-[12px] leading-[38px]",
                      FOCUS_RING,
                      sort === item.value
                        ? "border-acc bg-acc-soft text-t1"
                        : "border-line text-t2"
                    )}
                  >
                    {item.sheet}
                  </button>
                ))}
              </div>
            </div>

            {/* The actions row (:75-78), fixed below the scroll body. */}
            <div className="flex gap-[9px] pt-1">
              <Link
                // The sheet keeps `sort` and `filters`; Clear all that also
                // re-sorted would be the surprise above.
                href={clearFacetHref(searchParams, pathname)}
                aria-disabled={!hasFilters}
                tabIndex={hasFilters ? 0 : -1}
                className={cn(
                  "flex min-h-[46px] flex-none items-center rounded-[12px] border border-line2 px-4 text-[13px]",
                  FOCUS_RING,
                  hasFilters ? "text-t1" : "pointer-events-none opacity-50"
                )}
              >
                Clear all
              </Link>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className={cn(
                  "min-h-[46px] flex-1 rounded-[12px] bg-acc text-[13.5px] font-medium text-on-acc",
                  FOCUS_RING
                )}
              >
                Show {resultCount} recording{resultCount === 1 ? "" : "s"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
