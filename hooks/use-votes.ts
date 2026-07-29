// hooks/useVotes.ts
"use client"

import { useEffect, useRef, useState } from "react"

// This hook is a set of remembered ids and nothing else. It deliberately makes
// no network call: recording a view is the card's job, and while this file also
// did it one vote click billed two views on the home page and three on the
// Category listing.
//
// The stored key keeps its old spelling for the same reason the Firestore field
// names do: it is a record in someone's browser, not an identifier. Renaming it
// would silently discard every vote a visitor has already cast.
const VOTED_ITEMS_KEY = "votedItems"

const useVotes = () => {
  const [votedEntryIds, setVotedEntryIds] = useState<string[] | null>(null)
  const isInitialMount = useRef(true)

  // Load voted items from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedVotedEntryIds = localStorage.getItem(VOTED_ITEMS_KEY)
        if (storedVotedEntryIds) {
          const parsedVotedEntryIds = JSON.parse(storedVotedEntryIds)
          if (Array.isArray(parsedVotedEntryIds)) {
            // Reading localStorage on mount is the only SSR-safe way to hydrate
            // this. A lazy useState initialiser runs on the server too, where
            // there is no localStorage, so the server would render an empty set
            // and the client a full one — a hydration mismatch.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setVotedEntryIds(parsedVotedEntryIds)
          } else {
            console.warn(
              "📄 Stored voted items are not an array. Resetting to empty array."
            )
            setVotedEntryIds([])
          }
        } else {
          setVotedEntryIds([])
        }
      } catch (error) {
        console.error("❌ Error parsing voted items from localStorage:", error)
        setVotedEntryIds([])
      }
    }
  }, [])

  // Update localStorage whenever votedEntryIds change, skip initial mount
  useEffect(() => {
    if (votedEntryIds === null) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    try {
      localStorage.setItem(VOTED_ITEMS_KEY, JSON.stringify(votedEntryIds))
    } catch (error) {
      console.error("❌ Failed to update voted items in localStorage:", error)
    }
  }, [votedEntryIds])

  // Vote functions
  const addVote = (id: string) => {
    setVotedEntryIds((prev) => {
      if (prev && !prev.includes(id)) {
        return [...prev, id]
      }
      return prev || []
    })
  }

  const removeVote = (id: string) => {
    setVotedEntryIds((prev) => {
      if (prev?.includes(id)) {
        return prev.filter((voteId) => voteId !== id)
      }
      return prev || []
    })
  }

  const toggleVote = (id: string) => {
    if (isVoted(id)) {
      removeVote(id)
    } else {
      addVote(id)
    }
  }

  const isVoted = (id: string) => votedEntryIds?.includes(id) || false

  return {
    votedEntryIds,
    toggleVote,
    isVoted,
    addVote,
    removeVote,
  }
}

export default useVotes
