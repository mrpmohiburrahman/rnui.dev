// components/nav/catalogue-nav.tsx

"use client"

import { Suspense, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BoxIcon, User } from "lucide-react"

import { filterApplied, filterCleared, type Facet } from "@/lib/analytics"
import { cn, truncateString } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

type CatalogueNavProps = {
  contributors?: string[]
  categories?: string[]
  handleLinkClick?: () => void
  children?: ReactNode
}

/**
 * The chip treatment every link in this list wears at rest, following
 * `PILL_CLASS` in components/recording-card-grid.tsx. Named rather than spelled a
 * third time so the All recordings link cannot drift from the facets it sits
 * above: decision 13 authorises it to exist, not to introduce an appearance of
 * its own.
 */
const CHIP_CLASS = [
  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
]

/**
 * Added on top of CHIP_CLASS by the facet that is currently applied, so the
 * visitor can see which link would clear what. The All recordings link carries no
 * facet, so it never wears this.
 */
const ACTIVE_CHIP_CLASS = "bg-yellow-400 text-black dark:text-black"

/**
 * A facet link that keeps every param it did not set, so filters compose — the
 * server has always intersected them (app/actions/get-recordings.ts:54-72); only
 * these hrefs, written whole, discarded what the visitor already had.
 *
 * Clicking the facet that is already on removes it. Without that there is no way
 * out of an intersection short of leaving the page.
 *
 * `page` is dropped because a different filter is a different result set, and
 * carrying page=4 into it renders a slice of something that no longer exists.
 *
 * The display name goes in unaltered: it is the key the 18 legacy redirects land
 * on (data/categories.ts:68-70). `URLSearchParams` spells a space `+` where that
 * table spells it `%20`; both decode to the same string, so the active test below
 * and the redirect targets keep agreeing.
 */
function facetHref(current: URLSearchParams, key: string, value: string) {
  // A copy: useSearchParams() hands back a ReadonlyURLSearchParams whose
  // set/delete throw.
  const params = new URLSearchParams(current)
  if (params.get(key) === value) params.delete(key)
  else params.set(key, value)
  params.delete("page")
  const query = params.toString()
  return query ? `/products?${query}` : "/products"
}

/**
 * The two facets, in the order `active_filter_count` counts them. `search` is
 * deliberately not one: it has an event of its own, and a visitor who searched
 * and then narrowed by Category did two different things.
 */
const FACETS: Facet[] = ["category", "contributor"]

/**
 * What a facet click reports, decided by the same test `facetHref` navigates on:
 * the link that clears is the link that is already applied. Written next to that
 * function because the two disagreeing means every clear is logged as an apply.
 */
function reportFacetClick(
  current: URLSearchParams,
  facet: Facet,
  value: string
) {
  if (current.get(facet) === value) {
    filterCleared(facet, value)
    return
  }
  const next = new URLSearchParams(current)
  next.set(facet, value)
  filterApplied(facet, value, FACETS.filter((f) => next.get(f)).length)
}

/**
 * The filter list, and a boundary around the one part of it that reads the URL.
 *
 * `useSearchParams()` opts every ancestor out of prerendering. It used to be called
 * in `nav-side-bar.tsx`, which pushed the bail-out all the way to the root layout —
 * so eleven prerendered routes served `<div>Loading sidebar...</div>` as their
 * sidebar, and a visitor without JavaScript never got the swap that replaces it.
 *
 * Reading it after mount instead would remove the hook entirely, but ticket 11
 * builds each `href` from the current query so filters compose, and an href
 * computed after mount is wrong in the document that gets served. So the read
 * stays during render and only moves down to what needs it.
 *
 * The fallback is the same list with nothing highlighted, which is why the served
 * HTML still carries every filter link.
 */
export function CatalogueNav(props: CatalogueNavProps) {
  return (
    <Suspense fallback={<CatalogueNavList {...props} />}>
      <ActiveCatalogueNav {...props} />
    </Suspense>
  )
}

// Not collapsible into CatalogueNav: calling the hook there puts it outside the
// boundary and the bail-out comes straight back, and a conditional hook is illegal.
// Three components is the floor React allows here.
function ActiveCatalogueNav(props: CatalogueNavProps) {
  const searchParams = useSearchParams()
  return <CatalogueNavList {...props} searchParams={searchParams} />
}

function CatalogueNavList({
  contributors,
  categories,
  handleLinkClick,
  // Absent means "the URL has not been read yet", and every `.get` below returns
  // null — which is exactly the unhighlighted list the fallback wants.
  searchParams = new URLSearchParams(),
  children,
}: CatalogueNavProps & { searchParams?: URLSearchParams }) {
  return (
    <div className="">
      {/* <Logo /> */}
      {children}
      <ScrollArea className="h-[calc(100vh-320px)] md:h-[calc(100vh-200px)] flex flex-col gap-4 pl-2">
        {/* The whole catalogue. /products carries twice the traffic of / and is
            where 18 legacy Category paths redirect (middleware.ts:23-43), but
            every link that reached it — the facets below, those redirects —
            arrived with a filter already applied. The unfiltered page had no
            route to it from anywhere on the site (decision 13). */}
        <Link
          href="/products"
          onClick={handleLinkClick}
          className={cn(CHIP_CLASS)}
          prefetch={false}
        >
          <span className="px-1">All recordings</span>
        </Link>
        {/* Categories Section */}
        {categories && categories.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <BoxIcon className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Categories</p>
          </div>
        )}
        <ul className="mt-2 w-36 flex flex-col gap-2 items-start justify-center py-2">
          {categories?.map((category, index) => (
            <li key={`category-${index}-${category}`}>
              <Link
                href={facetHref(searchParams, "category", category)}
                onClick={() => {
                  reportFacetClick(searchParams, "category", category)
                  handleLinkClick?.()
                }}
                className={cn(
                  CHIP_CLASS,
                  searchParams.get("category") === category
                    ? ACTIVE_CHIP_CLASS
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1">{truncateString(category, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Contributors */}
        {contributors && contributors.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <User className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Contributors</p>
          </div>
        )}
        <ul className="mt-2 w-36 flex flex-col gap-2 items-start justify-center py-2">
          {contributors?.map((contributor, index) => (
            <li key={`category-${index}-${contributor}`}>
              <Link
                href={facetHref(searchParams, "contributor", contributor)}
                onClick={() => {
                  reportFacetClick(searchParams, "contributor", contributor)
                  handleLinkClick?.()
                }}
                className={cn(
                  CHIP_CLASS,
                  searchParams.get("contributor") === contributor
                    ? ACTIVE_CHIP_CLASS
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1">{truncateString(contributor, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
