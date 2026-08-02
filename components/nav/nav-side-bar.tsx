// components/nav/nav-side-bar.tsx

"use client"

import { ModeToggle } from "@/app/providers"

import { CatalogueNav } from "./catalogue-nav"

type NavSidebarProps = {
  categories: string[]
  contributors?: string[]
}

export function NavSidebar({ contributors, categories }: NavSidebarProps) {
  // No useSearchParams here. Reading it opts every ancestor out of prerendering,
  // and the nearest boundary was the root layout's — so eleven prerendered routes
  // served "Loading sidebar..." as their sidebar until React ran. The read now
  // lives on the one thing that needs it, inside CatalogueNav.
  //
  // The rail's own appearance — width, padding, the CATEGORIES / CONTRIBUTORS
  // headings, the counts, the chip treatment — is ticket 05's; this ticket only
  // changed the positioning from `fixed inset-y-0 left-0 z-10` to an in-flow
  // `flex-none` column, so the rail sits below the header the mock draws instead
  // of behind it.
  //
  // The mobile sheet that used to live here has moved up into the site header's
  // phone block (components/site-header.tsx): there can be only one "Toggle
  // Menu" trigger, and the header is where the mock draws it.
  return (
    <aside className="w-42 flex-none hidden sm:flex flex-col bg-[#FAFAFA] justify-center dark:bg-background pt-10">
      {/* Navigation Section */}
      <nav className="flex flex-col items-center gap-4 px-2 py-5">
        <CatalogueNav categories={categories} contributors={contributors} />
      </nav>

      {/* Bottom Controls: Avatar and ModeToggle */}
      <div className=" flex flex-col justify-center gap-4 items-start pl-4">
        {/* Mode Toggle */}
        <ModeToggle />
      </div>
    </aside>
  )
}
