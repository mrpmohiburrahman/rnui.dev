// app/products/page.tsx

import type { ReactElement } from "react"
import { permanentRedirect } from "next/navigation"
import { allRecordings } from "@/data/catalogue"
import { getUniqueCategories, getUniqueContributors } from "@/data/recording"

import { catalogueDiagnosis } from "@/lib/catalogue-filters"
import { catalogueHeading } from "@/lib/catalogue-heading"
import { CataloguePage } from "@/components/catalogue-page"

// Adjust the import path if necessary
import { getRecordings, getTopViewCount } from "../actions/get-recordings"

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
  const topViewCount = await getTopViewCount()

  const stats = {
    recordings: allRecordings.length,
    contributors: getUniqueContributors().length,
    categories: getUniqueCategories().length,
  }

  // Why the result set is empty, computed here because only a server component
  // can hold the whole catalogue: the zero panel has to answer "what would I see
  // if I dropped this one filter". Against allRecordings rather than
  // getRecordings() — the diagnosis reads caption, Category and Contributor
  // only, none of which come from Firestore, so the plain array is both correct
  // and free.
  const diagnosis =
    data.length === 0
      ? catalogueDiagnosis(allRecordings, { category, contributor, search })
      : null

  return (
    <div className="flex">
      <div className=" max-w-full pt-4">
        <CataloguePage
          recordings={data}
          stats={stats}
          showHero={false}
          topViewCount={topViewCount}
          diagnosis={diagnosis}
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
