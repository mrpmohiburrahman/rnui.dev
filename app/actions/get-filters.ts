// app/actions/get-filters.ts
"use server"

import "server-only"

// import { createClient } from "@/db/supabase/server"
export async function getFilters() {
  // const db = createClient()
  // const { data: categoriesData, error: categoriesError } = await db
  //   .from("products")
  //   .select("categories")

  // const { data: labelsData, error: labelsError } = await db
  //   .from("products")
  //   .select("labels")

  // const { data: tagsData, error: tagsError } = await db
  //   .from("products")
  //   .select("tags")

  // if (categoriesError || labelsError || tagsError) {
  //   console.error(
  //     "Error fetching filters:",
  //     categoriesError,
  //     labelsError,
  //     tagsError
  //   )
  //   return { categories: [], labels: [], tags: [] }
  // }

  // return {
  //   categories: categoriesData.map((item) => item.categories).filter(Boolean),
  //   labels: labelsData.map((item) => item.labels).filter(Boolean),
  //   tags: tagsData.map((item) => item.tags).filter(Boolean),
  // }
  return {
    categories: [],
    labels: [],
    tags: [],
  }
}
