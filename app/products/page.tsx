// app/products/page.tsx

import type { ReactElement } from "react"
import { permanentRedirect } from "next/navigation"
import { allRecordings } from "@/data/catalogue"
import { getUniqueCategories, getUniqueContributors } from "@/data/recording"

import { catalogueHeading } from "@/lib/catalogue-heading"
import { CataloguePage } from "@/components/catalogue-page"

// Adjust the import path if necessary
import { getRecordings } from "../actions/get-recordings"

interface PageProps {
  searchParams: Promise<{
    search?: string
    category?: string
    contributor?: string
    // `?author=` is not a name this codebase uses any more, but it is a name the
    // deployed site already hands out: `main`'s catalogue-nav writes
    // `/products?author=…` on all 24 contributor links. It is less exposed than
    // `?category=` — the sidebar sits behind a Suspense fallback and reads
    // useSearchParams() at module top, so a crawler that runs no JavaScript never
    // saw them — but a rendering crawler did, and a visitor can have bookmarked
    // one. Kept alive on exactly ADR-0004's reasoning for /products and
    // ?category=: "public links that middleware.ts exists specifically to keep
    // alive".
    author?: string
  }>
}

const RecordingsPage = async ({
  searchParams,
}: PageProps): Promise<ReactElement> => {
  // Next.js 15 requires awaiting searchParams
  const params = await searchParams

  // A permanent redirect rather than a second reader of the same filter, so a
  // filtered catalogue has one canonical address instead of two that render
  // identically. No middleware.ts change: adding /products to the matcher would
  // run middleware on the busiest route in the site to serve a case that should
  // be rare and getting rarer.
  if (params.author && !params.contributor) {
    const next = new URLSearchParams(params as Record<string, string>)
    next.delete("author")
    next.set("contributor", params.author)
    permanentRedirect(`/products?${next}`)
  }

  const { search, category, contributor } = params
  const data = await getRecordings(search, category, contributor)

  const stats = {
    recordings: allRecordings.length,
    contributors: getUniqueContributors().length,
    categories: getUniqueCategories().length,
  }

  return (
    <div className="flex">
      <div className=" max-w-full pt-4">
        <CataloguePage
          recordings={data}
          treatment="plain"
          stats={stats}
          showHero={false}
          heading={catalogueHeading({
            category,
            contributor,
            total: data.length,
          })}
        />
      </div>
    </div>
  )
}

export default RecordingsPage
