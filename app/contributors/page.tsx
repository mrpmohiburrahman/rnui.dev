// app/contributors/page.tsx
//
// The Contributor index — the destination for the rail's `All 23 contributors →`
// (Catalogue.dc.html:56), which the mock draws as `href="#"` because a mock has
// no router.
//
// There is no `/contributors/[slug]`, and there will not be one. A Contributor's
// identity in this data is the exact string in `recording.contributor`, and a
// slug cannot carry it: `Pushkar Tandon` and `Pushkar Tandon ` collapse to the
// same slug under every slugifier (only trailing whitespace separates them), and
// `Daehyeon Mun (문대현)` loses `문대현` entirely under NFKD-then-strip. A scheme
// that works for 22 of 23 names and silently merges the 23rd is not a scheme. So
// `/products?contributor=<exact name>` is the only address for one Contributor's
// Recordings, and each row below links to it — which also keeps a filtered
// catalogue at one canonical address rather than two that render identically
// (ADR-0008).
//
// A server component that touches no Firestore. `getRecordings()` merges view
// and vote counts a directory has no use for, and awaiting anything
// request-scoped is what keeps `/` and `/products` out of the sitemap. This page
// reads module-scope arrays only, so it prerenders and lands in the sitemap for
// free.
import type { Metadata } from "next"
import { allRecordings } from "@/data/catalogue"
import { contributorsByCount } from "@/data/recording"

import { ContributorRows } from "./contributor-rows"

// Root metadata (data/meta-data.ts) sets metadataBase and a site-wide title, and
// its `socialMediaTags` key is not part of Next's Metadata type and is ignored,
// so a route that wants its own title and description has to say so.
//
// And no `openGraph` block, which is not the same thing as not wanting a card.
// app/opengraph-image.tsx is a root file-convention image that every descendant
// inherits — but measured on the built HTML, a segment that declares any
// `openGraph` of its own replaces the inherited one wholesale and loses the
// image with it: `/aboutus`, which exports no metadata at all, carries og:image
// plus its alt, type, width and height; this route with an `openGraph: { title,
// description }` carried none of the five. The image URL Next emits is hashed
// (`/opengraph-image?ad14766c…`), so naming it back by hand would be a second
// spelling of it that rots the day the file changes. Scrapers fall back to
// <title> and <meta name="description"> for the card's text, and both are here.
export const metadata: Metadata = {
  title: "Contributors",
  description:
    "Everyone whose React Native work is in the catalogue, with how many recordings each of them contributed.",
}

export default function ContributorsPage() {
  const contributors = contributorsByCount()

  return (
    <div className="max-w-full pt-2">
      {/* The catalogue's own heading row (Catalogue.dc.html:87-90). An h1 rather
          than the catalogue's h2: this is the document's only top-level heading.
          Both numbers are derived and neither is ever typed. */}
      <div className="flex w-full items-baseline justify-between gap-4 pb-[14px]">
        <h1 className="text-section m-0 text-t1">Contributors</h1>
        <span className="min-w-[180px] text-right font-mono text-[10px] tracking-[0.1em] tabular-nums text-t3">
          {contributors.length} CONTRIBUTORS · {allRecordings.length} RECORDINGS
        </span>
      </div>

      {/* The hero paragraph's type (components/hero.tsx:25). The only invented
          string on the page. */}
      <p className="mt-[9px] max-w-[520px] text-[13px] leading-[1.5] text-t2">
        Every recording here belongs to its contributor. Open a name to see all
        of theirs.
      </p>

      <ContributorRows contributors={contributors} />
    </div>
  )
}
