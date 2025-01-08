"use client"

import { useEffect, useRef, useState } from "react"
import { PauseIcon, PlayIcon } from "lucide-react"

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
  const videoRef = useRef<HTMLVideoElement>(null)

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

  const posterImage = poster && poster.trim() !== "" ? poster : "/logo.png"

  return (
    <div className={`relative ${className}`}>
      {isPlaying ? (
        <video
          ref={videoRef}
          src={src}
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
