import type { Metadata } from "next"

import { CandidateTile } from "./candidate-tile"
import { previewCandidates } from "./candidates"

export const metadata: Metadata = {
  title: "New Expo demos — preview",
  robots: { index: false, follow: false },
}

const contributors = Array.from(
  new Set(previewCandidates.map((candidate) => candidate.contributor))
)

export default function PreviewNewDemosPage() {
  const withVideo = previewCandidates.filter((candidate) => candidate.video).length
  const extras = previewCandidates.length - withVideo
  const accepted = previewCandidates.filter((candidate) => !candidate.skipped).length

  return (
    <div className="flex flex-col gap-10">
      <header className="flex max-w-3xl flex-col gap-4">
        <p className="font-mono text-[10px] tracking-[0.12em] text-t3 uppercase">
          Local preview · not deployed data
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-t1">
          New Expo demos
        </h1>
        <p className="text-sm leading-relaxed text-t2">
          {accepted} candidates hold a New verdict. The maintainer skipped one
          candidate. {withVideo} rows have playable preview video. {extras} rows
          have source links only.
        </p>
        <p className="text-sm leading-relaxed text-t2">
          These rows are not Recordings. No Demo, Poster, or catalogue row
          exists yet. Each Category is a proposal for ticket 05. Hover or click
          a tile to play or pause.
        </p>
      </header>

      {contributors.map((contributor) => {
        const rows = previewCandidates.filter(
          (candidate) => candidate.contributor === contributor
        )
        return (
          <section key={contributor} className="flex flex-col gap-4">
            <div className="flex items-baseline gap-3">
              <h2 className="text-base font-medium tracking-tight text-t1">
                {contributor}
              </h2>
              <span className="font-mono text-[10px] text-t3">
                {rows.length}
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,163px)] gap-x-4 gap-y-5 sm:grid-cols-[repeat(auto-fill,208px)] sm:gap-x-6 sm:gap-y-7">
              {rows.map((candidate) => (
                <CandidateTile key={candidate.caption} candidate={candidate} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
