// lib/outcome-message.ts
//
// The third message, and the only one whose text does not exist until somebody writes it
// (submission-receipt ticket 14, decisions from ticket 13).
//
// Everything around the typed part is fixed, and none of it is a second copy: `FROM`,
// `REPLY_TO` and `IDENTITY_BLOCK_HTML` come from lib/sender-identity.ts exactly as the other
// two messages take them, and the escaping is lib/email-html.ts. What this module adds is the
// scaffold the maintainer would otherwise have to remember under pressure: a greeting that
// names the Submission, paragraphs, and a subject that says which Demo this is about.
//
// **The typed reason is the dangerous input of the three messages**, because it is prose rather
// than a form field and it comes from somebody typing in a hurry. It is escaped before it
// reaches the HTML, and a test fails if that ever stops happening.
//
// It has no sent-log, unlike the publication notice, and ticket 13 records why: a hand-written
// message sent twice is already a deliberate act, and a log would put somebody's prose about
// their own rejected work in a tracked directory of a public repo.

import { escapeHtml, oneLine } from "@/lib/email-html"
import { IDENTITY_BLOCK_HTML } from "@/lib/sender-identity"

export type OutcomeMessageInput = {
  /** Blank when the maintainer does not have the name to hand. The greeting falls back. */
  contributor: string
  /** Which Submission this is about, taken from the notification's own subject. */
  caption: string
  /** The maintainer's words, paragraph per blank line. */
  reason: string
}

export function outcomeMessage(input: OutcomeMessageInput): {
  subject: string
  html: string
} {
  const name = input.contributor.trim()

  const paragraphs = input.reason
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    // Escaped first, then the newlines inside a paragraph become `<br>`: that tag is ours,
    // and escaping after inserting it would turn it into visible text.
    .map(
      (paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`
    )
    .join("\n")

  return {
    // Names the Submission, because this arrives after the two messages that named it and the
    // reader has to know which one is being discussed. Flattened, because the caption is text
    // somebody else wrote and this is a header.
    subject: `About your Demo: ${oneLine(input.caption)}`,
    html: `<p>${name ? `Hello ${escapeHtml(name)},` : "Hello,"}</p>
${paragraphs}
${IDENTITY_BLOCK_HTML}`,
  }
}
