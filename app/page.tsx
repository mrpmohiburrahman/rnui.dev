// app/page.tsx
import { allRecordings } from "@/data/catalogue"
import {
  categoriesWithCounts,
  contributorsByCount,
  getUniqueCategories,
  getUniqueContributors,
  RECORDINGS_PER_CONTRIBUTOR,
} from "@/data/recording"

import { catalogueDiagnosis } from "@/lib/catalogue-filters"
import { catalogueHeading } from "@/lib/catalogue-heading"
import { CataloguePage } from "@/components/catalogue-page"

import { getRecordings, getTopViewCount } from "./actions/get-recordings"

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams

  // The three counts are derived here, in the server component, where
  // allRecordings and the two getUnique* helpers live — exactly how
  // app/layout.tsx hands the rail its numbers. Computing them in the client
  // would pull the whole catalogue into a client chunk
  // (components/catalogue-search.tsx:54-57).
  const stats = {
    recordings: allRecordings.length,
    contributors: getUniqueContributors().length,
    categories: getUniqueCategories().length,
  }
  const data = await getRecordings(params.search)
  const topViewCount = await getTopViewCount()

  // The phone filter sheet's two facet lists, count-bearing, the same two the
  // rail's layout hands NavSidebar — computed here so this server component
  // can pass them to the client page without a value import (ticket 11).
  const categories = categoriesWithCounts()
  const contributors = contributorsByCount()

  // The term is the only filter this route applies, so it is the only one the
  // zero panel can diagnose. Same reason as /products for computing it here.
  const diagnosis =
    data.length === 0
      ? catalogueDiagnosis(allRecordings, { search: params.search })
      : null

  return (
    // No top padding: the mock's `main` is `padding:22px 26px 34px`
    // (Catalogue.dc.html:59) and the hero is its first child, so anything added
    // here sits on top of a figure the drawing already spends.
    <div className="max-w-full">
      <CataloguePage
        recordings={data}
        stats={stats}
        // The whole-catalogue map, because ?search= narrows `data` and a
        // Contributor count derived from a narrowed set is the size of the search.
        perContributor={RECORDINGS_PER_CONTRIBUTOR}
        categories={categories}
        contributors={contributors}
        topViewCount={topViewCount}
        diagnosis={diagnosis}
        heading={catalogueHeading({ total: data.length })}
        // The mock's own showHero rule (Catalogue.dc.html:245) leaves the
        // filtered variant — which has only a search term beyond the facets —
        // off the list, so a search hides the hero.
        showHero={!params.search}
      />
    </div>
  )
}

export default Page
