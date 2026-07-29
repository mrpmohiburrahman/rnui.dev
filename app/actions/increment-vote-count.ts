// app/actions/increment-vote-count.ts
"use server"

import { counters } from "@/lib/counters-firestore"

export const incrementVoteCount = async (entryId: string) =>
  counters.changeVote(entryId, "cast")
