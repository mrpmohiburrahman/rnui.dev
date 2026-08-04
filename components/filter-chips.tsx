// components/filter-chips.tsx
//
// The bar above the heading row (Catalogue.dc.html:76-82): a mono count, one
// removable chip per active facet, and Clear all pushed right.
//
// It exists because an applied filter had no removal control on the page. The
// rail's own row is the control — clicking the facet that is already on clears
// it (components/nav/catalogue-nav.tsx) — but finding it means finding the row,
// and a search term has no row at all. This bar is the only place where all
// three filters are visible at once: the rail cannot show the term, and the
// heading row deliberately does not (lib/catalogue-heading.ts).
//
// It takes no data props. The three facets are in the URL, and
// components/recording-card-grid.tsx already reads the same hook in this tree.
"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { filterCleared } from "@/lib/analytics"
import {
  clearAllHref,
  FILTER_KEYS,
  type FilterKey,
} from "@/lib/catalogue-filters"
import { cn } from "@/lib/utils"

import { searchHref } from "./catalogue-search"
import { facetHref } from "./nav/catalogue-nav"

/** The mock's own aria-labels (Catalogue.dc.html:78,79,80) and mono prefixes.
 *
 * Exported for the phone header's own chips row (components/site-header.tsx),
 * which draws shorter prefixes — `CAT` against `CATEGORY` — but must not respell
 * the accessible names. The mock's own `aria-label="Remove"`
 * (CatalogueMobile.dc.html:26) is ambiguous between two chips; the long form
 * here is the one both rows say. */
export const CHIPS: Record<FilterKey, { prefix: string; label: string }> = {
  category: { prefix: "CATEGORY", label: "Remove category filter" },
  contributor: { prefix: "BY", label: "Remove contributor filter" },
  search: { prefix: "SEARCH", label: "Clear search" },
}

/**
 * The ✕ that removes one chip. Shared by all three so the focus ring, the
 * hit area and the accessible name cannot drift between them; only what a click
 * *does* differs, which is why it takes an element rather than an href.
 */
const X_CHROME = [
  "grid",
  "size-4",
  "flex-none",
  "place-items-center",
  "rounded-[5px]",
  "bg-x-bg",
  "text-[10px]",
  "leading-none",
  "text-t1",
  "focus-visible:outline",
  "focus-visible:outline-[3px]",
  "focus-visible:outline-acc",
  "focus-visible:outline-offset-2",
]

// The Specimen's "Filter chip add / remove", 120ms ease-out
// (Specimen.dc.html:163), on opacity and transform only — this tree holds no
// layout animation, and app/globals.css zeroes the duration under
// prefers-reduced-motion.
const CHIP_CHROME = [
  "flex",
  "items-center",
  "gap-2",
  // 8px, as drawn (Catalogue.dc.html:78). The Specimen's radius scale is
  // 16/12/9/6 and has no row for it; ticket 08 open question 3 flags the same
  // gap for the empty panel's 14px. Both ship as drawn (decision 2).
  "rounded-[8px]",
  "border",
  "border-acc",
  "bg-acc-soft",
  "py-[6px]",
  "pl-[10px]",
  "pr-2",
  "text-[12px]",
  "text-t1",
  "transition-[opacity,transform]",
  "duration-120",
  "ease-out",
]

export function FilterChips() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  const active = FILTER_KEYS.map((key) => ({
    key,
    value: searchParams.get(key) ?? "",
  })).filter((facet) => facet.value)

  if (active.length === 0) return null

  return (
    <div className="mb-5 flex w-full flex-wrap items-center gap-2 rounded-panel border border-line bg-filter-bar px-[14px] py-3">
      <span className="font-mono text-label text-t3">
        {active.length} ACTIVE
      </span>

      {active.map(({ key, value }) => (
        <span
          key={key}
          className={cn(
            CHIP_CHROME,
            // The stored Contributor string is 33 characters — it wraps rather
            // than pushing Clear all off the row (Catalogue.dc.html:79).
            key === "contributor" && "max-w-[330px]"
          )}
        >
          <span className="flex-none font-mono text-[9px] text-acc">
            {CHIPS[key].prefix}
          </span>
          <span className="[overflow-wrap:anywhere]">
            {key === "search" ? `“${value}”` : value}
          </span>
          {key === "search" ? (
            // Not a Link: the box and this chip write the same URL through the
            // same helper, and a search is a replace so the history does not
            // stack one record per abandoned term. It reports nothing — `Facet`
            // is category | contributor, and lib/analytics.ts:19-20 is why the
            // term itself never leaves the page.
            <button
              type="button"
              aria-label={CHIPS[key].label}
              className={cn(X_CHROME)}
              onClick={() =>
                router.replace(
                  searchHref(pathname, new URLSearchParams(searchParams), "")
                )
              }
            >
              ✕
            </button>
          ) : (
            <Link
              href={facetHref(searchParams, key, value)}
              aria-label={CHIPS[key].label}
              prefetch={false}
              className={cn(X_CHROME)}
              // Precisely what this is: the rail already fires the same event
              // for the same act (components/nav/catalogue-nav.tsx).
              onClick={() => filterCleared(key, value)}
            >
              ✕
            </Link>
          )}
        </span>
      ))}

      <Link
        // The same helper the empty panel's own Clear all uses, so the two
        // cannot disagree about where "off" is.
        href={clearAllHref(
          pathname,
          active.map(({ key }) => key)
        )}
        prefetch={false}
        className="ml-auto rounded-[8px] border border-line px-[11px] py-[6px] text-[12px] text-t2 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
        // One event per Facet actually removed, because two facets really were.
        // The search chip fires nothing, here as on its own ✕.
        onClick={() => {
          for (const { key, value } of active)
            if (key !== "search") filterCleared(key, value)
        }}
      >
        Clear all
      </Link>
    </div>
  )
}
