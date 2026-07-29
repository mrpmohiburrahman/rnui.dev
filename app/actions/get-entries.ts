// app/actions/get-entries.ts

"use server"

import "server-only"

import { cache } from "react"
import { getEntriesWithCounts, type Entry } from "@/data/entry"

export const getEntries = cache(
  async (
    searchTerm?: string,
    category?: string,
    label?: string,
    tag?: string,
    author?: string
  ): Promise<Entry[]> => {
    // previous implementation
    // const db = createClient()
    // let query = db.from("products").select("*")

    // if (searchTerm) {
    //   query = query.or(
    //     `codename.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,punchline.ilike.%${searchTerm}%`
    //   )
    // }

    // if (category) {
    //   query = query.eq("categories", category)
    // }

    // if (label) {
    //   query = query.contains("labels", [label])
    // }

    // if (tag) {
    //   query = query.contains("tags", [tag])
    // }

    // const { data, error } = await query

    // if (error) {
    //   return []
    // }
    try {
      let filteredEntries = await getEntriesWithCounts()

      // Apply search term filter
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        filteredEntries = filteredEntries.filter(
          (entry) => entry.caption.toLowerCase().includes(lowerSearchTerm)
          //  ||  entry.description.toLowerCase().includes(lowerSearchTerm)
          // Removed punchline filter
        )
      }

      // Apply category filter
      if (category) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.category.toLowerCase() === category.toLowerCase()
        )
      }

      // Apply category filter
      if (author) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.author.toLowerCase() === author.toLowerCase()
        )
      }
      // Apply label filter
      // if (label) {
      //   filteredEntries = filteredEntries.filter((entry) =>
      //     entry.labels.map((l) => l.toLowerCase()).includes(label.toLowerCase())
      //   )
      // }

      // Apply tag filter
      // if (tag) {
      //   filteredEntries = filteredEntries.filter((entry) =>
      //     entry.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      //   )
      // }

      return filteredEntries
    } catch (error) {
      console.error("Error filtering Entries:", error)
      return []
    }
  }
)
