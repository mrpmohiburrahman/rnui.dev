// hooks/use-remembered-set.ts
//
// A Remembered set (CONTEXT.md): the Recording ids one visitor's browser holds. This
// was two files — hooks/use-bookmarks.ts and hooks/use-votes.ts — identical once
// the identifiers were normalised, down to the emoji in the log prefixes. Every
// bug in them had two homes and every fix needed applying twice.
"use client"

import { useCallback, useEffect, useSyncExternalStore } from "react"

// The two stored keys, at their exact current spellings. A key is a record in
// somebody's browser, not an identifier — the same boundary the rename in ticket 02
// stopped at, for the same reason.

/** Renaming this silently discards every bookmark a visitor has already made. */
export const BOOKMARKS_KEY = "bookmarkedItems"

/**
 * Renaming this silently discards every vote a visitor has already cast.
 *
 * The stored string keeps "Items"; the constant does not. CONTEXT.md lists `item`
 * under Recording's _Avoid_, and ADR-0004's frozen boundary is the value in somebody's
 * browser, not the identifier beside it.
 */
export const VOTED_RECORDING_IDS_KEY = "votedItems"

type Problem = "not-an-array" | "unreadable"

/**
 * Read what localStorage handed back. Absent state and unusable state both yield an
 * empty set; `problem` distinguishes them, because a visitor whose saved state was
 * just silently reset is the one case worth reporting — and `cause` carries the error
 * that says why, so the report can name it.
 */
export function parseRememberedIds(raw: string | null): {
  ids: string[]
  problem: Problem | null
  cause?: unknown
} {
  // getItem returns null for a key nobody wrote. An empty string is a key written
  // badly, but the hook this replaced treated it as absent and said nothing, and a
  // new error on a path that used to be silent is what ticket 08 exists to prevent.
  if (raw === null || raw.trim() === "") return { ids: [], problem: null }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (cause) {
    return { ids: [], problem: "unreadable", cause }
  }

  if (!Array.isArray(parsed)) return { ids: [], problem: "not-an-array" }
  return { ids: parsed as string[], problem: null }
}

/**
 * The other half of the round trip. Named rather than inlined so a test can hold
 * both halves at once — if the written shape ever stops being a plain JSON array
 * of strings, every set already sitting in a visitor's browser is unreadable.
 */
export function serialiseRememberedIds(ids: string[]): string {
  return JSON.stringify(ids)
}

/**
 * One state per stored key, shared by every instance of the hook.
 *
 * This used to be a plain `useState` per instance, and three components call the
 * hook over `BOOKMARKS_KEY` from three different subtrees — components/site-header.tsx,
 * components/catalogue-page.tsx and app/recording/[id]/recording-body.tsx. Each held
 * its own copy of the same key, so saving a Recording from a tile or from the overlay
 * left the header's `◆ Saved n` chip on whatever number it had read at mount, until a
 * full reload. recording-detail.tsx:107-111 already records the same hazard one level
 * down and dodges it by taking props; the header cannot, because it is not under the
 * catalogue.
 *
 * A `storage` event listener is not the fix: that event fires in every tab *except*
 * the one that wrote, which is the only tab that matters here. The state itself has
 * to be shared, so it lives in the module and every instance subscribes.
 */
const snapshots = new Map<string, string[] | null>()
const listeners = new Map<string, Set<() => void>>()

function subscribe(storedKey: string, onChange: () => void) {
  let forKey = listeners.get(storedKey)
  if (!forKey) {
    forKey = new Set()
    listeners.set(storedKey, forKey)
  }
  forKey.add(onChange)
  return () => {
    forKey.delete(onChange)
  }
}

/** Publish, then wake every instance holding this key. */
function publish(storedKey: string, ids: string[] | null) {
  snapshots.set(storedKey, ids)
  listeners.get(storedKey)?.forEach((onChange) => onChange())
}

/**
 * `ids` is `null` until the browser has been read, which is what every caller's
 * hydration guard waits on. This hook makes no network call of any kind: recording
 * a view belongs to the card, and while the vote half of this did it too, one click
 * billed two views on the home page and three on the Category listing.
 */
export function useRememberedSet(storedKey: string) {
  const ids = useSyncExternalStore(
    useCallback((onChange: () => void) => subscribe(storedKey, onChange), [storedKey]),
    () => snapshots.get(storedKey) ?? null,
    // The server has read no browser, so it renders the same `null` the client
    // renders on its first pass. Reading localStorage in a lazy initialiser
    // instead would render an empty set on the server and a full one on the
    // client — a hydration mismatch.
    () => null
  )

  useEffect(() => {
    if (typeof window === "undefined") return
    // Whichever instance mounts first does the read; the rest are handed it.
    // After that, `toggle` is the only writer, and it updates both halves
    // together, so re-reading here would only churn identities.
    if (snapshots.get(storedKey) !== undefined) return

    const {
      ids: stored,
      problem,
      cause,
    } = parseRememberedIds(localStorage.getItem(storedKey))

    // The only signal that somebody's saved state was reset without them asking.
    // The cause is passed on, not swallowed: without it the report says something
    // failed to parse and not what was wrong with it.
    if (problem === "not-an-array") {
      console.warn(
        `📄 Stored value at "${storedKey}" is not an array. Resetting to empty array.`
      )
    } else if (problem === "unreadable") {
      console.error(`❌ Error parsing "${storedKey}" from localStorage:`, cause)
    }

    publish(storedKey, stored)
  }, [storedKey])

  // Stable across renders: the card's memo comparator does not compare it, so an
  // identity that changed every render would defeat the comparator for every card
  // in the grid.
  const toggle = useCallback(
    (id: string) => {
      const previous = snapshots.get(storedKey)
      // Not hydrated yet — the set on disk is still unknown, and writing now
      // would overwrite it with a guess.
      if (!previous) return

      const next = previous.includes(id)
        ? previous.filter((remembered) => remembered !== id)
        : [...previous, id]

      try {
        localStorage.setItem(storedKey, serialiseRememberedIds(next))
      } catch (error) {
        console.error(`❌ Failed to write "${storedKey}" to localStorage:`, error)
      }
      publish(storedKey, next)
    },
    [storedKey]
  )

  return { ids, toggle }
}
