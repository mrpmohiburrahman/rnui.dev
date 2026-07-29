// hooks/useVotes.ts
"use client"

import { useEffect, useRef, useState } from "react"

import { incrementViewCount } from "@/app/actions/increment-view-count" // Adjust the import path as needed

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
            setVotedEntryIds(parsedVotedEntryIds)
          } else {
            console.warn(
              "📄 Stored voted items are not an array. Resetting to empty array."
            )
            setVotedEntryIds([])
          }
        } else {
          console.log(
            "📄 No voted items found in localStorage. Initializing with empty array."
          )
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
      console.log("📁 ~ Voted items updated in localStorage:", votedEntryIds)
    } catch (error) {
      console.error("❌ Failed to update voted items in localStorage:", error)
    }
  }, [votedEntryIds])

  // Vote functions
  const addVote = (id: string) => {
    setVotedEntryIds((prev) => {
      if (prev && !prev.includes(id)) {
        const updated = [...prev, id]
        console.log(`✅ Vote added: ${id}`, updated)
        return updated
      }
      console.log(`ℹ️ Vote already exists or votes not loaded: ${id}`)
      return prev || []
    })
  }

  const removeVote = (id: string) => {
    setVotedEntryIds((prev) => {
      if (prev?.includes(id)) {
        const updated = prev.filter((voteId) => voteId !== id)
        console.log(`❌ Vote removed: ${id}`, updated)
        return updated
      }
      console.log(`ℹ️ Vote not found or votes not loaded: ${id}`)
      return prev || []
    })
  }

  const toggleVote = (id: string) => {
    incrementViewCount(id) // Increment view count when voting
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
