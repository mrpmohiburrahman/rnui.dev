// app/actions/decrement-vote-count.ts
"use server"

import { counters } from "@/lib/counters-firestore"

export const decrementVoteCount = async (entryId: string) =>
  counters.changeVote(entryId, "withdraw")
