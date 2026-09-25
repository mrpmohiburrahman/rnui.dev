// lib/submission-notification.ts
//
// The email that tells the maintainer a Submission arrived, the whole reason the
// feature exists (public-submissions ticket 09).
//
// The message is BUILT here and SENT by the route handler through the existing
// `lib/resend.ts` `sendEmail`. No new constant, no new address, and no change to
// that module: it already sends from `FROM` with `reply_to: REPLY_TO`, which is
// exactly what this needs.
//
// What it must carry, and why each part is there. An `add-recording` session needs
// the Contributor's name, every handle they supplied, the caption, the Category,
// the source URL and the file size, and it needs the OBJECT KEY and a
// copy-pasteable command, because a presigned URL dies in 7 days while the object
// lives 30 (map decision 12, amended by ticket 04). So the key and the command are
// the durable part, and **no URL is included at all**: a link that works for a week
// and then silently 403s is worse than one that was never offered, and a stale link
// in an inbox is a trap rather than a convenience.

import { escapeHtml, oneLine } from "@/lib/email-html"
import { IDENTITY_BLOCK_HTML } from "@/lib/sender-identity"
import type { SubmissionConsent } from "@/lib/submission-consent"

/** The command ticket 04 established, as scripts/open-submission.ts parses it. */
export const OPEN_COMMAND = "pnpm submissions:open"

/** A size a human reads without doing arithmetic. */
export function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/** Everything the message needs, all of it already in hand at the call site. */
export type SubmissionNotice = {
  contributor: string
  /**
   * Where the maintainer replies. Printed near the top rather than buried, because
   * the whole reason the form asks for it is so this message can be answered.
   */
  email: string
  github: string
  linkedin: string
  twitter: string
  caption: string
  category: string
  source: string
  fileBytes: number
  /** The object key in the private bucket, and the consent record's document id. */
  key: string
  /** For the summary line: the disclosure version, and when it was agreed to. */
  consent: SubmissionConsent
}

export function submissionNotification(notice: SubmissionNotice): {
  subject: string
  html: string
} {
  const row = (label: string, value: string) =>
    `<tr><td style="padding:2px 12px 2px 0;color:#666;white-space:nowrap;vertical-align:top">${escapeHtml(
      label
    )}</td><td style="padding:2px 0">${escapeHtml(value)}</td></tr>`

  // Only the handles that were given. A blank GitHub row would read as "has a
  // GitHub, we just could not read it", which sends the maintainer looking.
  const handles = (
    [
      ["GitHub", notice.github],
      ["LinkedIn", notice.linkedin],
      ["X", notice.twitter],
    ] as const
  ).filter(([, value]) => value.trim())

  return {
    subject: `New Submission: ${oneLine(notice.caption)}, ${oneLine(
      notice.contributor
    )}`,
    html: `<p>A Submission arrived.</p>
<table style="border-collapse:collapse;font-size:14px">
${row("Contributor", notice.contributor)}
${row("Reply to", notice.email)}
${handles.map(([label, value]) => row(label, value)).join("\n")}
${row("Caption", notice.caption)}
${row("Category", notice.category)}
${row("Source", notice.source)}
${row("Demo size", humanSize(notice.fileBytes))}
${row("Consent", `${notice.consent.formVersion}, ${notice.consent.at.toISOString()}`)}
</table>
<p style="font-size:14px">Open it with:</p>
<pre style="background:#f4f4f4;padding:10px;font-size:13px;overflow-x:auto">${escapeHtml(
      `${OPEN_COMMAND} ${notice.key}`
    )}</pre>
<p style="font-size:13px;color:#666">
<code>${escapeHtml(notice.key)}</code> is the object key in the private bucket, and the file
is deleted 30 days after it arrived. No link is included on purpose: a presigned URL
stops working after 7 days, the object lives 30, and a command that still works beats
a link that quietly does not.
</p>
${IDENTITY_BLOCK_HTML}`,
  }
}
