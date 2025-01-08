"use server"

import { doc, getDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"

// Determine the collection name based on the environment
const COLLECTION_NAME = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "rnui"
export const getViewCount = async (itemId: string) => {
  const viewCountRef = doc(db, COLLECTION_NAME, itemId)
  const docSnap = await getDoc(viewCountRef)
  if (docSnap.exists()) {
    return docSnap.data().view_count
  }
  return 0
}
