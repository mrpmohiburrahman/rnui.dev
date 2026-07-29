// hooks/useBookmarks.ts
"use client"

import { useEffect, useRef, useState } from "react"

const BOOKMARKS_KEY = "bookmarkedItems"

const useBookmarks = () => {
  const [bookmarks, setBookmarks] = useState<string[] | null>(null)
  const isInitialMount = useRef(true)

  // Load bookmarks from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const storedBookmarks = localStorage.getItem(BOOKMARKS_KEY)
        if (storedBookmarks) {
          const parsedBookmarks = JSON.parse(storedBookmarks)
          if (Array.isArray(parsedBookmarks)) {
            setBookmarks(parsedBookmarks)
          } else {
            console.warn(
              "📄 Stored bookmarks are not an array. Resetting to empty array."
            )
            setBookmarks([])
          }
        } else {
          setBookmarks([])
        }
      } catch (error) {
        console.error("❌ Error parsing bookmarks from localStorage:", error)
        setBookmarks([])
      }
    }
  }, [])

  // Update localStorage whenever bookmarks change, skip initial mount
  useEffect(() => {
    if (bookmarks === null) return
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks))
    } catch (error) {
      console.error("❌ Failed to update bookmarks in localStorage:", error)
    }
  }, [bookmarks])

  // Bookmark functions
  const addBookmark = (id: string) => {
    setBookmarks((prev) => {
      if (prev && !prev.includes(id)) {
        return [...prev, id]
      }
      return prev || []
    })
  }

  const removeBookmark = (id: string) => {
    setBookmarks((prev) => {
      if (prev?.includes(id)) {
        return prev.filter((bookmarkId) => bookmarkId !== id)
      }
      return prev || []
    })
  }

  const toggleBookmark = (id: string) => {
    if (isBookmarked(id)) {
      removeBookmark(id)
    } else {
      addBookmark(id)
    }
  }

  const isBookmarked = (id: string) => bookmarks?.includes(id) || false

  return {
    bookmarks,
    toggleBookmark,
    isBookmarked,
    addBookmark,
    removeBookmark,
  }
}

export default useBookmarks
