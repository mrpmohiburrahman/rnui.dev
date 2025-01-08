// data/items.ts
import { collection, getDocs } from "firebase/firestore"

import { db } from "@/lib/firebase"

import { accordions } from "./accordions"
import { arcsliders } from "./arcsliders"
import { bottomsheets } from "./bottomsheets"
import { buttons } from "./buttons"
import { carousels } from "./carousels"
import { charts } from "./charts"
import { circular_progress_bars } from "./circular-progress-bars"
import { drop_down } from "./dropdowns"
import { full_apps } from "./fullapps"
import { headers } from "./headers"
import { list } from "./lists"
import { loaders } from "./loaders"
import { misc } from "./misc"
import { onboarding } from "./onboardings"
import { parallaxes } from "./parallaxes"
import { pickers } from "./pickers"
import { sliders } from "./sliders"
import { tabbars } from "./tabbars"

// Existing data types
export type CategoryData = {
  name: string
}

export type LabelData = {
  name: string
}

export type TagData = {
  name: string
}
// Function to fetch items with counts from Firestore
const localItems = [
  ...accordions,
  ...arcsliders,
  ...bottomsheets,
  ...buttons,
  ...carousels,
  ...charts,
  ...circular_progress_bars,
  ...drop_down,
  ...full_apps,
  ...headers,
  ...list,
  ...loaders,
  ...misc,
  ...onboarding,
  ...parallaxes,
  ...pickers,
  ...sliders,
  ...tabbars,
]
export function getUniqueCategories(): string[] {
  const categories = localItems.map((item) => item.category)
  return Array.from(new Set(categories))
}
export function getUniqueAuthors(): string[] {
  const authors = localItems.map((item) => item.author)
  return Array.from(new Set(authors))
}
export type ItemType = {
  id: string
  caption: string
  videoSrc: string
  thumbnailSrc: string
  author: string
  source: string
  twitterId?: string
  linkedInId?: string
  githubId?: string
  category:
    | "Accordions"
    | "Arc Sliders"
    | "Bottom Sheets"
    | "Buttons"
    | "Carousels"
    | "Charts"
    | "Circular Progress Bars"
    | "Drop Down"
    | "Full Apps"
    | "Headers"
    | "List"
    | "Loaders"
    | "Misc"
    | "Onboarding"
    | "Parallaxes"
    | "Pickers"
    | "Sliders"
    | "Tab bars"
  view_count?: number
  vote_count?: number
  created_at?: string
  isNew?: boolean
}

// Determine the collection name based on the environment
const COLLECTION_NAME = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "rnui"

export async function getItemsWithCounts(): Promise<ItemType[]> {
  console.log("🚀 ~ COLLECTION_NAME:", COLLECTION_NAME)
  const countsCollection = collection(db, COLLECTION_NAME)
  const countsSnapshot = await getDocs(countsCollection)

  const countsMap: {
    [key: string]: { view_count: number; vote_count: number }
  } = {}
  // biome-ignore lint/complexity/noForEach: <explanation>
  countsSnapshot.forEach((doc) => {
    countsMap[doc.id] = doc.data() as { view_count: number; vote_count: number }
  })

  // Merge counts into local items
  const itemsWithCounts: ItemType[] = localItems.map((item) => ({
    ...item,
    view_count: countsMap[item.id]?.view_count || 0,
    vote_count: countsMap[item.id]?.vote_count || 0,
  }))

  // Sort items based on created_at in descending order (latest first)
  itemsWithCounts.sort((a, b) => {
    if (!a.created_at && !b.created_at) return 0
    if (!a.created_at) return 1 // a is older or missing, place after b
    if (!b.created_at) return -1 // b is older or missing, place after a

    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()

    return dateB - dateA // Descending order
  })

  // Find the latest date (YYYY-MM-DD)
  const latestDate = itemsWithCounts[0]?.created_at
    ? new Date(itemsWithCounts[0].created_at).toISOString().split("T")[0]
    : ""

  // Add isNew property based on the latest date
  const itemsWithIsNew: ItemType[] = itemsWithCounts.map((item) => ({
    ...item,
    isNew: item.created_at
      ? new Date(item.created_at).toISOString().split("T")[0] === latestDate
      : false,
  }))

  return itemsWithIsNew
}
