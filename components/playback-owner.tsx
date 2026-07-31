// components/playback-owner.tsx
//
// One owner for playback across a whole grid: it holds the only
// IntersectionObserver, decides which five tiles play, and is where recording a
// view belongs (ADR-0007:22 — the cap on concurrent playback is what bounds the
// metric, so the two cannot live in different places). Two older call sites
// still increment on their own; see countView below.
//
// Nothing here is state. Granting or revoking a slot commands a <video> through
// a ref and re-renders no consumer at all: on a 48-card page a re-render per
// scroll event is the whole INP budget.
"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react"

import { countedThisSession, createPlayedWatcher } from "@/lib/view-signal"
import { incrementViewCount } from "@/app/actions/increment-view-count"

/**
 * How many Demos decode at once. Five is decision 3
 * (`.scratch/ui-ux-overhaul/spec.md:22`); nobody has measured five concurrent
 * decodes on a low-end phone against the 286ms mobile INP, and if that number
 * gets worse this constant is the one place to lower it.
 */
const MAX_PLAYING = 5

/**
 * Record a view. Exported so the open and Source-link paths can route through
 * here rather than importing the action a second time.
 *
 * **Not yet the only caller of the action.** ADR-0007:22 says nothing else may
 * increment a view, and two things still do — `entry-card.tsx:18` on the vote
 * and profile-link paths, and `entry-detail.tsx:17` in the overlay.
 * `10-view-metric.md` step 6 deletes both; this file is where they land.
 *
 * `counters.recordView` never rejects by contract (`lib/counters.ts:60-63`), so
 * this fires and forgets: a counter must never sit between a visitor and what
 * they are watching.
 */
export function countView(entryId: string): void {
  void incrementViewCount(entryId).catch(() => {})
}

type Tile = {
  visible: boolean
  /** Removes the timeupdate listener this tile's view signal is wired to. */
  release: () => void
}

type PlaybackOwnerValue = {
  /** Wire a <video> to the owner. Returns its own cleanup, for a React 19 ref. */
  register: (el: HTMLVideoElement, entryId: string) => () => void
}

const PlaybackOwnerContext = createContext<PlaybackOwnerValue | null>(null)

export function usePlaybackOwner(): PlaybackOwnerValue {
  const value = useContext(PlaybackOwnerContext)
  if (!value) {
    throw new Error("usePlaybackOwner must be used inside a <PlaybackOwner>")
  }
  return value
}

export function PlaybackOwner({
  /**
   * Stop everything and grant nothing. The overlay sets this: five Demos
   * decoding behind a tint is five decodes nobody can see, and the motion brief
   * (`.scratch/ui-ux-overhaul/motion-brief-overlay.md:61-64`) requires the pause.
   * Closing it re-grants whatever is still in view.
   */
  suspended = false,
  children,
}: {
  suspended?: boolean
  children: ReactNode
}) {
  const tiles = useRef(new Map<HTMLVideoElement, Tile>())
  const granted = useRef(new Set<HTMLVideoElement>())
  const suspendedRef = useRef(suspended)
  const observer = useRef<IntersectionObserver | null>(null)

  // The whole policy: the first five visible tiles in document order play, and
  // nothing else does.
  const grant = useCallback(() => {
    const next = suspendedRef.current
      ? []
      : [...tiles.current.keys()]
          .filter((el) => tiles.current.get(el)!.visible)
          // compareDocumentPosition rather than getBoundingClientRect: it reads
          // the DOM tree and forces no layout. Legal because the grid sets no
          // `order` and is not `dense`, so document order is visual order.
          .sort((a, b) =>
            a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
              ? -1
              : 1
          )
          .slice(0, MAX_PLAYING)

    const nextSet = new Set(next)
    for (const el of granted.current) if (!nextSet.has(el)) el.pause()
    for (const el of next)
      if (!granted.current.has(el))
        // The catch is not optional: pausing a tile whose play() has not
        // resolved rejects that promise, and an unhandled rejection per scroll
        // is what a grid of these produces.
        //
        // It gives the slot back rather than swallowing the rejection, because
        // `granted` is what stops play() being called twice on the same tile —
        // so a tile left in it while paused holds a slot and shows nothing, for
        // as long as the viewport does not change. Dropping it means the next
        // grant() tries again. ponytail: the retry is whatever calls grant()
        // next — a scroll, a mount, the overlay opening. Nothing retries a tile
        // whose viewport never moves again, which is the right ceiling for a
        // browser that has refused autoplay outright.
        void el.play().catch(() => granted.current.delete(el))
    granted.current = nextSet
  }, [])

  // Built on first use rather than in an effect: React runs ref callbacks before
  // effects, so the first tile registers before an effect could have made one.
  const getObserver = useCallback(() => {
    if (!observer.current) {
      observer.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const tile = tiles.current.get(entry.target as HTMLVideoElement)
            if (tile) tile.visible = entry.isIntersecting
          }
          grant()
        },
        // ponytail: threshold 0 — any pixel on screen makes a tile a candidate
        // and the five-slot cap in document order does the rest. Raise to 0.1 if
        // tiles start on a sliver. Not higher: a 9/16 tile in a phone's landscape
        // viewport cannot reach an intersectionRatio of 0.25 at all, and would
        // then never play. rootMargin is 0 and not the old 200px, which would
        // play a tile a screen away.
        { threshold: 0, rootMargin: "0px" }
      )
    }
    return observer.current
  }, [grant])

  const register = useCallback(
    (el: HTMLVideoElement, entryId: string) => {
      // The view signal. The threshold, the cap and its storage key are all
      // @/lib/view-signal's; this file owns the slots and calls into it.
      const played = createPlayedWatcher()
      let counted = false
      const onTimeUpdate = () => {
        if (counted) return
        if (!played(el.currentTime)) return
        counted = true
        if (!countedThisSession(entryId)) countView(entryId)
      }
      el.addEventListener("timeupdate", onTimeUpdate)

      // No further "while on screen" gate: a paused element fires no timeupdate,
      // and only tiles holding one of the five slots are playing.
      tiles.current.set(el, {
        visible: false,
        release: () => el.removeEventListener("timeupdate", onTimeUpdate),
      })
      getObserver().observe(el)

      return () => {
        getObserver().unobserve(el)
        tiles.current.get(el)?.release()
        tiles.current.delete(el)
        granted.current.delete(el)
        // A tile leaving frees its slot for whatever is still in view.
        grant()
      }
    },
    [grant, getObserver]
  )

  useEffect(() => {
    suspendedRef.current = suspended
    grant()
  }, [suspended, grant])

  useEffect(() => () => observer.current?.disconnect(), [])

  // Built once over the refs, so no consumer ever re-renders because of this
  // provider. Every dependency below is itself stable.
  const value = useMemo(() => ({ register }), [register])

  return (
    <PlaybackOwnerContext.Provider value={value}>
      {children}
    </PlaybackOwnerContext.Provider>
  )
}
