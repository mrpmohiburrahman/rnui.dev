// components/nav/catalogue-nav.tsx

"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import type { FacetCount } from "@/data/recording"

import { filterApplied, filterCleared, type Facet } from "@/lib/analytics"
import { cn } from "@/lib/utils"

type CatalogueNavProps = {
  contributors?: FacetCount[]
  categories?: FacetCount[]
  handleLinkClick?: () => void
}

/**
 * The row treatment every link in the rail wears — the mock's flat 7px-radius
 * row (Catalogue.dc.html:38-44), minus the state-dependent pieces below. The
 * transition is the Specimen's own figure for "Filter chip add / remove" and a
 * rail row is that control (Specimen.dc.html:163). The focus ring replaces the
 * applied state's 1px accent ring rather than stacking — an element has one
 * outline — and is `:focus-visible` so a mouse click draws nothing
 * (07-keyboard-focus-and-contrast.md).
 */
const ROW_CHROME = [
  "flex",
  "rounded-[7px]",
  "px-2",
  "py-[5px]",
  "transition-colors",
  "duration-120",
  "ease-out",
  "focus-visible:outline",
  "focus-visible:outline-[3px]",
  "focus-visible:outline-acc",
  "focus-visible:outline-offset-2",
]

// At rest: a t2 name on transparent, and a hover lift to the neutral field
// fill — a lift that cannot be confused with the applied state, which is
// tinted accent rather than neutral.
const ROW_IDLE = ["text-t2", "hover:bg-field", "hover:text-t1"]

// Applied: a soft accent fill, a t1 name, and the mock's 1px accent ring at 1px
// offset (Catalogue.dc.html:223). `hover:bg-acc-soft` keeps the hover lift from
// reading as "was applied, now not".
const ROW_ON = [
  "bg-acc-soft",
  "text-t1",
  "outline",
  "outline-1",
  "outline-acc",
  "outline-offset-1",
  "hover:bg-acc-soft",
]

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
 * Reading it after mount instead would remove the hook entirely, but the hrefs
 * are built from the current query so filters compose, and an href computed after
 * mount is wrong in the document that gets served. So the read stays during
 * render and only moves down to what needs it.
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
}: CatalogueNavProps & { searchParams?: URLSearchParams }) {
  // The whole catalogue's size, from the counts themselves rather than a separate
  // prop: a rail that prints its own total cannot drift from its own rows.
  const total = categories?.reduce((sum, c) => sum + c.count, 0) ?? 0

  // Four rows by count, plus the active Contributor if it is not among them —
  // without the pin a filter on any of the other twenty draws a rail that shows
  // no filter at all (decision 2). The pin depends on the query, so it lives here
  // rather than in the layout, and the Suspense fallback — which has no params —
  // shows the plain four.
  const topContributors = contributors?.slice(0, 4) ?? []
  const activeContributor = searchParams.get("contributor")
  const pinned = activeContributor
    ? contributors?.find((c) => c.name === activeContributor)
    : undefined
  const visibleContributors =
    pinned && !topContributors.some((c) => c.name === pinned.name)
      ? [...topContributors, pinned]
      : topContributors

  return (
    <div className="flex flex-col">
      {/* The whole catalogue. /products carries twice the traffic of / and is
          where 18 legacy Category paths redirect (middleware.ts:23-43), but
          every link that reached it — the facets below, those redirects —
          arrived with a filter already applied. The unfiltered page had no
          route to it from anywhere on the site (decision 13), so it stays, as a
          row in the same grammar as the facets it sits above. The mock does not
          draw it; spec.md checkpoint 4 was read before keeping it. */}
      {/* The margin lives on a wrapper, not the link: the row's class list is
          asserted to equal a Category row's (nav-empty-states-layout.spec.ts),
          which has no margin of its own. */}
      <div className="mb-2">
        <Link
          href="/products"
          onClick={handleLinkClick}
          prefetch={false}
          className={cn(
            ROW_CHROME,
            "items-center gap-2 text-[12.5px]",
            ROW_IDLE
          )}
        >
          <span className="min-w-0 truncate">All recordings</span>
          <span
            aria-hidden="true"
            className="ml-auto font-mono text-[10px] tabular-nums text-t3"
          >
            {total}
          </span>
        </Link>
      </div>

      {/* Categories — alphabetical, all 18, each with its whole-catalogue count.
          The mock's label (Catalogue.dc.html:37) and rows (:38-44). */}
      {categories && categories.length > 0 && (
        <div>
          <div className="px-2 pb-[9px] font-mono text-[9px] tracking-[0.16em] text-t3">
            CATEGORIES
          </div>
          <ul className="flex flex-col gap-[1px]">
            {categories.map((category, index) => {
              const on = searchParams.get("category") === category.name
              return (
                <li key={`category-${index}-${category.name}`}>
                  <Link
                    href={facetHref(searchParams, "category", category.name)}
                    onClick={() => {
                      reportFacetClick(searchParams, "category", category.name)
                      handleLinkClick?.()
                    }}
                    prefetch={false}
                    className={cn(
                      ROW_CHROME,
                      "items-center gap-2 text-[12.5px]",
                      on ? ROW_ON : ROW_IDLE
                    )}
                  >
                    {/* One flat neutral at rest, accent when applied. It is not
                        the hue ticket 03 measures — that is per Recording and
                        lives on the tile. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-[5px] flex-none rounded-[3px]",
                        on
                          ? "bg-acc"
                          : "bg-[rgba(16,18,22,0.16)] dark:bg-[rgba(255,255,255,0.16)]"
                      )}
                    />
                    <span className="min-w-0 truncate">{category.name}</span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "ml-auto font-mono text-[10px] tabular-nums",
                        on ? "text-acc" : "text-t3"
                      )}
                    >
                      {category.count}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Contributors — the top four by count, plus the pin. The 22px above the
          label is the mock's only gap between the two lists
          (Catalogue.dc.html:47 vs :37). */}
      {visibleContributors.length > 0 && (
        <div>
          <div className="px-2 pb-[9px] pt-[22px] font-mono text-[9px] tracking-[0.16em] text-t3">
            CONTRIBUTORS · {contributors?.length ?? 0}
          </div>
          <ul className="flex flex-col gap-[1px]">
            {visibleContributors.map((contributor, index) => {
              const on = searchParams.get("contributor") === contributor.name
              return (
                <li key={`contributor-${index}-${contributor.name}`}>
                  <Link
                    href={facetHref(
                      searchParams,
                      "contributor",
                      contributor.name
                    )}
                    onClick={() => {
                      reportFacetClick(
                        searchParams,
                        "contributor",
                        contributor.name
                      )
                      handleLinkClick?.()
                    }}
                    prefetch={false}
                    className={cn(
                      ROW_CHROME,
                      "items-baseline gap-2 text-[12px] leading-[1.3]",
                      on ? ROW_ON : ROW_IDLE
                    )}
                  >
                    {/* Long names wrap instead of truncating — two of the data's
                        Contributors are unreadable at twelve characters and
                        legible when wrapped (Catalogue.dc.html:51). */}
                    <span className="[overflow-wrap:anywhere]">
                      {contributor.name}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "ml-auto flex-none font-mono text-[10px]",
                        on ? "text-acc" : "text-t3"
                      )}
                    >
                      {contributor.count}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
          {/* The route this points at does not exist until ticket 10; the string
              is fixed here so that ticket does not have to come back and edit the
              rail (Catalogue.dc.html:56). */}
          <div className="px-2 pt-[10px] text-[11.5px]">
            <Link
              href="/contributors"
              onClick={handleLinkClick}
              prefetch={false}
              className="text-acc underline underline-offset-[3px]"
            >
              All {contributors?.length ?? 0} contributors →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
