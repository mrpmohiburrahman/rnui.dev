"use client"

import { memo, useCallback, useState } from "react"
import Link from "next/link"
import type { Entry } from "@/data/entry"
import { GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons"
import { motion } from "framer-motion"
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
  trim?: boolean
  entry: Entry
  order: number
  onClick: (entry: Entry) => void
  isBookmarked: boolean
  toggleBookmark: (id: string) => void
  isVoted: boolean
  toggleVote: (id: string) => void
}

const EntryCardComponent: React.FC<EntryCardProps> = ({
  trim,
  entry,
  order,
  onClick,
  isBookmarked,
  toggleBookmark,
  isVoted,
  toggleVote,
}) => {
  const [voteCount, setVoteCount] = useState<number>(entry.vote_count || 0)
  const [viewCount, setViewCount] = useState<number>(entry.view_count || 0)

  const incrementViewCountLocal = useCallback(async () => {
    try {
      await incrementViewCount(entry.id)
      setViewCount((prev) => prev + 1)
    } catch (error) {
      console.error("Error incrementing view count:", error)
    }
  }, [entry.id])

  const decrementVoteCountLocal = useCallback(async () => {
    try {
      await decrementVoteCount(entry.id)
      setVoteCount((prev) => Math.max(prev - 1, 0))
    } catch (error) {
      console.error("Error decrementing vote count:", error)
    }
  }, [entry.id])

  const incrementVoteCountLocal = useCallback(async () => {
    try {
      await incrementVoteCount(entry.id)
      setVoteCount((prev) => prev + 1)
    } catch (error) {
      console.error("Error incrementing vote count:", error)
    }
  }, [entry.id])

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    onClick(entry)
    await incrementViewCountLocal()
  }, [onClick, entry, incrementViewCountLocal])

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

  const handleLinkClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    await incrementViewCountLocal()
    // Allow the default link behavior
  }, [incrementViewCountLocal])

  return (
    <motion.div
      key={`entry-card-${entry.id}-${order}`}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
          {/* Bookmark Button */}
          <button
            type="button"
            onClick={handleBookmarkClick}
            className={cn(
              "absolute top-4 right-4 p-1 bg-white dark:bg-gray-800 rounded-full shadow-md focus:outline-none z-10",
              "transition-opacity duration-200 opacity-10 group-hover:opacity-100",
              "pointer-events-none group-hover:pointer-events-auto",
              isBookmarked && "opacity-100"
            )}
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

          {/* Video */}
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
                {entry.author.substring(0, 30)}
              </MinimalCardTitle>
              <MinimalCardDescription className="text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                {trim ? `${entry.caption.slice(0, 82)}...` : entry.caption}
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
                      aria-label="Twitter Profile"
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
                      aria-label="LinkedIn Profile"
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
                      aria-label="GitHub Profile"
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
                className="text-yellow-500 hover:text-yellow-700 focus:outline-none"
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
    </motion.div>
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

EntryCard.displayName = 'EntryCard'

