# The browser compression step

Status: ready-for-agent
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
