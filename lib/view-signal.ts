// lib/view-signal.ts
//
// When a Demo counts as watched, and whether this browser session has already
// been billed for it. ADR-0007 calls both load-bearing — remove either and
// view_count is an impression count again — so both live here, in one pure
// module, rather than spelled out wherever a <video> happens to be mounted.
//
// It calls no React hook and touches no Firebase, mirroring the split
// lib/counters.ts:8-10 explains: this module decides *whether* to count, and
// components/playback-owner.tsx owns the playback lifecycle and the call to the
// server action. (It does import two pure parsers out of a "use client" hook
// file, so `react` is on its import graph — see the note above them.)

// Imported rather than re-written: these two are pure exports that already agree
// on the stored shape, and a second JSON.parse with its own idea of what a
// malformed value means is how one of them starts throwing.
import {
  parseRememberedIds,
  serialiseRememberedIds,
} from "@/hooks/use-remembered-set"

/**
 * How long a Demo has to actually advance before it is a view. Two seconds, from
 * decision 7 (`.scratch/ui-ux-overhaul/spec.md:26`).
 */
export const VIEW_THRESHOLD_SECONDS = 2

/**
 * What `createPlayedWatcher` hands back: the predicate, plus a readout of what it
 * has accumulated. The readout exists because `demo_watched` reports how much
 * actually played, and the alternative — the caller keeping its own running total
 * beside the watcher's — is two accumulators that can disagree about a loop wrap.
 */
export type PlayedWatcher = ((currentTime: number) => boolean) & {
  /** Seconds of playback accumulated so far. Not a position: a looped Demo's
   *  `currentTime` goes backwards and this does not. */
  seconds: () => number
}

/**
 * One watcher per tile. Feed it the element's `currentTime`; it answers whether
 * the recording has now played for `VIEW_THRESHOLD_SECONDS`.
 *
 * Accumulated positive deltas, not a wall clock and not a subtraction:
 *
 * - A tile can hold a playback slot for two seconds while its Demo stalls,
 *   buffers or fails to decode. A timer bills that; a Demo that never advanced
 *   contradicts the ADR's own first line.
 * - Demos loop (`components/entry-card.tsx`), so `currentTime` wraps back to 0
 *   and `now - last` goes negative. Discarding the negative delta costs the one
 *   tick the wrap straddles, ~250ms.
 *
 * The first reading only establishes a baseline: a watcher handed a Demo already
 * at 1.9s has not watched 1.9s of it.
 */
export function createPlayedWatcher(): PlayedWatcher {
  let last: number | null = null
  let played = 0

  return Object.assign(
    (currentTime: number): boolean => {
      if (last !== null && currentTime > last) played += currentTime - last
      last = currentTime
      return played >= VIEW_THRESHOLD_SECONDS
    },
    { seconds: () => played }
  )
}

/**
 * Deliberately **not** a Remembered set (CONTEXT.md). Those are localStorage and
 * are the visitor's own saved state; this is sessionStorage and is meant to
 * expire with the tab — a visitor who comes back tomorrow watches again, and
 * that is a second view.
 */
const VIEWED_ENTRY_IDS_KEY = "viewedEntryIds"

let counted: Set<string> | null = null

function seed(): Set<string> {
  if (counted) return counted
  counted = new Set<string>()
  try {
    // parseRememberedIds handles absent, empty and malformed alike. Storage can
    // be unavailable outright — Safari's private mode, a blocked third-party
    // frame, a Node test runner — and `sessionStorage` is then not even a
    // binding, so the read is inside the try rather than guarded by a typeof.
    const raw = sessionStorage.getItem(VIEWED_ENTRY_IDS_KEY)
    for (const id of parseRememberedIds(raw).ids) counted.add(id)
  } catch {
    // An unreadable cap is an empty cap: at worst this session counts an Entry
    // it already counted. A throw here would stop playback.
  }
  return counted
}

/**
 * The once-per-Entry-per-session cap. A test-and-set despite the name: it
 * answers whether this Entry has already been billed **and** records it if it
 * has not, so the question and the record cannot drift apart. Named for the
 * question because that is what the caller branches on.
 */
export function countedThisSession(entryId: string): boolean {
  const seen = seed()
  if (seen.has(entryId)) return true

  seen.add(entryId)
  try {
    sessionStorage.setItem(
      VIEWED_ENTRY_IDS_KEY,
      serialiseRememberedIds([...seen])
    )
  } catch {
    // The in-memory set still holds for the life of the page, which is the
    // whole of the session for every visitor who does not reload.
  }
  return false
}
