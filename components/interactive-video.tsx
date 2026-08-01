"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PlayIcon } from "lucide-react"

import {
  demoLoadFailed,
  demoPlayed,
  demoWatched,
  type EntryFacts,
} from "@/lib/analytics"
import { getCdnUrl } from "@/lib/cdn"
import { createPlayedWatcher, type PlayedWatcher } from "@/lib/view-signal"

interface InteractiveVideoProps {
  src: string
  /**
   * Which Entry this is, for the two playback events. The grid's tile takes the
   * same thing; this one is the `detail` surface, and its `trigger` is always a
   * click because the <video> below does not exist until one.
   */
  facts: EntryFacts
  caption?: string
  poster?: string
  className?: string
  controls?: boolean
  loop?: boolean
}

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

const InteractiveVideo: React.FC<InteractiveVideoProps> = ({
  caption,
  src,
  facts,
  poster,
  className = "",
  controls = true,
  loop = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Both playback events fire once per opened Entry, not once per press. The
  // <video> unmounts whenever the visitor pauses it, so these refs sit here
  // rather than in the element: a pause and a resume is one visit to one Demo.
  //
  // Each holds the Entry it fired for rather than a bare boolean, exactly as
  // entry-detail.tsx:59 keys its own count. This component instance survives
  // being handed a second Entry — the overlay reopens over its own 100ms exit,
  // and Back between two /entry/<id> pages is a client navigation — and a
  // boolean would suppress every playback event for that second one, silently
  // dropping the funnel's first step.
  const played = useRef<string | null>(null)
  const watched = useRef<string | null>(null)

  // The same watcher the grid uses, for the same reason — the two-second
  // threshold and what counts towards it are ADR-0007's, not this component's.
  // Built on the first timeupdate rather than at render, so a paused Demo
  // allocates nothing and a new Entry gets a watcher with no seconds on it.
  const watcher = useRef<{ entryId: string; tick: PlayedWatcher } | null>(null)

  const videoSource = getCdnUrl(src)
  const posterImage =
    poster && poster.trim() !== "" ? getCdnUrl(poster) : "/logo.png"

  const handleVideoPlay = () => {
    setIsPlaying(true)
    if (played.current === facts.entry_id) return
    played.current = facts.entry_id
    demoPlayed(facts, "detail", "click")
  }

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (watched.current === facts.entry_id) return
      if (watcher.current?.entryId !== facts.entry_id) {
        watcher.current = {
          entryId: facts.entry_id,
          tick: createPlayedWatcher(),
        }
      }
      if (!watcher.current.tick(e.currentTarget.currentTime)) return
      watched.current = facts.entry_id
      demoWatched(facts, "detail", "click", watcher.current.tick.seconds())
    },
    [facts]
  )

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  // Pressing play counts nothing. ADR-0007 makes a view a recording watched, and
  // this component cannot tell watched from pressed — it does not know whether
  // the Demo then advanced a second or stalled. Only components/playback-owner.tsx
  // holds that, and it holds it for the grid; here the press just starts it.
  const handlePlayClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setIsPlaying(true)
  }

  // A failed Demo is terminal and says so. There is deliberately no fallback
  // source: Assets live only on the CDN, so the root-relative path this used to
  // retry does not exist in production and retrying it guaranteed a second
  // failure while still showing the user nothing.
  const handleVideoError = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      // Only the media element's own error counts — a childless <track> can
      // raise an error event of its own that says nothing about the Demo.
      const error = e.currentTarget.error
      if (!error) return
      const reason = FAILURE_REASONS[error.code] ?? "unknown"
      setFailureReason(reason)
      demoLoadFailed(src, reason, videoSource)
    },
    [src, videoSource]
  )

  // play() lives in an effect and not in the click handler because the <video>
  // only mounts once isPlaying is true — at click time there is nothing to call
  // play() on. videoSource is a dependency as well, so a source that changes
  // under an already-playing element loads *and* plays; without it the new
  // source decodes a first frame and freezes at currentTime 0. The e2e test
  // asserts currentTime advances precisely because "a video element exists"
  // would not have caught that.
  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play()?.catch(() => {})
    } else {
      videoRef.current?.pause()
    }
  }, [isPlaying, videoSource])

  const handleVideoAreaClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (isPlaying) {
      setIsPlaying(false)
      e.stopPropagation()
    }
  }

  return (
    <div className={`relative ${className}`}>
      {failureReason ? (
        <div
          role="alert"
          data-testid="demo-error"
          className="w-full h-full bg-neutral-900 text-neutral-200 flex flex-col items-center justify-center gap-1 p-4 text-center"
        >
          <span className="text-sm font-medium">This demo failed to load</span>
          <span className="text-xs text-neutral-400">
            {caption ?? src} ({failureReason})
          </span>
        </div>
      ) : isPlaying ? (
        <video
          ref={videoRef}
          src={videoSource}
          className="w-full h-full object-contain"
          controls={controls}
          loop={loop}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
          onTimeUpdate={handleTimeUpdate}
          onError={handleVideoError}
          tabIndex={0}
          aria-label="Pause video"
          onClick={handleVideoAreaClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              handleVideoAreaClick(e)
            }
          }}
          poster={posterImage}
          preload="auto"
          // Without this, iOS takes any playback to fullscreen the moment it
          // starts — inside the overlay as well as on the page.
          playsInline
        >
          <track kind="captions" srcLang="en" label={caption} default />
        </video>
      ) : (
        <button
          type="button"
          className="relative w-full h-full bg-black flex items-center justify-center cursor-pointer"
          onClick={handlePlayClick}
          aria-label="Play video"
        >
          {/* The browser's own lazy gate, rather than a hand-rolled one: this
              used to be a CSS background-image, which every card fetched the
              moment it mounted — 277 Posters, ~3.9MB, competing with LCP.
              object-cover + the default 50% 50% origin paint the identical
              rect the background painted into. Posters are already AVIF at
              crf 30 (scripts/generate-posters.ts:57-60), so next/image would
              only re-encode optimal bytes through an extra hop. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* relative is load-bearing — without it the absolute <img> paints
              over the play icon. */}
          <div className="relative bg-opacity-50 p-2 rounded-full bg-gray-100 dark:bg-gray-300">
            <PlayIcon aria-hidden="true" />
            <span className="sr-only">Play</span>
          </div>
        </button>
      )}
    </div>
  )
}

export default InteractiveVideo
