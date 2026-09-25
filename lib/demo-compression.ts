// lib/demo-compression.ts
//
// The browser compression step, as the parts a test can import: the transcode
// arguments, the memory-filesystem names, and the sentences a refusal shows.
//
// Why this exists at all is decision 4 in `.scratch/public-submissions/map.md`.
// Server-side compression is not a free option anywhere: Cloudflare's free
// Workers get 10 ms of CPU per request, and Vercel's Hobby plan gives 4 CPU-hours
// a month. Neither is close to a transcode. So the browser does it, and only the
// compressed bytes leave the visitor's device.
//
// **What the wait actually costs, measured.** Ticket 02 extrapolated "minutes, not
// seconds"; measured in headless Chrome on 2026-09-25 with the single-threaded
// core, a 4.46 MB 1080p clip took **21.3 seconds** to become 1.43 MB, and a 475 KB
// clip 4.5 seconds to become 200.5 KB. Both exclude the core's first download of
// 10.18 MB. A phone is slower, which is what `COMPRESSION_NOTICE` says.
//
// ## The preset is not `compress-demo.sh`'s, on purpose
//
// Ticket 02 measured that the repo's own published-Demo settings **grow** files:
// `crf 20` sets *quality*, not size, and it is tuned for visually-lossless
// *published* Demos, which is the opposite of what an intake step wants. So this
// value is retuned and measured. Same method as ticket 02, local ffmpeg, the
// transcode args otherwise identical:
//
//   1080p high-motion, 4.46 MB in:
//     crf 20  preset slow      4.52 MB   (+1.3%, the growth ticket 02 found)
//     crf 26  preset veryfast  2.03 MB   (-54%)
//     crf 28  preset veryfast  1.44 MB   (-68%)
//     crf 30  preset veryfast  1.12 MB   (-75%)
//
//   a real published Demo (public/demo/accordions/accordion_william_candillon.mp4,
//   436x930, 235.0 KB in):
//     crf 20  preset slow      246.1 KB  (+4.7%)
//     crf 28  preset veryfast  102.1 KB  (-57%)
//
// `crf 28` is the value chosen. It more than halves even footage that was already
// compressed and it never grew anything measured, which matters because this step
// is not allowed to send a *larger* file than the visitor chose. `crf 30` is
// smaller again and is the next step down if review legibility proves more than
// enough.
//
// **What this costs, stated rather than hidden:** the file that reaches the
// maintainer is the crf 28 output, so the Demo eventually published derives from
// it and the intake loss is compounded by the publish-time transcode. That is
// inherent to decision 4 rather than a property of this value. It is acceptable
// here because the intake step targets *review* quality, not the published asset.
//
// ## The `ffprobe` divergence
//
// `compress-demo.sh` ends by running `ffprobe` over its own output and refusing
// anything that is not `h264`. There is no `ffprobe` in the WASM build, so the
// check has no equivalent and is simply absent. What stands in for it is the
// next best thing this side of the wire: the route handler re-validates every
// field, and the maintainer's `add-recording` run re-transcodes the file anyway,
// which fails loudly on a file that will not decode. Do not read this as the
// check having been ported.
//
// public-submissions ticket 06.

/**
 * The quality target. Deliberately not `compress-demo.sh`'s 20, and the numbers
 * in this file's header are why. Lower is larger and better; 28 is the size end.
 */
export const COMPRESSION_CRF = 28

/**
 * The speed/compression tradeoff. `veryfast` rather than the script's `slow`
 * because the visitor is waiting on a single-threaded WASM build: at this CRF the
 * size difference between the presets is small and the time difference is not.
 */
export const COMPRESSION_PRESET = "veryfast"

/**
 * Where the WASM core is fetched from, and why it is not our own CDN.
 *
 * `@ffmpeg/util`'s `toBlobURL` fetches each part and rewraps it as a same-origin
 * blob URL, because the worker cannot import cross-origin. **That fetch is
 * subject to CORS**, so the source must send `Access-Control-Allow-Origin`.
 * Measured 2026-09-25 with `Origin: https://www.rnui.dev`:
 *
 *   cdn.jsdelivr.net  -> `access-control-allow-origin: *`, `immutable`, 1 year
 *   unpkg.com         -> `access-control-allow-origin: *`, 1 year
 *   cdn.rnui.dev      -> **no ACAO at all** (every Demo, `immutable`, 1 year)
 *
 * So the R2 bucket this repo already owns cannot serve the core, even though it
 * is the lower-risk source on every other axis. jsDelivr is used instead, pinned
 * to the exact version so the bytes are immutable, which is the same guarantee
 * `docs/r2-setup.md` gives for Demos.
 *
 * **Nothing here is fetched by a catalogue visitor.** The core is 10.18 MB
 * gzipped, and it is requested only when a visitor picks a Demo to compress (see
 * `lib/demo-compression-runner.ts`), never on page load.
 */
export const FFMPEG_CORE_BASE =
  "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd"

/**
 * Where the compressed Demo is written inside ffmpeg's in-memory filesystem.
 *
 * A fixed name rather than the visitor's, because the MEMFS is private to this
 * one transcode and a name derived from a filename is one more thing to sanitise.
 * The extension is `.mp4` because that is what the arguments produce.
 */
export const COMPRESSION_OUTPUT_NAME = "out.mp4"

/**
 * The filename the compressed Demo travels under.
 *
 * Multipart requires a filename, the route checks only that the part's declared
 * type starts with `video/`, and the stored key is a ULID, so this is read by
 * nobody downstream. A fixed name beats one derived from a stranger's.
 */
export const COMPRESSED_DEMO_NAME = "demo.mp4"

/**
 * The name the visitor's file is written under inside MEMFS.
 *
 * Only the extension is kept, sanitised: `fetchFile` hands ffmpeg the bytes and
 * ffmpeg sniffs the container, but it still needs *an* extension to write to, and
 * a filename from a stranger is not something to interpolate into an argument.
 * An unrecognisable extension falls back to `.mp4`, which is what most phone
 * exports are anyway.
 */
export function memfsInputName(originalName: string): string {
  const dot = originalName.lastIndexOf(".")
  const raw = dot === -1 ? "" : originalName.slice(dot + 1).toLowerCase()
  const ext = raw.replace(/[^a-z0-9]/g, "").slice(0, 5)
  return `in.${ext || "mp4"}`
}

/**
 * The transcode, mapping 1:1 onto `compress-demo.sh`'s ffmpeg call except its
 * `ffprobe` check (see the header) and the two retuned values.
 *
 * `yuv420p` because Chrome refuses `yuv444`. The even-dimension scale because
 * x264 aborts on the odd heights screen crops produce. `+faststart` so the CDN
 * can stream the first frame before the download finishes. AAC audio kept when
 * present, harmless when absent.
 */
export function buildCompressArgs(
  inputName: string,
  outputName: string = COMPRESSION_OUTPUT_NAME
): string[] {
  return [
    "-i",
    inputName,
    "-c:v",
    "libx264",
    "-crf",
    String(COMPRESSION_CRF),
    "-preset",
    COMPRESSION_PRESET,
    "-pix_fmt",
    "yuv420p",
    "-vf",
    "scale=trunc(iw/2)*2:trunc(ih/2)*2",
    "-movflags",
    "+faststart",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    outputName,
  ]
}

/**
 * Whether a transcode earned its place.
 *
 * The step may not hand the pipeline a file larger than the one the visitor
 * chose: that would spend a stranger's minutes and deliver nothing. Measured,
 * crf 28 never did this, but "measured never" is not "cannot", and the refusal
 * below is what makes the difference visible instead of silent.
 */
export function didNotHelp(sourceBytes: number, resultBytes: number): boolean {
  return resultBytes >= sourceBytes
}

/** Bytes as the page prints them: KB below a megabyte, MB above it. */
export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * What a visitor is told when compression does not end in a file to send.
 *
 * Every one of these **refuses**. Ticket 02 offers a canvas re-encode and a
 * link-paste path as alternatives and leaves the choice to the map's fog; the one
 * thing this step may not do is quietly send the original, because that is how an
 * uncompressed file reaches a pipeline that is not sized for one. So each message
 * says plainly that nothing was sent, and what to do instead.
 */
export const COMPRESSION_MESSAGES = {
  failed:
    "Compression could not finish, so nothing was sent. Try a shorter Demo, or try again.",
  cancelled: "Compression was stopped, so nothing was sent.",
  noGain:
    "Compression did not make this file smaller, so nothing was sent. Trim the Demo and try again.",
} as const

/**
 * Shown before the wait rather than during it, because a visitor who meets a
 * silent page assumes it has died.
 *
 * The figure is measured rather than estimated. Ticket 02 extrapolated "minutes,
 * not seconds" from the single-threaded core; measured in headless Chrome on this
 * machine (2026-09-25), a 4.46 MB 1080p clip took **21.3 seconds** and a 475 KB
 * clip 4.5 seconds, excluding the core's first download. A mid-range phone is
 * slower again, which is why the sentence names a phone rather than the laptop the
 * number came from. Whether the wait is acceptable is still the map's fog; this
 * sentence does not settle it, it tells the truth about what is happening.
 */
export const COMPRESSION_NOTICE =
  "Compressing in this browser. On a phone this can take a minute or two, and your file is not sent until it finishes."
