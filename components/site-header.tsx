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

import { showStarControl } from "@/lib/star-surface"
import { cn } from "@/lib/utils"
import { BOOKMARKS_KEY, useRememberedSet } from "@/hooks/use-remembered-set"
import { ModeToggle } from "@/app/providers"

import { CatalogueSearch } from "./catalogue-search"
import { CHIPS } from "./filter-chips"
import { facetHref, reportFacetClick } from "./nav/catalogue-nav"
import { SignInControl } from "./sign-in-control"
import { StarControl } from "./star-control"

export type SiteHeaderProps = {
  /** allRecordings.length, computed in the root layout — never imported here. */
  recordingCount: number
}

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
  // Absent means "the URL has not been read yet"; every `.get` below returns
  // null, which is the unhighlighted control set the fallback wants.
  searchParams = new URLSearchParams(),
}: SiteHeaderProps & { searchParams?: URLSearchParams }) {
  const pathname = usePathname()
  const { ids: bookmarks } = useRememberedSet(BOOKMARKS_KEY)

  const savedCount = bookmarks?.length ?? 0
  const onBookmarks = pathname === "/bookmarks"
  // github-star-button ticket 04: the live site only. Read **once, here**, and
  // handed to both layouts below — the desktop bar and the phone header are
  // separate components that have already drifted once (`Saved` has two
  // spellings for one fact), and two evaluations of the gate is two chances to
  // disagree. Fails open, so a local dev server renders it: see lib/star-surface.
  const showStars = showStarControl()
  // The two routes a Category or Contributor actually filters. /bookmarks
  // passes no searchParams to getRecordings and filters by the Remembered set
  // instead, and the other eight routes hold no Recordings at all.
  const facetsApply = pathname === "/" || pathname === "/products"

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

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-header backdrop-blur-[10px]">
      {/* Desktop: one 62px row. Below md the phone header below takes over. The
          counter line is `lg` and up only: between md and lg the six control
          groups do not fit side by side, and the counter is the one non-essential
          piece (its text is still in the served HTML either way). */}
      <div className="hidden h-[62px] items-center px-[26px] md:flex md:gap-[18px]">
        {/* Left column: wordmark. flex-1 makes this column share the free space
            equally with the right column, so the center column (search) sits
            at the viewport's midpoint regardless of each side's content width. */}
        <div className="flex flex-1">
          <Link href="/" className="flex items-baseline gap-[9px]">
            <span className="text-[16px] font-bold tracking-[-0.02em] text-t1">
              rnui<span className="text-acc">.dev</span>
            </span>
          </Link>
        </div>

        {/* Center column: search bar at fixed width. The two equal flex-1
            columns on either side center it at the viewport's midpoint. */}
        <div className="w-[424px] flex-shrink-0">
          <CatalogueSearch
            recordingCount={recordingCount}
            searchParams={searchParams}
          />
        </div>

        {/* Right column: Saved + mode toggle. flex-1 matches the left
            column and justify-end pushes its content to the gutter. */}
        <div className="flex flex-1 items-center justify-end gap-[10px]">
          {/* The Saved chip (Catalogue.dc.html:30). Accent on /bookmarks,
              plain elsewhere.

              `aria-label` carries the whole name at every width, so the visible
              word below is free to disappear without taking the accessible name
              with it. github-star-button ticket 03: the word was pinned to the
              name, which meant the chip could not drop it — and dropping it is
              what repairs the live 768–880 wrap, where the chip breaks onto two
              lines and pushes the mode toggle off-screen. The phone form below
              announces a bare number for the same reason, and the label is what
              fixes that too.

              Both halves are `aria-hidden` because the label already says all of
              it; leaving them readable would announce the name twice. */}
          <Link
            href="/bookmarks"
            aria-label={`Saved ${savedCount}`}
            className={cn(
              "flex items-center gap-[6px] rounded-chip border px-[10px] py-[6px] text-[12.5px]",
              onBookmarks
                ? "border-acc bg-acc-soft text-t1"
                : "border-line bg-transparent text-t2"
            )}
          >
            {/* `◆ Saved` is one flex item, as the mock has it — a text node and
                the count span, so the 6px gap is spent once. Split into three
                the glyph bought a second gap the drawing does not have.

                `hidden lg:inline` on the word, not a conditional render: the text
                stays in the DOM at every width and only the painting stops, which
                is the difference between "the name is gone" and "the name is not
                drawn". */}
            <span aria-hidden="true">
              <span>◆</span> <span className="hidden lg:inline">Saved</span>
            </span>
            {/* No width reservation. It used to carry `min-w-[2ch]` so 0 → 3
                could not shove the mode toggle sideways; the mock reserves
                nothing (Catalogue.dc.html:30), and github-star-button ticket 03
                is explicit that the rule stays removed. `tabular-nums` still holds
                the digits on one advance width, so the reflow is one character
                wide at 3 → 10. */}
            <span
              aria-hidden="true"
              className="font-mono text-[10px] text-t3 tabular-nums"
            >
              {savedCount}
            </span>
          </Link>

          {/* The star chip, between Saved and the toggle (Catalogue.dc.html:30-31).
              The count is inlined from scripts/star-count.json at build time, so
              GitHub is never in a visitor's request path. */}
          {showStars && <StarControl variant="desktop" />}

          {/* sign-in-to-save ticket 06: the Reader's door, between the star and
              the toggle (ticket 04 variant W). Signed out it is a fourth chip
              whose word hides below `lg` like Saved's own; signed in it is a
              26px circle, narrower than the chip it replaces. Neither state
              moves where this row hands over to the phone row at 768px. */}
          <SignInControl />

          <ModeToggle />
        </div>
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

          <Link
            href="/bookmarks"
            // github-star-button ticket 03. The phone chip announces a bare
            // number today — `◆ 3` with nothing to attach the three to — and the
            // fix is this label, not a visible word: 320px has no room for one,
            // and adding one would shrink the glyph rather than the chip.
            aria-label={`Saved ${savedCount}`}
            className={cn(
              // 38, not the mock's `min-height:36px`: content-box plus its 1px
              // border (CatalogueMobile.dc.html's ◆ chip).
              "ml-auto flex min-h-[38px] items-center gap-[6px] rounded-chip border px-[11px] text-[12px]",
              onBookmarks
                ? "border-acc bg-acc-soft text-t1"
                : "border-line bg-field text-t2"
            )}
          >
            <span aria-hidden="true">◆</span> {savedCount}
          </Link>

          {/* The same control as the desktop bar's, one layout narrower — the
              phone form is `★ 350` because 320px has no room for the word, which
              is why the accessible name is a constant rather than a function of
              what is drawn. `ml-auto` moved onto the Saved chip above, so this
              sits beside it rather than pushing it. */}
          {showStars && <StarControl variant="phone" className="ml-[6px]" />}

          {/* sign-in-to-save ticket 06: the same control as the desktop bar —
              one component, no phone spelling to drift. Below `md` the word is
              always hidden by the `lg` breakpoint, so this draws the glyph
              alone beside the star and fits the 320px row the Saved chip's
              label comment above is guarding. */}
          <SignInControl />

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
              // 36 and 206, not the mock's `min-height:34px` / `max-width:186px`:
              // both are content-box figures and the chip carries a 1px accent
              // border, plus 18px of horizontal padding for the width.
              "flex min-h-[36px] flex-none items-center gap-[7px] rounded-[9px] border border-acc bg-acc-soft pl-[10px] pr-2 text-[11.5px] text-t1",
              isContributor && "max-w-[206px]"
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
