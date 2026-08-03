// components/catalogue-empty.tsx
//
// The two panels that render in place of the grid: the zero-result diagnosis
// (Catalogue.dc.html:98-109) and the empty saved view (:111-122).
//
// The zero panel holds no copy of its own — every word of it is derived in
// lib/catalogue-filters.ts from the diagnosis a server component computed, so
// the sentence the mock draws at Catalogue.dc.html:102, which names the wrong
// Category, cannot be hard-coded wrong a second time. This component turns the
// derived actions into hrefs, which is the one part that needs the current URL.
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  catalogueActions,
  catalogueSentences,
  clearAllHref,
  type ActiveFilters,
  type CatalogueDiagnosis,
} from "@/lib/catalogue-filters"
import { catalogueMatchLine } from "@/lib/catalogue-heading"
import { cn } from "@/lib/utils"

import { searchHref } from "./catalogue-search"
import { facetHref } from "./nav/catalogue-nav"

/**
 * Which of the two panels, and the diagnosis the zero one prints. Null means the
 * caller cannot yet tell whether there is anything to show — the same null
 * `emptyMessage` carried, and the reason components/recording-card-grid.tsx
 * still treats it as the switch for whether anything renders at all.
 */
export type EmptyState =
  | { kind: "saved" }
  | { kind: "zero"; diagnosis: CatalogueDiagnosis | null }

// The shell both panels share, Catalogue.dc.html:99 and :112. 14px is off the
// Specimen's 16/12/9/6 radius scale; shipped as drawn (ticket 08 open question
// 3).
const PANEL = [
  "flex",
  "max-w-[720px]",
  "flex-col",
  "items-start",
  "rounded-[14px]",
  "border",
  "border-dashed",
  "border-line2",
  "bg-empty",
  "px-10",
  "py-[52px]",
]

const HEADLINE = "text-[22px] font-medium tracking-[-0.01em] text-t1"

const BUTTON = [
  "rounded-chip",
  "px-[13px]",
  "py-[9px]",
  "text-[12.5px]",
  "focus-visible:outline",
  "focus-visible:outline-[3px]",
  "focus-visible:outline-acc",
  "focus-visible:outline-offset-[3px]",
]

const PRIMARY = ["bg-acc", "font-medium", "text-on-acc"]
const SECONDARY = ["border", "border-line2", "text-t1"]

export function CatalogueEmpty({
  state,
  catalogueTotal,
}: {
  state: EmptyState
  /** The whole catalogue, the denominator of the eyebrow and of `Search all N`. */
  catalogueTotal: number
}) {
  if (state.kind === "saved") return <EmptySaved />
  return <ZeroResults diagnosis={state.diagnosis} total={catalogueTotal} />
}

function ZeroResults({
  diagnosis,
  total,
}: {
  diagnosis: CatalogueDiagnosis | null
  total: number
}) {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Nothing filtered, so nothing to diagnose. The route computes the diagnosis
  // and hands null when there is none; a panel with no sentence is worse than
  // the bare grid.
  if (!diagnosis) return null

  const active: ActiveFilters = {
    category: searchParams.get("category") ?? undefined,
    contributor: searchParams.get("contributor") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  }
  const { headline, body } = catalogueSentences(active, diagnosis)

  // A Link, not a button, so middle-click and Back work and so the served HTML
  // carries the escape route even before hydration — the reasoning
  // components/nav/catalogue-nav.tsx gives for keeping its hrefs in render.
  const href = (action: ReturnType<typeof catalogueActions>[number]) => {
    if (action.kind === "search-all")
      return `${pathname}?${new URLSearchParams({ search: active.search! })}`
    if (action.kind === "clear-all")
      return clearAllHref(pathname, diagnosis.keys)
    if (action.key === "search")
      return searchHref(pathname, new URLSearchParams(searchParams), "")
    return facetHref(searchParams, action.key, active[action.key]!)
  }

  return (
    <div className={cn(PANEL, "gap-4")}>
      <div className="font-mono text-[9.5px] tracking-[0.14em] text-t3">
        {catalogueMatchLine({ shown: 0, catalogueTotal: total })}
      </div>
      <div className={cn(HEADLINE, "[text-wrap:pretty]")}>{headline}</div>
      {body && (
        <p className="m-0 max-w-[520px] text-[13px] leading-[1.55] text-t2">
          {body}
        </p>
      )}
      <div className="flex flex-wrap gap-[9px] pt-1">
        {catalogueActions(active, diagnosis, total).map((action) => (
          <Link
            key={action.label}
            href={href(action)}
            prefetch={false}
            className={cn(BUTTON, action.primary ? PRIMARY : SECONDARY)}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function EmptySaved() {
  return (
    <div className={cn(PANEL, "gap-[15px]")}>
      {/* Three placeholder rectangles, aria-hidden: they carry nothing the copy
          does not (Catalogue.dc.html:113-117). */}
      <div aria-hidden="true" className="flex gap-[7px]">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-[60px] w-[34px] rounded-[7px] border border-dashed border-line2"
          />
        ))}
      </div>
      <div className={HEADLINE}>You haven’t saved anything yet.</div>
      <p className="m-0 max-w-[520px] text-[13px] leading-[1.55] text-t2">
        {/* ◇ Save is the glyph and word the tile actually draws
            (components/recording-card.tsx:355-356); the sentence would be a lie
            otherwise, which decision 2 forbids. */}
        Tap ◇ Save on any recording to keep it here. Saves stay in{" "}
        <strong className="font-medium text-t1">
          this browser on this device only
        </strong>{" "}
        — there is no account and nothing is synced. Clearing site data clears
        them.
      </p>
      <Link href="/" prefetch={false} className={cn(BUTTON, PRIMARY)}>
        Browse the catalogue
      </Link>
    </div>
  )
}
