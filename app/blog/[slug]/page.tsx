import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { NOTES, nextNote, noteBySlug } from "@/data/notes"

import { NoteArticle } from "@/components/blog/note-article"

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return NOTES.map(({ id }) => ({ slug: id }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const note = noteBySlug(slug)
  if (!note) return {}

  return {
    title: note.title,
    description: note.dek,
    alternates: { canonical: `/blog/${note.id}` },
  }
}

export default async function NotePage({ params }: Params) {
  const { slug } = await params
  const note = noteBySlug(slug)
  if (!note) notFound()

  const next = nextNote(note.id)

  return (
    <main className="mx-auto w-full max-w-[760px] px-[22px] pb-[120px] pt-[28px]">
      <Link
        href={`/blog?open=${note.id}`}
        className="font-mono text-label text-t3 transition-colors duration-150 ease-out hover:text-t1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"
      >
        ← All notes
      </Link>
      <div className="mt-[18px]">
        <NoteArticle
          note={note}
          next={next ? { id: next.id, title: next.title } : undefined}
        />
      </div>
    </main>
  )
}
