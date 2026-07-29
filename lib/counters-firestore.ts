// lib/counters-firestore.ts
//
// The counters, backed by Firestore. Everything Firebase-shaped lives here so that
// lib/counters.ts stays an ordinary module a test can import.
import { FirebaseError } from "firebase/app"
import {
  collection,
  doc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
} from "firebase/firestore"

import {
  createCounters,
  type CounterStore,
  type Counts,
  type CountsByEntry,
} from "@/lib/counters"
import { db } from "@/lib/firebase"

/**
 * The one declaration of the collection name in the counter path. It used to be
 * written out separately in each of the four places that touched it.
 */
const COLLECTION_NAME = process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION || "rnui"

// The fallback is the *production* collection, so an unset variable means a local
// run or a preview deploy quietly counting against real numbers. It used to fire
// with nothing to say so; now it says so once, at startup.
if (!process.env.NEXT_PUBLIC_FIRESTORE_COLLECTION) {
  console.warn(
    `NEXT_PUBLIC_FIRESTORE_COLLECTION is not set — counting against "${COLLECTION_NAME}", which is the production collection.`
  )
}

const firestoreCounterStore: CounterStore = {
  async readAll() {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME))

    const counts: CountsByEntry = {}
    snapshot.forEach((counted) => {
      counts[counted.id] = counted.data() as Counts
    })
    return counts
  },

  async addTo(entryId, field, by) {
    try {
      await updateDoc(doc(db, COLLECTION_NAME, entryId), {
        [field]: increment(by),
      })
      return true
    } catch (error) {
      // "not-found" is the one failure a caller can recover from, by creating the
      // document. Everything else — a permission error, an outage — is a real
      // failure and is not disguised as a missing document.
      if (error instanceof FirebaseError && error.code === "not-found") {
        return false
      }
      throw error
    }
  },

  async create(entryId, counts) {
    await setDoc(doc(db, COLLECTION_NAME, entryId), counts)
  },
}

export const counters = createCounters(firestoreCounterStore)
