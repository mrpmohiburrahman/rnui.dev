"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PlayIcon } from "lucide-react"
import { usePostHog } from "posthog-js/react"
import { getCdnUrl } from "@/lib/cdn"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface InteractiveVideoProps {
  src: string
  caption?: string
  poster?: string
  className?: string
  controls?: boolean
  loop?: boolean
  incrementViewCount: () => Promise<void>
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
  poster,
  className = "",
  controls = true,
  loop = false,
  incrementViewCount,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const posthog = usePostHog()

  // Lazy loading: only load video when near viewport
  const [containerRef, isInView] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "200px",
    freezeOnceVisible: true,
  })

  const videoSource = getCdnUrl(src)
  const posterImage =
    poster && poster.trim() !== "" ? getCdnUrl(poster) : "/logo.png"

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  // Playback starts first and the view counter follows, rather than the click
  // awaiting a round trip to Firestore before anything happens. A counter must
  // never sit between a user and the thing they clicked: on a slow connection
  // that is a stall, and when the counter backend is unreachable it never
  // resolves at all, so the Demo simply never starts.
  const handlePlayClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    setIsPlaying(true)
    void incrementViewCount().catch(() => {})
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
      posthog?.capture("demo_load_failed", {
        asset_path: src,
        reason,
        url: videoSource,
      })
    },
    [posthog, src, videoSource]
  )

  // videoSource is a dependency, not just isPlaying. The grid is virtualised, so
  // a mounted card can be handed a different Entry while isPlaying is already
  // true; without this the new source loads but never plays, leaving a decoded
  // first frame frozen at currentTime 0. The e2e test asserts currentTime
  // advances precisely because "a video element exists" would not have caught that.
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
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
        >
          <track kind="captions" srcLang="en" label={caption} default />
        </video>
      ) : (
        <button
          type="button"
          className="w-full h-full bg-black flex items-center justify-center cursor-pointer focus:outline-none"
          style={{
            backgroundImage: `url(${posterImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          onClick={handlePlayClick}
          aria-label="Play video"
        >
          <div className="bg-opacity-50 p-2 rounded-full bg-gray-100 dark:bg-gray-300">
            <PlayIcon aria-hidden="true" />
            <span className="sr-only">Play</span>
          </div>
        </button>
      )}
    </div>
  )
}

export default InteractiveVideo
