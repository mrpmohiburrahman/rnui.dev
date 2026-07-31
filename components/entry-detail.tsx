// components/entry-detail.tsx
//
// The Entry detail panel body, and nothing else. It was card-modal.tsx, which
// also owned the modal wrapper and the "is anything selected" guard; both moved
// out so this file renders identically inside the overlay and on the standalone
// /entry/<id> page. It knows nothing about Radix: the dialog's accessible name
// is set by components/entry-overlay.tsx.
//
// "use client" because incrementViewCountLocal is an ordinary function handed to
// InteractiveVideo, and the standalone page is a server component — which may
// not pass a function that is not itself a Server Action.
"use client"

import React from "react"
import type { Entry } from "@/data/entry"

import { incrementViewCount } from "@/app/actions/increment-view-count"

import InteractiveVideo from "./interactive-video"

export function EntryDetail({
  entry,
  // The heading element. Radix logs an error on every open unless a DialogTitle
  // is inside the content — aria-label on the content silences neither it nor
  // its cause — and Radix's DialogTitle renders an h2 of its own, so the overlay
  // passes it in here. It cannot be imported into this file: DialogTitle throws
  // outside a Dialog, and this same body renders standalone at /entry/<id>.
  Title = "h2",
}: {
  entry: Entry
  Title?: React.ElementType
}) {
  // No local view count here. This component used to mount before anything was
  // selected, so the count it held was seeded from nothing, incremented on every
  // open, and rendered nowhere — state that could not be right and could not be
  // seen.
  const incrementViewCountLocal = async () => {
    try {
      await incrementViewCount(entry.id)
    } catch (error) {
      console.error("Error incrementing view count:", error)
    }
  }
  return (
    <div className="flex flex-col md:flex-row md:h-[80vh] space-y-4 md:space-y-0 md:space-x-6 p-4">
      {/* Left Side: Video Demo */}
      <div className="w-full md:w-1/2 flex-shrink-0">
        {entry.demoPath ? (
          <div className="w-full h-full">
            <InteractiveVideo
              incrementViewCount={incrementViewCountLocal}
              src={entry.demoPath}
              className="w-full h-full object-contain rounded-lg shadow-md"
              controls
              poster={entry.posterPath}
              caption={`video demo of ${entry.caption}`}
              loop
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gray-200 rounded-lg shadow-md flex items-center justify-center">
            <span className="text-gray-500">No Video Available</span>
          </div>
        )}
      </div>

      {/* Right Side: Entry Information */}
      <div className="w-full md:w-1/2 flex flex-col space-y-4 overflow-y-auto">
        <div>
          <Title className="text-2xl font-bold text-neutral-800 dark:text-neutral-200">
            {entry.caption}
          </Title>
          {entry.twitterId && (
            <p className="text-gray-500">@{entry.twitterId}</p>
          )}
        </div>
        <div>
          <p className="text-gray-700 dark:text-gray-300">{entry.author}</p>
        </div>
        <div>
          <a
            href={entry.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
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
