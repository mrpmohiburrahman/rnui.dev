// scripts/open-submission.ts
//
// Fetch one Submission out of the private bucket and write it to disk.
//
//   pnpm submissions:open <key>                 write it here, under its own name
//   pnpm submissions:open <key> --out <dir>     write it into <dir>
//   pnpm submissions:open --list                every Submission still in the bucket
//
// Why a command rather than a link in the notification email: a presigned GET
// expires in at most 7 days (604,800 s) and the object lives 30, so a URL sitting
// in an inbox is dead long before the maintainer gets to it. This has no expiry.
// Public-submissions tickets 04 and 08.
//
// The bucket is private, and it is deliberately NOT an Asset: it is not on
// cdn.rnui.dev and it is not on an r2.dev hostname. Both public routes are off,
// which is the whole reason a second bucket exists rather than a `submissions/`
// prefix — public access in R2 is a bucket-level setting with no per-prefix
// exclusion, so a prefix inside rnui-assets would have been world-readable and
// cached immutable for a year. Verified 2026-09-25 against the live bucket:
// anonymous GET via the r2.dev hostname -> 401, via the S3 endpoint -> 400,
// cdn.rnui.dev/<key> -> 404, authenticated GET -> 200.
//
// Credentials come from the environment and are never committed:
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_TOKEN (Workers R2 Storage: Edit)
//   R2_SUBMISSIONS_BUCKET, optional — see the default below.

import { writeFile } from "node:fs/promises"
import { basename, join } from "node:path"

const account = process.env.CLOUDFLARE_ACCOUNT_ID
const token = process.env.CLOUDFLARE_R2_TOKEN

/**
 * Unlike R2_BUCKET in scripts/publish-assets.ts, this one has a default, and the
 * difference is deliberate rather than sloppy. That script's bucket is a
 * deploy-time choice; this bucket is named once and there is exactly one correct
 * value, and the point of this script is that the command in a notification
 * email can be pasted into a shell without first reading .env. Still overridable
 * for a fork or a staging bucket.
 */
const bucket = process.env.R2_SUBMISSIONS_BUCKET ?? "rnui-submissions"

const args = process.argv.slice(2)
const wantList = args.includes("--list")
const outIndex = args.indexOf("--out")
const outDir = outIndex === -1 ? "." : (args[outIndex + 1] ?? ".")
// Everything that is neither a flag nor the value belonging to `--out`.
// A --out past the end of argv leaves outDir as "." and no key, which the usage
// check below catches.
const positional = args.filter(
  (arg, i) => !arg.startsWith("--") && i !== outIndex + 1
)
const key = positional[0]

if (!account || !token) {
  console.error(
    "Missing credentials. Set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_R2_TOKEN."
  )
  process.exit(1)
}

if (!wantList && !key) {
  console.error(
    "Usage: pnpm submissions:open <key> [--out <dir>]\n" +
      "       pnpm submissions:open --list"
  )
  process.exit(1)
}

const api = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}`
const auth = { Authorization: `Bearer ${token}` }
// The key is the object's identity, so a slash in it is a path separator and
// not something to escape; every other character is. Same rule as
// scripts/publish-assets.ts.
const encodeKey = (k: string) => k.split("/").map(encodeURIComponent).join("/")

type ObjectInfo = { key: string; size?: number; last_modified?: string }

/**
 * Every object in the bucket, paged to the end. A listing that silently came
 * back short would read as "the 30-day rule already cleared it" and send the
 * maintainer looking for a Submission that is still there, so a failed page
 * throws rather than truncating.
 */
async function listSubmissions(): Promise<ObjectInfo[]> {
  const objects: ObjectInfo[] = []
  let cursor: string | undefined
  for (;;) {
    const url =
      `${api}/objects?per_page=1000` +
      (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "")
    const res = await fetch(url, { headers: auth })
    if (!res.ok) {
      throw new Error(`LIST objects: HTTP ${res.status}`)
    }
    const body = (await res.json()) as {
      result: ObjectInfo[]
      result_info?: { cursor?: string; is_truncated?: boolean }
    }
    objects.push(...body.result)
    cursor = body.result_info?.cursor
    if (!body.result_info?.is_truncated) break
  }
  return objects
}

async function openSubmission(k: string): Promise<void> {
  const res = await fetch(`${api}/objects/${encodeKey(k)}`, { headers: auth })
  if (!res.ok) {
    // 404 is the expected failure and it has one overwhelmingly likely cause, so
    // it says so rather than leaving the maintainer to work it out: the object
    // was deleted 30 days after it arrived, and the email is older than that.
    const hint =
      res.status === 404
        ? ` — no such Submission in ${bucket}. The 30-day rule (map decision 11) ` +
          "deletes these; if the notification is older than that, it is gone."
        : ""
    throw new Error(`GET ${k}: HTTP ${res.status}${hint}`)
  }
  const bytes = Buffer.from(await res.arrayBuffer())
  const dest = join(outDir, basename(k))
  await writeFile(dest, bytes)
  console.log(`wrote ${dest} (${(bytes.length / 1024).toFixed(1)} KB)`)
}

async function main(): Promise<void> {
  if (wantList) {
    const objects = await listSubmissions()
    if (objects.length === 0) {
      console.log(`no Submissions in ${bucket} right now`)
      return
    }
    for (const o of objects) {
      console.log(`${o.key}\t${o.size ?? "?"} bytes\t${o.last_modified ?? ""}`)
    }
    return
  }
  await openSubmission(key as string)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
