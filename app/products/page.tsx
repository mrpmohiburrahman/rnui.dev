// app/products/page.tsx

import type { Metadata } from "next"
import type { ReactElement } from "react"
import { permanentRedirect } from "next/navigation"
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
import { existingContributor } from "@/lib/contributor-match"
import { contributorCardUrl } from "@/lib/og-contributor-url"
import { CataloguePage } from "@/components/catalogue-page"

// Adjust the import path if necessary
import { getRecordings, getTopViewCount } from "../actions/get-recordings"

/** Every spelling the catalogue holds, for ADR-0009's matcher. */
const CONTRIBUTOR_NAMES = [...new Set((allRecordings as { contributor: string }[]).map((r) => r.contributor))]

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

/**
 * The Contributor card, on the filtered catalogue.
 *
 * **A filtered `/products` link gets the Contributor's fan; an unfiltered one does not.** The
 * card is about a person, so `?contributor=` is the only thing that changes it — and leaving the
 * root card alone for every other shape of this route means the change is additive and cannot
 * regress the link people already share.
 *
 * **`twitter.images` is set as well as `openGraph.images`, and that is not belt-and-braces.**
 * They are two independent caches, so a card is only as good as its worse slot. The Recording
 * route sets `openGraph.images` and forgets the Twitter one, which is why sharing a demo link
 * to X shows a stale photo; that bug is recorded in the effort's ticket 01 and is the reason
 * this one sets both.
 *
 * `generateMetadata` receives `searchParams` — confirmed against Next's docs, and the reason
 * this is possible at all: an `opengraph-image` file convention gets `params: undefined` and
 * never sees a search param, so the card has to be a route. See
 * `app/api/og/contributor/route.ts`.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { contributor } = await searchParams
  if (!contributor) return {}

  // The exact catalogue spelling, not the query string. `?contributor=` reaches this route
  // through links, redirects and hand-typed URLs, and the name string is the identity
  // (ADR-0009) — so it is resolved through `lib/contributor-match.ts`, the module that
  // already implements that rule, and then rendered as the catalogue writes it, Hangul and
  // parentheses intact. This was the third hand-rolled copy of that fold in this feature.
  const known = existingContributor(contributor, CONTRIBUTOR_NAMES)

  // An unknown name falls through to the root card rather than 404-ing: the *page* is a real
  // catalogue view with an empty result set and its own zero panel, and a metadata function is
  // the wrong place to decide the page does not exist.
  if (!known) return {}

  const title = `${known} — rnui.dev`
  const description = `All animations by ${known} on rnui.dev.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: contributorCardUrl(known), width: 1200, height: 630, alt: `${known} on rnui.dev` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [contributorCardUrl(known)],
    },
  }
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

  // The phone filter sheet's two facet lists, the same two the rail's layout
  // hands NavSidebar, threaded here rather than imported into the client page
  // (ticket 11).
  const categories = categoriesWithCounts()
  const contributors = contributorsByCount()

  // A plain block, exactly like `/` (app/page.tsx:51). This used to sit inside a
  // `<div className="flex">` left over from the pre-redesign layout, whose old
  // contents were `mx-auto` and so never revealed what the wrapper did: a block
  // child of a flex row shrink-to-fits, so the grid's
  // `repeat(auto-fill, 208px)` resolved against the chip row's width instead of
  // the viewport's and the catalogue rendered one column.
  return (
    // No top padding — see app/page.tsx. `main` already spends the mock's 22px.
    <div className="max-w-full">
      <CataloguePage
        recordings={data}
        stats={stats}
        // Required here, not optional: this route is always handed a filtered
        // set (ticket 09 step 1), so deriving the count would give the size
        // of the filter.
        perContributor={RECORDINGS_PER_CONTRIBUTOR}
        categories={categories}
        contributors={contributors}
        // The grid's visually-hidden `h1`, restored in commit 6acf554's wake. This
        // route always receives a filtered set, so `data.length` is the filtered
        // count and the facet names come from the URL the catalogue links to.
        heading={catalogueHeading({
          category,
          contributor,
          total: data.length,
        })}
        showHero={false}
        topViewCount={topViewCount}
        diagnosis={diagnosis}
      />
    </div>
  )
}

export default RecordingsPage
