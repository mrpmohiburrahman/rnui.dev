// components/nav/nav-side-bar.tsx

"use client"

import type { FacetCount } from "@/data/recording"

import { CatalogueNav } from "./catalogue-nav"

type NavSidebarProps = {
  categories: FacetCount[]
  contributors?: FacetCount[]
}

export function NavSidebar({ contributors, categories }: NavSidebarProps) {
  // No useSearchParams here. Reading it opts every ancestor out of prerendering,
  // and the nearest boundary was the root layout's — so eleven prerendered routes
  // served "Loading sidebar..." as their sidebar until React ran. The read now
  // lives on the one thing that needs it, inside CatalogueNav.
  //
  // The rail's own appearance — width, the CATEGORIES / CONTRIBUTORS labels, the
  // counts, the row treatment — is ticket 05's. The list scrolls natively (the
  // Radix ScrollArea's viewport needed JavaScript, so a visitor without it could
  // see the Categories but never reach the Contributors below them).
  //
  // The mobile sheet that used to live here has moved up into the site header's
  // phone block (components/site-header.tsx): there can be only one "Toggle
  // Menu" trigger, and the header is where the mock draws it.
  return (
    // The mock's rail is width:232px;flex:none on every desktop variant
    // (Catalogue.dc.html:36) — but that 232 is a *content* width. The mock has
    // no reset, so the nav is content-box: 232 + 16px of padding either side +
    // the 1px right border is 265px on screen, which is where the mock actually
    // puts the grid's left edge (measured: nav 8->273 at a 1440 canvas). This
    // aside is border-box like everything Tailwind touches, so `w-[232px]` drew
    // a rail 33px narrower than the drawing. 265 is the same rail.
    //
    // It costs a column in the 1440-1472 band: the grid is auto-fill (see
    // recording-card-grid.tsx GRID_CLASS) and five 208px tracks plus their gaps
    // need 1136, which 1440 - 265 - 52 no longer holds. The mock does not fit
    // there either — its own fifth column runs 13px past the 26px right gutter
    // and is saved only by `overflow:hidden` on a fixed 1440 frame, which a
    // responsive page cannot do without clipping real content. Five columns
    // return at 1453 and up.
    // The breakpoint is the filter dock's own (components/filter-dock.tsx, also
    // `md:hidden`): below `md` the rail is gone and the sheet is the only route
    // to a facet, so one boundary means one surface at any width — the 640-767px
    // band has neither a rail over which a fixed dock paints nor a header with
    // no sort control at all (site-header.tsx removes it below `md`).
    <aside className="hidden w-[265px] flex-none flex-col border-r border-line bg-rail px-4 pb-[30px] pt-5 md:flex">
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <CatalogueNav categories={categories} contributors={contributors} />
      </nav>
    </aside>
  )
}
