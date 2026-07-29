// lib/asset-path.ts
//
// The shape of an Asset path, stated once.
//
// An Asset path is `<prefix>/<Category asset slug>/<filename base><extension>`:
//
//   demo/buttons/split_button_hewad_mubariz.mp4
//   thumbnails/buttons/split_button_hewad_mubariz.avif
//
// It identifies specific bytes rather than a Demo — re-recording a Demo yields
// a new path, and a path is never reused (CONTEXT.md, ADR-0003).
//
// The catalogue tooling reads the rule from here rather than remembering it:
// the publish tool, the path lister, the ingest script and the automated review
// prompt. Two holdouts remain. scripts/check-video-codecs.sh restates the
// staging prefix in shell, deliberately — ADR-0005 says why. And
// scripts/generateThumbnails.ts still builds its own directories; ticket 05
// moves it onto this module when it starts writing AVIF.
//
// tests/data-integrity.test.ts restates the same shape as hand-written patterns
// instead of importing these. That duplication is deliberate and must not be
// merged: a test that takes its expectation from the code under test can no
// longer catch that code being wrong, and those patterns are what caught a
// Category directory containing a space that returned 403 in production. See
// docs/adr/0005-the-data-test-states-the-asset-path-rules-independently.md.
//
// Turning an Asset path into the URL a visitor fetches is a separate job with
// its own ADR (ADR-0001); it stays in lib/cdn.ts.

import { CATEGORIES, type Category } from "@/data/categories"

export const DEMO_PREFIX = "demo"
export const POSTER_PREFIX = "thumbnails"
const DEMO_EXTENSION = ".mp4"
const POSTER_EXTENSION = ".avif"

/** Where a Staging copy sits: an Asset on disk that is not published yet. */
const STAGING_PREFIX = "public"

export const CONTENT_TYPES: Record<string, string> = {
  [DEMO_EXTENSION]: "video/mp4",
  [POSTER_EXTENSION]: "image/avif",
}

/** A Published Asset is written once and never replaced, so it caches forever. */
export const CACHE_CONTROL = "public, max-age=31536000, immutable"

/** The shape in English, for the review prompt that has to describe it. */
// <slug>, not <category>: the directory is the Category's lowercase asset slug,
// and a reviewer told otherwise has less reason to reject demo/Bottom Sheets/…
export const ASSET_PATH_SHAPE =
  `${DEMO_PREFIX}/<slug>/<file>${DEMO_EXTENSION} and ` +
  `${POSTER_PREFIX}/<slug>/<file>${POSTER_EXTENSION}`

/**
 * The filename portion of an Asset path.
 *
 * Anything outside `[a-z0-9]` becomes an underscore, which is what keeps a name
 * like "Michał" from reaching object storage: the path must be printable ASCII
 * or it 404s on a byte-exact host.
 */
export function filenameSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

/** Where the Demo of a Category with this filename base belongs. */
export function demoPathFor(category: Category, base: string): string {
  return `${DEMO_PREFIX}/${CATEGORIES[category].assetSlug}/${base}${DEMO_EXTENSION}`
}

/**
 * Where the Poster of that Demo belongs. Same Category directory, same
 * filename base, different prefix and extension.
 *
 * Throws rather than guessing: a Poster path built from something that is not
 * a Demo path would be published under a key that can never be corrected.
 */
export function posterPathFor(demoPath: string): string {
  if (!demoPath.startsWith(`${DEMO_PREFIX}/`) || !demoPath.endsWith(DEMO_EXTENSION)) {
    throw new Error(
      `not a Demo path, so no Poster can be derived from it: ${demoPath}`
    )
  }
  return (
    POSTER_PREFIX +
    demoPath.slice(DEMO_PREFIX.length, -DEMO_EXTENSION.length) +
    POSTER_EXTENSION
  )
}

/**
 * The Asset paths a run is about, given the fragments a user typed.
 *
 * Substring rather than prefix, so `misc` selects both demo/misc and
 * thumbnails/misc. No fragments means every path. This is the only definition
 * of the rule; the publish tool hands the result to the codec checker rather
 * than passing the fragments along, so nothing re-derives it.
 *
 * Always a new array, never the caller's: the one caller sorts what it gets
 * back, and the list it passes in is the catalogue's own exported array.
 */
export function narrow(paths: string[], fragments: string[]): string[] {
  if (fragments.length === 0) return [...paths]
  return paths.filter((path) => fragments.some((fragment) => path.includes(fragment)))
}

/** The local, unpublished copy of the Asset at this path. */
export function stagingCopy(path: string): string {
  return `${STAGING_PREFIX}/${path}`
}
