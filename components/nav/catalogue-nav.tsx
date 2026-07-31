// components/nav/catalogue-nav.tsx

"use client"

import { Suspense, type ReactNode } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { BoxIcon, User } from "lucide-react"

import { cn, truncateString } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"


type CatalogueNavProps = {
  authors?: string[]
  categories?: string[]
  handleLinkClick?: () => void
  children?: ReactNode
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
  authors,
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
                href={`/products?category=${encodeURIComponent(category)}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("category") === category
                    ? "bg-yellow-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1">{truncateString(category, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {/* Authors */}
        {authors && authors.length > 0 && (
          <div className="flex items-center gap-2 mt-6 text-muted-foreground">
            <User className="size-5 stroke-pink-400" />
            <p className="text-sm md:hidden">Authors</p>
          </div>
        )}
        <ul className="mt-2 w-36 flex flex-col gap-2 items-start justify-center py-2">
          {authors?.map((author, index) => (
            <li key={`category-${index}-${author}`}>
              <Link
                href={`/products?author=${encodeURIComponent(author)}`}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-start space-x-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 rounded-md px-2 py-0.5",
                  "shadow-[0_0_0_1px_rgba(0,0,0,0.1)_inset,0_0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_-0.5px_0.5px_rgba(0,0,0,0.05)_inset,0_1px_2px_rgba(0,0,0,0.1)]",
                  "dark:shadow-[0_0_0_0.5px_rgba(255,255,255,0.06)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.4)]",
                  "dark:hover:shadow-[0_0_0_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_-0.5px_0.5px_rgba(255,255,255,0.1)_inset,0_0.5px_1px_rgba(0,0,0,0.4),0_1px_2px_rgba(0,0,0,0.5)]",
                  searchParams.get("author") === author
                    ? "bg-yellow-400 text-black dark:text-black"
                    : ""
                )}
                prefetch={false}
              >
                <span className="px-1">{truncateString(author, 12)}</span>
              </Link>
            </li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  )
}
