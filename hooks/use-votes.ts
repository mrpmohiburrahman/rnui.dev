// hooks/useVotes.ts
"use client"

import { useEffect, useRef, useState } from "react"

import { incrementViewCount } from "@/app/actions/increment-view-count" // Adjust the import path as needed

const VOTED_ITEMS_KEY = "votedItems"

const useVotes = () => {
  const [votedItems, setVotedItems] = useState<string[] | null>(null)
  const isInitialMount = useRef(true)

  // Load voted items from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedVotedItems = localStorage.getItem(VOTED_ITEMS_KEY)
        if (storedVotedItems) {
          const parsedVotedItems = JSON.parse(storedVotedItems)
          if (Array.isArray(parsedVotedItems)) {
            setVotedItems(parsedVotedItems)
          } else {
            console.warn(
              "📄 Stored voted items are not an array. Resetting to empty array."
            )
            setVotedItems([])
          }
        } else {
          console.log(
            "📄 No voted items found in localStorage. Initializing with empty array."
          )
          setVotedItems([])
        }
      } catch (error) {
        console.error("❌ Error parsing voted items from localStorage:", error)
        setVotedItems([])
      }
    }
  }, [])

  // Update localStorage whenever votedItems change, skip initial mount
  useEffect(() => {
    if (votedItems === null) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    try {
      localStorage.setItem(VOTED_ITEMS_KEY, JSON.stringify(votedItems))
      console.log("📁 ~ Voted items updated in localStorage:", votedItems)
    } catch (error) {
      console.error("❌ Failed to update voted items in localStorage:", error)
    }
  }, [votedItems])

  // Vote functions
  const addVote = (id: string) => {
    setVotedItems((prev) => {
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
    setVotedItems((prev) => {
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

  const isVoted = (id: string) => votedItems?.includes(id) || false

  return {
    votedItems,
    toggleVote,
    isVoted,
    addVote,
    removeVote,
  }
}

export default useVotes
