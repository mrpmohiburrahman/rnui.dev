// app/prototype/star-button/page.tsx
//
// PROTOTYPE — throwaway. Wayfinder ticket 01, `.scratch/github-star-button/`.
// Five directions for a third control in the site header, at
// /prototype/star-button?variant=A|B|C|D|E.
//
// Sub-shape B rather than A on purpose: the thing being prototyped *is* the
// header, and the header is rendered by app/layout.tsx, which a server component
// cannot read `?variant=` from. Gating the root layout would put a prototype
// param on every route of the site. So this route mounts a copy of the header
// shell (components/prototype/star-control-prototype.tsx) above the real
// catalogue — same components, same data, same density, prototype confined to
// one throwaway URL.
import { allRecordings } from "@/data/catalogue"
import {
  categoriesWithCounts,
  contributorsByCount,
  getUniqueCategories,
  getUniqueContributors,
  RECORDINGS_PER_CONTRIBUTOR,
} from "@/data/recording"

import { CataloguePage } from "@/components/catalogue-page"
import { StarControlPrototype } from "@/components/prototype/star-control-prototype"

import { getRecordings } from "@/app/actions/get-recordings"

// Reading searchParams here is what makes this route dynamic, and it has to be
// dynamic: `CataloguePage` calls `useSearchParams` itself
// (components/catalogue-page.tsx:129), and a statically prerendered route that
// does so fails the build with "useSearchParams() should be wrapped in a suspense
// boundary". The real catalogue routes never hit this because their own pages
// already read searchParams server-side. Nothing consumes the value — it is read
// for its effect on rendering.
async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await searchParams
  const data = await getRecordings()
  const topViewCount = 0

  return (
    <div className="max-w-full">
      <StarControlPrototype />
      <CataloguePage
        recordings={data}
        stats={{
          recordings: allRecordings.length,
          contributors: getUniqueContributors().length,
          categories: getUniqueCategories().length,
        }}
        perContributor={RECORDINGS_PER_CONTRIBUTOR}
        categories={categoriesWithCounts()}
        contributors={contributorsByCount()}
        topViewCount={topViewCount}
        showHero
      />
    </div>
  )
}

export default Page