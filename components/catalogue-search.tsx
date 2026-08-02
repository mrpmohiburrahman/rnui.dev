"use client"

import { useEffect, useRef, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input"

/** How long the box stays quiet before it navigates. */
const DEBOUNCE_MS = 300

export function CatalogueSearch({
  recordingCount,
  searchParams,
}: {
  /** The whole catalogue's size, for the mock's `Search 277 recordings`. */
  recordingCount: number
  /**
   * Read by the header, not here. The search field lives inside the header's
   * Suspense fallback, which renders instead of — not inside — the boundary, so
   * a useSearchParams call here would bail out of static prerendering on every
   * page (site-header.tsx carries the full reasoning). The header hands down the
   * same URLSearchParams it renders the counter and sort from.
   */
  searchParams: URLSearchParams
}) {
  const router = useRouter()
  const pathname = usePathname()

  // The pending flag has no reader. It drove a spinner inside an alternative input
  // that shipped commented out and has now been deleted.
  const [, startTransition] = useTransition()

  // Reads window.location rather than the `searchParams` above, and deliberately:
  // this runs 300ms after the keystroke, by which time another control may have
  // changed the query. The hook's value is the one this render was given.
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(window.location.search)
    if (term) {
      params.set("search", term)
    } else {
      params.delete("search")
    }
    params.delete("page")
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`)
    })
  }

  // A keystroke used to navigate: `buttons` was 7 router.replace calls, 7 whole
  // -collection reads and 7 re-renders of the grid. Only the last one is wanted.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => handleSearch(term), DEBOUNCE_MS)
  }

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  return (
    // `min-w-0` lets the field shrink below its placeholder's width in the
    // header's flex row instead of pushing the document sideways between md and
    // lg, where the six control groups nearly fill the viewport.
    <div className="relative w-full min-w-0 flex-1 max-w-[400px]">
      {/* The rotating Category hint this component used to feed the input is
          gone, and with it the module-scope getUniqueCategories() call — the
          last value import of @/data/* from any client component, so
          data/catalogue.ts is no longer pulled into a client chunk. */}
      <PlaceholdersAndVanishInput
        // Seeded once, from the URL this component mounted against, so a shared
        // `/?search=slider` shows the term that filtered the grid. Writes still
        // go one way, keystroke → URL; see the ticket for when a resync is owed.
        defaultValue={searchParams.get("search") ?? ""}
        onChange={handleInputChange}
        onSubmit={() => {}}
        recordingCount={recordingCount}
      />
    </div>
  )
}
