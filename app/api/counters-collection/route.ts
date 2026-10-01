// app/api/counters-collection/route.ts
//
// Exists only so tests/e2e/global-setup.ts can ask a question no test process
// env var can answer honestly: which Firestore collection is THIS RUNNING
// SERVER writing counters to? NEXT_PUBLIC_FIRESTORE_COLLECTION is inlined into
// the server bundle at build time (lib/counters-firestore.ts:27), so this route
// just echoes the value that build baked in.
import { NextResponse } from "next/server"

import { COLLECTION_NAME } from "@/lib/counters-firestore"

export function GET() {
  return NextResponse.json({ collection: COLLECTION_NAME })
}
