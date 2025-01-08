// app/actions/increment-vote-count.ts
"use server"

import { FirebaseError } from "firebase/app"
import { doc, increment, setDoc, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

const COLLECTION_NAME = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "rnui"

export const incrementVoteCount = async (itemId: string) => {
  console.log("🚀 ~ incrementVoteCount ~ itemId:", itemId)
  const voteCountRef = doc(db, COLLECTION_NAME, itemId)
  try {
    await updateDoc(voteCountRef, {
      vote_count: increment(1),
    })
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      if (error.code === "not-found") {
        // If document doesn't exist, create it with vote_count = 1 and view_count = 1
        await setDoc(voteCountRef, { vote_count: 1, view_count: 1 })
      } else {
        console.error("Error updating vote count:", error)
      }
    } else {
      // Handle other types of errors if necessary
      console.error("An unexpected error occurred:", error)
    }
  }
}
