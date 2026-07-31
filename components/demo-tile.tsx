// components/demo-tile.tsx
//
// One Demo in the grid. It replaces components/interactive-video.tsx there and
// owns none of the playback decisions: components/playback-owner.tsx says when
// this <video> plays, and @/lib/view-signal says when it counts.
//
// Same box and same pixels as the click-to-play tile it replaces, minus the play
// glyph — removing click-to-play removes it, which decision 3 authorises and
// ADR-0007 argues for ("it puts a play button on top of a video that is already
// playing"). Nothing else about the tile moves.
"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import { usePostHog } from "posthog-js/react"

import { getCdnUrl } from "@/lib/cdn"

import { usePlaybackOwner } from "./playback-owner"

// MediaError codes, so a failure is reported as "decode" or "network" rather
// than as a number. The distinction is the whole point: "network" means the
// Asset is missing, "decode" means it is the wrong codec — which is how 48
// Demos shipped as unplayable HEVC and stayed that way for months.
const FAILURE_REASONS: Record<number, string> = {
  1: "aborted",
  2: "network",
  3: "decode",
  4: "unsupported",
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"

const subscribeToReducedMotion = (onChange: () => void) => {
  const query = matchMedia(REDUCED_MOTION)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

/**
 * React's own hook rather than framer-motion's `useReducedMotion`: that one
 * reports `false` on the server, which mounts a <video> for one frame in exactly
 * the case decision 3 says must never mount one. The server snapshot here
 * assumes reduced, so the served HTML ships no <video> to hydrate away.
 */
const usePrefersReducedMotion = () =>
  useSyncExternalStore(
    subscribeToReducedMotion,
    () => matchMedia(REDUCED_MOTION).matches,
    () => true
  )

// Asset paths in, not `src`/`poster` — ADR-0004 and CONTEXT.md's Asset path
// entry, which lists `src` and `url` under _Avoid_. `interactive-video.tsx`
// still speaks the old vocabulary; a module written after the rename does not.
export function DemoTile({
  entryId,
  demoPath,
  posterPath,
  caption,
  className = "",
}: {
  entryId: string
  demoPath: string
  posterPath?: string
  caption?: string
  className?: string
}) {
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [hasPlayed, setHasPlayed] = useState(false)
  const posthog = usePostHog()
  const owner = usePlaybackOwner()
  const reduced = usePrefersReducedMotion()

  // The Published Asset's address, not an Asset path — that distinction is why
  // these are named apart from the two props above.
  const demoUrl = getCdnUrl(demoPath)
  const posterUrl =
    posterPath && posterPath.trim() !== "" ? getCdnUrl(posterPath) : "/logo.png"

  // A failed Demo is terminal and says so. There is deliberately no fallback
  // source: Assets live only on the CDN, so the root-relative path this used to
  // retry does not exist in production and retrying it guaranteed a second
  // failure while still showing the user nothing.
  const handleDemoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      // Only the media element's own error counts — a childless <track> can
      // raise an error event of its own that says nothing about the Demo.
      const error = e.currentTarget.error
      if (!error) return
      const reason = FAILURE_REASONS[error.code] ?? "unknown"
      setFailureReason(reason)
      posthog?.capture("demo_load_failed", {
        asset_path: demoPath,
        reason,
        url: demoUrl,
      })
    },
    [posthog, demoPath, demoUrl]
  )

  // A React 19 ref cleanup, memoised: an inline arrow would unregister and
  // re-register the tile — unobserving and re-observing it — on every render.
  const registerDemo = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return
      return owner.register(el, entryId)
    },
    [owner, entryId]
  )

  return (
    // bg-black is carried over from the play button this replaces, even though
    // the box behind it is already black. It is not redundant: the card clips
    // this box to a rounded top corner, and the arc is antialiased against
    // however many dark layers are under it. With one instead of two, ten
    // corners came out a few levels lighter — measured, 138 pixels of a
    // 1,296,000-pixel viewport, and the only thing standing between this ticket
    // and "differs by the play glyph and nothing else".
    <div className={`relative bg-black ${className}`} data-testid="demo">
      {failureReason ? (
        <div
          role="alert"
          data-testid="demo-error"
          className="w-full h-full bg-neutral-900 text-neutral-200 flex flex-col items-center justify-center gap-1 p-4 text-center"
        >
          <span className="text-sm font-medium">This demo failed to load</span>
          <span className="text-xs text-neutral-400">
            {caption ?? demoPath} ({failureReason})
          </span>
        </div>
      ) : (
        <>
          {/* The browser's own lazy gate, rather than a hand-rolled one: this
              used to be a CSS background-image, which every card fetched the
              moment it mounted — 277 Posters, ~3.9MB, competing with LCP.
              object-cover + the default 50% 50% origin paint the identical
              rect the background painted into. Posters are already AVIF at
              crf 30 (scripts/generate-posters.ts:57-60), so next/image would
              only re-encode optimal bytes through an extra hop. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Under prefers-reduced-motion no <video> is mounted at all — not
              mounted and idle. The tile holds its still frame and fetches
              nothing (spec.md:62-66). */}
          {!reduced && (
            <video
              ref={registerDemo}
              src={demoUrl}
              // The cross-fade of decision 15, in CSS rather than framer: the
              // Poster is the frame two seconds in (scripts/generate-posters.ts:47-48)
              // while playback starts at 0, so every tile jumps backwards the
              // moment the Demo appears. 150ms hides a defect rather than decorating.
              //
              // It never fades back. Returning to a Poster two seconds ahead of
              // the paused frame would reintroduce the same jump, in the other
              // direction.
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-150 ${
                hasPlayed ? "opacity-100" : "opacity-0"
              }`}
              onPlaying={() => setHasPlayed(true)}
              onError={handleDemoError}
              muted
              loop
              playsInline
              // Why this element can be mounted idle: it fetches nothing at all
              // until the owner calls play(). No `controls` and no `poster` —
              // there is nothing to control and the <img> above is the poster.
              // No <track> either: the Demo is silent, so a captions track with
              // no src was never doing anything.
              preload="none"
            />
          )}
        </>
      )}
    </div>
  )
}
