# Can a browser compress a Demo for free? (ffmpeg.wasm, primary sources)

## Question

Map decision 4 puts the compression step in the browser, because that is the only free place to
transcode — Cloudflare Workers get 10 ms of CPU per request and Vercel Hobby gives 4 CPU-hours a
month total (map.md, "The five limits"). Nothing in this repo has ever done it. This file answers the
ticket's six questions: which ffmpeg.wasm build and what it costs the visitor; the settings that
reproduce `scripts/compress-demo.sh`; what a 5 MB input actually produces; whether it holds on iOS
Safari; the fallback; and where the WASM should be served from.

Every claim carries its source URL. Figures labelled **measured** were taken on 2026-09-25 on this
machine (macOS arm64, native ffmpeg 8.1.1, Node v22.13.1) and say so in the text. Anything a primary
source does not settle is marked **unconfirmed** rather than guessed.

The size measurements in §3 use *native* ffmpeg, not ffmpeg.wasm: ffmpeg.wasm is FFmpeg n5.1.4
compiled to WASM (<https://ffmpegwasm.netlify.app/docs/overview>), so output sizes transfer, while
speeds do not — §3 converts times using the project's own documented WASM/native ratio.

### 1. Which build, and what does it cost the visitor?

Two cores ship: "single-thread ( @ffmpeg/core ) and multi-thread version ( @ffmpeg/core-mt ) cores, you
can build your own core (ex. a core with x264 lib only to minimize ffmpeg-core.wasm file size)"
(<https://ffmpegwasm.netlify.app/docs/overview>). Payload, from the published artifacts:

| Package | Latest | npm `unpackedSize` | `ffmpeg-core.wasm` gzip-9 **(measured)** | `ffmpeg-core.js` gzip-9 **(measured)** | Headers required |
| --- | --- | --- | --- | --- | --- |
| `@ffmpeg/ffmpeg` | 0.12.15 (2025-01-07) | 71,999 B | — | — | none |
| `@ffmpeg/util` | 0.12.2 (2025-01-07) | 19,852 B | — | — | none |
| `@ffmpeg/core` (**single-thread**) | 0.12.10 (2025-01-07) | 64,689,644 B | **10,184,913 B** | 29,515 B | none |
| `@ffmpeg/core-mt` (**multi-thread**) | 0.12.10 (2025-04-28) | 65,700,111 B | **10,231,143 B** | 33,502 B | COOP + COEP |

npm figures: <https://registry.npmjs.org/@ffmpeg/core>, <https://registry.npmjs.org/@ffmpeg/core-mt>,
<https://registry.npmjs.org/@ffmpeg/ffmpeg>, <https://registry.npmjs.org/@ffmpeg/util> (each fetched
2026-09-25). gzip figures measured via
`curl -sL https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm | gzip -9 -c | wc -c`
and the same URL with `core-mt`. The docs' own load button says "Load ffmpeg-core (~31 MB)"
(<https://ffmpegwasm.netlify.app/docs/getting-started/usage>) — that is the *uncompressed* wasm; ~10.2 MB
is what a visitor actually downloads from a compressing CDN.

Cost to the visitor: ~10.2 MB of download plus minutes of CPU (§3), to compress a file whose published
peers average 25–83 KB (map.md, "Research that must not be lost").

**The multi-thread core's header requirement.** SharedArrayBuffer is the gate: "SharedArrayBuffer is
not defined unless its security requirements are met"
(<https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer>),
and those requirements are exactly the two headers: "A document will be cross-origin isolated if it is
returned with an HTTP response that includes the headers: Cross-Origin-Opener-Policy header with the
directive `same-origin` [and] Cross-Origin-Embedder-Policy header with the directive `require-corp` or
`credentialless`" (<https://developer.mozilla.org/en-US/docs/Web/API/Window/crossOriginIsolated>).
Safari and iOS Safari have had SharedArrayBuffer since **15.2**, "disabled by default" from 10.1/10.3 to
15.1 (<https://caniuse.com/sharedarraybuffer>).

**Are those headers compatible with this site as it is? No — not without work on the CDN.**

- **Fonts — fine.** Both families are self-hosted at build time: `import { JetBrains_Mono, Space_Grotesk }
  from "next/font/google"` (`app/layout.tsx:6`), and the same file records "no third-party font CDN hop,
  so no preconnect for them" (`app/layout.tsx:30`). Same-origin, so `require-corp` does not touch them.
- **PostHog — risky, and partly unconfirmed.** `posthog-js` is imported from npm and initialised with
  `api_host: "https://us.i.posthog.com"` (`lib/posthog-provider.tsx:5,25`). **Measured 2026-09-25:**
  `https://us-assets.i.posthog.com/static/array.js` returns `access-control-allow-origin: *` but **no**
  `Cross-Origin-Resource-Policy` header, and under `require-corp` a document "can only load resources
  requested in no-cors mode from the same origin, or resources that have explicitly set the
  Cross-Origin-Resource-Policy header to a value that allows it to be embedded"
  (<https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy>).
  Whether `posthog-js` loads any such no-cors subresource (surveys / session replay do fetch remote
  scripts) is **unconfirmed** — it needs checking against posthog-js's own loader, not a guess.
- **`cdn.rnui.dev` — this breaks.** Demos and Posters are `<video>`/`<img>` subresources, i.e. no-cors
  requests. **Measured 2026-09-25:** `curl -sI https://cdn.rnui.dev/robots.txt` (a 200) sends
  `content-type`, `server: cloudflare`, `cf-cache-status`, and **no** CORP header — and **no**
  `Access-Control-Allow-Origin` even when sent `Origin: https://rnui.dev`. `docs/r2-setup.md:17` records
  the only header the bucket sets: "`Cache-Control: public, max-age=31536000, immutable`, plus
  `video/mp4` or `image/avif`". So `require-corp` would block every Demo on every catalogue page until a
  header were added at the edge (a Cloudflare response-header transform rule, or a Worker in front of the
  bucket) — **unconfirmed** for this zone, and a site-wide change made only to enable a compression step.

Plainly: the **single-thread core needs no headers and works on the site as it is**; the **multi-thread
core is not compatible with the site as it is**. One further constraint: because `@ffmpeg/ffmpeg` "spawns
a web worker, you cannot import @ffmpeg/ffmpeg from CDN like jsdelivr. It is recommended to download it
and host it on your server most of the time"
(<https://ffmpegwasm.netlify.app/docs/getting-started/installation>).

### 2. What transcode settings reproduce `compress-demo.sh`?

`scripts/compress-demo.sh` is `-c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p
-vf scale=trunc(iw/2)*2:trunc(ih/2)*2 -movflags +faststart -c:a aac -b:a 128k`, then it verifies the
output's codec with `ffprobe` (lines 44–57). The WASM equivalent is the same argument vector handed to
`ffmpeg.exec()`, after the bytes are written into the core's in-memory file system:

```ts
const ffmpeg = new FFmpeg()
await ffmpeg.load({
  coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
  wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
})
await ffmpeg.writeFile('input.mp4', await fetchFile(file))   // whole file into MEMFS
await ffmpeg.exec(['-y', '-v', 'error', '-i', 'input.mp4',
  '-c:v', 'libx264', '-crf', '20', '-preset', 'slow',
  '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
  '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '128k', 'output.mp4'])
const data = await ffmpeg.readFile('output.mp4')
```

(`load`/`exec`/`writeFile`/`readFile` shapes, and `toBlobURL` "used to bypass CORS issue":
<https://ffmpegwasm.netlify.app/docs/getting-started/usage>.)

| Script flag | Equivalent in the WASM build | Evidence |
| --- | --- | --- |
| `-c:v libx264` | Yes — x264 0.164.x is a build dependency | <https://ffmpegwasm.netlify.app/docs/overview> |
| `-crf 20`, `-preset slow` | Yes — libx264 runtime options; a preset is not a build-time choice | <https://ffmpeg.org/ffmpeg-codecs.html> (libx264 options) |
| `-pix_fmt yuv420p` | Yes — pixel-format selection is generic | <https://ffmpegwasm.netlify.app/docs/getting-started/usage> |
| `-movflags +faststart` | Yes — an mp4 muxer option; `.mp4` output is the documented example | <https://ffmpegwasm.netlify.app/docs/getting-started/usage> |
| `-c:a aac -b:a 128k` | Yes — FFmpeg's own `aac` encoder, documented | <https://ffmpeg.org/ffmpeg-codecs.html> (§8.1 aac) |
| `-vf scale=…` | **Unconfirmed** — the core is built with filters (docs examples use `-filter_complex`), but I could not read a filter list naming `scale` | <https://ffmpegwasm.netlify.app/docs/getting-started/usage>, <https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/build/ffmpeg-wasm.sh> |
| the `ffprobe` codec check (lines 53–57) | **No.** The build compiles `src/fftools/ffprobe.c` into the core, but the documented API exposes only `ffmpeg.exec`; whether a callable ffprobe entry point is exported is **unconfirmed** | build file above; <https://ffmpegwasm.netlify.app/docs/getting-started/usage> |

Two build facts change the *cost* of those flags, both read from the build scripts: x264 is compiled
`--disable-asm` (no assembly) and, for the single-thread core, `--disable-thread`
(<https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/build/x264.sh>); and the core itself is built
`-sENVIRONMENT=worker`, with `-sINITIAL_MEMORY=32MB -sALLOW_MEMORY_GROWTH` for the single-thread build
versus `-sINITIAL_MEMORY=1024MB -sPTHREAD_POOL_SIZE=32` for the multi-thread build
(<https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/build/ffmpeg-wasm.sh>). Because the input must be
written to MEMFS in full, a 5 MB Demo is added to the core's own footprint before a frame is decoded
(<https://ffmpegwasm.netlify.app/docs/getting-started/usage>).

### 3. What does 5 MB in produce? (measured)

Method: inputs were built with native ffmpeg to be the cases the ticket names, then run through **this
repo's own `scripts/compress-demo.sh` verbatim** — the flags are not an approximation.

| Case | Input | Output | Ratio | Native wall time |
| --- | --- | --- | --- | --- |
| 5 MB phone-export-like: 1080p30, 12 s, 3.3 Mbps + AAC, high-detail content | 5,148,604 B | **7,639,479 B** | **1.48×** | 7.34 s |
| 5 MB worst case beyond a real simulator capture: 1080p30, 12 s, 3.3 Mbps + AAC, noisy content | 5,138,877 B | **9,758,622 B** | **1.90×** | 11.25 s |
| Flat UI + one moving block (what a simulator capture actually contains), 1080p30, 4 s, 9.5 Mbps + AAC | 85,860 B | 82,491 B | 0.96× | 1.18 s |
| Flat UI, looping moving block, 1080p30, 17 s, 2.2 Mbps | 77,185 B | 66,392 B | 0.86× | 3.92 s |

Honesty note on these rows: rows 1–2 are the two halves of "5 MB in", and row 1 is the realistic
phone export. Row 2 is deliberately *worse* than a real simulator capture — a simulator recording of a
UI is flat and low-detail, which is what rows 3–4 represent — so row 2 shows the mechanism (crf cannot
shrink high-entropy content) rather than a claim about every simulator capture.

Both 5 MB inputs were generated with
`ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=30:d=12 -f lavfi -i sine=frequency=440:duration=12
-c:v libx264 -preset veryfast -b:v 3.3M -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart`
(lavfi synthetic sources; the noisy case adds `-vf noise=alls=30:allf=t+u`), then transcoded by
`compress-demo.sh`. Byte counts read with `stat -f%z`, wall times with Python `time.time()` around the
script invocation. These are FFmpeg n5.1.4-identical settings; only the *speed* differs from WASM
(<https://ffmpegwasm.netlify.app/docs/overview>).

**No. A 5 MB input cannot be relied on to land under 1 MB — it cannot be relied on to get smaller at
all.** Two of the four inputs **grew**, by 1.48× and 1.90×. `crf 20` is a constant-quality target, not a
size target: FFmpeg's libx264 options list `crf` beside `-b`/`-maxrate`, and it is the bitrate options
that bound bytes (<https://ffmpeg.org/ffmpeg-codecs.html>). Nothing in `compress-demo.sh` caps bytes, so
5 MB in is not an upper bound on bytes out — **map decision 4's premise is false as written**, and a
visitor who picks a 5 MB file can be handed a *larger* file by the compression step.

The counterweight, and why this is not simply fatal: the only Demos this catalogue has published average
**25–83 KB** for 2–28 s clips (map.md, sampled from `cdn.rnui.dev`). Real React Native UI footage is flat
and low-motion; the two UI-shaped cases above returned 66–82 KB at 1080p30, i.e. 12–15× under 1 MB *and*
smaller than their inputs. The failure is a property of **content**, not of the 5 MB number: `crf 20` is
trustworthy on UI footage and untrustworthy on camera/noise footage. Note the corollary: 5 MB of UI
footage cannot exist at these bitrates — 4 s of flat UI at 9.5 Mbps is 86 KB — so a 5 MB UI capture is
minutes of video, not the "2–28 s" the catalogue holds.

**Timing (extrapolation, explicitly not measurement).** The project's own benchmark on an 8× i5-1135G7 in
Chrome 116: native ffmpeg averages 5.2 s for `ffmpeg -i input.webm output.mp4`, single-thread ffmpeg.wasm
128.8 s (**0.04×** native), multi-thread 60.4 s (**0.08×**)
(<https://ffmpegwasm.netlify.app/docs/performance>); its FAQ adds that the multi-thread version is "around
2x speed comparing to single thread (but consume a lot more memory and cpu)"
(<https://ffmpegwasm.netlify.app/docs/faq>). Applied to the 7.34 s native figure above:

| Device | Single-thread core | Multi-thread core |
| --- | --- | --- |
| Mid-range laptop (the benchmark's class) | **~3 min** | **~1.5 min** |
| Mid-range phone | several minutes (**unconfirmed**) | several minutes (**unconfirmed**) |

Both figures are optimistic rather than pessimistic: that benchmark ran a default-settings command, while
`-preset slow` is a heavier encode, and x264 in this build is compiled `--disable-asm`
(<https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/build/x264.sh>). The finding to carry is "minutes,
not seconds", for a file the catalogue would publish at ~60 KB.

### 4. Does it hold on iOS Safari?

Submitters are React Native developers, so a phone is likely, and iOS is where this is weakest.

| Fact | Value | Source |
| --- | --- | --- |
| SharedArrayBuffer in Safari / iOS Safari | **15.2+**; "disabled by default" 10.1–15.1 (iOS 10.3–15.1); unsupported before | <https://caniuse.com/sharedarraybuffer> |
| What the multi-thread core allocates up front | `-sINITIAL_MEMORY=1024MB` and `-sPTHREAD_POOL_SIZE=32`, and no `-sALLOW_MEMORY_GROWTH` | <https://github.com/ffmpegwasm/ffmpeg.wasm/blob/main/build/ffmpeg-wasm.sh> |
| What the single-thread core allocates | `-sINITIAL_MEMORY=32MB -sALLOW_MEMORY_GROWTH` | same file |
| Documented input ceiling | 2 GB, "a hard limit in WebAssembly" | <https://ffmpegwasm.netlify.app/docs/faq> |
| A reported iOS Safari crash | Issue #851 (open): "Safari on ios crashes when trying to operate with big files" — "Everything works fine on laptop (chrome, safari) but it's either stuck or crashes on mobile safari" | <https://github.com/ffmpegwasm/ffmpeg.wasm/issues/851> |
| OOM is live, not fixed | PR #948 (open, Sep 2026): "The multi-threaded core build pinned INITIAL_MEMORY=1024MB with no growth, so decoding a single high-resolution (e.g. 4K) frame aborted with `Aborted(OOM)`", proposing bounded growth to `MAXIMUM_MEMORY=2GB` | <https://github.com/ffmpegwasm/ffmpeg.wasm/pull/948> |

**Does it work there?** The single-thread core's preconditions are met from iOS 15.2 onward — it needs no
cross-origin isolation, and starting at 32 MB with growth is well inside what a phone tab can hold
(build flags above). The multi-thread core can *load* from 15.2, since SharedArrayBuffer exists
(<https://caniuse.com/sharedarraybuffer>). But nothing in any primary source shows a specific 5 MB file
transcoding successfully on a specific iPhone: that is **unconfirmed**, and can only be settled by a
device test. What *is* confirmed is that the library has an open iOS-Safari crash report and an open OOM
report, both still open as of 2026-09-25
(<https://github.com/ffmpegwasm/ffmpeg.wasm/issues/851>,
<https://github.com/ffmpegwasm/ffmpeg.wasm/pull/948>).

**Is a tab crash a realistic failure mode? Yes** — and it should be designed for rather than tested for.
The multi-thread build asks for 1 GB of WASM memory plus 32 workers *before* the first frame is decoded
(build flags above), and on top of that footprint the whole input sits in MEMFS (§2), so decode buffers
stack on the input's bytes. Mobile Safari's response to that pressure is the platform's own tab kill,
which page code cannot catch. The honest read: single-thread is the only plausible iOS path, a timeout
plus a "this browser could not compress the file" branch is mandatory, and the compression step must
never be the only way a file reaches the maintainer.

### 5. What is the fallback when it fails?

| Option | Verdict |
| --- | --- |
| `MediaRecorder` + canvas re-encode | **Reject.** It is real-time-bound (a 12 s clip takes ≥12 s), and its output type depends on the browser's supported containers/encoders rather than the H.264 / yuv420p / faststart contract `compress-demo.sh` and the catalogue depend on (<https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder>) |
| "Please trim it yourself" refusal | **Keep, but only where it fits**: an input already over the 5 MB cap (decision 3). Refusing a valid ≤5 MB file because *our* compressor failed shifts our problem onto the visitor |
| Link-paste path | Belongs to the map's *Not yet specified*; the ticket says not to settle it here. Not recommended as the failure path, because it changes what a Submission is |
| **Upload the original ≤5 MB file** | **Recommended.** Decision 3 caps the file the visitor picks, and decision 4 checks it *before* compression, so the bytes on hand are already bounded. §3 measured the case where the "compressed" output is *larger* than the input, so shipping the smaller of the two is a rule the evidence supports |

**Recommendation:** compress with the **single-thread** core under a hard timeout; upload **whichever of
input/output is smaller**; if `load()` or `exec()` fails, times out, or the tab dies, offer the original
file rather than a refusal. The only hard refusal is the >5 MB input, which is decision 3 doing its job.

### 6. Where is the WASM served from?

| | jsDelivr | `cdn.rnui.dev` (R2) | Same-origin (Next.js `public/`) |
| --- | --- | --- | --- |
| Measured headers, 2026-09-25 | `cache-control: public, max-age=31536000, s-maxage=31536000, immutable`, `cross-origin-resource-policy: cross-origin` on `…/@ffmpeg/core@0.12.10/dist/umd/ffmpeg-core.wasm` | no ACAO, no CORP seen on a 200 response | n/a — same origin needs neither |
| Cross-origin fetch of the wasm | Allowed (CORP present; docs' `toBlobURL` exists to "bypass CORS issue") | **Would fail CORS as configured** unless a bucket CORS rule is added (R2 documents bucket-level CORS) | Not needed |
| Availability risk | A third-party outage becomes a submit-path outage, for a pipeline whose constraint is £0 and no new vendors (decision 5) | Already owned, already on the site's critical path | Vercel serves it; a ~31 MB binary in the repo conflicts with the repo's rule that media is not committed (`CONTRIBUTING.md:22`) |
| Caching / immutability | immutable, 1 year, versioned path | `docs/r2-setup.md:17`: "`Cache-Control: public, max-age=31536000, immutable`", versioned key | Immutable via a versioned static path |

Sources for this table: measured `curl -sIL` against the two hosts (2026-09-25);
<https://ffmpegwasm.netlify.app/docs/getting-started/usage> (the `toBlobURL` note); `docs/r2-setup.md:17`
in this repo (bucket object metadata). R2's bucket-level CORS
mechanism is the same one the earlier R2 research cites
(<https://developers.cloudflare.com/r2/buckets/cors/>). Cloudflare's header-transform capability is
documented, but **unconfirmed** for this zone and is not needed unless the multi-thread core is chosen.

**Lower risk: `cdn.rnui.dev`, with a bucket CORS rule.** It is a vendor decision 5 already approved; it is
immutable for a year exactly as jsDelivr is; it removes the third party from the submit path; and for the
single-thread core its only transport requirement is `Access-Control-Allow-Origin`, which R2 bucket CORS
supplies. Serving the core same-origin is technically safest of all (no CORS, no COEP surface) but puts a
~31 MB build artifact into the repo, which this repo explicitly avoids for media (`CONTRIBUTING.md:22`).
Keep jsDelivr only as a pinned-version fallback, and remember that `@ffmpeg/ffmpeg` *itself* must be
self-hosted, because it spawns a worker
(<https://ffmpegwasm.netlify.app/docs/getting-started/installation>).

## Bottom line

**Map decision 4 should not stand as written.** Compression in the browser remains the only free place to
do it, and it does still work for the content this catalogue actually holds — but the decision's premise,
that a 5 MB input reliably lands under 1 MB, is measurably false: `crf 20` sets quality, not size, and two
deliberately-built 5 MB inputs came out at **7.64 MB** and **9.76 MB** through this repo's own script,
while only UI-shaped footage came back small (66–82 KB). Add the single-thread core's ~10.2 MB gzipped
download, minutes of CPU on a mid-range device, the multi-thread core's COOP/COEP requirement that would
break every Demo served `no-cors` from `cdn.rnui.dev`, and its fixed 1 GB up-front allocation sitting
behind two open Safari/OOM issues, and the step reads as a best-effort courtesy rather than a guarantee.
Keep the step, but specify it as: **single-thread core, served from `cdn.rnui.dev` with a bucket CORS
rule, hard timeout, upload whichever of input/output is smaller, fall back to the original file** — and
re-word decision 4 so it promises a *faster* file, not a smaller one.
