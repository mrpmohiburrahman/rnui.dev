// components/demo-tile.tsx
//
// One Demo in the grid. It replaces components/interactive-video.tsx there and
// owns none of the playback decisions: components/playback-owner.tsx says when
// this <video> plays, and @/lib/view-signal says when it counts.
//
// Studio Dark ticket 07: this box is now the tile's only bounded object. The
// radius and the background are the same element (`border-radius:16px` plus the
// plinth), so there is exactly one layer behind the Poster. That is what the old
// `bg-black` comment recorded, minus the card that used to clip this box to a
// rounded top corner and antialias its arc against however many dark layers sat
// under it — with one instead of two, ten corners came out a few levels lighter,
// 138 pixels measured. If the box is ever split into two layers again, that
// defect comes back with it; the fix is to keep the radius and the background on
// the same element (Tile.dc.html:11).
"use client"

import { useCallback, useRef, useState } from "react"

import type { Recording } from "@/data/recording"
import {
  demoLoadFailed,
  demoPlayed,
  type RecordingFacts,
} from "@/lib/analytics"
import { getCdnUrl } from "@/lib/cdn"

import { usePlaybackOwner } from "./playback-owner"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

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

// The failure overlay's mono line, per reason. The values are the `reason`
// property posthog-expansion reads, so FAILURE_REASONS is untouched and this
// map names them for a human; the mock's own string is used for the code it drew.
const FAILURE_LABELS: Record<string, string> = {
  aborted: "◺ PLAYBACK ABORTED",
  network: "◺ NETWORK FAILED",
  decode: "◺ DECODE FAILED",
  unsupported: "◺ FORMAT UNSUPPORTED",
}

export function DemoTile({
  recording,
  facts,
  onRepoClick,
  className = "",
}: {
  // The Recording itself rather than its three asset paths: the tile needs `hue`
  // for the emission, `isNew` for the chip and `source` for the failed state's
  // action, and four scalars is worse than one object. The module still reads
  // `recording.demoPath` and `recording.posterPath` and never speaks `src` or
  // `thumbnail` — ADR-0004 governs the spelling, not the arity.
  recording: Recording
  // The Recording's analytics facts rather than its id: this tile reports the play
  // and the owner reports the watch, and both events name the Category and the
  // contributor. Memoise it at the call site — it is a `register` dependency, and a
  // fresh object per render unobserves and re-observes the <video>.
  facts: RecordingFacts
  // The same handler the `Repo ↗` link below the media calls. Following the
  // Source link is one of ADR-0007's three view signals, and a broken tile does
  // not change that (ticket 07 step 6).
  onRepoClick: (e: React.MouseEvent) => void
  className?: string
}) {
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [hasPlayed, setHasPlayed] = useState(false)
  // Is a slot granted right now, as distinct from `hasPlayed` — *has the fade
  // run* vs *is the slot held right now*. They must not share a variable: the
  // owner pauses tiles that scroll out of view (playback-owner.tsx:118), and
  // reusing hasPlayed for the glow would leave every scrolled-past tile glowing
  // behind the visitor (ticket 07 step 3).
  const [playing, setPlaying] = useState(false)
  // Once per tile per page. The owner pauses and re-grants a slot on every
  // scroll that changes what is on screen, so `playing` fires repeatedly for a
  // tile nobody did anything new to.
  const announced = useRef(false)
  const owner = usePlaybackOwner()
  const reduced = usePrefersReducedMotion()

  // The Published Asset's address, not an Asset path — that distinction is why
  // these are named apart from the props above.
  const demoUrl = getCdnUrl(recording.demoPath)
  const posterUrl =
    recording.posterPath && recording.posterPath.trim() !== ""
      ? getCdnUrl(recording.posterPath)
      : "/logo.png"

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
      demoLoadFailed(recording.demoPath, reason, demoUrl)
    },
    [recording.demoPath, demoUrl]
  )

  // A React 19 ref cleanup, memoised: an inline arrow would unregister and
  // re-register the tile — unobserving and re-observing it — on every render.
  const registerDemo = useCallback(
    (el: HTMLVideoElement | null) => {
      if (!el) return
      return owner.register(el, facts)
    },
    [owner, facts]
  )

  // The hue reaches CSS as one inline custom property, set from the Recording's
  // measured hue with the mock's own fallback (Tile.dc.html:75) — the accent's
  // own hue (Specimen.dc.html:114), so an unmeasured Recording glows in the
  // site's green rather than in nothing.
  const tileHue = recording.hue ?? 175

  return (
    <div
      data-testid="demo"
      data-playing={playing ? "" : undefined}
      className={`tile-media relative aspect-[9/16] rounded-tile overflow-hidden bg-plinth w-full ${className}`}
      style={{ "--tile-hue": tileHue } as React.CSSProperties}
    >
      {/* The drawing's three media layers (Tile.dc.html:12-14) — the hue wash,
          the 135° hatch, the notch bar — behind the recording, not over it.

          The drawing paints them over the plinth because it has no <video> to
          draw: there, the wash *is* the recording. Reproducing that stacking
          literally puts a green cast and a stripe pattern across every real
          screen capture, which is the one thing a catalogue of screen captures
          must not do. So they stay as the plinth's own treatment: what shows
          while the Poster is still loading, and in any letterbox a recording
          that is not exactly 9:16 leaves behind. */}
      <div className="tile-wash" />
      <div className="tile-hatch" />
      <div className="tile-notch" />

      {!failureReason && (
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
              // moment the Demo appears. The Specimen's first motion row is
              // 160ms opacity, linear (Specimen.dc.html:161), superseding
              // decision 15's 150ms — one number (ticket 07 step 4).
              //
              // It never fades back. Returning to a Poster two seconds ahead of
              // the paused frame would reintroduce the same jump, in the other
              // direction.
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-160 ease-linear ${
                hasPlayed ? "opacity-100" : "opacity-0"
              }`}
              onPlaying={() => {
                setPlaying(true)
                setHasPlayed(true)
                if (announced.current) return
                announced.current = true
                demoPlayed(facts, "grid", "autoplay")
              }}
              onPause={() => setPlaying(false)}
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
          <a
            href={recording.source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onRepoClick}
            className="text-[11.5px] font-medium text-[#08090C] bg-[#F1F2F4] px-[11px] py-[7px] rounded-[9px]"
          >
            Open repo <span aria-hidden>↗</span>
          </a>
        </div>
      ) : (
        /* The state chip, `aria-hidden` in full — it describes a purely
           visual state, and 48 of them announced is noise. Its text is the
           CSS ::before in globals.css, so the served HTML holds one element
           and both kinds of visitor read their own label from it. */
        <div
          aria-hidden
          className="state-chip font-mono text-[8.5px] tracking-[0.13em] px-[7px] py-1 rounded-[6px]"
        />
      )}
      {/* The NEW chip: top-right inside the media, and it survives a failed
          Demo the way the mock's sc-if does — a Recording being recent and a
          Recording being broken are different facts. aria-hidden like the
          state chip. */}
      {recording.isNew && (
        <div
          aria-hidden
          className="absolute right-[10px] top-[10px] font-mono text-[8.5px] tracking-[0.13em] px-[7px] py-1 rounded-[6px] bg-new-bg text-new-fg"
        >
          NEW
        </div>
      )}
    </div>
  )
}
