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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"

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
  // The drawn glyph stays 16px (Catalogue.dc.html:78); the *target* is 44x44,
  // via a transparent ::before rather than a bigger box, because growing the
  // control to 44px would grow the chip past the 26px the mock draws and that
  // is a spec change. 16 + 2*14 = 44. Nothing competes for the space it covers:
  // it spills over its own chip's label, which is not interactive, and the
  // nearest other control is the next chip's ✕, a full chip width away.
  // `/review-animations` (ticket 13 step 14) found this at 16x16 — the only way
  // to drop a facet on a phone — and the gate's a11y sweep had never measured
  // pointer targets at all.
  "relative",
  "before:absolute",
  "before:-inset-[14px]",
  "before:content-['']",
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
// layout animation.
//
// It was written as CSS `transition-[opacity,transform] duration-120 ease-out`
// and never played a frame in either direction: React mounts this span outright,
// so a transition has no starting frame to leave, and unmounts it outright, so
// the exit is gone before it can paint. `/review-animations` (ticket 13 step 14)
// caught it; tests/e2e/filters.spec.ts sampled fifty consecutive frames at
// opacity 1 and then nothing. The gate's own row for this moment reads ✅
// because it verified the class, not a played frame — the one row in that table
// read from source rather than from getComputedStyle on a live element.
//
// AnimatePresence is what holds the node mounted long enough to paint the exit;
// no CSS can, since nothing else keeps a React-unmounted element alive. Note
// this is the opposite call to components/filter-dock.tsx:84, which refuses
// framer-motion — that objection is to a *spring*, whose physics run every
// frame on the main thread, on a full-screen panel. This is a 120ms tween on
// one ~100px span.
//
// Measured, because that argument is not worth much unmeasured. Both arms in one
// sitting, same machine and port, iPhone 13 emulation at 4x CPU throttle, seven
// repeats, Event Timing — median 16ms without the tween, 24ms with it, spreads
// 8ms and 16ms, and the after arm reproduced at 24ms on a second run. **+8ms.**
// The bar was the 32ms spread on this interaction in checkpoint-13-gate.md; over
// that and the exit came back out.
//
// Do not read those numbers against the gate's 248ms for this interaction. That
// figure is a cold measurement dominated by the router re-rendering the grid;
// this protocol warms three full loads first and so reads the interaction alone.
// The +8ms is the honest quantity — the 248ms is unchanged by anything here.
//
// `easeOut`, not a custom cubic-bezier. `review-animations`' STANDARDS.md:31 says
// bare keywords are "almost never strong enough" and wants a real curve — and
// this ticket's Problem section names that exact substitution as one of the three
// collisions where **the mock wins**: "an agent that 'fixes' them has overridden a
// binding spec." The first cut of this shipped cubic-bezier(.19,1,.22,1), which is
// worse than a generic override: that curve is from
// .scratch/ui-ux-overhaul/motion-brief-overlay.md, the superseded brief this
// ticket's step 3 exists to retire. `easeOut` is framer's spelling of the drawn
// `120ms ease-out`, so nothing forced the substitution.
const MOTION = { duration: 0.12, ease: "easeOut" } as const
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
]

export function FilterChips() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // The Specimen's "all durations 0ms" (Specimen.dc.html:95). Gated here rather
  // than left to <MotionConfig reducedMotion="user"> in app/providers.tsx, which
  // snaps transforms but deliberately keeps opacity animating — the same reason
  // components/recording-overlay.tsx:63-72 gates its own rise by hand. The
  // element keeps its exit, it just takes no time, so AnimatePresence still
  // unmounts it cleanly.
  const reduce = useReducedMotion()
  const transition = reduce ? { duration: 0 } : MOTION

  const active = FILTER_KEYS.map((key) => ({
    key,
    value: searchParams.get(key) ?? "",
  })).filter((facet) => facet.value)

  // Removing the *last* chip takes the whole bar with it, so that one chip
  // cannot play an exit — its AnimatePresence unmounts in the same commit.
  // Deliberately not fixed with a "keep the bar alive while an exit is in
  // flight" state machine: the bar's own disappearance is the larger movement,
  // and the machinery would outweigh the frame it buys.
  if (active.length === 0) return null

  return (
    <div className="mb-5 flex w-full flex-wrap items-center gap-2 rounded-panel border border-line bg-filter-bar px-[14px] py-3">
      <span className="font-mono text-label text-t3">
        {active.length} ACTIVE
      </span>

      {/* `initial={false}` so the bar's first paint on a filtered URL is not a
          page-load animation — only a chip added to an already-visible bar
          animates in. `popLayout` is what lets the survivors close the gap while
          the removed chip is still fading, instead of jumping after it. */}
      <AnimatePresence mode="popLayout" initial={false}>
        {active.map(({ key, value }) => (
          <motion.span
            key={key}
            layout
            // `scale`, not a raw `transform` string. `layout` + `popLayout` means
            // framer's projection writes `transform` on this node itself, and a
            // literal transform can be overwritten by it — silently, since the
            // exit test asserts opacity and would never notice a dead scale.
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={transition}
            className={cn(
              CHIP_CHROME,
              // The stored Contributor string is 33 characters — it wraps rather
              // than pushing Clear all off the row (Catalogue.dc.html:79).
              // 350, not that line's literal `max-width:330px`: content-box
              // again — 330 + `padding:6px 8px 6px 10px` + 1px border each side
              // is 350 across as drawn (see nav-side-bar.tsx).
              key === "contributor" && "max-w-[350px]"
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
          </motion.span>
        ))}
      </AnimatePresence>

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
