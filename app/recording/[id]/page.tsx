// app/recording/[id]/page.tsx
//
// One Recording, at its own address. 277 of these are prerendered at build time
// from data/catalogue.ts — no Firestore, no searchParams, so nothing here is
// dynamic. This is what makes a Recording shareable and crawlable; the overlay in
// components/recording-overlay.tsx is the same body reached from the grid.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { allRecordings } from "@/data/catalogue"

import { getCdnUrl } from "@/lib/cdn"
import { RecordingDetail } from "@/components/recording-detail"

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

  // The point of giving a Recording an address: without this a shared link
  // previews as the site's generic card.
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

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      {/* This route counts its own open (ADR-0007:3). The grid's open is counted
          by the card that pushed the address; arriving here cold — a shared
          link, a cmd-clicked headline — there is no card and no click, so
          nothing else can. */}
      <RecordingDetail recording={recording} countsOwnOpen />
    </div>
  )
}
