"use client"

import { memo, useCallback, useState } from "react"
import Link from "next/link"
import type { Entry } from "@/data/entry"
import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons"
import { Bookmark, Linkedin, Star } from "lucide-react"

import { cn } from "@/lib/utils"
import Badge from "@/components/badge" // Import the Badge component
import MinimalCard, {
  MinimalCardContent,
  MinimalCardDescription,
  MinimalCardFooter,
  MinimalCardTitle,
} from "@/components/cult/minimal-card"
import { decrementVoteCount } from "@/app/actions/decrement-vote-count"
import { incrementViewCount } from "@/app/actions/increment-view-count"
import { incrementVoteCount } from "@/app/actions/increment-vote-count"

import InteractiveVideo from "./interactive-video"

interface EntryCardProps {
  entry: Entry
  isBookmarked: boolean
  toggleBookmark: (id: string) => void
  isVoted: boolean
  toggleVote: (id: string) => void
}

const EntryCardComponent: React.FC<EntryCardProps> = ({
  entry,
  isBookmarked,
  toggleBookmark,
  isVoted,
  toggleVote,
}) => {
  // The displayed counts follow the Entry, with whatever this visitor has just
  // clicked added on top. They used to be snapshotted into state at mount, so a
  // re-render handed a fresh Entry kept showing the numbers the card happened to
  // mount with.
  const [viewsClicked, setViewsClicked] = useState(0)
  const [votesClicked, setVotesClicked] = useState(0)

  // Counts arriving from the server already include this visitor's clicks, so the
  // additions reset rather than stacking on top of them. Adjusted during render
  // rather than from an effect: an effect paints the stale sum and corrects it on
  // the next tick, and react-hooks/set-state-in-effect rejects it outright.
  const views = entry.view_count ?? 0
  const votes = entry.vote_count ?? 0
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

  const incrementViewCountLocal = useCallback(async () => {
    try {
      await incrementViewCount(entry.id)
      setViewsClicked((n) => n + 1)
    } catch (error) {
      console.error("Error incrementing view count:", error)
    }
  }, [entry.id])

  const decrementVoteCountLocal = useCallback(async () => {
    try {
      await decrementVoteCount(entry.id)
      setVotesClicked((n) => n - 1)
    } catch (error) {
      console.error("Error decrementing vote count:", error)
    }
  }, [entry.id])

  const incrementVoteCountLocal = useCallback(async () => {
    try {
      await incrementVoteCount(entry.id)
      setVotesClicked((n) => n + 1)
    } catch (error) {
      console.error("Error incrementing vote count:", error)
    }
  }, [entry.id])

  // The Entry's address, written once. The headline link needs it as an href and
  // the open needs it with the query string appended, and having those be two
  // separate literals is how one of them ends up carrying the query and the
  // other not.
  const href = `/entry/${entry.id}`

  // The card owns its own address. pushState rather than router.push: the App
  // Router reflects it through usePathname, so the panel opens with no server
  // render and no Firestore read, and Back closes it. At 10–30 opens a session a
  // router.push here would refetch the whole catalogue every time.
  //
  // The query string is carried over rather than dropped. pushState replaces the
  // whole URL, and the grid reads its page count from useSearchParams — so
  // opening an Entry from page 2 collapsed the catalogue behind the tint from 96
  // cards back to 48, then re-expanded it on close.
  //
  // Opening the Entry is not a view. Playing the Demo is, and that fires from the
  // InteractiveVideo below. Opening a card and dismissing it without watching is
  // not a view of anything, and while both fired one watch billed two. The
  // judgement is reversible; it is written here because nothing else records it.
  const handleClick = useCallback(() => {
    window.history.pushState(null, "", `${href}${window.location.search}`)
  }, [href])

  // The headline is a real <a>, so a modified click is the browser's to handle —
  // cmd/ctrl/shift/alt open the Entry in a new tab or window, which is the point
  // of it having an address. Everything else is the same open the card body does,
  // so only one of the two runs: stopPropagation keeps the ancestor from pushing
  // a second entry onto the history stack.
  const handleHeadlineClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      e.preventDefault()
      handleClick()
    },
    [handleClick]
  )

  const handleBookmarkClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleBookmark(entry.id)
  }, [toggleBookmark, entry.id])

  // The only view increment in the vote path. The stored-set toggle used to fire
  // one of its own and two of the three page modules wrapped it to fire a third,
  // so a single click billed two views on the home page and three on the Category
  // listing while the number on screen moved by one.
  const handleVoteClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    await incrementViewCountLocal()
    toggleVote(entry.id)
    if (isVoted) {
      await decrementVoteCountLocal()
    } else {
      await incrementVoteCountLocal()
    }
  }, [entry.id, isVoted, toggleVote, incrementViewCountLocal, decrementVoteCountLocal, incrementVoteCountLocal])

  // Following a profile or source link out still records a view. That is a third
  // interaction, and ticket 10 ruled only on opening versus playing — it is left
  // as it was rather than decided in passing.
  const handleLinkClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    await incrementViewCountLocal()
    // Allow the default link behavior
  }, [incrementViewCountLocal])

  return (
    // A plain div. There was a `motion.div` here, projecting its layout and
    // sliding in on mount. The slide serialised `initial` into the style
    // attribute during the server render, so every card arrived at `opacity: 0`
    // and 277 of them slid up 10px the moment hydration finished. The layout
    // projection ran over all 277 on every sort toggle, for a rare reorder.
    <div
      className="group relative break-inside-avoid w-full sm:w-[221px] cursor-pointer"
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
          {entry.isNew && (
            <Badge variant="success" className="absolute top-4 left-4 z-10">
              New
            </Badge>
          )}

          {/* Video. Playing it is the one interaction on this card that counts as
              a view of the Entry. */}
          <div className="flex-shrink-0 aspect-[9/16] w-full bg-black rounded-t-lg overflow-hidden">
            <InteractiveVideo
              src={entry.demoPath}
              caption={`video demo of ${entry.caption}`}
              poster={entry.posterPath}
              className="w-full h-full object-contain"
              controls
              loop
              incrementViewCount={incrementViewCountLocal}
            />
          </div>

          {/* Card Content */}
          <div className="flex flex-col flex-grow justify-between p-4">
            <div>
              <MinimalCardTitle className="font-semibold mb-1 text-neutral-800 dark:text-neutral-200 text-sm">
                {/* The card's one keyboard route into the Entry. The card body
                    is a div with an onClick — a mouse affordance that no Tab
                    ever reaches — so without this the detail view had no
                    keyboard route at all.

                    A real href, so the Entry can be opened in a new tab, copied
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
                    open. A cmd-click therefore opens the Entry's own address
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
                  {entry.caption}
                </Link>
              </MinimalCardTitle>
              <MinimalCardDescription className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                {entry.author}
              </MinimalCardDescription>
              <MinimalCardContent />
            </div>
            <MinimalCardFooter className="p-0">
              <div className="flex justify-between items-center w-full text-neutral-800 dark:text-neutral-200">
                {/* Left Side: Social Icons */}
                <div className="flex items-center gap-3">
                  {entry.twitterId && (
                    <Link
                      href={`https://twitter.com/${entry.twitterId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-700 transition-colors"
                      aria-label={`${entry.author} on X`}
                      onClick={handleLinkClick}
                    >
                      <TwitterLogoIcon className="w-5 h-5" />
                    </Link>
                  )}

                  {entry.linkedInId && (
                    <Link
                      href={`https://linkedin.com/in/${entry.linkedInId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-900 transition-colors"
                      aria-label={`${entry.author} on LinkedIn`}
                      onClick={handleLinkClick}
                    >
                      <Linkedin size={20} />
                    </Link>
                  )}
                  {entry.githubId && (
                    <Link
                      href={`https://github.com/${entry.githubId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-800 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      aria-label={`${entry.author} on GitHub`}
                      onClick={handleLinkClick}
                    >
                      <GitHubLogoIcon className="w-5 h-5" />
                    </Link>
                  )}
                </div>

                {/* Right Side: Source Link */}
                <div className="flex items-center gap-2">
                  <Link
                    href={entry.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1 tracking-tight text-sm font-semibold"
                    onClick={handleLinkClick}
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
export const EntryCard = memo(EntryCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.isBookmarked === nextProps.isBookmarked &&
    prevProps.isVoted === nextProps.isVoted &&
    prevProps.entry.vote_count === nextProps.entry.vote_count &&
    prevProps.entry.view_count === nextProps.entry.view_count
  )
})

EntryCard.displayName = "EntryCard"
