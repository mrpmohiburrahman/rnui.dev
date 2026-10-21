// app/prototype/subscribe-popup/page.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/subscribe-popup/`.
// What the subscribe popup looks like, matching the Save gate, at
// /prototype/subscribe-popup?variant=A|B|C|D (states, not layouts — the map
// forbids a new visual language; see components/prototype/subscribe-popup-prototype.tsx).
//
// Sub-shape B on purpose, same reason as app/prototype/sign-in/page.tsx: the
// popup fires from a trigger outside any one page, so there is no host page
// to gate with `?variant=`. The real catalogue mounts underneath so density,
// header, and phone widths are real.
//
// Reading searchParams here keeps the route dynamic: CataloguePage calls
// useSearchParams itself (components/catalogue-page.tsx:129), and a
// statically prerendered route that does so fails the build. Nothing
// consumes the value — it is read for its effect.
import { allRecordings } from "@/data/catalogue"
import { catalogueHeading } from "@/lib/catalogue-heading"
import {
  categoriesWithCounts,
  contributorsByCount,
  getUniqueCategories,
  getUniqueContributors,
  RECORDINGS_PER_CONTRIBUTOR,
} from "@/data/recording"

import { CataloguePage } from "@/components/catalogue-page"
import { SubscribePopupPrototype } from "@/components/prototype/subscribe-popup-prototype"

import { getRecordings } from "@/app/actions/get-recordings"

async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await searchParams
  const data = await getRecordings()

  return (
    <div className="max-w-full">
      <SubscribePopupPrototype />
      <CataloguePage
        recordings={data}
        heading={catalogueHeading({ total: data.length })}
        stats={{
          recordings: allRecordings.length,
          contributors: getUniqueContributors().length,
          categories: getUniqueCategories().length,
        }}
        perContributor={RECORDINGS_PER_CONTRIBUTOR}
        categories={categoriesWithCounts()}
        contributors={contributorsByCount()}
        topViewCount={0}
        showHero
      />
    </div>
  )
}

export default Page
