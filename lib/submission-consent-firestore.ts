// lib/submission-consent-firestore.ts
//
// The Firestore half of a Submission's consent record. Everything Firebase-shaped
// lives here so lib/submission-consent.ts stays an ordinary module a test can
// import — the same split lib/subscription-consent-firestore.ts makes against
// lib/subscription-consent.ts, and lib/counters-firestore.ts against
// lib/counters.ts.
//
// public-submissions tickets 10 and 07. Ticket 10 declared the collection name
// once, so the writer and the rules in firestore.rules cannot drift onto two
// collections and silently stop finding each other's records. Ticket 07 added the
// write itself, which is the reason this module exists rather than merely
// anticipating.

import { doc, setDoc, Timestamp } from "firebase/firestore"

import { db } from "@/lib/firebase"
import type { SubmissionConsent } from "@/lib/submission-consent"

/**
 * The one declaration of the Submission consent collection.
 *
 * Defaults rather than throwing when unset, matching EMAIL_COLLECTION_NAME. But
 * unlike that one, the default here **is** the production name, and that is worth
 * saying plainly: unset, a local run writes consent records into the live
 * `submissions` collection and nothing warns. `.env.local` sets `submissions-dev`;
 * so does `.env.example`.
 *
 * Corrected while wiring ticket 07's write, which is the first thing to act on it.
 * It used to claim the opposite — "the default is NOT the production name" — while
 * naming `submissions` as both the default and what production reads, which cannot
 * both be true.
 */
export const SUBMISSION_COLLECTION_NAME =
  process.env.NEXT_PUBLIC_FIRESTORE_SUBMISSION_COLLECTION || "submissions"

/**
 * Write one Submission's consent record.
 *
 * The document id IS the object key in the private bucket, and that is
 * load-bearing rather than tidy: it is what ties the record to the bytes without
 * a fifth field, and the rule over `submissions` in firestore.rules names four
 * fields and closes the list, so a `key` field could not be stored even if one
 * were wanted. Same trick app/actions/subscribe-email.ts uses — an id needs no
 * schema, and this key never reaches a browser anyway (only the notification
 * email carries it).
 *
 * `at` arrives as a Date because lib/submission-consent.ts is deliberately not
 * Firestore-shaped; converting it is this adapter's whole job.
 *
 * Throws rather than swallowing, and the caller must not treat that as "log and
 * carry on": a Submission whose consent is unevidenced should not stand. That is
 * why a failure here costs the object, unlike lib/resend.ts's deliberate
 * tolerance of a 409 on a duplicate contact.
 */
export async function writeSubmissionConsent(
  submissionId: string,
  consent: SubmissionConsent
): Promise<void> {
  await setDoc(doc(db, SUBMISSION_COLLECTION_NAME, submissionId), {
    disclosure: consent.disclosure,
    formVersion: consent.formVersion,
    ip: consent.ip,
    at: Timestamp.fromDate(consent.at),
  })
}
