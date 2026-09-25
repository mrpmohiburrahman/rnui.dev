// lib/submission-form.ts
//
// What the submission form will and will not accept, as an ordinary function a
// test can import. The page owns the pixels; this owns the rules, so the
// messages a visitor sees are pinned by tests rather than by reading JSX.
//
// Two rules here are load-bearing rather than tidy:
//
//   * **The size check is the first thing that happens.** Browser compression is
//     tens of seconds (21.3s for a 4.46 MB 1080p clip, measured). Starting that
//     and only then refusing the file spends a visitor's time on real work that
//     was never going to be sent.
//   * **A handle is a bare slug or nothing.** `add-recording` step 2b is explicit
//     that a Contributor's handles are bare slugs, never `@`, never a URL, and
//     the reason is downstream: a handle arriving as `@someone` or as a full URL
//     has to be repaired by hand at publish time, and the maintainer cannot know
//     which of the two spellings the person meant.
//
// public-submissions ticket 05.

import { CATEGORIES } from "@/data/categories"

/**
 * The most a Demo may be, and the one place that number is written down.
 *
 * Map decision 3. The map records why it is 5 MB rather than a figure anybody
 * needed: the catalogue's own Demos are 25–83 KB, so this is ~60× the largest
 * Demo ever published. Its real job is bounding what a visitor may hand us, and
 * how much work the browser's compression step is asked to do.
 *
 * Vercel's 4.5 MB request-body ceiling is the *enforcement* behind it, stricter
 * than this, and not raisable from this repo. See the map's Notes.
 */
export const MAX_DEMO_BYTES = 5 * 1024 * 1024

/** What the file picker offers. */
export const DEMO_ACCEPT = "video/*"

/**
 * Where the form posts.
 *
 * Declared once because it appears at both ends, this page, and the route
 * handler at `app/api/submit/route.ts`, and the route's *file path* is the
 * endpoint, so a rename is a two-place edit that nothing type-checks. Same
 * argument as TURNSTILE_FIELD in lib/turnstile-shared.ts.
 */
export const SUBMIT_ENDPOINT = "/api/submit"

export type SubmissionFields = {
  contributor: string
  /**
   * A required address, so the maintainer can reply about this Submission.
   *
   * Required rather than optional, unlike the handles: without one there is no
   * way to tell the person what happened to their work, and asking later means
   * asking the one channel a stranger has already stopped watching.
   */
  email: string
  github: string
  linkedin: string
  twitter: string
  caption: string
  category: string
  source: string
  /** `File.size`, or null when nothing is chosen. */
  fileBytes: number | null
  consent: boolean
}

/**
 * The fields that travel as plain text on the wire.
 *
 * `fileBytes` is excluded because it is not a claim the client makes, it is a
 * property of the uploaded file, which the route handler measures itself. Letting
 * it arrive as a field would mean trusting a number the visitor controls, and
 * that number is the only thing standing between the bucket and a 40 MB phone
 * export.
 */
export type WireField = Exclude<keyof SubmissionFields, "fileBytes">

/**
 * The wire fields whose value is text, so one `onChange` handler can serve them
 * all.
 *
 * Derived from `SubmissionFields` rather than listed, and the derivation is the
 * point: `consent` is a boolean, so it drops out automatically, and a computed
 * key of `WireField` inside a change handler is otherwise perfectly happy to
 * assign a string to it. Nothing catches that, TypeScript accepts
 * `{ ...state, [unionKey]: string }`, so the guard has to come from the type
 * handed to the handler rather than from the assignment.
 */
export type TextWireField = {
  [K in keyof SubmissionFields]: SubmissionFields[K] extends string ? K : never
}[keyof SubmissionFields]

/**
 * The form's field names as they actually appear in the request body, declared
 * once.
 *
 * The client writes these with `body.set(...)` and the route handler reads them
 * with `form.get(...)`, so a name spelled in two places is a name that can be
 * changed at one end and silently stop arriving at the other. That failure is
 * worse than it sounds: `form.get("contributer")` returns null, the rule refuses,
 * and the visitor is told their caption is missing while it sits in the request.
 *
 * Typed `Record<WireField, string>` rather than a bare object so the compiler
 * enforces completeness both ways, adding a field to `SubmissionFields` fails
 * here until it is given a wire name or explicitly excluded above.
 *
 * The values are the keys today. Keeping them as named values is the point: a
 * rename becomes one edit here rather than a search for string literals in two
 * files. Same argument as TURNSTILE_FIELD and SUBMIT_ENDPOINT.
 */
export const SUBMISSION_FIELD: Record<WireField, string> = {
  contributor: "contributor",
  email: "email",
  github: "github",
  linkedin: "linkedin",
  twitter: "twitter",
  caption: "caption",
  category: "category",
  source: "source",
  consent: "consent",
}

/**
 * The Demo itself. A file part rather than a text field, so it is named
 * separately, and it is the one part whose *size* the handler trusts, because
 * the runtime measured the body rather than the visitor describing it.
 */
export const DEMO_FIELD = "demo"

export type SubmissionErrors = Partial<Record<keyof SubmissionFields, string>>

/**
 * A bare slug: letters, digits and hyphens, not starting or ending with a hyphen.
 *
 * Deliberately narrower than "anything without a space". All three handles this
 * form takes use this alphabet, so `@someone`, `https://github.com/someone`,
 * `someone/` and `someone.dev` are refused here rather than stored and repaired
 * later.
 */
const BARE_SLUG = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/

/**
 * The same shape app/actions/subscribe-email.ts accepts, deliberately: two
 * spellings of "is this an address" would eventually disagree, and the one that
 * had drifted would be whichever was edited last.
 *
 * Not an attempt at RFC 5322. The only real test is whether mail sent to it
 * arrives; this exists to catch a typo before it becomes a support conversation.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const MB = 1024 * 1024

function handleError(value: string, label: string): string | undefined {
  const v = value.trim()
  if (!v) return undefined // all three handles are optional
  if (!BARE_SLUG.test(v))
    return `Enter the ${label} handle only, with no @ and no URL.`
  return undefined
}

/**
 * Every message the form can show, keyed by the field it belongs under.
 *
 * An empty object means the submission may proceed. Each message is a complete
 * sentence addressed to the visitor, because it is rendered verbatim beside its
 * field: ticket 05's acceptance asks for a specific message per rule, and a
 * generic "check your input" would satisfy the code without satisfying that.
 */
export function validateSubmission(f: SubmissionFields): SubmissionErrors {
  const errors: SubmissionErrors = {}

  if (!f.contributor.trim()) {
    errors.contributor = "Enter the name to credit this Demo to."
  }
  if (!EMAIL.test(f.email.trim())) {
    errors.email = "Enter an email address so we can reach you."
  }
  if (!f.caption.trim()) {
    errors.caption = "Give the Demo a short caption."
  }
  if (!(f.category in CATEGORIES)) {
    errors.category = "Choose the Category this belongs to."
  }
  if (!/^https?:\/\//.test(f.source.trim())) {
    errors.source = "The source must be a link starting with https://."
  }

  const github = handleError(f.github, "GitHub")
  if (github) errors.github = github
  const linkedin = handleError(f.linkedin, "LinkedIn")
  if (linkedin) errors.linkedin = linkedin
  const twitter = handleError(f.twitter, "X")
  if (twitter) errors.twitter = twitter

  // Both numbers appear in the message on purpose. "Too large" leaves a visitor
  // guessing whether to trim by a second or by half.
  if (f.fileBytes === null) {
    errors.fileBytes = "Choose a Demo to send."
  } else if (f.fileBytes > MAX_DEMO_BYTES) {
    errors.fileBytes = `A Demo can be at most 5 MB. That file is ${(
      f.fileBytes / MB
    ).toFixed(1)} MB. Trim it and try again.`
  }

  if (!f.consent) {
    errors.consent = "Tick the box to confirm this is yours to send."
  }

  return errors
}

/** Whether the form may be submitted. One definition, used by both callers. */
export function hasErrors(errors: SubmissionErrors): boolean {
  return Object.keys(errors).length > 0
}

/**
 * Read a submitted request body back into the shape `validateSubmission` takes.
 *
 * This is what makes "every server-side field validation is repeated" true
 * without a second copy of the rules: the route handler parses, then calls the
 * same `validateSubmission` the browser called. Two validators would be two
 * answers to the same question, and the stricter one would be an accident of
 * which got edited last.
 *
 * Lives beside the field list rather than in the route handler because the two
 * must agree, and this file is the only place that knows both halves.
 *
 * Every value is coerced to a trimmed string, `undefined` included: a missing
 * field becomes `""` and then fails its rule with the same sentence a visitor saw
 * in the browser, rather than throwing a TypeError that reads as a server fault.
 *
 * `consent` arrives as the string `"true"`, not as a checkbox's `"on"`, the
 * client controls what it sends, so an explicit literal beats depending on how a
 * runtime serialises a ticked box. It is required rather than assumed because the
 * record's disclosure claim should correspond to a request that asserted the box,
 * even though a bot can assert it for free.
 */
export function parseSubmissionForm(
  form: FormData,
  fileBytes: number | null
): SubmissionFields {
  const read = (name: string) => {
    const value = form.get(name)
    return typeof value === "string" ? value.trim() : ""
  }

  return {
    contributor: read(SUBMISSION_FIELD.contributor),
    email: read(SUBMISSION_FIELD.email).toLowerCase(),
    github: read(SUBMISSION_FIELD.github),
    linkedin: read(SUBMISSION_FIELD.linkedin),
    twitter: read(SUBMISSION_FIELD.twitter),
    caption: read(SUBMISSION_FIELD.caption),
    category: read(SUBMISSION_FIELD.category),
    source: read(SUBMISSION_FIELD.source),
    fileBytes,
    consent: read(SUBMISSION_FIELD.consent) === "true",
  }
}
