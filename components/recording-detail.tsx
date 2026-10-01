// components/recording-detail.tsx
//
// The Recording detail panel body, and nothing else. It was card-modal.tsx, which
// also owned the modal wrapper and the "is anything selected" guard; both moved
// out so this file renders identically inside the overlay and on the standalone
// /recording/<id> page. It knows nothing about Radix: the dialog's accessible name
// is set by components/recording-overlay.tsx.
//
// "use client" because the controls below carry onClick handlers, and the
// standalone page that renders this is a server component — which cannot attach
// an event handler at all.
"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { Recording } from "@/data/recording"

import {
  bookmarkAdded,
  bookmarkRemoved,
  filterApplied,
  recordingFacts,
  recordingOpened,
  repoClicked,
  voteCast,
} from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { decrementVoteCount } from "@/app/actions/decrement-vote-count"
import { incrementVoteCount } from "@/app/actions/increment-vote-count"

import InteractiveVideo, { type MediaState } from "./interactive-video"
import { countView, PlaybackOwner } from "./playback-owner"
import { RecordingCard } from "./recording-card"

/** Turn a measured width÷height aspect (ticket 03) into the "a:b" the media
 * chrome reads — 0.5625 becomes 9:16. The mock drew 9:16 everywhere; the real
 * Recordings are not all 9:16, so the label is derived from the measurement the
 * same way the box's height is, rather than copied (ticket 09 step 3). */
export function formatAspect(aspect: number): string {
  let best: [number, number] = [9, 16]
  let bestErr = Infinity
  for (let b = 1; b <= 16; b++) {
    const a = Math.round(aspect * b)
    if (a < 1 || a > 16) continue
    const err = Math.abs(a / b - aspect)
    if (err < bestErr) {
      bestErr = err
      best = [a, b]
    }
  }
  return `${best[0]}:${best[1]}`
}

/** The Contributor block avatar's initials. Lives in lib/ so the server-rendered
 *  /aboutus page can call it too (a client component cannot be imported from a
 *  server component); imported here for use and re-exported for the tests. */
import { contributorInitials } from "@/lib/contributor-initials"
export { contributorInitials } from "@/lib/contributor-initials"
export function RecordingDetail({
  recording,
  // The heading element. Radix logs an error on every open unless a DialogTitle
  // is inside the content — aria-label on the content silences neither it nor
  // its cause — and Radix's DialogTitle renders an h2 of its own, so the overlay
  // passes it in here. It cannot be imported into this file: DialogTitle throws
  // outside a Dialog, and this same body renders standalone at /recording/<id>.
  Title = "h2",
  // Count the open from here. Only app/recording/[id]/page.tsx sets it, and it has
  // to be explicit rather than inferred: the overlay renders this same body
  // after components/recording-card.tsx has already counted, so a component that
  // decided for itself would double-bill every open from the grid.
  countsOwnOpen = false,
  keyboardControls = false,
  form = "page",
  topViewCount,
  catalogueTotal,
  contributorTotal,
  more,
  saved,
  voted,
  onToggleSave,
  onToggleVote,
  savedIds,
  votedIds,
  onToggleSaveId,
  onToggleVoteId,
}: {
  recording: Recording
  Title?: React.ElementType
  countsOwnOpen?: boolean
  /** Which of the mock's two desktop forms this is (Detail.dc.html:124-140).
   *  The third, `mobile`, is a viewport and stays a breakpoint — but page and
   *  overlay are the same viewport at different sizes, so no media query can
   *  tell them apart. It shows: the media box is 414 on the page and 380 in the
   *  overlay (`mW`, :132), and the title is 36 against 30 (`titleSize`, :138).
   *  Left to `lg:`/`xl:` the overlay drew both at the page's figures. */
  form?: "page" | "overlay"
  /** Listen for `S` and `V` while mounted. The overlay sets it, because the
   * overlay is the surface that draws the `S SAVE | V VOTE` legend; the
   * standalone route does not, and neither does anything else.
   *
   * The keys live here rather than in the overlay's own keydown effect because
   * this is where the handlers they have to be — the ones that fire the events
   * and move Firestore — already are, alongside the optimistic count they move.
   * Driving them from outside is what made a keyboard vote a no-op that still
   * flipped `aria-pressed` (ticket 09 review, 2026-08-03). */
  keyboardControls?: boolean
  /** The whole catalogue's top view count — the view bar's denominator
   * (ticket 07 step 8), threaded rather than recomputed here so the tile and
   * the detail cannot disagree. */
  topViewCount: number
  /** The whole catalogue size, the "of the N recordings" denominator. Never the
   * filtered set — a filtered detail would print a fraction of the catalogue. */
  catalogueTotal: number
  /** The open Contributor's whole-catalogue count, `RECORDINGS_PER_CONTRIBUTOR`
   * — never a mock constant. `n` in the attribution line and the See-all link. */
  contributorTotal: number
  /** The Contributor's other Recordings, open one excluded — exactly two, from
   * the page the caller was handed. */
  more: Recording[]
  /** Both Remembered sets belong to components/catalogue-page.tsx, never this
   *  body. This component takes the flags and the toggles as props — a second
   *  useRememberedSet here would hold its own state over the same key and race
   *  the tile behind the scrim. */
  saved: boolean
  voted: boolean
  onToggleSave: () => void
  onToggleVote: () => void
  /** The same two sets, as ids and id-taking toggles, for the MORE FROM THIS
   *  CONTRIBUTOR strip. The drawing renders that strip with the catalogue's own
   *  Tile (Detail.dc.html:83), controls included, so those two cards need the
   *  sets the same way a grid card does — and for the same reason as the four
   *  props above, they arrive from the caller rather than from a second
   *  useRememberedSet in here. */
  savedIds: string[]
  votedIds: string[]
  onToggleSaveId: (id: string) => void
  onToggleVoteId: (id: string) => void
}) {
  // No local view count here, and no counting on play. This component used to
  // mount before anything was selected, so the count it held was seeded from
  // nothing, incremented on every open, and rendered nowhere. The Demo below no
  // longer bills a view either: ADR-0007 counts a recording watched, and the
  // playback owner is the only thing that can tell watched from pressed.
  //
  // An effect, because a cold /recording/<id> has no click to hang the count on —
  // the visitor arrived from a shared link or a cmd-clicked headline, and
  // ADR-0007:3 counts that as an open all the same. Keyed on the id rather than a
  // boolean so a client navigation between two Recordings still counts the second.
  const facts = useMemo(() => recordingFacts(recording), [recording])

  // `recording_opened` rides the same guard, and only on this path: the overlay's
  // open is reported by the card that pushed the address (`source: card`) or by
  // the arrows (`source: keyboard`); a cold arrival means there was no card.
  const counted = useRef<string | null>(null)
  useEffect(() => {
    if (!countsOwnOpen || counted.current === recording.id) return
    counted.current = recording.id
    countView(recording.id)
    recordingOpened(facts, "url")
  }, [countsOwnOpen, recording.id, facts])

  // The media chrome keys off the same object InteractiveVideo holds, so a label
  // can never claim PLAYING over a box that is not. `aspect` measured by
  // assets:measure; the 9/16 fallback keeps an unmeasured Recording from
  // colliding with its label (which selects by the same measured aspect).
  const [media, setMedia] = useState<MediaState>({
    playing: false,
    failed: false,
  })

  // The displayed vote count follows the Recording with this visitor's clicks
  // added on top, the same pattern the tile works out in full
  // (components/recording-card.tsx:48-71): counts arriving from the server
  // already include this visitor's clicks, so the additions reset rather than
  // stacking on top of them.
  const baseVotes = recording.vote_count ?? 0
  const [votesSeen, setVotesSeen] = useState(baseVotes)
  const [votesClicked, setVotesClicked] = useState(0)
  if (votesSeen !== baseVotes) {
    setVotesSeen(baseVotes)
    setVotesClicked(0)
  }
  const voteCount = Math.max(baseVotes + votesClicked, 0)

  const handleVote = useCallback(async () => {
    onToggleVote()
    if (voted) {
      try {
        await decrementVoteCount(recording.id)
        setVotesClicked((n) => n - 1)
      } catch (error) {
        console.error("Error decrementing vote count:", error)
      }
    } else {
      voteCast(facts)
      try {
        await incrementVoteCount(recording.id)
        setVotesClicked((n) => n + 1)
      } catch (error) {
        console.error("Error incrementing vote count:", error)
      }
    }
  }, [onToggleVote, voted, recording.id, facts])

  const handleSave = useCallback(() => {
    if (saved) bookmarkRemoved(facts)
    else bookmarkAdded(facts)
    onToggleSave()
  }, [saved, facts, onToggleSave])

  // `S` and `V`, the two keys the overlay's legend promises. They call exactly
  // the handlers the buttons call, which is the whole point of them being here:
  // the acceptance is "`V` moves the vote count in both", and only handleVote
  // moves a count. A modified key returns early for the same reason the arrows
  // do — ⌘← is browser Back and closing is what it must keep doing.
  useEffect(() => {
    if (!keyboardControls) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const key = e.key.toLowerCase()
      if (key === "s") handleSave()
      else if (key === "v") void handleVote()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [keyboardControls, handleSave, handleVote])

  const aspectStr =
    recording.aspect && recording.aspect > 0
      ? formatAspect(recording.aspect)
      : "9:16"
  const seconds = Math.round((recording.durationMs ?? 0) / 1000)
  const tileHue = recording.hue ?? 175
  const viewCount = recording.view_count ?? 0

  // The view bar. The label prints the unfloored percentage so a Recording on
  // zero views reads `0% OF TOP ENTRY` rather than the tile's 4% floor — the
  // one thing on this screen that must not lie; the fill keeps the mock's 4% floor
  // so a no-view Recording still shows a sliver.
  const viewPct =
    topViewCount > 0 ? Math.round((viewCount / topViewCount) * 100) : 0
  const fillWidth = Math.max(4, viewPct)

  const mediaState = media.failed
    ? "failed"
    : media.playing
      ? "playing"
      : "still"

  return (
    <div className="flex flex-col lg:flex-row gap-5 lg:gap-10">
      {/* Media column. A fixed-width column with the box's height declared from
          the measured aspect — never measured after load, so nothing reflows
          when a Poster or Demo lands (CLS is acceptance at checkpoint 5). */}
      <div
        className={cn(
          // 358 phone, 380 overlay, 414 page — Detail.dc.html:132's `mW`.
          "w-[358px] max-w-full flex-none sm:w-[380px]",
          form === "page" && "lg:w-[414px]"
        )}
      >
        <div
          data-state={mediaState}
          className="detail-media relative overflow-hidden rounded-[16px] lg:rounded-[20px] bg-plinth shadow-media w-full"
          style={
            {
              aspectRatio: String(recording.aspect ?? 9 / 16),
              "--tile-hue": tileHue,
            } as React.CSSProperties
          }
        >
          {/* The drawing's three media layers, behind the recording rather than
              over it — see components/demo-tile.tsx for why. */}
          <span className="detail-wash" />
          <span className="detail-hatch" />
          <span className="detail-notch" />
          <InteractiveVideo
            src={recording.demoPath}
            facts={facts}
            className="w-full h-full"
            poster={recording.posterPath}
            caption={`video demo of ${recording.caption}`}
            loop
            onStateChange={setMedia}
          />
          {/* Chrome over the media. pointer-events-none so it never sits between
              a visitor and the play control. */}
          <div className="pointer-events-none absolute inset-0">
            <span className="detail-media-center font-mono">{aspectStr}</span>
            <span className="detail-pip font-mono" aria-hidden />
            <span className="detail-noaudio font-mono" aria-hidden>
              NO AUDIO TRACK
            </span>
          </div>
        </div>
        <div className="detail-media-strip font-mono">
          CAPTURED ON DEVICE · {seconds}S LOOP · SILENT
        </div>
      </div>

      {/* Information column */}
      {/* `infoGap`, Detail.dc.html:139: 18 on a phone and 22 on both desktop
          forms. It was 22 then 20, which is the pair the other way round. */}
      <div className="flex flex-none flex-col gap-[18px] lg:min-w-0 lg:flex-1 lg:gap-[22px]">
        {/* Category line and title */}
        <div>
          <div className="flex items-center gap-2 pb-[9px]">
            <a
              href={`/products?${new URLSearchParams({ category: recording.category }).toString()}`}
              // The Category link sets a filter too, and was the second call
              // site with no event — same hole as the See-all link below, one
              // line away, so it is closed here rather than left for whoever
              // notices the funnel is short.
              onClick={() => filterApplied("category", recording.category, 1)}
              className="font-mono text-[9.5px] tracking-[0.12em] text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
            >
              {recording.category.toUpperCase()}
            </a>
            {recording.isNew && (
              <span className="font-mono text-[9px] tracking-[0.12em] px-1.5 py-1 rounded-[6px] bg-new-bg text-new-fg">
                NEW BATCH
              </span>
            )}
          </div>
          <Title
            // 24 phone, 30 overlay, 36 page — Detail.dc.html:138's `titleSize`.
            // The `xl:` step is the page's alone; the overlay stops at 30 however
            // wide the viewport is.
            className={cn(
              "m-0 text-[24px] font-medium leading-[1.12] tracking-[-0.025em] text-t1 text-pretty lg:text-[30px]",
              form === "page" && "xl:text-detail"
            )}
            style={{ textWrap: "pretty" } as React.CSSProperties}
          >
            {recording.caption}
          </Title>
        </div>

        {/* Contributor block */}
        <div className="flex items-start gap-3 p-3.5 rounded-panel border border-line bg-well">
          <div
            aria-hidden
            className="flex-none w-[38px] h-[38px] rounded-[10px] bg-acc-soft border border-line flex items-center justify-center font-mono text-[11px] text-acc"
          >
            {contributorInitials(recording.contributor)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[8.5px] tracking-[0.14em] text-t3 pb-[3px]">
              CONTRIBUTED BY
            </div>
            <div className="text-[14px] leading-[1.3] text-t1 [overflow-wrap:anywhere]">
              {recording.contributor}
            </div>
            <div className="flex flex-wrap gap-2.5 pt-[7px]">
              {profileLink(recording.twitterId, "X")}
              {profileLink(recording.githubId, "GitHub")}
              {profileLink(recording.linkedInId, "LinkedIn")}
            </div>
            <div className="pt-2 text-[11.5px] leading-[1.45] text-t2">
              {contributorTotal} of the {catalogueTotal} recordings here{" "}
              {contributorTotal === 1 ? "is" : "are"} theirs.
              {contributorTotal > 1 && (
                <>
                  {" "}
                  <a
                    href={`/products?${new URLSearchParams({ contributor: recording.contributor }).toString()}`}
                    // The same event /contributors' rows fire, and the same
                    // literal 1: this link's destination carries `contributor`
                    // and nothing else. Without it, every Contributor filter set
                    // from a detail is missing from filter_applied and the funnel
                    // reads as though nobody uses them (ticket 10 step 4).
                    onClick={() =>
                      filterApplied("contributor", recording.contributor, 1)
                    }
                    className="text-acc underline underline-offset-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
                  >
                    See all {contributorTotal} →
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* The view bar */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-t2 tabular-nums min-w-[96px]">
              {viewCount.toLocaleString("en-US")} views
            </span>
            <div className="flex-1 h-[3px] rounded-[2px] bg-bar-track">
              <div
                className="h-[3px] rounded-[2px] bg-bar-fill"
                style={{ width: `${fillWidth}%` }}
              />
            </div>
            <span className="font-mono text-[9px] tracking-[0.1em] text-t3 whitespace-nowrap tabular-nums">
              {/* Detail.dc.html:69 draws "OF TOP ENTRY" — pre-rename copy. */}
              {viewPct}% OF TOP RECORDING
            </span>
          </div>
          <div className="hidden lg:flex flex-wrap items-center gap-2">
            {/* Vote */}
            <button
              type="button"
              onClick={handleVote}
              aria-pressed={voted}
              aria-keyshortcuts={keyboardControls ? "v" : undefined}
              aria-label={`${voted ? "Unvote" : "Vote"}, ${voteCount}`}
              className={cn(
                "flex items-center gap-2 text-[13px] font-medium px-3.5 py-2.5 rounded-[10px] border",
                voted
                  ? "border-acc bg-acc-soft text-acc"
                  : "border-line2 bg-ctrl text-t1",
                "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
              )}
            >
              {/* Glyph and word in one flex item, so the button's gap-2 is the
                  mock's 8px between `▲ Vote` and the count and nowhere else. */}
              <span>
                <span aria-hidden>▲</span> Vote
              </span>{" "}
              <span className="font-mono text-[11px] text-t2 tabular-nums">
                {voteCount}
              </span>
            </button>
            {/* Save */}
            <button
              type="button"
              onClick={handleSave}
              aria-pressed={saved}
              aria-keyshortcuts={keyboardControls ? "s" : undefined}
              className={cn(
                "flex items-center gap-2 text-[13px] font-medium px-3.5 py-2.5 rounded-[10px] border",
                saved
                  ? "border-acc bg-acc-soft text-acc"
                  : "border-line bg-ctrl text-t1",
                "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
              )}
            >
              <span aria-hidden>{saved ? "◆" : "◇"}</span>{" "}
              {saved ? "Saved" : "Save"}
            </button>
            {/* Repo */}
            <a
              href={recording.source}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation()
                countView(recording.id)
                repoClicked(facts, "detail")
              }}
              // 232, not the mock's `min-width:200px` (Detail.dc.html): that
              // 200 is a content minimum and the button carries `padding:12px
              // 16px`, so the drawn control is 232 across at its narrowest.
              className="flex-1 min-w-[232px] flex items-center justify-center gap-[9px] text-[13.5px] font-medium px-4 py-3 rounded-[10px] bg-acc text-on-acc no-underline focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
            >
              Open source repo on GitHub <span aria-hidden>↗</span>
            </a>
          </div>
          <p className="m-0 text-[11.5px] leading-[1.5] text-t2">
            Your vote and your save stay in this browser on this device. No
            account exists — clearing site data clears them.
          </p>
        </div>

        {/* MORE FROM THIS CONTRIBUTOR */}
        {more.length > 0 && (
          <div>
            <div className="font-mono text-[9px] tracking-[0.14em] text-t3 pb-[11px]">
              MORE FROM THIS CONTRIBUTOR
            </div>
            {/* The catalogue's own card at the drawing's width — `<dc-import
                name="Tile" w="{{ moreW }}">`, 140 desktop and 150 on a phone
                (Detail.dc.html:83, :140). It used to be a hand-cut copy that
                stopped after the views bar: no by-line, a 13px/1.2 title where
                the Tile draws 14.5/1.32, and none of the ▲ / ◇ Save / Repo ↗
                row, which left each card 102px short of the drawn one.

                `<PlaybackOwner suspended>`: the card mounts a Demo and
                usePlaybackOwner throws with no provider above it, and the
                standalone page has none. Suspended grants nothing, so both
                cards hold their Poster — which is the state the drawing gives
                them (`state:'paused'`, Detail.dc.html:111-112). Inside the
                overlay this nests within the catalogue's own owner, itself
                already suspended while the overlay is open. */}
            <PlaybackOwner suspended>
              <div className="flex gap-3.5">
                {more.map((related) => (
                  <div key={related.id} className="w-[150px] lg:w-[140px]">
                    <RecordingCard
                      recording={related}
                      topViewCount={topViewCount}
                      isBookmarked={savedIds.includes(related.id)}
                      toggleBookmark={onToggleSaveId}
                      isVoted={votedIds.includes(related.id)}
                      toggleVote={onToggleVoteId}
                    />
                  </div>
                ))}
              </div>
            </PlaybackOwner>
          </div>
        )}
      </div>

      {/* Mobile: the three controls pinned under the body, each ≥44px tall. The
          desktop inline row is hidden below `lg`, this bar shows there and not
          above it. */}
      <div className="flex lg:hidden items-center gap-[9px] pt-[11px] border-t border-line bg-rail">
        <button
          type="button"
          onClick={handleVote}
          aria-keyshortcuts={keyboardControls ? "v" : undefined}
          aria-label={voted ? "Unvote" : "Vote"}
          className="flex items-center gap-2 font-mono text-xs px-[13px] py-3 rounded-[11px] border min-h-[44px] border-line2 bg-ctrl text-t1"
        >
          <span aria-hidden>▲</span> {voteCount}
        </button>
        <button
          type="button"
          onClick={handleSave}
          aria-keyshortcuts={keyboardControls ? "s" : undefined}
          aria-label={saved ? "Saved" : "Save"}
          className="flex items-center px-3 py-3 rounded-[11px] border min-h-[44px] text-[12.5px] border-acc bg-acc-soft text-acc"
        >
          <span aria-hidden>{saved ? "◆" : "◇"}</span>
        </button>
        <a
          href={recording.source}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation()
            countView(recording.id)
            repoClicked(facts, "detail")
          }}
          className="flex-1 flex items-center justify-center text-[13.5px] font-medium rounded-[11px] bg-acc text-on-acc no-underline min-h-[46px]"
        >
          Open repo <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  )
}

/** A Contributor profile link, built the way the tile builds its three URLs
 * (recording-card.tsx:330,343,355) so the label changes but the host does not.
 *
 * An absent id states the absence rather than rendering nothing — step 5, and
 * `rnui Studio Dark.dc.html:81`'s stated intent. It was doing that for LinkedIn
 * only, at the call site; the guard belongs in here, where all three networks
 * pass through it. The parameter is now the bare network name, so the `↗` and
 * the "not listed" wording are both built from one string. */
function profileLink(id: string | undefined, name: string): React.ReactNode {
  if (!id) return <span className="text-xs text-t3">{name} not listed</span>
  return (
    <a
      href={profileUrlFor(id, name)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
    >
      {name} ↗
    </a>
  )
}

// Matched on the network name rather than the display copy. It used to read
// `label.startsWith("X")` against the rendered string, so changing what a link
// says would have silently repointed where it goes.
function profileUrlFor(id: string, name: string): string {
  if (name === "X") return `https://twitter.com/${id}`
  if (name === "GitHub") return `https://github.com/${id}`
  return `https://linkedin.com/in/${id}`
}
