// scripts/publish-assets.ts
//
// Turns Staging copies into Published Assets.
//
//   pnpm assets:publish                    publish every Asset the catalogue references
//   pnpm assets:publish accordions         publish only Asset paths containing "accordions"
//   pnpm assets:publish --dry-run          say what would happen, upload nothing
//
// Three things this tool will not do, because each of them is a way to break
// the site quietly rather than loudly:
//
//   1. Upload a Demo browsers cannot decode. The Asset check runs first and a
//      failure aborts before a single byte is written.
//   2. Overwrite a key that already exists. Published Assets are cached for a
//      year as immutable, so replacing bytes under a live path poisons every
//      cache that holds it — for a year, with no purge. See ADR-0003.
//   3. Exit 0 after a partial upload. Every Asset gets a line, and one failure
//      fails the run.
//
// Credentials come from the environment and are never committed:
//   CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_TOKEN (Workers R2 Storage: Edit), R2_BUCKET

import { execFileSync } from "node:child_process"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { extname, join } from "node:path"

import { allAssetPaths } from "../data/catalogue"

const CACHE_CONTROL = "public, max-age=31536000, immutable"
const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".avif": "image/avif",
}
const CONCURRENCY = 6

const account = process.env.CLOUDFLARE_ACCOUNT_ID
const token = process.env.CLOUDFLARE_R2_TOKEN
const bucket = process.env.R2_BUCKET

const args = process.argv.slice(2)
const dryRun = args.includes("--dry-run")
// Substring, not prefix, so `misc` selects both demo/misc and thumbnails/misc.
// This is the only place the narrowing happens. The gate is handed the paths
// this produces rather than the fragments that produced them, so there is no
// second derivation that could select a different set.
const prefixes = args.filter((a) => !a.startsWith("--"))
const selected = (path: string) =>
  prefixes.length === 0 || prefixes.some((p) => path.includes(p))

if (!account || !token || !bucket) {
  console.error(
    "Missing credentials. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_R2_TOKEN and R2_BUCKET."
  )
  process.exit(1)
}

const api = `https://api.cloudflare.com/client/v4/accounts/${account}/r2/buckets/${bucket}`
const auth = { Authorization: `Bearer ${token}` }
const encodeKey = (key: string) => key.split("/").map(encodeURIComponent).join("/")

type Result = { path: string; state: "published" | "already" | "failed"; note?: string; bytes: number }

/**
 * Is this key already published?
 *
 * Asked per object rather than by listing the bucket once, because a listing
 * that silently comes back short would let the PUT below overwrite a live
 * object — and an overwrite is unrecoverable for a year. A HEAD that fails
 * loudly is worth 554 cheap Class B operations.
 */
async function exists(path: string): Promise<boolean> {
  const res = await fetch(`${api}/objects/${encodeKey(path)}`, {
    method: "HEAD",
    headers: auth,
  })
  if (res.status === 200) return true
  if (res.status === 404) return false
  throw new Error(`HEAD ${path}: HTTP ${res.status} — refusing to guess whether it exists`)
}

async function publish(path: string): Promise<Result> {
  const contentType = CONTENT_TYPES[extname(path).toLowerCase()]
  if (!contentType) {
    return { path, state: "failed", note: `no content type for ${extname(path)}`, bytes: 0 }
  }
  let body: Buffer
  try {
    body = await readFile(`public/${path}`)
  } catch {
    return { path, state: "failed", note: "no Staging copy on disk", bytes: 0 }
  }
  if (dryRun) return { path, state: "published", note: "would publish", bytes: body.byteLength }

  const res = await fetch(`${api}/objects/${encodeKey(path)}`, {
    method: "PUT",
    headers: { ...auth, "Content-Type": contentType, "Cache-Control": CACHE_CONTROL },
    body: new Uint8Array(body),
  })
  if (!res.ok) {
    return { path, state: "failed", note: `HTTP ${res.status} ${await res.text()}`.slice(0, 200), bytes: 0 }
  }
  return { path, state: "published", bytes: body.byteLength }
}

async function main() {
  const paths = allAssetPaths.filter(selected).sort()
  if (paths.length === 0) {
    console.error(`No Assets in the catalogue match ${prefixes.join(", ")}.`)
    process.exit(1)
  }

  // The gate. A Demo that browsers cannot decode must never become a Published
  // Asset, and once it is one it cannot be replaced — so this runs first, and a
  // failure means nothing is uploaded at all.
  //
  // The checker is handed the resolved list above, not the fragments the user
  // typed. It used to re-derive the selection itself, in shell, from those same
  // fragments; the two agreed by coincidence and a comment, and a checker that
  // selected fewer paths than the publisher would have passed the gate over
  // Assets nobody inspected. One derivation, so nothing left to diverge — and
  // a narrowed run still demands only the Staging copies it will touch, since
  // that is exactly what this list holds.
  const listDir = mkdtempSync(join(tmpdir(), "rnui-publish-"))
  const listFile = join(listDir, "asset-paths.txt")
  writeFileSync(listFile, paths.join("\n") + "\n")

  console.log(`Checking ${paths.length} Staging copies before publishing anything ...`)
  let checked = true
  try {
    execFileSync("bash", ["scripts/check-video-codecs.sh", "--paths-from", listFile], {
      stdio: "inherit",
    })
  } catch {
    checked = false
  }
  rmSync(listDir, { recursive: true, force: true })
  if (!checked) {
    console.error("\nAsset check failed — nothing was published.")
    process.exit(1)
  }

  console.log(`\n${paths.length} Assets to consider${dryRun ? " (dry run)" : ""}\n`)

  const results: Result[] = []
  const queue = [...paths]
  // ponytail: check-then-put, not an atomic conditional write — the Cloudflare
  // REST API accepts and ignores If-None-Match. The window between the HEAD and
  // the PUT is only a hazard with two concurrent publishers, and this is a
  // manual single-writer command. Move to the S3 endpoint with SigV4 and a real
  // conditional PUT if that ever stops being true.
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      for (let path = queue.shift(); path !== undefined; path = queue.shift()) {
        const result = (await exists(path))
          ? ({ path, state: "already", bytes: 0 } as Result)
          : await publish(path)
        results.push(result)
        const mark = { published: "+", already: "=", failed: "!" }[result.state]
        console.log(`${mark} ${result.path}${result.note ? ` — ${result.note}` : ""}`)
      }
    })
  )

  const count = (state: Result["state"]) => results.filter((r) => r.state === state).length
  const bytes = results.reduce((sum, r) => sum + r.bytes, 0)
  console.log(
    `\n${count("published")} ${dryRun ? "would be published" : "published"} ` +
      `(${(bytes / 1e6).toFixed(1)} MB), ` +
      `${count("already")} already published, ${count("failed")} failed`
  )
  if (count("failed") > 0) {
    console.error("\nPartial upload — rerun to publish what is missing.")
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
