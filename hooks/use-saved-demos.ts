// hooks/use-saved-demos.ts
//
// A Reader's saved Demos, for every component that draws a Save control.
//
// sign-in-to-save ticket 07. This replaces `useRememberedSet(BOOKMARKS_KEY)`
// everywhere a save is drawn — the header chip, the catalogue grid, the detail
// body — while voting stays on the Remembered set, anonymous and browser-local
// (map decision 5, out of scope).
//
// WHAT EACH STATE MEANS
//
//   - Signed out: `ids` is the browser's `"bookmarkedItems"`, read-only. It is
//     the merge input (lib/pending-save.ts `readMergeInput`): displayed so an
//     anonymous visitor still sees what they saved, never written, and never
//     the source of a write. Pressing Save stashes a pending intent and asks
//     the nav control to open its provider sheet (the gate).
//   - Signed in: `ids` is the D1 list, loaded once per Reader per page load
//     (lib/saved-demos-client.ts `loadSavedDemos`). Pressing Save persists
//     through the authenticated routes. While the list loads `ids` is null —
//     the same hydration contract `useRememberedSet` keeps — and on a load
//     failure it falls back to the browser's list rather than rendering an
//     empty one, because a failure is not an empty account.
//   - `null` ids mean "not known yet" in both states. A caller that renders an
//     empty panel off null tells a Reader with saves that they have none.
//
// THE MERGE, ONCE PER SIGN-IN
//
// The first load after sign-in uploads the browser's list through the same
// POST a single save uses, then consumes the pending-save intent (if the press
// that opened the sheet is what brought them here) into the same call. The
// local copy is kept afterwards, on purpose (ADR-0013, ticket 05): the next
// verification can fail closed while this one succeeded, and a merge that
// deleted the only copy on success would lose it. A repeated merge is
// idempotent, so keeping it is also harmless.
//
// Analytics fire only on confirmed saves — `bookmarkAdded` for the resumed
// pending save, and for direct saves in `toggleSave` — never on the press that
// opens the gate, because an abandoned sign-in is not a save.
"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"

import { auth } from "@/lib/firebase"
import {
  bookmarkAdded,
  bookmarkRemoved,
  type RecordingFacts,
} from "@/lib/analytics"
import {
  consumePendingSave,
  readMergeInput,
  requestSaveGate,
} from "@/lib/pending-save"
import {
  forgetSavedDemos,
  loadSavedDemos,
  peekSavedDemos,
  persistSavedDemos,
  removeSavedDemo,
  replaceSavedDemos,
} from "@/lib/saved-demos-client"
import {
  getReaderToken,
  reportMergeConfirmed,
  reportMergeUnconfirmed,
  useReader,
} from "@/hooks/use-reader"

type SavedDemosSnapshot = {
  /** The browser's list, null until read. Never written by this module. */
  localIds: string[] | null
  /** The D1 list, null until loaded. Only meaningful while signed in. */
  serverIds: string[] | null
  /** The last persist or merge failure, in the Reader's words. */
  error: string | null
}

const INITIAL: SavedDemosSnapshot = {
  localIds: null,
  serverIds: null,
  error: null,
}

let snapshot: SavedDemosSnapshot = INITIAL
const listeners = new Set<() => void>()

function publish(next: Partial<SavedDemosSnapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((onChange) => onChange())
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
  }
}

function getSnapshot(): SavedDemosSnapshot {
  return snapshot
}

/** Which uids have run their first-sign-in load this page. Retry re-arms. */
const attempted = new Set<string>()

/**
 * The last persist or merge failure, in the Reader's words. Exported so the
 * vocabulary sweep in tests can reach it: a Reader is never a `user`.
 */
export const SAVE_FAILED =
  "We couldn't save that just now. It is still on this device — try again in a moment."

/**
 * Load the D1 list and merge the browser's list plus any pending save into
 * it. Throws on any failure; on success the snapshot holds the merged list.
 * The caller decides what a failure means — the link phase or a local error.
 */
async function loadAndMerge(uid: string): Promise<string[]> {
  const token = await getReaderToken()
  if (!token) throw new Error("signed-out")
  const serverIds = await loadSavedDemos(uid, token)
  const pending = consumePendingSave()
  const local = snapshot.localIds ?? readMergeInput()
  const upload = [...local]
  if (pending && !upload.includes(pending.recordingId)) {
    upload.push(pending.recordingId)
  }
  if (upload.length === 0) {
    publish({ serverIds })
    return serverIds
  }
  // One read (above) and at most one write: the server skips the write when
  // nothing is new, so an already-merged browser costs a read and nothing
  // else — writes are the binding ceiling (ticket 05).
  const merged = await persistSavedDemos(token, upload)
  replaceSavedDemos(uid, merged)
  publish({ serverIds: merged, error: null })
  if (pending && merged.includes(pending.recordingId)) {
    bookmarkAdded(pending.facts)
  }
  return merged
}

export function useSavedDemos() {
  const { reader, ready } = useReader()
  const signedIn = reader !== null

  useEffect(() => {
    if (typeof window === "undefined") return
    if (snapshot.localIds !== null) return
    publish({ localIds: readMergeInput() })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (!ready || !signedIn) return
    const uid = auth?.currentUser?.uid
    if (!uid || attempted.has(uid)) return
    attempted.add(uid)

    let cancelled = false
    let completed = false
    ;(async () => {
      try {
        await loadAndMerge(uid)
        if (cancelled) return
        completed = true
        reportMergeConfirmed()
      } catch {
        if (cancelled) return
        completed = true
        // Fails closed and keeps everything: the local copy stays, the cached
        // credential stays (ticket 08 consumes only on a linked write), and a
        // failure after a link publishes the phase ticket 08 declared for it —
        // a failed merge is not a failed link, so it reads as a retry.
        reportMergeUnconfirmed()
        publish({ error: SAVE_FAILED })
      }
    })()
    return () => {
      cancelled = true
      // A remount that never finished — React 18+ double-invokes effects in
      // development — must not consume the single attempt. A settled attempt,
      // success or failure, stays settled; `retry` re-arms explicitly.
      if (!completed) attempted.delete(uid)
    }
  }, [ready, signedIn])

  const toggleSave = useCallback(
    async (recordingId: string, facts: RecordingFacts) => {
      // Anonymous visitors cannot save (map decision 6). The press is stashed
      // for the return trip and the sheet opens in place; nothing is written
      // anywhere, local or otherwise.
      if (!auth?.currentUser) {
        requestSaveGate({ recordingId, facts })
        return
      }
      const uid = auth.currentUser.uid
      const previous = snapshot.serverIds ?? peekSavedDemos(uid) ?? []
      const saved = previous.includes(recordingId)
      const next = saved
        ? previous.filter((id) => id !== recordingId)
        : [...previous, recordingId]
      // Optimistic: the control answers the press at once. The confirmed
      // write replaces the cache; a failure falls back to it, because the
      // failed write never touched it. The event fires only on confirmation.
      publish({ serverIds: next, error: null })
      try {
        const token = await getReaderToken()
        if (!token) throw new Error("signed-out")
        if (saved) {
          await removeSavedDemo(token, recordingId)
          replaceSavedDemos(uid, next)
          publish({ serverIds: next })
          bookmarkRemoved(facts)
        } else {
          const merged = await persistSavedDemos(token, [recordingId])
          replaceSavedDemos(uid, merged)
          publish({ serverIds: merged })
          if (merged.includes(recordingId)) bookmarkAdded(facts)
        }
      } catch {
        publish({ serverIds: peekSavedDemos(uid) ?? previous, error: SAVE_FAILED })
      }
    },
    []
  )

  const retry = useCallback(async () => {
    const uid = auth?.currentUser?.uid
    if (!uid) return
    attempted.delete(uid)
    forgetSavedDemos(uid)
    publish({ error: null })
    try {
      await loadAndMerge(uid)
      reportMergeConfirmed()
    } catch {
      reportMergeUnconfirmed()
      publish({ error: SAVE_FAILED })
    }
  }, [])

  const state = useSyncExternalStore(subscribe, getSnapshot, () => INITIAL)

  // Signed in, the D1 list once loaded; before that, and on a load failure,
  // the browser's list — a failure is not an empty account. Signed out, the
  // browser's list, read-only.
  const ids =
    signedIn && ready
      ? (state.serverIds ?? (state.error ? state.localIds : null))
      : state.localIds

  return { ids, toggleSave, retry, saveError: state.error }
}
