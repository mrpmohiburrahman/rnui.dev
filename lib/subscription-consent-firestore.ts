// lib/subscription-consent-firestore.ts
//
// Double opt-in, wired to the real world. Everything Firebase-shaped and
// Resend-shaped lives here so that lib/subscription-consent.ts stays an ordinary
// module a test can import — the same split lib/counters-firestore.ts makes
// against lib/counters.ts.

import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { addContact, ensureAudience } from "@/lib/resend"
import {
  createConfirmSubscription,
  type ConsentStore,
} from "@/lib/subscription-consent"

/**
 * The one declaration of the signup collection, so the write half
 * (app/actions/subscribe-email.ts) and the confirm half cannot drift onto two
 * different collections and silently stop finding each other's records.
 */
export const EMAIL_COLLECTION_NAME =
  process.env.NEXT_PUBLIC_FIRESTORE_EMAIL_COLLECTION || "emails"

/**
 * Ticket 05 chose the pre-existing `General` audience over inventing a Digest
 * one, and the reason still holds: ticket 08 has not decided who owns
 * "unsubscribed" yet, and naming an audience now would prejudge it.
 */
const AUDIENCE_NAME = "General"

const firestoreConsentStore: ConsentStore = {
  /**
   * A `get` by document id, because the token IS the id — see the note in
   * app/actions/subscribe-email.ts for why that is a security decision and not
   * a shortcut. This is the whole reason the collection never needs to be
   * listable.
   */
  async findPending(token) {
    const found = await getDoc(doc(db, EMAIL_COLLECTION_NAME, token))
    if (!found.exists()) return null
    const data = found.data() as { email?: string; confirmed?: boolean }
    // `confirmed` is the replay guard. The id cannot be deleted the way a token
    // field could be, so a spent link still resolves to a document — it just
    // resolves to one that is already confirmed, and this returns null for it.
    if (data.confirmed || !data.email) return null
    return { id: found.id, email: data.email }
  },

  async confirm(id) {
    await updateDoc(doc(db, EMAIL_COLLECTION_NAME, id), {
      confirmed: true,
      confirmedAt: Timestamp.now(),
    })
  },

  async addToAudience(email) {
    await addContact(await ensureAudience(AUDIENCE_NAME), email)
  },
}

export const confirmSubscription = createConfirmSubscription(
  firestoreConsentStore
)
