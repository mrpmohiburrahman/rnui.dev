"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PauseIcon, PlayIcon } from "lucide-react"
import { getImageKitVideoUrl } from "@/lib/imagekit"
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
  const [videoSource, setVideoSource] = useState<string>("")
  const [useLocalFallback, setUseLocalFallback] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Lazy loading: only load video when near viewport
  const [containerRef, isInView] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "200px",
    freezeOnceVisible: true,
  })

  const handleVideoPlay = () => {
    setIsPlaying(true)
  }

  const handleVideoPause = () => {
    setIsPlaying(false)
  }

  const handleVideoEnded = () => {
    setIsPlaying(false)
  }

  const handlePlayClick = async (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation()
    await incrementViewCount()
    setIsPlaying(true)
  }

  // Handle video load errors - fallback to local if ImageKit fails
  const handleVideoError = useCallback(() => {
    if (!useLocalFallback) {
      console.log(`ImageKit failed for ${src}, falling back to local video`)
      setUseLocalFallback(true)
      setVideoSource(`/${src}`) // Use local path
    } else {
      console.error(`Both ImageKit and local failed for ${src}`)
    }
  }, [src, useLocalFallback])

  // Set video source based on fallback state
  useEffect(() => {
    if (useLocalFallback) {
      // Use local video from public folder
      setVideoSource(`/${src}`)
    } else {
      // Try ImageKit first (no transformations to avoid account limits)
      setVideoSource(getImageKitVideoUrl(src))
    }
  }, [src, useLocalFallback])

  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play()
    } else {
      videoRef.current?.pause()
    }
  }, [isPlaying])

  const handleVideoAreaClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (isPlaying) {
      setIsPlaying(false)
      e.stopPropagation()
    }
  }

  // Optimize poster image - use local path
  const posterImage = poster && poster.trim() !== ""
    ? `/${poster}`
    : "/logo.png"

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isPlaying ? (
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
