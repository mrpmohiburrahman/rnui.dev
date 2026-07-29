// app/actions/increment-view-count.ts
"use server"

import { counters } from "@/lib/counters-firestore"

// A delegate, not ceremony. A "use server" file may export only async functions, so
// keeping this one as the boundary means lib/counters.ts stays an ordinary module a
// test can import, and the client import graph does not change.
export const incrementViewCount = async (entryId: string) =>
  counters.recordView(entryId)
