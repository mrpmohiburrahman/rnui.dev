// app/api/submit/route.ts
//
// The server half of /submit: verify the visitor, re-validate the metadata, store
// the Demo, record the consent. A thin delegate over lib/, the shape
// app/actions/increment-view-count.ts and app/actions/subscribe-email.ts
// establish, so this file reads as the order of operations rather than as logic.
//
// **A route handler, not a Server Action, and that is a decision rather than a
// style.** A Server Action's body limit is 1 MB by default, set through
// `experimental.serverActions.bodySizeLimit`; a route handler is bounded by
// Vercel's own 4.5 MB platform wall instead. That number is decision 3's backstop
//, it is what makes the 5 MB cap real, and it lives outside this repo, where no
// deploy can adjust it. Tidying this into an action would move the wall and turn
// the cap into a suggestion.
//
// **What a visitor sees if they somehow exceed 4.5 MB.** Vercel refuses the
// request with HTTP 413 *before this function is invoked*, so none of the code
// below runs and none of it can produce a message. The form's fetch sees
// `res.ok === false`, its `res.json()` fails because the body is not JSON, and it
// falls back to "The submission could not be sent.", which is exactly why ticket
// 06 compresses in the browser instead of relying on this handler to be polite
// about size. The 5 MB cap in `MAX_DEMO_BYTES` is the *stated* limit; 4.5 MB is
// the enforced one, and this repo cannot raise it.
//
// **No rate limiter, on purpose.** Ticket 03 recommended against one and the map
// records why: Vercel Hobby *does* include one WAF rate-limit rule per project
// (not Pro-only since 2025-05-23), so the option exists and was declined. What it
// would not close is the gap that matters, Turnstile already stops blind POSTs
// and replay, and what is left is a solver, which a per-IP rule cannot tell from
// a visitor. Adding one later without this paragraph is how a deliberate decision
// becomes an accident.
//
// public-submissions ticket 07. The two messages that leave this handler are that
// effort's ticket 09 (the notification, to the maintainer) and submission-receipt
// ticket 07 (the receipt, to the Contributor), and the comments at the sends below
// are where both efforts' failure decisions are written down.

import { NextResponse } from "next/server"

import { sendEmail } from "@/lib/resend"
import { CONTACT_EMAIL } from "@/lib/sender-identity"
import {
  SUBMISSION_DISCLOSURE,
  SUBMISSION_FORM_VERSION,
  type SubmissionConsent,
} from "@/lib/submission-consent"
import { writeSubmissionConsent } from "@/lib/submission-consent-firestore"
import {
  DEMO_FIELD,
  hasErrors,
  MAX_DEMO_BYTES,
  parseSubmissionForm,
  validateSubmission,
} from "@/lib/submission-form"
import { submissionNotification } from "@/lib/submission-notification"
import { submissionReceipt } from "@/lib/submission-receipt"
import {
  deleteSubmission,
  putSubmission,
  submissionBucket,
  submissionKey,
} from "@/lib/submission-storage"
import { verifyTurnstile } from "@/lib/turnstile"
import { TURNSTILE_FIELD } from "@/lib/turnstile-shared"

/**
 * What the form renders. Same shape as `SubscribeResult` in
 * app/actions/subscribe-email.ts: `ok` is the branch, and the failure arm always
 * carries a sentence, because the client shows NOT SENT with it, a message-less
 * failure would read to a visitor as a broken form.
 *
 * `notified` is the second fact the form needs, and it is not the same question as
 * `ok`. The Demo is stored and the consent recorded either way, so the Submission
 * succeeded either way; `notified` says whether the maintainer was actually told.
 * submission-receipt ticket 06 decided that this, and not anything about the
 * Contributor's own messages, is what the on screen copy branches on. The reason is
 * in the comment at the send below.
 */
export type SubmitResult =
  | { ok: true; notified: boolean; message?: never }
  | { ok: false; message: string }

/**
 * One sentence for every Turnstile refusal, whatever the reason.
 *
 * The reason is logged, not shown. A visitor can act on exactly one thing here -
 * try again, and naming `hostname-mismatch` or `invalid-input-secret` would tell
 * a prober how the check is configured while telling the visitor nothing. The
 * `not-configured` case is the one that hurts: an unconfigured deploy refuses
 * every submission, so the operator needs the reason in the log (lib/turnstile.ts
 * already logs it) and the visitor must not be handed it instead.
 */
const TURNSTILE_MESSAGE =
  "We could not verify the browser check. Please try again."

function fail(message: string, status: number): NextResponse {
  return NextResponse.json({ ok: false, message } satisfies SubmitResult, {
    status,
  })
}

/**
 * The `demo` part, or null.
 *
 * `FormDataEntryValue` is `File | string`, so this narrows rather than casts and
 * a *text* field that happened to be named `demo` cannot reach `arrayBuffer()`.
 * `instanceof File` would be the obvious check and is the wrong one: `File` is a
 * different constructor across realms, and this module is importable from a test
 * as well as from the server runtime.
 */
function asFile(value: FormDataEntryValue | null): File | null {
  if (!value || typeof value === "string") return null
  return value
}

/**
 * Receive one Submission.
 *
 * The order below is the design, and it is deliberate at each step: the browser
 * check first, the only one whose input is single-use and expires, then the
 * metadata, which is free and refuses most abuse, then the file's declared type,
 * then the bytes, and only then the consent record. A consent record is a claim
 * that something was stored, so it must not be written before there is something
 * for it to describe.
 */
export async function POST(request: Request): Promise<NextResponse> {
  // Read once, the same way app/actions/subscribe-email.ts reads it:
  // `x-forwarded-for` is a list when proxies chain and the client is first.
  // "unknown" rather than "" so the field firestore.rules requires always exists.
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    // A body that is not multipart, a probe, or a client that sent JSON. Not an
    // oversized body: that never reaches this function at all, as the 4.5 MB note
    // at the top of the file explains.
    return fail("That request could not be read. Please try again.", 400)
  }

  const uploaded = asFile(form.get(DEMO_FIELD))

  const verdict = await verifyTurnstile(
    String(form.get(TURNSTILE_FIELD) ?? ""),
    ip
  )
  if (!verdict.ok) {
    console.error(`submit: turnstile refused the request, ${verdict.reason}`)
    return fail(TURNSTILE_MESSAGE, 403)
  }

  // The same validator the browser ran, over the same field names, from
  // parseSubmissionForm. `fileBytes` is measured from the uploaded part rather
  // than read from the body: the runtime sized this body, so the number cannot be
  // whatever a visitor felt like declaring.
  const fields = parseSubmissionForm(form, uploaded?.size ?? null)
  const errors = validateSubmission(fields)
  if (hasErrors(errors)) {
    // The rules' own sentences, joined, rather than one generic refusal. They are
    // written to be read by a visitor, that is why they live in
    // lib/submission-form.ts rather than in the form's JSX, and a probe that
    // sees them learns only what the browser would have said before it sent
    // anything.
    return fail(Object.values(errors).join(" "), 400)
  }
  if (!uploaded) {
    // Unreachable: a null file has already failed the `fileBytes` rule above.
    // This is the compiler being told what validateSubmission has guaranteed.
    return fail("Choose a Demo to send.", 400)
  }

  // `uploaded.type` is the browser's guess from the filename, not a fact about the
  // bytes, a signed Content-Type pins the *declaration* rather than the content,
  // and R2 has no POST-form upload to sign anyway
  // (research/r2-presigned-uploads.md). So this refuses an obviously wrong file
  // and does not pretend to verify the container.
  //
  // That is an acceptable risk *here* and would not be anywhere else: the object
  // is private, is never served to anyone, and a human opens it before any of it
  // can be published.
  if (!uploaded.type.startsWith("video/")) {
    return fail("The Demo has to be a video file.", 400)
  }

  const key = submissionKey()

  let bytes: ArrayBuffer
  try {
    bytes = await uploaded.arrayBuffer()
  } catch (err) {
    console.error("submit: could not read the uploaded file", err)
    return fail("We could not read that file. Please try again.", 500)
  }

  try {
    await putSubmission(key, bytes)
  } catch (err) {
    // Nothing is stored, so nothing is promised: no consent record is written and
    // the visitor is asked to retry rather than told their Submission arrived.
    console.error("submit: storing the Demo failed", err)
    return fail("We could not store your Demo. Please try again.", 500)
  }

  // Built once and used twice, the record stores it and the notification
  // summarises it, so the two cannot end up describing different moments.
  const consent: SubmissionConsent = {
    disclosure: SUBMISSION_DISCLOSURE,
    formVersion: SUBMISSION_FORM_VERSION,
    email: fields.email,
    ip,
    at: new Date(),
  }

  try {
    await writeSubmissionConsent(key, consent)
  } catch (err) {
    // A Submission whose consent is unevidenced must not stand, so the object
    // goes rather than being left as an upload nobody agreed to. The record is
    // also the only thing that would have carried the key anywhere a person can
    // read it, so an orphan here is not merely untidy, it is unopenable.
    console.error("submit: consent record failed, removing the object", err)
    try {
      await deleteSubmission(key)
    } catch (cleanupErr) {
      // This is the one path that leaves an orphan, and it is logged loudly rather
      // than swallowed. The 30-day lifecycle rule on the bucket is the cleanup
      // (map decision 11), it is not a fix, it is a floor.
      console.error(
        `submit: ORPHAN in ${submissionBucket()}, ${key}, ` +
          "the 30-day lifecycle rule is what will remove it",
        cleanupErr
      )
    }
    return fail("We could not record your submission. Please try again.", 500)
  }

  // The notification (public-submissions ticket 09). The receipt follows it, and
  // submission-receipt ticket 07 is where that send lands.
  //
  // **A send failure does not discard the Submission, and that is the decision
  // this comment exists to record.** By the time this line runs the object is in
  // the bucket and the consent is recorded, so both survive a Resend 500: nothing
  // is rolled back, and the visitor is not asked to send their work a second time
  //, retrying would store a duplicate object and write a second consent record
  // for the same Demo, which is worse than a missing email.
  //
  // The object is recoverable, and this is how: `pnpm submissions:open --list`
  // reads the bucket straight from R2 through the same REST path everything else
  // uses, and lists by key with its size and timestamp. An unnotified Submission
  // therefore shows up there as an object the maintainer has no memory of, which is
  // exactly the signal. It has 30 days before the lifecycle rule takes it.
  //
  // **What the visitor is told, which is submission-receipt ticket 06's answer.**
  // The form's success copy may promise only what somebody can keep, and its one
  // promise, that a Contributor hears the outcome either way, is about the outcome
  // message, which the maintainer sends by hand. So the fact that decides the promise is
  // whether the maintainer knows the Submission exists, and that is exactly `notified`.
  // Failing the request instead would be the bigger lie: the work is safely stored, and
  // a second send cannot improve that.
  //
  // **The receipt below goes only when the notification did, and that is the
  // compounding case answered rather than inferred.** The two are separate
  // failures with separate victims, the maintainer and the Contributor, and the map
  // calls the pair its worst case. Two silent failures are survivable and coherent: the
  // object sits in the bucket, the record stands, nobody was told, and nobody was
  // promised anything, so `--list` inside 30 days is the whole of the recovery. What is
  // not survivable is the other order, a receipt with no notification, because the
  // receipt's own wording carries the either-way promise (submission-receipt ticket 02)
  // and would put it in a stranger's inbox on behalf of a maintainer who has no way to
  // know they exist. So the receipt is skipped in that state rather than sent or
  // retried, and the alternative that was rejected is recorded here instead of being
  // left for the next reader to rediscover.
  //
  // **The receipt is last because it is the only step whose failure changes nothing
  // about the other three**, and because there is nothing true for it to say until the
  // object and the consent record exist.
  let notified = true
  try {
    await sendEmail({
      to: CONTACT_EMAIL,
      ...submissionNotification({
        contributor: fields.contributor,
        email: fields.email,
        github: fields.github,
        linkedin: fields.linkedin,
        twitter: fields.twitter,
        caption: fields.caption,
        category: fields.category,
        source: fields.source,
        fileBytes: uploaded.size,
        key,
        consent,
      }),
    })
  } catch (err) {
    notified = false
    console.error(
      `submit: NOTIFICATION FAILED, ${key} is stored, consent is recorded, and ` +
        "nobody has been told. Recover it with `pnpm submissions:open --list` " +
        "(30 days). The receipt is skipped on this path, see the comment above.",
      err
    )
  }

  // The receipt (submission-receipt ticket 07), and now the last thing this handler
  // does. It is the only step that sends to somebody outside rnui.dev, and the address
  // is the one the Contributor typed.
  //
  // **A receipt failure is logged and nothing else happens**, which is ticket 06's
  // second answer: no rollback, no retry, and no change to the screen. With `notified`
  // true the outcome message still arrives, so the promise the copy made is kept
  // whether or not this message reached them. A retry would be the one thing that could
  // break that by delivering a second copy of a message that cannot be unsent.
  if (notified) {
    try {
      await sendEmail({
        to: fields.email,
        ...submissionReceipt({
          contributor: fields.contributor,
          caption: fields.caption,
          category: fields.category,
        }),
      })
    } catch (err) {
      console.error(
        `submit: RECEIPT FAILED for ${key}. The Submission is stored and the ` +
          "maintainer was told, so nothing is lost and nothing is retried: the " +
          "Contributor hears the outcome message instead, which is the promise " +
          "they were given. Re-send by hand from the notification.",
        err
      )
    }
  }

  return NextResponse.json({ ok: true, notified } satisfies SubmitResult)
}
