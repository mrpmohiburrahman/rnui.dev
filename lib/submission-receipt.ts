// lib/submission-receipt.ts
//
// The message that tells a Contributor their Demo arrived (submission-receipt
// ticket 07, wording from ticket 02). The first thing this pipeline ever sends *to*
// a stranger who did not ask to hear from it.
//
// Built here and sent by app/api/submit/route.ts through the same `lib/resend.ts`
// `sendEmail` the notification uses. No new constant, no new address, no change to
// that module: it already sends from `FROM` with `reply_to: REPLY_TO`, and ticket 04
// decided a reply reaching the maintainer is the right outcome rather than a leak.
//
// **The wording is not free to change.** Every sentence below satisfies a constraint
// recorded in ticket 02, and the honest one to be careful with is the either way
// promise: it is keepable because both outcomes produce a message, which means it
// rests on the maintainer actually typing the error message when something goes
// wrong. Dropping the sentence is allowed; adding a promise about publication is not,
// because the disclosure the Contributor agreed to says publication is not
// guaranteed.
//
// **It is transactional and must stay transactional.** No audience, no unsubscribe
// link, no subscription. A Contributor is not a Subscriber, and the Digest has its own
// signup and its own consent.

import { escapeHtml } from "@/lib/email-html"
import { IDENTITY_BLOCK_HTML } from "@/lib/sender-identity"

/**
 * The subject, and there is deliberately no interpolation in it.
 *
 * The notification's subject carries the caption and therefore needs flattening; this
 * one is a constant, so there is nothing a visitor wrote to flatten and no `oneLine`
 * to call. If the caption is ever added here, that changes, and the reason is worth
 * reading twice: it is visitor text with no length limit and it may contain a
 * newline.
 */
const SUBJECT = "We have your Demo"

/** Everything the body needs, and nothing that has to be looked up. */
export type ReceiptNotice = {
  contributor: string
  caption: string
  category: string
}

export function submissionReceipt(notice: ReceiptNotice): {
  subject: string
  html: string
} {
  // Escaped once and used twice, so the greeting and the credit line cannot diverge.
  const name = escapeHtml(notice.contributor)

  return {
    subject: SUBJECT,
    // **No table, and that is a plain text decision rather than a layout one.** Resend
    // generates a text part for an HTML only message by flattening it, and ticket 03
    // measured that flattening as lossy for the notification, whose table runs labels
    // into values. This body is paragraphs of whole sentences, so the flatten reads
    // correctly and no hand written `text` string is worth the `lib/resend.ts` change
    // it would take to send one. The alternative, if Resend's Deliverability Insights
    // ever makes the missing text part matter, is one `text` field on `sendEmail` plus
    // the string below written out by hand.
    html: `<p>Hello ${name},</p>
<p>Your Demo arrived. Thank you for sending it to rnui.dev.</p>
<p>${escapeHtml(notice.caption)} (${escapeHtml(notice.category)})</p>
<p>Every Submission is looked at by hand, and you will hear from us either way: if it is published, and if it is not.</p>
<p>If it is published, you are credited as "${name}" with the profile links you gave. If it is not, the file is deleted within 30 days of arriving.</p>
<p>Nothing is needed from you.</p>
${IDENTITY_BLOCK_HTML}`,
  }
}
