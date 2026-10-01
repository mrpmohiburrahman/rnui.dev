// lib/publication-notice.ts
//
// The message that tells a Contributor their Demo is live (submission-receipt ticket 11,
// wording from ticket 10). It fires from the maintainer's machine rather than from a
// request, so nothing in `app/` imports it: `scripts/notify-submission.ts` is the only
// caller, and the add-recording skill is the only thing that runs that.
//
// **It is the one message here that can be wrong after the fact**, because a Recording can
// be unpublished, renamed, recategorised, or have its Demo replaced while this text sits in
// somebody's inbox. So it claims the event and never the future: no "permanently", no "it
// will stay live", and no count of anything. Ticket 10 is where that is argued.
//
// **Both links, and the pair is deliberate rather than generous.** Measured on 2026-09-25:
// an unknown Recording id answers 404, because `app/recording/[id]/page.tsx` calls
// `notFound()`, while `/products?contributor=` answers 200 and renders a zero panel for a
// name the catalogue does not hold. So the first link is the exact thing and the second is
// the door that still opens, and a message with only one of them is either a link that can
// rot or a list where somebody's work should be.

import { escapeHtml, oneLine } from "@/lib/email-html"
import { IDENTITY_BLOCK_HTML } from "@/lib/sender-identity"

/**
 * The production origin, hard coded on purpose.
 *
 * **Not `defaultUrl` from data/default-url.ts**, even though that constant exists and names
 * the same host. It resolves to `http://localhost:3000` whenever `VERCEL_URL` is unset, and
 * this builder runs from a local shell, so importing it would put localhost links in a
 * stranger's inbox the first time somebody sent a notice outside a Vercel build.
 *
 * `www` rather than the apex because the apex is a redirect: `https://rnui.dev/recording/x`
 * answers 307 to `https://www.rnui.dev/recording/x`, measured 2026-09-25. That also agrees
 * with data/default-url.ts, whose own comment records the apex making every canonical and
 * every `og:` URL a redirect.
 */
export const SITE_ORIGIN = "https://www.rnui.dev"

/** The Recording's own page. 404s if the id ever leaves the catalogue. */
export function recordingUrl(recordingId: string): string {
  return `${SITE_ORIGIN}/recording/${encodeURIComponent(recordingId)}`
}

/**
 * The catalogue filtered to one Contributor. Never 404s.
 *
 * `URLSearchParams` rather than string concatenation, which is the same construction
 * `app/products/page.tsx` uses in its permanent redirect, so a name with a space or a
 * non-Latin character survives the trip.
 */
export function contributorUrl(contributor: string): string {
  return `${SITE_ORIGIN}/products?${new URLSearchParams({ contributor })}`
}

/** Everything the body needs, all of it read from the published row. */
export type PublicationNotice = {
  contributor: string
  caption: string
  category: string
  recordingId: string
}

export function publicationNotice(notice: PublicationNotice): {
  subject: string
  html: string
} {
  // Escaped once and used in both places, so the greeting and the credit cannot diverge.
  const name = escapeHtml(notice.contributor)
  const seeIt = recordingUrl(notice.recordingId)
  const everything = contributorUrl(notice.contributor)

  return {
    // The caption is interpolated, so it is flattened: visitor text with no length limit,
    // and a newline in a header is broken formatting at best. The Contributor's name is
    // not in the subject because they are the recipient.
    subject: `Your Demo is live: ${oneLine(notice.caption)}`,
    // The href is escaped as well as the visible text. Both are built here rather than
    // taken from input, so neither can contain a quote today, and this is the line that
    // keeps that true if the construction ever changes.
    html: `<p>Hello ${name},</p>
<p>Your Demo is live on rnui.dev.</p>
<p>${escapeHtml(notice.caption)} (${escapeHtml(notice.category)})</p>
<p>See it:<br><a href="${escapeHtml(seeIt)}">${escapeHtml(seeIt)}</a></p>
<p>Everything of yours on the site:<br><a href="${escapeHtml(everything)}">${escapeHtml(everything)}</a></p>
<p>Nothing is needed from you.</p>
${IDENTITY_BLOCK_HTML}`,
  }
}
