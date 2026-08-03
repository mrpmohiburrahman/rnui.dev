// app/recording/[id]/recording-body.tsx
//
// The standalone Recording page's client half. app/recording/[id]/page.tsx is a
// server component that can hand counts to RecordingDetail but cannot own the
// visitor's save and vote — those live in localStorage, read by this component
// through the same useRememberedSet the grid uses, so the saved and voted state
// on a /recording/<id> is the same state the same Recording's tile shows on /.
"use client"

import type { Recording } from "@/data/recording"

import {
  BOOKMARKS_KEY,
  useRememberedSet,
  VOTED_RECORDING_IDS_KEY,
} from "@/hooks/use-remembered-set"
import { RecordingDetail } from "@/components/recording-detail"

export function RecordingBody({
  recording,
  topViewCount,
  catalogueTotal,
  contributorTotal,
  more,
}: {
  recording: Recording
  topViewCount: number
  catalogueTotal: number
  contributorTotal: number
  more: Recording[]
}) {
  const { ids: bookmarks, toggle: toggleBookmark } =
    useRememberedSet(BOOKMARKS_KEY)
  const { ids: voted, toggle: toggleVote } = useRememberedSet(
    VOTED_RECORDING_IDS_KEY
  )

  return (
    <RecordingDetail
      recording={recording}
      // The page form's title is this route's h1 (ticket 09 step 4). The
      // overlay passes Radix's Dialog.Title, which renders an h2, and the
      // component's own default stays h2 for it.
      Title="h1"
      countsOwnOpen
      topViewCount={topViewCount}
      catalogueTotal={catalogueTotal}
      contributorTotal={contributorTotal}
      more={more}
      saved={bookmarks?.includes(recording.id) ?? false}
      voted={voted?.includes(recording.id) ?? false}
      onToggleSave={() => toggleBookmark(recording.id)}
      onToggleVote={() => toggleVote(recording.id)}
    />
  )
}
