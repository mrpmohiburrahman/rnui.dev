// lib/submission-consent.ts
//
// What a Contributor agreed to when they sent a Submission, as ordinary
// constants a test can import. Same shape and same reason as
// lib/subscription-consent.ts: the words shown are the thing being evidenced, so
// they live in one file rather than being pasted into the form that displays
// them and the record that stores them.
//
// Deliberately NOT SIGNUP_DISCLOSURE, and not a second sentence on it. The two
// are different requests. A Subscriber hands over an address and is asking to be
// mailed, so their disclosure is a consent *request* under CASL's ECPR s.4 —
// name, mailing address, contact method, and the right to withdraw, all four
// required. A Contributor hands over a Demo and their name and is asking for
// nothing; the consent here is to **store and publish the work**, and no mail is
// sent to them at all (map decision 8). One wording covering both purposes would
// have to be vague enough to be true of each, which is how a disclosure stops
// meaning anything.
//
// Public-submissions ticket 10.

import { PRIVACY_PATH } from "@/lib/sender-identity"

/**
 * The policy as a path. Re-exported rather than spelled again: there is no
 * `/privacy` route, whatever a hand-typed link says, and two spellings is how
 * one of them becomes wrong.
 */
export { PRIVACY_PATH }

/**
 * The disclosure as rendered on /submit, in the two pieces a form needs: the
 * last sentence has to be a real link, and splitting here beats a regex at the
 * render site. SUBMISSION_DISCLOSURE below joins them back, and that joined
 * string is both what the form shows and what every record stores — so what
 * somebody agreed to is provable from the record alone, rather than
 * reconstructed from a guess about which deploy they saw.
 *
 * Three things this wording is deliberately explicit about, because a submitter
 * would otherwise reasonably assume the opposite of each:
 *
 *   * That publication is not guaranteed. A form that merely implies "you are
 *     submitting to the catalogue" has promised something the maintainer never
 *     agreed to.
 *   * What happens to the file when it is not published: deleted within 30 days
 *     (map decision 11). Without this the honest reading is "you now have my work
 *     indefinitely".
 *   * That they should send only work that is theirs. The site publishes under a
 *     real name and links to real profiles, so a submission that is somebody
 *     else's is a copyright problem with a named person attached to it.
 *
 * A fourth was here until 2026-09-25 and was **wrong**: "most Submissions are not
 * published". The maintainer expects to publish most of what arrives, and a
 * disclosure that talks its own catalogue down also reads as a reason not to
 * bother sending anything. What remains is the accurate half — publication is not
 * guaranteed — with no claim about how often it happens.
 */
export const SUBMISSION_DISCLOSURE_BODY =
  `You are sending rnui.dev a Demo, the name to credit it to, an email ` +
  `address, your profile links and a Category. If it is published you will ` +
  `be credited by that name and those links. The email address is used only ` +
  `to reach you about this Submission. Publication is not guaranteed. If ` +
  `yours is not published, the file is deleted within 30 days. Send only ` +
  `work that is yours to send.`

export const SUBMISSION_DISCLOSURE_POLICY_SENTENCE = "See our Privacy Policy."

export const SUBMISSION_DISCLOSURE = `${SUBMISSION_DISCLOSURE_BODY} ${SUBMISSION_DISCLOSURE_POLICY_SENTENCE}`

/**
 * Bump this whenever SUBMISSION_DISCLOSURE changes. Stored beside the disclosure
 * itself, which looks redundant and is not: the string proves the words, the
 * version makes two cohorts comparable without diffing prose. Same rule
 * CONSENT_FORM_VERSION and SIGNUP_DISCLOSURE already document.
 */
export const SUBMISSION_FORM_VERSION = "2026-09-25.2"

/**
 * The consent record, as every Submission stores it.
 *
 * Plain types, not Firestore's. lib/subscription-consent.ts makes the same split
 * against lib/subscription-consent-firestore.ts, and it buys the same thing
 * here: the shape a writer must satisfy and a reader may rely on is testable
 * without a database.
 *
 * `at` is a Date rather than a Firestore Timestamp for that reason; the Firestore
 * adapter converts when it writes.
 */
export type SubmissionConsent = {
  /** SUBMISSION_DISCLOSURE as rendered — the words, not a reference to them. */
  disclosure: string
  /** SUBMISSION_FORM_VERSION at the moment of submission. */
  formVersion: string
  /**
   * The address the Contributor gave, so the maintainer can reach them.
   *
   * Stored rather than only emailed, and the reason is the failure path: if the
   * notification cannot be sent, the object is still in the bucket, and without
   * this the Submission would be an anonymous file nobody can reply to. The
   * record is the durable half; the email is the convenient one.
   */
  email: string
  /**
   * First entry of `x-forwarded-for`, or "unknown" when the header is absent
   * rather than an empty string, so the field always exists. Read the same way
   * app/actions/subscribe-email.ts reads it; `x-forwarded-for` is a list when
   * proxies chain and the client is first.
   */
  ip: string
  at: Date
}
