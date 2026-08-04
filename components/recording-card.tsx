"use client"

import { memo, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import type { Recording } from "@/data/recording"

import {
  bookmarkAdded,
  bookmarkRemoved,
  recordingFacts,
  recordingOpened,
  repoClicked,
  voteCast,
} from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { decrementVoteCount } from "@/app/actions/decrement-vote-count"
import { incrementVoteCount } from "@/app/actions/increment-vote-count"

import { DemoTile } from "./demo-tile"
import { countView } from "./playback-owner"

interface RecordingCardProps {
  recording: Recording
  isBookmarked: boolean
  toggleBookmark: (id: string) => void
  isVoted: boolean
  toggleVote: (id: string) => void
  /** The whole catalogue's top view count — the views bar's denominator, which
   *  no client-side module can compute (ticket 07 step 8). Threaded from the
   *  routes, never fetched here. */
  topViewCount: number
  /** True when the previous tile in the grid shares this one's Contributor,
   *  which is what the mock's `runRepeat` means: the byline is then prefixed
   *  `↳ ` and drops to t3 (Tile.dc.html:108-109). The grid computes it; the
   *  card does not know its neighbours. */
  repeatsContributor?: boolean
}

const RecordingCardComponent: React.FC<RecordingCardProps> = ({
  recording,
  isBookmarked,
  toggleBookmark,
  isVoted,
  toggleVote,
  topViewCount,
  repeatsContributor = false,
}) => {
  // The displayed counts follow the Recording, with whatever this visitor has just
  // clicked added on top. They used to be snapshotted into state at mount, so a
  // re-render handed a fresh Recording kept showing the numbers the card happened to
  // mount with.
  const [viewsClicked, setViewsClicked] = useState(0)
  const [votesClicked, setVotesClicked] = useState(0)

  // Counts arriving from the server already include this visitor's clicks, so the
  // additions reset rather than stacking on top of them. Adjusted during render
  // rather than from an effect: an effect paints the stale sum and corrects it on
  // the next tick, and react-hooks/set-state-in-effect rejects it outright.
  const views = recording.view_count ?? 0
  const votes = recording.vote_count ?? 0
  const [viewsSeen, setViewsSeen] = useState(views)
  const [votesSeen, setVotesSeen] = useState(votes)
  if (viewsSeen !== views || votesSeen !== votes) {
    setViewsSeen(views)
    setVotesSeen(votes)
    setViewsClicked(0)
    setVotesClicked(0)
  }

  const viewCount = views + viewsClicked
  const voteCount = Math.max(votes + votesClicked, 0)

  // Every event this card reports names the same four things. Memoised because
  // the Demo tile passes it straight to the playback owner's `register`, which
  // observes and unobserves a <video> on each new identity.
  const facts = useMemo(() => recordingFacts(recording), [recording])

  // Two of ADR-0007's three signals are this card's: opening the Recording, and
  // following its Source link. Both go through the playback owner's countView
  // rather than importing the action a second time — ADR-0007:22 leaves the
  // increment with exactly one importer, which is what keeps the cap on the
  // third signal from being routed around.
  //
  // Neither awaited nor wrapped: countView never rejects (lib/counters.ts:60-63),
  // and a counter must not sit between a visitor and what they clicked. The bump
  // moves the number on screen for these two signals only — a view billed by
  // autoplay lands in Firestore and shows up on the next server render, because
  // a tile that ticks its own count up while nobody clicked reads as a glitch.
  const recordView = useCallback(() => {
    countView(recording.id)
    setViewsClicked((n) => n + 1)
  }, [recording.id])

  const decrementVoteCountLocal = useCallback(async () => {
    try {
      await decrementVoteCount(recording.id)
      setVotesClicked((n) => n - 1)
    } catch (error) {
      console.error("Error decrementing vote count:", error)
    }
  }, [recording.id])

  const incrementVoteCountLocal = useCallback(async () => {
    try {
      await incrementVoteCount(recording.id)
      setVotesClicked((n) => n + 1)
    } catch (error) {
      console.error("Error incrementing vote count:", error)
    }
  }, [recording.id])

  // The Recording's address, written once. The headline link needs it as an href and
  // the open needs it with the query string appended, and having those be two
  // separate literals is how one of them ends up carrying the query and the
  // other not.
  const href = `/recording/${recording.id}`

  // The card owns its own address. pushState rather than router.push: the App
  // Router reflects it through usePathname, so the panel opens with no server
  // render and no Firestore read, and Back closes it. At 10–30 opens a session a
  // router.push here would refetch the whole catalogue every time.
  //
  // The query string is carried over rather than dropped. pushState replaces the
  // whole URL, and the grid reads its page count from useSearchParams — so
  // opening a Recording from page 2 collapsed the catalogue behind the tint from 96
  // cards back to 48, then re-expanded it on close.
  //
  // Opening the Recording is a view, and an uncapped one — ADR-0007:3 lists it
  // alongside watching the Demo and following the source link. It is deliberate
  // in a way autoplay is not, so unlike the played signal it is not held to
  // once per session: a visitor who opens the same Recording twice looked twice.
  const handleClick = useCallback(() => {
    recordView()
    recordingOpened(facts, "card")
    window.history.pushState(null, "", `${href}${window.location.search}`)
  }, [href, recordView, facts])

  // The headline is a real <a>, so a modified click is the browser's to handle —
  // cmd/ctrl/shift/alt open the Recording in a new tab or window, which is the point
  // of it having an address. Everything else is the same open the card body does,
  // so only one of the two runs: stopPropagation keeps the ancestor from pushing
  // a second recording onto the history stack.
  const handleHeadlineClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      handleClick()
    },
    [handleClick]
  )

  const handleBookmarkClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // Read before the toggle: `isBookmarked` describes the state the visitor
      // clicked out of, which is the one that says which of the two events this
      // was. Reading it after would report every save as a removal.
      if (isBookmarked) bookmarkRemoved(facts)
      else bookmarkAdded(facts)
      toggleBookmark(recording.id)
    },
    [toggleBookmark, recording.id, isBookmarked, facts]
  )

  // A vote records no view. ADR-0007:3 lists the three signals and voting is not
  // among them, because votes already measure interest and having view_count
  // measure it too would measure the same thing twice (ADR-0007:7). One click,
  // one write.
  const handleVoteClick = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()
      toggleVote(recording.id)
      if (isVoted) {
        await decrementVoteCountLocal()
      } else {
        // Only the cast direction. Withdrawing a vote is the same button and a
        // different act, and there is one event name for it — reporting both
        // under `vote_cast` would make a count of it mean nothing.
        voteCast(facts)
        await incrementVoteCountLocal()
      }
    },
    [
      recording.id,
      isVoted,
      toggleVote,
      decrementVoteCountLocal,
      incrementVoteCountLocal,
      facts,
    ]
  )

  // The Source link is the Recording's own address on GitHub (data/recording.ts:30), and
  // ADR-0007:3 counts following it. The stopPropagation is not decoration: the
  // card body opens the Recording, so without it a click here would count twice and
  // push a panel over the tab that is already leaving.
  const handleSourceClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      recordView()
      repoClicked(facts, "grid")
      // Allow the default link behavior
    },
    [recordView, facts]
  )

  // The bar's width as a percentage of the catalogue's top entry, which is what
  // the mock divides by in every variant (Tile.dc.html:112) — not the largest
  // number on screen. The 4% floor is the mock's own, and a denominator of zero
  // or less yields the floor rather than a division by zero.
  const barPct =
    topViewCount > 0
      ? Math.max(4, Math.round((viewCount / topViewCount) * 100))
      : 4

  return (
    // A plain column, gap:10px between the media and the text block — the mock
    // has no card, and the media box is the tile's only bounded object
    // (Tile.dc.html:10). A plain div, for the reason recorded below; there was
    // a `motion.div` here projecting its layout and sliding in on mount, and
    // the slide serialised `initial` into the style attribute during the server
    // render.
    <div
      // No fixed width. A hard 221-pixel width used to sit here, inside a
      // `minmax(0, 1fr)` track, so from `sm` up the card was correct at exactly
      // one viewport width per breakpoint and overlapped its neighbour either
      // side of it — the last card in each row running past the grid, where
      // `overflow-hidden` on the root cut it off. The column-break hint went
      // with it: nothing on the site establishes a multi-column context.
      className="group relative w-full cursor-pointer flex flex-col gap-2.5"
      data-recording-id={recording.id}
      // Out of the tab order (the card is click-opened, not tab-opened) but
      // focusable: Escape returns document.activeElement to this tile through
      // its id (components/recording-overlay.tsx onCloseAutoFocus), and a div
      // needs a tabIndex for .focus() to work at all.
      tabIndex={-1}
      onClick={handleClick}
    >
      <DemoTile
        recording={recording}
        facts={facts}
        onRepoClick={handleSourceClick}
        className="w-full"
      />

      {/* The text block, gap:7px between its rows (Tile.dc.html:44). */}
      <div className="flex flex-col gap-[7px]">
        {/* The card's one keyboard route into the Recording. The card body
            is a div with an onClick — a mouse affordance that no Tab ever
            reaches — so without this the detail view had no keyboard route
            at all.

            A real href, so the Recording can be opened in a new tab, copied
            and crawled; but a plain click is intercepted and handed to
            handleClick, so the headline and the card body do the same thing.
            Letting the <Link> navigate instead would send a keyboard visitor
            to the standalone page while a mouse visitor got the overlay.

            The href alone carries no query string, and cannot: it is rendered
            on the server, where window.location does not exist, so appending
            one would be a hydration mismatch on every card. handleClick reads
            window.location.search at click time instead, which is what keeps
            `?page=2` across an open. A cmd-click therefore opens the
            Recording's own address with no listing state attached — right for
            a new tab, which is not showing the listing.

            No aria-label: the link's name is its visible text. Tailwind
            preflight sets `a { color: inherit; text-decoration: inherit }`, so
            nothing about the heading moves or changes colour.

            The min-height is not decoration: two lines at 14.5×1.32 is 38.3px,
            so reserving 39 keeps a one-line and a two-line caption on the same
            baseline and stops the row below shifting when one wraps. */}
        <h3 className="min-h-[39px] text-[14.5px] font-medium leading-[1.32] tracking-[-0.01em] text-t1 text-pretty">
          {/* The headline is the card's primary link and a keyboard route to the
              detail (the card body's onClick is a mouse affordance). The ring is
              the spec's 3px accent on links — without it a keyboard visitor
              arrives at the caption with no way to tell it is focused (the ring
              the other controls carry, ticket 13 step 8). */}
          <Link
            href={href}
            prefetch={false}
            onClick={handleHeadlineClick}
            className="rounded-[3px] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3"
          >
            {recording.caption}
          </Link>
        </h3>

        {/* The Category label, upper-cased (Tile.dc.html:46,98). */}
        <p className="font-mono text-[9px] tracking-[0.12em] text-t3 uppercase">
          {recording.category}
        </p>

        {/* The Contributor byline, plain text not a link — the profiles live on
            the detail (Detail.dc.html:57-59). When the previous tile shares the
            contributor, the `↳ ` prefix and t3 mark the repeat (Tile.dc.html:108-109). */}
        <p
          className={cn(
            "min-h-[31px] text-xs leading-[1.32] [overflow-wrap:anywhere]",
            repeatsContributor ? "text-t3" : "text-t2"
          )}
        >
          {repeatsContributor ? "↳ " : ""}
          {recording.contributor}
        </p>

        {/* The views row: a 3px track with a fill and the count in tabular
            mono (Tile.dc.html:48-53,110-111). The figure is pinned to en-US —
            an unpinned locale formats differently on the server and in the
            browser, which is a hydration mismatch on 48 numbers. The bar reads
            the same viewCount the figure does, so a click cannot move one
            without the other. */}
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex-1 h-[3px] rounded-[2px] bg-bar-track">
            <div
              className="h-[3px] rounded-[2px] bg-bar-fill"
              style={{ width: `${barPct}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-t3 tabular-nums whitespace-nowrap">
            {viewCount.toLocaleString("en-US")} views
          </span>
        </div>

        {/* The controls row (Tile.dc.html:54-57). The count is inside the vote
            button now, so a bare aria-label would silence it — the label names
            the action and the count together. The save button carries no
            aria-label at all: the visible word is now "Save", and an accessible
            name of "Add Bookmark" over a button that says Save is a WCAG 2.5.3
            failure — its name is the visible text and the state goes on
            aria-pressed. The glyphs are aria-hidden so the accessible names are
            `Vote, 3` / `Unvote, 3` and `Save` / `Saved`.

            The row wraps: the mock is a single line at 208px and up
            (Tile.dc.html:54), but the grid's `md:grid-cols-3` tracks can fall
            to ~118px, below the three controls' combined min-content — the
            `ml-auto` Repo link drops to its own right-aligned line there
            instead of running past the card. */}
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 mt-[3px]">
          <button
            type="button"
            onClick={handleVoteClick}
            aria-pressed={isVoted}
            aria-label={`${isVoted ? "Unvote" : "Vote"}, ${voteCount}`}
            className={cn(
              "flex items-center gap-[5px] font-mono text-[10.5px] px-[9px] py-[6px] rounded-lg border",
              isVoted
                ? "border-acc bg-acc-soft text-acc"
                : "border-line bg-ctrl text-t2 hover:border-line2 hover:text-t1",
              "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
            )}
          >
            <span aria-hidden>▲</span>
            {voteCount}
          </button>

          <button
            type="button"
            onClick={handleBookmarkClick}
            aria-pressed={isBookmarked}
            className={cn(
              "flex items-center gap-[5px] text-[11px] px-[9px] py-[6px] rounded-lg border",
              isBookmarked
                ? "border-acc bg-acc-soft text-acc"
                : "border-line bg-ctrl text-t2",
              "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-2"
            )}
          >
            <span aria-hidden>{isBookmarked ? "◆" : "◇"}</span>
            {isBookmarked ? "Saved" : "Save"}
          </button>

          <a
            href={recording.source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSourceClick}
            className="ml-auto text-[11.5px] font-medium text-acc underline underline-offset-3 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-acc focus-visible:outline-offset-3 focus-visible:rounded-[3px]"
          >
            Repo <span aria-hidden>↗</span>
          </a>
        </div>
      </div>
    </div>
  )
}

// Memoize component to prevent unnecessary re-renders
// Only re-render if props actually change
export const RecordingCard = memo(
  RecordingCardComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.recording.id === nextProps.recording.id &&
      prevProps.isBookmarked === nextProps.isBookmarked &&
      prevProps.isVoted === nextProps.isVoted &&
      prevProps.recording.vote_count === nextProps.recording.vote_count &&
      prevProps.recording.view_count === nextProps.recording.view_count &&
      // A comparator prop it does not name can change without re-rendering the
      // card. topViewCount moves when the 300-second cache revalidates and
      // repeatsContributor moves whenever a sort or filter reorders the grid —
      // either one going stale is a silent wrong render (ticket 07 step 9).
      prevProps.topViewCount === nextProps.topViewCount &&
      prevProps.repeatsContributor === nextProps.repeatsContributor
    )
  }
)

RecordingCard.displayName = "RecordingCard"
