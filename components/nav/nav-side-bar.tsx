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
    // (Catalogue.dc.html:36), so the aside is a flat `w-[232px]` from `sm` up. The
    // number once had to clear the layout's leftover `sm:ml-[10.5rem]`, but ticket
    // 04 put the rail in flow and deleted that margin, so nothing else references
    // it now.
    <aside className="hidden w-[232px] flex-none flex-col border-r border-line bg-rail px-4 pb-[30px] pt-5 sm:flex">
      <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <CatalogueNav categories={categories} contributors={contributors} />
      </nav>
    </aside>
  )
}
