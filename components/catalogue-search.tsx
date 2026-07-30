"use client"

import { useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"
import { getUniqueCategories } from "@/data/entry"

import { PlaceholdersAndVanishInput } from "./ui/placeholders-and-vanish-input"

const placeholders = getUniqueCategories()
export function CatalogueSearch() {
  const router = useRouter()
  const pathname = usePathname()

  // The pending flag has no reader. It drove a spinner inside an alternative input
  // that shipped commented out and has now been deleted.
  const [, startTransition] = useTransition()

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleSearch(e.target.value)
  }

  return (
    <div className="relative max-w-[90%] md:min-w-[4rem] w-full md:max-w-[42ch] md:mr-auto ">
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleInputChange}
        onSubmit={() => {}}
      />
    </div>
  )
}
