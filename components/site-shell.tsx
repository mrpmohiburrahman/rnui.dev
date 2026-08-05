// components/site-shell.tsx
//
// Which chrome a route gets. Two shells are drawn, not one:
//
//   Catalogue.dc.html   header (search, sort, Saved, mode) + 265px rail + main
//   Detail.dc.html:12-18  a 62px header of its own — wordmark, a way back, the
//                         Category context, `OPENED FROM A SHARED LINK` — over a
//                         full-width 1440 shell with no rail at all
//
// The Recording detail's `page` form draws its own wordmark (Detail.dc.html:14),
// which is only coherent if it replaces the catalogue header rather than sitting
// under it. It also sets `shellW: 1440` and `shellBg: canvas` with no border and
// no radius (:124-127) — a page, not a card — and the composition starts at
// `padding: 34px 26px 44px` (:131), which is not `main`'s 22/26/34.
//
// So the shared-link route opts out of the whole catalogue shell and owns its own
// header and gutters. A client component because the switch is a routing fact;
// the alternative was a `(catalogue)` route group, which moves nine route
// folders to express the same thing.
//
// The signal is the rendered segment, NOT `usePathname()`. The overlay opens by
// pushing `/recording/<id>` with the History API onto whichever catalogue route
// the visitor is on (components/catalogue-page.tsx) — no server render, no route
// change, Back is the close. `usePathname` reports that pushed address, so a
// pathname switch tore the header and the rail out from behind the scrim the
// moment a card was clicked, remounted the whole catalogue under it, and put
// them back on close — which is also why the overlay's exit animation had no
// frames to play. `useSelectedLayoutSegment` reads the router's rendered tree
// instead, so it says `recording` only on a real navigation to the detail route
// and stays on the catalogue's segment for the overlay.
"use client"

import type { ReactNode } from "react"
import { useSelectedLayoutSegment } from "next/navigation"

/** The catalogue header and rail — rendered on every route but the detail. */
export function ShellChrome({
  header,
  rail,
  children,
}: {
  header: ReactNode
  rail: ReactNode
  children: ReactNode
}) {
  // `recording` is the folder name of app/recording/[id], and the segment the
  // root layout sees when that route is the one actually rendered.
  if (useSelectedLayoutSegment() === "recording") {
    return <div className="flex flex-1 flex-col">{children}</div>
  }

  return (
    <>
      {header}
      <div className="flex flex-1 items-stretch">
        {rail}
        {/* The mock's main gutter: 22px top, 34px bottom, 26px left — and 13px
            right, which is the gutter the drawing actually renders
            (Catalogue.dc.html:59 asks for 26 on both sides, but `main` is
            flex:1 inside a 1440 root with `overflow:hidden`, so at the drawn
            width the right half of that padding falls outside the frame and the
            visible gutter is 1440 - 265 rail - 26 - 1136 grid = 13).

            Measured on the mock: rail 8->273, grid 299->1435, frame ends 1448.
            Nothing is clipped — only the padding is. Reproducing the 13 is what
            keeps five 208px tracks on the row at 1440 and puts the right-aligned
            stats row and result line on the same pixel the drawing puts them.

            `min-w-0` so a wide child cannot push the document past the
            viewport. */}
        {/* Below `md` the gutters are the phone's own: CatalogueMobile.dc.html
            :32 puts the content block at `padding:14px 14px 96px`, and its 96
            is the fixed dock's clearance, which the grid already reserves
            (recording-card-grid.tsx). */}
        <main className="w-full min-w-0 flex-1 p-[14px] pb-[34px] md:pl-[26px] md:pr-[13px] md:pt-[22px]">
          {children}
        </main>
      </div>
    </>
  )
}
