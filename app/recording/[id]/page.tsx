// app/recording/[id]/page.tsx
//
// One Recording, at its own address. 277 of these are prerendered at build time
// from data/catalogue.ts — what is static is static. What the body draws is not:
// this form reads the Recording from getRecordings() so the view bar,
// the vote count and MORE FROM THIS CONTRIBUTOR's tiles have the counts steps 6
// and 7 need, and it revalidates on the same 300-second clock the grid's counts
// cache on (app/actions/get-recordings.ts:23-29), so the tile on / and the body
// here never disagree, and neither adds a Firestore read of its own.
//
// The overlay in components/recording-overlay.tsx is the same body reached from
// the grid; this route is what makes a Recording shareable and crawlable.
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { allRecordings } from "@/data/catalogue"
import { RECORDINGS_PER_CONTRIBUTOR } from "@/data/recording"

import { getCdnUrl } from "@/lib/cdn"

import { getRecordings, getTopViewCount } from "../../actions/get-recordings"
import { RecordingBody } from "./recording-body"

// The page's counts refresh on the same clock as the grid's.
export const revalidate = 300

type Params = { params: Promise<{ id: string }> }

const findRecording = async ({ params }: Params) => {
  const { id } = await params
  return allRecordings.find((recording) => recording.id === id)
}

export function generateStaticParams() {
  return allRecordings.map(({ id }) => ({ id }))
}

// Only the ids above are Recordings, so anything else is a 404 rather than a
// render. Without this Next would answer an unknown id on demand.
export const dynamicParams = false

export async function generateMetadata(props: Params): Promise<Metadata> {
  const recording = await findRecording(props)
  if (!recording) return {}

  const title = `${recording.caption} — ${recording.contributor}`
  const description = `${recording.caption}, a ${recording.category} demo by ${recording.contributor}.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [getCdnUrl(recording.posterPath)],
    },
  }
}

export default async function RecordingPage(props: Params) {
  const recording = await findRecording(props)
  // Unreachable while dynamicParams is false — Next refuses the request before
  // this runs. Kept because it is also what narrows `recording` to a Recording.
  if (!recording) notFound()

  // The cached readers both routes already use, awaited together the way
  // app/bookmarks/page.tsx does. getRecordings() with no argument is the whole
  // unfiltered catalogue out of the same unstable_cache entry the grid reads,
  // so this route adds no Firestore read of its own — which is what the header
  // comment above claims and, calling getRecordingsWithCounts() directly, did
  // not do.
  const [withCounts, topViewCount] = await Promise.all([
    getRecordings(),
    getTopViewCount(),
  ])
  const current = withCounts.find((r) => r.id === recording.id) ?? {
    ...recording,
    view_count: 0,
    vote_count: 0,
  }

  // The body's counts, computed here where the whole catalogue with counts is in
  // hand (ticket 09 step 13). catalogueTotal is never the mock's 148 and never a
  // filtered page: this route has no filter to hand.
  // Never reduced over the array a second time: the tile's bar needs the
  // identical number, and two derivations are two chances to disagree
  // (ticket 09 step 6).
  // Both from the catalogue itself rather than from the counts read, so a
  // Firestore outage — which getRecordings() answers with [] rather than a
  // throw — cannot make the page print "0 of the 0 recordings here". They are
  // also the same two sources the overlay now reads, so the two surfaces cannot
  // give one Recording two different Contributor totals.
  const catalogueTotal = allRecordings.length
  const contributorTotal = RECORDINGS_PER_CONTRIBUTOR[current.contributor] ?? 0
  const more = withCounts
    .filter((r) => r.contributor === current.contributor && r.id !== current.id)
    .slice(0, 2)

  return (
    <div className="w-full">
      {/* The shared-link header (Detail.dc.html:13-18) — this route's whole
          header, not a row under the catalogue's: components/site-shell.tsx
          gives `/recording/*` no catalogue header and no rail, because the
          drawing puts its own wordmark here and would otherwise draw two.
          `gap:16px`, `height:62px`, `padding:0 26px`, one hairline below. The
          fill is `bg-rail`: Detail.dc.html's own `headerBg` is `#0C0D11` dark /
          `#EFEFEB` light, which is the rail token, not the catalogue header's
          translucent `rgba(10,11,13,0.92)`. Nothing scrolls under this one. */}
      <nav
        className="flex h-[62px] items-center gap-4 border-b border-line bg-rail px-[26px]"
        aria-label="Recording navigation"
      >
        <Link
          href="/"
          className="text-[16px] font-bold tracking-[-0.02em] text-t1"
        >
          rnui<span className="text-acc">.dev</span>
        </Link>
        <Link
          href="/"
          className="whitespace-nowrap text-[12.5px] text-acc underline underline-offset-3"
        >
          ← All recordings
        </Link>
        {/* The two context labels are desktop-only. Detail.dc.html:12 gates this
            whole header on `isPage`, so the drawing gives the phone form no
            header at all — but this route is where a shared link lands, and a
            phone visitor with no wordmark and no way back is a worse answer
            than the drawing's. Keeping the two functional items and dropping
            the two informational ones is what holds the drawn 62px to one row:
            all four at 390 wrapped `← All recordings` onto a second line and
            broke the height. */}
        <span className="hidden font-mono text-[10px] tracking-[0.1em] text-t3 sm:inline">
          {recording.category.toUpperCase()} ·{" "}
          {withCounts.filter((r) => r.category === recording.category).length}{" "}
          {/* Detail.dc.html:16 draws "148 ENTRIES"; the mock predates the
              rename and decision 3 renames in copy too. */}
          RECORDINGS
        </span>
        <span className="ml-auto hidden font-mono text-[9.5px] tracking-[0.12em] text-t3 sm:inline">
          OPENED FROM A SHARED LINK
        </span>
      </nav>

      {/* All three of the drawing's gutters, not just the page's
          (Detail.dc.html:131):

            mobile  16px 16px 20px   shell 390
            overlay 26px 28px 28px   shell 1080
            page    34px 26px 44px   shell 1440

          The breakpoints are the ones recording-detail.tsx already switches its
          media width on (358 → sm:380 → lg:414, Detail.dc.html:132), so the
          padding and the column it wraps change forms together. Spending the
          page's 26px side gutter at every width was starving the media on a
          phone: `w-[358px] max-w-full` resolved to 390 − 52 = 338 where the
          drawing fits exactly 390 − 32 = 358, and the vertical gutters ran
          double. */}
      <div className="px-4 pb-5 pt-4 sm:px-7 sm:pb-7 sm:pt-[26px] lg:px-[26px] lg:pb-[44px] lg:pt-[34px]">
        {/* This route counts its own open (ADR-0007:3), through countsOwnOpen. */}
        <RecordingBody
          recording={current}
          topViewCount={topViewCount}
          catalogueTotal={catalogueTotal}
          contributorTotal={contributorTotal}
          more={more}
        />
      </div>
    </div>
  )
}
