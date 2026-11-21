"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import type { Note } from "@/data/notes"

export function FoldIndex({ notes }: { notes: Note[] }) {
  const params = useSearchParams()
  const open = params.get("open") ?? undefined

  return <FoldList notes={notes} initialOpenId={open} />
}

export function FoldList({
  notes,
  initialOpenId,
}: {
  notes: Note[]
  initialOpenId?: string
}) {
  const firstOpen =
    initialOpenId && notes.some((note) => note.id === initialOpenId)
      ? initialOpenId
      : (notes[0]?.id ?? null)
  const [expanded, setExpanded] = useState<string | null>(firstOpen)

  if (notes.length === 0) return <EmptyBlog />

  function toggle(id: string) {
    const next = expanded === id ? null : id
    setExpanded(next)

    const url = new URL(window.location.href)
    if (next) url.searchParams.set("open", next)
    else url.searchParams.delete("open")
    window.history.replaceState(null, "", url)
  }

  return (
    <ol className="mt-[28px] border-t border-line">
      {notes.map((note, index) => {
        const isOpen = expanded === note.id
        const panelId = `fold-${note.id}`
        return (
          <li key={note.id} className="border-b border-line">
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(note.id)}
              className={`flex w-full items-center gap-[12px] py-[13px] text-left transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc ${
                isOpen ? "bg-well" : "hover:bg-well"
              }`}
            >
              <span className="w-[26px] shrink-0 font-mono text-[11px] text-t3">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1 text-[15px] font-medium tracking-[-0.02em] text-t1">
                {note.title}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-t3">
                {note.read}
              </span>
              <svg
                aria-hidden="true"
                viewBox="0 0 12 12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`h-[10px] w-[10px] shrink-0 text-t3 transition-transform duration-150 ease-out ${
                  isOpen ? "rotate-180" : ""
                }`}
              >
                <path d="M2.5 4.5 6 8l3.5-3.5" />
              </svg>
            </button>

            {isOpen ? (
              <div id={panelId} className="pb-[18px] pl-[38px]">
                <p className="max-w-[58ch] text-[13px] leading-[1.5] text-t2">
                  {note.dek}
                </p>
                <p className="mt-[8px] font-mono text-[10px] tracking-[0.12em] text-t3 uppercase">
                  {note.topic} · {note.date}
                </p>
                <p className="mt-[10px] max-w-[58ch] border-l-2 border-acc pl-[12px] text-[13px] leading-[1.5] text-t1">
                  {note.pull}
                </p>
                <Link
                  href={`/blog/${note.id}`}
                  className="mt-[12px] inline-block rounded-chip bg-acc px-[12px] py-[6px] font-mono text-label text-on-acc transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"
                >
                  Read the note
                </Link>
              </div>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}

function EmptyBlog() {
  return (
    <div className="mt-[28px] flex max-w-[560px] flex-col items-start gap-[15px] rounded-[14px] border border-dashed border-line2 bg-empty px-[26px] py-[32px]">
      <p className="m-0 font-mono text-label text-acc">First note in progress</p>
      <p className="m-0 text-[22px] font-medium tracking-[-0.01em] text-t1">
        No notes yet.
      </p>
      <p className="m-0 max-w-[480px] text-[13px] leading-[1.55] text-t2">
        The maintainer is writing the first Note. Get the Digest and it will
        reach you when it publishes.
      </p>
      <div className="flex flex-wrap gap-[10px]">
        <Link
          href="/subscribe"
          prefetch={false}
          className="rounded-chip bg-acc px-[13px] py-[9px] text-[12.5px] font-medium text-on-acc transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-[3px]"
        >
          Get the Digest
        </Link>
        <Link
          href="/"
          prefetch={false}
          className="rounded-chip border border-line2 px-[13px] py-[9px] text-[12.5px] text-t1 transition-colors duration-150 ease-out hover:border-acc focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-[3px]"
        >
          Browse the catalogue
        </Link>
      </div>
    </div>
  )
}
