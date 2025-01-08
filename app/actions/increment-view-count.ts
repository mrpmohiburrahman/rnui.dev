// app/actions/increment-view-count.ts
"use server"

import { FirebaseError } from "firebase/app"
import { doc, increment, setDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

// Determine the collection name based on the environment
const COLLECTION_NAME = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "rnui"
export const incrementViewCount = async (itemId: string) => {
  console.log("🚀 ~ incrementViewCount ~ incrementViewCount")
  console.log("🚀 ~ COLLECTION_NAME:", COLLECTION_NAME)
  const viewCountRef = doc(db, COLLECTION_NAME, itemId)
  try {
    await updateDoc(viewCountRef, {
      view_count: increment(1),
    })
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      if (error.code === "not-found") {
        // If document doesn't exist, create it with view_count = 1 and vote_count = 0
        await setDoc(viewCountRef, { view_count: 1, vote_count: 0 })
      } else {
        console.error("Error updating view count:", error)
      }
    } else {
      // Handle other types of errors if necessary
      console.error("An unexpected error occurred:", error)
    }
  }
}
