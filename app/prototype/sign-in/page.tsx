// app/prototype/sign-in/page.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 04, `.scratch/sign-in-to-save/`.
// Directions for the sign-in entry point and for pressing Save while signed
// out, at /prototype/sign-in?variant=A|B|C|D.
//
// Sub-shape B rather than A on purpose, for the reason recorded in
// components/prototype/star-control-prototype.tsx: the header is rendered by
// app/layout.tsx, which a server component cannot read `?variant=` from, and
// gating the root layout would put a prototype param on every route.
//
// The real catalogue is mounted underneath so density is real. A throwaway
// header floating above an empty page would let a cramped nav look fine.
//
// Reading searchParams here is what makes this route dynamic, and it has to be:
// CataloguePage calls useSearchParams itself
// (components/catalogue-page.tsx:129), and a statically prerendered route that
// does so fails the build with "useSearchParams() should be wrapped in a
// suspense boundary". Nothing consumes the value — it is read for its effect.
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
import { SignInPrototype } from "@/components/prototype/sign-in-prototype"

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
      <SignInPrototype />
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