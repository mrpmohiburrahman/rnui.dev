// app/contributors/contributor-rows.tsx
//
// The rows only. `posthog-js` cannot be called from a server component, and every
// row reports the filter it sets — so this is the client half and app/
// contributors/page.tsx stays a server component. The names and counts arrive as
// props rather than being derived here, which keeps data/catalogue.ts out of
// this route's JavaScript chunk.
"use client"

import Link from "next/link"
import type { FacetCount } from "@/data/recording"

import { filterApplied } from "@/lib/analytics"

export function ContributorRows({
  contributors,
}: {
  contributors: FacetCount[]
}) {
  return (
    // 6px gap and the 720px bound: the mobile sheet's Contributor list
    // (CatalogueMobile.dc.html:65) and the mock's own bound for a block of
    // prose-width content inside main (Catalogue.dc.html:97). The 22px above is
    // the mock's only gap between two stacked blocks in a column
    // (Catalogue.dc.html:47 vs :37).
    <ul className="mt-[22px] flex max-w-[720px] flex-col gap-[6px]">
      {contributors.map(({ name, count }) => (
        <li key={name}>
          <Link
            // Exactly what facetHref (components/nav/catalogue-nav.tsx:80-93)
            // produces for a visitor arriving with no other filter, so the rail
            // and the index cannot drift. 23 links, so no prefetch: this page
            // would otherwise fetch the whole catalogue 23 times over.
            href={`/products?${new URLSearchParams({ contributor: name })}`}
            prefetch={false}
            // Literally 1, not a computed count: a link from this page always
            // lands on a URL whose only parameter is `contributor`. Without the
            // event a filter set from here is invisible to dashboard 1937576,
            // which reads filter_applied by name — a filter arriving with no
            // event makes the funnel wrong rather than merely incomplete.
            onClick={() => filterApplied("contributor", name, 1)}
            // The sheet's Contributor row (CatalogueMobile.dc.html:67); its
            // selected treatment (:66) reused for hover, because nothing on this
            // page is filtered — every row is just a link. 120ms is the
            // Specimen's figure for a filter control (Specimen.dc.html:163), and
            // the focus ring is the rail's, so tabbing between the two does not
            // change what a focus ring looks like.
            className="group flex min-h-[38px] items-center gap-2 rounded-chip border border-line px-[11px] text-[12.5px] text-t2 transition-colors duration-120 ease-out hover:border-acc hover:bg-acc-soft hover:text-t1 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-acc"
          >
            {/* Never truncated: ticket 05 (d) rejected cutting these on the
                evidence that `Enzo Manuel Mangano ( Reactiive )` and
                `Konstantinos Efkarpidis` are unreadable at a truncation. */}
            <span className="[overflow-wrap:anywhere]">{name}</span>
            {/* aria-hidden, as the rail's counts are: it leaves the exact
                Contributor name as the link's accessible name, which is what
                makes "no two rows have the same accessible name" the assertion
                that catches the trailing space coming back. With the count read
                out, one person split in two would read as two different names. */}
            <span
              aria-hidden="true"
              className="ml-auto flex-none font-mono text-[10px] tabular-nums text-t3 transition-colors duration-120 ease-out group-hover:text-acc"
            >
              {count}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
