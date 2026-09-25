"use client"

// lib/demo-compression-runner.ts
//
// The impure half of the compression step: it fetches the WASM core, drives it,
// and reports progress. Everything a test can pin without a browser lives in
// `lib/demo-compression.ts`; this file owns the parts that only exist at runtime.
//
// **When the 10.18 MB core is fetched.** Not on page load and not on a catalogue
// visit: only when `compressDemo` is called, which the form does when a visitor
// picks a Demo that passed the size check. Both halves are lazy, and both are
// what the acceptance means by it:
//
//   * `@ffmpeg/ffmpeg` and `@ffmpeg/util` are `await import`ed inside the
//     function, so their glue is a separate chunk fetched on the same event.
//   * The core `.js` and `.wasm` are fetched from `FFMPEG_CORE_BASE` and rewrapped
//     as same-origin blob URLs, because the worker cannot import cross-origin. It
//     is `blobUrlFor` below rather than `@ffmpeg/util`'s `toBlobURL`, and that
//     function's comment records the measured failure that decided it.
//
// The blob URLs are cached at module scope, so a visitor who tries a second file
// does not download the core again; the HTTP cache would serve it anyway
// (jsDelivr sends `immutable` for a year), but the rewrap is skipped too.
//
// The `FFmpeg` instance is deliberately **not** cached. Cancel works by
// terminating it, and a terminated instance cannot be reused, so one instance per
// attempt is what keeps cancel from poisoning the next try.
//
// public-submissions ticket 06.
import {
  buildCompressArgs,
  COMPRESSION_MESSAGES,
  COMPRESSION_OUTPUT_NAME,
  didNotHelp,
  FFMPEG_CORE_BASE,
  memfsInputName,
} from "@/lib/demo-compression"

/** What the visitor's browser is being asked to do, in the order it happens. */
export type CompressionPhase = "downloading" | "compressing"

export type CompressionResult =
  | { ok: true; blob: Blob; bytes: number }
  | { ok: false; message: string }

type FFmpegInstance = InstanceType<(typeof import("@ffmpeg/ffmpeg"))["FFmpeg"]>

let coreParts: Promise<{ coreURL: string; wasmURL: string }> | null = null

/**
 * Fetch a core part and rewrap it as a same-origin blob URL.
 *
 * NOT `@ffmpeg/util`'s `toBlobURL`, and the reason is measured rather than
 * stylistic. With `progress: true` that helper routes through
 * `downloadWithProgress`, which streams the body and then throws
 * `ERROR_INCOMPLETED_DOWNLOAD` whenever `Content-Length` disagrees with the bytes
 * it read. jsDelivr serves `ffmpeg-core.wasm` compressed (`vary: Accept-Encoding`)
 * with a 10.18 MB `Content-Length`, while the stream decodes to ~32 MB, so the two
 * numbers cannot agree. The throw lands in a `catch` that calls
 * `resp.arrayBuffer()` on the body the reader has already consumed, which fails as
 * `TypeError: Failed to execute 'arrayBuffer' on 'Response': body stream already
 * read` and surfaces in this app as `load()` never resolving: the form sat on
 * "LOADING THE COMPRESSOR" indefinitely with no error a visitor could act on.
 *
 * So the bytes are fetched plainly. The cost is that the download half of the wait
 * has no percentage to show, because a compressed response has no honest
 * decompressed total to divide by. The transcode half still reports a real one.
 * `resp.ok` is checked first, so a 404 or an offline visitor gets a sentence
 * instead of a hang.
 */
async function blobUrlFor(url: string, mimeType: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status} fetching ${url}`)
  }
  const bytes = await response.arrayBuffer()
  return URL.createObjectURL(new Blob([bytes], { type: mimeType }))
}

/**
 * The core as blob URLs, fetched once per session.
 *
 * A rejected promise is cleared rather than cached: a visitor on a flaky
 * connection should be able to pick the file again, and a cached rejection would
 * make every later attempt fail instantly without trying.
 */
function coreURLs(): Promise<{ coreURL: string; wasmURL: string }> {
  if (coreParts) return coreParts
  coreParts = (async () => {
    // The two parts are fetched together so the 10.18 MB `.wasm` overlaps the
    // smaller `.js` rather than following it.
    const [coreURL, wasmURL] = await Promise.all([
      blobUrlFor(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      blobUrlFor(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    ])
    return { coreURL, wasmURL }
  })().catch((err) => {
    coreParts = null
    throw err
  })
  return coreParts
}

/**
 * Compress one chosen file in the browser.
 *
 * Resolves to a refusal rather than throwing, because every failure here has a
 * sentence a visitor has to read and there is no programmatic recovery: the
 * acceptance's rule is that nothing is silently passed through.
 */
export async function compressDemo(
  file: File,
  opts: {
    onPhase?: (phase: CompressionPhase) => void
    onProgress?: (ratio: number) => void
    signal?: AbortSignal
  } = {}
): Promise<CompressionResult> {
  const { onPhase, onProgress, signal } = opts
  if (signal?.aborted) {
    return { ok: false, message: COMPRESSION_MESSAGES.cancelled }
  }

  let instance: FFmpegInstance | null = null
  // Terminating is the only way to stop a transcode already running in the
  // worker: the API has no cancel message.
  const onAbort = () => {
    try {
      instance?.terminate()
    } catch {
      // Already gone, which is the outcome this handler wanted.
    }
  }
  signal?.addEventListener("abort", onAbort, { once: true })

  try {
    const [{ FFmpeg }, { fetchFile }, urls] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
      coreURLs(),
    ])
    if (signal?.aborted) {
      return { ok: false, message: COMPRESSION_MESSAGES.cancelled }
    }

    instance = new FFmpeg()
    instance.on("progress", ({ progress }) => {
      if (!onProgress) return
      onProgress(Math.min(1, Math.max(0, progress)))
    })

    onPhase?.("downloading")
    await instance.load(urls)
    if (signal?.aborted) {
      return { ok: false, message: COMPRESSION_MESSAGES.cancelled }
    }

    onPhase?.("compressing")
    const inputName = memfsInputName(file.name)
    await instance.writeFile(inputName, await fetchFile(file))
    await instance.exec(buildCompressArgs(inputName, COMPRESSION_OUTPUT_NAME))

    const data = await instance.readFile(COMPRESSION_OUTPUT_NAME)
    // `readFile` is typed `Uint8Array | string`; the string arm cannot happen for
    // a binary target but the type says it can, so it is handled rather than cast.
    const bytes =
      data instanceof Uint8Array ? data : new TextEncoder().encode(String(data))

    if (didNotHelp(file.size, bytes.byteLength)) {
      return { ok: false, message: COMPRESSION_MESSAGES.noGain }
    }

    // `slice()` copies out of the WASM heap before it is detached. Without the
    // copy the blob would point at memory the instance frees when it is dropped.
    const copy = bytes.slice()
    return {
      ok: true,
      blob: new Blob([copy.buffer], { type: "video/mp4" }),
      bytes: copy.byteLength,
    }
  } catch (err) {
    if (signal?.aborted) {
      return { ok: false, message: COMPRESSION_MESSAGES.cancelled }
    }
    console.error("[compression] failed", err)
    return { ok: false, message: COMPRESSION_MESSAGES.failed }
  } finally {
    signal?.removeEventListener("abort", onAbort)
    instance?.terminate()
  }
}
