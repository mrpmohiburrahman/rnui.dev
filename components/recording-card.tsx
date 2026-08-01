"use client"

import { memo, useCallback, useMemo, useState } from "react"
import Link from "next/link"
import type { Recording } from "@/data/recording"
import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons"
import { Bookmark, Linkedin, Star } from "lucide-react"

import {
  bookmarkAdded,
  bookmarkRemoved,
  recordingFacts,
  recordingOpened,
  repoClicked,
  voteCast,
} from "@/lib/analytics"
import { cn } from "@/lib/utils"
import Badge from "@/components/badge" // Import the Badge component
import MinimalCard, {
  MinimalCardContent,
  MinimalCardDescription,
  MinimalCardFooter,
  MinimalCardTitle,
} from "@/components/cult/minimal-card"
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
}

const RecordingCardComponent: React.FC<RecordingCardProps> = ({
  recording,
  isBookmarked,
  toggleBookmark,
  isVoted,
  toggleVote,
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

  // The three profile links count nothing. They point at a person, not at the
  // Recording, so a click on one says nothing about this Recording having been viewed —
  // one page announces the same three links up to 124 times. They still have to
  // stop the click reaching the card, or following a byline would open the panel.
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  return (
    // A plain div. There was a `motion.div` here, projecting its layout and
    // sliding in on mount. The slide serialised `initial` into the style
    // attribute during the server render, so every card arrived at `opacity: 0`
    // and 277 of them slid up 10px the moment hydration finished. The layout
    // projection ran over all 277 on every sort toggle, for a rare reorder.
    <div
      // No fixed width. A hard 221-pixel width used to sit here, inside a
      // `minmax(0, 1fr)` track, so from `sm` up the card was correct at exactly
      // one viewport width per breakpoint and overlapped its neighbour either
      // side of it — the last card in each row running past the grid, where
      // `overflow-hidden` on the root cut it off. The column-break hint went
      // with it: nothing on the site establishes a multi-column context.
      className="group relative w-full cursor-pointer"
      onClick={handleClick}
    >
      <div className="w-full h-full relative">
        <MinimalCard
          className={cn(
            "text-neutral-900 hover:bg-pink-100 dark:text-neutral-100 dark:hover:bg-gray-900",
            "w-full h-full transition-colors duration-200 rounded-lg shadow-elevationLight flex flex-col"
          )}
        >
          {/* Bookmark Button.
              It used to be opacity-10 and pointer-events-none until the card was
              hovered. Neither takes an element out of the tab order, so a keyboard
              visitor landed on a control drawn at 10% that also removed its own
              focus ring; on touch, where there is no hover, it was unreachable
              entirely. It is `absolute`, so showing it at rest moves nothing. */}
          <button
            type="button"
            onClick={handleBookmarkClick}
            className="absolute top-4 right-4 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md z-10"
            aria-label={isBookmarked ? "Remove Bookmark" : "Add Bookmark"}
          >
            {isBookmarked ? (
              <Bookmark className="h-5 w-5 text-blue-500 fill-blue-500" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-500 dark:text-gray-300" />
            )}
          </button>

          {/* "New" Badge */}
          {recording.isNew && (
            <Badge variant="success" className="absolute top-4 left-4 z-10">
              New
            </Badge>
          )}

          {/* The Demo. It autoplays and counts its own view — two seconds of
              actual playback, once per browser session — from inside the
              playback owner, which is why nothing about that is wired here. */}
          <div className="flex-shrink-0 aspect-[9/16] w-full bg-black rounded-t-lg overflow-hidden">
            <DemoTile
              facts={facts}
              demoPath={recording.demoPath}
              caption={`video demo of ${recording.caption}`}
              posterPath={recording.posterPath}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Card Content */}
          <div className="flex flex-col flex-grow justify-between p-4">
            <div>
              <MinimalCardTitle className="font-semibold mb-1 text-neutral-800 dark:text-neutral-200 text-sm">
                {/* The card's one keyboard route into the Recording. The card body
                    is a div with an onClick — a mouse affordance that no Tab
                    ever reaches — so without this the detail view had no
                    keyboard route at all.

                    A real href, so the Recording can be opened in a new tab, copied
                    and crawled; but a plain click is intercepted and handed to
                    handleClick, so the headline and the card body do the same
                    thing. Letting the <Link> navigate instead would send a
                    keyboard visitor to the standalone page while a mouse
                    visitor got the overlay.

                    The href alone carries no query string, and cannot: it is
                    rendered on the server, where window.location does not
                    exist, so appending one would be a hydration mismatch on
                    every card. handleClick reads window.location.search at
                    click time instead, which is what keeps `?page=2` across an
                    open. A cmd-click therefore opens the Recording's own address
                    with no listing state attached — right for a new tab, which
                    is not showing the listing.

                    No aria-label: the link's name is its visible text. Tailwind
                    preflight sets `a { color: inherit; text-decoration: inherit }`,
                    so nothing about the heading moves or changes colour. */}
                <Link
                  href={href}
                  prefetch={false}
                  onClick={handleHeadlineClick}
                >
                  {recording.caption}
                </Link>
              </MinimalCardTitle>
              <MinimalCardDescription className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                {recording.contributor}
              </MinimalCardDescription>
              <MinimalCardContent />
            </div>
            <MinimalCardFooter className="p-0">
              {/* Wraps. Three social icons and the Source link have a
                  129px min-content width, and neither half can shrink — an
                  icon is a fixed 20px and "Source" is a word. That fitted while
                  the card was pinned at 221 pixels; once it became its track,
                  the narrower bands put the content box under 129px and Source
                  ran off the right edge of the card. Wrapping only engages
                  where it did not fit. */}
              <div className="flex flex-wrap gap-y-2 justify-between items-center w-full text-neutral-800 dark:text-neutral-200">
                {/* Left Side: Social Icons */}
                <div className="flex items-center gap-3">
                  {recording.twitterId && (
                    <Link
                      href={`https://twitter.com/${recording.twitterId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-700 transition-colors"
                      aria-label={`${recording.contributor} on X`}
                      onClick={stopPropagation}
                    >
                      <TwitterLogoIcon className="w-5 h-5" />
                    </Link>
                  )}

                  {recording.linkedInId && (
                    <Link
                      href={`https://linkedin.com/in/${recording.linkedInId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-900 transition-colors"
                      aria-label={`${recording.contributor} on LinkedIn`}
                      onClick={stopPropagation}
                    >
                      <Linkedin size={20} />
                    </Link>
                  )}
                  {recording.githubId && (
                    <Link
                      href={`https://github.com/${recording.githubId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      aria-label={`${recording.contributor} on GitHub`}
                      onClick={stopPropagation}
                    >
                      <GitHubLogoIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>

                {/* Right Side: Source Link */}
                <div className="flex items-center gap-2">
                  <Link
                    href={recording.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1 tracking-tight text-sm font-semibold"
                    onClick={handleSourceClick}
                  >
                    Source
                  </Link>
                </div>
              </div>
            </MinimalCardFooter>

            {/* Counts and Vote Button */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Views: {viewCount}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Votes: {voteCount}
              </span>
              <button
                type="button"
                onClick={handleVoteClick}
                className="text-yellow-500 hover:text-yellow-700"
                aria-label={isVoted ? "Unvote" : "Vote"}
              >
                {isVoted ? (
                  <Star className="h-5 w-5 fill-yellow-500" /> // Filled star for voted
                ) : (
                  <Star className="h-5 w-5 stroke-current" /> // Outlined star for not voted
                )}
              </button>
            </div>
          </div>
        </MinimalCard>
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
      prevProps.recording.view_count === nextProps.recording.view_count
    )
  }
)

RecordingCard.displayName = "RecordingCard"
