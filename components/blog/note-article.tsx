"use client"

import { useState } from "react"
import Link from "next/link"

import {
  BYLINE,
  STACK_ROWS,
  STACK_TEXT,
  type Note,
} from "@/data/notes"

export function NoteArticle({
  note,
  next,
}: {
  note: Note
  next?: { id: string; title: string }
}) {
  const [copied, setCopied] = useState(false)

  async function copyStack() {
    try {
      await navigator.clipboard.writeText(STACK_TEXT)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article>
      <p className="font-mono text-label text-t3">
        {note.topic}
        <span className="text-t3"> · </span>
        {note.date}
        <span className="text-t3"> · </span>
        {note.read}
      </p>
      <h1 className="mt-[10px] text-hero font-semibold tracking-[-0.03em] text-t1">
        {note.title}
      </h1>
      <p className="mt-[10px] max-w-[62ch] text-[15px] leading-[1.5] text-t2">
        {note.dek}
      </p>
      <p className="mt-[14px] font-mono text-[11px] text-t3">{BYLINE}</p>

      <nav aria-label="Sections" className="mt-[22px] flex flex-wrap gap-[6px]">
        {note.sections.map((section) => (
          <button
            key={section.heading}
            type="button"
            className="rounded-chip border border-line bg-well px-[10px] py-[5px] font-mono text-label text-t2 transition-colors duration-150 ease-out hover:text-t1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"
            onClick={() => {
              document
                .getElementById(sectionId(note.id, section.heading))
                ?.scrollIntoView({ block: "start" })
            }}
          >
            {section.heading}
          </button>
        ))}
      </nav>

      <blockquote className="mt-[22px] max-w-[62ch] border-l-2 border-acc pl-[14px] text-[15px] leading-[1.5] text-t1">
        {note.pull}
      </blockquote>

      <div className="mt-[28px] flex max-w-[68ch] flex-col gap-[28px]">
        {note.sections.map((section) => (
          <section
            key={section.heading}
            id={sectionId(note.id, section.heading)}
            className="scroll-mt-[88px]"
          >
            <h2 className="text-section font-semibold tracking-[-0.02em] text-t1">
              {section.heading}
            </h2>
            {section.paragraphs.map((paragraph) => (
              <p
                key={paragraph}
                className="mt-[8px] text-[13.5px] leading-[1.6] text-t2"
              >
                {paragraph}
              </p>
            ))}
            {section.gain || section.cost ? (
              <div className="mt-[12px] grid gap-[8px] sm:grid-cols-2">
                {section.gain ? (
                  <p className="rounded-panel border border-line bg-well px-[12px] py-[10px] text-[12.5px] leading-[1.5] text-t2">
                    <span className="font-mono text-label text-acc">Gain</span>
                    <span className="mt-[4px] block">{section.gain}</span>
                  </p>
                ) : null}
                {section.cost ? (
                  <p className="rounded-panel border border-line bg-well px-[12px] py-[10px] text-[12.5px] leading-[1.5] text-t2">
                    <span className="font-mono text-label text-t3">Cost</span>
                    <span className="mt-[4px] block">{section.cost}</span>
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ))}
      </div>

      {note.stack ? (
        <div className="mt-[32px] max-w-[68ch] rounded-panel border border-line bg-well p-[16px]">
          <div className="flex items-center justify-between gap-[12px]">
            <h2 className="text-section font-semibold tracking-[-0.02em] text-t1">
              The stack
            </h2>
            <button
              type="button"
              onClick={copyStack}
              className="rounded-chip bg-acc px-[12px] py-[6px] font-mono text-label text-on-acc transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"
            >
              {copied ? "Copied" : "Copy the stack"}
            </button>
          </div>
          <dl className="mt-[12px] divide-y divide-line">
            {STACK_ROWS.map((row) => (
              <div
                key={row.area}
                className="grid grid-cols-[108px_1fr] gap-[12px] py-[8px]"
              >
                <dt className="font-mono text-label text-t3">{row.area}</dt>
                <dd className="text-[13px] text-t1">{row.pick}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {next ? (
        <Link
          href={`/blog/${next.id}`}
          className="mt-[28px] block max-w-[68ch] rounded-panel border border-line px-[14px] py-[12px] text-left transition-colors duration-150 ease-out hover:bg-well focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acc"
        >
          <span className="font-mono text-label text-t3">Next note</span>
          <span className="mt-[4px] block text-[14px] font-medium text-t1">
            {next.title}
          </span>
        </Link>
      ) : null}
    </article>
  )
}

function sectionId(noteId: string, heading: string) {
  return `${noteId}-${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
}
