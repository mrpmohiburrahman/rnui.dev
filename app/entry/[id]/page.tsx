// app/entry/[id]/page.tsx
//
// One Entry, at its own address. 277 of these are prerendered at build time
// from data/catalogue.ts — no Firestore, no searchParams, so nothing here is
// dynamic. This is what makes an Entry shareable and crawlable; the overlay in
// components/entry-overlay.tsx is the same body reached from the grid.
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { allEntries } from "@/data/catalogue"

import { getCdnUrl } from "@/lib/cdn"
import { EntryDetail } from "@/components/entry-detail"

type Params = { params: Promise<{ id: string }> }

const findEntry = async ({ params }: Params) => {
  const { id } = await params
  return allEntries.find((entry) => entry.id === id)
}

export function generateStaticParams() {
  return allEntries.map(({ id }) => ({ id }))
}

// Only the ids above are Entries, so anything else is a 404 rather than a
// render. Without this Next would answer an unknown id on demand.
export const dynamicParams = false

export async function generateMetadata(props: Params): Promise<Metadata> {
  const entry = await findEntry(props)
  if (!entry) return {}

  // The point of giving an Entry an address: without this a shared link
  // previews as the site's generic card.
  const title = `${entry.caption} — ${entry.author}`
  const description = `${entry.caption}, a ${entry.category} demo by ${entry.author}.`
  return {
    title,
    description,
    openGraph: { title, description, images: [getCdnUrl(entry.posterPath)] },
  }
}

export default async function EntryPage(props: Params) {
  const entry = await findEntry(props)
  // Unreachable while dynamicParams is false — Next refuses the request before
  // this runs. Kept because it is also what narrows `entry` to an Entry.
  if (!entry) notFound()

  return (
    <div className="max-w-full px-2 md:pl-4 md:pr-0 pt-2">
      <EntryDetail entry={entry} />
    </div>
  )
}
