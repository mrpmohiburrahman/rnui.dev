"use client"

import { useEffect, useRef, useState } from "react"
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
  const videoRef = useRef<HTMLVideoElement>(null)

  // Lazy loading: only load video when near viewport
  const [containerRef, isInView] = useIntersectionObserver<HTMLDivElement>({
    rootMargin: "200px", // Start loading 200px before visible
    freezeOnceVisible: true, // Don't unload once loaded
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

  // Optimize poster image - use local path since thumbnails are in public folder
  // Videos are on ImageKit, but thumbnails are still local
  const posterImage = poster && poster.trim() !== ""
    ? `/${poster}` // Local path from public folder
    : "/logo.png"

  // Optimize video URL with quality parameter (50% for good balance)
  const videoUrl = getImageKitVideoUrl(src, 50)

  // Smart preload strategy:
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
          // Always set src for debugging (removed lazy loading condition)
          src={videoUrl}
          className="w-full h-full object-contain"
          controls={controls}
          loop={loop}
          onPlay={handleVideoPlay}
          onPause={handleVideoPause}
          onEnded={handleVideoEnded}
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

