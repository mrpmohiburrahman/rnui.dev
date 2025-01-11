// app/actions/get-products.ts

"use server"

import "server-only"

import { cache } from "react"
import { getItemsWithCounts, type ItemType } from "@/data/items"

export const getProducts = cache(
  async (
    searchTerm?: string,
    category?: string,
    label?: string,
    tag?: string,
    author?: string
  ): Promise<ItemType[]> => {
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
    //   console.error("Error searching resources:", error)
    //   return []
    // }
    try {
      let filteredItems = await getItemsWithCounts()
      // console.log("🚀 ~ filteredItems:", JSON.stringify(filteredItems))

      // Apply search term filter
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase()
        filteredItems = filteredItems.filter(
          (item) => item.caption.toLowerCase().includes(lowerSearchTerm)
          //  ||  item.description.toLowerCase().includes(lowerSearchTerm)
          // Removed punchline filter
        )
      }

      // Apply category filter
      if (category) {
        filteredItems = filteredItems.filter(
          (item) => item.category.toLowerCase() === category.toLowerCase()
        )
      }

      // Apply category filter
      if (author) {
        filteredItems = filteredItems.filter(
          (item) => item.author.toLowerCase() === author.toLowerCase()
        )
      }
      // Apply label filter
      // if (label) {
      //   filteredItems = filteredItems.filter((item) =>
      //     item.labels.map((l) => l.toLowerCase()).includes(label.toLowerCase())
      //   )
      // }

      // Apply tag filter
      // if (tag) {
      //   filteredItems = filteredItems.filter((item) =>
      //     item.tags.map((t) => t.toLowerCase()).includes(tag.toLowerCase())
      //   )
      // }

      return filteredItems
    } catch (error) {
      console.error("Error filtering products:", error)
      return []
    }
  }
)
