// lib/digest.ts
//
// The first Digest (notify-and-preview ticket 09). One message, built per recipient
// because one of its sentences is per-recipient.
//
// It is unlike every other email here in three ways, and the ticket argues all three:
//
//   * **It covers the catalogue, not a week.** There was no last Digest, so "added since
//     the last one" has no start. The window is every Recording the catalogue holds, and
//     both its ends are read from `created_at` rather than typed.
//   * **It carries the disclosures the old form never did.** The opening line is ticket
//     04's signup sentence, filled from the recipient's own `createdAt`, which is the line
//     that turns "who is this?" into "oh, right".
//   * **The ask is second, after the content.** Map decision 2 and CAN-SPAM's
//     primary-purpose test both put it there. The section is position-sensitive, and
//     tests/digest.test.ts asserts the position rather than the wording.
//
// **No `{{SIGNUP_DATE}}` token survives to the body.** Ticket 04's footer block carries one
// and this ticket fills it: the sentence is interpolated from `signupDate`, so a literal
// token is impossible by construction. `renderDigest` additionally refuses to return any
// body that still holds a `{{…}}` token other than the unsubscribe URL, so a future edit
// that reintroduces one fails here rather than in somebody's inbox.

import { allRecordings } from "@/data/catalogue"
import type { Recording } from "@/data/recording"

import { escapeHtml } from "@/lib/email-html"
import { IDENTITY_BLOCK_HTML, privacyUrl } from "@/lib/sender-identity"
import { SITE_ORIGIN } from "@/lib/site-origin"

/** Map decision 9: "Newest 6 shown, then 'and N more →'". */
export const DIGEST_ITEM_LIMIT = 6

/**
 * Resend rewrites this per recipient in a *broadcast*, and it is the only unsubscribe link
 * that works today: there is no `/unsubscribe` route in this repo, and a `List-Unsubscribe`
 * header on a per-recipient `/emails` send would need one.
 *
 * That is the tension this message carries, recorded rather than hidden: a broadcast has one
 * HTML for the whole audience, so it cannot fill a per-recipient signup date, while a
 * per-recipient send has no Resend-managed unsubscribe URL. `renderDigest` therefore does not
 * choose — `unsubscribeUrl` is required, and the caller passes this token (a broadcast) or a
 * real address (a per-recipient send with an endpoint that does not exist yet). Ticket 10
 * settles it before anything is sent.
 */
export const UNSUBSCRIBE_TOKEN = "{{{RESEND_UNSUBSCRIBE_URL}}}"

export const SIGNUP_DATE_FALLBACK = "a date we could not read"

export const SIGNUP_DATE_TOKEN = `{{{contact.signup_date|${SIGNUP_DATE_FALLBACK}}}}`

/** The whole catalogue. Never a Contributor-filtered view. */
export function catalogueUrl(): string {
  return `${SITE_ORIGIN}/products`
}

export function digestRecordingUrl(recordingId: string): string {
  return `${SITE_ORIGIN}/recording/${encodeURIComponent(recordingId)}`
}

/**
 * "30 December 2024", never "2024-12-30" and never a locale guess.
 *
 * Read in **UTC** deliberately: a `createdAt` is an instant, and a consent at 23:59 UTC
 * rendered in a negative-offset timezone would slip a day. The date a person read on their
 * own screen is not recoverable anyway, so one fixed reading is the honest one.
 */
export function formatDigestDate(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`cannot read a Digest date from ${JSON.stringify(value)}`)
  }
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date)
}

/**
 * The check ticket 09's acceptance asks for, enforced where every send path must pass.
 *
 * `{{SIGNUP_DATE}}` is already impossible to emit, and this runs on the rendered bytes
 * rather than on the source, so it also catches a token arriving through the identity block
 * or a later template. The unsubscribe URL is the one token allowed to survive: Resend
 * rewrites it per recipient, and a literal URL there would point at nobody.
 */
export function assertNoLeftoverTokens(
  html: string,
  unsubscribeUrl: string,
  allowed: readonly string[] = []
): void {
  let stripped = html.split(unsubscribeUrl).join("")
  for (const token of allowed) stripped = stripped.split(token).join("")
  const leftover = stripped.match(/\{\{[^}]*\}\}/)
  if (leftover) {
    throw new Error(
      `the Digest body still carries ${leftover[0]}. ` +
        `Ticket 04's {{SIGNUP_DATE}} is filled per recipient by renderDigest.`
    )
  }
}

export type DigestContent = {
  /** Newest first, at most DIGEST_ITEM_LIMIT. */
  shown: Recording[]
  /** Distinct Recording ids in the window. A Re-record keeps its id, so it counts once. */
  total: number
  /** `total - shown.length`, never negative. Decision 9's "N more". */
  more: number
  /** ISO `created_at` of the oldest Recording in the window. */
  firstAdded: string
  /** ISO `created_at` of the newest Recording in the window. */
  lastAdded: string
}

function createdAt(recording: Recording): string {
  if (!recording.created_at) {
    // Failing loudly rather than dropping the row: a Digest whose count quietly omits a
    // Recording is the kind of wrong the count exists to prevent.
    throw new Error(`Recording ${recording.id} has no created_at`)
  }
  return recording.created_at
}

/**
 * What the message says about itself: the newest six, how many there are, and the window.
 *
 * Every figure in the subject and the body comes from this one return value, which is why
 * they cannot disagree. The window is the whole catalogue, because the first Digest has no
 * predecessor to measure from; `firstAdded` and `lastAdded` are the catalogue's own ends, so
 * the sentence that names them is checkable against `data/`.
 */
export function digestContent(
  recordings: readonly Recording[] = allRecordings
): DigestContent {
  // Deduplicated by id before anything is counted or sorted: decision 9 counts "genuinely
  // new Recording id", and a Re-record must not become a second row.
  const byId = new Map<string, Recording>()
  for (const recording of recordings) byId.set(recording.id, recording)

  const distinct = [...byId.values()]
  if (distinct.length === 0) {
    // There is no Digest without a Recording (decision 9). Refuse rather than render a
    // message whose count line reads zero.
    throw new Error("the Digest needs at least one Recording")
  }

  for (const recording of distinct) createdAt(recording)

  const sorted = [...distinct].sort(
    (a, b) =>
      // `created_at` desc, then `id` desc: 2026-10-11 is a bulk import whose rows share one
      // timestamp to the millisecond, and without the tie-break the six shown would depend
      // on array order.
      createdAt(b).localeCompare(createdAt(a)) || b.id.localeCompare(a.id)
  )

  const oldest = sorted[sorted.length - 1]
  const newest = sorted[0]
  const shown = sorted.slice(0, DIGEST_ITEM_LIMIT)

  return {
    shown,
    total: sorted.length,
    more: Math.max(0, sorted.length - shown.length),
    firstAdded: createdAt(oldest),
    lastAdded: createdAt(newest),
  }
}

export type DigestOptions = {
  /** The recipient's Firestore `createdAt`, which ticket 03 preserved on every survivor. */
  signupDate: string | Date
  recordings?: readonly Recording[]
  /** Required: see UNSUBSCRIBE_TOKEN for why the renderer will not pick one. */
  unsubscribeUrl: string
}

export type Digest = {
  subject: string
  html: string
  content: DigestContent
}

/**
 * The message.
 *
 * `subject` carries the same total as the body's first paragraph. Nothing here is
 * per-recipient except the signup sentence, which is the point of a per-recipient render.
 */
function renderDigestMessage(
  options: {
    recordings?: readonly Recording[]
    unsubscribeUrl: string
    opening: string
    allowedTokens?: readonly string[]
  }
): Digest {
  const content = digestContent(options.recordings)
  const window =
    `${formatDigestDate(content.firstAdded)} and ` +
    `${formatDigestDate(content.lastAdded)}`

  const rows = content.shown
    .map(
      (recording) =>
        `<li><a href="${escapeHtml(digestRecordingUrl(recording.id))}">` +
        `${escapeHtml(recording.caption)}</a> · ` +
        `${escapeHtml(String(recording.category))} · ` +
        `${escapeHtml(recording.contributor)}</li>`
    )
    .join("\n")

  const more =
    content.more > 0
      ? `<p><a href="${escapeHtml(catalogueUrl())}">and ${content.more} more →</a></p>`
      : ""

  const unsubscribe = escapeHtml(options.unsubscribeUrl)

  const html = `<p>Hello,</p>
<p>${options.opening} This is the first
one, so it covers the whole catalogue rather than a week: ${content.total} Recordings
added between ${window}.</p>
<p>Newest first:</p>
<ul>
${rows}
</ul>
${more}
<p><strong>One more thing, and it is not what this email is for.</strong> The site
was redrawn in October 2026. If a page on rnui.dev is worse than it was, reply to this
email and say which one. I read every reply.</p>
<hr>
${IDENTITY_BLOCK_HTML}
<p style="font-size:13px;color:#666">
A Digest of the Recordings added to the rnui.dev catalogue. No sponsor mail, no
third-party marketing, and your address is never shared.
</p>
<p style="font-size:13px;color:#666">
<a href="${unsubscribe}">Unsubscribe</a> ·
<a href="${escapeHtml(privacyUrl(SITE_ORIGIN))}">Privacy Policy</a>
</p>`

  assertNoLeftoverTokens(
    html,
    options.unsubscribeUrl,
    options.allowedTokens ?? []
  )

  return {
    subject: `The first rnui.dev Digest: ${content.total} Recordings`,
    html,
    content,
  }
}

export function renderDigest(options: DigestOptions): Digest {
  const signupDate = formatDigestDate(options.signupDate)
  return renderDigestMessage({
    recordings: options.recordings,
    unsubscribeUrl: options.unsubscribeUrl,
    opening: `You signed up for the rnui.dev Digest at rnui.dev on ${signupDate}.`,
  })
}

export function renderBroadcastDigest(options: {
  recordings?: readonly Recording[]
  unsubscribeUrl: string
}): Digest {
  return renderDigestMessage({
    recordings: options.recordings,
    unsubscribeUrl: options.unsubscribeUrl,
    opening: `You signed up for the rnui.dev Digest at rnui.dev on ${SIGNUP_DATE_TOKEN}.`,
    allowedTokens: [SIGNUP_DATE_TOKEN],
  })
}

export function renderMaintainerDigest(options: {
  recordings?: readonly Recording[]
  unsubscribeUrl: string
}): Digest {
  return renderDigestMessage({
    recordings: options.recordings,
    unsubscribeUrl: options.unsubscribeUrl,
    opening: "You are receiving this because you run rnui.dev.",
  })
}
