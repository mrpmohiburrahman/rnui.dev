"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PlayIcon } from "lucide-react"

import {
  demoLoadFailed,
  demoPlayed,
  demoWatched,
  type RecordingFacts,
} from "@/lib/analytics"
import { getCdnUrl } from "@/lib/cdn"
import { createPlayedWatcher, type PlayedWatcher } from "@/lib/view-signal"

/** The detail body's four media states (ticket 09 step 3), surfaced to the
 * chrome that overlays this box. This component holds the truth — it owns the
 * <video> and its error — and the detail labels mirror it, so the chrome can
 * never claim PLAYING while nothing is. */
export type MediaState = {
  playing: boolean
  failed: boolean
}

interface InteractiveVideoProps {
  src: string
  /**
   * Which Recording this is, for the two playback events. The grid's tile takes the
   * same thing; this one is the `detail` surface, and its `trigger` is always a
   * click because the <video> below does not exist until one.
   */
  facts: RecordingFacts
  caption?: string
  poster?: string
  className?: string
  controls?: boolean
  loop?: boolean
  /** Report the media state to the recording detail's chrome. */
  onStateChange?: (state: MediaState) => void
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

// The failure chrome's mono line, per reason — the same map the tile draws
// (components/demo-tile.tsx has its own), so a decode failure reads DECODE
// FAILED and a missing Asset reads NETWORK FAILED.
const FAILURE_LABELS: Record<string, string> = {
  aborted: "◺ PLAYBACK ABORTED",
  network: "◺ NETWORK FAILED",
  decode: "◺ DECODE FAILED",
  unsupported: "◺ FORMAT UNSUPPORTED",
}

const InteractiveVideo: React.FC<InteractiveVideoProps> = ({
  caption,
  src,
  facts,
  poster,
  className = "",
  controls = true,
  loop = false,
  onStateChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  // The detail's chrome keys off the same object this box holds, so `PLAYING`
  // cannot render over a box that is not. Reported from an effect because the
  // truth lives in state here and nowhere else (ticket 09 step 3).
  useEffect(() => {
    onStateChange?.({ playing: isPlaying, failed: failureReason !== null })
  }, [isPlaying, failureReason, onStateChange])

  // Both playback events fire once per opened Recording, not once per press. The
  // <video> unmounts whenever the visitor pauses it, so these refs sit here
  // rather than in the element: a pause and a resume is one visit to one Demo.
  //
  // Each holds the Recording it fired for rather than a bare boolean, exactly as
  // recording-detail.tsx:59 keys its own count. This component instance survives
  // being handed a second Recording — the overlay reopens over its own 100ms exit,
  // and Back between two /recording/<id> pages is a client navigation — and a
  // boolean would suppress every playback event for that second one, silently
  // dropping the funnel's first step.
  const played = useRef<string | null>(null)
  const watched = useRef<string | null>(null)

  // The same watcher the grid uses, for the same reason — the two-second
  // threshold and what counts towards it are ADR-0007's, not this component's.
  // Built on the first timeupdate rather than at render, so a paused Demo
  // allocates nothing and a new Recording gets a watcher with no seconds on it.
  const watcher = useRef<{ recordingId: string; tick: PlayedWatcher } | null>(
    null
  )

  const videoSource = getCdnUrl(src)
  const posterImage =
    poster && poster.trim() !== "" ? getCdnUrl(poster) : "/logo.png"

  const handleVideoPlay = () => {
    setIsPlaying(true)
    if (played.current === facts.recording_id) return
    played.current = facts.recording_id
    demoPlayed(facts, "detail", "click")
  }

  const handleTimeUpdate = useCallback(
    (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (watched.current === facts.recording_id) return
      if (watcher.current?.recordingId !== facts.recording_id) {
        watcher.current = {
          recordingId: facts.recording_id,
          tick: createPlayedWatcher(),
        }
      }
      if (!watcher.current.tick(e.currentTarget.currentTime)) return
      watched.current = facts.recording_id
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
          className="absolute inset-0 bg-[rgba(4,5,8,0.9)] flex flex-col items-center justify-center gap-[11px] p-[18px] text-center"
        >
          <div
            className="font-mono text-[9px] tracking-[0.14em] text-[#F5B3A4]"
            aria-hidden
          >
            {FAILURE_LABELS[failureReason] ?? "◺ PLAYBACK FAILED"}
          </div>
          <div className="text-xs leading-[1.45] text-[rgba(255,255,255,0.86)] text-pretty">
            This recording won’t play in your browser. The source is still there.
          </div>
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
