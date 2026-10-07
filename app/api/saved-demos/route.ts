// app/api/saved-demos/route.ts
//
// A Reader's saved Demos, over D1.
//
// sign-in-to-save ticket 07. Three methods, one identity each: the uid is the
// verified `sub` of the request's Firebase ID token and nothing else — never a
// body field, never a query parameter — so no request can name another
// Reader's list. `lib/saved-demos.ts` owns the SQL; this file owns the
// scoping, and scoping is the whole of the cross-account guarantee.
//
// A failed verification is a 401, never an anonymous fallback
// (lib/firebase-token.ts): "signed out" and "signed in as someone whose token
// we failed to check" must not be the same state. That includes the outage
// case — Google's JWKS endpoint unreachable fails closed, which is why the
// merge keeps the browser's local copy (ADR-0013) rather than deleting it on
// success.
//
// THE READ DISCIPLINE, COUNTED
//
//   - GET is one `readSavedDemos`: one primary-key point lookup, one row read,
//     however many Demos the Reader saved.
//   - POST reads first and writes only what is not already saved. The merge —
//     the one call that can carry forty ids — costs one read and at most one
//     write, and a re-merge of an already-merged browser costs one read and no
//     write at all. Writes are the binding ceiling (ticket 05: 100,000/day
//     against 5,000,000 reads), so the skipped write is the point.
//   - POST answers the merged list computed from the read it already did, so
//     the browser converges without a second GET.

import { NextResponse } from "next/server"

import { verifyReader } from "@/lib/firebase-token"
import { mergeSavedDemos } from "@/lib/reader-link"
import { readSavedDemos, saveDemos, unsaveDemo } from "@/lib/saved-demos"

function unauthorized() {
  // Reader-facing words. The cryptographic reason stays in the throw, which
  // saying aloud would turn this endpoint into an oracle for probing tokens.
  return NextResponse.json({ message: "Sign in to save Demos." }, { status: 401 })
}

async function readerUid(request: Request): Promise<string | null> {
  try {
    const reader = await verifyReader(request.headers.get("authorization"))
    return reader.uid
  } catch {
    return null
  }
}

/** A Reader's saved Demos, newest last. */
export async function GET(request: Request) {
  const uid = await readerUid(request)
  if (!uid) return unauthorized()
  try {
    const ids = await readSavedDemos(uid)
    return NextResponse.json({ ids })
  } catch (error) {
    console.error("GET /api/saved-demos failed:", error)
    return NextResponse.json(
      { message: "Could not read saved Demos. Try again." },
      { status: 500 }
    )
  }
}

/**
 * Save Recording ids: one save, a resumed pending save, or the first-sign-in
 * merge, which are deliberately the same call — the merge is `saveDemos`, one
 * statement, order preserved, duplicates impossible (ticket 05).
 */
export async function POST(request: Request) {
  const uid = await readerUid(request)
  if (!uid) return unauthorized()

  let ids: unknown
  try {
    ids = (await request.json())?.ids
  } catch {
    ids = undefined
  }
  if (!Array.isArray(ids)) {
    return NextResponse.json(
      { message: "Send the Recording ids as an `ids` array." },
      { status: 400 }
    )
  }

  try {
    const existing = await readSavedDemos(uid)
    const incoming = ids.filter(
      (id): id is string => typeof id === "string" && id !== ""
    )
    // The union, decided before the write: what is already saved is not
    // written again, so an idempotent re-merge costs a read and nothing else.
    const merged = mergeSavedDemos(existing, incoming)
    const missing = merged.filter((id) => !existing.includes(id))
    if (missing.length > 0) {
      // `saveDemos` validates every id and throws on the first bad one, so a
      // malformed id refuses the whole call rather than saving half of it.
      await saveDemos(uid, missing)
    }
    return NextResponse.json({ ids: merged })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Not a Recording id")
    ) {
      return NextResponse.json(
        { message: "One of those is not a Recording id." },
        { status: 400 }
      )
    }
    console.error("POST /api/saved-demos failed:", error)
    return NextResponse.json(
      { message: "Could not save. Try again." },
      { status: 500 }
    )
  }
}

/** Remove one Demo from a Reader's saved Demos. */
export async function DELETE(request: Request) {
  const uid = await readerUid(request)
  if (!uid) return unauthorized()

  let recordingId: unknown
  try {
    recordingId = (await request.json())?.recordingId
  } catch {
    recordingId = undefined
  }
  if (typeof recordingId !== "string" || recordingId === "") {
    return NextResponse.json(
      { message: "Send the Recording id as `recordingId`." },
      { status: 400 }
    )
  }

  try {
    await unsaveDemo(uid, recordingId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Not a Recording id")
    ) {
      return NextResponse.json(
        { message: "That is not a Recording id." },
        { status: 400 }
      )
    }
    console.error("DELETE /api/saved-demos failed:", error)
    return NextResponse.json(
      { message: "Could not remove it. Try again." },
      { status: 500 }
    )
  }
}
