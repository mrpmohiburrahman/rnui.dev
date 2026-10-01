# The browser compression step

Status: ready-for-human
Type: task
Blocked by: 02, 05

## Question

Wire ticket 02's **single-threaded** `@ffmpeg/core` build into the `/submit` form, between the 5 MB
check and the upload (map decision 4). A visitor's ≤5 MB file becomes a smaller H.264 file, and only
that file leaves their device.

**Ticket 02 is resolved — read its `## Answer` before starting.** Three of its findings bind this
ticket:

- **Do not use `core-mt`.** It needs COOP/COEP, and `cdn.rnui.dev` serves every Demo with no CORP and
  no ACAO, so enabling those would break the catalogue. The map's *Out of scope* records it.
- **Do not promise a size.** `compress-demo.sh`'s CRF 20 **grew** two 5 MB inputs to 7.64 MB and
  9.76 MB, because CRF sets quality rather than size. UI-shaped footage came back at 66–82 KB.
- **Expect minutes, not seconds.** Whether that wait is acceptable to a real submitter is open fog.
  **Do not settle it here**, and do not add a link-paste escape hatch on your own initiative.

## Acceptance

- A visitor's chosen file is compressed in the browser and the **compressed** bytes are what
  the submit endpoint receives. Nothing else reaches the network.
- Progress is visible while compressing and the visitor can cancel. **Ticket 02 measured this in
  minutes, not seconds**, so warn the visitor before it starts and make the UI survive the wait
  without looking hung. A visitor who thinks the page has died has abandoned the submission.
- The output is a browser-decodable H.264 file: `yuv420p`, even dimensions, faststart. The transcode
  args map 1:1 onto `compress-demo.sh` **except its `ffprobe` check**, which has no WASM equivalent —
  record that divergence in a comment at the call site rather than leaving it to be discovered.
- **The preset is retuned away from `crf 20`.** Ticket 02 proved that value *grows* files: it is
  tuned for visually-lossless *published* Demos, and this step's job is the opposite. Choose a value
  that aims at size, and record in a comment what it was chosen against and which footage was
  measured.
- The visitor can see the before and after size before submitting.
- Failure is handled explicitly, per ticket 02's fallback options — never a silent pass-through of
  the raw file, because that is how an uncompressed upload reaches the pipeline. Which fallback wins
  is the map's fog, not this ticket's call: implement the one that **refuses**, not one that invents
  a second submission mode.
- The WASM payload is not shipped to every visitor of the catalogue. State in a comment how it
  is loaded (lazy, on file selection) and where it is served from.
- `pnpm check-types`, `pnpm lint`, `pnpm test` all exit 0, and a manual run in Chrome and in
  iOS Safari is recorded under `## Comments` — including the compression time observed.

## Answer

`ready-for-human`, and the reason is one bullet: **the last acceptance line asks for a manual run in
Chrome *and* in iOS Safari, and iOS Safari is not done.** Everything else is built and measured. What
is done by machine is recorded below rather than claimed.

### What was built

| File | What it is |
| --- | --- |
| `lib/demo-compression.ts` | the arguments, the MEMFS names, the refusal sentences, the figures |
| `lib/demo-compression-runner.ts` | the fetch of the core, the transcode, progress, cancel |
| `app/submit/page.tsx` | the step between the size check and the widget, before/after sizes, CANCEL |
| `tests/demo-compression.test.ts` | 16 cases |

### The bug that would have shipped, and it was not in this repo

The first browser run hung. Both a 4.46 MB 1080p clip and a 475 KB clip sat on `LOADING THE
COMPRESSOR` with no error and no progress, and the renderer dropped to ~5% CPU, which is a hang
rather than slowness. The cause, from the page's own console:

```
console.log: failed to send download progress event: Error: failed to complete download
console.error: [compression] failed TypeError: Failed to execute 'arrayBuffer' on 'Response':
  body stream already read
```

`@ffmpeg/util`'s `toBlobURL(url, mime, progress, cb)` routes through `downloadWithProgress`, which
streams the body and then throws `ERROR_INCOMPLETED_DOWNLOAD` whenever `Content-Length` disagrees with
the bytes it read. jsDelivr serves `ffmpeg-core.wasm` compressed (`vary: Accept-Encoding`) with a
**10.18 MB `Content-Length`** while the stream decodes to **~32 MB**, so the two numbers cannot agree.
The throw lands in a `catch` that calls `resp.arrayBuffer()` on the body the reader already consumed,
which is the `TypeError` above. `load()` then never resolves.

So the progress *callback* is what broke it, and using it is what a straightforward reading of the
library's own example tells you to do. The fix is `blobUrlFor` in the runner: a plain `fetch` plus
`arrayBuffer`, with `resp.ok` checked so a 404 or an offline visitor gets a sentence instead of a
hang. The cost is that the download half of the wait has no percentage, because a compressed response
has no honest decompressed total to divide by; the transcode half still reports a real one, from
ffmpeg's own progress event.

### The preset, retuned and measured

Same method as ticket 02, local ffmpeg, arguments otherwise identical:

| input | settings | output |
| --- | --- | --- |
| 1080p high-motion, 4.46 MB | `crf 20 / slow` (the published-Demo values) | **4.52 MB, grew** |
| " | `crf 26 / veryfast` | 2.03 MB |
| " | **`crf 28 / veryfast` (in use)** | **1.44 MB, -68%** |
| " | `crf 30 / veryfast` | 1.12 MB |
| a real published Demo, 436x930, 235.0 KB | `crf 20 / slow` | 246.1 KB, grew |
| " | **`crf 28 / veryfast` (in use)** | **102.1 KB, -57%** |

`crf 28` never grew anything measured, which matters because this step must not send a larger file
than the visitor chose. `crf 30` is the next step down if review legibility proves more than enough.

### In a real browser, headless Chrome

```
catalogue page:                compressor requests = 0
/submit on load:               compressor requests = 0
before a file:                 submit disabled = true, turnstile containers = 0
input:                         /tmp/rnui-test-submission.mp4 (0.46 MB)
phases:                        LOADING THE COMPRESSOR -> COMPRESSING
elapsed:                       4.5s
requests after choosing a file: 2   (ffmpeg-core.js, ffmpeg-core.wasm)
result:                        Ready to send 200.5 KB, down from 475.4 KB.
after the transcode:           submit disabled = true
after the transcode:           cloudflare loader scripts = 1
```

That answers four acceptance bullets on evidence rather than intent: the WASM is not shipped to
catalogue visitors (**0 requests until a file is chosen**, measured as requests rather than by
grepping chunk names, which is inconclusive because this feature's own code uses the same identifiers
as the library it loads); progress and a cancel control exist; the before-and-after sizes are on
screen before Submit is reachable; and **the widget mounts only after the transcode**, which is the
ordering that keeps a 300-second token alive.

Submit stays `disabled` in both reads, because no token exists: this sandbox cannot resolve
`challenges.cloudflare.com`, so the challenge itself cannot render here. That path is proven on the
deployed preview instead, where a real token traversed the route and a Submission landed.

### What is still open, and who has it

**iOS Safari, which is the whole of what is left on this ticket.** Submitters are React Native
developers, so a phone is likely and the research file covers the memory ceiling as a real risk. It
cannot be tested from here: no iOS WebKit, and Playwright's WebKit is not iOS Safari. Open
`/submit` in Safari on a phone, choose a Demo, and record the time and whether the tab survives.

**The waiting-UX fog is much smaller than the map feared, and this run is why.** The same 4.46 MB
1080p clip that took 4.5s at 475 KB took **21.3 seconds** here, producing **1.43 MB, down from
4.46 MB**, which reproduces the local ffmpeg figure of 1.44 MB to within a percent. Ticket 02
predicted "minutes, not seconds" from an extrapolation; measured, it is tens of seconds on a laptop.
So the map's waiting-UX entry should be revisited with this number rather than the estimate, and a
mid-range phone is the case this machine still cannot speak for.

Two things that estimate did not account for, both worth recording because they inflate any
perception of slowness: the first run of every session also downloads the 10.18 MB core, and the run
above was measured *after* that download in the earlier 475 KB pass on the same server.

**A second finding, recorded rather than fixed.** `didNotHelp` refuses only when the output is at
least as large as the input. A file that compresses poorly but still helps slightly can therefore
produce a multipart body close to the visitor's 5 MB, and Vercel rejects a body over **4.5 MB** before
the route handler runs. Measured, crf 28 removed 68% from the worst case and 57% from real UI footage,
so the gap is wide; but a second size threshold is a decision, and inventing one here is what the map
forbids. If it is wanted, it belongs in the map first.

### Gates

`pnpm check-types` 0, `pnpm lint` 0, `pnpm test` 26 files / 471 passing, `pnpm build` OK.
