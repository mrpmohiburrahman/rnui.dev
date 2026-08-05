// components/site-header.tsx
//
// The 62px in-flow header the mock draws (Catalogue.dc.html:13-33), with the
// Suspense split the rail already uses. It needs useSearchParams (sort, search
// seed), usePathname (the Saved chip's active state) and useRememberedSet, so it
// is a client component; useSearchParams opts every ancestor out of prerendering,
// so the hook stays behind a Suspense boundary of its own and the fallback
// renders the same header from an empty URLSearchParams — the served HTML thus
// carries the whole control set, as the rail's fallback does.
"use client"

import { Suspense, useEffect } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { BOOKMARKS_KEY, useRememberedSet } from "@/hooks/use-remembered-set"
import { applySort, type SortType } from "@/hooks/use-sorted-data"
import { formatUpdatedCompact, lastCommitDate } from "@/components/last-updated"
import { ModeToggle } from "@/app/providers"

import { CatalogueSearch } from "./catalogue-search"
import { CHIPS } from "./filter-chips"
import { facetHref, reportFacetClick } from "./nav/catalogue-nav"

export type SiteHeaderProps = {
  /** allRecordings.length, computed in the root layout — never imported here. */
  recordingCount: number
  /** contributors.length — likewise a prop, not a data import. */
  contributorCount: number
}

type SortValue = SortType

export function SiteHeader(props: SiteHeaderProps) {
  return (
    <Suspense fallback={<SiteHeaderBar {...props} />}>
      <ActiveSiteHeader {...props} />
    </Suspense>
  )
}

// Not collapsible into SiteHeader: calling the hook there puts it outside the
// boundary and the bail-out comes straight back (catalogue-nav.tsx:119-121).
function ActiveSiteHeader(props: SiteHeaderProps) {
  const searchParams = useSearchParams()
  return <SiteHeaderBar {...props} searchParams={searchParams} />
}

function SiteHeaderBar({
  recordingCount,
  contributorCount,
  // Absent means "the URL has not been read yet"; every `.get` below returns
  // null, which is the unhighlighted control set the fallback wants.
  searchParams = new URLSearchParams(),
}: SiteHeaderProps & { searchParams?: URLSearchParams }) {
  const pathname = usePathname()
  const { ids: bookmarks } = useRememberedSet(BOOKMARKS_KEY)

  const savedCount = bookmarks?.length ?? 0
  const onBookmarks = pathname === "/bookmarks"
  // The two routes a Category or Contributor actually filters. /bookmarks
  // passes no searchParams to getRecordings and filters by the Remembered set
  // instead, and the other eight routes hold no Recordings at all.
  const facetsApply = pathname === "/" || pathname === "/products"
  const sort = searchParams.get("sort")
  const activeSort: SortValue =
    sort === "top-voted" || sort === "top-viewed" ? sort : "recent"

  // The / key, the shortcut the chip in the search field advertises. One
  // listener for the whole document, and the only hand-written key handler in
  // the app (the ticket introduces it). It answers nothing but a bare `/` — no
  // modifier — typed somewhere it is not already an edit: the Recording overlay
  // is a Radix Dialog with a real focus trap, and yanking focus out of a trapped
  // dialog is worse than not answering the key.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      if (target?.closest("input, textarea, select, [contenteditable]")) return
      if (target?.closest('[role="dialog"]')) return
      event.preventDefault()
      // Two boxes exist in the DOM — one per header, one CSS-hidden at any given
      // width — so the visible one is the one answered.
      const input = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[name="search"]')
      ).find((el) => el.offsetParent !== null)
      input?.focus()
      input?.select()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const changeSort = (next: SortValue) => {
    // Reported and applied by the one shared function, hooks/use-sorted-data.ts's
    // applySort — the same URL and the same event the grid's own controls used.
    // replaceState, not a navigation: the sort is applied client-side, and
    // everything else — category, contributor, search, page — survives.
    applySort(next)
  }

  const compact = formatUpdatedCompact(lastCommitDate())

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-header backdrop-blur-[10px]">
      {/* Desktop: one 62px row. Below md the phone header below takes over. The
          counter line is `lg` and up only: between md and lg the six control
          groups do not fit side by side, and the counter is the one non-essential
          piece (its text is still in the served HTML either way). */}
      <div className="hidden h-[62px] items-center gap-[18px] px-[26px] md:flex">
        {/* The wordmark (Catalogue.dc.html:14-16). */}
        <Link href="/" className="flex items-baseline gap-[9px]">
          <span className="text-[16px] font-bold tracking-[-0.02em] text-t1">
            rnui<span className="text-acc">.dev</span>
          </span>
          <span className="hidden font-mono text-[9.5px] tracking-[0.12em] text-t3 xl:inline">
            RN UI RECORDINGS
          </span>
        </Link>

        {/* The counter line (Catalogue.dc.html:18). min-width is a reservation,
            not a measurement: it stops the row reflowing when the relative time
            crosses a timeago bucket. */}
        <div
          suppressHydrationWarning
          className="hidden min-w-[236px] whitespace-nowrap font-mono text-[10px] leading-[1.1] text-t3 tabular-nums lg:block"
        >
          {recordingCount} recordings · {contributorCount} contributors ·
          updated {compact}
        </div>

        <CatalogueSearch
          recordingCount={recordingCount}
          searchParams={searchParams}
        />

        {/* The sort segmented control, from the desktop mock (Catalogue.dc.html's
            sort block, early in that file). No state is lifted: the sort already
            lives in the URL, and this writes the same `?sort=` values
            use-sorted-data reads. */}
        <div className="flex items-center gap-[2px] rounded-chip border border-line bg-field p-[3px]">
          {(
            [
              ["recent", "RECENT"],
              ["top-viewed", "MOST VIEWED"],
              ["top-voted", "MOST VOTED"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => changeSort(value)}
              className={cn(
                "rounded-badge px-[9px] py-[5px] font-mono text-[9.5px] tracking-[0.08em]",
                activeSort === value ? "bg-acc-soft text-t1" : "text-t3"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* The Saved chip (Catalogue.dc.html:29-30). Accent on /bookmarks,
            plain elsewhere. */}
        <Link
          href="/bookmarks"
          className={cn(
            "flex items-center gap-[6px] rounded-chip border px-[10px] py-[6px] text-[12.5px]",
            onBookmarks
              ? "border-acc bg-acc-soft text-t1"
              : "border-line bg-transparent text-t2"
          )}
        >
          <span aria-hidden="true">◆</span> Saved{" "}
          {/* `min-w-[2ch]` reserves a digit: 0 → 3 must not shove the mode
              toggle sideways. */}
          <span className="min-w-[2ch] font-mono text-[10px] text-t3 tabular-nums">
            {savedCount}
          </span>
        </Link>

        <ModeToggle />
      </div>

      {/* Phone: three rows, 36px controls (CatalogueMobile.dc.html:12-23). The
          filter surface itself — the dock and the bottom sheet — is the filter
          dock's (components/filter-dock.tsx), rendered by the Catalogue page
          below `md`. The left drawer this block used to open is gone: what it
          held is on screen at 390px — the wordmark links /, the ◆ chip goes to
          /bookmarks, Subscribe lives in the footer's NOTIFY column, and the
          mode toggle is the glyph below. */}
      <div className="md:hidden">
        <div className="flex items-center gap-[10px] px-[14px] pb-[8px] pt-[12px]">
          <Link
            href="/"
            className="text-[15px] font-bold tracking-[-0.02em] text-t1"
          >
            rnui<span className="text-acc">.dev</span>
          </Link>

          {/* The compact counter, same two props as the desktop line — the
              uppercase is CSS, not a second string. */}
          <div
            suppressHydrationWarning
            className="min-w-[104px] whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.1em] text-t3"
          >
            {recordingCount} · {contributorCount} · {compact}
          </div>

          <Link
            href="/bookmarks"
            className={cn(
              "ml-auto flex min-h-[36px] items-center gap-[6px] rounded-chip border px-[11px] text-[12px]",
              onBookmarks
                ? "border-acc bg-acc-soft text-t1"
                : "border-line bg-field text-t2"
            )}
          >
            <span aria-hidden="true">◆</span> {savedCount}
          </Link>

          <ModeToggle compact />
        </div>

        {/* Search on its own row below; no / chip and no sort control on a phone
            (CatalogueMobile.dc.html:19-22). */}
        <div className="flex items-center gap-[8px] px-[14px] pb-[10px]">
          <CatalogueSearch
            recordingCount={recordingCount}
            searchParams={searchParams}
          />
        </div>

        {/* The phone chips row (CatalogueMobile.dc.html:24-29), a second
            component from the desktop bar above the heading row — no count, no
            SEARCH chip, no Clear all, CAT / BY at mono 8.5px. Only the two
            facets: a search term has no chip here, exactly as in the desktop
            bar's non-separate FACETS rule and the filter dock's badge.

            Gated on the route, which the desktop bar gets for free by living
            inside the grid behind `!bookmarkedOnly`. This header is rendered
            from app/layout.tsx, so without the gate `/aboutus?category=Buttons`
            draws a CAT chip for a filter that route does not apply — and so
            does `/bookmarks`, where the saved set is what filters and the
            chip's remove link points at another route entirely. A chip naming a
            filter that filters nothing is what decision 2 forbids. */}
        {facetsApply && <PhoneFilterChips searchParams={searchParams} />}
      </div>
    </header>
  )
}

/** The chips row in the phone header. Renders only when a facet is applied,
 *  horizontally scrollable with the scrollbar hidden — two chips at up to
 *  186px plus the gutters fit at 390px but the second chip's remove button
 *  would be unreachable at 320px (the mock's `overflow:hidden` is an element
 *  scrolling, not the document).
 *
 * A separate component from the desktop bar: the mock draws it with a different
 * sentence (no `N ACTIVE`, no SEARCH chip, no Clear all) at a different size
 * (mono 8.5 against 9), so a breakpoint on ticket 08's bar would render the
 * desktop copy at the wrong width.
 */
function PhoneFilterChips({
  searchParams = new URLSearchParams(),
}: {
  searchParams?: URLSearchParams
}) {
  const category = searchParams.get("category")
  const contributor = searchParams.get("contributor")
  const chips = [
    category ? { key: "category" as const, value: category } : null,
    contributor ? { key: "contributor" as const, value: contributor } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => chip !== null)

  if (chips.length === 0) return null

  return (
    // `-mt-[5px] pt-[5px]` cancels out, so nothing moves — it exists to grow the
    // clip box. `overflow-x-auto` computes `overflow-y` to `auto` rather than
    // leaving it visible, so this row clips its children vertically, and it was
    // shearing 4px off the top of the ✕'s 44px hit area (measured: reach up 17px
    // where 21 is needed, against 21/22/21 on the other three sides). Padding
    // alone would push the chips down 5px against CatalogueMobile.dc.html; the
    // negative margin pulls the border box back up by the same 5px, so the
    // chips paint exactly where they did and only the clip region grows.
    <div className="no-scrollbar -mt-[5px] flex gap-[7px] overflow-x-auto px-[14px] pb-[10px] pt-[5px]">
      {chips.map(({ key, value }) => {
        const isContributor = key === "contributor"
        return (
          <span
            key={key}
            className={cn(
              "flex min-h-[34px] flex-none items-center gap-[7px] rounded-[9px] border border-acc bg-acc-soft pl-[10px] pr-2 text-[11.5px] text-t1",
              isContributor && "max-w-[186px]"
            )}
          >
            <span className="flex-none font-mono text-[8.5px] text-acc">
              {isContributor ? "BY" : "CAT"}
            </span>
            <span
              className={cn(
                isContributor &&
                  "overflow-hidden text-ellipsis whitespace-nowrap"
              )}
            >
              {value}
            </span>
            <Link
              href={facetHref(searchParams, key, value)}
              // The desktop bar's own label, not a second spelling of it: the
              // two rows remove the same facet and an accessible name that
              // drifts between them is the drift catalogue-nav.tsx:76-78 names.
              aria-label={CHIPS[key].label}
              prefetch={false}
              // The glyph stays 20px as drawn (CatalogueMobile.dc.html:26); the
              // hit area is 44x44 via a transparent ::before, same treatment and
              // same reason as the desktop bar's ✕ (filter-chips.tsx X_CHROME).
              // 20 + 2*12 = 44. This is the row that actually matters for the
              // finding — it is the phone's only control for dropping a facet,
              // and it was the smaller of the two at 20x20.
              className="relative grid size-5 flex-none place-items-center rounded-[6px] bg-x-bg text-[10px] leading-none text-t1 before:absolute before:-inset-[12px] before:content-[''] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
              onClick={() => reportFacetClick(searchParams, key, value)}
            >
              ✕
            </Link>
          </span>
        )
      })}
    </div>
  )
}
