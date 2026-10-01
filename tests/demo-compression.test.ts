import { describe, expect, it } from "vitest"

import {
  buildCompressArgs,
  COMPRESSION_CRF,
  COMPRESSION_MESSAGES,
  COMPRESSION_NOTICE,
  COMPRESSION_OUTPUT_NAME,
  COMPRESSION_PRESET,
  didNotHelp,
  FFMPEG_CORE_BASE,
  formatSize,
  memfsInputName,
} from "../lib/demo-compression"

// public-submissions ticket 06. This file pins the parts of the compression step
// that decide what actually leaves the visitor's device, because none of them can
// be checked by looking at the page:
//
//   * the transcode arguments, which are the whole behaviour;
//   * that the value ticket 02 proved GROWS files is not the value in use;
//   * that every refusal refuses, rather than one of them quietly passing the
//     original through;
//   * that an invalid preset cannot ship, because a typo in it fails only in a
//     browser, minutes into a wait a visitor has already paid for.
//
// Deliberately not tested here: the transcode itself, which needs a real browser
// with the WASM core. That belongs in the manual pass the ticket's acceptance
// asks for.

const X264_PRESETS = new Set([
  "ultrafast",
  "superfast",
  "veryfast",
  "faster",
  "fast",
  "medium",
  "slow",
  "slower",
  "veryslow",
  "placebo",
])

/** CONTEXT.md `_Avoid_` for this feature. A form that says "upload" says the wrong thing. */
const AVOIDED_WORDS = ["upload", "video", "animation", "entry"]

describe("the retuned preset", () => {
  it("is not the published-Demo value that grew files", () => {
    // Ticket 02: `crf 20` grew a 4.46 MB input to 4.52 MB and a 235.0 KB Demo to
    // 246.1 KB. Reusing it here would spend a visitor's minutes and hand back a
    // larger file.
    expect(COMPRESSION_CRF).not.toBe(20)
    expect(COMPRESSION_CRF).toBeGreaterThan(20)
  })

  it("names a preset x264 actually accepts", () => {
    expect(X264_PRESETS.has(COMPRESSION_PRESET)).toBe(true)
  })
})

describe("buildCompressArgs", () => {
  const args = buildCompressArgs("in.mov")

  it("maps 1:1 onto compress-demo.sh, minus ffprobe", () => {
    expect(args).toEqual([
      "-i",
      "in.mov",
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
      COMPRESSION_OUTPUT_NAME,
    ])
  })

  it("keeps the three flags that make the output playable in a browser", () => {
    // yuv420p because Chrome refuses yuv444; the even-dimension scale because
    // x264 aborts on odd heights; faststart so the CDN can stream frame one.
    expect(args.join(" ")).toContain("yuv420p")
    expect(args).toContain("scale=trunc(iw/2)*2:trunc(ih/2)*2")
    expect(args).toContain("+faststart")
  })

  it("writes where the reader expects to read", () => {
    expect(args[args.length - 1]).toBe(COMPRESSION_OUTPUT_NAME)
  })
})

describe("memfsInputName", () => {
  it("keeps a recognisable extension and drops the visitor's name", () => {
    // The name goes into an argument array, so nothing from a stranger is
    // interpolated beyond a sanitised extension.
    expect(memfsInputName("IMG_1234.MOV")).toBe("in.mov")
    expect(memfsInputName("../../etc/passwd.mp4")).toBe("in.mp4")
    expect(memfsInputName("clip with spaces.mp4")).toBe("in.mp4")
  })

  it("falls back to mp4 when there is no usable extension", () => {
    expect(memfsInputName("recording")).toBe("in.mp4")
    expect(memfsInputName("clip.")).toBe("in.mp4")
  })

  it("can only ever produce a name made of safe characters", () => {
    // With the extension as the only part taken from the visitor, and no shell
    // between the argument array and ffmpeg, this is the whole injection surface.
    // `movie.<script>` becomes `in.scrip`, which is a nonsense extension rather
    // than a payload: ffmpeg probes an input's container by content, so the name
    // it is written under does not decide what it is read as.
    for (const name of [
      "movie.<script>",
      "../../etc/passwd.mp4",
      "a b;rm -rf /.mp4",
      'quote".mp4',
      "newline\n.mp4",
    ]) {
      const result = memfsInputName(name)
      expect(result).toMatch(/^in\.[a-z0-9]*$/)
      expect(result).not.toContain("/")
      expect(result).not.toContain("..")
    }
    expect(memfsInputName("movie.<script>")).toBe("in.scrip")
  })

  it("truncates an absurd extension", () => {
    expect(memfsInputName("clip.verylongextension")).toBe("in.veryl")
  })
})

describe("didNotHelp", () => {
  it("refuses a transcode that did not shrink the file", () => {
    expect(didNotHelp(1000, 1000)).toBe(true)
    expect(didNotHelp(1000, 1001)).toBe(true)
  })

  it("accepts a smaller one, which is the only outcome worth sending", () => {
    expect(didNotHelp(1468006, 1510000 - 200000)).toBe(false)
  })
})

describe("formatSize", () => {
  it("switches to MB at a megabyte", () => {
    expect(formatSize(235_000)).toBe("229.5 KB")
    expect(formatSize(1024 * 1024)).toBe("1.00 MB")
    expect(formatSize(1_510_000)).toBe("1.44 MB")
  })
})

describe("the refusals", () => {
  it("every one of them says nothing was sent", () => {
    // This is the acceptance's "never a silent pass-through of the raw file",
    // stated as a property: a visitor reading any of these must not be left
    // wondering whether their original was sent instead.
    for (const message of Object.values(COMPRESSION_MESSAGES)) {
      expect(message).toContain("nothing was sent")
    }
  })

  it("keeps the avoided vocabulary out of what a visitor reads", () => {
    for (const text of [
      ...Object.values(COMPRESSION_MESSAGES),
      COMPRESSION_NOTICE,
    ]) {
      const lower = text.toLowerCase()
      for (const word of AVOIDED_WORDS) {
        expect(lower).not.toContain(word)
      }
    }
  })

  it("does not promise a size, which ticket 02 proved it cannot do", () => {
    // The notice may warn about time. It may not say "smaller in a moment" or
    // name a target, because output size is a function of content.
    expect(COMPRESSION_NOTICE).not.toMatch(/\b\d+\s*(MB|KB)\b/)
  })
})

describe("FFMPEG_CORE_BASE", () => {
  it("is pinned to an exact version and is a source that sends ACAO", () => {
    // jsDelivr, not cdn.rnui.dev: the bucket serves no `Access-Control-Allow-Origin`
    // (measured), and `toBlobURL`'s fetch is subject to CORS. Pinning the version
    // is what makes the bytes immutable.
    expect(FFMPEG_CORE_BASE).toContain("@ffmpeg/core@0.12.10")
    expect(FFMPEG_CORE_BASE.startsWith("https://cdn.jsdelivr.net/npm/")).toBe(
      true
    )
    expect(FFMPEG_CORE_BASE).not.toContain("cdn.rnui.dev")
  })
})
