// app/recording/[id]/page.tsx
//
// One Recording, at its own address. 277 of these are prerendered at build time
// from data/catalogue.ts — what is static is static. What the body draws is not:
// this form reads the Recording from getRecordingsWithCounts() so the view bar,
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
import { getRecordingsWithCounts } from "@/data/recording"

import { getCdnUrl } from "@/lib/cdn"
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

  const withCounts = await getRecordingsWithCounts()
  const current =
    withCounts.find((r) => r.id === recording.id) ?? { ...recording, view_count: 0, vote_count: 0 }

  // The body's counts, computed here where the whole catalogue with counts is in
  // hand (ticket 09 step 13). catalogueTotal is never the mock's 148 and never a
  // filtered page: this route has no filter to hand.
  const catalogueTotal = withCounts.length
  const topViewCount = Math.max(0, ...withCounts.map((r) => r.view_count ?? 0))
  const contributorTotal = withCounts.filter(
    (r) => r.contributor === current.contributor
  ).length
  const more = withCounts
    .filter(
      (r) => r.contributor === current.contributor && r.id !== current.id
    )
    .slice(0, 2)

  return (
    <div className="w-full">
      {/* The shared-link nav row (Detail.dc.html:13-18). The wordmark is ticket
          04's concern, not rebuilt here; this row continues whatever header the
          shell has. */}
      <nav
        className="flex items-center gap-4 h-[62px] px-[26px] border-b border-line bg-rail"
        aria-label="Recording navigation"
      >
        <Link
          href="/"
          className="text-[12.5px] text-acc underline underline-offset-3"
        >
          ← All recordings
        </Link>
        <span className="font-mono text-[10px] tracking-[0.1em] text-t3">
          {recording.category.toUpperCase()} ·{" "}
          {withCounts.filter((r) => r.category === recording.category).length}{" "}
          ENTRIES
        </span>
        <span className="ml-auto font-mono text-[9.5px] tracking-[0.12em] text-t3">
          OPENED FROM A SHARED LINK
        </span>
      </nav>

      {/* This route counts its own open (ADR-0007:3), through countsOwnOpen. */}
      <RecordingBody
        recording={current}
        topViewCount={topViewCount}
        catalogueTotal={catalogueTotal}
        contributorTotal={contributorTotal}
        more={more}
      />
    </div>
  )
}