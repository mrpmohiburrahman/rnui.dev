// app/recording/[id]/recording-body.tsx
//
// The standalone Recording page's client half. app/recording/[id]/page.tsx is a
// server component that can hand counts to RecordingDetail but cannot own the
// visitor's save and vote — those live in localStorage, read by this component
// through the same useRememberedSet the grid uses, so the saved and voted state
// on a /recording/<id> is the same state the same Recording's tile shows on /.
"use client"

import type { Recording } from "@/data/recording"

import { recordingFacts } from "@/lib/analytics"
import {
  VOTED_RECORDING_IDS_KEY,
  useRememberedSet,
} from "@/hooks/use-remembered-set"
import { useSavedDemos } from "@/hooks/use-saved-demos"
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
  // Saves live on the Reader's account (sign-in-to-save ticket 07); votes
  // stay browser-local. The same state the tile shows, so a /recording/<id>
  // agrees with / about the same Recording.
  const { ids: bookmarks, toggleSave: toggleBookmark } = useSavedDemos()
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
      onToggleSave={() =>
        void toggleBookmark(recording.id, recordingFacts(recording))
      }
      onToggleVote={() => toggleVote(recording.id)}
      // The same two sets for the MORE FROM THIS CONTRIBUTOR strip's cards.
      // `[]` until localStorage has been read, as everywhere else.
      savedIds={bookmarks ?? []}
      votedIds={voted ?? []}
      onToggleSaveId={toggleBookmark}
      onToggleVoteId={toggleVote}
    />
  )
}
