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

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Bookmark, HomeIcon, PanelLeftIcon, Rss } from "lucide-react"

import { cn } from "@/lib/utils"
import { BOOKMARKS_KEY, useRememberedSet } from "@/hooks/use-remembered-set"
import { applySort, type SortType } from "@/hooks/use-sorted-data"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { formatUpdatedCompact, lastCommitDate } from "@/components/last-updated"
import { ModeToggle } from "@/app/providers"

import { CatalogueSearch } from "./catalogue-search"
import { Logo } from "./logo"
import { CatalogueNav } from "./nav/catalogue-nav"

export type SiteHeaderProps = {
  /** allRecordings.length, computed in the root layout — never imported here. */
  recordingCount: number
  /** getUniqueContributors().length — likewise a prop, not a data import. */
  contributorCount: number
  /** The two facet lists, for the phone sheet's CatalogueNav. */
  categories: string[]
  contributors: string[]
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
  categories,
  contributors,
  // Absent means "the URL has not been read yet"; every `.get` below returns
  // null, which is the unhighlighted control set the fallback wants.
  searchParams = new URLSearchParams(),
}: SiteHeaderProps & { searchParams?: URLSearchParams }) {
  const pathname = usePathname()
  const { ids: bookmarks } = useRememberedSet(BOOKMARKS_KEY)

  const [isSheetOpen, setSheetOpen] = useState(false)
  const handleLinkClick = () => setSheetOpen(false)

  const savedCount = bookmarks?.length ?? 0
  const onBookmarks = pathname === "/bookmarks"
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

      {/* Phone: two rows, 36px controls (CatalogueMobile.dc.html:12-23). The
          filter dock, chips row and contentTop offsets in that file are ticket
          11's; the menu trigger below is the one route to the filters on a phone
          until then. */}
      <div className="md:hidden">
        <div className="flex items-center gap-[10px] px-[14px] pb-[8px] pt-[12px]">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                className="flex min-h-[36px] items-center rounded-chip border border-line bg-field px-[10px] text-[12px] text-t2 sm:hidden"
              >
                <PanelLeftIcon />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="border-r border-primary/10 py-4 pl-1 sm:max-w-[15rem]"
            >
              <div className="ml-4 mt-1 md:hidden">
                <Logo />
              </div>
              <nav className="flex h-full flex-col justify-between">
                <div className="flex flex-col items-start gap-4 px-2 py-1">
                  <CatalogueNav
                    categories={categories}
                    contributors={contributors}
                    handleLinkClick={handleLinkClick}
                  />
                  <div className="my-4 space-y-3">
                    <Link
                      href="/subscribe"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <Rss className="h-5 w-5" />
                      Subscribe
                    </Link>
                    <Link
                      href="/bookmarks"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <Bookmark className="h-5 w-5" />
                      Bookmarks
                    </Link>
                    <Link
                      href="/"
                      className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                      prefetch={false}
                      onClick={handleLinkClick}
                    >
                      <HomeIcon className="h-5 w-5" />
                      Home
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col items-start pl-4">
                  <nav className="mb-6 flex flex-col gap-4">
                    <ModeToggle />
                  </nav>
                </div>
              </nav>
            </SheetContent>
          </Sheet>

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
      </div>
    </header>
  )
}
