// scripts/measure-demos.ts
//
// Measures every Recording the CDN serves and writes the three numbers the
// Studio Dark mock draws as facts about each one — duration, aspect and hue —
// back into data/*.ts.
//
//   pnpm assets:measure
//
// The script runs once, by hand, and its output is committed. It is not wired
// into build, postbuild or any test: an Asset path names specific bytes and is
// never reused (ADR-0003), so a measurement keyed on an Asset path is
// permanently valid, and re-paying 554 remote reads per deploy for numbers
// that cannot change would be absurd. scripts/generate-posters.ts:19-24 states
// the same rule for Posters. To re-measure a Recording, delete its three
// fields and run again — there is no --force flag for a command run once a
// year.
//
// ffprobe reads each Demo's URL directly, range-requesting the header rather
// than downloading the file, which is what keeps a single probe at about half
// a second even for a 29-second Demo. Hue comes from the Poster through
// lib/poster-hue.ts, which exists because the largest block of pixels on a UI
// Poster is its grey background and "the dominant colour" of that is not the
// colour to glow in.
//
// What is missing and what is new are the same set, so a Recording that
// already carries durationMs is skipped. Failures are named, not counted: a
// single 404 should read as itself, not as "1".

import { execFile } from "node:child_process"
import { readFile, writeFile } from "node:fs/promises"
import { promisify } from "node:util"
import sharp from "sharp"

import { allRecordings } from "../data/catalogue"
import { CATEGORIES, type Category, type CategoryRow } from "../data/categories"
import { dominantHue } from "../lib/poster-hue"

const run = promisify(execFile)

const CONCURRENCY = 8

// Load the environment before anything else, because there is nothing to read
// without it. Same pair of files, same order, as scripts/check-video-codecs.sh.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {}
}

const cdnBase = (process.env.NEXT_PUBLIC_CDN_URL ?? "").replace(/\/+$/, "")
if (!cdnBase) {
  console.error(
    "NEXT_PUBLIC_CDN_URL is not set — cannot measure Assets that only exist on the CDN."
  )
  process.exit(1)
}

// Not getCdnUrl from lib/cdn.ts, deliberately: that module captures the
// variable in a module-scope const, and static imports are evaluated before
// the first statement of this file runs, so it would be initialised with the
// empty string and quietly return relative paths that fetch rejects, 554
// times. One template string is what the codec checker does.
const assetUrl = (path: string) => `${cdnBase}/${path}`

type ProbeResult = {
  durationMs: number
  aspect: number
}

// The sample aspect ratio, as a number, or null when it is absent. It is
// honoured only when it differs from 1 by more than 1% — an encoder's
// 47197:47196 is a rounding artefact, not an anamorphic flag, and putting its
// fifth decimal in the data would be meaningful noise.
function parseSar(sar: string | undefined): number | null {
  if (!sar || sar === "N/A") return null
  const [num, den] = sar.split(":").map(Number)
  if (!num || !den) return null
  return num / den
}

async function probeDemo(demoPath: string): Promise<ProbeResult> {
  const { stdout } = await run(
    "ffprobe",
    [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,sample_aspect_ratio:format=duration",
      "-of",
      "json",
      assetUrl(demoPath),
    ],
    { timeout: 60_000 }
  )

  const parsed = JSON.parse(stdout) as {
    format?: { duration?: string }
    streams?: Array<{
      width?: number
      height?: number
      sample_aspect_ratio?: string
    }>
  }
  const stream = parsed.streams?.[0]
  const width = stream?.width
  const height = stream?.height
  const duration = Number(parsed.format?.duration)

  if (!width || !height || !Number.isFinite(duration)) {
    throw new Error("ffprobe returned no width, height or duration")
  }

  let correctedWidth = width
  const sar = parseSar(stream.sample_aspect_ratio)
  if (sar !== null && Math.abs(sar - 1) > 0.01) {
    correctedWidth = width * sar
  }

  return {
    durationMs: Math.round(duration * 1000),
    aspect: Number((correctedWidth / height).toFixed(4)),
  }
}

// 64px on the long edge is at most 4,096 pixels per Poster, ample for a
// histogram and cheap across 277 decodes. A Poster that decodes fine but has
// no colour returns null, which is not a failure: the tile glows at its
// fallback hue, and `hue` is simply omitted from the data.
async function posterHue(posterPath: string): Promise<number | null> {
  const response = await fetch(assetUrl(posterPath))
  if (!response.ok) {
    throw new Error(`Poster HTTP ${response.status}`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  const { data } = await sharp(bytes)
    .resize(64, 64, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  return dominantHue(data)
}

type Measurement = {
  id: string
  posterPath: string
  category: Category
  durationMs?: number
  aspect?: number
  hue?: number
}

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message.trim() : String(error)

// The line indices of this Poster path's value inside `lines`, every match.
// The field is either one line —
//     posterPath: "thumbnails/…/short.avif",
// — or two, because prettier wraps a long path onto its own line:
//     posterPath:
//       "thumbnails/…/a_really_long_enzo_manuel_mangano_reactiive.avif",
// Only the value line is an anchor: Poster paths are unique (the data suite
// asserts no two Recordings share one), so a value that appears 0 times or
// more than once means the file no longer looks the way this tool expects.
function posterPathValueLines(lines: string[], posterPath: string): number[] {
  const single = `posterPath: "${posterPath}",`
  const wrappedValue = `"${posterPath}",`
  const found: number[] = []
  for (let index = 0; index < lines.length; index++) {
    const trimmed = lines[index].trim()
    if (trimmed === single) found.push(index)
    if (
      trimmed === "posterPath:" &&
      lines[index + 1]?.trim() === wrappedValue
    ) {
      found.push(index + 1)
    }
  }
  return found
}

async function main() {
  const pending = allRecordings.filter(
    (recording) => recording.durationMs === undefined
  )
  const alreadyRecorded = allRecordings.length - pending.length
  const measured: Measurement[] = []
  const failed: string[] = []

  let next = 0
  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (next < pending.length) {
      const recording = pending[next++]
      const measurement: Measurement = {
        id: recording.id,
        posterPath: recording.posterPath,
        category: recording.category,
      }

      // The three fields are independent: a Demo that probes cleanly still
      // gets durationMs and aspect when its Poster 404s, and a Poster with no
      // colour to glow in simply omits `hue` — that is the designed fallback,
      // not a defect, so only real failures go in the list.
      try {
        const probe = await probeDemo(recording.demoPath)
        measurement.durationMs = probe.durationMs
        measurement.aspect = probe.aspect
      } catch (error) {
        failed.push(
          `${recording.id} — ${recording.demoPath} — ${errorMessage(error)}`
        )
      }
      try {
        const hue = await posterHue(recording.posterPath)
        if (hue !== null) measurement.hue = hue
      } catch (error) {
        failed.push(
          `${recording.id} — ${recording.posterPath} — ${errorMessage(error)}`
        )
      }

      measured.push(measurement)
      console.log(`+ ${recording.id}`)
    }
  })
  await Promise.all(workers)

  // Validate every anchor across every file before writing a single byte, so
  // a Recording whose Poster path cannot be found leaves the whole run having
  // written nothing. A textual edit that silently lands in the wrong object is
  // worse than no measurement, and 554 committed lines cannot be reviewed by
  // reading.
  const writes: Array<[string, string]> = []
  const byFile = new Map<CategoryRow["file"], Measurement[]>()
  for (const measurement of measured) {
    const file = CATEGORIES[measurement.category].file
    byFile.set(file, [...(byFile.get(file) ?? []), measurement])
  }

  for (const [file, records] of byFile) {
    const path = `data/${file}.ts`
    let text = await readFile(path, "utf8")

    for (const measurement of records) {
      const lines = text.split("\n")
      const matches = posterPathValueLines(lines, measurement.posterPath)

      if (matches.length !== 1) {
        console.error(
          `posterPath field for ${measurement.id} matched ${matches.length} ` +
            `line(s), expected 1: "${measurement.posterPath}"`
        )
        console.error("No data file was written.")
        process.exit(1)
      }

      const valueIndex = matches[0]
      // The field's indentation lives on its key line; a wrapped path's value
      // sits one level deeper and would indent the new fields wrongly.
      const keyIndex = lines[valueIndex].includes("posterPath:")
        ? valueIndex
        : valueIndex - 1
      const indent = lines[keyIndex].match(/^\s*/)?.[0] ?? ""

      // A prior partial run may already have written some of the fields — a
      // hue with no durationMs, say, when that Demo's probe failed. Any
      // measurement field sitting directly after the Poster path is dropped
      // before inserting fresh ones, so re-measuring never duplicates one.
      const measurementField = /^(durationMs|aspect|hue):/
      let cursor = valueIndex + 1
      while (
        cursor < lines.length &&
        measurementField.test(lines[cursor].trim())
      ) {
        cursor++
      }
      if (cursor > valueIndex + 1) {
        lines.splice(valueIndex + 1, cursor - valueIndex - 1)
      }

      const inserted = [
        measurement.durationMs !== undefined &&
          `${indent}durationMs: ${measurement.durationMs},`,
        measurement.aspect !== undefined &&
          `${indent}aspect: ${measurement.aspect},`,
        measurement.hue !== undefined && `${indent}hue: ${measurement.hue},`,
      ].filter((line): line is string => line !== false)

      lines.splice(valueIndex + 1, 0, ...inserted)
      text = lines.join("\n")
    }

    writes.push([path, text])
  }

  for (const [path, text] of writes) {
    await writeFile(path, text)
  }

  console.log(
    `\n${measured.length} measured, ${alreadyRecorded} already recorded, ${failed.length} failed`
  )

  if (failed.length > 0) {
    console.error("\nMeasurements that failed:")
    for (const line of failed) console.error(`  ${line}`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(errorMessage(error))
  process.exit(1)
})
