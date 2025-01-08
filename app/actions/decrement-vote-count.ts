// app/actions/decrement-vote-count.ts
"use server"

import { FirebaseError } from "firebase/app"
import { doc, increment, setDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

// Determine the collection name based on the environment
const COLLECTION_NAME = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "rnui"
export const decrementVoteCount = async (itemId: string) => {
  console.log("🚀 ~ decrementVoteCount ~ decrementVoteCount")
  const voteCountRef = doc(db, COLLECTION_NAME, itemId)
  try {
    await updateDoc(voteCountRef, {
      vote_count: increment(-1),
    })
  } catch (error: unknown) {
    // Change type to 'unknown'
    if (error instanceof FirebaseError) {
      // Type guard for FirebaseError
      if (error.code === "not-found") {
        // If document doesn't exist, create it with vote_count = 0 and view_count = 0
        await setDoc(voteCountRef, { vote_count: 0, view_count: 0 })
      } else {
        console.error("Error updating vote count:", error)
      }
    } else {
      // Handle other types of errors if necessary
      console.error("An unexpected error occurred:", error)
    }
  }
}
