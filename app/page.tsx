// app/page.tsx
import { allRecordings } from "@/data/catalogue"
import { getUniqueCategories, getUniqueContributors } from "@/data/recording"

import { catalogueHeading } from "@/lib/catalogue-heading"
import { CataloguePage } from "@/components/catalogue-page"

import { getRecordings } from "./actions/get-recordings"

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

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <CataloguePage
        recordings={data}
        treatment="framed"
        stats={stats}
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
