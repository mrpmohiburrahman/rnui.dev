// app/recording/[id]/recording-body.tsx
//
// The standalone Recording page's client half. app/recording/[id]/page.tsx is a
// server component that can hand counts to RecordingDetail but cannot own the
// visitor's save and vote — those live in localStorage, read by this component
// through the same useRememberedSet the grid uses, so the saved and voted state
// on a /recording/<id> is the same state the same Recording's tile shows on /.
"use client"

import { useRememberedSet } from "@/hooks/use-remembered-set"
import {
  BOOKMARKS_KEY,
  VOTED_RECORDING_IDS_KEY,
} from "@/hooks/use-remembered-set"
import type { Recording } from "@/data/recording"

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
  const { ids: voted, toggle: toggleVote } =
    useRememberedSet(VOTED_RECORDING_IDS_KEY)

  return (
    <RecordingDetail
      recording={recording}
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