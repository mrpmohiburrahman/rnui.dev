// hooks/use-remembered-set.ts
//
// A Remembered set (CONTEXT.md): the Recording ids one visitor's browser holds. This
// was two files — hooks/use-bookmarks.ts and hooks/use-votes.ts — identical once
// the identifiers were normalised, down to the emoji in the log prefixes. Every
// bug in them had two homes and every fix needed applying twice.
"use client"

import { useCallback, useEffect, useRef, useState } from "react"

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
 * `ids` is `null` until the browser has been read, which is what every caller's
 * hydration guard waits on. This hook makes no network call of any kind: recording
 * a view belongs to the card, and while the vote half of this did it too, one click
 * billed two views on the home page and three on the Category listing.
 */
export function useRememberedSet(storedKey: string) {
  const [ids, setIds] = useState<string[] | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (typeof window === "undefined") return

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

    // Reading localStorage on mount is the only SSR-safe way to hydrate this. A
    // lazy useState initialiser runs on the server too, where there is no
    // localStorage, so the server would render an empty set and the client a full
    // one — a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIds(stored)
  }, [storedKey])

  useEffect(() => {
    if (ids === null) return
    // The write that hydration itself triggers is not a change worth persisting.
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    try {
      localStorage.setItem(storedKey, serialiseRememberedIds(ids))
    } catch (error) {
      console.error(`❌ Failed to write "${storedKey}" to localStorage:`, error)
    }
  }, [ids, storedKey])

  // Stable across renders: the card's memo comparator does not compare it, so an
  // identity that changed every render would defeat the comparator for every card
  // in the grid.
  const toggle = useCallback((id: string) => {
    setIds((previous) => {
      if (!previous) return []
      return previous.includes(id)
        ? previous.filter((remembered) => remembered !== id)
        : [...previous, id]
    })
  }, [])

  return { ids, toggle }
}
