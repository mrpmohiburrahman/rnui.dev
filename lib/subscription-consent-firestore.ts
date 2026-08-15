// lib/subscription-consent-firestore.ts
//
// Double opt-in, wired to the real world. Everything Firebase-shaped and
// Resend-shaped lives here so that lib/subscription-consent.ts stays an ordinary
// module a test can import — the same split lib/counters-firestore.ts makes
// against lib/counters.ts.

import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore"

import { db } from "@/lib/firebase"
import { addContact, ensureAudience } from "@/lib/resend"
import { verifyToken } from "@/lib/subscribe-token"
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
   * The signature is checked BEFORE Firestore is touched. That order is the
   * defence against a planted record: `allow create` on this collection is open
   * — it has to be, because the signup write uses the same public client SDK a
   * browser does — so anyone can write a pending-looking document at an id they
   * chose. They cannot sign one, so it never gets past this line and never
   * reaches `addToAudience`. See lib/subscribe-token.ts.
   *
   * Then a `get` by document id, never a query: a query is a `list`, and no rule
   * can grant `list` only to a client that filtered on the right token, so a
   * listable collection would publish every Subscriber's address.
   */
  async findPending(token) {
    const id = verifyToken(token)
    if (!id) return null
    const found = await getDoc(doc(db, EMAIL_COLLECTION_NAME, id))
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
