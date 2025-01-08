// app/actions/cached_actions.ts
"use server"

// Import statements (you can remove unused imports if necessary)
import "server-only"

import { unstable_cache } from "next/cache"

// Define your data types
type FilterData = {
  categories: string[]
  labels: string[]
  tags: string[]
}

// Mock implementation of getFilters
async function getFilters(): Promise<FilterData> {
  // Simulate asynchronous operation with a delay (optional)
  // await new Promise((resolve) => setTimeout(resolve, 100)) // 100ms delay

  // // Function to extract unique names
  // const unique = (array: string[]) => [...new Set(array)]

  // const categories = unique(
  //   mockCategories.map((item) => item.name).filter(Boolean)
  // )

  // const labels = unique(mockLabels.map((item) => item.name).filter(Boolean))

  // const tags = unique(mockTags.map((item) => item.name).filter(Boolean))

  return { categories: [], labels: [], tags:[] }
}

// Mock implementation of getCachedFilters using unstable_cache
export const getCachedFilters = unstable_cache(
  async (): Promise<FilterData> => {
    const { categories, labels, tags } = await getFilters()
    return { categories, labels, tags }
  },
  ["product-filters"],
  { tags: [`product_filters`], revalidate: 9000 }
)

// Example usage (for testing purposes)
async function displayFilters() {
  const filters = await getCachedFilters()
  console.log("Categories:", filters.categories)
  console.log("Labels:", filters.labels)
  console.log("Tags:", filters.tags)
}

// Call the example usage function
displayFilters()
