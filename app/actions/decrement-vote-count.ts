// app/actions/decrement-vote-count.ts
"use server"

import { counters } from "@/lib/counters-firestore"

export const decrementVoteCount = async (recordingId: string) =>
  counters.changeVote(recordingId, "withdraw")
