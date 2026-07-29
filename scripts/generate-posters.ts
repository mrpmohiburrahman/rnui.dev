// scripts/generate-posters.ts
//
// Writes the Poster for every Demo in Staging that has not got one yet.
//
//   pnpm posters:generate
//
// A Poster is the frame two seconds into its Demo, encoded as AVIF in a single
// ffmpeg pass. There is no JPG step and no separate converter: the catalogue,
// the data suite and the codec checker accept `.avif` and nothing else, so any
// second format on the way there is only a second thing to get wrong. That is
// how the documented command came to produce a file the suite rejected. The AV1
// encoder is in the ffmpeg this repo already requires for `pnpm check:videos`.
//
// Where a Poster belongs is asked of lib/asset-path.ts rather than worked out
// here by swapping an extension, and which Demos exist is asked of the
// catalogue rather than of the filesystem — the same rule the codec checker
// follows, and for the same reason: a walk of an empty public/demo reports
// "nothing to do" just as convincingly as a finished run.
//
// A Poster that already exists is left alone. An Asset path names specific
// bytes and is never reused (ADR-0003), so a re-recorded Demo arrives under a
// new path with no Poster beside it: "what is missing" and "what is new" are
// the same set. That is what keeps the command seconds rather than the minutes
// AVIF would cost over every Demo in the catalogue.

import { execFile } from "node:child_process"
import { access, mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { promisify } from "node:util"

import { allEntries } from "../data/catalogue"
import { posterPathFor, stagingCopy } from "../lib/asset-path"

const run = promisify(execFile)

/**
 * One frame, two seconds in, as a still AVIF.
 *
 * `-crf 30 -cpu-used 6` is the balance the site wants: a Poster stands in for a
 * video on a page that shows dozens at once, so its bytes are on the critical
 * path and its detail is not.
 */
const encodeArgs = (demo: string, poster: string) => [
  "-y",
  "-v",
  "error",
  "-ss",
  "00:00:02",
  "-i",
  demo,
  "-frames:v",
  "1",
  "-c:v",
  "libaom-av1",
  "-still-picture",
  "1",
  "-crf",
  "30",
  "-cpu-used",
  "6",
  poster,
]

const exists = (file: string) =>
  access(file).then(
    () => true,
    () => false
  )

async function main() {
  let written = 0
  let skipped = 0
  const absent: string[] = []
  const failed: string[] = []

  for (const entry of allEntries) {
    // Derived, not read off the Entry: this script's job is to put the Poster
    // where the Asset path module says it goes. The data suite already asserts
    // that every Entry's stored posterPath is that same derivation, so the two
    // cannot quietly differ.
    const demo = stagingCopy(entry.demoPath)
    const poster = stagingCopy(posterPathFor(entry.demoPath))

    if (!(await exists(demo))) {
      absent.push(demo)
      continue
    }
    if (await exists(poster)) {
      skipped++
      continue
    }

    await mkdir(dirname(poster), { recursive: true })
    try {
      await run("ffmpeg", encodeArgs(demo, poster))
      // ffmpeg can exit 0 having written nothing when the seek lands past the
      // end of a Demo shorter than two seconds, and a Poster that is not there
      // is exactly what this command exists to prevent.
      if (!(await exists(poster))) throw new Error("ffmpeg wrote no file")
      console.log(`+ ${poster}`)
      written++
    } catch (error) {
      const message =
        error instanceof Error ? error.message.trim() : String(error)
      failed.push(`${entry.demoPath} — ${message}`)
      console.error(`! ${poster}`)
    }
  }

  console.log(
    `\n${written} written, ${skipped} already present, ` +
      `${absent.length} without a Demo in Staging, ${failed.length} failed`
  )

  // Named, not just counted. The whole point of this command is that following
  // the printed instructions works, and the way it silently does nothing is a
  // Demo dropped one directory name off — `demo/Bottom Sheets/…` rather than
  // `demo/bottomsheets/…`. A count alone reads the same as a finished run. A
  // clone with no Staging copies at all is the normal case, not a mistake, so
  // that one stays a count.
  if (absent.length > 0 && absent.length <= 10) {
    console.log("\nDemos the catalogue references that are not in Staging:")
    for (const demo of absent) console.log(`  ${demo}`)
  }

  if (failed.length > 0) {
    console.error("\nPosters that could not be encoded:")
    for (const line of failed) console.error(`  ${line}`)
    console.error(
      "\nffmpeg needs the libaom-av1 encoder for AVIF (brew install ffmpeg). Rerun after fixing."
    )
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
