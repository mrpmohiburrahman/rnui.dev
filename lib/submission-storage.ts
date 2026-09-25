// lib/submission-storage.ts
//
// Where a Submission's bytes go, and under what name.
//
// The R2 half of the submit route handler, kept out of it for the same reason
// lib/subscription-consent-firestore.ts is kept out of app/actions/subscribe-email.ts:
// the handler should read as the order of operations, and the storage detail
// should be testable without a request.
//
// public-submissions tickets 07 and 08.

import { ulid } from "ulid"

/**
 * The bucket Submissions land in.
 *
 * A SECOND bucket, not a prefix inside the Assets bucket. Ticket 08 established
 * that public access in R2 is a *bucket-level* setting with no per-prefix
 * exclusion, so a `submissions/` prefix inside `rnui-assets` would have been
 * world-readable at `cdn.rnui.dev` and cached immutable for a year.
 *
 * Defaulted rather than required, matching scripts/open-submission.ts: there is
 * exactly one correct value, and the same name has to appear here and in the
 * command the notification email tells the maintainer to paste.
 *
 * Exported, because the one log line that says an orphan was left has to say which
 * bucket to go looking in.
 */
export function submissionBucket(): string {
  return process.env.R2_SUBMISSIONS_BUCKET ?? "rnui-submissions"
}

export const SUBMISSION_EXTENSION = ".mp4"
export const SUBMISSION_CONTENT_TYPE = "video/mp4"

/**
 * The key a Submission is stored under: a fresh ULID and `.mp4`. No prefix.
 *
 * Ticket 08's scheme. Deliberately not an Asset path, and the difference is the
 * whole reason: an Asset path identifies immutable *published* bytes and is never
 * reused (ADR-0003), whereas a Submission is unreviewed, deletable, and was never
 * published — so it gets freshness rather than identity, which is what the ULID
 * is for. Minted here and never by hand, the same rule `add-recording` step 7
 * gives a Recording's id.
 *
 * A ULID rather than a UUID because its first ten characters are a timestamp: a
 * bucket listing read months later sorts into the order things arrived, and once
 * the 30-day rule has been deleting objects for a while that ordering is the only
 * one left.
 *
 * `at` is a parameter so a test can pin it. Nothing else passes one.
 */
export function submissionKey(at: Date = new Date()): string {
  return `${ulid(at.getTime())}${SUBMISSION_EXTENSION}`
}

/**
 * The key is the object's identity, so a slash inside it is a path separator
 * rather than something to escape, and every other character is.
 *
 * Stated the same way in scripts/open-submission.ts and scripts/publish-assets.ts
 * rather than imported from here, and the duplication is deliberate: those
 * scripts run under `tsx` outside the app's module graph, so importing this file
 * would drag the route handler's dependencies into a CLI. Three copies is three
 * chances to disagree, so this file's test pins the rule.
 */
export function encodeKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/")
}

type R2Target = { url: string; token: string }

/**
 * The object endpoints, Bearer-authenticated.
 *
 * The same REST surface scripts/open-submission.ts reads through, and the reason
 * this file needs no S3 client and no new credential. Cloudflare's *Upload
 * objects* page lists the dashboard, the Workers binding, the S3 API and the CLI
 * — nothing token-authenticated — which reads as though a Vercel route handler
 * would have to sign SigV4 requests with an R2 key pair. It does not. Measured
 * against the live bucket on 2026-09-25: an authenticated PUT returned 200 with
 * the object's key, size and etag, a GET returned the bytes, and a DELETE left
 * the listing empty.
 *
 * Credentials are read per call rather than at import, like RESEND_API_KEY in
 * lib/resend.ts — so a test can import this module without them, and a missing
 * value fails at the request that needed it rather than at module load.
 */
function target(key: string): R2Target {
  const account = process.env.CLOUDFLARE_ACCOUNT_ID
  const token = process.env.CLOUDFLARE_R2_TOKEN
  if (!account || !token) {
    throw new Error(
      "CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_R2_TOKEN are not set — see .env.example"
    )
  }
  const url =
    `https://api.cloudflare.com/client/v4/accounts/${account}` +
    `/r2/buckets/${submissionBucket()}/objects/${encodeKey(key)}`
  return { url, token }
}

/** R2's error bodies are small JSON, but nothing here needs more than a phrase. */
async function detail(res: Response): Promise<string> {
  const text = await res.text().catch(() => "")
  return text.slice(0, 200)
}

/**
 * Write one Submission's bytes.
 *
 * Throws rather than returning a boolean, because the caller's next step does not
 * vary: a Submission that was not stored must not become a consent record, so a
 * boolean would only invite a caller that forgets to check it. lib/resend.ts
 * throws for the same reason.
 */
export async function putSubmission(
  key: string,
  bytes: ArrayBuffer,
  contentType: string = SUBMISSION_CONTENT_TYPE
): Promise<void> {
  const { url, token } = target(key)
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": contentType,
    },
    body: bytes,
  })
  if (!res.ok) {
    throw new Error(`PUT ${key}: HTTP ${res.status} ${await detail(res)}`)
  }
}

/**
 * Remove one object. The only caller is the compensating delete in the route
 * handler, for a Submission whose consent record failed to write.
 *
 * Also throws. The caller must therefore handle its own failure, which is
 * intentional: whether an orphan was cleaned up is worth knowing, and a silent
 * return would make "the lifecycle rule will get it" and "it is already gone"
 * indistinguishable in the logs.
 */
export async function deleteSubmission(key: string): Promise<void> {
  const { url, token } = target(key)
  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(`DELETE ${key}: HTTP ${res.status} ${await detail(res)}`)
  }
}
