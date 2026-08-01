// components/recording-detail.tsx
//
// The Recording detail panel body, and nothing else. It was card-modal.tsx, which
// also owned the modal wrapper and the "is anything selected" guard; both moved
// out so this file renders identically inside the overlay and on the standalone
// /recording/<id> page. It knows nothing about Radix: the dialog's accessible name
// is set by components/recording-overlay.tsx.
//
// "use client" because the Source link below carries an onClick, and the
// standalone page that renders this is a server component — which cannot attach
// an event handler at all.
"use client"

import React, { useEffect, useMemo, useRef } from "react"
import type { Recording } from "@/data/recording"

import { recordingFacts, recordingOpened, repoClicked } from "@/lib/analytics"

import InteractiveVideo from "./interactive-video"
import { countView } from "./playback-owner"

export function RecordingDetail({
  recording,
  // The heading element. Radix logs an error on every open unless a DialogTitle
  // is inside the content — aria-label on the content silences neither it nor
  // its cause — and Radix's DialogTitle renders an h2 of its own, so the overlay
  // passes it in here. It cannot be imported into this file: DialogTitle throws
  // outside a Dialog, and this same body renders standalone at /recording/<id>.
  Title = "h2",
  // Count the open from here. Only app/recording/[id]/page.tsx sets it, and it has
  // to be explicit rather than inferred: the overlay renders this same body
  // after components/recording-card.tsx has already counted, so a component that
  // decided for itself would double-bill every open from the grid.
  countsOwnOpen = false,
}: {
  recording: Recording
  Title?: React.ElementType
  countsOwnOpen?: boolean
}) {
  // No local view count here, and no counting on play. This component used to
  // mount before anything was selected, so the count it held was seeded from
  // nothing, incremented on every open, and rendered nowhere. The Demo below no
  // longer bills a view either: ADR-0007 counts a recording watched, and the
  // playback owner is the only thing that can tell watched from pressed.
  //
  // An effect, because a cold /recording/<id> has no click to hang the count on —
  // the visitor arrived from a shared link or a cmd-clicked headline, and
  // ADR-0007:3 counts that as an open all the same. The ref is not ceremony:
  // reactStrictMode is on by default, so in development React mounts, unmounts
  // and remounts this, and the effect would bill the real Firestore twice every
  // time the maintainer opened a Recording page. Keyed on the id rather than a bare
  // boolean so a client navigation between two Recordings still counts the second.
  const facts = useMemo(() => recordingFacts(recording), [recording])

  // `recording_opened` rides the same guard, and only on this path: the overlay's
  // open is reported by the card that pushed the address, with `source: card`.
  // Reaching this branch means there was no card — a shared link or a
  // cmd-clicked headline — which is what `source: url` names.
  const counted = useRef<string | null>(null)
  useEffect(() => {
    if (!countsOwnOpen || counted.current === recording.id) return
    counted.current = recording.id
    countView(recording.id)
    recordingOpened(facts, "url")
  }, [countsOwnOpen, recording.id, facts])

  return (
    <div className="flex flex-col md:flex-row md:h-[80vh] space-y-4 md:space-y-0 md:space-x-6 p-4">
      {/* Left Side: Video Demo */}
      <div className="w-full md:w-1/2 flex-shrink-0">
        {recording.demoPath ? (
          <div className="w-full h-full">
            <InteractiveVideo
              src={recording.demoPath}
              facts={facts}
              className="w-full h-full object-contain rounded-lg shadow-md"
              controls
              poster={recording.posterPath}
              caption={`video demo of ${recording.caption}`}
              loop
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
            <span className="text-gray-500">No Video Available</span>
          </div>
        )}
      </div>

      {/* Right Side: Recording Information */}
      <div className="w-full md:w-1/2 flex flex-col space-y-4 overflow-y-auto">
        <div>
          <Title className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
            {recording.caption}
          </Title>
          {recording.twitterId && (
            <p className="text-gray-500">@{recording.twitterId}</p>
          )}
        </div>
        <div>
          <p className="text-gray-700 dark:text-gray-300">
            {recording.contributor}
          </p>
        </div>
        <div>
          {/* The panel's Source link, the third of ADR-0007's signals. It routes
              through the playback owner's countView for the same reason the
              card's does: ADR-0007:22 leaves the increment one importer. */}
          <a
            href={recording.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
            onClick={() => {
              countView(recording.id)
              repoClicked(facts, "detail")
            }}
          >
            GitHub Repository
          </a>
        </div>
        {/* Additional Content */}
        {/* You can add more content here if needed */}
      </div>
    </div>
  )
}
