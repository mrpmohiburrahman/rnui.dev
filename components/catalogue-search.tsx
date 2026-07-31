"use client"

import { useEffect, useRef, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { getUniqueCategories } from "@/data/entry"

import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input"

const placeholders = getUniqueCategories()

/** How long the box stays quiet before it navigates. */
const DEBOUNCE_MS = 300

export function CatalogueSearch() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
    <div className="relative max-w-[90%] md:min-w-[4rem] w-full md:max-w-[42ch] md:mr-auto ">
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        // Seeded once, from the URL this component mounted against, so a shared
        // `/?search=slider` shows the term that filtered the grid. Writes still
        // go one way, keystroke → URL; see the ticket for when a resync is owed.
        defaultValue={searchParams.get("search") ?? ""}
        onChange={handleInputChange}
        onSubmit={() => {}}
      />
    </div>
  )
}
