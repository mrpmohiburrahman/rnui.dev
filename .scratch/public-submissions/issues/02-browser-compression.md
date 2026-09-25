# Can the browser compress a Demo for free?

Status: resolved
Type: research

## Question

Map decision 4 puts the compression step in the browser, because that is the only place it is
free (see the map's CPU table). Nothing in this repo has ever done it. Establish whether the
step is real *before* ticket 06 is built on it.

Deliver `research/browser-compression.md`, every claim citing its source. Do not redo
`research/r2-presigned-uploads.md` — that answers upload, not compression.

1. **Which build, and what does it cost the visitor?** `ffmpeg.wasm` ships a single-threaded
   core and a multi-threaded one needing `SharedArrayBuffer`, which needs
   `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`
   on every response. Give the gzipped bytes a visitor downloads for each, and say plainly
   whether those headers are compatible with **this site as it is** — the fonts, PostHog and
   the CDN are the things to check.

2. **What transcode settings reproduce `compress-demo.sh`?** That script is H.264, `crf 20`,
   `preset slow`, `yuv420p`, `scale=trunc(iw/2)*2:trunc(ih/2)*2`, `+faststart`, AAC 128k.
   Give the `ffmpeg.wasm` invocation that matches, and name which of those have no equivalent
   in the WASM build.

3. **What does 5 MB in produce?** Worst realistic cases: a 5 MB 1080p phone export, and a
   5 MB 1080p simulator capture. State expected output size and compression time on a
   mid-range laptop and a mid-range phone. **If a 5 MB input cannot be relied on to land
   under 1 MB, say so** — decision 4's whole premise is that it does.

4. **Does it hold on iOS Safari?** Submitters are React Native developers, so a phone is
   likely. State whether `ffmpeg.wasm` works there, the memory ceiling, and whether a tab
   crash is a realistic failure mode.

5. **What is the fallback when it fails?** A `MediaRecorder` + canvas re-encode, a "please
   trim it yourself" refusal, or a link-paste path. Recommend one. The map's *Not yet
   specified* already carries the link-paste question, so do not settle it here.

6. **Where is the WASM served from?** A public CDN (jsDelivr/unpkg), or `cdn.rnui.dev` — the
   R2 bucket this repo already owns, whose objects are served `immutable` for a year
   (`docs/r2-setup.md`). Say which is lower-risk and why.

## Acceptance

`research/browser-compression.md` exists; every claim carries its source URL; question 3
states a measured or documented output size rather than an estimate; the file ends with a
one-paragraph verdict on whether map decision 4 should stand.

## Answer

Resolved 2026-09-25. Full findings, every claim sourced, in
[`../research/browser-compression.md`](../research/browser-compression.md).

**Yes, the compression step is real. No, it cannot promise a size.** Both halves matter.

- **Build:** the single-threaded `@ffmpeg/core@0.12.10` — **10.18 MB gzipped**, no special headers,
  works on the site as it stands. `core-mt` is the same size but needs `Cross-Origin-Opener-Policy`
  and `Cross-Origin-Embedder-Policy: require-corp`, and `cdn.rnui.dev` serves every Demo with **no
  CORP and no ACAO header** — so enabling those would break the entire catalogue's media to speed up
  one visitor's step. Measured, not assumed. Now recorded in the map's *Out of scope*.
- **Settings:** the transcode args map 1:1 onto `compress-demo.sh` **except** its `ffprobe` check.
- **The decisive finding:** run with the repo's own settings, **two 5 MB inputs grew** — to 7.64 MB
  and 9.76 MB. `crf 20` sets *quality*, not size, and it is tuned for visually-lossless published
  Demos, which is the opposite of what an intake step wants. UI-shaped footage returned 66–82 KB.
  Output size is a function of content, not of the setting.
- **Timing:** extrapolates to **minutes, not seconds** on the single-threaded core.
- **iOS Safari:** covered in the research file. The multi-threaded build carries open OOM and Safari
  issues and pins 1 GB across 32 workers.

**Consequences, applied to the map:** decision 4 was amended — compression stays in the browser, but
the promise is *a smaller file* and never a size target. Ticket 06 is rewritten to match. Two fog
entries were opened: the minutes-long wait, and whether the default preset should aim at size rather
than fidelity.
