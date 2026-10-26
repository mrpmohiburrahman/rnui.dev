"use client"

import { useEffect, useRef, useState } from "react"

import type { PreviewCandidate } from "./candidates"

const MAX_AUTOPLAY = 6
const visibleVideos = new Set<HTMLVideoElement>()
let sharedObserver: IntersectionObserver | null = null

function syncAutoplay() {
  const ordered = Array.from(visibleVideos).sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
  )
  const active = new Set(ordered.slice(0, MAX_AUTOPLAY))
  for (const el of visibleVideos) {
    if (el.dataset.hovered === "true") continue
    if (active.has(el)) {
      if (el.paused) {
        void el.play().catch(() => {})
      }
    } else if (!el.paused) {
      el.pause()
    }
  }
}

function getSharedObserver(): IntersectionObserver {
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLVideoElement
          if (entry.isIntersecting) {
            visibleVideos.add(el)
          } else {
            visibleVideos.delete(el)
            if (el.dataset.hovered !== "true" && !el.paused) {
              el.pause()
            }
          }
        }
        syncAutoplay()
      },
      { threshold: 0.15 }
    )
  }
  return sharedObserver
}

function resolveMediaUrl(url: string): string {
  if (url.startsWith("https://video.twimg.com/")) {
    return `/preview-new-demos/media?url=${encodeURIComponent(url)}`
  }
  return url
}

export function CandidateTile({ candidate }: { candidate: PreviewCandidate }) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [nearViewport, setNearViewport] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [hasPlayed, setHasPlayed] = useState(false)

  useEffect(() => {
    const btn = buttonRef.current
    if (!btn) return
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setNearViewport(true)
            preloadObserver.disconnect()
          }
        }
      },
      { rootMargin: "120px 0px" }
    )
    preloadObserver.observe(btn)
    return () => preloadObserver.disconnect()
  }, [])

  useEffect(() => {
    if (!nearViewport) return
    const el = videoRef.current
    if (!el) return
    const observer = getSharedObserver()
    observer.observe(el)
    return () => {
      observer.unobserve(el)
      visibleVideos.delete(el)
      syncAutoplay()
    }
  }, [nearViewport])

  const play = () => {
    const el = videoRef.current
    if (!el) return
    el.dataset.hovered = "true"
    void el
      .play()
      .then(() => {
        setPlaying(true)
        setHasPlayed(true)
      })
      .catch(() => setPlaying(false))
  }

  const leave = () => {
    const el = videoRef.current
    if (!el) return
    delete el.dataset.hovered
    syncAutoplay()
  }

  const toggle = () => {
    const el = videoRef.current
    if (!el) return
    if (playing) {
      delete el.dataset.hovered
      el.pause()
      setPlaying(false)
    } else {
      play()
    }
  }

  const videoSrc = candidate.video
    ? `${resolveMediaUrl(candidate.video)}${candidate.poster ? "" : "#t=0.1"}`
    : undefined
  const posterSrc = candidate.poster
    ? resolveMediaUrl(candidate.poster)
    : undefined

  return (
    <div className={candidate.skipped ? "opacity-50" : undefined}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        onMouseEnter={play}
        onMouseLeave={leave}
        onFocus={play}
        onBlur={leave}
        aria-label={`Play ${candidate.caption}`}
        className="tile-media relative block aspect-[1206/2622] w-full overflow-hidden rounded-tile bg-plinth text-left"
        data-playing={playing ? "" : undefined}
      >
        <div className="tile-wash" />
        <div className="tile-hatch" />
        <div className="tile-notch" />

        {videoSrc ? (
          <>
            {posterSrc && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={posterSrc}
                alt=""
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <video
              ref={videoRef}
              src={nearViewport ? videoSrc : undefined}
              muted
              loop
              playsInline
              preload={nearViewport ? "metadata" : "none"}
              onPlaying={() => {
                setPlaying(true)
                setHasPlayed(true)
              }}
              onPause={() => setPlaying(false)}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-160 ease-linear ${
                !posterSrc || hasPlayed ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              aria-hidden
              className="state-chip rounded-[6px] px-[7px] py-1 font-mono text-[8.5px] tracking-[0.13em]"
            />
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="font-mono text-[10px] tracking-[0.12em] text-t3 uppercase">
              Source only
            </span>
            <span className="text-[11.5px] leading-snug text-t2">
              No published video exists for this extra route.
            </span>
          </div>
        )}

        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-white uppercase">
          {candidate.skipped ? "Skipped" : "New"}
        </span>
      </button>

      <div className="mt-2.5 flex flex-col gap-[7px]">
        <h3 className="min-h-[39px] text-[14.5px] font-medium leading-[1.32] tracking-[-0.01em] text-t1 text-pretty">
          {candidate.caption}
        </h3>
        <p className="font-mono text-[9px] tracking-[0.12em] text-t3 uppercase">
          {candidate.category} · proposed
        </p>
        <p className="min-h-[31px] text-xs leading-[1.32] text-t2 [overflow-wrap:anywhere]">
          {candidate.contributor}
        </p>
        {candidate.note && (
          <p className="text-[10.5px] leading-snug text-t3">{candidate.note}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <a
            href={candidate.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] font-medium text-acc underline underline-offset-3"
          >
            Source <span aria-hidden>↗</span>
          </a>
          <a
            href={candidate.expo}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11.5px] font-medium text-acc underline underline-offset-3"
          >
            Expo <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}
